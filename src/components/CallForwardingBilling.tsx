import { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, Phone, ArrowUpCircle, ArrowDownCircle, 
  RefreshCw, AlertCircle, CheckCircle2, Settings2, History, Plus
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { supabase } from '../utils/supabase/client';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

async function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    try {
      const response = await fetch('/api/stripe/config');
      const data = await response.json();
      if (data.publishableKey) {
        stripePromise = loadStripe(data.publishableKey);
      }
    } catch (error) {
      console.error('Failed to fetch Stripe config:', error);
    }
  }
  return stripePromise;
}

interface BillingSummary {
  balance_cents: number;
  balance_dollars: string;
  auto_recharge_enabled: boolean;
  auto_recharge_amount_cents: number;
  low_balance_threshold_cents: number;
  has_payment_method: boolean;
  active_numbers: number;
  monthly_number_cost_cents: number;
  current_month_usage: {
    incoming_calls: number;
    outgoing_calls: number;
    total_cost_cents: number;
  };
  pricing: {
    MONTHLY_NUMBER_FEE: number;
    INCOMING_CALL: number;
    OUTGOING_CALL: number;
    AUTO_RECHARGE_AMOUNT: number;
    LOW_BALANCE_THRESHOLD: number;
  };
}

interface Transaction {
  id: string;
  type: string;
  amount_cents: number;
  balance_after_cents: number;
  description: string;
  created_at: string;
}

function PaymentMethodForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const setupResponse = await fetch('/api/call-forwarding/billing/setup-payment-method', {
        method: 'POST',
        headers
      });
      const setupData = await setupResponse.json();

      if (setupData.error) {
        setError(setupData.error);
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        setupData.client_secret,
        {
          payment_method: {
            card: cardElement
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Card setup failed');
        return;
      }

      if (setupIntent?.payment_method) {
        await fetch('/api/call-forwarding/billing/save-payment-method', {
          method: 'POST',
          headers,
          body: JSON.stringify({ payment_method_id: setupIntent.payment_method })
        });
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 border rounded-lg bg-white">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1e293b',
                '::placeholder': { color: '#94a3b8' }
              }
            }
          }}
        />
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <Button type="submit" disabled={loading || !stripe} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
        Save Card
      </Button>
    </form>
  );
}

export function CallForwardingBilling() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('25');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [autoRechargeEnabled, setAutoRechargeEnabled] = useState(true);
  const [autoRechargeAmount, setAutoRechargeAmount] = useState('25');
  const [savingSettings, setSavingSettings] = useState(false);
  const [stripeReady, setStripeReady] = useState<Promise<Stripe | null> | null>(null);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    };
  };

  const fetchBillingSummary = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/call-forwarding/billing/summary', { headers });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setSummary(data);
        setAutoRechargeEnabled(data.auto_recharge_enabled);
        setAutoRechargeAmount((data.auto_recharge_amount_cents / 100).toString());
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchTransactions = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/call-forwarding/billing/transactions?limit=20', { headers });
      const data = await response.json();
      
      if (!data.error) {
        setTransactions(data.transactions || []);
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBillingSummary(), fetchTransactions()]);
      setLoading(false);
      
      // Load Stripe for card form
      const stripe = getStripePromise();
      if (stripe) {
        setStripeReady(stripe);
      }
    };
    loadData();
  }, []);

  const handleTopUp = async () => {
    const amountCents = Math.round(parseFloat(topUpAmount) * 100);
    if (isNaN(amountCents) || amountCents < 500) {
      setError('Minimum top-up is $5');
      return;
    }

    setTopUpLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/call-forwarding/billing/top-up', {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount_cents: amountCents })
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        await fetchBillingSummary();
        await fetchTransactions();
        setTopUpAmount('25');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTopUpLoading(false);
    }
  };

  const saveAutoRechargeSettings = async () => {
    setSavingSettings(true);
    try {
      const headers = await getAuthHeaders();
      await fetch('/api/call-forwarding/billing/auto-recharge', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          enabled: autoRechargeEnabled,
          amount_cents: Math.round(parseFloat(autoRechargeAmount) * 100)
        })
      });
      await fetchBillingSummary();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const isLowBalance = summary && summary.balance_cents < summary.low_balance_threshold_cents;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`p-6 ${isLowBalance ? 'border-amber-400 bg-amber-50' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Current Balance</span>
            {isLowBalance && <AlertCircle className="w-5 h-5 text-amber-500" />}
          </div>
          <div className="text-3xl font-bold text-slate-900">
            ${summary?.balance_dollars || '0.00'}
          </div>
          {isLowBalance && (
            <p className="text-sm text-amber-600 mt-2">
              Balance is low. Add funds or enable auto-recharge.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Active Numbers</span>
            <Phone className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {summary?.active_numbers || 0}
          </div>
          <p className="text-sm text-slate-500 mt-2">
            ${((summary?.monthly_number_cost_cents || 0) / 100).toFixed(2)}/mo
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">This Month Usage</span>
            <History className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            ${((summary?.current_month_usage?.total_cost_cents || 0) / 100).toFixed(2)}
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {summary?.current_month_usage?.incoming_calls || 0} in / {summary?.current_month_usage?.outgoing_calls || 0} out
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-500" />
            Add Funds
          </h3>

          {!summary?.has_payment_method ? (
            <div>
              {!showAddCard ? (
                <div className="text-center py-6">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-600 mb-4">Add a payment method to fund your account</p>
                  <Button onClick={() => setShowAddCard(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Card
                  </Button>
                </div>
              ) : stripeReady ? (
                <Elements stripe={stripeReady}>
                  <PaymentMethodForm onSuccess={() => {
                    setShowAddCard(false);
                    fetchBillingSummary();
                  }} />
                </Elements>
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p>Loading payment form...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-green-700">Payment method on file</span>
              </div>

              <div>
                <Label className="text-slate-700">Top-up Amount</Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <Input
                      type="number"
                      min="5"
                      step="5"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                  <Button 
                    onClick={handleTopUp} 
                    disabled={topUpLoading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {topUpLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ArrowUpCircle className="w-4 h-4 mr-2" />
                        Add Funds
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Minimum $5</p>
              </div>

              <div className="flex gap-2">
                {[10, 25, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTopUpAmount(amount.toString())}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      topUpAmount === amount.toString()
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-500" />
            Auto-Recharge Settings
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-700">Enable Auto-Recharge</Label>
                <p className="text-xs text-slate-500">Automatically add funds when balance is low</p>
              </div>
              <Switch
                checked={autoRechargeEnabled}
                onCheckedChange={setAutoRechargeEnabled}
              />
            </div>

            {autoRechargeEnabled && (
              <>
                <div>
                  <Label className="text-slate-700">Recharge Amount</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <Input
                      type="number"
                      min="5"
                      step="5"
                      value={autoRechargeAmount}
                      onChange={(e) => setAutoRechargeAmount(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <p className="text-sm text-indigo-700">
                    When your balance drops below ${(summary?.low_balance_threshold_cents || 500) / 100}, 
                    we'll automatically charge ${autoRechargeAmount} to your card.
                  </p>
                </div>
              </>
            )}

            <Button 
              onClick={saveAutoRechargeSettings}
              disabled={savingSettings || !summary?.has_payment_method}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {savingSettings ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          Transaction History
        </h3>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Date</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Description</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Amount</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 text-sm text-slate-600">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-800">
                      {tx.description || tx.type.replace(/_/g, ' ')}
                    </td>
                    <td className={`py-3 px-2 text-sm text-right font-medium ${
                      tx.amount_cents >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.amount_cents >= 0 ? '+' : ''}{(tx.amount_cents / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-sm text-right text-slate-600">
                      ${(tx.balance_after_cents / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-slate-50">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Pricing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="text-2xl font-bold text-indigo-600">$3</div>
            <div className="text-sm text-slate-600">per number / month</div>
            <div className="text-xs text-slate-500 mt-1">Unlimited channels</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="text-2xl font-bold text-indigo-600">$0.01</div>
            <div className="text-sm text-slate-600">per incoming call</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="text-2xl font-bold text-indigo-600">$0.02</div>
            <div className="text-sm text-slate-600">per outgoing call</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
