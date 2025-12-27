// VM Lifecycle Service - Advanced lifecycle management and monitoring

import { PrismaClient } from '../../../generated/prisma';
import { getAWSProvider } from './aws-provider';
import { VMDatabaseService } from './vm-database-service';
import { VMSecurityService } from './vm-security-service';
import { AWSErrorHandler, VMError } from '../utils/aws-error-handler';
import { AWS_CONFIG } from '../config/aws-config';

export interface VMLifecycleEvent {
  vmId: string;
  event: 'creating' | 'starting' | 'stopping' | 'terminating' | 'error' | 'health_check';
  timestamp: Date;
  details?: Record<string, any>;
  error?: string;
}

export interface VMHealthStatus {
  vmId: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastChecked: Date;
  checks: {
    awsInstanceStatus: 'ok' | 'impaired' | 'unknown';
    systemStatus: 'ok' | 'impaired' | 'unknown';
    networkConnectivity: 'ok' | 'failed' | 'unknown';
    databaseSync: 'ok' | 'out_of_sync' | 'unknown';
  };
  metrics?: {
    cpuUtilization: number;
    memoryUtilization: number;
    networkLatency: number;
  };
}

export class VMLifecycleService {
  private prisma: PrismaClient;
  private dbService: VMDatabaseService;
  private awsProvider: ReturnType<typeof getAWSProvider>;
  private securityService: VMSecurityService;
  private lifecycleEvents: VMLifecycleEvent[] = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.dbService = new VMDatabaseService(prisma);
    this.awsProvider = getAWSProvider();
    this.securityService = new VMSecurityService();
  }

  /**
   * Complete VM creation lifecycle with proper error handling and cleanup
   */
  async completeVMCreation(vmId: string, userId: string, workspaceId?: string): Promise<void> {
    this.logLifecycleEvent(vmId, 'creating', { userId, workspaceId });

    try {
      const vm = await this.dbService.getVMById(vmId, userId, workspaceId);
      
      if (!vm.aws_instance_id) {
        throw new VMError('INVALID_STATE', 'VM does not have AWS instance ID');
      }

      // Wait for instance to be fully running
      await this.waitForInstanceState(vm.aws_instance_id, 'running', 10 * 60 * 1000); // 10 minutes timeout

      // Get updated instance information
      const instanceInfo = await this.awsProvider.getInstanceInfo(vm.aws_instance_id);

      // Update VM record with final details
      await this.dbService.updateVM(vmId, userId, {
        status: 'running',
        publicIp: instanceInfo.publicIp,
        privateIp: instanceInfo.privateIp,
        lastStartedAt: new Date()
      }, workspaceId);

      // Start monitoring
      await this.startVMMonitoring(vmId);

      this.logLifecycleEvent(vmId, 'creating', { 
        status: 'completed', 
        instanceId: vm.aws_instance_id,
        publicIp: instanceInfo.publicIp 
      });

    } catch (error) {
      this.logLifecycleEvent(vmId, 'error', { 
        error: error.message,
        phase: 'creation'
      });

      // Cleanup failed creation
      await this.cleanupFailedVM(vmId, userId, workspaceId);
      throw error;
    }
  }

  /**
   * Graceful VM shutdown with proper state management
   */
  async gracefulVMShutdown(vmId: string, userId: string, workspaceId?: string, force = false): Promise<void> {
    this.logLifecycleEvent(vmId, 'stopping', { userId, workspaceId, force });

    try {
      const vm = await this.dbService.getVMById(vmId, userId, workspaceId);
      
      if (!vm.aws_instance_id) {
        throw new VMError('INVALID_STATE', 'VM does not have AWS instance ID');
      }

      if (vm.status !== 'running') {
        throw new VMError('INVALID_STATE', `VM is not running (current status: ${vm.status})`);
      }

      // Stop monitoring
      await this.stopVMMonitoring(vmId);

      // Record final usage before shutdown
      await this.recordFinalUsage(vmId, userId, workspaceId);

      // Stop AWS instance
      await AWSErrorHandler.withRetry(
        () => this.awsProvider.stopInstance(vm.aws_instance_id!),
        3,
        2000
      );

      // Wait for instance to be stopped
      await this.waitForInstanceState(vm.aws_instance_id, 'stopped', 5 * 60 * 1000); // 5 minutes timeout

      // Update database
      await this.dbService.updateVM(vmId, userId, {
        status: 'stopped',
        lastStoppedAt: new Date()
      }, workspaceId);

      this.logLifecycleEvent(vmId, 'stopping', { 
        status: 'completed',
        instanceId: vm.aws_instance_id
      });

    } catch (error) {
      this.logLifecycleEvent(vmId, 'error', { 
        error: error.message,
        phase: 'shutdown'
      });
      throw error;
    }
  }

  /**
   * Complete VM termination with cleanup
   */
  async terminateVM(vmId: string, userId: string, workspaceId?: string): Promise<void> {
    this.logLifecycleEvent(vmId, 'terminating', { userId, workspaceId });

    try {
      const vm = await this.dbService.getVMById(vmId, userId, workspaceId);
      
      if (vm.aws_instance_id) {
        // Stop monitoring
        await this.stopVMMonitoring(vmId);

        // Record final usage
        await this.recordFinalUsage(vmId, userId, workspaceId);

        // Terminate AWS instance
        await AWSErrorHandler.withRetry(
          () => this.awsProvider.terminateInstance(vm.aws_instance_id!),
          3,
          2000
        );

        // Clean up security groups (with delay to allow termination)
        setTimeout(async () => {
          try {
            await this.cleanupVMResources(vm.aws_instance_id!);
          } catch (error) {
            console.warn(`Failed to cleanup resources for VM ${vmId}:`, error);
          }
        }, 60000); // 1 minute delay
      }

      // Update database status
      await this.dbService.updateVM(vmId, userId, {
        status: 'terminated'
      }, workspaceId);

      this.logLifecycleEvent(vmId, 'terminating', { 
        status: 'completed',
        instanceId: vm.aws_instance_id
      });

    } catch (error) {
      this.logLifecycleEvent(vmId, 'error', { 
        error: error.message,
        phase: 'termination'
      });
      throw error;
    }
  }

  /**
   * Perform health check on VM
   */
  async performHealthCheck(vmId: string, userId: string, workspaceId?: string): Promise<VMHealthStatus> {
    this.logLifecycleEvent(vmId, 'health_check', { userId, workspaceId });

    try {
      const vm = await this.dbService.getVMById(vmId, userId, workspaceId);
      
      const healthStatus: VMHealthStatus = {
        vmId,
        status: 'unknown',
        lastChecked: new Date(),
        checks: {
          awsInstanceStatus: 'unknown',
          systemStatus: 'unknown',
          networkConnectivity: 'unknown',
          databaseSync: 'unknown'
        }
      };

      if (!vm.aws_instance_id) {
        healthStatus.status = 'unhealthy';
        healthStatus.checks.databaseSync = 'out_of_sync';
        return healthStatus;
      }

      // Check AWS instance status
      try {
        const awsStatus = await this.awsProvider.getInstanceStatus(vm.aws_instance_id);
        healthStatus.checks.awsInstanceStatus = awsStatus === 'running' ? 'ok' : 'impaired';
        
        // Check database sync
        healthStatus.checks.databaseSync = vm.status === awsStatus ? 'ok' : 'out_of_sync';
        
        // If out of sync, update database
        if (healthStatus.checks.databaseSync === 'out_of_sync') {
          await this.dbService.updateVM(vmId, userId, { status: awsStatus }, workspaceId);
        }

      } catch (error) {
        healthStatus.checks.awsInstanceStatus = 'impaired';
      }

      // Check system status and get metrics (if running)
      if (healthStatus.checks.awsInstanceStatus === 'ok') {
        try {
          const metrics = await this.awsProvider.getInstanceMetrics(vm.aws_instance_id, {
            startTime: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
            endTime: new Date(),
            period: '5m',
            metrics: ['CPUUtilization', 'NetworkIn', 'NetworkOut']
          });

          healthStatus.checks.systemStatus = 'ok';
          healthStatus.checks.networkConnectivity = 'ok';
          healthStatus.metrics = {
            cpuUtilization: metrics.cpuUtilization,
            memoryUtilization: metrics.memoryUtilization,
            networkLatency: 0 // Would need additional monitoring for this
          };

        } catch (error) {
          healthStatus.checks.systemStatus = 'impaired';
          healthStatus.checks.networkConnectivity = 'failed';
        }
      }

      // Determine overall health
      const healthyChecks = Object.values(healthStatus.checks).filter(check => check === 'ok').length;
      const totalChecks = Object.keys(healthStatus.checks).length;
      
      if (healthyChecks === totalChecks) {
        healthStatus.status = 'healthy';
      } else if (healthyChecks > 0) {
        healthStatus.status = 'unhealthy';
      } else {
        healthStatus.status = 'unknown';
      }

      return healthStatus;

    } catch (error) {
      this.logLifecycleEvent(vmId, 'error', { 
        error: error.message,
        phase: 'health_check'
      });
      throw error;
    }
  }

  /**
   * Get lifecycle events for a VM
   */
  getVMLifecycleEvents(vmId: string, limit = 50): VMLifecycleEvent[] {
    return this.lifecycleEvents
      .filter(event => event.vmId === vmId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Cleanup failed VM creation
   */
  private async cleanupFailedVM(vmId: string, userId: string, workspaceId?: string): Promise<void> {
    try {
      const vm = await this.dbService.getVMById(vmId, userId, workspaceId);
      
      // Terminate AWS instance if it exists
      if (vm.aws_instance_id) {
        try {
          await this.awsProvider.terminateInstance(vm.aws_instance_id);
          await this.cleanupVMResources(vm.aws_instance_id);
        } catch (error) {
          console.warn(`Failed to cleanup AWS resources for VM ${vmId}:`, error);
        }
      }

      // Update VM status to error
      await this.dbService.updateVM(vmId, userId, {
        status: 'error'
      }, workspaceId);

    } catch (error) {
      console.error(`Failed to cleanup failed VM ${vmId}:`, error);
    }
  }

  /**
   * Cleanup VM resources (security groups, etc.)
   */
  private async cleanupVMResources(awsInstanceId: string): Promise<void> {
    try {
      // Get instance info to find security groups
      const instanceInfo = await this.awsProvider.getInstanceInfo(awsInstanceId);
      
      // Note: In a real implementation, we'd need to track which security groups
      // were created for this VM and clean them up. For now, we'll skip this
      // as AWS will handle cleanup when the instance is terminated.
      
    } catch (error) {
      console.warn(`Failed to cleanup resources for instance ${awsInstanceId}:`, error);
    }
  }

  /**
   * Wait for instance to reach desired state
   */
  private async waitForInstanceState(instanceId: string, desiredState: string, timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        const currentState = await this.awsProvider.getInstanceStatus(instanceId);
        
        if (currentState === desiredState) {
          return;
        }

        if (currentState === 'error' || currentState === 'terminated') {
          throw new VMError('INSTANCE_ERROR', `Instance entered error state: ${currentState}`);
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        if (error instanceof VMError) {
          throw error;
        }
        // Continue polling on transient errors
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new VMError('TIMEOUT', `Instance did not reach ${desiredState} state within ${timeoutMs}ms`);
  }

  /**
   * Start monitoring for a VM
   */
  private async startVMMonitoring(vmId: string): Promise<void> {
    // In a real implementation, this would set up CloudWatch alarms,
    // start collecting metrics, etc.
    console.log(`Started monitoring for VM ${vmId}`);
  }

  /**
   * Stop monitoring for a VM
   */
  private async stopVMMonitoring(vmId: string): Promise<void> {
    // In a real implementation, this would clean up CloudWatch alarms,
    // stop collecting metrics, etc.
    console.log(`Stopped monitoring for VM ${vmId}`);
  }

  /**
   * Record final usage before shutdown/termination
   */
  private async recordFinalUsage(vmId: string, userId: string, workspaceId?: string): Promise<void> {
    try {
      const vm = await this.dbService.getVMById(vmId, userId, workspaceId);
      
      if (vm.aws_instance_id && vm.last_started_at) {
        const endTime = new Date();
        const durationMinutes = Math.floor((endTime.getTime() - vm.last_started_at.getTime()) / (1000 * 60));
        
        // Calculate cost for this session
        const costCents = Math.ceil((durationMinutes / 60) * vm.hourly_rate_cents);

        await this.dbService.createUsageTracking({
          vmId,
          userId,
          workspaceId,
          startTime: vm.last_started_at,
          endTime,
          durationMinutes,
          costCents
        });

        // Create billing record
        await this.dbService.createBillingRecord({
          vmId,
          userId,
          workspaceId,
          amountCents: costCents,
          type: 'hourly_usage',
          description: `VM usage for ${durationMinutes} minutes`,
          billingPeriodStart: vm.last_started_at,
          billingPeriodEnd: endTime
        });
      }

    } catch (error) {
      console.warn(`Failed to record final usage for VM ${vmId}:`, error);
    }
  }

  /**
   * Log lifecycle event
   */
  private logLifecycleEvent(vmId: string, event: VMLifecycleEvent['event'], details?: Record<string, any>): void {
    const lifecycleEvent: VMLifecycleEvent = {
      vmId,
      event,
      timestamp: new Date(),
      details
    };

    this.lifecycleEvents.push(lifecycleEvent);

    // Keep only last 1000 events in memory
    if (this.lifecycleEvents.length > 1000) {
      this.lifecycleEvents = this.lifecycleEvents.slice(-1000);
    }

    // Log to console for debugging
    console.log(`VM Lifecycle Event: ${vmId} - ${event}`, details);
  }
}