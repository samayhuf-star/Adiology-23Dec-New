import { supabase } from '../../../utils/supabase/client';
import { 
  BillingService, 
  PaymentMethod, 
  WalletSettings, 
  SubscriptionResult,
  Money 
} from '../types';
import { walletService } from './walletService';

class BillingServiceImpl implements BillingService {
  async setupWallet(userId: string, paymentMethod: PaymentMethod, settings: WalletSettings): Promise<void> {
    try {
      // First, ensure wallet exists
      let wallet = await walletService.getWallet(userId);
      if (!wallet) {
        wallet = await walletService.createWallet(userId);
      }

      // Update wallet settings with payment method
      await walletService.updateWalletSettings(userId, {
        ...settings,
        paymentMethodId: paymentMethod.id
      });

      // Store payment method securely (in a real implementation, this would be tokenized)
      const { error } = await supabase
        .from('user_payment_methods')
        .upsert({
          user_id: userId,
          payment_method_id: paymentMethod.id,
          type: paymentMethod.type,
          last4: paymentMethod.last4,
          brand: paymentMethod.brand,
          expiry_month: paymentMethod.expiryMonth,
          expiry_year: paymentMethod.expiryYear,
          is_wallet_method: true,
          is_subscription_method: false, // Enforce separation
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error setting up wallet:', error);
      throw new Error('Failed to setup wallet');
    }
  }

  async updateWalletSettings(userId: string, settings: WalletSettings): Promise<void> {
    try {
      await walletService.updateWalletSettings(userId, settings);
    } catch (error) {
      console.error('Error updating wallet settings:', error);
      throw new Error('Failed to update wallet settings');
    }
  }

  async processSubscription(userId: string, paymentMethodId?: string): Promise<SubscriptionResult> {
    try {
      // Enforce billing separation - subscription billing is separate from wallet
      
      // Check if user has active subscription
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (subscription) {
        return {
          success: true,
          subscriptionId: subscription.id
        };
      }

      // Validate payment method for subscription (must be separate from wallet)
      if (paymentMethodId) {
        const { data: paymentMethod, error: pmError } = await supabase
          .from('user_payment_methods')
          .select('*')
          .eq('user_id', userId)
          .eq('payment_method_id', paymentMethodId)
          .eq('is_wallet_method', false) // Ensure it's not a wallet payment method
          .single();

        if (pmError || !paymentMethod) {
          return {
            success: false,
            error: 'Invalid payment method for subscription billing'
          };
        }

        // Mark as subscription payment method
        await supabase
          .from('user_payment_methods')
          .update({ is_subscription_method: true })
          .eq('payment_method_id', paymentMethodId);
      }

      // Create new subscription (mock implementation)
      const { data: newSubscription, error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: 'basic',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          stripe_subscription_id: `sub_${Date.now()}` // Mock Stripe ID
        })
        .select()
        .single();

      if (createError) throw createError;

      // Record initial billing transaction (separate from wallet)
      await this.recordSubscriptionBilling(newSubscription.id, {
        amount: 29.99, // Example subscription price
        currency: 'USD'
      }, 'succeeded');

      return {
        success: true,
        subscriptionId: newSubscription.id
      };
    } catch (error) {
      console.error('Error processing subscription:', error);
      return {
        success: false,
        error: 'Failed to process subscription'
      };
    }
  }

  async getWalletSettings(userId: string): Promise<WalletSettings> {
    try {
      const wallet = await walletService.getWallet(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      return wallet.settings;
    } catch (error) {
      console.error('Error getting wallet settings:', error);
      throw new Error('Failed to retrieve wallet settings');
    }
  }

  async getPaymentMethods(userId: string, type?: 'wallet' | 'subscription'): Promise<PaymentMethod[]> {
    try {
      let query = supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', userId);

      // Filter by type if specified
      if (type === 'wallet') {
        query = query.eq('is_wallet_method', true);
      } else if (type === 'subscription') {
        query = query.eq('is_subscription_method', true);
      }

      const { data: methods, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return methods.map((method: any) => ({
        id: method.payment_method_id,
        type: method.type,
        last4: method.last4,
        brand: method.brand,
        expiryMonth: method.expiry_month,
        expiryYear: method.expiry_year
      }));
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw new Error('Failed to retrieve payment methods');
    }
  }

  async addPaymentMethod(
    userId: string, 
    paymentMethod: PaymentMethod, 
    purpose: 'wallet' | 'subscription' | 'both' = 'both'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_payment_methods')
        .insert({
          user_id: userId,
          payment_method_id: paymentMethod.id,
          type: paymentMethod.type,
          last4: paymentMethod.last4,
          brand: paymentMethod.brand,
          expiry_month: paymentMethod.expiryMonth,
          expiry_year: paymentMethod.expiryYear,
          is_wallet_method: purpose === 'wallet' || purpose === 'both',
          is_subscription_method: purpose === 'subscription' || purpose === 'both',
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw new Error('Failed to add payment method');
    }
  }

  async removePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_payment_methods')
        .delete()
        .eq('user_id', userId)
        .eq('payment_method_id', paymentMethodId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw new Error('Failed to remove payment method');
    }
  }

  async manualRecharge(userId: string, amount: Money, paymentMethodId: string): Promise<SubscriptionResult> {
    try {
      // Validate that payment method is for wallet use
      const { data: paymentMethod, error: pmError } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_method_id', paymentMethodId)
        .eq('is_wallet_method', true)
        .single();

      if (pmError || !paymentMethod) {
        return {
          success: false,
          error: 'Invalid payment method for wallet recharge'
        };
      }

      // In a real implementation, this would process payment with Stripe
      // For now, we'll simulate successful payment and credit the wallet
      
      const transaction = await walletService.creditWallet(
        userId,
        amount,
        `Manual recharge via ${paymentMethod.brand} ****${paymentMethod.last4}`
      );

      return {
        success: true,
        subscriptionId: transaction.id
      };
    } catch (error) {
      console.error('Error processing manual recharge:', error);
      return {
        success: false,
        error: 'Failed to process manual recharge'
      };
    }
  }

  async getBillingHistory(userId: string, type: 'wallet' | 'subscription' | 'all' = 'all'): Promise<any[]> {
    try {
      const history: any[] = [];

      if (type === 'wallet' || type === 'all') {
        // Get wallet transaction history
        const walletTransactions = await walletService.getTransactionHistory(userId);
        history.push(...walletTransactions.map(tx => ({
          ...tx,
          billingType: 'wallet',
          category: 'prepaid_credit'
        })));
      }

      if (type === 'subscription' || type === 'all') {
        // Get subscription billing history
        const { data: subscriptionBilling, error } = await supabase
          .from('subscription_billing_history')
          .select(`
            *,
            user_subscriptions!inner(user_id, plan_id)
          `)
          .eq('user_subscriptions.user_id', userId)
          .order('billing_date', { ascending: false });

        if (error) throw error;

        history.push(...subscriptionBilling.map((bill: any) => ({
          id: bill.id,
          userId,
          type: 'subscription_charge',
          amount: { amount: bill.amount, currency: bill.currency },
          description: `Subscription billing - ${bill.user_subscriptions.plan_id}`,
          timestamp: new Date(bill.billing_date),
          billingType: 'subscription',
          category: 'recurring_subscription',
          status: bill.status
        })));
      }

      // Sort by timestamp descending
      return history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error getting billing history:', error);
      throw new Error('Failed to retrieve billing history');
    }
  }

  private async recordSubscriptionBilling(
    subscriptionId: string, 
    amount: Money, 
    status: 'succeeded' | 'failed' | 'pending' | 'refunded'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscription_billing_history')
        .insert({
          subscription_id: subscriptionId,
          amount: amount.amount,
          currency: amount.currency,
          status,
          stripe_invoice_id: `inv_${Date.now()}`, // Mock Stripe invoice ID
          billing_date: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording subscription billing:', error);
      throw new Error('Failed to record subscription billing');
    }
  }
}

export const billingService = new BillingServiceImpl();