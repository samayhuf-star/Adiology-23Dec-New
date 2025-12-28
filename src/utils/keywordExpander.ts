/**
 * Keyword Expander Utility
 * Generates 100-150 high-quality keywords following Google Ads best practices
 * 
 * Structure:
 * - 40% High-intent buyer keywords
 * - 30% Long-tail commercial keywords
 * - 15% Problem-solution keywords
 * - 10% Brand/trust keywords
 * - 5% Urgency keywords
 */

interface KeywordExpansionConfig {
  baseService: string;
  serviceVariations: string[];
  problems: string[];
  locations?: string[];
  urgencyModifiers?: string[];
  trustModifiers?: string[];
  commercialModifiers?: string[];
}

const DEFAULT_URGENCY_MODIFIERS = [
  "emergency", "24 hour", "same day", "urgent", "after hours", 
  "weekend", "immediate", "fast", "quick", "rush"
];

const DEFAULT_TRUST_MODIFIERS = [
  "licensed", "certified", "insured", "professional", "trusted",
  "top rated", "best rated", "5 star", "reliable", "experienced",
  "affordable", "cheap", "low cost", "budget", "quality"
];

const DEFAULT_COMMERCIAL_MODIFIERS = [
  "near me", "close to me", "in my area", "local", "nearby",
  "hire", "find", "get", "need", "looking for",
  "cost", "price", "quote", "estimate", "rates",
  "service", "services", "company", "contractor", "specialist"
];

const LOCATION_MODIFIERS = [
  "near me", "in my area", "local", "nearby", "close to me"
];

const ACTION_MODIFIERS = [
  "call now", "book now", "schedule", "get quote", "free estimate"
];

export function expandKeywords(config: KeywordExpansionConfig): string[] {
  const {
    baseService,
    serviceVariations,
    problems,
    urgencyModifiers = DEFAULT_URGENCY_MODIFIERS,
    trustModifiers = DEFAULT_TRUST_MODIFIERS,
    commercialModifiers = DEFAULT_COMMERCIAL_MODIFIERS
  } = config;

  const keywords: Set<string> = new Set();
  
  // 1. HIGH-INTENT BUYER KEYWORDS (40%)
  // "service near me" patterns
  serviceVariations.forEach(service => {
    LOCATION_MODIFIERS.forEach(loc => {
      keywords.add(`${service} ${loc}`);
    });
    
    // Direct action keywords
    keywords.add(`hire ${service}`);
    keywords.add(`find ${service}`);
    keywords.add(`get ${service}`);
    keywords.add(`need ${service}`);
    keywords.add(`${service} company`);
    keywords.add(`${service} contractor`);
    keywords.add(`${service} service`);
    keywords.add(`${service} services`);
  });
  
  // 2. LONG-TAIL COMMERCIAL KEYWORDS (30%)
  // Cost/pricing keywords
  serviceVariations.forEach(service => {
    keywords.add(`${service} cost`);
    keywords.add(`${service} price`);
    keywords.add(`${service} pricing`);
    keywords.add(`${service} rates`);
    keywords.add(`${service} quote`);
    keywords.add(`${service} estimate`);
    keywords.add(`free ${service} estimate`);
    keywords.add(`free ${service} quote`);
    keywords.add(`${service} cost near me`);
    keywords.add(`how much does ${service} cost`);
    keywords.add(`${service} price per hour`);
  });
  
  // Trust + Service combinations
  trustModifiers.slice(0, 10).forEach(trust => {
    serviceVariations.slice(0, 5).forEach(service => {
      keywords.add(`${trust} ${service}`);
      keywords.add(`${trust} ${service} near me`);
    });
  });
  
  // 3. PROBLEM-SOLUTION KEYWORDS (15%)
  problems.forEach(problem => {
    keywords.add(problem);
    keywords.add(`${problem} near me`);
    keywords.add(`${problem} service`);
    keywords.add(`fix ${problem}`);
    keywords.add(`repair ${problem}`);
    keywords.add(`${problem} help`);
    keywords.add(`${problem} company`);
  });
  
  // 4. BRAND/TRUST KEYWORDS (10%)
  trustModifiers.forEach(trust => {
    keywords.add(`${trust} ${baseService}`);
    keywords.add(`${trust} ${baseService} near me`);
  });
  
  // 5. URGENCY KEYWORDS (5%)
  urgencyModifiers.forEach(urgency => {
    keywords.add(`${urgency} ${baseService}`);
    keywords.add(`${urgency} ${baseService} near me`);
    serviceVariations.slice(0, 3).forEach(service => {
      keywords.add(`${urgency} ${service}`);
    });
  });
  
  // 6. ACTION-ORIENTED KEYWORDS
  ACTION_MODIFIERS.forEach(action => {
    keywords.add(`${baseService} ${action}`);
  });
  
  // 7. RESIDENTIAL vs COMMERCIAL
  serviceVariations.slice(0, 5).forEach(service => {
    keywords.add(`residential ${service}`);
    keywords.add(`commercial ${service}`);
    keywords.add(`home ${service}`);
    keywords.add(`house ${service}`);
    keywords.add(`business ${service}`);
  });
  
  return Array.from(keywords).slice(0, 150);
}

// Pre-defined expansion configs for common industries
export const INDUSTRY_KEYWORD_CONFIGS: Record<string, KeywordExpansionConfig> = {
  electrician: {
    baseService: "electrician",
    serviceVariations: [
      "electrician", "electrical contractor", "electrical service", 
      "electrical repair", "wiring service", "electrical installation",
      "lighting installation", "outlet repair", "circuit breaker repair",
      "panel upgrade", "EV charger installation", "ceiling fan installation",
      "smoke detector installation", "electrical wiring", "power restoration",
      "fuse box repair", "generator installation", "electrical inspection",
      "rewiring service", "electrical maintenance"
    ],
    problems: [
      "no power", "power outage", "flickering lights", "tripped breaker",
      "electrical fire", "sparking outlet", "buzzing sound", "burning smell electrical",
      "dead outlet", "overloaded circuit", "electrical shock", "dimming lights",
      "faulty wiring", "short circuit", "electrical surge", "ground fault"
    ]
  },
  
  plumber: {
    baseService: "plumber",
    serviceVariations: [
      "plumber", "plumbing service", "plumbing contractor", "plumbing repair",
      "drain cleaning", "pipe repair", "leak repair", "water heater repair",
      "toilet repair", "faucet repair", "sewer line repair", "garbage disposal repair",
      "water line repair", "gas line service", "bathroom plumbing", "kitchen plumbing",
      "sump pump service", "water filtration", "tankless water heater", "septic service"
    ],
    problems: [
      "clogged drain", "leaky pipe", "burst pipe", "no hot water", "low water pressure",
      "running toilet", "backed up sewer", "water leak", "gas leak", "frozen pipe",
      "dripping faucet", "slow drain", "toilet overflow", "water damage", "sewage smell"
    ]
  },
  
  hvac: {
    baseService: "hvac",
    serviceVariations: [
      "hvac", "ac repair", "air conditioning repair", "heating repair", "furnace repair",
      "hvac service", "ac installation", "heating installation", "hvac contractor",
      "air conditioner service", "heat pump repair", "ductwork service", "ac maintenance",
      "furnace installation", "central air repair", "mini split installation",
      "hvac tune up", "air duct cleaning", "thermostat installation", "hvac replacement"
    ],
    problems: [
      "ac not cooling", "no heat", "furnace not working", "ac blowing warm air",
      "hvac noise", "ac leaking water", "thermostat not working", "uneven heating",
      "high energy bills", "poor air quality", "ac frozen", "furnace cycling",
      "weak airflow", "strange smell from hvac", "ac compressor issues"
    ]
  },
  
  roofing: {
    baseService: "roofer",
    serviceVariations: [
      "roofer", "roofing contractor", "roofing service", "roof repair",
      "roof replacement", "roof installation", "shingle repair", "roof leak repair",
      "storm damage repair", "roof inspection", "gutter installation", "roof maintenance",
      "flat roof repair", "metal roofing", "tile roofing", "slate roofing",
      "roof coating", "roof ventilation", "skylight installation", "chimney flashing"
    ],
    problems: [
      "roof leak", "missing shingles", "storm damage", "roof damage", "sagging roof",
      "water damage ceiling", "roof inspection needed", "hail damage roof",
      "ice dam", "roof moss", "cracked tiles", "worn shingles", "roof emergency"
    ]
  },
  
  locksmith: {
    baseService: "locksmith",
    serviceVariations: [
      "locksmith", "lock service", "key service", "lock repair", "lock replacement",
      "lockout service", "key cutting", "lock installation", "rekey locks",
      "automotive locksmith", "commercial locksmith", "residential locksmith",
      "safe locksmith", "lock picking", "master key system", "smart lock installation",
      "deadbolt installation", "lock change", "security locks", "emergency locksmith"
    ],
    problems: [
      "locked out", "lost keys", "broken key", "stuck lock", "key stuck in lock",
      "car lockout", "house lockout", "office lockout", "safe lockout",
      "broken lock", "lock not working", "key wont turn", "lock jammed"
    ]
  }
};

export function getExpandedKeywordsForIndustry(industry: string): string[] {
  const config = INDUSTRY_KEYWORD_CONFIGS[industry.toLowerCase()];
  if (!config) {
    return [];
  }
  return expandKeywords(config);
}

export function generateAdGroups(keywords: string[], maxKeywordsPerGroup: number = 20): Array<{ name: string; keywords: string[] }> {
  const adGroups: Array<{ name: string; keywords: string[] }> = [];
  
  // Group keywords by common themes
  const themeGroups: Record<string, string[]> = {
    "High Intent - Near Me": [],
    "Emergency & Urgent": [],
    "Cost & Pricing": [],
    "Service Types": [],
    "Problem Solutions": [],
    "Trust & Quality": [],
    "Residential": [],
    "Commercial": []
  };
  
  keywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    if (kwLower.includes("near me") || kwLower.includes("local") || kwLower.includes("nearby")) {
      themeGroups["High Intent - Near Me"].push(kw);
    } else if (kwLower.includes("emergency") || kwLower.includes("urgent") || kwLower.includes("24 hour") || kwLower.includes("same day")) {
      themeGroups["Emergency & Urgent"].push(kw);
    } else if (kwLower.includes("cost") || kwLower.includes("price") || kwLower.includes("quote") || kwLower.includes("estimate") || kwLower.includes("rate")) {
      themeGroups["Cost & Pricing"].push(kw);
    } else if (kwLower.includes("fix") || kwLower.includes("repair") || kwLower.includes("problem") || kwLower.includes("broken")) {
      themeGroups["Problem Solutions"].push(kw);
    } else if (kwLower.includes("licensed") || kwLower.includes("certified") || kwLower.includes("professional") || kwLower.includes("best") || kwLower.includes("top")) {
      themeGroups["Trust & Quality"].push(kw);
    } else if (kwLower.includes("residential") || kwLower.includes("home") || kwLower.includes("house")) {
      themeGroups["Residential"].push(kw);
    } else if (kwLower.includes("commercial") || kwLower.includes("business") || kwLower.includes("office")) {
      themeGroups["Commercial"].push(kw);
    } else {
      themeGroups["Service Types"].push(kw);
    }
  });
  
  // Convert to ad groups, splitting large groups
  Object.entries(themeGroups).forEach(([name, groupKeywords]) => {
    if (groupKeywords.length === 0) return;
    
    if (groupKeywords.length <= maxKeywordsPerGroup) {
      adGroups.push({ name, keywords: groupKeywords });
    } else {
      // Split into multiple groups
      for (let i = 0; i < groupKeywords.length; i += maxKeywordsPerGroup) {
        const chunk = groupKeywords.slice(i, i + maxKeywordsPerGroup);
        const groupNum = Math.floor(i / maxKeywordsPerGroup) + 1;
        adGroups.push({ name: `${name} ${groupNum}`, keywords: chunk });
      }
    }
  });
  
  return adGroups;
}
