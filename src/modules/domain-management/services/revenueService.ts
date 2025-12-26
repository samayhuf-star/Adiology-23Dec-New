import { supabase } from '../../../utils/supabase/client';
import { Money } from '../types';
import { pricingCalculator } from './pricingService';

interface RevenueMetrics {
  totalRevenue: Money;
  totalCost: Money;
  totalProfit: Money;
  profitMargin: number;
  transactionCount: number;
  averageOrderValue: Money;
  topTlds: Array<{
    tld: string;
    revenue: Money;
    count: number;
  }>;
}

interface RevenueAnalysis {
  daily: RevenueMetrics;
  weekly: RevenueMetrics;
  monthly: RevenueMetrics;
  yearly: RevenueMetrics;
}

interface CostAnalysis {
  registrarCosts: Array<{
    registrar: string;
    totalCost: Money;
    transactionCount: number;
    averageCost: Money;
  }>;
  serviceCosts: {
    domainRegistration: Money;
    domainRenewal: Money;
    domainTransfer: Money;
  };
  profitByService: {
    domainRegistration: Money;
    domainRenewal: Money;
    domainTransfer: Money;
  };
}

class RevenueServiceImpl {
  /**
   * Record revenue for a domain transaction
   */
  async recordRevenue(
    transactionId: string,
    baseCost: Money,
    finalPrice: Money
  ): Promise<void> {
    try {
      const revenueData = pricingCalculator.calculateRevenue(baseCost, finalPrice);

      const { error } = await supabase
        .from('domain_revenue')
        .insert({
          transaction_id: transactionId,
          revenue_amount: revenueData.revenue.amount,
          cost_amount: revenueData.cost.amount,
          profit_amount: revenueData.profit.amount,
          currency: finalPrice.currency,
          recorded_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording revenue:', error);
      throw new Error('Failed to record revenue data');
    }
  }

  /**
   * Get revenue metrics for a specific time period
   */
  async getRevenueMetrics(
    startDate: Date,
    endDate: Date,
    currency: string = 'USD'
  ): Promise<RevenueMetrics> {
    try {
      // Get revenue data
      const { data: revenueData, error: revenueError } = await supabase
        .from('domain_revenue')
        .select(`
          revenue_amount,
          cost_amount,
          profit_amount,
          currency,
          domain_transactions!inner(
            domain_name,
            transaction_type,
            registrar
          )
        `)
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString());

      if (revenueError) throw revenueError;

      if (!revenueData || revenueData.length === 0) {
        return this.getEmptyMetrics(currency);
      }

      // Convert all amounts to target currency and calculate totals
      let totalRevenue = 0;
      let totalCost = 0;
      let totalProfit = 0;
      const tldCounts: Record<string, { revenue: number; count: number }> = {};

      for (const record of revenueData) {
        // Convert to target currency (simplified - in production use real rates)
        const conversionRate = record.currency === currency ? 1 : 1; // Simplified
        
        totalRevenue += record.revenue_amount * conversionRate;
        totalCost += record.cost_amount * conversionRate;
        totalProfit += record.profit_amount * conversionRate;

        // Track TLD performance
        const domain = record.domain_transactions.domain_name;
        const tld = domain.substring(domain.lastIndexOf('.'));
        
        if (!tldCounts[tld]) {
          tldCounts[tld] = { revenue: 0, count: 0 };
        }
        tldCounts[tld].revenue += record.revenue_amount * conversionRate;
        tldCounts[tld].count += 1;
      }

      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
      const averageOrderValue = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;

      // Sort TLDs by revenue
      const topTlds = Object.entries(tldCounts)
        .map(([tld, data]) => ({
          tld,
          revenue: { amount: data.revenue, currency },
          count: data.count
        }))
        .sort((a, b) => b.revenue.amount - a.revenue.amount)
        .slice(0, 10);

      return {
        totalRevenue: { amount: Math.round(totalRevenue * 100) / 100, currency },
        totalCost: { amount: Math.round(totalCost * 100) / 100, currency },
        totalProfit: { amount: Math.round(totalProfit * 100) / 100, currency },
        profitMargin: Math.round(profitMargin * 100) / 100,
        transactionCount: revenueData.length,
        averageOrderValue: { amount: Math.round(averageOrderValue * 100) / 100, currency },
        topTlds
      };
    } catch (error) {
      console.error('Error getting revenue metrics:', error);
      throw new Error('Failed to retrieve revenue metrics');
    }
  }

  /**
   * Get comprehensive revenue analysis
   */
  async getRevenueAnalysis(currency: string = 'USD'): Promise<RevenueAnalysis> {
    const now = new Date();
    
    // Calculate date ranges
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [daily, weekly, monthly, yearly] = await Promise.all([
      this.getRevenueMetrics(startOfDay, now, currency),
      this.getRevenueMetrics(startOfWeek, now, currency),
      this.getRevenueMetrics(startOfMonth, now, currency),
      this.getRevenueMetrics(startOfYear, now, currency)
    ]);

    return { daily, weekly, monthly, yearly };
  }

  /**
   * Get cost analysis by registrar and service type
   */
  async getCostAnalysis(
    startDate: Date,
    endDate: Date,
    currency: string = 'USD'
  ): Promise<CostAnalysis> {
    try {
      const { data: costData, error } = await supabase
        .from('domain_revenue')
        .select(`
          cost_amount,
          revenue_amount,
          profit_amount,
          currency,
          domain_transactions!inner(
            registrar,
            transaction_type,
            base_cost,
            total_amount
          )
        `)
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString());

      if (error) throw error;

      const registrarCosts: Record<string, { cost: number; count: number }> = {};
      const serviceCosts = {
        domainRegistration: 0,
        domainRenewal: 0,
        domainTransfer: 0
      };
      const profitByService = {
        domainRegistration: 0,
        domainRenewal: 0,
        domainTransfer: 0
      };

      for (const record of costData) {
        const registrar = record.domain_transactions.registrar;
        const transactionType = record.domain_transactions.transaction_type;
        const cost = record.cost_amount;
        const profit = record.profit_amount;

        // Track registrar costs
        if (!registrarCosts[registrar]) {
          registrarCosts[registrar] = { cost: 0, count: 0 };
        }
        registrarCosts[registrar].cost += cost;
        registrarCosts[registrar].count += 1;

        // Track service costs and profits
        if (transactionType === 'registration') {
          serviceCosts.domainRegistration += cost;
          profitByService.domainRegistration += profit;
        } else if (transactionType === 'renewal') {
          serviceCosts.domainRenewal += cost;
          profitByService.domainRenewal += profit;
        } else if (transactionType === 'transfer') {
          serviceCosts.domainTransfer += cost;
          profitByService.domainTransfer += profit;
        }
      }

      return {
        registrarCosts: Object.entries(registrarCosts).map(([registrar, data]) => ({
          registrar,
          totalCost: { amount: Math.round(data.cost * 100) / 100, currency },
          transactionCount: data.count,
          averageCost: { 
            amount: Math.round((data.cost / data.count) * 100) / 100, 
            currency 
          }
        })),
        serviceCosts: {
          domainRegistration: { amount: Math.round(serviceCosts.domainRegistration * 100) / 100, currency },
          domainRenewal: { amount: Math.round(serviceCosts.domainRenewal * 100) / 100, currency },
          domainTransfer: { amount: Math.round(serviceCosts.domainTransfer * 100) / 100, currency }
        },
        profitByService: {
          domainRegistration: { amount: Math.round(profitByService.domainRegistration * 100) / 100, currency },
          domainRenewal: { amount: Math.round(profitByService.domainRenewal * 100) / 100, currency },
          domainTransfer: { amount: Math.round(profitByService.domainTransfer * 100) / 100, currency }
        }
      };
    } catch (error) {
      console.error('Error getting cost analysis:', error);
      throw new Error('Failed to retrieve cost analysis');
    }
  }

  /**
   * Get revenue dashboard data
   */
  async getRevenueDashboard(currency: string = 'USD'): Promise<{
    analysis: RevenueAnalysis;
    costAnalysis: CostAnalysis;
    trends: {
      revenueGrowth: number;
      profitGrowth: number;
      transactionGrowth: number;
    };
  }> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

    const [analysis, costAnalysis, currentPeriod, previousPeriod] = await Promise.all([
      this.getRevenueAnalysis(currency),
      this.getCostAnalysis(thirtyDaysAgo, now, currency),
      this.getRevenueMetrics(thirtyDaysAgo, now, currency),
      this.getRevenueMetrics(sixtyDaysAgo, thirtyDaysAgo, currency)
    ]);

    // Calculate growth trends
    const revenueGrowth = previousPeriod.totalRevenue.amount > 0 
      ? ((currentPeriod.totalRevenue.amount - previousPeriod.totalRevenue.amount) / previousPeriod.totalRevenue.amount) * 100
      : 0;

    const profitGrowth = previousPeriod.totalProfit.amount > 0
      ? ((currentPeriod.totalProfit.amount - previousPeriod.totalProfit.amount) / previousPeriod.totalProfit.amount) * 100
      : 0;

    const transactionGrowth = previousPeriod.transactionCount > 0
      ? ((currentPeriod.transactionCount - previousPeriod.transactionCount) / previousPeriod.transactionCount) * 100
      : 0;

    return {
      analysis,
      costAnalysis,
      trends: {
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        profitGrowth: Math.round(profitGrowth * 100) / 100,
        transactionGrowth: Math.round(transactionGrowth * 100) / 100
      }
    };
  }

  private getEmptyMetrics(currency: string): RevenueMetrics {
    return {
      totalRevenue: { amount: 0, currency },
      totalCost: { amount: 0, currency },
      totalProfit: { amount: 0, currency },
      profitMargin: 0,
      transactionCount: 0,
      averageOrderValue: { amount: 0, currency },
      topTlds: []
    };
  }
}

export const revenueService = new RevenueServiceImpl();