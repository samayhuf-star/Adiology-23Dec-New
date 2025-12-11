/**
 * Campaign Intelligence Orchestrator
 * 
 * Main function to generate complete campaign intelligence
 */

import { classifyIntent, type IntentClassifierInput, type IntentClassificationResult } from './intentClassifier';
import { extractLandingPageContent, type LandingPageExtractionResult } from './landingPageExtractor';
import { getVerticalConfig, type VerticalConfig } from './verticalTemplates';
import { calculateBidSuggestions, type BidSuggestion } from './bidSuggestions';
import { runPolicyChecks, type PolicyCheck } from './policyChecks';
import { getLocalizationConfig, type LocalizationConfig } from './localization';
import { generateTrackingConfig, type TrackingConfig } from './tracking';
import { getDeviceConfig, type DeviceConfig } from './deviceDefaults';
import type { CampaignIntelligence, Vertical, CampaignIntent } from './schemas';

export interface CampaignIntelligenceInput {
  goal: string;
  goalType?: 'calls' | 'leads' | 'purchases' | 'traffic';
  landingPageUrl: string;
  vertical: Vertical | string;
  geo: string;
  language?: string;
  campaignId?: string;
  trackingPhone?: string;
  allowedDomains?: string[];
  baseCPCEstimate?: number;
}

/**
 * Generate complete campaign intelligence
 */
export async function generateCampaignIntelligence(
  input: CampaignIntelligenceInput
): Promise<CampaignIntelligence> {
  // 1. Extract landing page content
  const landingPage = await extractLandingPageContent(input.landingPageUrl);

  // 2. Classify intent
  const intentResult = classifyIntent({
    goal: input.goal,
    goalType: input.goalType,
    landingPageUrl: input.landingPageUrl,
    landingPageData: {
      hasPhone: landingPage.phones.length > 0,
      hasForm: false, // TODO: Detect forms in landing page
      hasEcommerce: false, // TODO: Detect e-commerce signals
      hasCart: false,
      hasPriceTags: false,
    },
    trackingPhone: input.trackingPhone,
    vertical: input.vertical,
  });

  // 3. Get vertical config
  const vertical = getVerticalConfig(input.vertical);

  // 4. Get localization config
  const localization = getLocalizationConfig(input.geo, input.language);

  // 5. Generate tracking config
  const tracking = generateTrackingConfig(input.campaignId || 'campaign-1', {
    dniEnabled: intentResult.intent === 'CALL_INTENT' && landingPage.phones.length > 0,
  });

  // 6. Get device config
  const deviceConfig = getDeviceConfig(intentResult.intent);

  // 7. Run policy checks (on sample content - will be run on actual ads later)
  const policyCheck = runPolicyChecks({
    vertical: input.vertical,
    allowedDomains: input.allowedDomains,
  });

  // 8. Bid suggestions will be generated per keyword later
  const bidSuggestions: BidSuggestion[] = [];

  return {
    intent: intentResult,
    landingPage,
    vertical,
    bidSuggestions,
    policyCheck,
    localization,
    tracking,
    deviceConfig,
    generatedAt: new Date().toISOString(),
  };
}

