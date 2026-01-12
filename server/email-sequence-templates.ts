export interface SequenceEmail {
  id: string;
  sequence: 'lead_nurturing' | 'onboarding' | 'conversion' | 'churn_prevention' | 'advocacy';
  name: string;
  subject: string;
  triggerType: 'time_delay' | 'event' | 'condition';
  triggerValue: string;
  dayOffset: number;
  description: string;
  html: string;
}

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f7; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
  .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px; }
  .content { padding: 40px 30px; color: #374151; line-height: 1.7; }
  .content h2 { color: #1f2937; margin-top: 0; }
  .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
  .btn-secondary { background: #f3f4f6; color: #374151 !important; }
  .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
  .stat-box { background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 15px 0; text-align: center; }
  .stat-number { font-size: 32px; font-weight: 700; color: #667eea; }
  .stat-label { color: #6b7280; font-size: 14px; }
  .highlight { background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%); border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  .check-list { list-style: none; padding: 0; }
  .check-list li { padding: 8px 0; padding-left: 30px; position: relative; }
  .check-list li:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; }
  .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  .urgency-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  .testimonial { background: #f9fafb; border-radius: 12px; padding: 25px; margin: 20px 0; font-style: italic; }
  .testimonial-author { font-style: normal; font-weight: 600; color: #667eea; margin-top: 15px; }
  .timeline { border-left: 3px solid #667eea; padding-left: 20px; margin: 20px 0; }
  .timeline-item { margin-bottom: 20px; position: relative; }
  .timeline-item:before { content: ""; position: absolute; left: -26px; top: 5px; width: 12px; height: 12px; background: #667eea; border-radius: 50%; }
  .badge { display: inline-block; background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
`;

const footer = `
  <div class="footer">
    <p><strong>Adiology</strong> - Google Ads Campaign Builder</p>
    <p>Build high-converting campaigns in minutes, not hours.</p>
    <p style="margin-top: 20px; font-size: 12px;">
      <a href="{{unsubscribe_url}}" style="color: #667eea;">Unsubscribe</a> · 
      <a href="{{help_url}}" style="color: #667eea;">Help Center</a> · 
      <a href="https://adiology.io/privacy" style="color: #667eea;">Privacy Policy</a>
    </p>
    <p style="font-size: 12px; color: #9ca3af;">© {{year}} Adiology. All rights reserved.</p>
  </div>
`;

export const sequenceEmails: SequenceEmail[] = [
  // ============ LEAD NURTURING (5 emails) ============
  {
    id: 'ln_01_lead_magnet',
    sequence: 'lead_nurturing',
    name: 'Lead Magnet Delivery',
    subject: 'Your Free Google Ads Checklist is Here!',
    triggerType: 'event',
    triggerValue: 'lead_magnet_download',
    dayOffset: 0,
    description: 'Deliver free resource immediately after signup',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>Your Free Resource is Ready!</h1><p>The Ultimate Google Ads Campaign Checklist</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Thanks for downloading <strong>The Ultimate Google Ads Campaign Checklist</strong>! You're taking the first step toward building campaigns that actually convert.</p>
          <div class="highlight">
            <strong>📥 Download Your Checklist</strong><br>
            <a href="{{resource_url}}" class="btn" style="margin-top: 15px;">Download Now (PDF)</a>
          </div>
          <h3>What's Inside:</h3>
          <ul class="check-list">
            <li>Pre-launch campaign audit framework</li>
            <li>Keyword research best practices</li>
            <li>Ad copy optimization tips</li>
            <li>Budget allocation strategies</li>
            <li>Performance tracking metrics</li>
          </ul>
          <p>Over the next few days, I'll send you actionable tips to help you get even better results with your Google Ads campaigns.</p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'ln_02_educational',
    sequence: 'lead_nurturing',
    name: 'Educational Value #1',
    subject: '3 Mistakes Killing Your Google Ads ROI',
    triggerType: 'time_delay',
    triggerValue: '2_days',
    dayOffset: 2,
    description: 'Educational content about common PPC mistakes',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>Are You Making These Mistakes?</h1><p>3 Common Errors Destroying Your Ad Budget</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>After analyzing thousands of Google Ads campaigns, we've identified <strong>3 critical mistakes</strong> that waste 40-60% of most ad budgets:</p>
          <div class="highlight">
            <h3 style="margin-top: 0; color: #ef4444;">Mistake #1: Broad Match Keyword Chaos</h3>
            <p>Using broad match keywords without negative keyword lists is like throwing money into a bonfire. Your ads show for irrelevant searches, burning through your budget.</p>
          </div>
          <div class="highlight">
            <h3 style="margin-top: 0; color: #f59e0b;">Mistake #2: One Ad Group = One Keyword Myth</h3>
            <p>SKAG (Single Keyword Ad Groups) isn't always the answer. Intent-based grouping often outperforms traditional structures by 30%+.</p>
          </div>
          <div class="highlight">
            <h3 style="margin-top: 0; color: #667eea;">Mistake #3: Set-and-Forget Mentality</h3>
            <p>Campaigns need weekly optimization. Without it, performance degrades 15-20% monthly as market conditions shift.</p>
          </div>
          <p><strong>The Solution?</strong> A systematic approach to campaign building that eliminates these errors from day one.</p>
          <p style="text-align: center;"><a href="{{dashboard_url}}" class="btn">See How Adiology Helps →</a></p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'ln_03_case_study',
    sequence: 'lead_nurturing',
    name: 'Case Study',
    subject: 'How Sarah Increased Conversions 340% (Case Study)',
    triggerType: 'time_delay',
    triggerValue: '4_days',
    dayOffset: 4,
    description: 'Success story with real numbers',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>Case Study: 340% More Conversions</h1><p>From Struggling Agency to Top Performer</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Let me tell you about <strong>Sarah from Digital Spark Agency</strong>...</p>
          <div class="testimonial">
            "We were spending 20+ hours per week building campaigns manually. Quality was inconsistent, and clients were getting frustrated with poor results."
            <div class="testimonial-author">— Sarah Chen, Founder, Digital Spark Agency</div>
          </div>
          <h3>The Challenge:</h3>
          <ul><li>Managing 50+ client campaigns</li><li>Inconsistent keyword research quality</li><li>Ad copy that didn't convert</li><li>No standardized campaign structures</li></ul>
          <h3>The Transformation:</h3>
          <div style="display: flex; gap: 20px; margin: 20px 0;">
            <div class="stat-box" style="flex: 1;"><div class="stat-number">340%</div><div class="stat-label">Conversion Increase</div></div>
            <div class="stat-box" style="flex: 1;"><div class="stat-number">85%</div><div class="stat-label">Time Saved</div></div>
            <div class="stat-box" style="flex: 1;"><div class="stat-number">$47K</div><div class="stat-label">Monthly Revenue Added</div></div>
          </div>
          <div class="highlight"><strong>Sarah's Secret?</strong> She switched to Adiology's AI-powered campaign builder.</div>
          <p style="text-align: center;"><a href="{{dashboard_url}}" class="btn">Start Your Free Trial →</a></p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'ln_04_pain_point',
    sequence: 'lead_nurturing',
    name: 'Pain Point Agitation',
    subject: 'Why 73% of Google Ads Campaigns Fail',
    triggerType: 'time_delay',
    triggerValue: '7_days',
    dayOffset: 7,
    description: 'Pain point agitation with statistics',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);"><h1>The Uncomfortable Truth</h1><p>Why Most Campaigns Never Turn a Profit</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Here's a statistic that should terrify every marketer:</p>
          <div class="stat-box"><div class="stat-number" style="color: #ef4444;">73%</div><div class="stat-label">of Google Ads campaigns fail to generate positive ROI</div></div>
          <p>Why? It comes down to three fundamental problems:</p>
          <div class="urgency-box"><h3 style="margin-top: 0;">🔥 Keyword Mismatch</h3><p>Targeting the wrong keywords means showing ads to people who will never buy.</p></div>
          <div class="urgency-box"><h3 style="margin-top: 0;">🔥 Weak Ad Copy</h3><p>Generic ads get ignored. Without compelling headlines, your CTR plummets.</p></div>
          <div class="urgency-box"><h3 style="margin-top: 0;">🔥 Poor Campaign Structure</h3><p>Messy ad groups confuse Google's algorithm and tank your Quality Score.</p></div>
          <div class="highlight"><strong>There's a better way.</strong> Adiology's campaign builder uses proven structures and AI-optimized copy.</div>
          <p style="text-align: center;"><a href="{{dashboard_url}}" class="btn">Join the Winning 27% →</a></p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'ln_05_soft_cta',
    sequence: 'lead_nurturing',
    name: 'Soft CTA - Free Trial Invite',
    subject: 'Ready to Build Your First Campaign?',
    triggerType: 'time_delay',
    triggerValue: '10_days',
    dayOffset: 10,
    description: 'Soft call to action to start free trial',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>You've Learned the Theory</h1><p>Now Let's Put It Into Practice</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Over the past week, you've learned:</p>
          <ul class="check-list"><li>The 3 mistakes killing most campaigns</li><li>How Sarah increased conversions 340%</li><li>Why 73% of campaigns fail (and how to be different)</li></ul>
          <p>Now it's time to <strong>take action</strong>.</p>
          <div class="highlight">
            <h3 style="margin-top: 0;">Start Your 14-Day Free Trial</h3>
            <p>No credit card required. Build unlimited campaigns. See results in minutes.</p>
            <a href="{{dashboard_url}}" class="btn">Start Free Trial →</a>
          </div>
          <div style="display: flex; gap: 15px; flex-wrap: wrap;">
            <div class="stat-box" style="flex: 1; min-width: 150px;"><div class="stat-number" style="font-size: 24px;">14</div><div class="stat-label">Days Free Access</div></div>
            <div class="stat-box" style="flex: 1; min-width: 150px;"><div class="stat-number" style="font-size: 24px;">∞</div><div class="stat-label">Unlimited Campaigns</div></div>
            <div class="stat-box" style="flex: 1; min-width: 150px;"><div class="stat-number" style="font-size: 24px;">AI</div><div class="stat-label">Powered Keywords</div></div>
          </div>
          <p>Questions? Just reply to this email. We're here to help!</p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },

  // ============ ONBOARDING (8 emails) ============
  {
    id: 'ob_01_welcome',
    sequence: 'onboarding',
    name: 'Welcome + Quick Win',
    subject: 'Welcome to Adiology! Your First Campaign in 5 Minutes',
    triggerType: 'event',
    triggerValue: 'user_signup',
    dayOffset: 0,
    description: 'Welcome email with quick win guide',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>Welcome to Adiology!</h1><p>Let's build your first campaign together</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Welcome aboard! 🎉 You've just joined thousands of marketers who are building better Google Ads campaigns in a fraction of the time.</p>
          <div class="highlight">
            <h3 style="margin-top: 0;">🚀 Your Quick Win Challenge</h3>
            <p>Build your first complete campaign in under 5 minutes. Here's how:</p>
          </div>
          <div class="timeline">
            <div class="timeline-item"><strong>Step 1: Enter Your Website URL</strong><br>Our AI analyzes your site and suggests keywords automatically</div>
            <div class="timeline-item"><strong>Step 2: Choose Your Structure</strong><br>Pick from SKAG, STAG, or Intent-Based</div>
            <div class="timeline-item"><strong>Step 3: Generate & Export</strong><br>Click generate and download your Google Ads Editor file</div>
          </div>
          <p style="text-align: center;"><a href="{{dashboard_url}}" class="btn">Build Your First Campaign →</a></p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'ob_02_feature_spotlight',
    sequence: 'onboarding',
    name: 'Feature Spotlight - AI Keywords',
    subject: 'Unlock 500+ Keywords in 30 Seconds',
    triggerType: 'time_delay',
    triggerValue: '1_day',
    dayOffset: 1,
    description: 'Feature tutorial for AI keyword generation',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>Feature Spotlight</h1><p>AI-Powered Keyword Generation</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Did you know Adiology can generate <strong>500+ targeted keywords</strong> in under 30 seconds?</p>
          <div class="stat-box"><div class="stat-number">500+</div><div class="stat-label">Keywords generated per campaign</div></div>
          <h3>How It Works:</h3>
          <div class="highlight">
            <ol style="margin: 0; padding-left: 20px;">
              <li><strong>Enter seed keywords</strong> - Start with 3-5 core terms</li>
              <li><strong>AI expansion</strong> - We find variations, long-tail, and related terms</li>
              <li><strong>Intent classification</strong> - Keywords auto-sorted by buyer intent</li>
              <li><strong>Negative suggestions</strong> - Block wasted spend before it happens</li>
            </ol>
          </div>
          <h3>Pro Tips:</h3>
          <ul class="check-list"><li>Use specific seed keywords for better results</li><li>Include location modifiers for local businesses</li><li>Review and customize the negative keyword list</li></ul>
          <p style="text-align: center;"><a href="{{dashboard_url}}" class="btn">Try AI Keywords Now →</a></p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'ob_03_progress_check',
    sequence: 'onboarding',
    name: 'Progress Check',
    subject: "You're Making Great Progress!",
    triggerType: 'time_delay',
    triggerValue: '3_days',
    dayOffset: 3,
    description: 'Progress report with stats',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>Your Progress Report</h1><p>Day 3 of Your Trial</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>You've been busy! Here's what you've accomplished so far:</p>
          <div style="display: flex; gap: 15px; margin: 25px 0;">
            <div class="stat-box" style="flex: 1;"><div class="stat-number">{{campaigns_count}}</div><div class="stat-label">Campaigns Created</div></div>
            <div class="stat-box" style="flex: 1;"><div class="stat-number">{{keywords_count}}</div><div class="stat-label">Keywords Generated</div></div>
            <div class="stat-box" style="flex: 1;"><div class="stat-number">{{ads_count}}</div><div class="stat-label">Ads Written</div></div>
          </div>
          <div class="highlight"><strong>🏆 Achievement Unlocked!</strong><br>You're in the top 20% of new users. Most people take a week to reach this point!</div>
          <h3>What to Try Next:</h3>
          <ul class="check-list"><li>Explore competitor ad research</li><li>Try different campaign structures</li><li>Export and upload to Google Ads</li></ul>
          <p style="text-align: center;"><a href="{{dashboard_url}}" class="btn">Continue Building →</a></p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'ob_04_power_user',
    sequence: 'onboarding',
    name: 'Power User Tip',
    subject: 'Advanced Feature: Competitor Ad Research',
    triggerType: 'time_delay',
    triggerValue: '5_days',
    dayOffset: 5,
    description: 'Advanced feature tutorial',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>Power User Tip</h1><p>Spy on Your Competitors' Best Ads</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Ready to level up? Let me show you one of our most powerful features...</p>
          <div class="highlight">
            <h3 style="margin-top: 0;">🔍 Competitor Ad Research</h3>
            <p>See exactly what ads your competitors are running on Google. Learn from their best performers and avoid their mistakes.</p>
          </div>
          <h3>What You Can Discover:</h3>
          <ul class="check-list"><li>Active ad headlines and descriptions</li><li>Which keywords they're targeting</li><li>Ad frequency and variations</li><li>Messaging strategies that work</li></ul>
          <div class="testimonial">"The competitor research feature saved me hours of manual research. I found 3 keyword opportunities my competitors missed!"<div class="testimonial-author">— Mike R., PPC Specialist</div></div>
          <p style="text-align: center;"><a href="{{dashboard_url}}/ads-search" class="btn">Research Competitors Now →</a></p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'ob_05_social_proof',
    sequence: 'onboarding',
    name: 'Social Proof',
    subject: 'See What Others Are Achieving with Adiology',
    triggerType: 'time_delay',
    triggerValue: '7_days',
    dayOffset: 7,
    description: 'User testimonials and results',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>Success Stories</h1><p>Real Results from Real Users</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Don't just take our word for it. Here's what Adiology users are saying:</p>
          <div class="testimonial">"I used to spend 8 hours building one campaign. Now I build 5 campaigns in under an hour. Game changer."<div class="testimonial-author">— Jennifer L., Agency Owner</div></div>
          <div class="testimonial">"The AI-generated keywords are incredibly relevant. My Quality Scores jumped from 5 to 8 on average."<div class="testimonial-author">— David T., E-commerce Manager</div></div>
          <div class="testimonial">"Finally, a tool that understands campaign structure. The intent-based grouping is brilliant."<div class="testimonial-author">— Amanda K., Digital Marketing Consultant</div></div>
          <div style="display: flex; gap: 15px; margin: 25px 0;">
            <div class="stat-box" style="flex: 1;"><div class="stat-number">4.9/5</div><div class="stat-label">User Rating</div></div>
            <div class="stat-box" style="flex: 1;"><div class="stat-number">10K+</div><div class="stat-label">Campaigns Built</div></div>
            <div class="stat-box" style="flex: 1;"><div class="stat-number">85%</div><div class="stat-label">Time Saved</div></div>
          </div>
          <p style="text-align: center;"><a href="{{dashboard_url}}" class="btn">Join Our Success Stories →</a></p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'ob_06_milestone',
    sequence: 'onboarding',
    name: 'Milestone Celebration',
    subject: "Incredible! You're a Campaign Building Pro",
    triggerType: 'time_delay',
    triggerValue: '10_days',
    dayOffset: 10,
    description: 'Milestone celebration with achievements',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);"><h1>🏆 Achievement Unlocked!</h1><p>You've Mastered the Basics</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Wow! Look at what you've accomplished in just 10 days:</p>
          <div style="display: flex; gap: 15px; margin: 25px 0;">
            <div class="stat-box" style="flex: 1;"><div class="stat-number">{{campaigns_count}}</div><div class="stat-label">Campaigns</div></div>
            <div class="stat-box" style="flex: 1;"><div class="stat-number">{{keywords_count}}</div><div class="stat-label">Keywords</div></div>
            <div class="stat-box" style="flex: 1;"><div class="stat-number">{{ads_count}}</div><div class="stat-label">Ads Created</div></div>
          </div>
          <div class="highlight" style="text-align: center;"><span class="badge" style="font-size: 16px; padding: 8px 20px;">🌟 TOP 10% USER 🌟</span><p style="margin-top: 15px;">You're outperforming 90% of new users!</p></div>
          <p>You're ready for the full Adiology experience. Just 4 days left in your trial!</p>
          <p style="text-align: center;"><a href="{{upgrade_url}}" class="btn">Upgrade & Keep Building →</a></p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'ob_07_trial_warning',
    sequence: 'onboarding',
    name: 'Trial Ending Warning',
    subject: "3 Days Left - Don't Lose Your Progress!",
    triggerType: 'time_delay',
    triggerValue: '11_days',
    dayOffset: 11,
    description: 'Trial ending warning with urgency',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);"><h1>Your Trial Ends Soon</h1><p>3 Days Remaining</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Your free trial ends in <strong>3 days</strong>. Here's what you'll lose access to:</p>
          <div class="warning-box">
            <ul style="margin: 0; padding-left: 20px;"><li>All your saved campaigns</li><li>AI-powered keyword generation</li><li>Competitor ad research</li><li>Google Ads Editor exports</li><li>Team collaboration features</li></ul>
          </div>
          <h3>Your Trial Accomplishments:</h3>
          <div style="display: flex; gap: 15px; margin: 25px 0;">
            <div class="stat-box" style="flex: 1;"><div class="stat-number">{{campaigns_count}}</div><div class="stat-label">Campaigns</div></div>
            <div class="stat-box" style="flex: 1;"><div class="stat-number">{{keywords_count}}</div><div class="stat-label">Keywords</div></div>
            <div class="stat-box" style="flex: 1;"><div class="stat-number">{{ads_count}}</div><div class="stat-label">Ads</div></div>
          </div>
          <div class="highlight"><h3 style="margin-top: 0;">💰 Special Trial Offer</h3><p>Upgrade now and get <strong>20% off your first 3 months</strong>.</p><a href="{{upgrade_url}}?offer=TRIAL20" class="btn">Claim 20% Discount →</a></div>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'ob_08_final_call',
    sequence: 'onboarding',
    name: 'Final Call - Trial Ends Tomorrow',
    subject: 'FINAL DAY: Your Trial Expires Tomorrow',
    triggerType: 'time_delay',
    triggerValue: '13_days',
    dayOffset: 13,
    description: 'Last chance offer before trial ends',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);"><h1>Last Chance!</h1><p>Your Trial Expires Tomorrow</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>This is it. <strong>Your trial expires in 24 hours.</strong></p>
          <div class="urgency-box"><h3 style="margin-top: 0;">⏰ What Happens Tomorrow:</h3><ul style="margin-bottom: 0; padding-left: 20px;"><li>Account reverts to free tier</li><li>Saved campaigns become read-only</li><li>AI features disabled</li><li>Export functionality locked</li></ul></div>
          <div style="display: flex; gap: 15px; margin: 25px 0;">
            <div class="stat-box" style="flex: 1; border: 2px solid #ef4444;"><div class="stat-number">{{campaigns_count}}</div><div class="stat-label">Campaigns at Risk</div></div>
            <div class="stat-box" style="flex: 1; border: 2px solid #ef4444;"><div class="stat-number">{{keywords_count}}</div><div class="stat-label">Keywords at Risk</div></div>
          </div>
          <div class="highlight" style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-color: #22c55e;">
            <h3 style="margin-top: 0; color: #16a34a;">🎁 Final Offer: 25% Off</h3>
            <p>Upgrade in the next 24 hours and save 25% on your first 6 months.</p>
            <a href="{{upgrade_url}}?offer=LASTCHANCE25" class="btn" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">Upgrade Now - Save 25% →</a>
          </div>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },

  // ============ CONVERSION (6 emails) ============
  {
    id: 'cv_01_soft_nudge',
    sequence: 'conversion',
    name: 'Soft Nudge',
    subject: 'Still Thinking? Here\'s What You\'d Miss...',
    triggerType: 'event',
    triggerValue: 'trial_expired',
    dayOffset: 1,
    description: 'Soft nudge after trial expires',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>A Quick Note</h1><p>Before You Decide</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>I noticed your trial ended, but you haven't upgraded yet. No pressure—I just wanted to make sure you have all the info you need.</p>
          <h3>Here's what Pro members get:</h3>
          <ul class="check-list"><li><strong>Unlimited campaigns</strong> - No more hitting limits</li><li><strong>AI keyword suggestions</strong> - 500+ keywords per campaign</li><li><strong>Competitor research</strong> - See what's working for others</li><li><strong>Priority support</strong> - Get help when you need it</li><li><strong>Team collaboration</strong> - Work together seamlessly</li></ul>
          <div class="highlight"><h3 style="margin-top: 0;">💡 Did You Know?</h3><p>Pro users save an average of <strong>15 hours per week</strong> on campaign building.</p></div>
          <p style="text-align: center;"><a href="{{upgrade_url}}" class="btn">See Pricing Plans →</a></p>
          <p>Still have questions? Just reply—I read every email!</p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'cv_02_testimonial',
    sequence: 'conversion',
    name: 'Testimonial Push',
    subject: '"Best Decision I Made for My Agency" - ROI Stories',
    triggerType: 'time_delay',
    triggerValue: '3_days_after_trial',
    dayOffset: 17,
    description: 'ROI-focused customer stories',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>Real ROI Stories</h1><p>From Marketers Like You</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Still on the fence? Let me share what happened to these marketers after they upgraded:</p>
          <div class="testimonial">"I was skeptical about paying for another tool. Within 2 weeks, I'd saved enough time to take on 3 new clients. The tool paid for itself 10x over."<div class="testimonial-author">— Marcus J., Freelance PPC Specialist</div><div style="margin-top: 10px;"><span class="badge">ROI: 1,000%+</span></div></div>
          <div class="testimonial">"My client campaigns used to take all day. Now I finish by lunch and actually have time for strategy."<div class="testimonial-author">— Rachel W., Digital Marketing Director</div><div style="margin-top: 10px;"><span class="badge">Time Saved: 4hrs/day</span></div></div>
          <div class="highlight"><strong>The average Adiology user sees positive ROI within 14 days.</strong></div>
          <p style="text-align: center;"><a href="{{upgrade_url}}" class="btn">Start Seeing Results →</a></p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'cv_03_objection',
    sequence: 'conversion',
    name: 'Objection Handler',
    subject: 'Common Questions Before Upgrading (Answered)',
    triggerType: 'time_delay',
    triggerValue: '5_days_after_trial',
    dayOffset: 19,
    description: 'FAQ and pricing breakdown',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>Questions? Answered.</h1><p>Everything You Need to Know</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Before you decide, let me address the most common questions:</p>
          <div class="highlight"><h3 style="margin-top: 0;">💰 "Is it worth the price?"</h3><p>At $29/month, if Adiology saves you just 2 hours of work, it's already paid for itself.</p></div>
          <div class="highlight"><h3 style="margin-top: 0;">🔒 "What if I don't like it?"</h3><p>We offer a <strong>30-day money-back guarantee</strong>. No questions asked.</p></div>
          <div class="highlight"><h3 style="margin-top: 0;">📈 "Will it actually improve my campaigns?"</h3><p>Our users report an average <strong>40% improvement in Quality Scores</strong>.</p></div>
          <div class="highlight"><h3 style="margin-top: 0;">🔄 "Can I cancel anytime?"</h3><p>Absolutely. No contracts, no commitments. Cancel with one click.</p></div>
          <p style="text-align: center;"><a href="{{upgrade_url}}" class="btn">Choose Your Plan →</a></p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'cv_04_urgency',
    sequence: 'conversion',
    name: 'Urgency Final',
    subject: '48 Hours: Special Pricing Expires',
    triggerType: 'time_delay',
    triggerValue: '7_days_after_trial',
    dayOffset: 21,
    description: 'Limited-time discount offer',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);"><h1>48 Hours Left</h1><p>Your Special Offer Expires Soon</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>I wanted to give you one last heads up...</p>
          <div class="urgency-box">
            <h3 style="margin-top: 0;">⏰ Your exclusive offer expires in 48 hours:</h3>
            <div style="text-align: center; margin: 20px 0;"><span style="font-size: 48px; font-weight: 700; color: #dc2626;">30% OFF</span><p style="margin: 5px 0;">First 3 months of Pro</p></div>
            <p style="text-align: center; margin-bottom: 0;"><del style="color: #9ca3af;">$29/month</del> → <strong style="color: #16a34a;">$20/month</strong></p>
          </div>
          <p style="text-align: center;"><a href="{{upgrade_url}}?offer=SPECIAL30" class="btn" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); font-size: 18px; padding: 18px 40px;">Claim 30% Off Now →</a></p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'cv_05_winback1',
    sequence: 'conversion',
    name: 'Win-Back #1',
    subject: 'We Miss You! Here\'s an Extended Trial',
    triggerType: 'time_delay',
    triggerValue: '14_days_after_trial',
    dayOffset: 28,
    description: 'Extended trial offer for churned users',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>We Miss You!</h1><p>Come Back and Finish What You Started</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>It's been a few days since your trial ended, and I wanted to check in.</p>
          <p>I looked at your account, and I see you built some great campaigns:</p>
          <div style="display: flex; gap: 15px; margin: 25px 0;">
            <div class="stat-box" style="flex: 1;"><div class="stat-number">{{campaigns_count}}</div><div class="stat-label">Campaigns</div></div>
            <div class="stat-box" style="flex: 1;"><div class="stat-number">{{keywords_count}}</div><div class="stat-label">Keywords</div></div>
          </div>
          <p>That's real work you put in. I don't want you to lose it.</p>
          <div class="highlight"><h3 style="margin-top: 0;">🎁 Special Offer: 7 More Days Free</h3><p>Come back and we'll extend your trial by 7 days—no strings attached.</p><a href="{{dashboard_url}}/extend-trial" class="btn">Extend My Trial →</a></div>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'cv_06_winback2',
    sequence: 'conversion',
    name: 'Win-Back #2 - Exit Survey',
    subject: 'Quick Question (Takes 30 Seconds)',
    triggerType: 'time_delay',
    triggerValue: '21_days_after_trial',
    dayOffset: 35,
    description: 'Exit survey to understand churn',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>Quick Question</h1><p>Help Us Improve</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>I'll keep this short.</p>
          <p>You tried Adiology but didn't continue. I'm curious—<strong>what held you back?</strong></p>
          <p>Click the option that best describes your situation:</p>
          <div style="margin: 25px 0;">
            <a href="{{feedback_url}}?reason=price" style="display: block; padding: 15px 20px; background: #f3f4f6; border-radius: 8px; margin: 10px 0; text-decoration: none; color: #374151;">💰 <strong>Price</strong> - It's too expensive for my budget</a>
            <a href="{{feedback_url}}?reason=features" style="display: block; padding: 15px 20px; background: #f3f4f6; border-radius: 8px; margin: 10px 0; text-decoration: none; color: #374151;">🔧 <strong>Features</strong> - Missing something I need</a>
            <a href="{{feedback_url}}?reason=complexity" style="display: block; padding: 15px 20px; background: #f3f4f6; border-radius: 8px; margin: 10px 0; text-decoration: none; color: #374151;">🤯 <strong>Complexity</strong> - Too hard to use</a>
            <a href="{{feedback_url}}?reason=timing" style="display: block; padding: 15px 20px; background: #f3f4f6; border-radius: 8px; margin: 10px 0; text-decoration: none; color: #374151;">⏰ <strong>Timing</strong> - Not the right time for me</a>
          </div>
          <p>Your feedback helps us build a better product.</p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },

  // ============ CHURN PREVENTION (3 emails) ============
  {
    id: 'cp_01_save_offer',
    sequence: 'churn_prevention',
    name: 'Save Offer - Before Cancel',
    subject: 'Wait! Before You Go...',
    triggerType: 'event',
    triggerValue: 'cancel_intent',
    dayOffset: 0,
    description: 'Save offer when user tries to cancel',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>We Don't Want to Lose You</h1><p>Let's Find a Solution Together</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>I noticed you're thinking about canceling your subscription. Before you go, I wanted to offer some alternatives:</p>
          <div class="highlight"><h3 style="margin-top: 0;">🔄 Option 1: Pause Your Subscription</h3><p>Take a break for up to 3 months. Your data stays safe.</p><a href="{{account_url}}/pause" class="btn btn-secondary">Pause Subscription</a></div>
          <div class="highlight"><h3 style="margin-top: 0;">💰 Option 2: Switch to a Lower Plan</h3><p>Downgrade to our Starter plan at $15/month.</p><a href="{{upgrade_url}}/downgrade" class="btn btn-secondary">View Starter Plan</a></div>
          <div class="highlight" style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-color: #22c55e;"><h3 style="margin-top: 0; color: #16a34a;">🎁 Option 3: 50% Off Next 3 Months</h3><p>Stay with us at half price. Keep all your features and data.</p><a href="{{upgrade_url}}/save50" class="btn" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">Claim 50% Off</a></div>
          <p>If something specific isn't working for you, reply to this email. I personally read every response.</p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'cp_02_feedback',
    sequence: 'churn_prevention',
    name: 'Post-Cancel Feedback',
    subject: "We're Sorry to See You Go",
    triggerType: 'event',
    triggerValue: 'subscription_cancelled',
    dayOffset: 0,
    description: 'Feedback request after cancellation',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);"><h1>Goodbye for Now</h1><p>Your Feedback Matters</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Your subscription has been canceled. We're sad to see you go.</p>
          <p>Your account will remain accessible in read-only mode, so you can still view your campaigns and export data.</p>
          <div class="highlight"><h3 style="margin-top: 0;">📝 One Quick Favor</h3><p>Would you take 30 seconds to tell us why you left? Your feedback helps us improve.</p><a href="{{feedback_url}}/cancel" class="btn">Share Feedback</a></div>
          <h3>Remember:</h3>
          <ul class="check-list"><li>You can reactivate anytime</li><li>Your data is saved for 90 days</li><li>We're always improving based on feedback</li></ul>
          <p>Wishing you success in all your marketing efforts!</p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'cp_03_comeback',
    sequence: 'churn_prevention',
    name: 'Win-Back - Comeback Offer',
    subject: "We've Missed You! Come Back for 40% Off",
    triggerType: 'time_delay',
    triggerValue: '60_days_after_cancel',
    dayOffset: 60,
    description: 'Major comeback offer for churned users',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header"><h1>A Lot Has Changed!</h1><p>Come See What's New</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>It's been a while since we last saw you, and <strong>a lot has changed</strong> at Adiology:</p>
          <h3>New Features You'll Love:</h3>
          <ul class="check-list"><li><strong>AI Ad Copy Generator</strong> - Write high-converting ads in seconds</li><li><strong>Competitor Intelligence 2.0</strong> - Deeper insights, more data</li><li><strong>Team Workspaces</strong> - Collaborate seamlessly</li><li><strong>Performance Predictions</strong> - Know your ROI before you launch</li></ul>
          <div class="highlight" style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-color: #22c55e;">
            <h3 style="margin-top: 0; color: #16a34a;">🎁 Welcome Back: 40% Off</h3>
            <p>Come back and try the new Adiology with 40% off your first 3 months.</p>
            <div style="text-align: center; margin: 20px 0;"><span style="font-size: 32px; font-weight: 700; color: #16a34a;">$17/month</span><span style="color: #6b7280; margin-left: 10px;"><del>$29/month</del></span></div>
            <a href="{{upgrade_url}}?offer=WB40" class="btn" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); display: block; text-align: center;">Reactivate with 40% Off →</a>
          </div>
          <p>Your old campaigns are still there waiting for you.</p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },

  // ============ ADVOCACY (3 emails) ============
  {
    id: 'ad_01_review',
    sequence: 'advocacy',
    name: 'Review Request',
    subject: 'Love Adiology? Share Your Experience!',
    triggerType: 'condition',
    triggerValue: 'active_30_days_high_usage',
    dayOffset: 30,
    description: 'Request review from happy customers',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);"><h1>You're Amazing!</h1><p>Would You Share Your Experience?</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>You've been using Adiology for a while now, and we've noticed you're a power user! 🌟</p>
          <div style="display: flex; gap: 15px; margin: 25px 0;">
            <div class="stat-box" style="flex: 1;"><div class="stat-number">{{campaigns_count}}</div><div class="stat-label">Campaigns Built</div></div>
            <div class="stat-box" style="flex: 1;"><div class="stat-number">{{keywords_count}}</div><div class="stat-label">Keywords Generated</div></div>
          </div>
          <p>Would you mind sharing your experience with other marketers?</p>
          <div class="highlight"><h3 style="margin-top: 0;">⭐ Leave a Review</h3><p>Takes just 2 minutes and helps tremendously!</p><div style="display: flex; gap: 10px; margin-top: 15px;"><a href="https://g2.com/products/adiology/reviews" class="btn" style="flex: 1; text-align: center;">Review on G2</a><a href="https://capterra.com/p/adiology/reviews" class="btn btn-secondary" style="flex: 1; text-align: center;">Review on Capterra</a></div></div>
          <p>As a thank you, we'll add <strong>1 month free</strong> to your subscription!</p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'ad_02_referral',
    sequence: 'advocacy',
    name: 'Referral Program Invite',
    subject: 'Give $20, Get $20 - Referral Program',
    triggerType: 'condition',
    triggerValue: 'active_90_days',
    dayOffset: 90,
    description: 'Referral program invitation',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);"><h1>Share the Love!</h1><p>Give $20, Get $20</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Know someone who could benefit from Adiology? <strong>Share the love and get rewarded!</strong></p>
          <div class="highlight" style="text-align: center;">
            <h3 style="margin-top: 0;">Your Referral Link</h3>
            <div style="background: #1f2937; color: #10b981; padding: 15px; border-radius: 8px; font-family: monospace; margin: 15px 0;">{{referral_link}}</div>
            <a href="{{referral_url}}" class="btn" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">Copy Link & Share →</a>
          </div>
          <h3>How It Works:</h3>
          <div class="timeline">
            <div class="timeline-item"><strong>Share Your Link</strong><br>Send to colleagues, friends, or your network</div>
            <div class="timeline-item"><strong>They Sign Up</strong><br>They get $20 off their first month</div>
            <div class="timeline-item"><strong>You Get Rewarded</strong><br>You get $20 credit when they subscribe</div>
          </div>
          <div class="stat-box"><div class="stat-number">No Limit!</div><div class="stat-label">Refer as many friends as you want</div></div>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  },
  {
    id: 'ad_03_anniversary',
    sequence: 'advocacy',
    name: 'Loyalty Reward - Anniversary',
    subject: 'Happy Anniversary! A Gift for You',
    triggerType: 'event',
    triggerValue: 'subscription_anniversary',
    dayOffset: 365,
    description: 'Anniversary celebration with loyalty reward',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head><body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);"><h1>🎂 Happy 1 Year!</h1><p>Thank You for Being With Us</p></div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Can you believe it? Today marks <strong>1 year since you joined Adiology</strong>!</p>
          <h3>Your Year in Review:</h3>
          <div style="display: flex; gap: 15px; margin: 25px 0;">
            <div class="stat-box" style="flex: 1; background: linear-gradient(135deg, #8b5cf620 0%, #7c3aed20 100%);"><div class="stat-number" style="color: #7c3aed;">{{campaigns_count}}</div><div class="stat-label">Campaigns Created</div></div>
            <div class="stat-box" style="flex: 1; background: linear-gradient(135deg, #8b5cf620 0%, #7c3aed20 100%);"><div class="stat-number" style="color: #7c3aed;">{{keywords_count}}</div><div class="stat-label">Keywords Generated</div></div>
            <div class="stat-box" style="flex: 1; background: linear-gradient(135deg, #8b5cf620 0%, #7c3aed20 100%);"><div class="stat-number" style="color: #7c3aed;">{{hours_saved}}</div><div class="stat-label">Hours Saved</div></div>
          </div>
          <div class="highlight" style="background: linear-gradient(135deg, #8b5cf620 0%, #7c3aed20 100%); border-color: #7c3aed; text-align: center;">
            <h3 style="margin-top: 0; color: #7c3aed;">🎁 Your Anniversary Gift</h3>
            <p>As a thank you for your loyalty, here's <strong>1 month FREE</strong> added to your subscription!</p>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">Already applied to your account</p>
          </div>
          <div class="highlight" style="text-align: center;">
            <span class="badge" style="background: #7c3aed; font-size: 14px; padding: 6px 16px;">🌟 LOYALTY MEMBER 🌟</span>
            <p style="margin-top: 15px;">You now have access to our exclusive Loyalty Member perks:</p>
            <ul style="text-align: left; display: inline-block;"><li>Early access to new features</li><li>Priority support queue</li><li>Exclusive webinars and training</li><li>Annual loyalty bonus</li></ul>
          </div>
          <p>Thank you for trusting us with your Google Ads campaigns!</p>
          <p><strong>— The Adiology Team</strong></p>
        </div>
        ${footer}
      </div>
    </body></html>`
  }
];

export const getEmailsBySequence = (sequence: SequenceEmail['sequence']) => 
  sequenceEmails.filter(e => e.sequence === sequence);

export const getEmailById = (id: string) => 
  sequenceEmails.find(e => e.id === id);

export default sequenceEmails;
