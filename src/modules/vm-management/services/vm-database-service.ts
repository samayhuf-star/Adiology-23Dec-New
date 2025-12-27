// VM Database Service - Database operations for VM management with workspace isolation

import { PrismaClient } from '../../../generated/prisma';
import { z } from 'zod';
import { DatabaseErrorHandler } from '../utils/aws-error-handler';

// Zod schemas for validation following Adiology guidelines
export const CreateVMSchema = z.object({
  userId: z.string().uuid(),
  workspaceId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  awsRegion: z.string().min(1),
  instanceType: z.string().min(1),
  operatingSystem: z.string().min(1),
  cpuCores: z.number().int().positive(),
  memoryGb: z.number().int().positive(),
  storageGb: z.number().int().positive(),
  hourlyRateCents: z.number().int().positive(),
  monthlyEstimateCents: z.number().int().positive(),
  amiId: z.string().min(1)
});

export const UpdateVMSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['creating', 'running', 'stopped', 'terminated', 'error']).optional(),
  awsInstanceId: z.string().optional(),
  publicIp: z.string().optional(),
  privateIp: z.string().optional(),
  adminUsername: z.string().optional(),
  adminPasswordHash: z.string().optional(),
  sshKeyPairName: z.string().optional(),
  lastStartedAt: z.date().optional(),
  lastStoppedAt: z.date().optional()
});

export const CreateBillingRecordSchema = z.object({
  vmId: z.string().uuid(),
  userId: z.string().uuid(),
  workspaceId: z.string().uuid().optional(),
  amountCents: z.number().int(),
  type: z.enum(['hourly_usage', 'creation_fee', 'storage_fee', 'refund']),
  description: z.string().min(1),
  billingPeriodStart: z.date().optional(),
  billingPeriodEnd: z.date().optional(),
  stripeChargeId: z.string().optional()
});

export const CreateUsageTrackingSchema = z.object({
  vmId: z.string().uuid(),
  userId: z.string().uuid(),
  workspaceId: z.string().uuid().optional(),
  startTime: z.date(),
  endTime: z.date().optional(),
  durationMinutes: z.number().int().optional(),
  cpuUsagePercent: z.number().optional(),
  memoryUsagePercent: z.number().optional(),
  networkInBytes: z.bigint().optional(),
  networkOutBytes: z.bigint().optional(),
  storageReadBytes: z.bigint().optional(),
  storageWriteBytes: z.bigint().optional(),
  costCents: z.number().int().optional()
});

export type CreateVMData = z.infer<typeof CreateVMSchema>;
export type UpdateVMData = z.infer<typeof UpdateVMSchema>;
export type CreateBillingRecordData = z.infer<typeof CreateBillingRecordSchema>;
export type CreateUsageTrackingData = z.infer<typeof CreateUsageTrackingSchema>;

export class VMDatabaseService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new VM record in the database
   * CRITICAL: Enforces workspace isolation per Adiology guidelines
   */
  async createVM(data: CreateVMData) {
    // Validate input data
    const validatedData = CreateVMSchema.parse(data);

    return DatabaseErrorHandler.withTransaction(this.prisma, async (tx) => {
      // Verify user exists and has access to workspace (if specified)
      if (validatedData.workspaceId) {
        const workspaceAccess = await tx.workspace_members.findFirst({
          where: {
            workspace_id: validatedData.workspaceId,
            user_id: validatedData.userId,
            status: 'active'
          }
        });

        if (!workspaceAccess) {
          throw new Error('User does not have access to the specified workspace');
        }
      }

      // Create VM record
      const vm = await tx.vms.create({
        data: {
          user_id: validatedData.userId,
          workspace_id: validatedData.workspaceId,
          name: validatedData.name,
          description: validatedData.description,
          aws_region: validatedData.awsRegion,
          instance_type: validatedData.instanceType,
          ami_id: validatedData.amiId,
          operating_system: validatedData.operatingSystem,
          cpu_cores: validatedData.cpuCores,
          memory_gb: validatedData.memoryGb,
          storage_gb: validatedData.storageGb,
          hourly_rate_cents: validatedData.hourlyRateCents,
          monthly_estimate_cents: validatedData.monthlyEstimateCents,
          status: 'creating'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              full_name: true
            }
          },
          workspace: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return vm;
    });
  }

  /**
   * Get VM by ID with workspace isolation
   */
  async getVMById(vmId: string, userId: string, workspaceId?: string) {
    const whereClause: any = {
      id: vmId,
      user_id: userId
    };

    // CRITICAL: Enforce workspace isolation
    if (workspaceId) {
      whereClause.workspace_id = workspaceId;
    }

    const vm = await this.prisma.vms.findFirst({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            full_name: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true
          }
        },
        billing_records: {
          orderBy: {
            created_at: 'desc'
          },
          take: 10
        },
        usage_records: {
          orderBy: {
            recorded_at: 'desc'
          },
          take: 10
        }
      }
    });

    if (!vm) {
      throw new Error('VM not found or access denied');
    }

    return vm;
  }

  /**
   * List VMs for a user with workspace isolation
   */
  async listVMs(userId: string, workspaceId?: string, filters?: {
    status?: string[];
    instanceTypes?: string[];
    limit?: number;
    offset?: number;
  }) {
    const whereClause: any = {
      user_id: userId
    };

    // CRITICAL: Enforce workspace isolation
    if (workspaceId) {
      whereClause.workspace_id = workspaceId;
    }

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      whereClause.status = {
        in: filters.status
      };
    }

    if (filters?.instanceTypes && filters.instanceTypes.length > 0) {
      whereClause.instance_type = {
        in: filters.instanceTypes
      };
    }

    const [vms, totalCount] = await Promise.all([
      this.prisma.vms.findMany({
        where: whereClause,
        include: {
          workspace: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0
      }),
      this.prisma.vms.count({
        where: whereClause
      })
    ]);

    return {
      vms,
      totalCount,
      hasMore: (filters?.offset || 0) + vms.length < totalCount
    };
  }

  /**
   * Update VM record
   */
  async updateVM(vmId: string, userId: string, data: UpdateVMData, workspaceId?: string) {
    const validatedData = UpdateVMSchema.parse(data);

    return DatabaseErrorHandler.withTransaction(this.prisma, async (tx) => {
      // Verify VM exists and user has access
      const existingVM = await this.getVMById(vmId, userId, workspaceId);

      const updatedVM = await tx.vms.update({
        where: {
          id: vmId
        },
        data: {
          ...validatedData,
          updated_at: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              full_name: true
            }
          },
          workspace: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return updatedVM;
    });
  }

  /**
   * Delete VM record
   */
  async deleteVM(vmId: string, userId: string, workspaceId?: string) {
    return DatabaseErrorHandler.withTransaction(this.prisma, async (tx) => {
      // Verify VM exists and user has access
      await this.getVMById(vmId, userId, workspaceId);

      // Delete VM (cascade will handle related records)
      await tx.vms.delete({
        where: {
          id: vmId
        }
      });

      return { success: true };
    });
  }

  /**
   * Create billing record
   */
  async createBillingRecord(data: CreateBillingRecordData) {
    const validatedData = CreateBillingRecordSchema.parse(data);

    return this.prisma.vm_billing_records.create({
      data: {
        vm_id: validatedData.vmId,
        user_id: validatedData.userId,
        workspace_id: validatedData.workspaceId,
        amount_cents: validatedData.amountCents,
        type: validatedData.type,
        description: validatedData.description,
        billing_period_start: validatedData.billingPeriodStart,
        billing_period_end: validatedData.billingPeriodEnd,
        stripe_charge_id: validatedData.stripeChargeId
      }
    });
  }

  /**
   * Get billing records for a VM
   */
  async getBillingRecords(vmId: string, userId: string, workspaceId?: string, limit = 50) {
    // Verify VM access first
    await this.getVMById(vmId, userId, workspaceId);

    return this.prisma.vm_billing_records.findMany({
      where: {
        vm_id: vmId,
        user_id: userId,
        ...(workspaceId && { workspace_id: workspaceId })
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit
    });
  }

  /**
   * Create usage tracking record
   */
  async createUsageTracking(data: CreateUsageTrackingData) {
    const validatedData = CreateUsageTrackingSchema.parse(data);

    return this.prisma.vm_usage_tracking.create({
      data: {
        vm_id: validatedData.vmId,
        user_id: validatedData.userId,
        workspace_id: validatedData.workspaceId,
        start_time: validatedData.startTime,
        end_time: validatedData.endTime,
        duration_minutes: validatedData.durationMinutes,
        cpu_usage_percent: validatedData.cpuUsagePercent,
        memory_usage_percent: validatedData.memoryUsagePercent,
        network_in_bytes: validatedData.networkInBytes,
        network_out_bytes: validatedData.networkOutBytes,
        storage_read_bytes: validatedData.storageReadBytes,
        storage_write_bytes: validatedData.storageWriteBytes,
        cost_cents: validatedData.costCents
      }
    });
  }

  /**
   * Get usage tracking records for a VM
   */
  async getUsageTracking(vmId: string, userId: string, workspaceId?: string, limit = 100) {
    // Verify VM access first
    await this.getVMById(vmId, userId, workspaceId);

    return this.prisma.vm_usage_tracking.findMany({
      where: {
        vm_id: vmId,
        user_id: userId,
        ...(workspaceId && { workspace_id: workspaceId })
      },
      orderBy: {
        recorded_at: 'desc'
      },
      take: limit
    });
  }

  /**
   * Get VM statistics for a user/workspace
   */
  async getVMStatistics(userId: string, workspaceId?: string) {
    const whereClause: any = {
      user_id: userId
    };

    if (workspaceId) {
      whereClause.workspace_id = workspaceId;
    }

    const [
      totalVMs,
      runningVMs,
      stoppedVMs,
      totalMonthlyCost,
      recentBilling
    ] = await Promise.all([
      this.prisma.vms.count({
        where: whereClause
      }),
      this.prisma.vms.count({
        where: {
          ...whereClause,
          status: 'running'
        }
      }),
      this.prisma.vms.count({
        where: {
          ...whereClause,
          status: 'stopped'
        }
      }),
      this.prisma.vms.aggregate({
        where: {
          ...whereClause,
          status: {
            in: ['running', 'stopped']
          }
        },
        _sum: {
          monthly_estimate_cents: true
        }
      }),
      this.prisma.vm_billing_records.aggregate({
        where: {
          user_id: userId,
          ...(workspaceId && { workspace_id: workspaceId }),
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        _sum: {
          amount_cents: true
        }
      })
    ]);

    return {
      totalVMs,
      runningVMs,
      stoppedVMs,
      estimatedMonthlyCostCents: totalMonthlyCost._sum.monthly_estimate_cents || 0,
      last30DaysCostCents: recentBilling._sum.amount_cents || 0
    };
  }

  /**
   * Find VMs by AWS instance ID (for AWS callbacks)
   */
  async findVMByAWSInstanceId(awsInstanceId: string) {
    return this.prisma.vms.findUnique({
      where: {
        aws_instance_id: awsInstanceId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            full_name: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }
}