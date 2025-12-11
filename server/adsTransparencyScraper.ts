import { chromium, Browser, Page } from 'playwright';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface AdResult {
  keyword: string;
  advertiser: string;
  headline: string;
  description: string;
  destination_url: string;
  ad_format: string;
  platform: string;
  first_shown: string | null;
  last_shown: string | null;
  region: string;
  raw_data: any;
}

export async function scrapeGoogleAdsTransparency(keywords: string[]): Promise<AdResult[]> {
  const results: AdResult[] = [];
  let browser: Browser | null = null;

  try {
    console.log('[Scraper] Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    for (const keyword of keywords) {
      if (!keyword.trim()) continue;

      console.log(`[Scraper] Searching for keyword: ${keyword}`);
      
      try {
        const encodedKeyword = encodeURIComponent(keyword.trim());
        const url = `https://adstransparency.google.com/?region=US&text=${encodedKeyword}`;
        
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        
        await page.waitForTimeout(3000);

        const adsData = await page.evaluate(() => {
          const ads: any[] = [];
          
          const adElements = document.querySelectorAll('[data-creative-id], .creative-card, [role="listitem"]');
          
          adElements.forEach((el) => {
            try {
              const advertiserEl = el.querySelector('[class*="advertiser"], .advertiser-name, a[href*="/advertiser/"]');
              const headlineEl = el.querySelector('[class*="headline"], .ad-headline, h3, h4');
              const descriptionEl = el.querySelector('[class*="description"], .ad-description, p');
              const linkEl = el.querySelector('a[href*="http"]');
              const platformEl = el.querySelector('[class*="platform"], .platform-icon');
              const dateEl = el.querySelector('[class*="date"], .date-range, time');

              const advertiser = advertiserEl?.textContent?.trim() || 'Unknown Advertiser';
              const headline = headlineEl?.textContent?.trim() || '';
              const description = descriptionEl?.textContent?.trim() || '';
              const url = linkEl?.getAttribute('href') || '';
              const platform = platformEl?.textContent?.trim() || 'Search';
              const dateRange = dateEl?.textContent?.trim() || '';

              if (headline || description || advertiser !== 'Unknown Advertiser') {
                ads.push({
                  advertiser,
                  headline,
                  description,
                  url,
                  platform,
                  dateRange,
                  format: 'text'
                });
              }
            } catch (err) {
              console.error('Error parsing ad element:', err);
            }
          });

          const scriptData = document.querySelector('script[type="application/json"]')?.textContent;
          if (scriptData) {
            try {
              const jsonData = JSON.parse(scriptData);
              if (jsonData.creatives || jsonData.ads) {
                const creatives = jsonData.creatives || jsonData.ads || [];
                creatives.forEach((creative: any) => {
                  ads.push({
                    advertiser: creative.advertiser?.name || creative.advertiserName || 'Unknown',
                    headline: creative.headline || creative.title || '',
                    description: creative.description || creative.bodyText || '',
                    url: creative.destinationUrl || creative.finalUrl || '',
                    platform: creative.platform || 'Search',
                    dateRange: `${creative.firstShown || ''} - ${creative.lastShown || ''}`,
                    format: creative.format || 'text',
                    raw: creative
                  });
                });
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }

          return ads;
        });

        console.log(`[Scraper] Found ${adsData.length} ads for "${keyword}"`);

        adsData.forEach((ad) => {
          results.push({
            keyword: keyword.trim(),
            advertiser: ad.advertiser || 'Unknown',
            headline: ad.headline || '',
            description: ad.description || '',
            destination_url: ad.url || '',
            ad_format: ad.format || 'text',
            platform: ad.platform || 'Search',
            first_shown: null,
            last_shown: null,
            region: 'US',
            raw_data: ad.raw || ad
          });
        });

        await page.waitForTimeout(2000);

      } catch (err) {
        console.error(`[Scraper] Error scraping keyword "${keyword}":`, err);
      }
    }

    await context.close();

  } catch (err) {
    console.error('[Scraper] Browser error:', err);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return results;
}

export async function processAdSearchRequest(requestId: number): Promise<void> {
  console.log(`[Scraper] Processing request ${requestId}...`);

  try {
    await pool.query(
      'UPDATE ad_search_requests SET status = $1, updated_at = NOW() WHERE id = $2',
      ['processing', requestId]
    );

    const requestResult = await pool.query(
      'SELECT * FROM ad_search_requests WHERE id = $1',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      console.error(`[Scraper] Request ${requestId} not found`);
      return;
    }

    const request = requestResult.rows[0];
    const keywords = request.keywords;

    console.log(`[Scraper] Scraping keywords: ${keywords.join(', ')}`);

    const results = await scrapeGoogleAdsTransparency(keywords);

    console.log(`[Scraper] Got ${results.length} results, saving to database...`);

    if (results.length === 0) {
      console.warn(`[Scraper] No ads found for request ${requestId}. Google Ads Transparency may be blocking automated access.`);
      await pool.query(
        'UPDATE ad_search_requests SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
        ['failed', 'No ads found. The Google Ads Transparency Center may be blocking automated access or no ads exist for these keywords.', requestId]
      );
      return;
    }

    await pool.query(
      'DELETE FROM ad_search_results WHERE request_id = $1',
      [requestId]
    );

    for (const result of results) {
      await pool.query(
        `INSERT INTO ad_search_results 
         (request_id, keyword, advertiser, headline, description, destination_url, ad_format, platform, first_shown, last_shown, region, raw_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          requestId,
          result.keyword,
          result.advertiser,
          result.headline,
          result.description,
          result.destination_url,
          result.ad_format,
          result.platform,
          result.first_shown,
          result.last_shown,
          result.region,
          JSON.stringify(result.raw_data)
        ]
      );
    }

    await pool.query(
      'UPDATE ad_search_requests SET status = $1, processed_at = NOW(), updated_at = NOW() WHERE id = $2',
      ['completed', requestId]
    );

    console.log(`[Scraper] Request ${requestId} completed successfully with ${results.length} ads`);

  } catch (err: any) {
    console.error(`[Scraper] Error processing request ${requestId}:`, err);

    await pool.query(
      'UPDATE ad_search_requests SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
      ['failed', err.message || 'Unknown error', requestId]
    );
  }
}

export async function processPendingRequests(): Promise<void> {
  console.log('[Scraper] Checking for pending requests...');

  try {
    const pendingResult = await pool.query(
      `SELECT id FROM ad_search_requests 
       WHERE status = 'pending' 
       ORDER BY created_at ASC 
       LIMIT 10`
    );

    if (pendingResult.rows.length === 0) {
      console.log('[Scraper] No pending requests found');
      return;
    }

    console.log(`[Scraper] Found ${pendingResult.rows.length} pending requests`);

    for (const row of pendingResult.rows) {
      await processAdSearchRequest(row.id);
    }

  } catch (err) {
    console.error('[Scraper] Error processing pending requests:', err);
  }
}

export async function runCronJob(): Promise<void> {
  console.log('[Cron] Starting hourly ad scraper job...');
  
  await processPendingRequests();
  
  console.log('[Cron] Job completed');
}
