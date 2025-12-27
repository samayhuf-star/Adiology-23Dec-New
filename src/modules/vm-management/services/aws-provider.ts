// AWS EC2 Provider Service - Real AWS integration for VM management

import { 
  EC2Client, 
  RunInstancesCommand, 
  DescribeInstancesCommand, 
  StartInstancesCommand, 
  StopInstancesCommand, 
  TerminateInstancesCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  DescribeVpcsCommand,
  CreateKeyPairCommand,
  DescribeInstanceStatusCommand,
  Instance,
  InstanceStateName
} from '@aws-sdk/client-ec2';

import { 
  CloudWatchClient, 
  GetMetricStatisticsCommand 
} from '@aws-sdk/client-cloudwatch';

// Types for VM provider interface
export interface VMCreationConfig {
  userId: string;
  name: string;
  description?: string;
  region: string;
  instanceType: string;
  operatingSystem: string;
  storageGb: number;
  amiId: string;
}

export interface VMInstance {
  instanceId: string;
  name: string;
  status: VMStatus;
  publicIp?: string;
  privateIp?: string;
  instanceType: string;
  region: string;
  launchTime: Date;
  tags: Record<string, string>;
}

export interface ConnectionInfo {
  publicIp: string;
  privateIp: string;
  rdpPort?: number;
  sshPort?: number;
  credentials: {
    username: string;
    password?: string;
    keyPairName?: string;
  };
}

export interface VMMetrics {
  cpuUtilization: number;
  memoryUtilization: number;
  networkIn: number;
  networkOut: number;
  diskReadOps: number;
  diskWriteOps: number;
  timestamp: Date;
}

export type VMStatus = 'creating' | 'running' | 'stopped' | 'terminated' | 'error';

export interface MetricsPeriod {
  startTime: Date;
  endTime: Date;
  period: string;
  metrics: string[];
}

export interface VMFilters {
  status?: VMStatus[];
  instanceTypes?: string[];
  tags?: Record<string, string>;
}

export interface SSHKeyPair {
  keyName: string;
  keyMaterial: string;
  keyFingerprint: string;
}

// VM Provider Service Interface
export interface VMProviderService {
  // Instance Management
  createInstance(config: VMCreationConfig): Promise<VMInstance>;
  startInstance(instanceId: string): Promise<void>;
  stopInstance(instanceId: string): Promise<void>;
  terminateInstance(instanceId: string): Promise<void>;
  
  // Status and Information
  getInstanceStatus(instanceId: string): Promise<VMStatus>;
  getInstanceInfo(instanceId: string): Promise<VMInstance>;
  listInstances(filters?: VMFilters): Promise<VMInstance[]>;
  
  // Connection Management
  getConnectionInfo(instanceId: string): Promise<ConnectionInfo>;
  generateRDPFile(instanceId: string): Promise<string>;
  createSSHKeyPair(keyName: string): Promise<SSHKeyPair>;
  
  // Monitoring
  getInstanceMetrics(instanceId: string, period: MetricsPeriod): Promise<VMMetrics>;
}

// AWS EC2 Service Implementation
export class AWSEC2Service implements VMProviderService {
  private ec2Client: EC2Client;
  private cloudWatchClient: CloudWatchClient;
  
  constructor() {
    const region = process.env.AWS_DEFAULT_REGION || 'us-east-1';
    
    // Validate AWS credentials are present
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials are required. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
    }
    
    const credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };

    this.ec2Client = new EC2Client({
      region,
      credentials
    });
    
    this.cloudWatchClient = new CloudWatchClient({
      region,
      credentials
    });
  }

  async createInstance(config: VMCreationConfig): Promise<VMInstance> {
    try {
      // 1. Create security group
      const securityGroup = await this.createSecurityGroup(config);
      
      // 2. Generate key pair for SSH (Linux) or get Windows credentials
      const credentials = await this.setupCredentials(config);
      
      // 3. Launch EC2 instance
      const runInstancesCommand = new RunInstancesCommand({
        ImageId: config.amiId,
        InstanceType: config.instanceType as any,
        MinCount: 1,
        MaxCount: 1,
        SecurityGroupIds: [securityGroup.GroupId!],
        KeyName: credentials.keyPairName,
        UserData: this.generateUserData(config),
        BlockDeviceMappings: [{
          DeviceName: '/dev/sda1',
          Ebs: {
            VolumeSize: config.storageGb,
            VolumeType: 'gp3',
            Encrypted: true
          }
        }],
        TagSpecifications: [{
          ResourceType: 'instance',
          Tags: [
            { Key: 'Name', Value: config.name },
            { Key: 'Owner', Value: config.userId },
            { Key: 'Environment', Value: 'production' },
            { Key: 'ManagedBy', Value: 'Adiology' }
          ]
        }]
      });
      
      const response = await this.ec2Client.send(runInstancesCommand);
      const instance = response.Instances![0];
      
      // 4. Wait for instance to be running
      await this.waitForInstanceRunning(instance.InstanceId!);
      
      // 5. Get final instance information
      return this.getInstanceInfo(instance.InstanceId!);
    } catch (error) {
      console.error('Error creating AWS instance:', error);
      throw new Error(`Failed to create AWS instance: ${error}`);
    }
  }

  async startInstance(instanceId: string): Promise<void> {
    try {
      const command = new StartInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      await this.ec2Client.send(command);
      await this.waitForInstanceRunning(instanceId);
    } catch (error) {
      console.error('Error starting AWS instance:', error);
      throw new Error(`Failed to start AWS instance: ${error}`);
    }
  }

  async stopInstance(instanceId: string): Promise<void> {
    try {
      const command = new StopInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      await this.ec2Client.send(command);
      await this.waitForInstanceStopped(instanceId);
    } catch (error) {
      console.error('Error stopping AWS instance:', error);
      throw new Error(`Failed to stop AWS instance: ${error}`);
    }
  }

  async terminateInstance(instanceId: string): Promise<void> {
    try {
      const command = new TerminateInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      await this.ec2Client.send(command);
    } catch (error) {
      console.error('Error terminating AWS instance:', error);
      throw new Error(`Failed to terminate AWS instance: ${error}`);
    }
  }

  async getInstanceStatus(instanceId: string): Promise<VMStatus> {
    try {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      const response = await this.ec2Client.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];
      
      if (!instance) {
        throw new Error('Instance not found');
      }
      
      return this.mapAWSStatusToVMStatus(instance.State?.Name as InstanceStateName);
    } catch (error) {
      console.error('Error getting AWS instance status:', error);
      throw new Error(`Failed to get AWS instance status: ${error}`);
    }
  }

  async getInstanceInfo(instanceId: string): Promise<VMInstance> {
    try {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      const response = await this.ec2Client.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];
      
      if (!instance) {
        throw new Error('Instance not found');
      }
      
      return this.mapAWSInstanceToVMInstance(instance);
    } catch (error) {
      console.error('Error getting AWS instance info:', error);
      throw new Error(`Failed to get AWS instance info: ${error}`);
    }
  }

  async listInstances(filters?: VMFilters): Promise<VMInstance[]> {
    try {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'tag:ManagedBy',
            Values: ['Adiology']
          }
        ]
      });
      
      const response = await this.ec2Client.send(command);
      const instances: VMInstance[] = [];
      
      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          instances.push(this.mapAWSInstanceToVMInstance(instance));
        }
      }
      
      return instances;
    } catch (error) {
      console.error('Error listing AWS instances:', error);
      throw new Error(`Failed to list AWS instances: ${error}`);
    }
  }

  async getConnectionInfo(instanceId: string): Promise<ConnectionInfo> {
    try {
      const instance = await this.getInstanceInfo(instanceId);
      
      return {
        publicIp: instance.publicIp || '',
        privateIp: instance.privateIp || '',
        rdpPort: 3389,
        sshPort: 22,
        credentials: {
          username: 'administrator', // Will be configurable based on OS
          keyPairName: `vm-${instanceId}-key`
        }
      };
    } catch (error) {
      console.error('Error getting connection info:', error);
      throw new Error(`Failed to get connection info: ${error}`);
    }
  }

  async generateRDPFile(instanceId: string): Promise<string> {
    try {
      const connectionInfo = await this.getConnectionInfo(instanceId);
      
      const rdpContent = `
full address:s:${connectionInfo.publicIp}:${connectionInfo.rdpPort || 3389}
username:s:${connectionInfo.credentials.username}
screen mode id:i:2
use multimon:i:0
desktopwidth:i:1920
desktopheight:i:1080
session bpp:i:32
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
      `.trim();
      
      return rdpContent;
    } catch (error) {
      console.error('Error generating RDP file:', error);
      throw new Error(`Failed to generate RDP file: ${error}`);
    }
  }

  async createSSHKeyPair(keyName: string): Promise<SSHKeyPair> {
    try {
      const command = new CreateKeyPairCommand({
        KeyName: keyName,
        KeyType: 'rsa',
        KeyFormat: 'pem'
      });
      
      const response = await this.ec2Client.send(command);
      
      return {
        keyName: response.KeyName!,
        keyMaterial: response.KeyMaterial!,
        keyFingerprint: response.KeyFingerprint!
      };
    } catch (error) {
      console.error('Error creating SSH key pair:', error);
      throw new Error(`Failed to create SSH key pair: ${error}`);
    }
  }

  async getInstanceMetrics(instanceId: string, period: MetricsPeriod): Promise<VMMetrics> {
    try {
      const cpuCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        Dimensions: [
          {
            Name: 'InstanceId',
            Value: instanceId
          }
        ],
        StartTime: period.startTime,
        EndTime: period.endTime,
        Period: 300, // 5 minutes
        Statistics: ['Average']
      });
      
      const cpuResponse = await this.cloudWatchClient.send(cpuCommand);
      const latestCpuDatapoint = cpuResponse.Datapoints?.[cpuResponse.Datapoints.length - 1];
      
      return {
        cpuUtilization: latestCpuDatapoint?.Average || 0,
        memoryUtilization: 0, // Would need CloudWatch agent for memory metrics
        networkIn: 0,
        networkOut: 0,
        diskReadOps: 0,
        diskWriteOps: 0,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting instance metrics:', error);
      throw new Error(`Failed to get instance metrics: ${error}`);
    }
  }

  // Private helper methods
  private async createSecurityGroup(config: VMCreationConfig) {
    const groupName = `vm-${config.name}-${Date.now()}`;
    const vpcId = await this.getDefaultVpcId();
    
    const createSGCommand = new CreateSecurityGroupCommand({
      GroupName: groupName,
      Description: `Security group for VM ${config.name}`,
      VpcId: vpcId
    });
    
    const sgResponse = await this.ec2Client.send(createSGCommand);
    
    // Configure security group rules based on OS
    const rules = config.operatingSystem.startsWith('windows') 
      ? [{ IpProtocol: 'tcp', FromPort: 3389, ToPort: 3389, CidrIp: '0.0.0.0/0' }] // RDP
      : [{ IpProtocol: 'tcp', FromPort: 22, ToPort: 22, CidrIp: '0.0.0.0/0' }];     // SSH
    
    await this.ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
      GroupId: sgResponse.GroupId,
      IpPermissions: rules.map(rule => ({
        IpProtocol: rule.IpProtocol,
        FromPort: rule.FromPort,
        ToPort: rule.ToPort,
        IpRanges: [{ CidrIp: rule.CidrIp }]
      }))
    }));
    
    return sgResponse;
  }

  private async getDefaultVpcId(): Promise<string> {
    const command = new DescribeVpcsCommand({
      Filters: [
        {
          Name: 'is-default',
          Values: ['true']
        }
      ]
    });
    
    const response = await this.ec2Client.send(command);
    const defaultVpc = response.Vpcs?.[0];
    
    if (!defaultVpc) {
      throw new Error('No default VPC found');
    }
    
    return defaultVpc.VpcId!;
  }

  private async setupCredentials(config: VMCreationConfig) {
    const keyName = `vm-${config.name}-${Date.now()}`;
    
    if (config.operatingSystem.startsWith('windows')) {
      // For Windows, we'll use password authentication
      return {
        keyPairName: undefined,
        username: 'Administrator',
        password: this.generateSecurePassword()
      };
    } else {
      // For Linux, create SSH key pair
      const keyPair = await this.createSSHKeyPair(keyName);
      return {
        keyPairName: keyPair.keyName,
        username: 'ubuntu',
        keyMaterial: keyPair.keyMaterial
      };
    }
  }

  private generateUserData(config: VMCreationConfig): string {
    if (config.operatingSystem.startsWith('windows')) {
      // Windows PowerShell script for initial setup
      return Buffer.from(`
<powershell>
# Enable RDP
Set-ItemProperty -Path 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server' -name "fDenyTSConnections" -Value 0
Enable-NetFirewallRule -DisplayGroup "Remote Desktop"

# Set Administrator password
net user Administrator "${this.generateSecurePassword()}" /active:yes

# Install CloudWatch agent (optional)
# Invoke-WebRequest -Uri "https://s3.amazonaws.com/amazoncloudwatch-agent/windows/amd64/latest/amazon-cloudwatch-agent.msi" -OutFile "C:\\amazon-cloudwatch-agent.msi"
# Start-Process msiexec.exe -Wait -ArgumentList '/I C:\\amazon-cloudwatch-agent.msi /quiet'
</powershell>
      `).toString('base64');
    } else {
      // Linux bash script for initial setup
      return Buffer.from(`#!/bin/bash
# Update system
apt-get update -y

# Install CloudWatch agent (optional)
# wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
# dpkg -i -E ./amazon-cloudwatch-agent.deb

# Configure SSH
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Install Docker (optional)
# curl -fsSL https://get.docker.com -o get-docker.sh
# sh get-docker.sh
      `).toString('base64');
    }
  }

  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private async waitForInstanceRunning(instanceId: string): Promise<void> {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await this.getInstanceStatus(instanceId);
      
      if (status === 'running') {
        return;
      }
      
      if (status === 'error' || status === 'terminated') {
        throw new Error(`Instance ${instanceId} failed to start: ${status}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
    }
    
    throw new Error(`Instance ${instanceId} did not start within 5 minutes`);
  }

  private async waitForInstanceStopped(instanceId: string): Promise<void> {
    const maxAttempts = 20; // 3+ minutes max
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await this.getInstanceStatus(instanceId);
      
      if (status === 'stopped') {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
    }
    
    throw new Error(`Instance ${instanceId} did not stop within 3 minutes`);
  }

  private mapAWSStatusToVMStatus(awsStatus: InstanceStateName): VMStatus {
    switch (awsStatus) {
      case 'pending':
        return 'creating';
      case 'running':
        return 'running';
      case 'stopped':
      case 'stopping':
        return 'stopped';
      case 'terminated':
      case 'terminating':
        return 'terminated';
      case 'shutting-down':
        return 'stopped';
      default:
        return 'error';
    }
  }

  private mapAWSInstanceToVMInstance(instance: Instance): VMInstance {
    const tags: Record<string, string> = {};
    instance.Tags?.forEach(tag => {
      if (tag.Key && tag.Value) {
        tags[tag.Key] = tag.Value;
      }
    });

    return {
      instanceId: instance.InstanceId!,
      name: tags.Name || instance.InstanceId!,
      status: this.mapAWSStatusToVMStatus(instance.State?.Name as InstanceStateName),
      publicIp: instance.PublicIpAddress,
      privateIp: instance.PrivateIpAddress,
      instanceType: instance.InstanceType!,
      region: instance.Placement?.AvailabilityZone?.slice(0, -1) || 'us-east-1',
      launchTime: instance.LaunchTime || new Date(),
      tags
    };
  }
}

// Export singleton instance factory
let awsProviderInstance: AWSEC2Service | null = null;

export function getAWSProvider(): AWSEC2Service {
  if (!awsProviderInstance) {
    awsProviderInstance = new AWSEC2Service();
  }
  return awsProviderInstance;
}

// For testing purposes, allow resetting the singleton
export function resetAWSProvider(): void {
  awsProviderInstance = null;
}