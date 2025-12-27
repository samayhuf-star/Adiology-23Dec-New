// VM Service - Core VM operations with workspace isolation

import { VM, VMConfiguration, VMStatus, CreateVMResponse, VMListResponse } from '../types';
import { makeWorkspaceApiCall, getCurrentWorkspaceContext, validateWorkspaceAccess } from '../../../utils/workspace-api';
import { loggingService } from '../../../utils/loggingService';

class VMService {
  private baseURL = '/api/vm-management';

  /**
   * Create a new virtual machine with workspace context
   */
  async createVM(config: VMConfiguration): Promise<VM> {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('VMService', 'createVM', {
        workspaceId: context.workspaceId,
        vmName: config.name
      });

      const response = await makeWorkspaceApiCall(`${this.baseURL}/vms`, {
        method: 'POST',
        body: JSON.stringify({
          ...config,
          workspaceId: context.workspaceId
        }),
      });

      const data: CreateVMResponse = await response.json();

      if (!data.success || !data.vm) {
        throw new Error(data.error || 'Failed to create VM');
      }

      return data.vm;
    } catch (error) {
      loggingService.addLog('error', 'VMService', 'Error creating VM', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get list of VMs for current workspace
   */
  async getVMList(): Promise<VM[]> {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('VMService', 'getVMList', {
        workspaceId: context.workspaceId
      });

      const response = await makeWorkspaceApiCall(`${this.baseURL}/vms`);
      const data: VMListResponse = await response.json();

      if (!data.success || !data.vms) {
        throw new Error(data.error || 'Failed to fetch VMs');
      }

      // Convert date strings to Date objects
      return data.vms.map(vm => ({
        ...vm,
        createdAt: new Date(vm.createdAt),
        lastConnected: vm.lastConnected ? new Date(vm.lastConnected) : undefined,
      }));
    } catch (error) {
      loggingService.addLog('error', 'VMService', 'Error fetching VM list', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get VM status from provider with workspace validation
   */
  async getVMStatus(vmId: string): Promise<VMStatus> {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('VMService', 'getVMStatus', {
        workspaceId: context.workspaceId,
        vmId
      });

      const response = await makeWorkspaceApiCall(`${this.baseURL}/vms/${vmId}/status`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get VM status');
      }

      return data.status;
    } catch (error) {
      loggingService.addLog('error', 'VMService', 'Error getting VM status', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Delete a virtual machine with workspace validation
   */
  async deleteVM(vmId: string): Promise<void> {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('VMService', 'deleteVM', {
        workspaceId: context.workspaceId,
        vmId
      });

      const response = await makeWorkspaceApiCall(`${this.baseURL}/vms/${vmId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete VM');
      }
    } catch (error) {
      loggingService.addLog('error', 'VMService', 'Error deleting VM', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Start a stopped VM with workspace validation
   */
  async startVM(vmId: string): Promise<void> {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('VMService', 'startVM', {
        workspaceId: context.workspaceId,
        vmId
      });

      const response = await makeWorkspaceApiCall(`${this.baseURL}/vms/${vmId}/start`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start VM');
      }
    } catch (error) {
      loggingService.addLog('error', 'VMService', 'Error starting VM', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Stop a running VM with workspace validation
   */
  async stopVM(vmId: string): Promise<void> {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('VMService', 'stopVM', {
        workspaceId: context.workspaceId,
        vmId
      });

      const response = await makeWorkspaceApiCall(`${this.baseURL}/vms/${vmId}/stop`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to stop VM');
      }
    } catch (error) {
      loggingService.addLog('error', 'VMService', 'Error stopping VM', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get available regions for VM deployment
   */
  async getAvailableRegions() {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('VMService', 'getAvailableRegions', {
        workspaceId: context.workspaceId
      });

      const response = await makeWorkspaceApiCall(`${this.baseURL}/regions`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch regions');
      }

      return data.regions;
    } catch (error) {
      loggingService.addLog('error', 'VMService', 'Error fetching regions', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get available VM sizes and configurations
   */
  async getAvailableSizes() {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('VMService', 'getAvailableSizes', {
        workspaceId: context.workspaceId
      });

      const response = await makeWorkspaceApiCall(`${this.baseURL}/sizes`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch VM sizes');
      }

      return data.sizes;
    } catch (error) {
      loggingService.addLog('error', 'VMService', 'Error fetching VM sizes', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get operating system options
   */
  async getOperatingSystems() {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('VMService', 'getOperatingSystems', {
        workspaceId: context.workspaceId
      });

      const response = await makeWorkspaceApiCall(`${this.baseURL}/operating-systems`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch operating systems');
      }

      return data.operatingSystems;
    } catch (error) {
      loggingService.addLog('error', 'VMService', 'Error fetching operating systems', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

export const vmService = new VMService();