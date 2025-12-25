// VM Management Type Definitions

export type VMStatus = 'creating' | 'running' | 'stopped' | 'error';
export type OSType = 'windows' | 'linux';
export type ConnectionMethod = 'rdp' | 'browser';

export interface VMConfiguration {
  name: string;
  operatingSystem: {
    type: OSType;
    version: string;
  };
  region: {
    country: string;
    code: string;
  };
  size: {
    cpu: number;
    ram: number; // GB
    storage: number; // GB
    displayName: string;
  };
}

export interface VM {
  id: string;
  userId: string;
  name: string;
  configuration: VMConfiguration;
  status: VMStatus;
  createdAt: Date;
  lastConnected?: Date;
  monthlyPrice: number;
  providerInstanceId: string;
  connectionInfo: {
    ipAddress: string;
    rdpPort: number;
    browserURL?: string;
  };
}

export interface PriceInfo {
  hourlyRate: number;
  monthlyRate: number;
  providerRate: number;
  markup: number;
  currency: string;
}

export interface ConnectionInfo {
  method: ConnectionMethod;
  rdpFile?: Blob;
  browserURL?: string;
  credentials: {
    username: string;
    password: string;
  };
}

export interface Region {
  country: string;
  code: string;
  displayName: string;
}

export interface VMSize {
  cpu: number;
  ram: number;
  storage: number;
  displayName: string;
  hourlyRate: number;
}

// Component Props Interfaces
export interface VMDashboardProps {
  userId: string;
  onVMCreate: () => void;
  onVMConnect: (vmId: string, method: ConnectionMethod) => void;
  onVMDelete: (vmId: string) => void;
}

export interface VMCreationProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: VMConfiguration) => Promise<void>;
  availableRegions: Region[];
  availableSizes: VMSize[];
}

// API Response Types
export interface CreateVMResponse {
  success: boolean;
  vm?: VM;
  error?: string;
}

export interface VMListResponse {
  success: boolean;
  vms?: VM[];
  error?: string;
}

export interface PricingResponse {
  success: boolean;
  pricing?: PriceInfo;
  error?: string;
}

// Form Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface VMFormData {
  name: string;
  osType: OSType;
  osVersion: string;
  country: string;
  regionCode: string;
  sizeId: string;
}

// Search and Filter Types
export interface VMFilters {
  status?: VMStatus;
  osType?: OSType;
  searchQuery?: string;
}

export interface VMSearchResult {
  vms: VM[];
  totalCount: number;
  filteredCount: number;
}