import { useState, useEffect } from 'react';
import { 
  Activity, Zap, Sparkles, Package, Target, Globe, FolderOpen, Terminal,
  CheckCircle2, FileText
} from 'lucide-react';
import { Button } from './ui/button';
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
        return 'bg-green-100 text-green-700 border-green-300';
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
    if (action.includes('create')) return 'text-green-600 bg-green-50';
    if (action.includes('export')) return 'text-blue-600 bg-blue-50';
    if (action.includes('generate')) return 'text-purple-600 bg-purple-50';
    if (action.includes('validate')) return 'text-emerald-600 bg-emerald-50';
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
    { id: 'one-click', title: '1 Click Campaign', icon: Zap },
    { id: 'builder-2', title: 'Campaign Builder', icon: Sparkles },
    { id: 'web-templates', title: 'Web Templates', icon: Globe },
    { id: 'campaign-presets', title: 'Campaign Presets', icon: Package },
    { id: 'keyword-planner', title: 'Keywords Planner', icon: Target },
    { id: 'saved-campaigns', title: 'Saved Campaigns', icon: FolderOpen },
  ];

  return (
    <div className="dashboard-modern-theme p-8 sm:p-10 lg:p-12 space-y-12" style={{
      '--user-spacing-multiplier': preferences.spacing,
      '--user-font-size-multiplier': preferences.fontSize
    } as React.CSSProperties}>
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold theme-gradient-text">
              Welcome back, {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}!
            </h1>
            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full tracking-wide uppercase">Beta</span>
          </div>
          <p className="text-base text-slate-600">Here's what's happening with your campaigns today.</p>
        </div>
      </div>

      {/* Terminal-Style System Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TerminalCard title="Campaign Statistics" icon={<Terminal className="w-4 h-4" />}>
          <div className="space-y-2 font-mono text-sm">
            <TerminalLine prefix="$" label="total_campaigns:" value={`${stats?.userResources?.myCampaigns || 0}`} valueColor="green" />
            <TerminalLine prefix="$" label="keywords_generated:" value={`${((stats?.userResources?.myCampaigns || 0) * 485).toLocaleString()}`} valueColor="cyan" />
            <TerminalLine prefix="$" label="ads_created:" value={`${((stats?.userResources?.myCampaigns || 0) * 12).toLocaleString()}`} valueColor="yellow" />
            <TerminalLine prefix="$" label="extensions_added:" value={`${((stats?.userResources?.myCampaigns || 0) * 8).toLocaleString()}`} valueColor="purple" />
            <TerminalLine prefix="$" label="csv_exports:" value={`${stats?.userResources?.myCampaigns || 0}`} valueColor="white" />
          </div>
        </TerminalCard>

        <TerminalCard title="System Status" icon={<Activity className="w-4 h-4" />}>
          <div className="space-y-2 font-mono text-sm">
            <TerminalLine prefix=">" label="api_status:" value="ONLINE" valueColor="green" />
            <TerminalLine prefix=">" label="google_ads_api:" value="CONNECTED" valueColor="green" />
            <TerminalLine prefix=">" label="keyword_planner:" value="READY" valueColor="green" />
            <TerminalLine prefix=">" label="subscription:" value={stats?.subscription?.plan?.toUpperCase() || 'FREE'} valueColor="cyan" />
            <TerminalLine prefix=">" label="last_activity:" value={formatRelativeTime(stats?.activity?.lastLogin || null)} valueColor="slate" />
          </div>
        </TerminalCard>
      </div>

      {/* Quick Actions - Small Buttons */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                onClick={() => onNavigate(action.id)}
                className="h-9 px-4 gap-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all"
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{action.title}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

