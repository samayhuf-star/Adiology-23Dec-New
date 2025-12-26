// VM Dashboard - Display and manage list of virtual machines

import React, { useState } from 'react';
import { Search, Filter, Trash2, Monitor, Download } from 'lucide-react';
import { VM, VMFilters, VMStatus, OSType } from '../types';
import { EnhancedCard, StatCard } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';
import { cn } from '../../../lib/utils';

interface VMDashboardProps {
  vms: VM[];
  filters: VMFilters;
  onFiltersChange: (filters: VMFilters) => void;
  onConnect: (vmId: string, method: 'rdp' | 'browser') => void;
  onDelete: (vmId: string) => void;
  loading?: boolean;
}

export const VMDashboard: React.FC<VMDashboardProps> = ({
  vms,
  filters,
  onFiltersChange,
  onConnect,
  onDelete,
  loading = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (query: string) => {
    onFiltersChange({ ...filters, searchQuery: query });
  };

  const handleStatusFilter = (status: VMStatus | undefined) => {
    onFiltersChange({ ...filters, status });
  };

  const handleOSFilter = (osType: OSType | undefined) => {
    onFiltersChange({ ...filters, osType });
  };

  const getStatusColor = (status: VMStatus) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'stopped':
        return 'bg-red-500';
      case 'creating':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: VMStatus) => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'stopped':
        return 'Stopped';
      case 'creating':
        return 'Creating';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <EnhancedCard className="glass-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search VMs by name, OS, or country..."
                value={filters.searchQuery || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </div>

            {/* Filter Toggle */}
            <EnhancedButton
              variant={showFilters ? "primary" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </EnhancedButton>
          </div>

          {/* VM Count */}
          <div className="text-sm text-gray-600 font-medium">
            {vms.length} VM{vms.length !== 1 ? 's' : ''}
          </div>
        </div>
      </EnhancedCard>

      {/* Filter Panel */}
      {showFilters && (
        <EnhancedCard className="glass-card animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleStatusFilter(e.target.value as VMStatus || undefined)}
                className="w-full bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">All Statuses</option>
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
                <option value="creating">Creating</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* OS Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operating System
              </label>
              <select
                value={filters.osType || ''}
                onChange={(e) => handleOSFilter(e.target.value as OSType || undefined)}
                className="w-full bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">All Operating Systems</option>
                <option value="windows">Windows</option>
                <option value="linux">Linux</option>
              </select>
            </div>
          </div>
        </EnhancedCard>
      )}

      {/* VM List */}
      {loading ? (
        <EnhancedCard className="glass-card">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </EnhancedCard>
      ) : vms.length === 0 ? (
        <EnhancedCard className="glass-card">
          <div className="text-center py-12">
            <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Virtual Machines</h3>
            <p className="text-gray-600">
              {filters.searchQuery || filters.status || filters.osType
                ? 'No VMs match your current filters.'
                : 'Get started by creating your first virtual machine.'}
            </p>
          </div>
        </EnhancedCard>
      ) : (
        <EnhancedCard className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Configuration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/30 backdrop-blur-sm divide-y divide-white/10">
                {vms.map((vm) => (
                  <tr key={vm.id} className="hover:bg-white/20 transition-colors duration-200 card-hover">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`h-3 w-3 rounded-full mr-3 ${getStatusColor(vm.status)} shimmer-effect`}
                          title={getStatusText(vm.status)}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vm.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getStatusText(vm.status)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {vm.configuration.operatingSystem.type === 'windows' ? 'Windows' : 'Linux'}{' '}
                        {vm.configuration.operatingSystem.version}
                      </div>
                      <div className="text-sm text-gray-500">
                        {vm.configuration.size.cpu} CPU, {vm.configuration.size.ram}GB RAM, {vm.configuration.size.storage}GB Storage
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vm.configuration.region.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(vm.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatPrice(vm.monthlyPrice)}/month
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {vm.status === 'running' && (
                          <>
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              onClick={() => onConnect(vm.id, 'browser')}
                              className="p-2"
                              title="Connect via Browser"
                            >
                              <Monitor className="h-4 w-4" />
                            </EnhancedButton>
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              onClick={() => onConnect(vm.id, 'rdp')}
                              className="p-2"
                              title="Download RDP"
                            >
                              <Download className="h-4 w-4" />
                            </EnhancedButton>
                          </>
                        )}
                        <EnhancedButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(vm.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete VM"
                        >
                          <Trash2 className="h-4 w-4" />
                        </EnhancedButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EnhancedCard>
      )}
    </div>
  );
};