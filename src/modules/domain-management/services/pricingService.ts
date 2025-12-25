import { PricingCalculator, Money, MARKUP_PERCENTAGE } from '../types';

class PricingCalculatorImpl implements PricingCalculator {
  calculateDomainPrice(baseCost: Money, registrationYears: number): Money {
    const totalBaseCost = baseCost.amount * registrationYears;
    const markupAmount = this.applyMarkup({ amount: totalBaseCost, currency: baseCost.currency }, MARKUP_PERCENTAGE);
    
    return markupAmount;
  }

  calculateRenewalPrice(baseCost: Money, renewalYears: number): Money {
    return this.calculateDomainPrice(baseCost, renewalYears);
  }

  applyMarkup(cost: Money, markupPercentage: number): Money {
    const markupAmount = cost.amount * (markupPercentage / 100);
    return {
      amount: cost.amount + markupAmount,
      currency: cost.currency
    };
  }

  async convertCurrency(amount: Money, targetCurrency: string): Promise<Money> {
    // TODO: Implement currency conversion
    if (amount.currency === targetCurrency) {
      return amount;
    }
    
    // For now, return as-is (would need exchange rate API)
    return {
      amount: amount.amount,
      currency: targetCurrency
    };
  }
}

export const pricingCalculator = new PricingCalculatorImpl();