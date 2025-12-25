// VM Service - Core VM operations and API integration

import { VM, VMConfiguration, VMStatus, CreateVMResponse, VMListResponse } from '../types';

class VMService {
  private baseURL = '/api/vm-management';

  /**
   * Create a new virtual machine
   */
  async createVM(config: VMConfiguration): Promise<VM> {
    try {
      const response = await fetch(`${this.baseURL}/vms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data: CreateVMResponse = await response.json();

      if (!data.success || !data.vm) {
        throw new Error(data.error || 'Failed to create VM');
      }

      return data.vm;
    } catch (error) {
      console.error('Error creating VM:', error);
      throw error;
    }
  }

  /**
   * Get list of VMs for a user
   */
  async getVMList(userId: string): Promise<VM[]> {
    try {
      const response = await fetch(`${this.baseURL}/vms?userId=${userId}`);
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
      console.error('Error fetching VM list:', error);
      throw error;
    }
  }

  /**
   * Get VM status from provider
   */
  async getVMStatus(vmId: string): Promise<VMStatus> {
    try {
      const response = await fetch(`${this.baseURL}/vms/${vmId}/status`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get VM status');
      }

      return data.status;
    } catch (error) {
      console.error('Error getting VM status:', error);
      throw error;
    }
  }

  /**
   * Delete a virtual machine
   */
  async deleteVM(vmId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/vms/${vmId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete VM');
      }
    } catch (error) {
      console.error('Error deleting VM:', error);
      throw error;
    }
  }

  /**
   * Start a stopped VM
   */
  async startVM(vmId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/vms/${vmId}/start`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start VM');
      }
    } catch (error) {
      console.error('Error starting VM:', error);
      throw error;
    }
  }

  /**
   * Stop a running VM
   */
  async stopVM(vmId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/vms/${vmId}/stop`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to stop VM');
      }
    } catch (error) {
      console.error('Error stopping VM:', error);
      throw error;
    }
  }

  /**
   * Get available regions for VM deployment
   */
  async getAvailableRegions() {
    try {
      const response = await fetch(`${this.baseURL}/regions`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch regions');
      }

      return data.regions;
    } catch (error) {
      console.error('Error fetching regions:', error);
      throw error;
    }
  }

  /**
   * Get available VM sizes and configurations
   */
  async getAvailableSizes() {
    try {
      const response = await fetch(`${this.baseURL}/sizes`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch VM sizes');
      }

      return data.sizes;
    } catch (error) {
      console.error('Error fetching VM sizes:', error);
      throw error;
    }
  }

  /**
   * Get operating system options
   */
  async getOperatingSystems() {
    try {
      const response = await fetch(`${this.baseURL}/operating-systems`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch operating systems');
      }

      return data.operatingSystems;
    } catch (error) {
      console.error('Error fetching operating systems:', error);
      throw error;
    }
  }
}

export const vmService = new VMService();