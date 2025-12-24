import Stripe from 'stripe';
import { getDatabaseUrl } from './dbConfig';

let connectionSettings: any;

async function getCredentials() {
  // First, try standard Stripe environment variables (production-ready)
  const standardSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY_TEST;
  const standardPublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY_LIVE || process.env.STRIPE_PUBLISHABLE_KEY_TEST;
  
  if (standardSecretKey && standardPublishableKey) {
    console.log('Using Stripe keys from environment variables');
    return {
      publishableKey: standardPublishableKey,
      secretKey: standardSecretKey,
    };
  }

  // Fallback to Replit connectors (if available)
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error('Stripe credentials not found. Please set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY environment variables, or configure Replit connectors.');
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  
  // Try production first, then fall back to development
  // This allows using the same connection for both environments when production keys are already provided
  const environmentsToTry = isProduction ? ['production', 'development'] : ['development', 'production'];
  
  let lastError: Error | null = null;
  
  for (const targetEnvironment of environmentsToTry) {
    const url = new URL(`https://${hostname}/api/v2/connection`);
    url.searchParams.set('include_secrets', 'true');
    url.searchParams.set('connector_names', connectorName);
    url.searchParams.set('environment', targetEnvironment);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    });

    const data = await response.json();
    
    connectionSettings = data.items?.[0];

    if (connectionSettings?.settings?.publishable && connectionSettings?.settings?.secret) {
      console.log(`Using Stripe ${targetEnvironment} connection from Replit connectors`);
      return {
        publishableKey: connectionSettings.settings.publishable,
        secretKey: connectionSettings.settings.secret,
      };
    }
    
    lastError = new Error(`Stripe ${targetEnvironment} connection not found or incomplete`);
  }

  throw lastError || new Error('No Stripe connection found');
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();

  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil' as any,
  });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = await getStripeSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: getDatabaseUrl(),
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
