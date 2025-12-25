// Pricing Service - Handle VM pricing calculations and real-time updates

import { VMConfiguration, PriceInfo, PricingResponse } from '../types';

class PricingService {
  private baseURL = '/api/vm-management';
  private readonly MARKUP_PERCENTAGE = 0.20; // 20% markup
  private readonly HOURS_PER_MONTH = 730; // Standard monthly hours calculation

  /**
   * Calculate pricing for a VM configuration
   */
  async calculatePrice(config: VMConfiguration): Promise<PriceInfo> {
    try {
      const response = await fetch(`${this.baseURL}/pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data: PricingResponse = await response.json();

      if (!data.success || !data.pricing) {
        throw new Error(data.error || 'Failed to calculate pricing');
      }

      return data.pricing;
    } catch (error) {
      console.error('Error calculating price:', error);
      throw error;
    }
  }

  /**
   * Get provider's base price for configuration
   */
  async getProviderPrice(config: VMConfiguration): Promise<number> {
    try {
      const response = await fetch(`${this.baseURL}/pricing/provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get provider pricing');
      }

      return data.hourlyRate;
    } catch (error) {
      console.error('Error getting provider price:', error);
      throw error;
    }
  }

  /**
   * Apply markup to base price and round to nearest currency unit
   */
  applyMarkup(basePrice: number): number {
    const priceWithMarkup = basePrice * (1 + this.MARKUP_PERCENTAGE);
    return Math.round(priceWithMarkup * 100) / 100; // Round to nearest cent
  }

  /**
   * Convert hourly rate to monthly rate
   */
  convertToMonthlyRate(hourlyRate: number): number {
    return hourlyRate * this.HOURS_PER_MONTH;
  }

  /**
   * Calculate complete pricing information
   */
  calculatePriceInfo(providerHourlyRate: number, currency: string = 'USD'): PriceInfo {
    const hourlyRateWithMarkup = this.applyMarkup(providerHourlyRate);
    const monthlyRate = this.convertToMonthlyRate(hourlyRateWithMarkup);
    const roundedMonthlyRate = Math.round(monthlyRate * 100) / 100;

    return {
      hourlyRate: hourlyRateWithMarkup,
      monthlyRate: roundedMonthlyRate,
      providerRate: providerHourlyRate,
      markup: this.MARKUP_PERCENTAGE,
      currency,
    };
  }

  /**
   * Get cached pricing for quick updates (fallback when API is slow)
   */
  getCachedPrice(configKey: string): PriceInfo | null {
    try {
      const cached = localStorage.getItem(`vm_price_${configKey}`);
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is less than 5 minutes old
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          return data.pricing;
        }
      }
    } catch (error) {
      console.warn('Error reading cached price:', error);
    }
    return null;
  }

  /**
   * Cache pricing information
   */
  setCachedPrice(configKey: string, pricing: PriceInfo): void {
    try {
      const cacheData = {
        pricing,
        timestamp: Date.now(),
      };
      localStorage.setItem(`vm_price_${configKey}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error caching price:', error);
    }
  }

  /**
   * Generate cache key for configuration
   */
  generateConfigKey(config: VMConfiguration): string {
    return `${config.operatingSystem.type}_${config.operatingSystem.version}_${config.region.code}_${config.size.cpu}_${config.size.ram}_${config.size.storage}`;
  }

  /**
   * Get pricing with caching support
   */
  async getPricingWithCache(config: VMConfiguration): Promise<PriceInfo> {
    const configKey = this.generateConfigKey(config);
    
    // Try cache first
    const cached = this.getCachedPrice(configKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const pricing = await this.calculatePrice(config);
    
    // Cache the result
    this.setCachedPrice(configKey, pricing);
    
    return pricing;
  }

  /**
   * Clear all cached pricing data
   */
  clearPricingCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('vm_price_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error clearing pricing cache:', error);
    }
  }
}

export const pricingService = new PricingService();