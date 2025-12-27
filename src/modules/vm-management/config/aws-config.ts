// AWS Configuration and Constants for VM Management

export const AWS_CONFIG = {
  // Default region configuration
  DEFAULT_REGION: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  
  // Available regions for VM deployment
  AVAILABLE_REGIONS: [
    {
      id: 'us-east-1',
      name: 'US East (N. Virginia)',
      location: 'Virginia, USA',
      priceMultiplier: 1.0
    },
    {
      id: 'us-west-2',
      name: 'US West (Oregon)',
      location: 'Oregon, USA',
      priceMultiplier: 1.05
    },
    {
      id: 'eu-west-1',
      name: 'Europe (Ireland)',
      location: 'Dublin, Ireland',
      priceMultiplier: 1.1
    },
    {
      id: 'ap-southeast-1',
      name: 'Asia Pacific (Singapore)',
      location: 'Singapore',
      priceMultiplier: 1.15
    }
  ],

  // Available instance types with pricing
  INSTANCE_TYPES: [
    {
      id: 't3.micro',
      name: 'Micro (1 vCPU, 1 GB RAM)',
      vcpus: 1,
      memory: 1,
      storage: 8,
      hourlyPriceCents: 104, // $0.0104/hour
      monthlyPriceCents: 7592, // ~$75.92/month
      category: 'General Purpose'
    },
    {
      id: 't3.small',
      name: 'Small (2 vCPUs, 2 GB RAM)',
      vcpus: 2,
      memory: 2,
      storage: 20,
      hourlyPriceCents: 208, // $0.0208/hour
      monthlyPriceCents: 15184, // ~$151.84/month
      category: 'General Purpose'
    },
    {
      id: 't3.medium',
      name: 'Medium (2 vCPUs, 4 GB RAM)',
      vcpus: 2,
      memory: 4,
      storage: 30,
      hourlyPriceCents: 416, // $0.0416/hour
      monthlyPriceCents: 30368, // ~$303.68/month
      category: 'General Purpose'
    },
    {
      id: 't3.large',
      name: 'Large (2 vCPUs, 8 GB RAM)',
      vcpus: 2,
      memory: 8,
      storage: 50,
      hourlyPriceCents: 832, // $0.0832/hour
      monthlyPriceCents: 60736, // ~$607.36/month
      category: 'General Purpose'
    },
    {
      id: 'm5.large',
      name: 'Balanced Large (2 vCPUs, 8 GB RAM)',
      vcpus: 2,
      memory: 8,
      storage: 50,
      hourlyPriceCents: 960, // $0.096/hour
      monthlyPriceCents: 70080, // ~$700.80/month
      category: 'Balanced'
    },
    {
      id: 'c5.large',
      name: 'Compute Optimized (2 vCPUs, 4 GB RAM)',
      vcpus: 2,
      memory: 4,
      storage: 30,
      hourlyPriceCents: 850, // $0.085/hour
      monthlyPriceCents: 62050, // ~$620.50/month
      category: 'Compute Optimized'
    }
  ],

  // Operating system configurations with AMI IDs
  OPERATING_SYSTEMS: [
    {
      id: 'windows-2022',
      name: 'Windows Server 2022',
      category: 'Windows',
      description: 'Latest Windows Server with full desktop experience',
      amiIds: {
        'us-east-1': 'ami-0c02fb55956c7d316', // Example AMI ID
        'us-west-2': 'ami-0892d3c7ee96c0bf7',
        'eu-west-1': 'ami-0a8e758f5e873d1c1',
        'ap-southeast-1': 'ami-0df7a207adb9748c7'
      },
      defaultUsername: 'Administrator',
      connectionType: 'rdp',
      minStorageGb: 30,
      additionalCostCents: 1000 // $10/month Windows license
    },
    {
      id: 'windows-2019',
      name: 'Windows Server 2019',
      category: 'Windows',
      description: 'Stable Windows Server for enterprise applications',
      amiIds: {
        'us-east-1': 'ami-0b69ea66ff7391e80',
        'us-west-2': 'ami-0ceecbb0f30a902a6',
        'eu-west-1': 'ami-0ff760d16d9497662',
        'ap-southeast-1': 'ami-0ec225b5e01ccb706'
      },
      defaultUsername: 'Administrator',
      connectionType: 'rdp',
      minStorageGb: 30,
      additionalCostCents: 1000 // $10/month Windows license
    },
    {
      id: 'ubuntu-22.04',
      name: 'Ubuntu 22.04 LTS',
      category: 'Linux',
      description: 'Latest Ubuntu LTS with long-term support',
      amiIds: {
        'us-east-1': 'ami-0fc5d935ebf8bc3bc',
        'us-west-2': 'ami-008fe2fc65df48dac',
        'eu-west-1': 'ami-0694d931cee176e7d',
        'ap-southeast-1': 'ami-0df7a207adb9748c7'
      },
      defaultUsername: 'ubuntu',
      connectionType: 'ssh',
      minStorageGb: 8,
      additionalCostCents: 0 // Free
    },
    {
      id: 'ubuntu-20.04',
      name: 'Ubuntu 20.04 LTS',
      category: 'Linux',
      description: 'Stable Ubuntu LTS for production workloads',
      amiIds: {
        'us-east-1': 'ami-0885b1f6bd170450c',
        'us-west-2': 'ami-0892d3c7ee96c0bf7',
        'eu-west-1': 'ami-0a8e758f5e873d1c1',
        'ap-southeast-1': 'ami-0ec225b5e01ccb706'
      },
      defaultUsername: 'ubuntu',
      connectionType: 'ssh',
      minStorageGb: 8,
      additionalCostCents: 0 // Free
    },
    {
      id: 'amazon-linux-2',
      name: 'Amazon Linux 2',
      category: 'Linux',
      description: 'AWS-optimized Linux distribution',
      amiIds: {
        'us-east-1': 'ami-0abcdef1234567890',
        'us-west-2': 'ami-0abcdef1234567891',
        'eu-west-1': 'ami-0abcdef1234567892',
        'ap-southeast-1': 'ami-0abcdef1234567893'
      },
      defaultUsername: 'ec2-user',
      connectionType: 'ssh',
      minStorageGb: 8,
      additionalCostCents: 0 // Free
    },
    {
      id: 'centos-8',
      name: 'CentOS 8',
      category: 'Linux',
      description: 'Enterprise-class Linux distribution',
      amiIds: {
        'us-east-1': 'ami-0abcdef1234567894',
        'us-west-2': 'ami-0abcdef1234567895',
        'eu-west-1': 'ami-0abcdef1234567896',
        'ap-southeast-1': 'ami-0abcdef1234567897'
      },
      defaultUsername: 'centos',
      connectionType: 'ssh',
      minStorageGb: 10,
      additionalCostCents: 0 // Free
    }
  ],

  // Pricing configuration
  PRICING: {
    // Markup percentage for our service
    MARKUP_PERCENTAGE: parseFloat(process.env.VM_PRICING_MARKUP || '0.20'), // 20% markup
    
    // Additional fees
    CREATION_FEE_CENTS: 100, // $1.00 one-time setup fee
    STORAGE_COST_PER_GB_CENTS: 10, // $0.10/GB/month for additional storage
    
    // Billing configuration
    MINIMUM_BILLING_MINUTES: 60, // Minimum 1 hour billing
    BILLING_INTERVAL_MINUTES: 60, // Bill every hour
    
    // Free tier limits
    FREE_TIER_HOURS_PER_MONTH: 750, // AWS free tier equivalent
    FREE_TIER_INSTANCE_TYPES: ['t3.micro']
  },

  // Security configuration
  SECURITY: {
    // Default security group rules
    DEFAULT_INGRESS_RULES: {
      windows: [
        {
          protocol: 'tcp',
          port: 3389,
          description: 'RDP access'
        }
      ],
      linux: [
        {
          protocol: 'tcp',
          port: 22,
          description: 'SSH access'
        }
      ]
    },
    
    // Key pair configuration
    KEY_PAIR_TYPE: 'rsa',
    KEY_PAIR_FORMAT: 'pem',
    
    // Password requirements for Windows VMs
    PASSWORD_LENGTH: 16,
    PASSWORD_COMPLEXITY: true
  },

  // Monitoring configuration
  MONITORING: {
    // CloudWatch metrics collection interval
    METRICS_INTERVAL_SECONDS: 300, // 5 minutes
    
    // Health check configuration
    HEALTH_CHECK_INTERVAL_SECONDS: 300, // 5 minutes
    HEALTH_CHECK_TIMEOUT_SECONDS: 30,
    
    // Alerting thresholds
    CPU_ALERT_THRESHOLD: 80, // 80% CPU utilization
    MEMORY_ALERT_THRESHOLD: 85, // 85% memory utilization
    DISK_ALERT_THRESHOLD: 90 // 90% disk utilization
  },

  // Operational limits
  LIMITS: {
    // Per-user limits
    MAX_VMS_PER_USER: 10,
    MAX_CONCURRENT_OPERATIONS: 3,
    
    // Instance limits
    MAX_STORAGE_GB: 1000, // 1TB max storage per VM
    MIN_STORAGE_GB: 8,
    
    // Timeout configuration
    INSTANCE_START_TIMEOUT_MINUTES: 5,
    INSTANCE_STOP_TIMEOUT_MINUTES: 3,
    INSTANCE_CREATE_TIMEOUT_MINUTES: 10
  }
};

// Helper functions
export function getRegionByCode(regionCode: string) {
  return AWS_CONFIG.AVAILABLE_REGIONS.find(region => region.id === regionCode);
}

export function getInstanceTypeById(instanceTypeId: string) {
  return AWS_CONFIG.INSTANCE_TYPES.find(type => type.id === instanceTypeId);
}

export function getOperatingSystemById(osId: string) {
  return AWS_CONFIG.OPERATING_SYSTEMS.find(os => os.id === osId);
}

export function getAMIForRegion(osId: string, regionCode: string): string {
  const os = getOperatingSystemById(osId);
  if (!os) {
    throw new Error(`Operating system ${osId} not found`);
  }
  
  const amiId = os.amiIds[regionCode];
  if (!amiId) {
    throw new Error(`AMI not available for OS ${osId} in region ${regionCode}`);
  }
  
  return amiId;
}

export function calculateVMCost(instanceTypeId: string, regionCode: string, osId: string): {
  hourlyPriceCents: number;
  monthlyPriceCents: number;
} {
  const instanceType = getInstanceTypeById(instanceTypeId);
  const region = getRegionByCode(regionCode);
  const os = getOperatingSystemById(osId);
  
  if (!instanceType || !region || !os) {
    throw new Error('Invalid configuration for cost calculation');
  }
  
  const baseHourlyCost = instanceType.hourlyPriceCents;
  const regionMultiplier = region.priceMultiplier;
  const osAdditionalCost = os.additionalCostCents / 730; // Convert monthly to hourly
  const markup = 1 + AWS_CONFIG.PRICING.MARKUP_PERCENTAGE;
  
  const hourlyPriceCents = Math.round((baseHourlyCost * regionMultiplier + osAdditionalCost) * markup);
  const monthlyPriceCents = Math.round(hourlyPriceCents * 730); // 730 hours average per month
  
  return {
    hourlyPriceCents,
    monthlyPriceCents
  };
}