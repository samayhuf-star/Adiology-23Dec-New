/**
 * Twilio Service Utility
 * Handles call forwarding functionality using Twilio API
 * 
 * IMPORTANT: This is a demo/mock implementation for UI preview purposes.
 * For production use, all Twilio API calls must be routed through a secure
 * backend server (e.g., Supabase Edge Function, Express server) to protect
 * API credentials. Never expose Twilio credentials in frontend code.
 * 
 * Production Implementation Steps:
 * 1. Create backend endpoints for Twilio API calls
 * 2. Store TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN as server-side secrets
 * 3. Add TwiML webhook handlers for call routing
 * 4. Update this service to call your backend endpoints instead of Twilio directly
 */

export interface TwilioNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  dateCreated: string;
  status: 'active' | 'inactive';
}

export interface ForwardingTarget {
  id: string;
  name: string;
  phoneNumber: string;
  percentage: number;
  isActive: boolean;
}

export interface CallForwardingConfig {
  id: string;
  twilioNumber: TwilioNumber;
  targets: ForwardingTarget[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CallLog {
  sid: string;
  from: string;
  to: string;
  forwardedTo: string;
  targetName: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer';
  duration: number;
  startTime: string;
  endTime?: string;
  direction: 'inbound' | 'outbound';
}

export interface CallStats {
  totalCalls: number;
  completedCalls: number;
  missedCalls: number;
  averageDuration: number;
  callsByTarget: Record<string, number>;
  callsByHour: Record<string, number>;
}

const IS_DEMO_MODE = true;

function getAuthHeader(): string {
  return '';
}

export async function fetchAvailableNumbers(
  countryCode: string = 'US',
  areaCode?: string
): Promise<TwilioNumber[]> {
  if (IS_DEMO_MODE) {
    return generateMockAvailableNumbers();
  }
  return generateMockAvailableNumbers();
}

export async function purchaseNumber(phoneNumber: string): Promise<TwilioNumber | null> {
  if (IS_DEMO_MODE) {
    return {
      sid: `PN_demo_${Date.now()}`,
      phoneNumber: phoneNumber,
      friendlyName: formatPhoneNumber(phoneNumber),
      capabilities: { voice: true, sms: true, mms: false },
      dateCreated: new Date().toISOString(),
      status: 'active',
    };
  }
  return null;
}

export async function getOwnedNumbers(): Promise<TwilioNumber[]> {
  if (IS_DEMO_MODE) {
    return generateMockOwnedNumbers();
  }
  return generateMockOwnedNumbers();
}

export async function getCallLogs(phoneNumber?: string, limit: number = 50): Promise<CallLog[]> {
  if (IS_DEMO_MODE) {
    return generateMockCallLogs();
  }
  return generateMockCallLogs();
}

export function calculateCallStats(logs: CallLog[], targets: ForwardingTarget[]): CallStats {
  const completedCalls = logs.filter(log => log.status === 'completed');
  const missedCalls = logs.filter(log => 
    log.status === 'no-answer' || log.status === 'busy' || log.status === 'failed'
  );

  const totalDuration = completedCalls.reduce((sum, log) => sum + log.duration, 0);
  const averageDuration = completedCalls.length > 0 ? totalDuration / completedCalls.length : 0;

  const callsByTarget: Record<string, number> = {};
  targets.forEach(target => {
    callsByTarget[target.name] = logs.filter(log => 
      log.forwardedTo === target.phoneNumber || log.to === target.phoneNumber
    ).length;
  });

  const callsByHour: Record<string, number> = {};
  logs.forEach(log => {
    const hour = new Date(log.startTime).getHours().toString().padStart(2, '0');
    callsByHour[hour] = (callsByHour[hour] || 0) + 1;
  });

  return {
    totalCalls: logs.length,
    completedCalls: completedCalls.length,
    missedCalls: missedCalls.length,
    averageDuration,
    callsByTarget,
    callsByHour,
  };
}

export function selectTargetByPercentage(targets: ForwardingTarget[]): ForwardingTarget | null {
  const activeTargets = targets.filter(t => t.isActive);
  if (activeTargets.length === 0) return null;

  const totalPercentage = activeTargets.reduce((sum, t) => sum + t.percentage, 0);
  const random = Math.random() * totalPercentage;
  
  let cumulative = 0;
  for (const target of activeTargets) {
    cumulative += target.percentage;
    if (random <= cumulative) {
      return target;
    }
  }
  
  return activeTargets[activeTargets.length - 1];
}

export function generateTwiML(targets: ForwardingTarget[]): string {
  const selectedTarget = selectTargetByPercentage(targets);
  
  if (!selectedTarget) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, no forwarding targets are available at this time.</Say>
  <Hangup/>
</Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="30" action="/call-status">
    <Number>${selectedTarget.phoneNumber}</Number>
  </Dial>
</Response>`;
}

function generateMockAvailableNumbers(): TwilioNumber[] {
  return [
    {
      sid: '',
      phoneNumber: '+14155551234',
      friendlyName: '(415) 555-1234',
      capabilities: { voice: true, sms: true, mms: false },
      dateCreated: new Date().toISOString(),
      status: 'inactive',
    },
    {
      sid: '',
      phoneNumber: '+14155555678',
      friendlyName: '(415) 555-5678',
      capabilities: { voice: true, sms: true, mms: true },
      dateCreated: new Date().toISOString(),
      status: 'inactive',
    },
    {
      sid: '',
      phoneNumber: '+12125559999',
      friendlyName: '(212) 555-9999',
      capabilities: { voice: true, sms: true, mms: false },
      dateCreated: new Date().toISOString(),
      status: 'inactive',
    },
  ];
}

function generateMockOwnedNumbers(): TwilioNumber[] {
  return [
    {
      sid: 'PN_mock_123',
      phoneNumber: '+14155550001',
      friendlyName: 'Main Business Line',
      capabilities: { voice: true, sms: true, mms: false },
      dateCreated: '2025-01-01T00:00:00Z',
      status: 'active',
    },
  ];
}

function generateMockCallLogs(): CallLog[] {
  const statuses: CallLog['status'][] = ['completed', 'completed', 'completed', 'no-answer', 'busy'];
  const targets = ['Target A', 'Target B', 'Target C'];
  const logs: CallLog[] = [];

  for (let i = 0; i < 25; i++) {
    const date = new Date();
    date.setHours(date.getHours() - i);
    
    logs.push({
      sid: `CA_mock_${i}`,
      from: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      to: '+14155550001',
      forwardedTo: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      targetName: targets[i % targets.length],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      duration: Math.floor(Math.random() * 300) + 10,
      startTime: date.toISOString(),
      endTime: new Date(date.getTime() + Math.floor(Math.random() * 300000)).toISOString(),
      direction: 'inbound',
    });
  }

  return logs;
}

export function saveCallForwardingConfig(config: CallForwardingConfig): void {
  const configs = getCallForwardingConfigs();
  const existingIndex = configs.findIndex(c => c.id === config.id);
  
  if (existingIndex >= 0) {
    configs[existingIndex] = { ...config, updatedAt: new Date().toISOString() };
  } else {
    configs.push({ ...config, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  
  localStorage.setItem('callForwardingConfigs', JSON.stringify(configs));
}

export function getCallForwardingConfigs(): CallForwardingConfig[] {
  try {
    const stored = localStorage.getItem('callForwardingConfigs');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function deleteCallForwardingConfig(configId: string): void {
  const configs = getCallForwardingConfigs().filter(c => c.id !== configId);
  localStorage.setItem('callForwardingConfigs', JSON.stringify(configs));
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
