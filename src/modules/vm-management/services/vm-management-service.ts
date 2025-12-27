// VM Management Service - Main service with workspace isolation

import { PrismaClient } from '../../../generated/prisma';
import { getAWSProvider, VMCreationConfig } from './aws-provider';
import { VMDatabaseService, CreateVMData, UpdateVMData } from './vm-database-service';
import { AWS_CONFIG, calculateVMCost, getAMIForRegion } from '../config/aws-config';
import { AWSErrorHandler, VMError } from '../utils/aws-error-handler';
import { getCurrentWorkspaceContext, validateWorkspaceAccess, logSecurityViolation } from '../../../utils/workspace-api';
import { loggingService } from '../../../utils/loggingService';
import { z } from 'zod';

// Zod schemas for API validation with workspace context
export const CreateVMRequestSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  region: z.string().min(1),
  instanceType: z.string().min(1),
  operatingSystem: z.string().min(1),
  storageGb: z.number().int().min(8).max(1000),
});

export const VMActionSchema = z.object({
  action: z.enum(['start', 'stop', 'restart', 'terminate'])
});

export type CreateVMRequest = z.infer<typeof CreateVMRequestSchema>;
export type VMAction = z.infer<typeof VMActionSchema>;

export interface VMWithDetails {
  id: string;
  name: string;
  description?: string;
  status: string;
  awsInstanceId?: string;
  region: string;
  instanceType: string;
  operatingSystem: string;
  cpuCores: number;
  memoryGb: number;
  storageGb: number;
  publicIp?: string;
  privateIp?: string;
  hourlyRateCents: number;
  monthlyEstimateCents: number;
  createdAt: Date;
  updatedAt: Date;
  lastStartedAt?: Date;
  lastStoppedAt?: Date;
  user: {
    id: string;
    email: string;
    fullName?: string;
  };
  workspace?: {
    id: string;
    name: string;
  };
}

export class VMManagementService {
  private prisma: PrismaClient;
  private dbService: VMDatabaseService;
  private awsProvider: ReturnType<typeof getAWSProvider>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.dbService = new VMDatabaseService(prisma);
    this.awsProvider = getAWSProvider();
  }

  /**
   * Create a new virtual machine with workspace isolation
   * Combines AWS provisioning with database tracking
   */
  async createVM(request: CreateVMRequest): Promise<VMWithDetails> {
    try {
      // Get workspace context
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new VMError('WORKSPACE_ERROR', 'No workspace context available');
      }

      // Validate request
      const validatedRequest = CreateVMRequestSchema.parse(request);

      loggingService.logTransaction('VMManagementService', 'createVM', {
        workspaceId: context.workspaceId,
        vmName: validatedRequest.name,
        instanceType: validatedRequest.instanceType
      });

      // Calculate pricing
      const pricing = calculateVMCost(
        validatedRequest.instanceType,
        validatedRequest.region,
        validatedRequest.operatingSystem
      );

      // Get AMI ID for the region
      const amiId = getAMIForRegion(validatedRequest.operatingSystem, validatedRequest.region);

      // Get OS configuration
      const osConfig = AWS_CONFIG.OPERATING_SYSTEMS.find(os => os.id === validatedRequest.operatingSystem);
      const instanceConfig = AWS_CONFIG.INSTANCE_TYPES.find(type => type.id === validatedRequest.instanceType);

      if (!osConfig || !instanceConfig) {
        throw new VMError('INVALID_CONFIG', 'Invalid operating system or instance type');
      }

      // Create VM record in database first with workspace context
      const vmData: CreateVMData = {
        userId: context.userId,
        workspaceId: context.workspaceId,
        name: validatedRequest.name,
        description: validatedRequest.description,
        awsRegion: validatedRequest.region,
        instanceType: validatedRequest.instanceType,
        operatingSystem: validatedRequest.operatingSystem,
        cpuCores: instanceConfig.vcpus,
        memoryGb: instanceConfig.memory,
        storageGb: validatedRequest.storageGb,
        hourlyRateCents: pricing.hourlyPriceCents,
        monthlyEstimateCents: pricing.monthlyPriceCents,
        amiId
      };

      const vm = await this.dbService.createVM(vmData);

      // Create AWS instance
      try {
        const awsConfig: VMCreationConfig = {
          userId: context.userId,
          name: validatedRequest.name,
          description: validatedRequest.description,
          region: validatedRequest.region,
          instanceType: validatedRequest.instanceType,
          operatingSystem: validatedRequest.operatingSystem,
          storageGb: validatedRequest.storageGb,
          amiId
        };

        const awsInstance = await AWSErrorHandler.withRetry(
          () => this.awsProvider.createInstance(awsConfig),
          3,
          2000
        );

        // Update VM record with AWS instance details
        const updatedVM = await this.dbService.updateVM(vm.id, context.userId, {
          awsInstanceId: awsInstance.instanceId,
          status: 'running',
          publicIp: awsInstance.publicIp,
          privateIp: awsInstance.privateIp,
          lastStartedAt: new Date()
        }, context.workspaceId);

        // Create initial billing record with workspace context
        await this.dbService.createBillingRecord({
          vmId: vm.id,
          userId: context.userId,
          workspaceId: context.workspaceId,
          amountCents: AWS_CONFIG.PRICING.CREATION_FEE_CENTS,
          type: 'creation_fee',
          description: `VM creation fee for ${validatedRequest.name}`
        });

        return this.mapVMToDetails(updatedVM);

      } catch (awsError) {
        // AWS creation failed, update VM status to error
        await this.dbService.updateVM(vm.id, context.userId, {
          status: 'error'
        }, context.workspaceId);

        const vmError = AWSErrorHandler.handleEC2Error(awsError);
        AWSErrorHandler.logError(vmError, { vmId: vm.id, userId: context.userId, workspaceId: context.workspaceId });
        throw vmError;
      }

    } catch (error) {
      if (error instanceof VMError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new VMError('VALIDATION_ERROR', `Invalid request: ${error.errors[0].message}`);
      }
      throw new VMError('VM_CREATION_ERROR', `Failed to create VM: ${error}`);
    }
  }

  /**
   * Get VM by ID with workspace access control
   */
  async getVM(vmId: string): Promise<VMWithDetails> {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new VMError('WORKSPACE_ERROR', 'No workspace context available');
      }

      loggingService.logTransaction('VMManagementService', 'getVM', {
        workspaceId: context.workspaceId,
        vmId
      });

      const vm = await this.dbService.getVMById(vmId, context.userId, context.workspaceId);
      
      // Additional workspace validation
      if (!await validateWorkspaceAccess(vm.workspace_id, 'read_vm')) {
        throw new VMError('ACCESS_DENIED', 'Access denied to VM');
      }

      return this.mapVMToDetails(vm);
    } catch (error) {
      if (error instanceof VMError) {
        throw error;
      }
      throw new VMError('VM_NOT_FOUND', `VM not found: ${error}`);
    }
  }

  /**
   * List VMs for current workspace with filtering
   */
  async listVMs(filters?: {
    status?: string[];
    instanceTypes?: string[];
    limit?: number;
    offset?: number;
  }) {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new VMError('WORKSPACE_ERROR', 'No workspace context available');
      }

      loggingService.logTransaction('VMManagementService', 'listVMs', {
        workspaceId: context.workspaceId,
        filters
      });

      const result = await this.dbService.listVMs(context.userId, context.workspaceId, filters);
      
      return {
        vms: result.vms.map(vm => this.mapVMToDetails(vm)),
        totalCount: result.totalCount,
        hasMore: result.hasMore
      };
    } catch (error) {
      throw new VMError('VM_LIST_ERROR', `Failed to list VMs: ${error}`);
    }
  }

  /**
   * Perform VM action (start, stop, restart, terminate) with workspace validation
   */
  async performVMAction(vmId: string, action: VMAction): Promise<VMWithDetails> {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new VMError('WORKSPACE_ERROR', 'No workspace context available');
      }

      const validatedAction = VMActionSchema.parse(action);
      
      loggingService.logTransaction('VMManagementService', 'performVMAction', {
        workspaceId: context.workspaceId,
        vmId,
        action: validatedAction.action
      });
      
      // Get VM and verify access
      const vm = await this.dbService.getVMById(vmId, context.userId, context.workspaceId);
      
      // Additional workspace validation
      if (!await validateWorkspaceAccess(vm.workspace_id, 'manage_vm')) {
        throw new VMError('ACCESS_DENIED', 'Access denied to manage VM');
      }
      
      if (!vm.aws_instance_id) {
        throw new VMError('INVALID_STATE', 'VM does not have an associated AWS instance');
      }

      // Perform AWS action
      let updatedStatus: string;
      let updateData: UpdateVMData = {};

      switch (validatedAction.action) {
        case 'start':
          if (vm.status === 'running') {
            throw new VMError('INVALID_STATE', 'VM is already running');
          }
          await AWSErrorHandler.withRetry(
            () => this.awsProvider.startInstance(vm.aws_instance_id!),
            3,
            1000
          );
          updatedStatus = 'running';
          updateData.lastStartedAt = new Date();
          break;

        case 'stop':
          if (vm.status === 'stopped') {
            throw new VMError('INVALID_STATE', 'VM is already stopped');
          }
          await AWSErrorHandler.withRetry(
            () => this.awsProvider.stopInstance(vm.aws_instance_id!),
            3,
            1000
          );
          updatedStatus = 'stopped';
          updateData.lastStoppedAt = new Date();
          break;

        case 'restart':
          if (vm.status !== 'running') {
            throw new VMError('INVALID_STATE', 'VM must be running to restart');
          }
          await AWSErrorHandler.withRetry(
            () => this.awsProvider.stopInstance(vm.aws_instance_id!),
            3,
            1000
          );
          await AWSErrorHandler.withRetry(
            () => this.awsProvider.startInstance(vm.aws_instance_id!),
            3,
            1000
          );
          updatedStatus = 'running';
          updateData.lastStartedAt = new Date();
          break;

        case 'terminate':
          await AWSErrorHandler.withRetry(
            () => this.awsProvider.terminateInstance(vm.aws_instance_id!),
            3,
            1000
          );
          updatedStatus = 'terminated';
          break;

        default:
          throw new VMError('INVALID_ACTION', `Unknown action: ${validatedAction.action}`);
      }

      // Update VM status in database
      updateData.status = updatedStatus;
      const updatedVM = await this.dbService.updateVM(vmId, context.userId, updateData, context.workspaceId);

      return this.mapVMToDetails(updatedVM);

    } catch (error) {
      if (error instanceof VMError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new VMError('VALIDATION_ERROR', `Invalid action: ${error.errors[0].message}`);
      }
      const vmError = AWSErrorHandler.handleEC2Error(error);
      AWSErrorHandler.logError(vmError, { vmId, action });
      throw vmError;
    }
  }

  /**
   * Delete VM (terminate AWS instance and remove from database) with workspace validation
   */
  async deleteVM(vmId: string): Promise<{ success: boolean }> {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new VMError('WORKSPACE_ERROR', 'No workspace context available');
      }

      loggingService.logTransaction('VMManagementService', 'deleteVM', {
        workspaceId: context.workspaceId,
        vmId
      });

      // Get VM and verify access
      const vm = await this.dbService.getVMById(vmId, context.userId, context.workspaceId);

      // Additional workspace validation
      if (!await validateWorkspaceAccess(vm.workspace_id, 'delete_vm')) {
        throw new VMError('ACCESS_DENIED', 'Access denied to delete VM');
      }

      // Terminate AWS instance if it exists
      if (vm.aws_instance_id && vm.status !== 'terminated') {
        try {
          await AWSErrorHandler.withRetry(
            () => this.awsProvider.terminateInstance(vm.aws_instance_id!),
            3,
            1000
          );
        } catch (awsError) {
          // Log error but continue with database cleanup
          const vmError = AWSErrorHandler.handleEC2Error(awsError);
          AWSErrorHandler.logError(vmError, { vmId, userId: context.userId, workspaceId: context.workspaceId, operation: 'delete' });
        }
      }

      // Remove from database
      await this.dbService.deleteVM(vmId, context.userId, context.workspaceId);

      return { success: true };

    } catch (error) {
      if (error instanceof VMError) {
        throw error;
      }
      throw new VMError('VM_DELETE_ERROR', `Failed to delete VM: ${error}`);
    }
  }

  /**
   * Get VM connection information with workspace validation
   */
  async getVMConnection(vmId: string) {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new VMError('WORKSPACE_ERROR', 'No workspace context available');
      }

      loggingService.logTransaction('VMManagementService', 'getVMConnection', {
        workspaceId: context.workspaceId,
        vmId
      });

      const vm = await this.dbService.getVMById(vmId, context.userId, context.workspaceId);

      // Additional workspace validation
      if (!await validateWorkspaceAccess(vm.workspace_id, 'connect_vm')) {
        throw new VMError('ACCESS_DENIED', 'Access denied to connect to VM');
      }

      if (!vm.aws_instance_id || vm.status !== 'running') {
        throw new VMError('INVALID_STATE', 'VM must be running to get connection info');
      }

      const connectionInfo = await this.awsProvider.getConnectionInfo(vm.aws_instance_id);
      
      // Generate connection files/info based on OS
      if (vm.operating_system.startsWith('windows')) {
        const rdpContent = await this.awsProvider.generateRDPFile(vm.aws_instance_id);
        return {
          type: 'rdp',
          connectionInfo,
          rdpContent,
          filename: `${vm.name}.rdp`
        };
      } else {
        return {
          type: 'ssh',
          connectionInfo,
          sshCommand: `ssh -i ~/.ssh/${connectionInfo.credentials.keyPairName}.pem ${connectionInfo.credentials.username}@${connectionInfo.publicIp}`
        };
      }

    } catch (error) {
      if (error instanceof VMError) {
        throw error;
      }
      throw new VMError('CONNECTION_ERROR', `Failed to get connection info: ${error}`);
    }
  }

  /**
   * Get VM statistics for current workspace
   */
  async getVMStatistics() {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new VMError('WORKSPACE_ERROR', 'No workspace context available');
      }

      loggingService.logTransaction('VMManagementService', 'getVMStatistics', {
        workspaceId: context.workspaceId
      });

      return await this.dbService.getVMStatistics(context.userId, context.workspaceId);
    } catch (error) {
      throw new VMError('STATS_ERROR', `Failed to get VM statistics: ${error}`);
    }
  }

  /**
   * Sync VM status with AWS (for monitoring/health checks) with workspace validation
   */
  async syncVMStatus(vmId: string): Promise<VMWithDetails> {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new VMError('WORKSPACE_ERROR', 'No workspace context available');
      }

      loggingService.logTransaction('VMManagementService', 'syncVMStatus', {
        workspaceId: context.workspaceId,
        vmId
      });

      const vm = await this.dbService.getVMById(vmId, context.userId, context.workspaceId);

      // Additional workspace validation
      if (!await validateWorkspaceAccess(vm.workspace_id, 'read_vm')) {
        throw new VMError('ACCESS_DENIED', 'Access denied to sync VM status');
      }

      if (!vm.aws_instance_id) {
        throw new VMError('INVALID_STATE', 'VM does not have an associated AWS instance');
      }

      // Get current AWS status
      const awsStatus = await this.awsProvider.getInstanceStatus(vm.aws_instance_id);
      
      // Update database if status differs
      if (vm.status !== awsStatus) {
        const updatedVM = await this.dbService.updateVM(vmId, context.userId, {
          status: awsStatus
        }, context.workspaceId);
        
        return this.mapVMToDetails(updatedVM);
      }

      return this.mapVMToDetails(vm);

    } catch (error) {
      if (error instanceof VMError) {
        throw error;
      }
      const vmError = AWSErrorHandler.handleEC2Error(error);
      AWSErrorHandler.logError(vmError, { vmId, operation: 'sync' });
      throw vmError;
    }
  }

  /**
   * Map database VM record to API response format
   */
  private mapVMToDetails(vm: any): VMWithDetails {
    return {
      id: vm.id,
      name: vm.name,
      description: vm.description,
      status: vm.status,
      awsInstanceId: vm.aws_instance_id,
      region: vm.aws_region,
      instanceType: vm.instance_type,
      operatingSystem: vm.operating_system,
      cpuCores: vm.cpu_cores,
      memoryGb: vm.memory_gb,
      storageGb: vm.storage_gb,
      publicIp: vm.public_ip,
      privateIp: vm.private_ip,
      hourlyRateCents: vm.hourly_rate_cents,
      monthlyEstimateCents: vm.monthly_estimate_cents,
      createdAt: vm.created_at,
      updatedAt: vm.updated_at,
      lastStartedAt: vm.last_started_at,
      lastStoppedAt: vm.last_stopped_at,
      user: {
        id: vm.user.id,
        email: vm.user.email,
        fullName: vm.user.full_name
      },
      workspace: vm.workspace ? {
        id: vm.workspace.id,
        name: vm.workspace.name
      } : undefined
    };
  }
}