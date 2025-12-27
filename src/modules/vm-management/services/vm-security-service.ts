// VM Security Service - Enhanced security group and access management

import { 
  EC2Client,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  RevokeSecurityGroupIngressCommand,
  DeleteSecurityGroupCommand,
  DescribeSecurityGroupsCommand,
  CreateTagsCommand
} from '@aws-sdk/client-ec2';
import { AWS_CONFIG } from '../config/aws-config';
import { AWSErrorHandler, VMError } from '../utils/aws-error-handler';
import { z } from 'zod';

// Security rule validation schemas
export const SecurityRuleSchema = z.object({
  protocol: z.enum(['tcp', 'udp', 'icmp']),
  port: z.number().int().min(1).max(65535),
  sourceIp: z.string().ip().optional(),
  sourceCidr: z.string().optional(),
  description: z.string().min(1).max(255)
});

export const SecurityGroupConfigSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(255),
  vpcId: z.string().min(1),
  rules: z.array(SecurityRuleSchema),
  tags: z.record(z.string()).optional()
});

export type SecurityRule = z.infer<typeof SecurityRuleSchema>;
export type SecurityGroupConfig = z.infer<typeof SecurityGroupConfigSchema>;

export interface SecurityGroupInfo {
  groupId: string;
  name: string;
  description: string;
  vpcId: string;
  rules: SecurityRule[];
  tags: Record<string, string>;
}

export class VMSecurityService {
  private ec2Client: EC2Client;

  constructor() {
    const region = process.env.AWS_DEFAULT_REGION || 'us-east-1';
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials are required for security service');
    }

    this.ec2Client = new EC2Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }

  /**
   * Create a security group for a VM with appropriate rules
   */
  async createVMSecurityGroup(vmConfig: {
    vmId: string;
    vmName: string;
    userId: string;
    operatingSystem: string;
    allowedIPs?: string[];
  }): Promise<SecurityGroupInfo> {
    try {
      const groupName = `vm-${vmConfig.vmName}-${Date.now()}`;
      const vpcId = await this.getDefaultVpcId();

      // Determine rules based on operating system
      const rules = this.getDefaultRulesForOS(vmConfig.operatingSystem, vmConfig.allowedIPs);

      const securityGroupConfig: SecurityGroupConfig = {
        name: groupName,
        description: `Security group for VM ${vmConfig.vmName} (${vmConfig.vmId})`,
        vpcId,
        rules,
        tags: {
          Name: groupName,
          VMId: vmConfig.vmId,
          VMName: vmConfig.vmName,
          UserId: vmConfig.userId,
          ManagedBy: 'Adiology',
          Environment: 'production',
          CreatedAt: new Date().toISOString()
        }
      };

      return await this.createSecurityGroup(securityGroupConfig);

    } catch (error) {
      const securityError = AWSErrorHandler.handleEC2Error(error);
      AWSErrorHandler.logError(securityError, { vmId: vmConfig.vmId, operation: 'createSecurityGroup' });
      throw securityError;
    }
  }

  /**
   * Create a security group with specified configuration
   */
  async createSecurityGroup(config: SecurityGroupConfig): Promise<SecurityGroupInfo> {
    const validatedConfig = SecurityGroupConfigSchema.parse(config);

    try {
      // Create security group
      const createSGCommand = new CreateSecurityGroupCommand({
        GroupName: validatedConfig.name,
        Description: validatedConfig.description,
        VpcId: validatedConfig.vpcId
      });

      const sgResponse = await this.ec2Client.send(createSGCommand);
      const groupId = sgResponse.GroupId!;

      // Add tags
      if (validatedConfig.tags && Object.keys(validatedConfig.tags).length > 0) {
        await this.addTagsToSecurityGroup(groupId, validatedConfig.tags);
      }

      // Add ingress rules
      if (validatedConfig.rules.length > 0) {
        await this.addIngressRules(groupId, validatedConfig.rules);
      }

      return {
        groupId,
        name: validatedConfig.name,
        description: validatedConfig.description,
        vpcId: validatedConfig.vpcId,
        rules: validatedConfig.rules,
        tags: validatedConfig.tags || {}
      };

    } catch (error) {
      throw AWSErrorHandler.handleEC2Error(error);
    }
  }

  /**
   * Add ingress rules to a security group
   */
  async addIngressRules(groupId: string, rules: SecurityRule[]): Promise<void> {
    try {
      const ipPermissions = rules.map(rule => ({
        IpProtocol: rule.protocol,
        FromPort: rule.port,
        ToPort: rule.port,
        IpRanges: [{
          CidrIp: rule.sourceCidr || (rule.sourceIp ? `${rule.sourceIp}/32` : '0.0.0.0/0'),
          Description: rule.description
        }]
      }));

      const command = new AuthorizeSecurityGroupIngressCommand({
        GroupId: groupId,
        IpPermissions: ipPermissions
      });

      await this.ec2Client.send(command);

    } catch (error) {
      throw AWSErrorHandler.handleEC2Error(error);
    }
  }

  /**
   * Remove ingress rules from a security group
   */
  async removeIngressRules(groupId: string, rules: SecurityRule[]): Promise<void> {
    try {
      const ipPermissions = rules.map(rule => ({
        IpProtocol: rule.protocol,
        FromPort: rule.port,
        ToPort: rule.port,
        IpRanges: [{
          CidrIp: rule.sourceCidr || (rule.sourceIp ? `${rule.sourceIp}/32` : '0.0.0.0/0')
        }]
      }));

      const command = new RevokeSecurityGroupIngressCommand({
        GroupId: groupId,
        IpPermissions: ipPermissions
      });

      await this.ec2Client.send(command);

    } catch (error) {
      throw AWSErrorHandler.handleEC2Error(error);
    }
  }

  /**
   * Update security group rules (replace existing rules)
   */
  async updateSecurityGroupRules(groupId: string, newRules: SecurityRule[]): Promise<SecurityGroupInfo> {
    try {
      // Get current security group info
      const currentSG = await this.getSecurityGroupInfo(groupId);
      
      // Remove existing rules
      if (currentSG.rules.length > 0) {
        await this.removeIngressRules(groupId, currentSG.rules);
      }

      // Add new rules
      if (newRules.length > 0) {
        await this.addIngressRules(groupId, newRules);
      }

      // Return updated info
      return await this.getSecurityGroupInfo(groupId);

    } catch (error) {
      throw AWSErrorHandler.handleEC2Error(error);
    }
  }

  /**
   * Get security group information
   */
  async getSecurityGroupInfo(groupId: string): Promise<SecurityGroupInfo> {
    try {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [groupId]
      });

      const response = await this.ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];

      if (!sg) {
        throw new VMError('SECURITY_GROUP_NOT_FOUND', `Security group ${groupId} not found`);
      }

      // Convert AWS format to our format
      const rules: SecurityRule[] = sg.IpPermissions?.map(permission => ({
        protocol: permission.IpProtocol as 'tcp' | 'udp' | 'icmp',
        port: permission.FromPort || 0,
        sourceCidr: permission.IpRanges?.[0]?.CidrIp || '0.0.0.0/0',
        description: permission.IpRanges?.[0]?.Description || 'No description'
      })) || [];

      const tags: Record<string, string> = {};
      sg.Tags?.forEach(tag => {
        if (tag.Key && tag.Value) {
          tags[tag.Key] = tag.Value;
        }
      });

      return {
        groupId: sg.GroupId!,
        name: sg.GroupName!,
        description: sg.Description!,
        vpcId: sg.VpcId!,
        rules,
        tags
      };

    } catch (error) {
      throw AWSErrorHandler.handleEC2Error(error);
    }
  }

  /**
   * Delete a security group
   */
  async deleteSecurityGroup(groupId: string): Promise<void> {
    try {
      const command = new DeleteSecurityGroupCommand({
        GroupId: groupId
      });

      await this.ec2Client.send(command);

    } catch (error) {
      // Don't throw error if security group doesn't exist
      if (error.name === 'InvalidGroup.NotFound') {
        return;
      }
      throw AWSErrorHandler.handleEC2Error(error);
    }
  }

  /**
   * Add IP address to VM's security group (for dynamic access control)
   */
  async allowIPAccess(groupId: string, ipAddress: string, operatingSystem: string, description?: string): Promise<void> {
    try {
      const rules = this.getDefaultRulesForOS(operatingSystem, [ipAddress]);
      
      // Update description to include IP
      const rulesWithDescription = rules.map(rule => ({
        ...rule,
        description: description || `Access for ${ipAddress} - ${rule.description}`
      }));

      await this.addIngressRules(groupId, rulesWithDescription);

    } catch (error) {
      throw AWSErrorHandler.handleEC2Error(error);
    }
  }

  /**
   * Remove IP address from VM's security group
   */
  async revokeIPAccess(groupId: string, ipAddress: string, operatingSystem: string): Promise<void> {
    try {
      const rules = this.getDefaultRulesForOS(operatingSystem, [ipAddress]);
      await this.removeIngressRules(groupId, rules);

    } catch (error) {
      throw AWSErrorHandler.handleEC2Error(error);
    }
  }

  /**
   * Get security recommendations for a VM
   */
  getSecurityRecommendations(operatingSystem: string, currentRules: SecurityRule[]): {
    recommendations: string[];
    warnings: string[];
    score: number;
  } {
    const recommendations: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check for overly permissive rules
    const openToWorldRules = currentRules.filter(rule => 
      rule.sourceCidr === '0.0.0.0/0' || rule.sourceCidr?.includes('/0')
    );

    if (openToWorldRules.length > 0) {
      warnings.push(`${openToWorldRules.length} rule(s) allow access from anywhere (0.0.0.0/0)`);
      recommendations.push('Restrict access to specific IP addresses or ranges');
      score -= 20;
    }

    // Check for unnecessary ports
    const unnecessaryPorts = currentRules.filter(rule => {
      if (operatingSystem.startsWith('windows')) {
        return rule.port !== 3389; // Only RDP should be open for Windows
      } else {
        return rule.port !== 22; // Only SSH should be open for Linux
      }
    });

    if (unnecessaryPorts.length > 0) {
      warnings.push(`${unnecessaryPorts.length} unnecessary port(s) are open`);
      recommendations.push('Close unused ports to reduce attack surface');
      score -= 15;
    }

    // Check for missing essential rules
    const hasEssentialPort = currentRules.some(rule => {
      if (operatingSystem.startsWith('windows')) {
        return rule.port === 3389;
      } else {
        return rule.port === 22;
      }
    });

    if (!hasEssentialPort) {
      warnings.push('Essential access port is not configured');
      recommendations.push(`Configure ${operatingSystem.startsWith('windows') ? 'RDP (3389)' : 'SSH (22)'} access`);
      score -= 30;
    }

    // General recommendations
    if (score === 100) {
      recommendations.push('Security configuration looks good!');
    } else {
      recommendations.push('Consider implementing IP whitelisting');
      recommendations.push('Regularly review and audit security group rules');
      recommendations.push('Use VPN or bastion hosts for enhanced security');
    }

    return {
      recommendations,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Get default security rules for an operating system
   */
  private getDefaultRulesForOS(operatingSystem: string, allowedIPs?: string[]): SecurityRule[] {
    const rules: SecurityRule[] = [];
    const sourceIPs = allowedIPs || ['0.0.0.0/0'];

    if (operatingSystem.startsWith('windows')) {
      // Windows - RDP access
      sourceIPs.forEach(ip => {
        rules.push({
          protocol: 'tcp',
          port: 3389,
          sourceCidr: ip.includes('/') ? ip : `${ip}/32`,
          description: `RDP access from ${ip}`
        });
      });
    } else {
      // Linux - SSH access
      sourceIPs.forEach(ip => {
        rules.push({
          protocol: 'tcp',
          port: 22,
          sourceCidr: ip.includes('/') ? ip : `${ip}/32`,
          description: `SSH access from ${ip}`
        });
      });
    }

    return rules;
  }

  /**
   * Get default VPC ID
   */
  private async getDefaultVpcId(): Promise<string> {
    try {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'group-name',
            Values: ['default']
          }
        ]
      });

      const response = await this.ec2Client.send(command);
      const defaultSG = response.SecurityGroups?.[0];

      if (!defaultSG?.VpcId) {
        throw new VMError('VPC_NOT_FOUND', 'No default VPC found');
      }

      return defaultSG.VpcId;

    } catch (error) {
      throw AWSErrorHandler.handleEC2Error(error);
    }
  }

  /**
   * Add tags to security group
   */
  private async addTagsToSecurityGroup(groupId: string, tags: Record<string, string>): Promise<void> {
    try {
      const tagArray = Object.entries(tags).map(([key, value]) => ({
        Key: key,
        Value: value
      }));

      const command = new CreateTagsCommand({
        Resources: [groupId],
        Tags: tagArray
      });

      await this.ec2Client.send(command);

    } catch (error) {
      // Don't fail the entire operation if tagging fails
      console.warn('Failed to add tags to security group:', error);
    }
  }
}