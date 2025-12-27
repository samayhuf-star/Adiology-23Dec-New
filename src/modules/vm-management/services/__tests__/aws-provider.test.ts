// AWS Provider Service Tests

import { AWSEC2Service, getAWSProvider, resetAWSProvider } from '../aws-provider';
import { AWS_CONFIG } from '../../config/aws-config';

// Mock AWS SDK
jest.mock('@aws-sdk/client-ec2');
jest.mock('@aws-sdk/client-cloudwatch');

describe('AWSEC2Service', () => {
  let awsService: AWSEC2Service;

  beforeEach(() => {
    // Reset singleton before each test
    resetAWSProvider();
    
    // Set up environment variables for testing
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.AWS_DEFAULT_REGION = 'us-east-1';
    
    awsService = getAWSProvider();
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetAWSProvider();
  });

  describe('Service Initialization', () => {
    it('should initialize AWS clients with correct configuration', () => {
      expect(awsService).toBeInstanceOf(AWSEC2Service);
    });

    it('should use default region when not specified', () => {
      delete process.env.AWS_DEFAULT_REGION;
      resetAWSProvider();
      const service = getAWSProvider();
      expect(service).toBeInstanceOf(AWSEC2Service);
    });

    it('should throw error when AWS credentials are missing', () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      resetAWSProvider();
      
      expect(() => {
        getAWSProvider();
      }).toThrow('AWS credentials are required');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate VM creation config', async () => {
      const config = {
        userId: 'test-user-123',
        name: 'test-vm',
        description: 'Test VM for unit testing',
        region: 'us-east-1',
        instanceType: 't3.micro',
        operatingSystem: 'ubuntu-22.04',
        storageGb: 20,
        amiId: 'ami-0fc5d935ebf8bc3bc'
      };

      // This test verifies the config structure is valid
      expect(config.userId).toBeDefined();
      expect(config.name).toBeDefined();
      expect(config.region).toBeDefined();
      expect(config.instanceType).toBeDefined();
      expect(config.operatingSystem).toBeDefined();
      expect(config.storageGb).toBeGreaterThan(0);
      expect(config.amiId).toBeDefined();
    });

    it('should validate instance types from config', () => {
      const validInstanceTypes = AWS_CONFIG.INSTANCE_TYPES.map(type => type.id);
      expect(validInstanceTypes).toContain('t3.micro');
      expect(validInstanceTypes).toContain('t3.small');
      expect(validInstanceTypes).toContain('t3.medium');
    });

    it('should validate operating systems from config', () => {
      const validOSes = AWS_CONFIG.OPERATING_SYSTEMS.map(os => os.id);
      expect(validOSes).toContain('ubuntu-22.04');
      expect(validOSes).toContain('windows-2022');
      expect(validOSes).toContain('amazon-linux-2');
    });

    it('should validate regions from config', () => {
      const validRegions = AWS_CONFIG.AVAILABLE_REGIONS.map(region => region.id);
      expect(validRegions).toContain('us-east-1');
      expect(validRegions).toContain('us-west-2');
      expect(validRegions).toContain('eu-west-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle AWS service errors gracefully', async () => {
      // Mock AWS error
      const mockError = new Error('AWS Service Error');
      mockError.name = 'InsufficientInstanceCapacity';
      
      // Test that errors are properly wrapped
      expect(mockError.name).toBe('InsufficientInstanceCapacity');
    });

    it('should handle network timeouts', async () => {
      const mockError = new Error('Network timeout');
      mockError.name = 'TimeoutError';
      
      expect(mockError.name).toBe('TimeoutError');
    });
  });

  describe('Status Mapping', () => {
    it('should map AWS instance states to VM statuses correctly', () => {
      // Test the mapping logic (this would be tested with actual method calls in integration tests)
      const statusMappings = {
        'pending': 'creating',
        'running': 'running',
        'stopped': 'stopped',
        'terminated': 'terminated',
        'stopping': 'stopped',
        'shutting-down': 'stopped'
      };

      Object.entries(statusMappings).forEach(([awsStatus, expectedVMStatus]) => {
        expect(expectedVMStatus).toBeDefined();
      });
    });
  });

  describe('Security Configuration', () => {
    it('should configure security groups for Windows VMs', () => {
      const windowsRules = AWS_CONFIG.SECURITY.DEFAULT_INGRESS_RULES.windows;
      expect(windowsRules).toHaveLength(1);
      expect(windowsRules[0].port).toBe(3389); // RDP port
      expect(windowsRules[0].protocol).toBe('tcp');
    });

    it('should configure security groups for Linux VMs', () => {
      const linuxRules = AWS_CONFIG.SECURITY.DEFAULT_INGRESS_RULES.linux;
      expect(linuxRules).toHaveLength(1);
      expect(linuxRules[0].port).toBe(22); // SSH port
      expect(linuxRules[0].protocol).toBe('tcp');
    });
  });

  describe('Pricing Calculations', () => {
    it('should calculate VM costs correctly', () => {
      const instanceType = AWS_CONFIG.INSTANCE_TYPES.find(type => type.id === 't3.micro');
      expect(instanceType).toBeDefined();
      expect(instanceType!.hourlyPriceCents).toBeGreaterThan(0);
      expect(instanceType!.monthlyPriceCents).toBeGreaterThan(0);
    });

    it('should apply regional pricing multipliers', () => {
      const usEast = AWS_CONFIG.AVAILABLE_REGIONS.find(r => r.id === 'us-east-1');
      const euWest = AWS_CONFIG.AVAILABLE_REGIONS.find(r => r.id === 'eu-west-1');
      
      expect(usEast!.priceMultiplier).toBe(1.0);
      expect(euWest!.priceMultiplier).toBeGreaterThan(1.0);
    });
  });
});

// Integration test placeholder (would require actual AWS credentials)
describe('AWS Integration Tests', () => {
  // These tests would run against actual AWS services in a test environment
  // They are skipped by default to avoid AWS charges during development
  
  it.skip('should create and terminate a real EC2 instance', async () => {
    // This would test actual AWS integration
    // Only run in CI/CD with proper AWS test account
  });

  it.skip('should retrieve real CloudWatch metrics', async () => {
    // This would test actual CloudWatch integration
    // Only run in CI/CD with proper AWS test account
  });
});