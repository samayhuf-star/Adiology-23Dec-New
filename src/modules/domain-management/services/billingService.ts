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

  async processSubscription(userId: string): Promise<SubscriptionResult> {
    try {
      // In a real implementation, this would integrate with Stripe subscriptions
      // This is separate from wallet operations as per requirements
      
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

      // Create new subscription (mock implementation)
      const { data: newSubscription, error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: 'basic',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select()
        .single();

      if (createError) throw createError;

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

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const { data: methods, error } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

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

  async addPaymentMethod(userId: string, paymentMethod: PaymentMethod, isWalletMethod: boolean = false): Promise<void> {
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
          is_wallet_method: isWalletMethod,
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
      // In a real implementation, this would process payment with Stripe
      // For now, we'll simulate successful payment and credit the wallet
      
      const transaction = await walletService.creditWallet(
        userId,
        amount,
        `Manual recharge - ${paymentMethodId.slice(-4)}`
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
}

export const billingService = new BillingServiceImpl();