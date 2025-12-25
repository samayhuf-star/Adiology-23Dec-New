-- Domain Management Database Schema

-- Wallets table for prepaid credit system
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    balance_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    auto_recharge_enabled BOOLEAN NOT NULL DEFAULT true,
    recharge_amount DECIMAL(10,2) NOT NULL DEFAULT 25.00,
    recharge_threshold DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    payment_method_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Wallet transactions for audit trail
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('debit', 'credit', 'recharge')),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description TEXT NOT NULL,
    service_type VARCHAR(20) CHECK (service_type IN ('domain', 'vps', 'addon')),
    related_entity_id UUID,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Domains table for registered domains
CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) NOT NULL,
    registrar VARCHAR(100) NOT NULL,
    registration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'transferred')),
    contact_info JSONB NOT NULL,
    nameservers TEXT[] DEFAULT ARRAY[]::TEXT[],
    dns_managed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(domain_name)
);

-- DNS zones for DNS management
CREATE TABLE IF NOT EXISTS dns_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('cloudflare', 'route53', 'registrar')),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(domain_id)
);

-- DNS records
CREATE TABLE IF NOT EXISTS dns_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES dns_zones(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS')),
    name VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    ttl INTEGER NOT NULL DEFAULT 300,
    priority INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Domain purchase transactions
CREATE TABLE IF NOT EXISTS domain_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('registration', 'renewal', 'transfer')),
    registrar VARCHAR(100) NOT NULL,
    years INTEGER NOT NULL,
    base_cost DECIMAL(10,2) NOT NULL,
    markup_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    wallet_transaction_id UUID REFERENCES wallet_transactions(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    registrar_transaction_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue tracking for analytics
CREATE TABLE IF NOT EXISTS domain_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES domain_transactions(id) ON DELETE CASCADE,
    revenue_amount DECIMAL(10,2) NOT NULL,
    cost_amount DECIMAL(10,2) NOT NULL,
    profit_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain_name ON domains(domain_name);
CREATE INDEX IF NOT EXISTS idx_domains_expiration_date ON domains(expiration_date);
CREATE INDEX IF NOT EXISTS idx_dns_records_zone_id ON dns_records(zone_id);
CREATE INDEX IF NOT EXISTS idx_domain_transactions_user_id ON domain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_transactions_status ON domain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_domain_revenue_recorded_at ON domain_revenue(recorded_at);

-- RLS (Row Level Security) policies
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE dns_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE dns_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_revenue ENABLE ROW LEVEL SECURITY;

-- Wallet policies
CREATE POLICY "Users can view their own wallet" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wallet transaction policies
CREATE POLICY "Users can view their own wallet transactions" ON wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM wallets 
            WHERE wallets.id = wallet_transactions.wallet_id 
            AND wallets.user_id = auth.uid()
        )
    );

-- Domain policies
CREATE POLICY "Users can view their own domains" ON domains
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains" ON domains
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domains" ON domains
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DNS zone policies
CREATE POLICY "Users can manage DNS for their domains" ON dns_zones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM domains 
            WHERE domains.id = dns_zones.domain_id 
            AND domains.user_id = auth.uid()
        )
    );

-- DNS record policies
CREATE POLICY "Users can manage DNS records for their domains" ON dns_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM dns_zones 
            JOIN domains ON domains.id = dns_zones.domain_id
            WHERE dns_zones.id = dns_records.zone_id 
            AND domains.user_id = auth.uid()
        )
    );

-- Domain transaction policies
CREATE POLICY "Users can view their own domain transactions" ON domain_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Revenue policies (admin only)
CREATE POLICY "Only admins can view revenue data" ON domain_revenue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
                 OR auth.users.raw_user_meta_data->>'role' = 'superadmin')
        )
    );

-- Functions for wallet operations
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE wallets 
    SET 
        balance_amount = NEW.balance_after,
        updated_at = NOW()
    WHERE id = NEW.wallet_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update wallet balance after transaction
CREATE TRIGGER update_wallet_balance_trigger
    AFTER INSERT ON wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_balance();

-- Function to check auto-recharge threshold
CREATE OR REPLACE FUNCTION check_auto_recharge()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if balance fell below threshold and auto-recharge is enabled
    IF NEW.balance_amount < (
        SELECT recharge_threshold 
        FROM wallets 
        WHERE id = NEW.wallet_id 
        AND auto_recharge_enabled = true
    ) THEN
        -- Insert a notification or trigger auto-recharge
        -- This would typically trigger an external process
        INSERT INTO wallet_transactions (
            wallet_id,
            type,
            amount,
            currency,
            description,
            service_type,
            balance_before,
            balance_after
        ) VALUES (
            NEW.wallet_id,
            'credit',
            (SELECT recharge_amount FROM wallets WHERE id = NEW.wallet_id),
            'USD',
            'Auto-recharge triggered',
            NULL,
            NEW.balance_amount,
            NEW.balance_amount + (SELECT recharge_amount FROM wallets WHERE id = NEW.wallet_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-recharge check
CREATE TRIGGER check_auto_recharge_trigger
    AFTER UPDATE OF balance_amount ON wallets
    FOR EACH ROW
    WHEN (NEW.balance_amount < OLD.balance_amount)
    EXECUTE FUNCTION check_auto_recharge();

-- Additional tables for billing separation

-- User payment methods (separate from wallet)
CREATE TABLE IF NOT EXISTS user_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_method_id VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('card', 'bank')),
    last4 VARCHAR(4),
    brand VARCHAR(50),
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_wallet_method BOOLEAN NOT NULL DEFAULT false,
    is_subscription_method BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, payment_method_id)
);

-- User subscriptions (separate from wallet)
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription billing history (separate from wallet transactions)
CREATE TABLE IF NOT EXISTS subscription_billing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
    stripe_invoice_id VARCHAR(255),
    billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_billing_history_subscription_id ON subscription_billing_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_billing_history_billing_date ON subscription_billing_history(billing_date);

-- RLS policies for new tables
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_billing_history ENABLE ROW LEVEL SECURITY;

-- Payment methods policies
CREATE POLICY "Users can manage their own payment methods" ON user_payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- Subscription policies
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Subscription billing history policies
CREATE POLICY "Users can view their own billing history" ON subscription_billing_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_subscriptions.id = subscription_billing_history.subscription_id 
            AND user_subscriptions.user_id = auth.uid()
        )
    );

-- Function to ensure billing separation
CREATE OR REPLACE FUNCTION enforce_billing_separation()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent wallet transactions from being used for subscription billing
    IF NEW.description ILIKE '%subscription%' OR NEW.description ILIKE '%monthly%' THEN
        RAISE EXCEPTION 'Subscription billing must be separate from wallet transactions';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce billing separation
CREATE TRIGGER enforce_billing_separation_trigger
    BEFORE INSERT OR UPDATE ON wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION enforce_billing_separation();