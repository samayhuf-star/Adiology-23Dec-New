import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Check, Clock, Users, Sparkles, Target, BarChart3, 
  FileText, Globe, Rocket, Shield, Award, ArrowRight,
  TrendingUp, Layers, MousePointer, ChevronRight, Star,
  Timer, AlertCircle, Gift, CreditCard
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface PromoLandingPageProps {
  onStartTrial: () => void;
}

export function PromoLandingPage({ onStartTrial }: PromoLandingPageProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 6,
    hours: 23,
    minutes: 59,
    seconds: 59
  });
  const [slotsLeft, setSlotsLeft] = useState(5);
  const [totalSlots, setTotalSlots] = useState(50);
  const [offerActive, setOfferActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch promo status from API
  useEffect(() => {
    const fetchPromoStatus = async () => {
      try {
        const response = await fetch('/api/promo/status');
        if (response.ok) {
          const data = await response.json();
          setSlotsLeft(data.slotsRemaining);
          setTotalSlots(data.totalSlots);
          setOfferActive(data.offerActive);
        }
      } catch (error) {
        console.warn('Could not fetch promo status:', error);
      }
    };
    
    fetchPromoStatus();
    // Poll every 30 seconds
    const pollInterval = setInterval(fetchPromoStatus, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate.getTime() - now;
      
      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/promo/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to start trial. Please try again.');
      }
    } catch (error) {
      console.error('Trial start error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Target,
      title: 'Smart Campaign Builder',
      description: 'AI-powered campaign creation with 14 proven structures including SKAG, STAG, and Alpha-Beta'
    },
    {
      icon: Sparkles,
      title: 'AI Keyword Generation',
      description: 'Generate 500+ targeted keywords instantly with intent-based filtering and negative keyword suggestions'
    },
    {
      icon: FileText,
      title: 'Dynamic Ad Creation',
      description: 'Create RSA, DKI, and Call-Only ads with live preview and Google Ads policy compliance'
    },
    {
      icon: Globe,
      title: 'Geo Targeting',
      description: 'Target by country, state, city, or ZIP code with 15,000+ locations supported'
    },
    {
      icon: Layers,
      title: '70+ Campaign Presets',
      description: 'Ready-made templates for every vertical: legal, dental, HVAC, real estate, and more'
    },
    {
      icon: BarChart3,
      title: 'Google Ads Export',
      description: 'Export campaigns directly to Google Ads Editor format - import and go live in minutes'
    },
    {
      icon: MousePointer,
      title: 'Web Template Builder',
      description: 'Create stunning landing pages with 10+ mobile-responsive templates'
    },
    {
      icon: TrendingUp,
      title: 'Keyword Mixer & Planner',
      description: 'Combine keywords, filter by intent, and discover long-tail opportunities'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'Digital Marketing Manager',
      content: 'Cut our campaign setup time by 80%. What used to take days now takes minutes.',
      rating: 5
    },
    {
      name: 'Mike R.',
      role: 'Agency Owner',
      content: 'The AI keyword generation is incredible. We generated over 500 targeted keywords in seconds.',
      rating: 5
    },
    {
      name: 'Jennifer L.',
      role: 'Small Business Owner',
      content: 'Finally a tool that makes Google Ads accessible. The presets are a game-changer.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Urgency Banner */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-4 text-white text-center">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 animate-pulse" />
            <span className="font-bold">LIMITED TIME OFFER</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Only</span>
            <span className="bg-white/20 px-3 py-1 rounded-full font-bold">{slotsLeft} of 50 slots left</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <span>Expires in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Special Offer Badge */}
            <Badge className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-6 py-2 text-lg">
              <Gift className="w-5 h-5 mr-2" />
              SPECIAL LAUNCH OFFER - 90% OFF
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Build Google Ads Campaigns
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                10x Faster with AI
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The complete platform for creating, managing, and optimizing 
              Google Ads campaigns. From keywords to ads to landing pages - all in one place.
            </p>

            {/* Trial Offer Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="max-w-3xl mx-auto mb-12"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 rounded-2xl blur-lg opacity-75 animate-pulse" />
                <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-left">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-5xl font-bold text-white">$5</span>
                        <span className="text-gray-400 line-through text-xl">$99.99</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Save 95%</Badge>
                      </div>
                      <p className="text-gray-300 text-lg mb-2">
                        <strong>5-Day Full Access Trial</strong>
                      </p>
                      <ul className="text-gray-400 text-sm space-y-1">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-400" />
                          All premium features unlocked
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-400" />
                          Cancel anytime within 5 days for full refund
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-400" />
                          Auto-converts to Lifetime Plan ($94.99 after $5 credit)
                        </li>
                      </ul>
                    </div>
                    <Button
                      onClick={handleStartTrial}
                      disabled={isLoading}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-6 text-xl font-bold rounded-xl shadow-2xl shadow-purple-500/30 transition-all hover:scale-105"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Start $5 Trial
                          <ArrowRight className="w-6 h-6" />
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* WIN-WIN HIGHLIGHT SECTION */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="max-w-4xl mx-auto mb-12"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 rounded-2xl blur opacity-50" />
                <div className="relative bg-gradient-to-br from-amber-950/80 to-orange-950/80 border-2 border-amber-500/50 rounded-2xl p-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Gift className="w-8 h-8 text-amber-400" />
                    <h3 className="text-2xl md:text-3xl font-bold text-amber-300">A WIN-WIN Deal For You</h3>
                    <Gift className="w-8 h-8 text-amber-400" />
                  </div>
                  
                  <div className="text-center mb-6">
                    <p className="text-lg md:text-xl text-white mb-4">
                      <strong>Pay just $5 to test the ENTIRE platform</strong> - explore every feature, 
                      build campaigns, generate keywords, create ads. Take it for a full spin!
                    </p>
                    <p className="text-lg text-amber-200">
                      If you love it (and you will), after 5 days it <strong>automatically converts to our Lifetime Plan</strong> at 
                      <span className="text-2xl font-bold text-white mx-2">$99.99</span>
                      <span className="text-amber-300">- but we credit your $5 trial!</span>
                    </p>
                    <p className="text-2xl font-bold text-green-400 mt-4">
                      You only pay $94.99 for LIFETIME access!
                    </p>
                  </div>

                  <div className="bg-black/30 rounded-xl p-6 mb-6">
                    <h4 className="text-xl font-bold text-white mb-4 text-center">What You Get Forever with Lifetime Plan:</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      {[
                        '10 Campaigns per month',
                        '10 Domains',
                        '50 Campaign Presets',
                        '50 Templates',
                        'Workspaces',
                        'Access for 2 Users',
                        '1-Click Campaign Builder',
                        'Campaign Builder Wizard',
                        '10+ Google Ads Assets',
                        'Campaign History',
                        'Keywords Planner',
                        'Keyword Mixer',
                        'Negative Keywords Tool',
                        'Long Tail Keywords',
                        'Website Templates & Builder',
                        'AI Ad Creation',
                        'CSV Export (Google Ads Ready)',
                        'Save Lists Individually',
                        'All Future Updates',
                        'Priority Support'
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-gray-200">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-amber-200 text-lg">
                      <strong>One payment. Own it forever.</strong> No monthly fees, no renewals, no surprises.
                    </p>
                    <p className="text-gray-400 mt-2">
                      Not satisfied? Cancel within 5 days and get your $5 back. Zero risk.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <span>Powered by Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>30-Day Money Back</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Countdown Timer Section */}
      <section className="py-12 px-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-y border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-6">Offer Expires In:</h3>
          <div className="flex justify-center gap-4">
            {[
              { value: timeLeft.days, label: 'Days' },
              { value: timeLeft.hours, label: 'Hours' },
              { value: timeLeft.minutes, label: 'Minutes' },
              { value: timeLeft.seconds, label: 'Seconds' }
            ].map((item, i) => (
              <div key={i} className="bg-slate-800 border border-white/10 rounded-xl p-4 min-w-[80px]">
                <div className="text-4xl font-bold text-white">{String(item.value).padStart(2, '0')}</div>
                <div className="text-gray-400 text-sm">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-amber-400">
            <Users className="w-5 h-5" />
            <span className="font-semibold">{slotsLeft} slots remaining out of 50</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
              Everything You Need
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Powerful Features, <span className="text-purple-400">Zero Complexity</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to create, launch, and optimize Google Ads campaigns - all included in your trial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How the Trial Works</h2>
            <p className="text-xl text-gray-400">Simple, transparent, no surprises</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Pay $5 Today',
                description: 'Get instant access to all premium features. Full platform unlocked immediately.'
              },
              {
                step: '2',
                title: 'Explore for 5 Days',
                description: 'Build campaigns, generate keywords, create ads. Use everything with no restrictions.'
              },
              {
                step: '3',
                title: 'Keep Forever or Cancel',
                description: 'Love it? Your $5 is credited to the Lifetime Plan ($99.99 - $5 = $94.99). Own it forever! Not for you? Cancel for a full refund.'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative"
              >
                <div className="bg-slate-800 border border-white/10 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="w-8 h-8 text-purple-500" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Loved by Marketers</h2>
            <p className="text-xl text-gray-400">Join thousands of happy customers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
                <div>
                  <div className="font-bold text-white">{testimonial.name}</div>
                  <div className="text-gray-500 text-sm">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-6 bg-red-500/20 text-red-300 border-red-500/30 px-4 py-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              Only {slotsLeft} spots left at this price
            </Badge>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Don't Miss This Limited Offer
            </h2>

            <p className="text-xl text-gray-300 mb-8">
              Start building better Google Ads campaigns today. 
              Risk-free with our 5-day trial and full refund guarantee.
            </p>

            <Button
              onClick={handleStartTrial}
              disabled={isLoading}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-12 py-6 text-xl font-bold rounded-xl shadow-2xl shadow-amber-500/30 transition-all hover:scale-105"
            >
              {isLoading ? 'Processing...' : 'Start Your $5 Trial Now'}
              <Rocket className="w-6 h-6 ml-2" />
            </Button>

            <p className="mt-6 text-gray-400 text-sm">
              Secure checkout powered by Stripe. Cancel anytime within 5 days for a full refund.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {[
              {
                q: 'What happens after the 5-day trial?',
                a: 'If you love the platform, your $5 trial fee is automatically credited toward the Lifetime Plan. You\'ll be charged only $94.99 ($99.99 - $5 credit) for permanent, lifetime access. No monthly fees ever!'
              },
              {
                q: 'Can I really cancel anytime?',
                a: 'Absolutely! Cancel within the 5-day trial period for a full $5 refund. No questions asked, no hidden fees. You can cancel directly from your account settings.'
              },
              {
                q: 'What\'s included in the Lifetime Plan?',
                a: 'Everything! 10 campaigns/month, 10 domains, 50 presets, 50 templates, workspaces, 2 users, all campaign builders, keywords tools, AI ad creation, CSV export, website builder, and ALL future updates. Own it forever with one payment.'
              },
              {
                q: 'Why is this offer limited to 50 slots?',
                a: 'We want to ensure every trial user gets personalized support and a great experience. By limiting slots, we can provide better onboarding and assistance during your trial.'
              },
              {
                q: 'Is this really a one-time payment?',
                a: 'Yes! The Lifetime Plan is a single payment of $99.99 (only $94.99 with your trial credit). You own the software forever with no recurring charges. Plus, you get all future updates included.'
              }
            ].map((faq, i) => (
              <div key={i} className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Adiology. All rights reserved.</p>
          <p className="mt-2">
            Questions? Email us at <a href="mailto:support@adiology.io" className="text-purple-400 hover:underline">support@adiology.io</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
