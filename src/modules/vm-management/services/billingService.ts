// Billing Service - Handle VM billing and prepaid balance integration

import { VM, PriceInfo } from '../types';

interface BillingRecord {
  id: string;
  vmId: string;
  userId: string;
  amount: number;
  type: 'creation' | 'monthly' | 'refund';
  timestamp: Date;
  description: string;
}

interface BalanceInfo {
  currentBalance: number;
  currency: string;
  lastUpdated: Date;
}

class BillingService {
  private baseURL = '/api/vm-management';

  /**
   * Get user's current prepaid balance
   */
  async getCurrentBalance(userId: string): Promise<BalanceInfo> {
    try {
      const response = await fetch(`${this.baseURL}/billing/balance/${userId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get balance');
      }

      return {
        currentBalance: data.balance,
        currency: data.currency || 'USD',
        lastUpdated: new Date(data.lastUpdated),
      };
    } catch (error) {
      console.error('Error getting current balance:', error);
      throw error;
    }
  }

  /**
   * Charge user for VM creation
   */
  async chargeForVMCreation(
    userId: string,
    vmId: string,
    amount: number,
    description: string
  ): Promise<BillingRecord> {
    try {
      const response = await fetch(`${this.baseURL}/billing/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          vmId,
          amount,
          type: 'creation',
          description,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to process payment');
      }

      return {
        ...data.billingRecord,
        timestamp: new Date(data.billingRecord.timestamp),
      };
    } catch (error) {
      console.error('Error charging for VM creation:', error);
      throw error;
    }
  }

  /**
   * Check if user has sufficient balance
   */
  async checkSufficientBalance(userId: string, requiredAmount: number): Promise<boolean> {
    try {
      const balanceInfo = await this.getCurrentBalance(userId);
      return balanceInfo.currentBalance >= requiredAmount;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }

  /**
   * Get billing history for a user
   */
  async getBillingHistory(userId: string): Promise<BillingRecord[]> {
    try {
      const response = await fetch(`${this.baseURL}/billing/history/${userId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get billing history');
      }

      return data.records.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp),
      }));
    } catch (error) {
      console.error('Error getting billing history:', error);
      throw error;
    }
  }

  /**
   * Track hourly usage for backend reconciliation
   */
  async trackHourlyUsage(vmId: string, hours: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/billing/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vmId,
          hours,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        console.warn('Failed to track usage:', data.error);
      }
    } catch (error) {
      console.warn('Error tracking hourly usage:', error);
    }
  }

  /**
   * Process refund for deleted VM
   */
  async processVMDeletionRefund(
    userId: string,
    vmId: string,
    vm: VM
  ): Promise<BillingRecord | null> {
    try {
      // Calculate prorated refund based on remaining time
      const now = new Date();
      const createdAt = new Date(vm.createdAt);
      const monthsUsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      // If less than a month and more than 24 hours, calculate refund
      if (monthsUsed < 1 && monthsUsed > 1/30) { // More than 1 day
        const refundAmount = vm.monthlyPrice * (1 - monthsUsed);
        
        if (refundAmount > 1) { // Only refund if more than $1
          const response = await fetch(`${this.baseURL}/billing/refund`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              vmId,
              amount: refundAmount,
              type: 'refund',
              description: `Prorated refund for VM ${vm.name} deletion`,
            }),
          });

          const data = await response.json();

          if (data.success) {
            return {
              ...data.billingRecord,
              timestamp: new Date(data.billingRecord.timestamp),
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error processing refund:', error);
      return null;
    }
  }

  /**
   * Validate payment before VM creation
   */
  async validatePayment(
    userId: string,
    pricing: PriceInfo
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const hasSufficientBalance = await this.checkSufficientBalance(
        userId,
        pricing.monthlyRate
      );

      if (!hasSufficientBalance) {
        const balanceInfo = await this.getCurrentBalance(userId);
        const shortfall = pricing.monthlyRate - balanceInfo.currentBalance;
        
        return {
          valid: false,
          error: `Insufficient balance. You need $${shortfall.toFixed(2)} more to create this VM.`,
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating payment:', error);
      return {
        valid: false,
        error: 'Unable to validate payment. Please try again.',
      };
    }
  }

  /**
   * Get formatted balance display
   */
  formatBalance(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Get billing summary for a VM
   */
  async getVMBillingSummary(vmId: string): Promise<{
    totalCharged: number;
    totalRefunded: number;
    netAmount: number;
    records: BillingRecord[];
  }> {
    try {
      const response = await fetch(`${this.baseURL}/billing/vm/${vmId}/summary`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get billing summary');
      }

      return {
        ...data.summary,
        records: data.summary.records.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp),
        })),
      };
    } catch (error) {
      console.error('Error getting VM billing summary:', error);
      throw error;
    }
  }
}

export const billingService = new BillingService();