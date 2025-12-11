const RESELLERCLUB_API_URL = import.meta.env.VITE_RESELLERCLUB_API_URL || 'https://httpapi.com';
const RESELLERCLUB_API_KEY = import.meta.env.VITE_RESELLERCLUB_API_KEY || '';
const RESELLER_ID = import.meta.env.VITE_RESELLERCLUB_RESELLER_ID || '';

export interface EmailDomain {
  id: string;
  domainName: string;
  status: 'pending' | 'active' | 'suspended' | 'expired';
  mxVerified: boolean;
  orderId?: string;
  accounts: string[];
  createdAt: string;
  expiresAt?: string;
}

export interface EmailAccount {
  id: string;
  domainId: string;
  address: string;
  displayName: string;
  quotaMb: number;
  usedMb: number;
  status: 'active' | 'suspended' | 'disabled';
  lastLogin?: string;
  createdAt: string;
}

export interface EmailMessage {
  id: string;
  accountId: string;
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  snippet: string;
  bodyHtml?: string;
  bodyText?: string;
  attachments: EmailAttachment[];
  receivedAt: string;
  readAt?: string;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam';
  starred: boolean;
  labels?: string[];
}

export interface EmailAttachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url?: string;
}

export interface BillingSummary {
  domainId: string;
  domainName: string;
  totalAccounts: number;
  tier: 'standard' | 'business' | 'enterprise';
  pricePerAccount: number;
  monthlyCharge: number;
}

export interface EmailConfig {
  smtpServer: string;
  smtpPort: number;
  imapServer: string;
  imapPort: number;
  popServer: string;
  popPort: number;
  webmailUrl: string;
}

export function calculatePricing(accountCount: number): { tier: string; pricePerAccount: number; total: number } {
  if (accountCount >= 50) {
    return { tier: 'Enterprise', pricePerAccount: 2.00, total: accountCount * 2.00 };
  } else if (accountCount >= 10) {
    return { tier: 'Business', pricePerAccount: 2.50, total: accountCount * 2.50 };
  } else {
    return { tier: 'Standard', pricePerAccount: 3.00, total: accountCount * 3.00 };
  }
}

export function getEmailConfig(domainName: string): EmailConfig {
  return {
    smtpServer: `mail.${domainName}`,
    smtpPort: 587,
    imapServer: `mail.${domainName}`,
    imapPort: 993,
    popServer: `mail.${domainName}`,
    popPort: 995,
    webmailUrl: `https://webmail.${domainName}`,
  };
}

export function getMXRecords(domainName: string): { priority: number; host: string }[] {
  return [
    { priority: 10, host: `mx1.${domainName}` },
    { priority: 20, host: `mx2.${domainName}` },
  ];
}

export function getSPFRecord(): string {
  return 'v=spf1 include:spf.resellerclub.com ~all';
}

export function getDKIMRecord(domainName: string): string {
  return `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...`;
}

export function getDMARCRecord(domainName: string): string {
  return `v=DMARC1; p=none; rua=mailto:dmarc@${domainName}`;
}

class ResellerClubEmailService {
  private apiUrl: string;
  private apiKey: string;
  private resellerId: string;

  constructor() {
    this.apiUrl = RESELLERCLUB_API_URL;
    this.apiKey = RESELLERCLUB_API_KEY;
    this.resellerId = RESELLER_ID;
  }

  private async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${this.apiUrl}${endpoint}`);
    url.searchParams.append('auth-userid', this.resellerId);
    url.searchParams.append('api-key', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ResellerClub API error:', error);
      throw error;
    }
  }

  async checkDomainAvailability(domainName: string): Promise<boolean> {
    try {
      const result = await this.makeRequest('/api/domains/available.json', {
        'domain-name': domainName.split('.')[0],
        'tlds': domainName.split('.').slice(1).join('.'),
      });
      return result[domainName]?.status === 'available';
    } catch (error) {
      console.error('Error checking domain availability:', error);
      return false;
    }
  }

  async createEmailHostingOrder(domainName: string, numberOfAccounts: number): Promise<string | null> {
    try {
      const result = await this.makeRequest('/api/eelite/add.json', {
        'domain-name': domainName,
        'no-of-accounts': numberOfAccounts.toString(),
        'months': '12',
      });
      return result.entityid || result.orderid || null;
    } catch (error) {
      console.error('Error creating email hosting order:', error);
      return null;
    }
  }

  async createMailbox(orderId: string, email: string, password: string, quotaMb: number = 1024): Promise<boolean> {
    try {
      const [localPart] = email.split('@');
      await this.makeRequest('/api/eelite/mail/add.json', {
        'order-id': orderId,
        'email': localPart,
        'passwd': password,
        'quota': quotaMb.toString(),
      });
      return true;
    } catch (error) {
      console.error('Error creating mailbox:', error);
      return false;
    }
  }

  async deleteMailbox(orderId: string, email: string): Promise<boolean> {
    try {
      const [localPart] = email.split('@');
      await this.makeRequest('/api/eelite/mail/delete.json', {
        'order-id': orderId,
        'email': localPart,
      });
      return true;
    } catch (error) {
      console.error('Error deleting mailbox:', error);
      return false;
    }
  }

  async resetMailboxPassword(orderId: string, email: string, newPassword: string): Promise<boolean> {
    try {
      const [localPart] = email.split('@');
      await this.makeRequest('/api/eelite/mail/modify.json', {
        'order-id': orderId,
        'email': localPart,
        'passwd': newPassword,
      });
      return true;
    } catch (error) {
      console.error('Error resetting mailbox password:', error);
      return false;
    }
  }

  async getMailboxes(orderId: string): Promise<any[]> {
    try {
      const result = await this.makeRequest('/api/eelite/mail/search.json', {
        'order-id': orderId,
        'no-of-records': '100',
        'page-no': '1',
      });
      return result.recsonpage || [];
    } catch (error) {
      console.error('Error getting mailboxes:', error);
      return [];
    }
  }

  async getOrderDetails(orderId: string): Promise<any> {
    try {
      const result = await this.makeRequest('/api/eelite/details.json', {
        'order-id': orderId,
      });
      return result;
    } catch (error) {
      console.error('Error getting order details:', error);
      return null;
    }
  }

  async renewEmailHosting(orderId: string, months: number = 12): Promise<boolean> {
    try {
      await this.makeRequest('/api/eelite/renew.json', {
        'order-id': orderId,
        'months': months.toString(),
      });
      return true;
    } catch (error) {
      console.error('Error renewing email hosting:', error);
      return false;
    }
  }

  async suspendMailbox(orderId: string, email: string): Promise<boolean> {
    try {
      const [localPart] = email.split('@');
      await this.makeRequest('/api/eelite/mail/suspend.json', {
        'order-id': orderId,
        'email': localPart,
      });
      return true;
    } catch (error) {
      console.error('Error suspending mailbox:', error);
      return false;
    }
  }

  async unsuspendMailbox(orderId: string, email: string): Promise<boolean> {
    try {
      const [localPart] = email.split('@');
      await this.makeRequest('/api/eelite/mail/unsuspend.json', {
        'order-id': orderId,
        'email': localPart,
      });
      return true;
    } catch (error) {
      console.error('Error unsuspending mailbox:', error);
      return false;
    }
  }
}

export const resellerClubEmailService = new ResellerClubEmailService();
export default resellerClubEmailService;
