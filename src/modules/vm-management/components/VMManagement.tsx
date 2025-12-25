// VM Management - Main component for virtual machine management

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { VM, VMFilters, Region, VMSize } from '../types';
import { vmService, pricingService } from '../services';
import { VMDashboard } from './VMDashboard';
import { VMCreationModal } from './VMCreationModal';
import { ConnectionModal } from './ConnectionModal';
import { EnhancedCard } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';

interface VMManagementProps {
  user: {
    id: string;
    email: string;
    full_name: string;
  };
}

export const VMManagement: React.FC<VMManagementProps> = ({ user }) => {
  const [vms, setVMs] = useState<VM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedVM, setSelectedVM] = useState<VM | null>(null);
  const [filters, setFilters] = useState<VMFilters>({});
  const [availableRegions, setAvailableRegions] = useState<Region[]>([]);
  const [availableSizes, setAvailableSizes] = useState<VMSize[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [user.id]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load VMs and configuration options in parallel
      const [vmList, regions, sizes] = await Promise.all([
        vmService.getVMList(user.id),
        vmService.getAvailableRegions(),
        vmService.getAvailableSizes(),
      ]);

      setVMs(vmList);
      setAvailableRegions(regions);
      setAvailableSizes(sizes);
    } catch (err) {
      console.error('Error loading VM data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load VM data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const vmList = await vmService.getVMList(user.id);
      setVMs(vmList);
    } catch (err) {
      console.error('Error refreshing VMs:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh VM data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateVM = () => {
    setShowCreateModal(true);
  };

  const handleVMCreated = (newVM: VM) => {
    setVMs(prev => [...prev, newVM]);
    setShowCreateModal(false);
  };

  const handleConnectVM = (vmId: string, method: 'rdp' | 'browser') => {
    const vm = vms.find(v => v.id === vmId);
    if (vm) {
      setSelectedVM(vm);
      setShowConnectionModal(true);
    }
  };

  const handleDeleteVM = async (vmId: string) => {
    if (!confirm('Are you sure you want to delete this VM? This action cannot be undone.')) {
      return;
    }

    try {
      await vmService.deleteVM(vmId);
      setVMs(prev => prev.filter(vm => vm.id !== vmId));
    } catch (err) {
      console.error('Error deleting VM:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete VM');
    }
  };

  const handleFiltersChange = (newFilters: VMFilters) => {
    setFilters(newFilters);
  };

  // Filter VMs based on current filters
  const filteredVMs = vms.filter(vm => {
    if (filters.status && vm.status !== filters.status) {
      return false;
    }
    if (filters.osType && vm.configuration.operatingSystem.type !== filters.osType) {
      return false;
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        vm.name.toLowerCase().includes(query) ||
        vm.configuration.operatingSystem.type.toLowerCase().includes(query) ||
        vm.configuration.operatingSystem.version.toLowerCase().includes(query) ||
        vm.configuration.region.country.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <EnhancedCard className="glass-card">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading virtual machines...</p>
          </div>
        </div>
      </EnhancedCard>
    );
  }

  if (error) {
    return (
      <EnhancedCard className="glass-card border-red-200 bg-red-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-red-800">Error Loading VMs</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
          <EnhancedButton
            onClick={loadInitialData}
            className="bg-red-600 hover:bg-red-700"
          >
            Retry
          </EnhancedButton>
        </div>
      </EnhancedCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Virtual Machines
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your virtual machines and computing resources
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <EnhancedButton
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </EnhancedButton>
          <EnhancedButton
            onClick={handleCreateVM}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create VM</span>
          </EnhancedButton>
        </div>
      </div>

      {/* VM Dashboard */}
      <VMDashboard
        vms={filteredVMs}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onConnect={handleConnectVM}
        onDelete={handleDeleteVM}
        loading={refreshing}
      />

      {/* VM Creation Modal */}
      {showCreateModal && (
        <VMCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleVMCreated}
          availableRegions={availableRegions}
          availableSizes={availableSizes}
          userId={user.id}
        />
      )}

      {/* Connection Modal */}
      {showConnectionModal && selectedVM && (
        <ConnectionModal
          isOpen={showConnectionModal}
          onClose={() => {
            setShowConnectionModal(false);
            setSelectedVM(null);
          }}
          vm={selectedVM}
        />
      )}
    </div>
  );
};

export default VMManagement;