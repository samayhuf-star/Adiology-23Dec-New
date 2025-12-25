// Core domain management types and interfaces

export interface Money {
  amount: number;
  currency: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  organization?: string;
  email: string;
  phone: string;
  address: Address;
}

export interface Domain {
  id: string;
  userId: string;
  domainName: string;
  registrar: string;
  registrationDate: Date;
  expirationDate: Date;
  autoRenew: boolean;
  status: 'active' | 'expired' | 'pending' | 'transferred';
  contactInfo: ContactInfo;
  nameservers: string[];
  dnsManaged: boolean;
}

export interface DomainSearchResult {
  domain: string;
  available: boolean;
  price: Money;
  registrar: string;
  registrationPeriods: number[];
}

export interface DomainAvailability {
  domain: string;
  available: boolean;
  price?: Money;
  registrar?: string;
}

export interface DomainRegistrationRequest {
  domain: string;
  years: number;
  contactInfo: ContactInfo;
  nameservers?: string[];
}

export interface DomainRegistrationResult {
  success: boolean;
  domain: string;
  transactionId?: string;
  error?: string;
}

export interface RenewalResult {
  success: boolean;
  domain: string;
  newExpirationDate?: Date;
  error?: string;
}

export interface TransferResult {
  success: boolean;
  domain: string;
  transferId?: string;
  error?: string;
}

export interface DomainInfo {
  domain: string;
  registrar: string;
  registrationDate: Date;
  expirationDate: Date;
  status: string;
  contactInfo: ContactInfo;
  nameservers: string[];
}

// DNS Management Types
export interface DNSRecord {
  id?: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

export interface DNSZone {
  id: string;
  domainId: string;
  provider: 'cloudflare' | 'route53' | 'registrar';
  records: DNSRecord[];
  lastModified: Date;
}

export interface PropagationStatus {
  domain: string;
  status: 'pending' | 'propagating' | 'complete';
  estimatedCompletion: Date;
  checkedServers: string[];
}

// Wallet System Types
export interface Wallet {
  id: string;
  userId: string;
  balance: Money;
  settings: WalletSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletSettings {
  autoRechargeEnabled: boolean;
  rechargeAmount: Money;
  rechargeThreshold: Money;
  paymentMethodId: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'debit' | 'credit' | 'recharge';
  amount: Money;
  description: string;
  serviceType: 'domain' | 'vps' | 'addon';
  relatedEntityId?: string;
  timestamp: Date;
  balanceBefore: Money;
  balanceAfter: Money;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'debit' | 'credit';
  amount: Money;
  description: string;
  timestamp: Date;
  balanceAfter: Money;
  relatedService?: string;
}

export interface RechargeResult {
  success: boolean;
  amount?: Money;
  transactionId?: string;
  error?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  error?: string;
}

// Service Interfaces
export interface DomainSearchEngine {
  searchDomains(query: string, tlds: string[]): Promise<DomainSearchResult[]>;
  checkAvailability(domain: string): Promise<DomainAvailability>;
  getSuggestions(domain: string): Promise<string[]>;
}

export interface DomainRegistrar {
  registerDomain(request: DomainRegistrationRequest): Promise<DomainRegistrationResult>;
  renewDomain(domain: string, years: number): Promise<RenewalResult>;
  transferDomain(domain: string, authCode: string): Promise<TransferResult>;
  getDomainInfo(domain: string): Promise<DomainInfo>;
}

export interface DNSManager {
  getRecords(domain: string): Promise<DNSRecord[]>;
  createRecord(domain: string, record: DNSRecord): Promise<void>;
  updateRecord(domain: string, recordId: string, record: DNSRecord): Promise<void>;
  deleteRecord(domain: string, recordId: string): Promise<void>;
  propagateChanges(domain: string): Promise<PropagationStatus>;
}

export interface WalletService {
  getBalance(userId: string): Promise<Money>;
  debitWallet(userId: string, amount: Money, description: string): Promise<Transaction>;
  creditWallet(userId: string, amount: Money, description: string): Promise<Transaction>;
  getTransactionHistory(userId: string, limit?: number): Promise<Transaction[]>;
  checkAutoRecharge(userId: string): Promise<boolean>;
  triggerAutoRecharge(userId: string): Promise<RechargeResult>;
}

export interface BillingService {
  setupWallet(userId: string, paymentMethod: PaymentMethod, settings: WalletSettings): Promise<void>;
  updateWalletSettings(userId: string, settings: WalletSettings): Promise<void>;
  processSubscription(userId: string): Promise<SubscriptionResult>;
  getWalletSettings(userId: string): Promise<WalletSettings>;
}

export interface PricingCalculator {
  calculateDomainPrice(baseCost: Money, registrationYears: number): Money;
  calculateRenewalPrice(baseCost: Money, renewalYears: number): Money;
  applyMarkup(cost: Money, markupPercentage: number): Money;
  convertCurrency(amount: Money, targetCurrency: string): Promise<Money>;
}

// Constants
export const SUPPORTED_TLDS = ['.com', '.net', '.org', '.io', '.co', '.app', '.dev'] as const;
export const REGISTRATION_PERIODS = [1, 2, 5, 10] as const;
export const MARKUP_PERCENTAGE = 20;
export const DEFAULT_RECHARGE_AMOUNT = 25;
export const DEFAULT_RECHARGE_THRESHOLD = 5;

export type SupportedTLD = typeof SUPPORTED_TLDS[number];
export type RegistrationPeriod = typeof REGISTRATION_PERIODS[number];