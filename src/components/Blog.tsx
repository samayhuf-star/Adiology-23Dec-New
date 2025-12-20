import React, { useState } from 'react';
import { 
  ArrowLeft, Clock, User, Tag, Search, BookOpen, 
  Target, Layers, Zap, Brain, Filter, MapPin, TrendingUp,
  Building2, Calendar, Code, Lightbulb, Play, ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'structure' | 'hacks' | 'scripts';
  readTime: string;
  date: string;
  author: string;
  image?: string;
  videoUrl?: string;
  tags: string[];
}

const BLOG_ARTICLES: Article[] = [
  // 15 Articles on Google Ads Structures
  {
    id: 'skag-structure',
    title: 'SKAG (Single Keyword Ad Group) - The Ultimate Guide',
    excerpt: 'Learn how SKAG campaigns deliver maximum relevance and Quality Score by dedicating one ad group to one keyword.',
    content: `
## What is SKAG?

SKAG stands for **Single Keyword Ad Group** - a campaign structure where each ad group contains only one keyword (in all match types). This approach maximizes ad relevance and Quality Score.

### Why Use SKAG?

1. **Maximum Relevance**: Your ads can be 100% tailored to the exact keyword
2. **Higher Quality Score**: Google rewards relevance with better scores (8-10)
3. **Lower CPC**: Higher Quality Scores mean lower cost-per-click
4. **Precise Control**: Easy to identify winners and losers
5. **Better CTR**: Highly relevant ads get more clicks

### SKAG Structure Example

\`\`\`
Campaign: Plumbing Services
├── Ad Group: emergency plumber
│   ├── Keyword: emergency plumber (exact)
│   ├── Keyword: "emergency plumber" (phrase)
│   └── Keyword: emergency plumber (broad)
├── Ad Group: 24 hour plumber
│   ├── Keyword: 24 hour plumber (exact)
│   ├── Keyword: "24 hour plumber" (phrase)
│   └── Keyword: 24 hour plumber (broad)
\`\`\`

### Best Practices

- Use DKI (Dynamic Keyword Insertion) in headlines
- Create 3-5 RSA ads per ad group
- Monitor search terms regularly
- Add negative keywords to prevent overlap
- Start with your top 20-50 keywords

### When to Use SKAG

- High-value keywords with proven ROI
- Competitive industries (legal, insurance, medical)
- When Quality Score optimization is priority
- B2B lead generation campaigns
    `,
    category: 'structure',
    readTime: '8 min',
    date: '2025-12-15',
    author: 'Adiology Team',
    tags: ['SKAG', 'Quality Score', 'Ad Groups', 'Keywords']
  },
  {
    id: 'stag-structure',
    title: 'STAG (Single Theme Ad Group) - Balanced Approach to Campaign Structure',
    excerpt: 'Discover how STAG groups related keywords by theme for better management without sacrificing performance.',
    content: `
## What is STAG?

STAG stands for **Single Theme Ad Group** - a structure where each ad group contains closely related keywords that share the same search intent and theme.

### STAG vs SKAG

| Feature | SKAG | STAG |
|---------|------|------|
| Keywords per group | 1 | 5-20 |
| Management time | High | Medium |
| Scalability | Low | High |
| Relevance | Maximum | High |

### STAG Structure Example

\`\`\`
Campaign: Plumbing Services
├── Ad Group: Emergency Plumbing (Theme)
│   ├── emergency plumber
│   ├── 24 hour plumber
│   ├── urgent plumbing service
│   ├── plumber near me now
│   └── emergency pipe repair
├── Ad Group: Drain Cleaning (Theme)
│   ├── drain cleaning service
│   ├── unclog drain
│   ├── blocked drain repair
│   └── sewer cleaning
\`\`\`

### Benefits of STAG

1. **Easier Management**: Fewer ad groups to manage
2. **Faster Scaling**: Add keywords to existing themes
3. **Good Relevance**: Themed ads still perform well
4. **Better for beginners**: Less complex than SKAG

### Creating Effective Themes

- Group by user intent (informational, transactional)
- Group by service/product type
- Group by location modifiers
- Group by urgency level

### Pro Tips

- Keep 5-15 keywords per ad group
- Ensure all keywords trigger the same ad effectively
- Use keyword insertion for dynamic relevance
- Review search terms weekly to refine themes
    `,
    category: 'structure',
    readTime: '7 min',
    date: '2025-12-14',
    author: 'Adiology Team',
    tags: ['STAG', 'Theme Groups', 'Campaign Structure']
  },
  {
    id: 'alpha-beta-structure',
    title: 'Alpha-Beta Campaign Structure - Test and Scale Winners',
    excerpt: 'Master the Alpha-Beta structure that separates discovery from scaling for maximum ROI.',
    content: `
## The Alpha-Beta Strategy

The Alpha-Beta structure splits your campaigns into two types:
- **Alpha**: Proven winners with exact match keywords
- **Beta**: Discovery campaigns with broad/phrase match

### How It Works

\`\`\`
Beta Campaign (Discovery)
├── Broad/Phrase match keywords
├── Lower bids
├── Search term mining
└── Feeds winners to Alpha

Alpha Campaign (Winners)
├── Exact match only
├── Higher bids
├── Proven performers
└── Maximum ROI focus
\`\`\`

### Implementation Steps

1. **Start with Beta**: Launch broad match campaigns
2. **Mine Search Terms**: Find converting queries
3. **Graduate Winners**: Move converting terms to Alpha
4. **Negative Keywords**: Block graduated terms in Beta
5. **Scale Alpha**: Increase budget on winners

### Budget Allocation

- Beta: 30% of budget (discovery)
- Alpha: 70% of budget (scaling winners)

### Key Metrics to Track

- Search term conversion rate
- Cost per conversion by match type
- Quality Score progression
- ROAS by campaign type

### Pro Tips

- Run Beta for 2-4 weeks before graduating keywords
- Require 3+ conversions before moving to Alpha
- Use automated rules for keyword graduation
- Review weekly and adjust bids
    `,
    category: 'structure',
    readTime: '9 min',
    date: '2025-12-13',
    author: 'Adiology Team',
    tags: ['Alpha-Beta', 'Discovery', 'Scaling', 'Match Types']
  },
  {
    id: 'intent-based-structure',
    title: 'Intent-Based Campaign Structure - Align Ads with User Journey',
    excerpt: 'Structure campaigns around user intent stages for better targeting and messaging.',
    content: `
## What is Intent-Based Structure?

Organize campaigns by the user's position in the buying journey:
- **Awareness**: Users discovering solutions
- **Consideration**: Users comparing options
- **Decision**: Users ready to buy

### Campaign Structure

\`\`\`
Account
├── Campaign: Awareness
│   ├── what is CRM software
│   ├── how to manage customers
│   └── customer management tips
├── Campaign: Consideration
│   ├── best CRM software
│   ├── CRM comparison
│   └── CRM reviews
├── Campaign: Decision
│   ├── buy CRM software
│   ├── CRM pricing
│   └── CRM free trial
\`\`\`

### Intent Signals

**Awareness Keywords**:
- "what is", "how to", "guide to", "tips for"

**Consideration Keywords**:
- "best", "top", "vs", "comparison", "reviews"

**Decision Keywords**:
- "buy", "price", "cost", "discount", "free trial"

### Messaging by Intent

| Stage | Ad Focus | CTA |
|-------|----------|-----|
| Awareness | Education | Learn More |
| Consideration | Benefits | Compare Now |
| Decision | Offer/Price | Buy Now |

### Budget Strategy

- Awareness: 20% (nurturing)
- Consideration: 30% (engagement)
- Decision: 50% (conversions)
    `,
    category: 'structure',
    readTime: '8 min',
    date: '2025-12-12',
    author: 'Adiology Team',
    tags: ['Intent', 'User Journey', 'Funnel', 'Targeting']
  },
  {
    id: 'geo-segmented-structure',
    title: 'GEO-Segmented Campaigns - Location-Based Optimization',
    excerpt: 'Learn how to structure campaigns by geography for localized performance and bidding.',
    content: `
## Why GEO-Segment?

Different locations perform differently. GEO-segmentation lets you:
- Customize bids by location performance
- Tailor ad copy to local audiences
- Manage budgets by market priority
- Track ROI by geographic area

### Structure Options

**By State/Region**:
\`\`\`
├── Campaign: California
├── Campaign: Texas
├── Campaign: New York
└── Campaign: Florida
\`\`\`

**By City Tier**:
\`\`\`
├── Campaign: Tier 1 Cities (NYC, LA, Chicago)
├── Campaign: Tier 2 Cities (Austin, Denver, Seattle)
└── Campaign: Tier 3 Cities (Smaller markets)
\`\`\`

**By Performance Zone**:
\`\`\`
├── Campaign: High-Performance Markets
├── Campaign: Medium-Performance Markets
└── Campaign: Testing Markets
\`\`\`

### Local Ad Copy Examples

**Generic**: "Get Expert Plumbing Services"
**Localized**: "Houston's #1 Rated Plumbers - Same Day Service"

### Bid Adjustments

- Top markets: +20-50% bid adjustment
- Average markets: Base bid
- Low markets: -20-30% bid adjustment

### Implementation Tips

1. Start with top 5-10 markets
2. Use location extensions
3. Include city names in ads
4. Track cost per conversion by location
5. Adjust bids monthly based on performance
    `,
    category: 'structure',
    readTime: '7 min',
    date: '2025-12-11',
    author: 'Adiology Team',
    tags: ['GEO', 'Location', 'Local Ads', 'Bid Adjustments']
  },
  {
    id: 'funnel-structure',
    title: 'Funnel-Based Campaign Structure (TOF/MOF/BOF)',
    excerpt: 'Build campaigns aligned with your marketing funnel stages for optimal budget allocation.',
    content: `
## The Marketing Funnel in Google Ads

Structure your campaigns by funnel stage:
- **TOF (Top of Funnel)**: Awareness & Discovery
- **MOF (Middle of Funnel)**: Consideration & Engagement
- **BOF (Bottom of Funnel)**: Conversion & Purchase

### Campaign Structure

\`\`\`
Account
├── TOF Campaign
│   ├── Display ads
│   ├── YouTube ads
│   └── Broad keywords
├── MOF Campaign
│   ├── Remarketing
│   ├── Comparison keywords
│   └── Review keywords
├── BOF Campaign
│   ├── Brand keywords
│   ├── High-intent keywords
│   └── Shopping ads
\`\`\`

### Metrics by Stage

| Stage | Primary Metric | Secondary |
|-------|---------------|-----------|
| TOF | Impressions | Reach |
| MOF | Clicks | Engagement |
| BOF | Conversions | ROAS |

### Budget Distribution

**E-commerce**:
- TOF: 20%
- MOF: 30%
- BOF: 50%

**Lead Gen**:
- TOF: 30%
- MOF: 40%
- BOF: 30%

### Pro Tips

- Use audience signals to identify funnel stage
- Retarget TOF users in MOF campaigns
- Exclude converters from TOF/MOF
- Different landing pages per stage
    `,
    category: 'structure',
    readTime: '8 min',
    date: '2025-12-10',
    author: 'Adiology Team',
    tags: ['Funnel', 'TOF', 'MOF', 'BOF', 'Awareness']
  },
  {
    id: 'brand-nonbrand-structure',
    title: 'Brand vs Non-Brand Campaign Split Strategy',
    excerpt: 'Why separating brand and non-brand campaigns is essential for accurate performance tracking.',
    content: `
## Why Split Brand and Non-Brand?

Brand and non-brand keywords behave completely differently:

| Metric | Brand | Non-Brand |
|--------|-------|-----------|
| CTR | 15-30% | 2-5% |
| CPC | $0.50-2 | $2-20+ |
| Conv Rate | 10-30% | 2-8% |
| Intent | High | Variable |

### Campaign Structure

\`\`\`
Account
├── Brand Campaign
│   ├── [brand name]
│   ├── [brand name] login
│   ├── [brand name] pricing
│   └── [brand name] reviews
├── Non-Brand Campaign
│   ├── Generic keywords
│   ├── Competitor keywords
│   └── Category keywords
\`\`\`

### Why This Matters

1. **Accurate ROAS**: Brand inflates overall metrics
2. **Budget Control**: Allocate properly to growth
3. **True CAC**: Know real acquisition cost
4. **Competitor Defense**: Protect brand terms

### Brand Campaign Settings

- Max Impression Share bidding
- High budget (protect your brand)
- Negative competitor terms
- All match types for brand

### Non-Brand Strategy

- Focus on profitability
- Test different structures
- Higher bids for high-intent
- Regular negative keyword mining

### Reporting Tip

Always report Brand and Non-Brand separately to show true growth from paid search.
    `,
    category: 'structure',
    readTime: '6 min',
    date: '2025-12-09',
    author: 'Adiology Team',
    tags: ['Brand', 'Non-Brand', 'ROAS', 'Performance']
  },
  {
    id: 'match-type-split',
    title: 'Match Type Split Campaign Structure',
    excerpt: 'Organize campaigns by match type for granular control and bidding optimization.',
    content: `
## Match Type Segmentation

Create separate campaigns for each match type:
- Exact Match Campaign
- Phrase Match Campaign
- Broad Match Campaign

### Structure

\`\`\`
Account
├── Campaign: Services - Exact
│   └── [plumber near me]
├── Campaign: Services - Phrase
│   └── "plumber near me"
├── Campaign: Services - Broad
│   └── plumber near me
\`\`\`

### Benefits

1. **Bid Control**: Different bids per match type
2. **Budget Allocation**: More to exact, less to broad
3. **Quality Insights**: See performance by match type
4. **Negative Management**: Easier cross-negatives

### Recommended Bids

- Exact: Highest bid (best conversion rate)
- Phrase: Medium bid (moderate intent)
- Broad: Lowest bid (discovery mode)

### Budget Split

\`\`\`
Exact Match: 50% of budget
Phrase Match: 30% of budget
Broad Match: 20% of budget
\`\`\`

### Cross-Negative Strategy

Add exact match keywords as negatives in phrase campaign.
Add phrase match keywords as negatives in broad campaign.

This prevents overlap and ensures the most restrictive match type gets the traffic.

### When to Use

- High-volume accounts
- Multiple product lines
- Need granular performance data
- Budget optimization focus
    `,
    category: 'structure',
    readTime: '7 min',
    date: '2025-12-08',
    author: 'Adiology Team',
    tags: ['Match Types', 'Exact', 'Phrase', 'Broad']
  },
  {
    id: 'competitor-campaigns',
    title: 'Competitor Campaign Structure - Capture Competitor Traffic',
    excerpt: 'Learn how to ethically bid on competitor keywords and structure conquest campaigns.',
    content: `
## Competitor Targeting Strategy

Bidding on competitor brand names is legal and can be highly effective when done right.

### Campaign Structure

\`\`\`
Account
├── Competitor Campaign
│   ├── Ad Group: Competitor A
│   │   ├── [competitor a]
│   │   ├── [competitor a] reviews
│   │   └── [competitor a] alternatives
│   ├── Ad Group: Competitor B
│   │   └── [competitor b] pricing
│   └── Ad Group: Competitor C
│       └── [competitor c] vs
\`\`\`

### Ad Copy Rules

**Don't Do**:
- Use competitor names in ad copy
- Claim to be the competitor
- Use trademarked terms in headlines

**Do Instead**:
- Focus on your differentiators
- Use comparison language
- Highlight unique benefits

### Example Ads

**Bad**: "Better Than [Competitor]"
**Good**: "Looking for Alternatives? Try Our Award-Winning Solution"

### Bid Strategy

- Start with low bids (competitor terms often have low QS)
- Expect 2-4 Quality Scores
- Higher CPCs are normal
- Focus on high-converting competitor terms

### Landing Page Tips

- Comparison pages work well
- Show why you're different
- Include switching benefits
- Customer testimonials from switchers

### Legal Considerations

- You can bid on competitor terms
- You cannot use their trademark in ads
- Check local regulations
- Monitor trademark complaints
    `,
    category: 'structure',
    readTime: '8 min',
    date: '2025-12-07',
    author: 'Adiology Team',
    tags: ['Competitor', 'Conquest', 'Brand Bidding']
  },
  {
    id: 'ngram-clusters',
    title: 'N-Gram Clustering - Smart Keyword Grouping',
    excerpt: 'Use N-gram analysis to automatically group keywords by common word patterns.',
    content: `
## What are N-Grams?

N-grams are sequences of N words that appear together in your keywords:
- **Unigram (1)**: "plumber"
- **Bigram (2)**: "emergency plumber"
- **Trigram (3)**: "24 hour plumber"

### How N-Gram Clustering Works

1. Analyze all keywords for common patterns
2. Group keywords sharing the same N-grams
3. Create ad groups around these clusters

### Example

Keywords:
- emergency plumber houston
- emergency plumber near me
- emergency plumber 24 hour
- cheap plumber houston
- cheap plumber near me

**Bigram Clusters**:
\`\`\`
├── "emergency plumber" cluster
│   ├── emergency plumber houston
│   ├── emergency plumber near me
│   └── emergency plumber 24 hour
├── "plumber houston" cluster
│   ├── emergency plumber houston
│   └── cheap plumber houston
\`\`\`

### Benefits

1. **Automatic Grouping**: Let data decide structure
2. **High Relevance**: Similar keywords grouped
3. **Scalable**: Works with thousands of keywords
4. **Performance Insights**: See which patterns convert

### Tools for N-Gram Analysis

- Excel/Google Sheets formulas
- Python scripts
- Adiology's built-in analyzer
- Google Ads scripts

### Implementation

1. Export all keywords
2. Run N-gram analysis
3. Identify top 20-50 patterns
4. Create ad groups per pattern
5. Assign keywords to groups
    `,
    category: 'structure',
    readTime: '9 min',
    date: '2025-12-06',
    author: 'Adiology Team',
    tags: ['N-Gram', 'Clustering', 'Automation', 'Grouping']
  },
  {
    id: 'long-tail-master',
    title: 'Long-Tail Keyword Campaign Structure',
    excerpt: 'Capture low-competition, high-converting traffic with long-tail keyword campaigns.',
    content: `
## What are Long-Tail Keywords?

Long-tail keywords are longer, more specific phrases with:
- 3+ words
- Lower search volume
- Lower competition
- Higher conversion rates

### Examples

**Head Term**: "plumber" (High competition)
**Long-Tail**: "emergency plumber for burst pipe in downtown houston" (Low competition)

### Campaign Structure

\`\`\`
Long-Tail Campaign
├── Ad Group: Emergency Long-Tail
│   ├── emergency plumber for burst pipe
│   ├── 24 hour plumber for water heater
│   └── same day plumber for clogged drain
├── Ad Group: Location Long-Tail
│   ├── residential plumber in downtown houston
│   └── commercial plumber near galleria area
\`\`\`

### Finding Long-Tail Keywords

1. **Search Term Reports**: Mine existing campaigns
2. **Keyword Tools**: Use question modifiers
3. **Competitor Analysis**: Spy on competitor terms
4. **Customer Feedback**: How do customers describe problems?
5. **Adiology Long-Tail Generator**: Automatic expansion

### Ad Copy Strategy

- Use Dynamic Keyword Insertion
- Match specificity in ads
- Highly relevant landing pages
- Address specific pain points

### Budget Strategy

- Lower CPCs = More clicks for budget
- Start with exact match only
- Scale winners to phrase match
- Keep tight negative keyword lists

### Performance Expectations

- Lower volume per keyword
- Higher CTR (5-15%)
- Higher conversion rate (5-20%)
- Lower CPA overall
    `,
    category: 'structure',
    readTime: '8 min',
    date: '2025-12-05',
    author: 'Adiology Team',
    tags: ['Long-Tail', 'Low Competition', 'High Intent']
  },
  {
    id: 'seasonal-campaigns',
    title: 'Seasonal Sprint Campaigns - Time-Based Structures',
    excerpt: 'Structure campaigns for seasonal peaks, holidays, and time-sensitive promotions.',
    content: `
## Seasonal Campaign Strategy

Create dedicated campaigns for peak seasons and events:
- Holiday campaigns
- Seasonal promotions
- Industry-specific peaks
- Event-based campaigns

### Campaign Structure

\`\`\`
Account
├── Evergreen Campaigns (Always on)
├── Q4 Holiday Campaign
│   ├── Black Friday
│   ├── Cyber Monday
│   └── Christmas
├── Summer Campaign
│   ├── Summer sale keywords
│   └── Vacation-related terms
├── Back to School Campaign
└── Industry-Specific Peaks
\`\`\`

### Planning Timeline

| Timeframe | Action |
|-----------|--------|
| 8 weeks before | Create campaign structure |
| 6 weeks before | Write ad copy |
| 4 weeks before | Set up campaigns (paused) |
| 2 weeks before | Launch with low budget |
| Peak period | Scale budget aggressively |
| After peak | Pause and analyze |

### Budget Strategy

- Pre-peak: 20% of seasonal budget
- Peak: 60% of seasonal budget
- Post-peak: 20% (clearance)

### Ad Copy Tips

- Include seasonal keywords
- Add urgency ("Limited Time")
- Mention specific dates
- Highlight seasonal benefits

### Landing Pages

- Create seasonal landing pages
- Update hero images
- Add countdown timers
- Feature seasonal offers

### Key Holidays/Seasons

- New Year (Jan)
- Valentine's Day (Feb)
- Spring Sales (Mar-Apr)
- Mother's/Father's Day
- Summer (Jun-Aug)
- Back to School (Aug-Sep)
- Halloween (Oct)
- Black Friday/Cyber Monday (Nov)
- Christmas/Holiday (Dec)
    `,
    category: 'structure',
    readTime: '7 min',
    date: '2025-12-04',
    author: 'Adiology Team',
    tags: ['Seasonal', 'Holiday', 'Time-Based', 'Promotions']
  },
  {
    id: 'hybrid-mix-structure',
    title: 'Hybrid Mix Campaign Structure - Best of All Worlds',
    excerpt: 'Combine multiple structure types for a flexible, high-performing account.',
    content: `
## The Hybrid Approach

Don't limit yourself to one structure. Smart advertisers combine:
- SKAG for top performers
- STAG for mid-tier keywords
- Alpha-Beta for discovery

### Recommended Hybrid Structure

\`\`\`
Account
├── Brand Campaign (SKAG)
│   └── High QS, maximum control
├── Top Performers (SKAG)
│   └── Proven ROI keywords
├── Main Services (STAG)
│   └── Themed by service type
├── Discovery (Alpha-Beta)
│   ├── Beta: Broad match discovery
│   └── Alpha: Graduated winners
├── Geo-Specific (Location Split)
│   └── Top 5 markets
└── Seasonal (Time-Based)
    └── Holiday campaigns
\`\`\`

### When to Use Each

| Structure | Use Case |
|-----------|----------|
| SKAG | Top 10% of keywords by volume |
| STAG | Middle 60% of keywords |
| Alpha-Beta | New keyword discovery |
| Geo | Local businesses, multi-location |
| Brand | Always separate |

### Migration Strategy

1. Start with STAG (easiest)
2. Identify top performers
3. Move winners to SKAG
4. Set up Alpha-Beta for discovery
5. Add Geo splits for top markets

### Budget Distribution

- SKAG (winners): 40%
- STAG (stable): 35%
- Alpha-Beta (growth): 15%
- Geo/Seasonal: 10%

### Management Tips

- Use consistent naming conventions
- Set up automated rules
- Review weekly
- Adjust based on performance
    `,
    category: 'structure',
    readTime: '8 min',
    date: '2025-12-03',
    author: 'Adiology Team',
    tags: ['Hybrid', 'Mix', 'Strategy', 'Optimization']
  },
  {
    id: 'pmax-structure',
    title: 'Performance Max Campaign Structure Guide',
    excerpt: 'Understand how to structure and optimize Performance Max campaigns effectively.',
    content: `
## What is Performance Max?

Performance Max (PMax) is Google's AI-driven campaign type that:
- Runs across all Google networks
- Uses machine learning for optimization
- Requires asset groups instead of ad groups
- Automates bidding and targeting

### Asset Group Structure

\`\`\`
Performance Max Campaign
├── Asset Group: Product Category A
│   ├── Headlines (up to 15)
│   ├── Descriptions (up to 5)
│   ├── Images (up to 20)
│   ├── Videos (up to 5)
│   └── Audience Signals
├── Asset Group: Product Category B
│   └── Different assets per category
└── Asset Group: Services
    └── Service-focused assets
\`\`\`

### Asset Requirements

| Asset Type | Minimum | Maximum | Best Practice |
|------------|---------|---------|---------------|
| Headlines | 3 | 15 | 10-15 |
| Long Headlines | 1 | 5 | 5 |
| Descriptions | 2 | 5 | 5 |
| Images | 1 | 20 | 10-15 |
| Logos | 1 | 5 | 2-3 |
| Videos | 0 | 5 | 1-3 |

### Audience Signals

Help Google's AI by providing:
- Custom segments (search terms, URLs, apps)
- Your data (remarketing lists)
- Interests & demographics
- Life events

### Best Practices

1. **Separate by Goal**: Different campaigns for different objectives
2. **Asset Group Themes**: Keep assets cohesive within groups
3. **Quality Assets**: Use high-resolution images and professional copy
4. **Feed Optimization**: For Shopping, optimize your product feed
5. **Conversion Tracking**: Set up proper conversion actions

### When to Use PMax

- E-commerce with product feeds
- Lead gen with form submissions
- Multi-channel marketing
- Limited time for optimization

### Limitations

- Less control than Search campaigns
- Limited reporting granularity
- Cannot use negative keywords (audience level)
- Black box optimization
    `,
    category: 'structure',
    readTime: '10 min',
    date: '2025-12-02',
    author: 'Adiology Team',
    tags: ['Performance Max', 'PMax', 'AI', 'Automation']
  },
  {
    id: 'account-hierarchy',
    title: 'Google Ads Account Hierarchy Best Practices',
    excerpt: 'Learn the optimal account structure from MCC to campaign to ad group level.',
    content: `
## Account Hierarchy Overview

\`\`\`
MCC (Manager Account)
├── Client Account 1
│   ├── Campaign 1
│   │   ├── Ad Group 1
│   │   │   ├── Keywords
│   │   │   └── Ads
│   │   └── Ad Group 2
│   └── Campaign 2
└── Client Account 2
\`\`\`

### Naming Conventions

Use consistent, descriptive names:

**Campaign Level**:
\`[Network]_[Objective]_[Target]_[Match Type]\`
Example: "Search_LeadGen_Plumbing_Exact"

**Ad Group Level**:
\`[Theme]_[Modifier]\`
Example: "Emergency_Services"

### Campaign Settings to Consider

- **Budget**: Daily budget per campaign
- **Bidding**: Strategy per campaign goals
- **Network**: Search, Display, or both
- **Locations**: Geographic targeting
- **Schedule**: Ad schedule settings
- **Devices**: Device bid adjustments

### Recommended Campaign Types

| Business Type | Campaigns |
|--------------|-----------|
| Local Service | Brand, Services, Geo, Emergency |
| E-commerce | Brand, Shopping, Search, PMax |
| B2B | Brand, Services, Competitor, Remarketing |
| SaaS | Brand, Features, Pricing, Competitor |

### Optimization Hierarchy

1. **Account Level**: Conversion tracking, audiences
2. **Campaign Level**: Budget, bidding, targeting
3. **Ad Group Level**: Keywords, ads, extensions
4. **Keyword Level**: Bids, match types
5. **Ad Level**: Copy, assets

### Maintenance Schedule

- Daily: Budget pacing, alerts
- Weekly: Search terms, bids
- Monthly: Structure review
- Quarterly: Full audit
    `,
    category: 'structure',
    readTime: '9 min',
    date: '2025-12-01',
    author: 'Adiology Team',
    tags: ['Hierarchy', 'MCC', 'Organization', 'Best Practices']
  },

  // 5 Articles on Latest Google Ads Hacks
  {
    id: 'hack-quality-score',
    title: 'Quality Score Hacks: Get 9-10 Scores in 2025',
    excerpt: 'Advanced techniques to dramatically improve your Quality Scores and lower CPCs.',
    content: `
## Quality Score in 2025

Quality Score still matters! Here are proven hacks to boost your scores:

### Hack #1: SKAGs for New Keywords

Start new keywords in SKAG structure, then graduate to STAG once QS is established.

\`\`\`
Week 1-2: SKAG (establish QS 7+)
Week 3+: Move to themed ad group
\`\`\`

### Hack #2: Landing Page Match

Create dedicated landing pages that match:
- Headline = Keyword
- H1 = Search term
- Content = Ad copy promises

**Example**:
Keyword: "emergency plumber houston"
Landing Page H1: "24/7 Emergency Plumber in Houston"

### Hack #3: Ad Relevance Boost

Include the exact keyword in:
- Headline 1 (use DKI)
- Description 1
- Display path

### Hack #4: CTR Optimization

Improve Expected CTR:
- Use numbers ("Save 40%")
- Add urgency ("Today Only")
- Include benefits, not features
- Test multiple ad variations

### Hack #5: Historical Performance

Build keyword history:
- Start with lower bids
- Focus on clicks first
- Gradually increase once QS improves
- Never pause keywords with good QS

### Quick Wins

1. Add extensions (increases CTR)
2. Mobile-optimize landing pages
3. Improve page speed
4. Use HTTPS
5. Match ad copy to landing page

### Tools to Monitor

- Google Ads QS column
- Adiology QS Tracker
- Landing page speed tests
- A/B testing tools
    `,
    category: 'hacks',
    readTime: '8 min',
    date: '2025-12-18',
    author: 'Adiology Team',
    tags: ['Quality Score', 'Optimization', 'CPC', 'Hacks']
  },
  {
    id: 'hack-negative-keywords',
    title: '2025 Negative Keyword Strategy That Saves 40% Budget',
    excerpt: 'Advanced negative keyword techniques to eliminate wasted spend immediately.',
    content: `
## The Negative Keyword Revolution

Most advertisers waste 20-40% of budget on irrelevant clicks. Here's how to stop it.

### Hack #1: Pre-Launch Negative Lists

Build negative lists BEFORE launching:

**Universal Negatives**:
- job, jobs, career, careers, employment
- free, cheap, discount (if not relevant)
- DIY, how to, tutorial
- salary, pay, wage
- scam, review, complaint

### Hack #2: Competitor as Negative

Add competitor names as negatives in brand campaigns:
\`\`\`
-[competitor 1]
-[competitor 2]
-[competitor 3]
\`\`\`

### Hack #3: N-Gram Analysis

Weekly, analyze search terms by N-gram:

1. Export search terms
2. Count word frequency
3. Identify wasted spend patterns
4. Add as phrase match negatives

### Hack #4: Cross-Campaign Negatives

Prevent keyword cannibalization:
- Add exact match keywords from Campaign A as negatives in Campaign B
- Use shared negative lists

### Hack #5: Negative Keyword Levels

Apply at correct level:
- **Account Level**: Universal (jobs, free, DIY)
- **Campaign Level**: Theme-specific
- **Ad Group Level**: Granular control

### The 80/20 Rule

80% of waste comes from 20% of bad terms. Focus on:
1. High-spend non-converters
2. Obviously irrelevant terms
3. Low-quality traffic sources

### Automation

Set up automated rules:
- Flag search terms with 0 conversions and 10+ clicks
- Weekly negative keyword review
- Monthly full audit
    `,
    category: 'hacks',
    readTime: '7 min',
    date: '2025-12-17',
    author: 'Adiology Team',
    tags: ['Negative Keywords', 'Budget', 'Waste', 'Optimization']
  },
  {
    id: 'hack-audience-targeting',
    title: 'Secret Audience Targeting Hacks for 2025',
    excerpt: 'Leverage hidden audience features to dramatically improve campaign performance.',
    content: `
## Audience Targeting Secrets

Go beyond basic demographics with these advanced tactics.

### Hack #1: Observation Mode First

Add audiences in "Observation" mode before "Targeting":
1. Add audience to campaign (Observation)
2. Collect performance data for 2 weeks
3. Apply bid adjustments based on data
4. Move top performers to Targeting mode

### Hack #2: Combined Audiences

Layer multiple audiences:
\`\`\`
Custom Audience: "Searched for competitor"
+ In-Market: "Home Services"
+ Affinity: "Homeowners"
= Highly qualified prospect
\`\`\`

### Hack #3: Customer Match Lookalikes

Upload your customer list and create:
- Similar audiences (Google finds lookalikes)
- Exclusion lists (don't target existing customers)
- Expansion audiences

### Hack #4: Life Events Targeting

Target people during key moments:
- Recently moved
- Getting married
- Starting a business
- Having a baby
- Retirement

### Hack #5: Custom Intent Audiences

Create audiences based on:
- Competitor URLs (people who visited competitor sites)
- Related search terms (people who searched specific terms)
- YouTube videos (people who watched related content)

### Advanced Combinations

**High-Intent Stack**:
\`\`\`
In-Market Audience
+ Custom Intent (competitor URLs)
+ Remarketing (visited pricing page)
= Maximum conversion probability
\`\`\`

### Bid Adjustments

| Audience Type | Suggested Adjustment |
|--------------|---------------------|
| Remarketing | +30-50% |
| In-Market | +20-30% |
| Custom Intent | +10-20% |
| Similar Audiences | +0-10% |
    `,
    category: 'hacks',
    readTime: '9 min',
    date: '2025-12-16',
    author: 'Adiology Team',
    tags: ['Audiences', 'Targeting', 'Custom Intent', 'Remarketing']
  },
  {
    id: 'hack-bidding-strategies',
    title: 'Smart Bidding Hacks That Actually Work',
    excerpt: 'Get the most out of Google automated bidding with these proven techniques.',
    content: `
## Smart Bidding Mastery

Google's AI bidding is powerful but needs proper setup. Here's how to maximize it.

### Hack #1: Learning Period Optimization

Don't touch campaigns during learning:
- 2-week learning period minimum
- 50+ conversions for best results
- Avoid major changes that reset learning

### Hack #2: Conversion Value Rules

Set different values by:
- **Location**: +20% for high-value markets
- **Device**: +10% for desktop B2B
- **Audience**: +30% for remarketing

### Hack #3: Portfolio Bidding

Group similar campaigns:
\`\`\`
Portfolio: "Lead Gen Services"
├── Campaign: Plumbing
├── Campaign: HVAC
└── Campaign: Electrical
= Shared learning, faster optimization
\`\`\`

### Hack #4: Seasonality Adjustments

Tell Google about expected changes:
- Holiday sales (+200% conversion rate)
- Slow season (-30% conversion rate)
- Promotions (+50% conversion rate)

Set these 1-7 days before the event.

### Hack #5: Target ROAS Ratcheting

Gradually increase targets:
\`\`\`
Month 1: 200% ROAS target
Month 2: 250% ROAS target
Month 3: 300% ROAS target
\`\`\`

This pushes efficiency without shocking the algorithm.

### Strategy Selection Guide

| Goal | Best Strategy |
|------|--------------|
| Max Leads | Maximize Conversions |
| Efficient Leads | Target CPA |
| Max Revenue | Maximize Conversion Value |
| Efficient Revenue | Target ROAS |

### Warning Signs

Switch strategies if:
- CPA increased 30%+ for 2 weeks
- Conversion volume dropped significantly
- ROAS consistently below target
    `,
    category: 'hacks',
    readTime: '8 min',
    date: '2025-12-15',
    author: 'Adiology Team',
    tags: ['Smart Bidding', 'Automation', 'ROAS', 'CPA']
  },
  {
    id: 'hack-ad-copy',
    title: 'Ad Copy Hacks: 5 Formulas That Convert',
    excerpt: 'Proven ad copy formulas and psychological triggers for higher CTR and conversions.',
    content: `
## Ad Copy That Converts

Use these proven formulas for better performance.

### Formula #1: PAS (Problem-Agitate-Solve)

**Headline 1** (Problem): "Leaky Pipes Ruining Your Day?"
**Headline 2** (Agitate): "Don't Let Water Damage Cost $1000s"
**Headline 3** (Solve): "24/7 Emergency Plumber - Call Now"

### Formula #2: Numbers + Benefit

Always include specific numbers:
- "Save 47% on Insurance"
- "5-Star Rated Service"
- "10,000+ Happy Customers"
- "Same Day Service in 2 Hours"

### Formula #3: Social Proof + Urgency

**Headline 1**: "Rated #1 by 5,000+ Customers"
**Headline 2**: "Limited Slots This Week"
**Description**: "Join thousands who trust us. Book today - only 3 appointments left."

### Formula #4: Question + Answer

**Headline 1**: "Need a Reliable Plumber?"
**Headline 2**: "We're Available 24/7"
**Headline 3**: "Licensed & Insured Pros"

### Formula #5: Feature → Benefit → Outcome

Feature: "Same Day Service"
Benefit: "No More Waiting"
Outcome: "Get Back to Your Life Today"

### Power Words for Headlines

**Urgency**: Now, Today, Limited, Last Chance
**Value**: Free, Save, Discount, Exclusive
**Trust**: Certified, Guaranteed, Proven, Trusted
**Action**: Get, Discover, Learn, Claim

### RSA Optimization

For Responsive Search Ads:
- Pin your best headline to Position 1
- Use DKI in at least 3 headlines
- Include all available headline/description slots
- Test pinning vs unpinning

### A/B Testing

Always test:
- Different value propositions
- Numbers vs no numbers
- Questions vs statements
- Short vs long descriptions
    `,
    category: 'hacks',
    readTime: '7 min',
    date: '2025-12-14',
    author: 'Adiology Team',
    tags: ['Ad Copy', 'CTR', 'RSA', 'Copywriting']
  },

  // 5 Articles on Google Ads Scripts
  {
    id: 'script-budget-alerts',
    title: 'Budget Alert Script: Never Overspend Again',
    excerpt: 'Automated budget monitoring script that sends alerts when spending exceeds thresholds.',
    content: `
## Budget Alert Script

This script monitors your daily spend and sends email alerts when budgets approach limits.

### The Script

\`\`\`javascript
function main() {
  var BUDGET_THRESHOLD = 0.9; // 90% of daily budget
  var EMAIL = 'your-email@company.com';
  
  var campaigns = AdsApp.campaigns()
    .withCondition('Status = ENABLED')
    .get();
  
  var alertMessages = [];
  
  while (campaigns.hasNext()) {
    var campaign = campaigns.next();
    var stats = campaign.getStatsFor('TODAY');
    var budget = campaign.getBudget().getAmount();
    var spend = stats.getCost();
    var spendPercent = spend / budget;
    
    if (spendPercent >= BUDGET_THRESHOLD) {
      alertMessages.push(
        campaign.getName() + ': $' + spend.toFixed(2) + 
        ' spent (' + (spendPercent * 100).toFixed(0) + '% of budget)'
      );
    }
  }
  
  if (alertMessages.length > 0) {
    MailApp.sendEmail({
      to: EMAIL,
      subject: 'Google Ads Budget Alert',
      body: 'The following campaigns are approaching budget limits:\\n\\n' +
            alertMessages.join('\\n')
    });
  }
}
\`\`\`

### How to Use

1. Go to Tools > Scripts in Google Ads
2. Create new script
3. Paste the code above
4. Update EMAIL variable
5. Authorize and schedule hourly

### Customization Options

- Change threshold percentage
- Add multiple email recipients
- Include yesterday's comparison
- Add Slack/Teams integration

### Advanced Version

Add spend velocity tracking:
\`\`\`javascript
// Calculate hourly spend rate
var hoursElapsed = new Date().getHours() + 1;
var hourlyRate = spend / hoursElapsed;
var projectedSpend = hourlyRate * 24;

if (projectedSpend > budget * 1.2) {
  // Alert: Projected to overspend
}
\`\`\`
    `,
    category: 'scripts',
    readTime: '6 min',
    date: '2025-12-19',
    author: 'Adiology Team',
    tags: ['Scripts', 'Budget', 'Alerts', 'Automation']
  },
  {
    id: 'script-keyword-bidding',
    title: 'Automated Keyword Bidding Script',
    excerpt: 'Script to automatically adjust keyword bids based on performance metrics.',
    content: `
## Keyword Bid Adjustment Script

Automatically optimize bids based on conversion performance.

### The Script

\`\`\`javascript
function main() {
  var TARGET_CPA = 50; // Your target CPA
  var LOOKBACK_DAYS = 30;
  var MIN_CONVERSIONS = 5;
  var MAX_BID_CHANGE = 0.3; // 30% max change
  
  var dateRange = getDateRange(LOOKBACK_DAYS);
  
  var keywords = AdsApp.keywords()
    .withCondition('Status = ENABLED')
    .withCondition('Conversions > ' + MIN_CONVERSIONS)
    .forDateRange(dateRange.start, dateRange.end)
    .get();
  
  while (keywords.hasNext()) {
    var keyword = keywords.next();
    var stats = keyword.getStatsFor(dateRange.start, dateRange.end);
    
    var conversions = stats.getConversions();
    var cost = stats.getCost();
    var currentCpa = cost / conversions;
    var currentBid = keyword.bidding().getCpc();
    
    // Calculate bid adjustment
    var bidAdjustment = (TARGET_CPA - currentCpa) / TARGET_CPA;
    bidAdjustment = Math.max(-MAX_BID_CHANGE, 
                    Math.min(MAX_BID_CHANGE, bidAdjustment));
    
    var newBid = currentBid * (1 + bidAdjustment);
    newBid = Math.max(0.01, Math.min(50, newBid)); // Min $0.01, Max $50
    
    keyword.bidding().setCpc(newBid);
    
    Logger.log(keyword.getText() + ': $' + currentBid.toFixed(2) + 
               ' -> $' + newBid.toFixed(2) + 
               ' (CPA: $' + currentCpa.toFixed(2) + ')');
  }
}

function getDateRange(days) {
  var end = new Date();
  var start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    start: Utilities.formatDate(start, 'GMT', 'yyyyMMdd'),
    end: Utilities.formatDate(end, 'GMT', 'yyyyMMdd')
  };
}
\`\`\`

### Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| TARGET_CPA | Your goal CPA | $50 |
| LOOKBACK_DAYS | Days of data to analyze | 30 |
| MIN_CONVERSIONS | Minimum conversions to adjust | 5 |
| MAX_BID_CHANGE | Maximum % change per run | 30% |

### Schedule

Run weekly for best results:
- More frequent = more volatile
- Less frequent = slower optimization

### Safety Features

- Minimum conversion threshold
- Maximum bid change limit
- Bid floor and ceiling
- Logging for review
    `,
    category: 'scripts',
    readTime: '8 min',
    date: '2025-12-18',
    author: 'Adiology Team',
    tags: ['Scripts', 'Bidding', 'Keywords', 'CPA']
  },
  {
    id: 'script-search-terms',
    title: 'Search Term Mining Script',
    excerpt: 'Automatically find and add converting search terms as keywords.',
    content: `
## Search Term Mining Automation

This script identifies high-performing search terms and adds them as keywords.

### The Script

\`\`\`javascript
function main() {
  var MIN_CONVERSIONS = 2;
  var MAX_CPA = 75; // Don't add if CPA is too high
  var LOOKBACK_DAYS = 30;
  
  var dateRange = getDateRange(LOOKBACK_DAYS);
  
  var report = AdsApp.report(
    'SELECT Query, Clicks, Conversions, Cost, CampaignName, AdGroupName ' +
    'FROM SEARCH_QUERY_PERFORMANCE_REPORT ' +
    'WHERE Conversions >= ' + MIN_CONVERSIONS + ' ' +
    'DURING ' + dateRange.start + ',' + dateRange.end
  );
  
  var rows = report.rows();
  var added = 0;
  
  while (rows.hasNext()) {
    var row = rows.next();
    var query = row['Query'];
    var conversions = parseFloat(row['Conversions']);
    var cost = parseFloat(row['Cost']);
    var cpa = cost / conversions;
    
    if (cpa > MAX_CPA) continue;
    
    // Check if keyword already exists
    var existingKeywords = AdsApp.keywords()
      .withCondition("Text = '" + query + "'")
      .get();
    
    if (!existingKeywords.hasNext()) {
      // Find the ad group
      var adGroups = AdsApp.adGroups()
        .withCondition("Name = '" + row['AdGroupName'] + "'")
        .withCondition("CampaignName = '" + row['CampaignName'] + "'")
        .get();
      
      if (adGroups.hasNext()) {
        var adGroup = adGroups.next();
        adGroup.newKeywordBuilder()
          .withText('[' + query + ']') // Add as exact match
          .build();
        
        Logger.log('Added: ' + query + ' (Conv: ' + conversions + 
                   ', CPA: $' + cpa.toFixed(2) + ')');
        added++;
      }
    }
  }
  
  Logger.log('Total keywords added: ' + added);
}

function getDateRange(days) {
  var end = new Date();
  var start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    start: Utilities.formatDate(start, 'GMT', 'yyyyMMdd'),
    end: Utilities.formatDate(end, 'GMT', 'yyyyMMdd')
  };
}
\`\`\`

### What It Does

1. Pulls search term report
2. Filters for converting terms
3. Checks if keyword exists
4. Adds as exact match keyword
5. Logs all additions

### Best Practices

- Run weekly
- Review logs before each run
- Start with higher thresholds
- Adjust CPA limit per campaign

### Complementary Script

Pair with negative keyword script:
- This adds converting terms
- Negative script blocks wasteful terms
- Together = optimized keyword list
    `,
    category: 'scripts',
    readTime: '7 min',
    date: '2025-12-17',
    author: 'Adiology Team',
    tags: ['Scripts', 'Search Terms', 'Keywords', 'Mining']
  },
  {
    id: 'script-ad-testing',
    title: 'Ad Testing & Winner Selection Script',
    excerpt: 'Automatically identify winning ads and pause underperformers.',
    content: `
## Ad Testing Automation Script

Statistically identify winning ads and manage ad rotation automatically.

### The Script

\`\`\`javascript
function main() {
  var MIN_IMPRESSIONS = 1000;
  var MIN_CLICKS = 50;
  var CTR_DIFFERENCE = 0.2; // 20% CTR difference to declare winner
  var LOOKBACK_DAYS = 30;
  
  var dateRange = getDateRange(LOOKBACK_DAYS);
  
  var adGroups = AdsApp.adGroups()
    .withCondition('Status = ENABLED')
    .get();
  
  while (adGroups.hasNext()) {
    var adGroup = adGroups.next();
    var ads = adGroup.ads()
      .withCondition('Status = ENABLED')
      .get();
    
    var adData = [];
    
    while (ads.hasNext()) {
      var ad = ads.next();
      var stats = ad.getStatsFor(dateRange.start, dateRange.end);
      
      if (stats.getImpressions() >= MIN_IMPRESSIONS && 
          stats.getClicks() >= MIN_CLICKS) {
        adData.push({
          ad: ad,
          ctr: stats.getCtr(),
          convRate: stats.getConversions() / stats.getClicks(),
          impressions: stats.getImpressions(),
          clicks: stats.getClicks()
        });
      }
    }
    
    if (adData.length < 2) continue;
    
    // Sort by CTR
    adData.sort(function(a, b) { return b.ctr - a.ctr; });
    
    var best = adData[0];
    var worst = adData[adData.length - 1];
    
    // Check if statistically significant
    var ctrDiff = (best.ctr - worst.ctr) / worst.ctr;
    
    if (ctrDiff >= CTR_DIFFERENCE) {
      // Pause worst performer
      worst.ad.pause();
      
      Logger.log(adGroup.getName() + ': Paused ad with ' + 
                 (worst.ctr * 100).toFixed(2) + '% CTR. ' +
                 'Winner has ' + (best.ctr * 100).toFixed(2) + '% CTR');
    }
  }
}

function getDateRange(days) {
  var end = new Date();
  var start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    start: Utilities.formatDate(start, 'GMT', 'yyyyMMdd'),
    end: Utilities.formatDate(end, 'GMT', 'yyyyMMdd')
  };
}
\`\`\`

### Configuration

- **MIN_IMPRESSIONS**: Minimum data for statistical validity
- **MIN_CLICKS**: Ensure enough clicks to compare
- **CTR_DIFFERENCE**: How much better must winner be
- **LOOKBACK_DAYS**: Analysis period

### Reporting Enhancement

Add email summary:
\`\`\`javascript
// After processing, send summary
MailApp.sendEmail({
  to: 'your@email.com',
  subject: 'Ad Testing Results',
  body: 'Paused ' + pausedCount + ' underperforming ads.'
});
\`\`\`

### Schedule

Run weekly or bi-weekly to allow ads time to gather data.
    `,
    category: 'scripts',
    readTime: '8 min',
    date: '2025-12-16',
    author: 'Adiology Team',
    tags: ['Scripts', 'A/B Testing', 'Ads', 'CTR']
  },
  {
    id: 'script-quality-score',
    title: 'Quality Score Tracking & Alert Script',
    excerpt: 'Monitor Quality Score changes and get alerts when scores drop.',
    content: `
## Quality Score Monitoring Script

Track QS changes over time and get alerts when scores decrease.

### The Script

\`\`\`javascript
function main() {
  var SPREADSHEET_URL = 'YOUR_GOOGLE_SHEETS_URL';
  var EMAIL = 'your-email@company.com';
  var QS_DROP_THRESHOLD = 2; // Alert if QS drops by 2+ points
  
  var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  var sheet = ss.getSheetByName('QS_History') || ss.insertSheet('QS_History');
  
  var today = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd');
  var alerts = [];
  
  var keywords = AdsApp.keywords()
    .withCondition('Status = ENABLED')
    .withCondition('Impressions > 100')
    .forDateRange('LAST_30_DAYS')
    .get();
  
  var data = [];
  
  while (keywords.hasNext()) {
    var keyword = keywords.next();
    var qs = keyword.getQualityScore();
    var text = keyword.getText();
    var campaign = keyword.getCampaign().getName();
    var adGroup = keyword.getAdGroup().getName();
    
    data.push([
      today,
      campaign,
      adGroup,
      text,
      qs,
      keyword.getQualityScore() ? 'Yes' : 'No'
    ]);
    
    // Check for QS drop (compare with historical data)
    var lastRow = findLastQSEntry(sheet, campaign, adGroup, text);
    if (lastRow) {
      var previousQS = lastRow[4];
      if (previousQS - qs >= QS_DROP_THRESHOLD) {
        alerts.push({
          keyword: text,
          campaign: campaign,
          previousQS: previousQS,
          currentQS: qs
        });
      }
    }
  }
  
  // Write today's data
  if (data.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, data.length, 6)
      .setValues(data);
  }
  
  // Send alerts
  if (alerts.length > 0) {
    var alertBody = 'Quality Score Drops Detected:\\n\\n';
    alerts.forEach(function(alert) {
      alertBody += alert.keyword + ' (' + alert.campaign + '): ' +
                   alert.previousQS + ' -> ' + alert.currentQS + '\\n';
    });
    
    MailApp.sendEmail({
      to: EMAIL,
      subject: 'Google Ads Quality Score Alert',
      body: alertBody
    });
  }
}

function findLastQSEntry(sheet, campaign, adGroup, keyword) {
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 0; i--) {
    if (data[i][1] === campaign && 
        data[i][2] === adGroup && 
        data[i][3] === keyword) {
      return data[i];
    }
  }
  return null;
}
\`\`\`

### Setup Steps

1. Create Google Sheet
2. Copy spreadsheet URL
3. Create script in Google Ads
4. Paste code and update variables
5. Authorize and schedule daily

### What You Get

- Historical QS tracking
- Trend analysis over time
- Automatic alerts on drops
- Exportable data for reporting

### Dashboard Ideas

Use Google Sheets to create:
- QS distribution charts
- Trend lines over time
- Campaign comparison
- Alert history

### Optimization Actions

When QS drops:
1. Check landing page speed
2. Review ad relevance
3. Analyze CTR changes
4. Update ad copy
5. Improve keyword-ad match
    `,
    category: 'scripts',
    readTime: '9 min',
    date: '2025-12-15',
    author: 'Adiology Team',
    tags: ['Scripts', 'Quality Score', 'Monitoring', 'Alerts']
  }
];

const CATEGORY_INFO = {
  structure: { label: 'Campaign Structures', color: 'bg-indigo-100 text-indigo-700', icon: Layers },
  hacks: { label: 'Google Ads Hacks', color: 'bg-green-100 text-green-700', icon: Lightbulb },
  scripts: { label: 'Google Ads Scripts', color: 'bg-purple-100 text-purple-700', icon: Code }
};

export const Blog: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredArticles = BLOG_ARTICLES.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const structureArticles = filteredArticles.filter(a => a.category === 'structure');
  const hackArticles = filteredArticles.filter(a => a.category === 'hacks');
  const scriptArticles = filteredArticles.filter(a => a.category === 'scripts');

  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedArticle(null)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Button>

        <article className="prose prose-slate max-w-none">
          <div className="mb-6">
            <Badge className={CATEGORY_INFO[selectedArticle.category].color}>
              {CATEGORY_INFO[selectedArticle.category].label}
            </Badge>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            {selectedArticle.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-slate-500 mb-8">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {selectedArticle.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(selectedArticle.date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {selectedArticle.readTime} read
            </span>
          </div>

          {selectedArticle.videoUrl && (
            <div className="mb-8 rounded-lg overflow-hidden bg-slate-100 aspect-video flex items-center justify-center">
              <div className="text-center">
                <Play className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500">Video Tutorial</p>
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-6 mb-8">
            <p className="text-lg text-slate-700 italic">{selectedArticle.excerpt}</p>
          </div>

          <div className="prose prose-slate prose-headings:text-slate-900 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100">
            {selectedArticle.content.split('\n').map((line, idx) => {
              if (line.startsWith('## ')) {
                return <h2 key={idx} className="text-2xl font-bold mt-8 mb-4">{line.replace('## ', '')}</h2>;
              }
              if (line.startsWith('### ')) {
                return <h3 key={idx} className="text-xl font-semibold mt-6 mb-3">{line.replace('### ', '')}</h3>;
              }
              if (line.startsWith('```')) {
                return null;
              }
              if (line.startsWith('|')) {
                return <p key={idx} className="font-mono text-sm bg-slate-100 p-1 rounded">{line}</p>;
              }
              if (line.startsWith('- ')) {
                return <li key={idx} className="ml-4">{line.replace('- ', '')}</li>;
              }
              if (line.match(/^\d+\./)) {
                return <li key={idx} className="ml-4">{line.replace(/^\d+\.\s*/, '')}</li>;
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={idx} className="font-bold">{line.replace(/\*\*/g, '')}</p>;
              }
              if (line.trim()) {
                return <p key={idx} className="mb-2">{line}</p>;
              }
              return null;
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {selectedArticle.tags.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Adiology Blog</h1>
        <p className="text-slate-600">Learn Google Ads strategies, campaign structures, and automation scripts</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            size="sm"
          >
            All ({BLOG_ARTICLES.length})
          </Button>
          <Button 
            variant={selectedCategory === 'structure' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('structure')}
            size="sm"
          >
            <Layers className="w-4 h-4 mr-1" />
            Structures (15)
          </Button>
          <Button 
            variant={selectedCategory === 'hacks' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('hacks')}
            size="sm"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            Hacks (5)
          </Button>
          <Button 
            variant={selectedCategory === 'scripts' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('scripts')}
            size="sm"
          >
            <Code className="w-4 h-4 mr-1" />
            Scripts (5)
          </Button>
        </div>
      </div>

      {selectedCategory === 'all' ? (
        <>
          {structureArticles.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-slate-900">Campaign Structures</h2>
                <Badge variant="outline">{structureArticles.length} articles</Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {structureArticles.map(article => (
                  <ArticleCard 
                    key={article.id} 
                    article={article} 
                    onClick={() => setSelectedArticle(article)} 
                  />
                ))}
              </div>
            </section>
          )}

          {hackArticles.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-slate-900">Latest Google Ads Hacks</h2>
                <Badge variant="outline">{hackArticles.length} articles</Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hackArticles.map(article => (
                  <ArticleCard 
                    key={article.id} 
                    article={article} 
                    onClick={() => setSelectedArticle(article)} 
                  />
                ))}
              </div>
            </section>
          )}

          {scriptArticles.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Code className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-slate-900">Google Ads Scripts</h2>
                <Badge variant="outline">{scriptArticles.length} articles</Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scriptArticles.map(article => (
                  <ArticleCard 
                    key={article.id} 
                    article={article} 
                    onClick={() => setSelectedArticle(article)} 
                  />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map(article => (
            <ArticleCard 
              key={article.id} 
              article={article} 
              onClick={() => setSelectedArticle(article)} 
            />
          ))}
        </div>
      )}

      {filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">No articles found</h3>
          <p className="text-slate-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

const ArticleCard: React.FC<{ article: Article; onClick: () => void }> = ({ article, onClick }) => {
  const categoryInfo = CATEGORY_INFO[article.category];
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <Badge className={`${categoryInfo.color} mb-3`}>
          {categoryInfo.label}
        </Badge>
        
        <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {article.title}
        </h3>
        
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
          {article.excerpt}
        </p>
        
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {article.readTime}
          </span>
          <span>{new Date(article.date).toLocaleDateString()}</span>
        </div>
        
        <div className="mt-3 flex items-center text-sm text-indigo-600 font-medium group-hover:gap-2 transition-all">
          Read Article
          <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </CardContent>
    </Card>
  );
};

export default Blog;
