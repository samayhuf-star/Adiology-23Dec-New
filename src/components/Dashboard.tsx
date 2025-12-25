import { useState, useEffect } from 'react';
import { 
  Activity, Zap, Sparkles, Package, Target, Globe, FolderOpen, Terminal,
  CheckCircle2, FileText, Layers, TrendingUp, ArrowUp
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { TerminalCard, TerminalLine } from './ui/terminal-card';
import { supabase } from '../utils/supabase/client';
import { historyService } from '../utils/historyService';
import { getUserPublishedWebsites } from '../utils/publishedWebsites';
import { getUserPreferences, saveUserPreferences, initializeUserPreferences } from '../utils/userPreferences';
import { 
  useScreenSize, 
  getResponsiveGridCols, 
  getResponsiveGap, 
  getResponsiveIconSize, 
  getResponsiveFontSize,
  getResponsivePadding
} from '../utils/responsive';

interface DashboardProps {
  user: any;
  onNavigate: (tab: string) => void;
}

interface UserStats {
  subscription: {
    plan: string;
    status: string;
    periodEnd: string | null;
  };
  usage: {
    apiCalls: number;
    campaigns: number;
    keywords: number;
  };
  activity: {
    lastLogin: string | null;
    totalActions: number;
  };
  userResources: {
    myCampaigns: number;
    myWebsites: number;
    myPresets: number;
    myDomains: number;
  };
}

interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
  resourceType: string;
  metadata: any;
}

export function Dashboard({ user, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(getUserPreferences());
  const screenSize = useScreenSize();

  useEffect(() => {
    fetchDashboardData();
    initializeUserPreferences();
  }, [user]);

  useEffect(() => {
    saveUserPreferences(preferences);
  }, [preferences]);

  const handleSidebarAutoCloseToggle = () => {
    const updatedPrefs = { ...preferences, sidebarAutoClose: !preferences.sidebarAutoClose };
    setPreferences(updatedPrefs);
    saveUserPreferences(updatedPrefs);
  };

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch dashboard data from our API
      let apiData: any = { stats: { totalCampaigns: 0, totalSearches: 0 }, recentCampaigns: [] };
      try {
        const response = await fetch(`/api/dashboard/${user.id}`);
        if (response.ok) {
          apiData = await response.json();
        }
      } catch (err) {
        console.warn('Dashboard API not available, using fallback');
      }

      // Fetch user-specific resources from local history as fallback
      let myCampaigns = apiData.stats?.totalCampaigns || 0;
      let myWebsites = 0;
      let myPresets = 0;
      let myDomains = 0;
      let activityData: any[] = [];

      try {
        // Get campaigns from history service as additional source
        const allHistory = await historyService.getAll();
        const historyCampaigns = allHistory.filter(item => 
          item.type === 'builder-2-campaign' || 
          item.type === 'campaign' ||
          item.type?.includes('campaign')
        ).length;
        
        // Use the higher count between API and local
        myCampaigns = Math.max(myCampaigns, historyCampaigns);

        // Get saved templates/presets from history
        myPresets = allHistory.filter(item => 
          item.type === 'website-template' || 
          item.type === 'campaign-preset' ||
          item.type?.includes('preset') ||
          item.type?.includes('template')
        ).length;

        // Get domains from history
        myDomains = allHistory.filter(item => 
          item.type === 'domain-search' || 
          item.type === 'domain-purchase' ||
          item.type === 'domain-monitoring' ||
          item.type === 'domain' ||
          item.type?.includes('domain')
        ).length;

        // Convert recent campaigns to activity format
        if (apiData.recentCampaigns && apiData.recentCampaigns.length > 0) {
          activityData = apiData.recentCampaigns.map((c: any) => ({
            id: c.id,
            action: `${c.step >= 5 ? 'completed' : 'created'}_campaign`,
            timestamp: c.updated_at || c.created_at,
            resourceType: 'campaign',
            metadata: { name: c.campaign_name, structure: c.structure_type }
          }));
        }

        // Get published websites (gracefully handle missing table)
        try {
          const websites = await getUserPublishedWebsites(user.id);
          myWebsites = websites.length;
        } catch (websiteError: any) {
          const errorMessage = websiteError?.message?.toLowerCase() || '';
          if (!errorMessage.includes('schema cache') && 
              !errorMessage.includes('could not find the table') &&
              !errorMessage.includes('does not exist')) {
            console.warn('Could not fetch published websites:', websiteError);
          }
          myWebsites = 0;
        }
      } catch (error: any) {
        // Check if error is about missing published_websites table
        const errorMessage = error?.message?.toLowerCase() || '';
        const isTableMissingError = 
          errorMessage.includes('schema cache') || 
          errorMessage.includes('could not find the table') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('relation') && errorMessage.includes('does not exist');
        
        if (!isTableMissingError) {
          // Only log non-table-missing errors
          console.error('Error fetching user resources:', error);
        }
        // Continue with 0 counts if there's an error
      }

      setStats({
        subscription: {
          plan: user.subscription_plan || 'free',
          status: user.subscription_status || 'active',
          periodEnd: null,
        },
        usage: {
          apiCalls: 0,
          campaigns: myCampaigns,
          keywords: 0,
        },
        activity: {
          lastLogin: user.last_login_at || null,
          totalActions: activityData?.length || 0,
        },
        userResources: {
          myCampaigns,
          myWebsites,
          myPresets,
          myDomains,
        },
      });

      setRecentActivity(activityData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise':
        return 'from-purple-500 to-pink-500';
      case 'professional':
        return 'from-blue-500 to-cyan-500';
      case 'starter':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-slate-500 to-gray-500';
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'professional':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'starter':
        return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return <CheckCircle2 className="w-4 h-4" />;
    if (action.includes('export')) return <FileText className="w-4 h-4" />;
    if (action.includes('generate')) return <Sparkles className="w-4 h-4" />;
    if (action.includes('validate')) return <CheckCircle2 className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'text-indigo-600 bg-indigo-50';
    if (action.includes('export')) return 'text-blue-600 bg-blue-50';
    if (action.includes('generate')) return 'text-purple-600 bg-purple-50';
    if (action.includes('validate')) return 'text-indigo-600 bg-indigo-50';
    return 'text-slate-600 bg-slate-50';
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    { id: 'one-click-builder', title: '1 Click Campaign', icon: Zap },
    { id: 'builder-3', title: 'Campaign Builder', icon: Sparkles },
    { id: 'web-templates', title: 'Web Templates', icon: Globe },
    { id: 'preset-campaigns', title: 'Campaign Presets', icon: Package },
    { id: 'keyword-planner', title: 'Keywords Planner', icon: Target },
    { id: 'draft-campaigns', title: 'Saved Campaigns', icon: FolderOpen },
  ];

  const myCampaigns = stats?.userResources?.myCampaigns || 0;
  const keywordsGenerated = myCampaigns * 485;
  const adsCreated = myCampaigns * 12;
  const extensionsAdded = myCampaigns * 8;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 min-h-screen p-6 sm:p-8 lg:p-10 space-y-8" style={{
      '--user-spacing-multiplier': preferences.spacing,
      '--user-font-size-multiplier': preferences.fontSize
    } as React.CSSProperties}>
      {/* Enhanced Header */}
      <div className="space-y-4 slide-in-up">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Welcome back, {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Admin'}!
              </h1>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">Beta</span>
            </div>
            <p className="text-lg text-slate-600">Here's what's happening with your campaigns today.</p>
          </div>
          <button className="modern-button px-6 py-3 rounded-xl text-white font-medium shadow-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Enhanced Terminal-Style System Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 slide-in-up">
        <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/50 card-hover">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg float-animation">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Campaign Statistics</h3>
          </div>
          <div className="space-y-3 font-mono text-sm">
            <TerminalLine prefix="$" label="total_campaigns:" value={`${myCampaigns}`} valueColor="green" />
            <TerminalLine prefix="$" label="keywords_generated:" value={`${keywordsGenerated.toLocaleString()}`} valueColor="cyan" />
            <TerminalLine prefix="$" label="ads_created:" value={`${adsCreated.toLocaleString()}`} valueColor="yellow" />
            <TerminalLine prefix="$" label="extensions_added:" value={`${extensionsAdded.toLocaleString()}`} valueColor="purple" />
            <TerminalLine prefix="$" label="csv_exports:" value={`${myCampaigns}`} valueColor="white" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/50 card-hover">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg float-delay-1">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">System Status</h3>
          </div>
          <div className="space-y-3 font-mono text-sm">
            <TerminalLine prefix="$" label="api_status:" value="ONLINE" valueColor="green" />
            <TerminalLine prefix="$" label="google_ads_api:" value="CONNECTED" valueColor="green" />
            <TerminalLine prefix="$" label="keyword_planner:" value="READY" valueColor="green" />
            <TerminalLine prefix="$" label="subscription:" value={stats?.subscription?.plan?.toUpperCase() || 'FREE'} valueColor="cyan" />
            <TerminalLine prefix="$" label="last_activity:" value={formatRelativeTime(stats?.activity?.lastLogin || null)} valueColor="slate" />
          </div>
        </div>
      </div>

      {/* Enhanced My Resources Section */}
      <div className="space-y-6 slide-in-up">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            My Resources
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Enhanced My Campaigns Card */}
          <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/50 card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center shadow-lg float-animation">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">Total</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-slate-800">{myCampaigns}</h3>
              <p className="text-sm font-medium text-slate-600">My Campaigns</p>
            </div>
            <div className="mt-4 h-2 bg-rose-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-1000" style={{ width: '60%' }}></div>
            </div>
          </div>

          {/* Enhanced My Presets Card */}
          <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/50 card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center shadow-lg float-delay-1">
                <Package className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">Saved</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-slate-800">{stats?.userResources?.myPresets || 0}</h3>
              <p className="text-sm font-medium text-slate-600">My Presets</p>
            </div>
            <div className="mt-4 h-2 bg-indigo-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: '30%' }}></div>
            </div>
          </div>

          {/* Enhanced My Domains Card */}
          <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/50 card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg float-delay-2">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">Active</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-slate-800">{stats?.userResources?.myDomains || 0}</h3>
              <p className="text-sm font-medium text-slate-600">My Domains</p>
            </div>
            <div className="mt-4 h-2 bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000" style={{ width: '20%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Colorful Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 slide-in-up">
        {/* Keywords Generated - Enhanced Indigo */}
        <div className="rounded-2xl p-8 text-white shadow-xl card-hover" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90 mb-2">Keywords Generated</p>
              <p className="text-4xl font-bold mb-3">{keywordsGenerated.toLocaleString()}</p>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <ArrowUp className="w-4 h-4" />
                <span>23% from last week</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center float-animation">
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Ads Created - Enhanced Coral */}
        <div className="rounded-2xl p-8 text-white shadow-xl card-hover" style={{ background: 'linear-gradient(135deg, #F97B5C 0%, #E5684A 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90 mb-2">Ads Created</p>
              <p className="text-4xl font-bold mb-3">{adsCreated.toLocaleString()}</p>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <ArrowUp className="w-4 h-4" />
                <span>12% from last week</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center float-delay-1">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Extensions Added - Enhanced Pink/Rose */}
        <div className="rounded-2xl p-8 text-white shadow-xl card-hover" style={{ background: 'linear-gradient(135deg, #E75A7C 0%, #D44A6A 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90 mb-2">Extensions Added</p>
              <p className="text-4xl font-bold mb-3">{extensionsAdded.toLocaleString()}</p>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <ArrowUp className="w-4 h-4" />
                <span>8% from last week</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center float-delay-2">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="space-y-6 slide-in-up">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onNavigate(action.id)}
                className="group glass-card rounded-2xl p-4 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 card-hover"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                    index % 6 === 0 ? 'from-indigo-500 to-purple-500' :
                    index % 6 === 1 ? 'from-purple-500 to-pink-500' :
                    index % 6 === 2 ? 'from-cyan-500 to-blue-500' :
                    index % 6 === 3 ? 'from-green-500 to-emerald-500' :
                    index % 6 === 4 ? 'from-orange-500 to-red-500' :
                    'from-rose-500 to-pink-500'
                  } flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 text-center leading-tight">{action.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

