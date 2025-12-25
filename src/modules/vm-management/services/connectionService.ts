// Connection Service - Handle VM connection methods (RDP and Browser)

import { ConnectionInfo, ConnectionMethod } from '../types';

class ConnectionService {
  private baseURL = '/api/vm-management';

  /**
   * Generate connection information for a VM
   */
  async generateConnection(vmId: string, method: ConnectionMethod): Promise<ConnectionInfo> {
    try {
      const response = await fetch(`${this.baseURL}/vms/${vmId}/connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate connection');
      }

      return data.connectionInfo;
    } catch (error) {
      console.error('Error generating connection:', error);
      throw error;
    }
  }

  /**
   * Generate RDP file for download
   */
  async generateRDPFile(vmId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseURL}/vms/${vmId}/rdp`);

      if (!response.ok) {
        throw new Error('Failed to generate RDP file');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating RDP file:', error);
      throw error;
    }
  }

  /**
   * Get browser connection URL
   */
  async getBrowserConnectionURL(vmId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/vms/${vmId}/browser-url`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get browser connection URL');
      }

      return data.url;
    } catch (error) {
      console.error('Error getting browser connection URL:', error);
      throw error;
    }
  }

  /**
   * Validate that a VM connection is available
   */
  async validateConnection(vmId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/vms/${vmId}/connection/validate`);
      const data = await response.json();

      return data.success && data.available;
    } catch (error) {
      console.error('Error validating connection:', error);
      return false;
    }
  }

  /**
   * Download RDP file with proper filename
   */
  downloadRDPFile(blob: Blob, vmName: string): void {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${vmName.replace(/[^a-zA-Z0-9]/g, '_')}.rdp`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading RDP file:', error);
      throw new Error('Failed to download RDP file');
    }
  }

  /**
   * Open browser connection in new tab
   */
  openBrowserConnection(url: string): void {
    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        throw new Error('Failed to open browser connection - popup blocked');
      }
    } catch (error) {
      console.error('Error opening browser connection:', error);
      throw error;
    }
  }

  /**
   * Create RDP file content manually (fallback)
   */
  createRDPFileContent(
    ipAddress: string,
    port: number,
    username: string,
    vmName: string
  ): string {
    return `screen mode id:i:2
use multimon:i:0
desktopwidth:i:1920
desktopheight:i:1080
session bpp:i:32
winposstr:s:0,3,0,0,800,600
compression:i:1
keyboardhook:i:2
audiocapturemode:i:0
videoplaybackmode:i:1
connection type:i:7
networkautodetect:i:1
bandwidthautodetect:i:1
displayconnectionbar:i:1
enableworkspacereconnect:i:0
disable wallpaper:i:0
allow font smoothing:i:0
allow desktop composition:i:0
disable full window drag:i:1
disable menu anims:i:1
disable themes:i:0
disable cursor setting:i:0
bitmapcachepersistenable:i:1
full address:s:${ipAddress}:${port}
audiomode:i:0
redirectprinters:i:1
redirectcomports:i:0
redirectsmartcards:i:1
redirectclipboard:i:1
redirectposdevices:i:0
autoreconnection enabled:i:1
authentication level:i:2
prompt for credentials:i:0
negotiate security layer:i:1
remoteapplicationmode:i:0
alternate shell:s:
shell working directory:s:
gatewayhostname:s:
gatewayusagemethod:i:4
gatewaycredentialssource:i:4
gatewayprofileusagemethod:i:0
promptcredentialonce:i:0
gatewaybrokeringtype:i:0
use redirection server name:i:0
rdgiskdcproxy:i:0
kdcproxyname:s:
username:s:${username}
drivestoredirect:s:`;
  }

  /**
   * Generate and download RDP file manually
   */
  generateAndDownloadRDP(
    ipAddress: string,
    port: number,
    username: string,
    vmName: string
  ): void {
    try {
      const rdpContent = this.createRDPFileContent(ipAddress, port, username, vmName);
      const blob = new Blob([rdpContent], { type: 'application/rdp' });
      this.downloadRDPFile(blob, vmName);
    } catch (error) {
      console.error('Error generating RDP file manually:', error);
      throw error;
    }
  }
}

export const connectionService = new ConnectionService();