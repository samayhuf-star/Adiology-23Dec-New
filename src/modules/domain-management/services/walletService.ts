import { supabase } from '../../../utils/supabase/client';
import { 
  WalletService, 
  Money, 
  Transaction, 
  RechargeResult, 
  Wallet, 
  WalletSettings, 
  WalletTransaction,
  DEFAULT_RECHARGE_AMOUNT,
  DEFAULT_RECHARGE_THRESHOLD 
} from '../types';

class WalletServiceImpl implements WalletService {
  async getBalance(userId: string): Promise<Money> {
    try {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('balance_amount, balance_currency')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No wallet found, create one
          await this.createWallet(userId);
          return { amount: 0, currency: 'USD' };
        }
        throw error;
      }

      return {
        amount: wallet.balance_amount,
        currency: wallet.balance_currency
      };
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw new Error('Failed to retrieve wallet balance');
    }
  }

  async debitWallet(userId: string, amount: Money, description: string): Promise<Transaction> {
    try {
      // Start a transaction
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (walletError) throw walletError;

      const currentBalance = wallet.balance_amount;
      
      // Check if sufficient balance
      if (currentBalance < amount.amount) {
        throw new Error('Insufficient wallet balance');
      }

      const newBalance = currentBalance - amount.amount;

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'debit',
          amount: amount.amount,
          currency: amount.currency,
          description,
          service_type: 'domain',
          balance_before: currentBalance,
          balance_after: newBalance
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update wallet balance (trigger will handle this automatically)
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance_amount: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      return {
        id: transaction.id,
        userId,
        type: 'debit',
        amount,
        description,
        timestamp: new Date(transaction.created_at),
        balanceAfter: { amount: newBalance, currency: amount.currency }
      };
    } catch (error) {
      console.error('Error debiting wallet:', error);
      throw new Error('Failed to debit wallet');
    }
  }

  async creditWallet(userId: string, amount: Money, description: string): Promise<Transaction> {
    try {
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (walletError) throw walletError;

      const currentBalance = wallet.balance_amount;
      const newBalance = currentBalance + amount.amount;

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'credit',
          amount: amount.amount,
          currency: amount.currency,
          description,
          service_type: description.includes('recharge') ? null : 'domain',
          balance_before: currentBalance,
          balance_after: newBalance
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance_amount: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      return {
        id: transaction.id,
        userId,
        type: 'credit',
        amount,
        description,
        timestamp: new Date(transaction.created_at),
        balanceAfter: { amount: newBalance, currency: amount.currency }
      };
    } catch (error) {
      console.error('Error crediting wallet:', error);
      throw new Error('Failed to credit wallet');
    }
  }

  async getTransactionHistory(userId: string, limit: number = 50): Promise<Transaction[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select(`
          *,
          wallets!inner(user_id)
        `)
        .eq('wallets.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return transactions.map((tx: any) => ({
        id: tx.id,
        userId,
        type: tx.type as 'debit' | 'credit',
        amount: { amount: tx.amount, currency: tx.currency },
        description: tx.description,
        timestamp: new Date(tx.created_at),
        balanceAfter: { amount: tx.balance_after, currency: tx.currency },
        relatedService: tx.service_type
      }));
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw new Error('Failed to retrieve transaction history');
    }
  }

  async checkAutoRecharge(userId: string): Promise<boolean> {
    try {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('balance_amount, auto_recharge_enabled, recharge_threshold')
        .eq('user_id', userId)
        .single();

      if (error) return false;

      return wallet.auto_recharge_enabled && 
             wallet.balance_amount < wallet.recharge_threshold;
    } catch (error) {
      console.error('Error checking auto-recharge:', error);
      return false;
    }
  }

  async triggerAutoRecharge(userId: string): Promise<RechargeResult> {
    try {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (!wallet.auto_recharge_enabled) {
        return {
          success: false,
          error: 'Auto-recharge is disabled'
        };
      }

      // Get wallet payment method
      const { data: paymentMethod, error: pmError } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_method_id', wallet.payment_method_id)
        .eq('is_wallet_method', true)
        .single();

      if (pmError || !paymentMethod) {
        return {
          success: false,
          error: 'No valid payment method found for auto-recharge'
        };
      }

      // In a real implementation, this would integrate with Stripe or another payment processor
      // For now, we'll simulate payment processing
      const rechargeAmount = { 
        amount: wallet.recharge_amount, 
        currency: wallet.balance_currency 
      };

      // Simulate payment processing delay and potential failure
      const paymentSuccess = Math.random() > 0.1; // 90% success rate for simulation

      if (!paymentSuccess) {
        // Send notification about failed auto-recharge
        await this.sendAutoRechargeNotification(userId, 'failed', rechargeAmount);
        return {
          success: false,
          error: 'Payment processing failed'
        };
      }

      const transaction = await this.creditWallet(
        userId, 
        rechargeAmount, 
        `Auto-recharge via ${paymentMethod.brand} ****${paymentMethod.last4}`
      );

      // Send success notification
      await this.sendAutoRechargeNotification(userId, 'success', rechargeAmount, transaction.id);

      return {
        success: true,
        amount: rechargeAmount,
        transactionId: transaction.id
      };
    } catch (error) {
      console.error('Error triggering auto-recharge:', error);
      await this.sendAutoRechargeNotification(userId, 'error', { amount: 0, currency: 'USD' });
      return {
        success: false,
        error: 'Failed to process auto-recharge'
      };
    }
  }

  private async sendAutoRechargeNotification(
    userId: string, 
    status: 'success' | 'failed' | 'error', 
    amount: Money,
    transactionId?: string
  ): Promise<void> {
    try {
      const notificationData = {
        user_id: userId,
        type: 'auto_recharge',
        status,
        data: {
          amount: amount.amount,
          currency: amount.currency,
          transactionId,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      };

      // In a real implementation, this would integrate with a notification service
      // For now, we'll log to a notifications table or external service
      console.log('Auto-recharge notification:', notificationData);
      
      // Could also send email, push notification, etc.
      // await emailService.sendAutoRechargeNotification(userId, status, amount);
    } catch (error) {
      console.error('Error sending auto-recharge notification:', error);
    }
  }

  async createWallet(userId: string): Promise<Wallet> {
    try {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance_amount: 0,
          balance_currency: 'USD',
          auto_recharge_enabled: true,
          recharge_amount: DEFAULT_RECHARGE_AMOUNT,
          recharge_threshold: DEFAULT_RECHARGE_THRESHOLD
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: wallet.id,
        userId,
        balance: { amount: wallet.balance_amount, currency: wallet.balance_currency },
        settings: {
          autoRechargeEnabled: wallet.auto_recharge_enabled,
          rechargeAmount: { amount: wallet.recharge_amount, currency: wallet.balance_currency },
          rechargeThreshold: { amount: wallet.recharge_threshold, currency: wallet.balance_currency },
          paymentMethodId: wallet.payment_method_id || ''
        },
        createdAt: new Date(wallet.created_at),
        updatedAt: new Date(wallet.updated_at)
      };
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }

  async getWallet(userId: string): Promise<Wallet | null> {
    try {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        id: wallet.id,
        userId,
        balance: { amount: wallet.balance_amount, currency: wallet.balance_currency },
        settings: {
          autoRechargeEnabled: wallet.auto_recharge_enabled,
          rechargeAmount: { amount: wallet.recharge_amount, currency: wallet.balance_currency },
          rechargeThreshold: { amount: wallet.recharge_threshold, currency: wallet.balance_currency },
          paymentMethodId: wallet.payment_method_id || ''
        },
        createdAt: new Date(wallet.created_at),
        updatedAt: new Date(wallet.updated_at)
      };
    } catch (error) {
      console.error('Error getting wallet:', error);
      throw new Error('Failed to retrieve wallet');
    }
  }

  async updateWalletSettings(userId: string, settings: Partial<WalletSettings>): Promise<void> {
    try {
      const updateData: any = {};
      
      if (settings.autoRechargeEnabled !== undefined) {
        updateData.auto_recharge_enabled = settings.autoRechargeEnabled;
      }
      
      if (settings.rechargeAmount) {
        updateData.recharge_amount = settings.rechargeAmount.amount;
      }
      
      if (settings.rechargeThreshold) {
        updateData.recharge_threshold = settings.rechargeThreshold.amount;
      }
      
      if (settings.paymentMethodId) {
        updateData.payment_method_id = settings.paymentMethodId;
      }

      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('wallets')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating wallet settings:', error);
      throw new Error('Failed to update wallet settings');
    }
  }
}

export const walletService = new WalletServiceImpl();