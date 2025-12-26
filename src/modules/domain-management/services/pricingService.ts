import { PricingCalculator, Money, MARKUP_PERCENTAGE } from '../types';
import { walletService } from './walletService';

// Mock exchange rates - in production, this would come from a real API
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  'USD': { 'EUR': 0.85, 'GBP': 0.73, 'CAD': 1.25, 'AUD': 1.35 },
  'EUR': { 'USD': 1.18, 'GBP': 0.86, 'CAD': 1.47, 'AUD': 1.59 },
  'GBP': { 'USD': 1.37, 'EUR': 1.16, 'CAD': 1.71, 'AUD': 1.85 },
  'CAD': { 'USD': 0.80, 'EUR': 0.68, 'GBP': 0.58, 'AUD': 1.08 },
  'AUD': { 'USD': 0.74, 'EUR': 0.63, 'GBP': 0.54, 'CAD': 0.93 }
};

interface PriceDisplayOptions {
  showWalletBalance?: boolean;
  showMarkupBreakdown?: boolean;
  showSavings?: boolean;
  currency?: string;
}

interface PriceDisplay {
  formattedPrice: string;
  baseCost: Money;
  markupAmount: Money;
  totalPrice: Money;
  walletBalance?: Money;
  canAfford?: boolean;
  remainingBalance?: Money;
  needsRecharge?: Money;
}

class PricingCalculatorImpl implements PricingCalculator {
  calculateDomainPrice(baseCost: Money, registrationYears: number): Money {
    const totalBaseCost = baseCost.amount * registrationYears;
    const baseTotal = { amount: totalBaseCost, currency: baseCost.currency };
    
    return this.applyMarkup(baseTotal, MARKUP_PERCENTAGE);
  }

  calculateRenewalPrice(baseCost: Money, renewalYears: number): Money {
    return this.calculateDomainPrice(baseCost, renewalYears);
  }

  applyMarkup(cost: Money, markupPercentage: number): Money {
    const markupAmount = cost.amount * (markupPercentage / 100);
    return {
      amount: Math.round((cost.amount + markupAmount) * 100) / 100, // Round to 2 decimal places
      currency: cost.currency
    };
  }

  async convertCurrency(amount: Money, targetCurrency: string): Promise<Money> {
    if (amount.currency === targetCurrency) {
      return amount;
    }

    const rate = EXCHANGE_RATES[amount.currency]?.[targetCurrency];
    if (!rate) {
      throw new Error(`Currency conversion not supported: ${amount.currency} to ${targetCurrency}`);
    }

    return {
      amount: Math.round((amount.amount * rate) * 100) / 100,
      currency: targetCurrency
    };
  }

  /**
   * Calculate bulk pricing for multiple years with potential discounts
   */
  calculateBulkPrice(baseCost: Money, years: number): Money {
    let discountPercentage = 0;
    
    // Apply bulk discounts
    if (years >= 10) {
      discountPercentage = 15; // 15% discount for 10+ years
    } else if (years >= 5) {
      discountPercentage = 10; // 10% discount for 5+ years
    } else if (years >= 2) {
      discountPercentage = 5;  // 5% discount for 2+ years
    }

    const totalBaseCost = baseCost.amount * years;
    const discountAmount = totalBaseCost * (discountPercentage / 100);
    const discountedCost = totalBaseCost - discountAmount;
    
    return this.applyMarkup({ amount: discountedCost, currency: baseCost.currency }, MARKUP_PERCENTAGE);
  }

  /**
   * Format price for display with wallet balance information
   */
  async formatPriceDisplay(
    price: Money, 
    userId?: string, 
    options: PriceDisplayOptions = {}
  ): Promise<PriceDisplay> {
    const {
      showWalletBalance = true,
      showMarkupBreakdown = false,
      showSavings = false,
      currency = price.currency
    } = options;

    // Convert price to target currency if needed
    const convertedPrice = await this.convertCurrency(price, currency);
    
    // Calculate markup breakdown
    const baseCost = {
      amount: Math.round((convertedPrice.amount / (1 + MARKUP_PERCENTAGE / 100)) * 100) / 100,
      currency: convertedPrice.currency
    };
    const markupAmount = {
      amount: convertedPrice.amount - baseCost.amount,
      currency: convertedPrice.currency
    };

    const result: PriceDisplay = {
      formattedPrice: this.formatCurrency(convertedPrice),
      baseCost,
      markupAmount,
      totalPrice: convertedPrice
    };

    // Add wallet balance information if requested and user provided
    if (showWalletBalance && userId) {
      try {
        const walletBalance = await walletService.getBalance(userId);
        const convertedBalance = await this.convertCurrency(walletBalance, currency);
        
        result.walletBalance = convertedBalance;
        result.canAfford = convertedBalance.amount >= convertedPrice.amount;
        
        if (result.canAfford) {
          result.remainingBalance = {
            amount: convertedBalance.amount - convertedPrice.amount,
            currency: convertedBalance.currency
          };
        } else {
          result.needsRecharge = {
            amount: convertedPrice.amount - convertedBalance.amount,
            currency: convertedBalance.currency
          };
        }
      } catch (error) {
        console.warn('Could not fetch wallet balance for price display:', error);
      }
    }

    return result;
  }

  /**
   * Calculate price comparison across different registration periods
   */
  calculatePriceComparison(baseCost: Money, periods: number[]): Array<{
    years: number;
    totalPrice: Money;
    yearlyPrice: Money;
    savings?: Money;
    savingsPercentage?: number;
  }> {
    const oneYearPrice = this.calculateDomainPrice(baseCost, 1);
    
    return periods.map(years => {
      const bulkPrice = this.calculateBulkPrice(baseCost, years);
      const yearlyPrice = {
        amount: Math.round((bulkPrice.amount / years) * 100) / 100,
        currency: bulkPrice.currency
      };
      
      const result: any = {
        years,
        totalPrice: bulkPrice,
        yearlyPrice
      };

      // Calculate savings compared to buying year by year
      if (years > 1) {
        const regularTotal = {
          amount: oneYearPrice.amount * years,
          currency: oneYearPrice.currency
        };
        
        result.savings = {
          amount: regularTotal.amount - bulkPrice.amount,
          currency: bulkPrice.currency
        };
        
        result.savingsPercentage = Math.round(
          ((regularTotal.amount - bulkPrice.amount) / regularTotal.amount) * 100
        );
      }

      return result;
    });
  }

  /**
   * Format currency amount for display
   */
  private formatCurrency(amount: Money): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: amount.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(amount.amount);
  }

  /**
   * Calculate revenue and profit for analytics
   */
  calculateRevenue(baseCost: Money, finalPrice: Money): {
    revenue: Money;
    cost: Money;
    profit: Money;
    profitMargin: number;
  } {
    const profit = {
      amount: finalPrice.amount - baseCost.amount,
      currency: finalPrice.currency
    };
    
    const profitMargin = Math.round((profit.amount / finalPrice.amount) * 100);

    return {
      revenue: finalPrice,
      cost: baseCost,
      profit,
      profitMargin
    };
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[] {
    return Object.keys(EXCHANGE_RATES);
  }

  /**
   * Get current exchange rate between two currencies
   */
  getExchangeRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return 1;
    
    const rate = EXCHANGE_RATES[fromCurrency]?.[toCurrency];
    if (!rate) {
      throw new Error(`Exchange rate not available: ${fromCurrency} to ${toCurrency}`);
    }
    
    return rate;
  }
}

export const pricingCalculator = new PricingCalculatorImpl();