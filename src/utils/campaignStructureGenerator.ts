/**
 * Campaign Structure Generator
 * Generates campaign structures based on selected structure type
 */

import { generateSmartAdCopy } from './adCopyGenerator';

export interface CampaignStructure {
  campaigns: Campaign[];
}

export interface Campaign {
  campaign_name: string;
  adgroups: AdGroup[];
  zip_codes?: string[];
  cities?: string[];
  states?: string[];
  targetCountry?: string;
  budget?: string;
  budget_type?: string;
  bidding_strategy?: string;
  start_date?: string;
  end_date?: string;
  location_type?: string;
  location_code?: string;
  regions?: string[];
}

export interface AdGroup {
  adgroup_name: string;
  keywords: string[];
  match_types: string[];
  ads: Ad[];
  negative_keywords?: string[];
  location_target?: string;
  zip_codes?: string[];
  cities?: string[];
  states?: string[];
}

export interface Ad {
  headline1?: string;
  headline2?: string;
  headline3?: string;
  headline4?: string;
  headline5?: string;
  headline6?: string;
  headline7?: string;
  headline8?: string;
  headline9?: string;
  headline10?: string;
  headline11?: string;
  headline12?: string;
  headline13?: string;
  headline14?: string;
  headline15?: string;
  description1?: string;
  description2?: string;
  description3?: string;
  description4?: string;
  final_url: string;
  path1?: string;
  path2?: string;
  type: 'rsa' | 'dki' | 'callonly';
  extensions?: any[]; // Extensions attached to this ad
}

export interface StructureSettings {
  structureType: string;
  campaignName: string;
  keywords: string[];
  matchTypes: { broad: boolean; phrase: boolean; exact: boolean };
  url: string;
  negativeKeywords?: string[];
  geoType?: string;
  selectedStates?: string[];
  selectedCities?: string[];
  selectedZips?: string[];
  targetCountry?: string;
  ads?: Ad[];
  intentGroups?: { [key: string]: string[] };
  selectedIntents?: string[];
  alphaKeywords?: string[];
  betaKeywords?: string[];
  funnelGroups?: { [key: string]: string[] };
  brandKeywords?: string[];
  nonBrandKeywords?: string[];
  competitorKeywords?: string[];
  smartClusters?: { [key: string]: string[] };
  startDate?: string;
  endDate?: string;
}

/**
 * Main function to generate campaign structure
 */
export function generateCampaignStructure(
  keywords: string[],
  settings: StructureSettings
): CampaignStructure {
  const { structureType } = settings;

  switch (structureType) {
    case 'skag':
      return generateSKAG(keywords, settings);
    case 'stag':
      return generateSTAG(keywords, settings);
    case 'mix':
      return generateMIX(keywords, settings);
    case 'stag_plus':
      return generateSTAGPlus(keywords, settings);
    case 'intent':
      return generateIntentStructure(keywords, settings);
    case 'alpha_beta':
      return generateAlphaBeta(keywords, settings);
    case 'match_type':
      return generateMatchTypeSplit(keywords, settings);
    case 'geo':
      return generateGeoSegmented(keywords, settings);
    case 'funnel':
      return generateFunnelStructure(keywords, settings);
    case 'brand_split':
      return generateBrandSplit(keywords, settings);
    case 'competitor':
      return generateCompetitor(keywords, settings);
    case 'ngram':
      return generateNgramClusters(keywords, settings);
    case 'long_tail':
      return generateLongTail(keywords, settings);
    case 'seasonal':
      return generateSeasonal(keywords, settings);
    default:
      return generateSTAG(keywords, settings); // Default fallback
  }
}

/**
 * Helper function to build location_target string from settings
 */
function buildLocationTarget(settings: StructureSettings): string | undefined {
  const locations: string[] = [];
  
  if (settings.geoType === 'STATE' && settings.selectedStates && settings.selectedStates.length > 0) {
    locations.push(...settings.selectedStates);
  } else if (settings.geoType === 'CITY' && settings.selectedCities && settings.selectedCities.length > 0) {
    locations.push(...settings.selectedCities);
  } else if (settings.geoType === 'ZIP' && settings.selectedZips && settings.selectedZips.length > 0) {
    locations.push(...settings.selectedZips);
  } else if (settings.targetCountry && (settings.geoType === 'COUNTRY' || !settings.geoType || settings.geoType === '')) {
    // Include country when COUNTRY is selected or no specific geo type
    locations.push(settings.targetCountry);
  }
  
  return locations.length > 0 ? locations.join(', ') : undefined;
}

/**
 * Helper function to add location data to campaign
 */
function addLocationDataToCampaign(campaign: Campaign, settings: StructureSettings): void {
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
}

/**
 * Helper function to add location data to ad group
 */
function addLocationDataToAdGroup(adGroup: AdGroup, settings: StructureSettings): void {
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    adGroup.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    adGroup.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    adGroup.states = settings.selectedStates;
  }
}

/**
 * SKAG: Single Keyword Ad Group
 * Each keyword gets its own ad group
 */
function generateSKAG(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  const locationTarget = buildLocationTarget(settings);

  const adgroups = keywords.slice(0, 20).map((keyword) => ({
    adgroup_name: keyword,
    keywords: matchTypes.map(mt => formatKeyword(keyword, mt)),
    match_types: matchTypes,
    ads: ads,
    negative_keywords: negativeKeywords,
    location_target: locationTarget
  }));

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * STAG: Single Theme Ad Group
 * Group keywords thematically
 */
function generateSTAG(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  const locationTarget = buildLocationTarget(settings);
  
  // Simple thematic grouping: group by first word
  const groups: { [key: string]: string[] } = {};
  keywords.forEach(kw => {
    const firstWord = kw.split(' ')[0].toLowerCase();
    if (!groups[firstWord]) {
      groups[firstWord] = [];
    }
    groups[firstWord].push(kw);
  });

  const adgroups = Object.entries(groups).slice(0, 10).map(([theme, groupKeywords], idx) => ({
    adgroup_name: `Ad Group ${idx + 1} - ${theme}`,
    keywords: groupKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
    match_types: matchTypes,
    ads: ads,
    negative_keywords: negativeKeywords,
    location_target: locationTarget
  }));

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * MIX: Hybrid Structure
 * Combination of SKAG and STAG
 */
function generateMIX(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  
  const adgroups: AdGroup[] = [];
  
  // First 5 keywords as SKAG
  keywords.slice(0, 5).forEach((keyword) => {
    const adGroup: AdGroup = {
      adgroup_name: keyword,
      keywords: matchTypes.map(mt => formatKeyword(keyword, mt)),
      match_types: matchTypes,
      ads: ads,
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    };
    addLocationDataToAdGroup(adGroup, settings);
    adgroups.push(adGroup);
  });

  // Rest grouped thematically
  const remaining = keywords.slice(5);
  const groups: { [key: string]: string[] } = {};
  remaining.forEach(kw => {
    const firstWord = kw.split(' ')[0].toLowerCase();
    if (!groups[firstWord]) {
      groups[firstWord] = [];
    }
    groups[firstWord].push(kw);
  });

  Object.entries(groups).slice(0, 5).forEach(([theme, groupKeywords], idx) => {
    const adGroup: AdGroup = {
      adgroup_name: `Mixed Group ${idx + 1} - ${theme}`,
      keywords: groupKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
      match_types: matchTypes,
      ads: ads,
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    };
    addLocationDataToAdGroup(adGroup, settings);
    adgroups.push(adGroup);
  });

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * STAG+: Smart Grouping with ML/N-gram clustering
 */
function generateSTAGPlus(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  
  // Use smart clusters if available, otherwise use n-gram clustering
  const clusters = settings.smartClusters || clusterByNGram(keywords);
  
  const adgroups = Object.entries(clusters).map(([clusterName, clusterKeywords], idx) => {
    const adGroup: AdGroup = {
      adgroup_name: `Smart Group ${idx + 1} - ${clusterName}`,
      keywords: clusterKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
      match_types: matchTypes,
      ads: ads,
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    };
    addLocationDataToAdGroup(adGroup, settings);
    return adGroup;
  });

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * Intent-Based: Group by intent (High Intent, Research, Brand, Competitor)
 */
function generateIntentStructure(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  const intentGroups = settings.intentGroups || {};
  const selectedIntents = settings.selectedIntents || ['high_intent', 'research', 'brand'];
  
  const adgroups: AdGroup[] = [];
  
  selectedIntents.forEach((intent) => {
    const intentKeywords = intentGroups[intent] || [];
    if (intentKeywords.length > 0) {
      adgroups.push({
        adgroup_name: `Intent: ${intent.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        keywords: intentKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
        match_types: matchTypes,
        ads: getIntentBasedAds(intent, settings),
        negative_keywords: negativeKeywords,
    location_target: buildLocationTarget(settings)
      });
    }
  });

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * Alpha-Beta: Alpha winners and Beta discovery
 */
function generateAlphaBeta(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  const negativeKeywords = settings.negativeKeywords || [];
  const alphaKeywords = settings.alphaKeywords || [];
  const betaKeywords = settings.betaKeywords || keywords;
  
  const adgroups: AdGroup[] = [];
  
  // Beta Ad Group (discovery)
  if (betaKeywords.length > 0) {
    adgroups.push({
      adgroup_name: 'Beta - Discovery',
      keywords: betaKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
      match_types: matchTypes,
      ads: getBetaAds(settings),
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    });
  }
  
  // Alpha Ad Group (winners)
  if (alphaKeywords.length > 0) {
    adgroups.push({
      adgroup_name: 'Alpha - Winners',
      keywords: alphaKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
      match_types: matchTypes,
      ads: getAlphaAds(settings),
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    });
  }

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * Match-Type Split: Separate campaigns/ad groups by match type
 */
function generateMatchTypeSplit(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  
  const adgroups: AdGroup[] = [];
  
  matchTypes.forEach((matchType) => {
    adgroups.push({
      adgroup_name: `${matchType.charAt(0).toUpperCase() + matchType.slice(1)} Match`,
      keywords: keywords.map(kw => formatKeyword(kw, matchType)),
      match_types: [matchType],
      ads: ads,
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    });
  });

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * GEO-Segmented: One campaign per geo unit
 */
function generateGeoSegmented(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  
  const campaigns: Campaign[] = [];
  
  if (settings.geoType === 'STATE' && settings.selectedStates) {
    settings.selectedStates.forEach((state) => {
      campaigns.push({
        campaign_name: `${settings.campaignName} - ${state}`,
        adgroups: [{
          adgroup_name: `${state} Ad Group`,
          keywords: keywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
          match_types: matchTypes,
          ads: ads,
          negative_keywords: negativeKeywords,
          location_target: state
        }]
      });
    });
  } else if (settings.geoType === 'CITY' && settings.selectedCities) {
    settings.selectedCities.forEach((city) => {
      campaigns.push({
        campaign_name: `${settings.campaignName} - ${city}`,
        adgroups: [{
          adgroup_name: `${city} Ad Group`,
          keywords: keywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
          match_types: matchTypes,
          ads: ads,
          negative_keywords: negativeKeywords,
          location_target: city
        }]
      });
    });
  } else if (settings.geoType === 'ZIP' && settings.selectedZips) {
    settings.selectedZips.forEach((zip) => {
      campaigns.push({
        campaign_name: `${settings.campaignName} - ${zip}`,
        adgroups: [{
          adgroup_name: `ZIP ${zip} Ad Group`,
          keywords: keywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
          match_types: matchTypes,
          ads: ads,
          negative_keywords: negativeKeywords,
          location_target: zip
        }]
      });
    });
  } else {
    // Default: single campaign
    campaigns.push({
      campaign_name: settings.campaignName,
      adgroups: [{
        adgroup_name: 'Default Ad Group',
        keywords: keywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
        match_types: matchTypes,
        ads: ads,
        negative_keywords: negativeKeywords,
    location_target: buildLocationTarget(settings)
      }]
    });
  }

  return { campaigns };
}

/**
 * Funnel-Based: TOF/MOF/BOF grouping
 */
function generateFunnelStructure(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  const negativeKeywords = settings.negativeKeywords || [];
  const funnelGroups = settings.funnelGroups || {};
  
  const adgroups: AdGroup[] = [];
  
  ['tof', 'mof', 'bof'].forEach((stage) => {
    const stageKeywords = funnelGroups[stage] || [];
    if (stageKeywords.length > 0) {
      const stageName = stage.toUpperCase();
      const adGroup: AdGroup = {
        adgroup_name: `${stageName} - ${getFunnelStageName(stage)}`,
        keywords: stageKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
        match_types: matchTypes,
        ads: getFunnelBasedAds(stage, settings),
        negative_keywords: negativeKeywords,
        location_target: buildLocationTarget(settings)
      };
      addLocationDataToAdGroup(adGroup, settings);
      adgroups.push(adGroup);
    }
  });

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * Brand vs Non-Brand Split
 */
function generateBrandSplit(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  const brandKeywords = settings.brandKeywords || [];
  const nonBrandKeywords = settings.nonBrandKeywords || keywords.filter(kw => !brandKeywords.includes(kw));
  
  const adgroups: AdGroup[] = [];
  
  if (brandKeywords.length > 0) {
    const adGroup: AdGroup = {
      adgroup_name: 'Brand Keywords',
      keywords: brandKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
      match_types: matchTypes,
      ads: ads,
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    };
    addLocationDataToAdGroup(adGroup, settings);
    adgroups.push(adGroup);
  }
  
  if (nonBrandKeywords.length > 0) {
    const adGroup: AdGroup = {
      adgroup_name: 'Non-Brand Keywords',
      keywords: nonBrandKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
      match_types: matchTypes,
      ads: ads,
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    };
    addLocationDataToAdGroup(adGroup, settings);
    adgroups.push(adGroup);
  }

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * Competitor Campaigns
 */
function generateCompetitor(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  const negativeKeywords = settings.negativeKeywords || [];
  const competitorKeywords = settings.competitorKeywords || keywords.filter(kw => 
    ['nextiva', 'hubspot', 'clickcease', 'semrush', 'competitor'].some(c => 
      kw.toLowerCase().includes(c)
    )
  );
  
  const adgroups: AdGroup[] = [];
  
  if (competitorKeywords.length > 0) {
    adgroups.push({
      adgroup_name: 'Competitor Keywords',
      keywords: competitorKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
      match_types: matchTypes,
      ads: getCompetitorAds(settings),
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    });
  }

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * N-Gram Smart Clustering
 */
function generateNgramClusters(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  const clusters = settings.smartClusters || clusterByNGram(keywords);
  
  const adgroups = Object.entries(clusters).map(([clusterName, clusterKeywords], idx) => ({
    adgroup_name: `Cluster ${idx + 1} - ${clusterName}`,
    keywords: clusterKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
    match_types: matchTypes,
    ads: ads,
    negative_keywords: negativeKeywords,
    location_target: buildLocationTarget(settings)
  }));

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * Long-Tail Master: Focus on 4+ word keywords for lower competition & higher conversion
 * Only includes true long-tail keywords (4 or more words)
 */
function generateLongTail(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getLongTailAds(settings);
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  
  // Filter for true long-tail keywords (4+ words only)
  const longTailKeywords = keywords.filter(kw => kw.trim().split(/\s+/).length >= 4);
  
  const adgroups: AdGroup[] = [];
  
  // Group long-tail keywords by theme (first 2 words)
  if (longTailKeywords.length > 0) {
    const longTailGroups: { [key: string]: string[] } = {};
    longTailKeywords.forEach(kw => {
      const words = kw.toLowerCase().split(' ');
      const themeKey = words.slice(0, 2).join(' ');
      if (!longTailGroups[themeKey]) {
        longTailGroups[themeKey] = [];
      }
      longTailGroups[themeKey].push(kw);
    });
    
    Object.entries(longTailGroups).slice(0, 15).forEach(([theme, groupKeywords], idx) => {
      const adGroup: AdGroup = {
        adgroup_name: `Long-Tail ${idx + 1} - ${theme}`,
        keywords: groupKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
        match_types: matchTypes,
        ads: ads,
        negative_keywords: negativeKeywords,
        location_target: buildLocationTarget(settings)
      };
      addLocationDataToAdGroup(adGroup, settings);
      adgroups.push(adGroup);
    });
  }
  
  // If no 4+ word keywords exist, show a message that no true long-tail keywords were found
  // Create a single group with available keywords (but ideally user should generate more long-tail keywords)
  if (adgroups.length === 0) {
    // Try to find keywords with 3+ words as fallback
    const fallbackKeywords = keywords.filter(kw => kw.trim().split(/\s+/).length >= 3);
    if (fallbackKeywords.length > 0) {
      adgroups.push({
        adgroup_name: 'Long-Tail Keywords (3+ words)',
        keywords: fallbackKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
        match_types: matchTypes,
        ads: ads,
        negative_keywords: negativeKeywords,
        location_target: buildLocationTarget(settings)
      });
    } else {
      // Last resort: use longest keywords available
      const sortedByLength = [...keywords].sort((a, b) => 
        b.trim().split(/\s+/).length - a.trim().split(/\s+/).length
      ).slice(0, 20);
      
      adgroups.push({
        adgroup_name: 'Keywords (Consider adding longer keywords)',
        keywords: sortedByLength.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
        match_types: matchTypes,
        ads: ads,
        negative_keywords: negativeKeywords,
        location_target: buildLocationTarget(settings)
      });
    }
  }

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  addLocationDataToCampaign(campaign, settings);
  
  return {
    campaigns: [campaign]
  };
}

/**
 * Seasonal Sprint: Time-based campaigns with start/end dates
 */
function generateSeasonal(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getSeasonalAds(settings);
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  
  // Group keywords thematically for seasonal campaign
  const groups: { [key: string]: string[] } = {};
  keywords.forEach(kw => {
    const firstWord = kw.split(' ')[0].toLowerCase();
    if (!groups[firstWord]) {
      groups[firstWord] = [];
    }
    groups[firstWord].push(kw);
  });

  const adgroups = Object.entries(groups).slice(0, 10).map(([theme, groupKeywords], idx) => {
    const adGroup: AdGroup = {
      adgroup_name: `Seasonal ${idx + 1} - ${theme}`,
      keywords: groupKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
      match_types: matchTypes,
      ads: ads,
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    };
    addLocationDataToAdGroup(adGroup, settings);
    return adGroup;
  });

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups,
    start_date: settings.startDate,
    end_date: settings.endDate
  };
  
  addLocationDataToCampaign(campaign, settings);
  
  return {
    campaigns: [campaign]
  };
}

// Helper Functions

function getMatchTypes(matchTypes: { broad: boolean; phrase: boolean; exact: boolean }): string[] {
  const types: string[] = [];
  if (matchTypes.broad) types.push('broad');
  if (matchTypes.phrase) types.push('phrase');
  if (matchTypes.exact) types.push('exact');
  return types.length > 0 ? types : ['broad', 'phrase', 'exact'];
}

function formatKeyword(keyword: string, matchType: string): string {
  if (matchType === 'exact') {
    return `[${keyword}]`;
  } else if (matchType === 'phrase') {
    return `"${keyword}"`;
  }
  return keyword; // broad
}

function clusterByNGram(keywords: string[]): { [key: string]: string[] } {
  const clusters: { [key: string]: string[] } = {};
  keywords.forEach(kw => {
    const words = kw.toLowerCase().split(' ');
    const clusterKey = words[0] || 'other';
    if (!clusters[clusterKey]) {
      clusters[clusterKey] = [];
    }
    clusters[clusterKey].push(kw);
  });
  return clusters;
}

function getDefaultAds(settings: StructureSettings): Ad[] {
  const mainKeyword = settings.keywords[0] || 'your service';
  
  // Use smart ad copy generator for Google-compliant ads
  const smartAd = generateSmartAdCopy(mainKeyword);
  
  return [{
    type: 'rsa',
    headline1: smartAd.headline1,
    headline2: smartAd.headline2,
    headline3: smartAd.headline3,
    description1: smartAd.description1,
    description2: smartAd.description2,
    final_url: settings.url
  }];
}

function getAlphaAds(settings: StructureSettings): Ad[] {
  const mainKeyword = settings.keywords[0] || 'your service';
  return [{
    type: 'rsa',
    headline1: `${mainKeyword} - Exact Match Solution`,
    headline2: 'Precision Targeting',
    headline3: 'Optimized Performance',
    description1: `Get the exact ${mainKeyword} solution you need.`,
    description2: 'Tailored for high-converting searches.',
    final_url: settings.url
  }];
}

function getBetaAds(settings: StructureSettings): Ad[] {
  const mainKeyword = settings.keywords[0] || 'your service';
  return [{
    type: 'rsa',
    headline1: `Best ${mainKeyword} Options`,
    headline2: 'Compare & Choose',
    headline3: 'Multiple Solutions',
    description1: `Explore various ${mainKeyword} options.`,
    description2: 'Find the perfect fit for your needs.',
    final_url: settings.url
  }];
}

function getIntentBasedAds(intent: string, settings: StructureSettings): Ad[] {
  const mainKeyword = settings.keywords[0] || 'your service';
  
  if (intent === 'high_intent') {
    return [{
      type: 'rsa',
      headline1: `Need ${mainKeyword} Now?`,
      headline2: 'Immediate Solutions',
      headline3: 'Fast Response',
      description1: `Get ${mainKeyword} immediately.`,
      description2: 'Quick and reliable service.',
      final_url: settings.url
    }];
  } else if (intent === 'research') {
    return [{
      type: 'rsa',
      headline1: `Affordable ${mainKeyword} Info`,
      headline2: 'Compare Prices',
      headline3: 'Research Options',
      description1: `Learn about ${mainKeyword} pricing.`,
      description2: 'Make informed decisions.',
      final_url: settings.url
    }];
  }
  
  return getDefaultAds(settings);
}

function getCompetitorAds(settings: StructureSettings): Ad[] {
  return [{
    type: 'rsa',
    headline1: 'Better Than Your Current Provider',
    headline2: 'Superior Solutions',
    headline3: 'Proven Results',
    description1: 'Switch to a better solution.',
    description2: 'Experience the difference.',
    final_url: settings.url
  }];
}

function getFunnelBasedAds(stage: string, settings: StructureSettings): Ad[] {
  const mainKeyword = settings.keywords[0] || 'your service';
  
  if (stage === 'tof') {
    return [{
      type: 'rsa',
      headline1: `Learn About ${mainKeyword}`,
      headline2: 'Educational Resources',
      headline3: 'Expert Guides',
      description1: `Discover everything about ${mainKeyword}.`,
      description2: 'Start your journey here.',
      final_url: settings.url
    }];
  } else if (stage === 'bof') {
    return [{
      type: 'rsa',
      headline1: `Get ${mainKeyword} Today`,
      headline2: 'Call to Action',
      headline3: 'Limited Time Offer',
      description1: `Act now and get ${mainKeyword}.`,
      description2: 'Don\'t miss out!',
      final_url: settings.url
    }];
  }
  
  return getDefaultAds(settings);
}

function getFunnelStageName(stage: string): string {
  const names: { [key: string]: string } = {
    'tof': 'Top of Funnel',
    'mof': 'Middle of Funnel',
    'bof': 'Bottom of Funnel'
  };
  return names[stage] || stage;
}

function getLongTailAds(settings: StructureSettings): Ad[] {
  const mainKeyword = settings.keywords[0] || 'your service';
  return [{
    type: 'rsa',
    headline1: `Specific ${mainKeyword} Solutions`,
    headline2: 'Targeted Results',
    headline3: 'Low Competition Keywords',
    description1: `Find exactly what you need with our targeted ${mainKeyword} solutions.`,
    description2: 'Higher conversion rates with specific keyword targeting.',
    final_url: settings.url
  }];
}

function getSeasonalAds(settings: StructureSettings): Ad[] {
  const mainKeyword = settings.keywords[0] || 'your service';
  return [{
    type: 'rsa',
    headline1: `Limited Time ${mainKeyword} Offer`,
    headline2: 'Seasonal Special - Act Now',
    headline3: 'Exclusive Deals Available',
    description1: `Don't miss our limited-time ${mainKeyword} offer. Book today!`,
    description2: 'Seasonal promotion ends soon. Get your discount now!',
    final_url: settings.url
  }];
}
