// Connection Modal - Handle VM connection methods

import React, { useState } from 'react';
import { X, Monitor, Download, AlertCircle, ExternalLink } from 'lucide-react';
import { VM, ConnectionMethod } from '../types';
import { connectionService } from '../services';
import { EnhancedCard } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  vm: VM;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  vm,
}) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<ConnectionMethod | null>(null);

  const handleConnect = async (method: ConnectionMethod) => {
    try {
      setConnecting(true);
      setError(null);
      setSelectedMethod(method);

      if (method === 'rdp') {
        // Generate and download RDP file
        const rdpBlob = await connectionService.generateRDPFile(vm.id);
        connectionService.downloadRDPFile(rdpBlob, vm.name);
      } else if (method === 'browser') {
        // Open browser connection
        const browserURL = await connectionService.getBrowserConnectionURL(vm.id);
        connectionService.openBrowserConnection(browserURL);
      }

      // Close modal after successful connection
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to VM');
    } finally {
      setConnecting(false);
      setSelectedMethod(null);
    }
  };

  const isVMRunning = vm.status === 'running';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <EnhancedCard className="glass-card max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Connect to VM
          </h2>
          <EnhancedButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </EnhancedButton>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* VM Info */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{vm.name}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                {vm.configuration.operatingSystem.type === 'windows' ? 'Windows' : 'Linux'}{' '}
                {vm.configuration.operatingSystem.version}
              </div>
              <div>
                {vm.configuration.size.cpu} CPU, {vm.configuration.size.ram}GB RAM
              </div>
              <div>Status: {vm.status}</div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50/50 backdrop-blur-sm border border-red-200/50 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Connection Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Connection Options */}
          {!isVMRunning ? (
            <div className="bg-yellow-50/50 backdrop-blur-sm border border-yellow-200/50 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">VM Not Running</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    This virtual machine is currently {vm.status}. You can only connect to running VMs.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Choose how you'd like to connect to your virtual machine:
              </p>

              {/* Browser Connection */}
              <EnhancedButton
                variant="outline"
                onClick={() => handleConnect('browser')}
                disabled={connecting}
                className="w-full flex items-center justify-between p-4 h-auto"
              >
                <div className="flex items-center">
                  <Monitor className="h-8 w-8 text-indigo-600 mr-4" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Browser Connection</div>
                    <div className="text-sm text-gray-600">
                      Connect directly in your web browser
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {connecting && selectedMethod === 'browser' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                  ) : (
                    <ExternalLink className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </EnhancedButton>

              {/* RDP Connection */}
              <EnhancedButton
                variant="outline"
                onClick={() => handleConnect('rdp')}
                disabled={connecting}
                className="w-full flex items-center justify-between p-4 h-auto"
              >
                <div className="flex items-center">
                  <Download className="h-8 w-8 text-green-600 mr-4" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">RDP Connection</div>
                    <div className="text-sm text-gray-600">
                      Download RDP file for desktop client
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {connecting && selectedMethod === 'rdp' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  ) : (
                    <Download className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </EnhancedButton>

              {/* Connection Info */}
              <div className="bg-blue-50/50 backdrop-blur-sm border border-blue-200/50 rounded-lg p-4 mt-6">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Connection Details</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>IP Address: {vm.connectionInfo.ipAddress}</div>
                  <div>RDP Port: {vm.connectionInfo.rdpPort}</div>
                  {vm.lastConnected && (
                    <div>
                      Last Connected: {new Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(vm.lastConnected)}
                    </div>
                  )}
                </div>
              </div>

              {/* RDP Instructions */}
              <div className="bg-gray-50/50 backdrop-blur-sm border border-gray-200/50 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2">RDP Client Instructions</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Windows:</strong> Double-click the downloaded .rdp file</div>
                  <div><strong>macOS:</strong> Open with Microsoft Remote Desktop app</div>
                  <div><strong>Linux:</strong> Use Remmina or similar RDP client</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-white/10">
          <EnhancedButton
            variant="outline"
            onClick={onClose}
          >
            Close
          </EnhancedButton>
        </div>
      </EnhancedCard>
    </div>
  );
};