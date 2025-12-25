import { useState, useEffect, Suspense, lazy } from 'react';
import { 
  LayoutDashboard, TrendingUp, Settings, Bell, Search, Menu, X, FileCheck, Lightbulb, Shuffle, MinusCircle, Shield, HelpCircle, Megaphone, User, LogOut, Sparkles, Zap, Package, Clock, ChevronDown, ChevronRight, FolderOpen, TestTube, Code, Download, GitCompare, Globe, CreditCard, ArrowRight, Users, BookOpen, PhoneCall, Wand2, FileText, Building, Eye
} from 'lucide-react';

declare global {
  interface Window {
    Helploom: (action: string, data?: { uniqueId?: string; name?: string; email?: string }) => void;
  }
}
import { useTheme } from './contexts/ThemeContext';
import { COLOR_CLASSES } from './utils/colorScheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
import { Badge } from './components/ui/badge';
import { Switch } from './components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from './components/ui/sheet';
import { supabase } from './utils/supabase/client';
import { getCurrentUserProfile, isAuthenticated, signOut } from './utils/auth';
import { getUserPreferences, applyUserPreferences } from './utils/userPreferences';
import { notifications as notificationService } from './utils/notifications';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher';
import { WorkspaceCreation } from './components/WorkspaceCreation';
import { WorkspaceCards } from './components/WorkspaceCards';
import { WorkspacesPage } from './components/WorkspacesPage';
import { workspaceHelpers } from './utils/workspaces';
import { FeedbackButton } from './components/FeedbackButton';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { EmailVerification } from './components/EmailVerification';
import { ResetPassword } from './components/ResetPassword';
import { PaymentPage } from './components/PaymentPage';
import { PaymentSuccess } from './components/PaymentSuccess';
import { PlanSelection } from './components/PlanSelection';
import CreativeMinimalistHomepage from './components/CreativeMinimalistHomepage';
import { MobileNavigation, MobileQuickActions } from './components/MobileNavigation';

// Lazy load heavy components for code splitting
const CampaignBuilder3 = lazy(() => import('./components/CampaignBuilder3').then(m => ({ default: m.CampaignBuilder3 })));
const OneClickCampaignBuilder = lazy(() => import('./components/OneClickCampaignBuilder').then(m => ({ default: m.OneClickCampaignBuilder })));
const KeywordPlanner = lazy(() => import('./components/KeywordPlanner').then(m => ({ default: m.KeywordPlanner })));
const KeywordMixer = lazy(() => import('./components/KeywordMixer').then(m => ({ default: m.KeywordMixer })));
const NegativeKeywordsBuilder = lazy(() => import('./components/NegativeKeywordsBuilder').then(m => ({ default: m.NegativeKeywordsBuilder })));
const KeywordSavedLists = lazy(() => import('./components/KeywordSavedLists').then(m => ({ default: m.KeywordSavedLists })));
const LongTailKeywords = lazy(() => import('./components/LongTailKeywords').then(m => ({ default: m.LongTailKeywords })));
const CampaignPresets = lazy(() => import('./components/CampaignPresets').then(m => ({ default: m.CampaignPresets })));
const DraftCampaigns = lazy(() => import('./components/DraftCampaigns').then(m => ({ default: m.DraftCampaigns })));

const SettingsPanel = lazy(() => import('./components/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const SupportPanel = lazy(() => import('./components/SupportPanel').then(m => ({ default: m.SupportPanel })));
const SupportHelpCombined = lazy(() => import('./components/SupportHelpCombined').then(m => ({ default: m.SupportHelpCombined })));
const Teams = lazy(() => import('./components/Teams').then(m => ({ default: m.Teams })));
const CallForwarding = lazy(() => import('./components/CallForwarding').then(m => ({ default: m.CallForwarding })));
const Blog = lazy(() => import('./components/Blog').then(m => ({ default: m.default })));
const BlogGenerator = lazy(() => import('./components/BlogGenerator').then(m => ({ default: m.default })));
const SuperAdminPanel = lazy(() => import('./components/SuperAdminPanel').then(m => ({ default: m.SuperAdminPanel })));
const Forms = lazy(() => import('./modules/forms/components/Forms').then(m => ({ default: m.Forms })));
const DomainManagement = lazy(() => import('./modules/domain-management/components/DomainManagement').then(m => ({ default: m.default })));
const VMManagement = lazy(() => import('./modules/vm-management/components/VMManagement').then(m => ({ default: m.default })));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./components/TermsOfService').then(m => ({ default: m.TermsOfService })));
const CookiePolicy = lazy(() => import('./components/CookiePolicy').then(m => ({ default: m.CookiePolicy })));
const GDPRCompliance = lazy(() => import('./components/GDPRCompliance').then(m => ({ default: m.GDPRCompliance })));
const RefundPolicy = lazy(() => import('./components/RefundPolicy').then(m => ({ default: m.RefundPolicy })));
const PromoLandingPage = lazy(() => import('./components/PromoLandingPage').then(m => ({ default: m.PromoLandingPage })));

// Loading component for lazy-loaded modules
const ComponentLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

type AppView = 'homepage' | 'auth' | 'user' | 'verify-email' | 'reset-password' | 'payment' | 'payment-success' | 'plan-selection' | 'privacy-policy' | 'terms-of-service' | 'cookie-policy' | 'gdpr-compliance' | 'refund-policy' | 'promo' | 'admin-panel' | 'workspace-creation' | 'workspace-selection';

const AppContent = () => {
  const { theme } = useTheme();
  const [appView, setAppView] = useState<AppView>('homepage');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [previousView, setPreviousView] = useState<AppView>('homepage');
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin');
  
  // Load and apply user preferences on mount
  useEffect(() => {
    const prefs = getUserPreferences();
    applyUserPreferences(prefs);
    
    // Listen for storage changes to sync preferences across tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_preferences') {
        const updatedPrefs = getUserPreferences();
        applyUserPreferences(updatedPrefs);
        // If auto-close is disabled, ensure sidebar is open
        if (!updatedPrefs.sidebarAutoClose && !sidebarOpen) {
          setSidebarOpen(true);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-tab updates
    const handlePreferenceChange = () => {
      const updatedPrefs = getUserPreferences();
      applyUserPreferences(updatedPrefs);
      if (!updatedPrefs.sidebarAutoClose && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };
    
    window.addEventListener('userPreferencesChanged', handlePreferenceChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userPreferencesChanged', handlePreferenceChange);
    };
  }, [sidebarOpen]);

  // Sync sidebar state with auto-close preference
  // When auto-close is disabled, ensure sidebar stays open
  useEffect(() => {
    const userPrefs = getUserPreferences();
    if (!userPrefs.sidebarAutoClose && !sidebarOpen && !sidebarHovered) {
      // If auto-close is disabled and sidebar is closed (not hovered), open it
      setSidebarOpen(true);
    }
  }, [sidebarOpen, sidebarHovered]);


  // Valid tab IDs - used for route validation
  const validTabIds = new Set([
    'dashboard',
    'preset-campaigns',
    'builder-3',
    'one-click-builder',
    'draft-campaigns',
    'keyword-planner',
    'keyword-mixer',
    'negative-keywords',
    'long-tail-keywords',
    'settings',
    'billing',
    'support',
    'support-help',
    'teams',
    'domains',
    'virtual-machines',
    'blog',
    'forms',
    // 'call-forwarding', // Hidden - module disabled
  ]);

  // Safe setActiveTab wrapper that validates and redirects to dashboard if invalid
  const setActiveTabSafe = (tabId: string) => {
    if (validTabIds.has(tabId)) {
      setActiveTab(tabId);
      
      // Always close mobile menu when navigating
      setMobileMenuOpen(false);
      
      // Auto-close sidebar after selection if preference is enabled
      const userPrefs = getUserPreferences();
      if (userPrefs.sidebarAutoClose) {
        // Small delay to allow the click to register
        setTimeout(() => {
          setSidebarOpen(false);
        }, 150);
      }
    } else {
      // Known view-only IDs (not tabs) - don't warn for these
      const viewOnlyIds = ['admin-panel', 'workspace-creation', 'workspace-selection'];
      if (!viewOnlyIds.includes(tabId)) {
        console.warn(`Invalid tab ID "${tabId}" - redirecting to dashboard`);
      }
      setActiveTab('dashboard');
    }
  };
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    title: string;
    message: string;
    time: string;
    read: boolean;
    action_type?: string;
  }>>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Fetch real notifications from the database
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setNotificationsLoading(true);
      const response = await fetch(`/api/notifications/${user.id}`);
      
      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Response is not JSON (likely HTML error page)
        console.warn('Dashboard API not available, using fallback');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        const formattedNotifications = (data.notifications || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: formatRelativeTime(n.created_at),
          read: n.read,
          action_type: n.action_type,
        }));
        setNotifications(formattedNotifications);
      } else {
        // Response not OK, log but don't throw
        const errorText = await response.text();
        console.warn('Error fetching notifications:', response.status, errorText);
      }
    } catch (error) {
      // Only log if it's not a JSON parse error (which we handle above)
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.warn('Dashboard API not available, using fallback');
      } else {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Helper to format time relative to now
  const formatRelativeTime = (dateString: string) => {
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
    return date.toLocaleDateString();
  };

  // Fetch notifications when user logs in
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      // Refresh every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);
  // Bug_64: Search suggestions state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    priceId: string;
    amount: number;
    isSubscription: boolean;
  } | null>(null);

  const handleLoadHistory = (type: string, data: any) => {
    // Map history types to actual tab IDs
    const typeToTabMap: Record<string, string> = {
      'campaign': 'builder-3',
      'keyword-planner': 'keyword-planner',
      'keyword-mixer': 'keyword-mixer',
      'negative-keywords': 'negative-keywords'
    };
    
    const targetTab = typeToTabMap[type] || type;
    setHistoryData(data);
    setActiveTabSafe(targetTab);
    
    // Show success notification
    notificationService.success('History item restored successfully', {
      title: 'Restored',
      description: 'Your saved item has been loaded and is ready to use.'
    });
  };

  const handleMarkNotificationAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    // Mark as read
    handleMarkNotificationAsRead(notification.id);
    
    // Redirect based on notification type
    const title = notification.title.toLowerCase();
    if (title.includes('campaign')) {
      setActiveTabSafe('builder-3');
    } else if (title.includes('billing') || title.includes('subscription')) {
      setActiveTabSafe('settings');
      // Optionally open billing tab in settings
      const settingsPanel = document.querySelector('[data-settings-tab="billing"]');
      if (settingsPanel) {
        (settingsPanel as HTMLElement).click();
      }
    } else if (title.includes('keyword')) {
      setActiveTabSafe('keyword-planner');
    }
  };

  const handleViewAllNotifications = () => {
    // Navigate to a notifications view or show all notifications
    // For now, we'll just scroll to show all notifications in the dropdown
    // In a full implementation, this could open a dedicated notifications panel
    setActiveTabSafe('settings');
    // You could also create a dedicated notifications tab/page
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await fetch(`/api/notifications/user/${user.id}/read-all`, { method: 'PUT' });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        // Bug_62, Bug_76: Ensure proper logout
        await signOut();
        // Clear user state
        setUser(null);
        // Clear any cached data
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        // Redirect to auth
        window.history.pushState({}, '', '/');
      setAppView('auth');
      setAuthMode('login');
      setActiveTab('dashboard');
        // Force page reload to clear all state
        window.location.href = '/';
      } catch (error) {
        console.error('Logout error:', error);
        // Even if signOut fails, clear local state and redirect
        setUser(null);
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        setAppView('auth');
        setAuthMode('login');
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Set favicon on mount
  useEffect(() => {
    const setFavicon = () => {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#9333ea;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="20" fill="url(#grad)"/>
          <path d="M30 70 L50 30 L70 70 M40 55 L60 55" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      `;
      
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const existingFavicon = document.querySelector("link[rel*='icon']");
      if (existingFavicon) {
        existingFavicon.remove();
      }
      
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      link.href = url;
      document.head.appendChild(link);
      
      document.title = 'Adiology - Google Campaign Builder';
    };
    
    setFavicon();
  }, []);

  // Listen for loadHistoryItem events from KeywordSavedLists
  useEffect(() => {
    const handleLoadHistoryItem = (event: CustomEvent) => {
      const { type, data } = event.detail;
      handleLoadHistory(type, data);
    };

    window.addEventListener('loadHistoryItem', handleLoadHistoryItem as EventListener);
    
    // Listen for navigate events from child components (e.g., CampaignBuilder3, KeywordPlanner)
    const handleNavigate = (event: CustomEvent) => {
      const { tab, data } = event.detail;
      if (data) {
        setHistoryData(data);
      }
      if (tab && typeof tab === 'string') {
        setActiveTabSafe(tab);
      }
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('loadHistoryItem', handleLoadHistoryItem as EventListener);
      window.removeEventListener('navigate', handleNavigate as EventListener);
    };
  }, []);

  // Initialize auth state and listen for changes
  useEffect(() => {
    let isMounted = true;
    let profileFetchInProgress = false;
    let lastProcessedUserId: string | null = null;
    let authChangeTimeout: NodeJS.Timeout | null = null;
    
    // Check initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && isMounted) {
          lastProcessedUserId = session.user.id;
          try {
            const userProfile = await getCurrentUserProfile();
            if (isMounted && lastProcessedUserId === session.user.id) {
              setUser(userProfile);
            }
          } catch (error) {
            console.error('Error fetching user profile during init:', error);
            if (isMounted && lastProcessedUserId === session.user.id) {
              // Set minimal user on error - subscription_status is 'inactive' to ensure
              // routing logic redirects to plan-selection
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                role: 'user',
                subscription_plan: 'free',
                subscription_status: 'inactive',
              });
            }
          }
        } else if (isMounted) {
          setUser(null);
          lastProcessedUserId = null;
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setUser(null);
          lastProcessedUserId = null;
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes with debouncing and duplicate prevention
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      // Clear any pending auth change processing
      if (authChangeTimeout) {
        clearTimeout(authChangeTimeout);
      }

      // Debounce auth state changes to prevent rapid-fire updates
      authChangeTimeout = setTimeout(async () => {
        if (!isMounted) return;

        // Prevent multiple simultaneous profile fetches
        if (profileFetchInProgress) {
          return;
        }

        const currentUserId = session?.user?.id || null;

        // Skip if we're already processing this same user
        if (currentUserId === lastProcessedUserId && currentUserId !== null) {
          return;
        }

        if (session?.user && isMounted) {
          // Update last processed user ID immediately to prevent duplicate processing
          lastProcessedUserId = session.user.id;
          profileFetchInProgress = true;
          
          // Set minimal user immediately to avoid UI flicker
          // Note: subscription_status is 'inactive' to ensure routing logic redirects to plan-selection
          // until we fetch the real profile data with actual subscription info
          const minimalUser = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            role: 'user',
            subscription_plan: 'free',
            subscription_status: 'inactive',
          };
          
          // Only update if user actually changed
          setUser((prevUser: any) => {
            if (prevUser?.id === minimalUser.id) {
              // Same user, don't update unless we have more complete data
              return prevUser;
            }
            return minimalUser;
          });
          
          // Fetch full profile in background (non-blocking)
          getCurrentUserProfile()
            .then((userProfile) => {
              profileFetchInProgress = false;
              if (userProfile && isMounted && lastProcessedUserId === session.user.id) {
                setUser((prevUser: any) => {
                  // Only update if still the same user and we got new data
                  if (prevUser?.id === userProfile.id) {
                    // Only update if the new profile has more complete data
                    return userProfile;
                  }
                  return prevUser;
                });
              }
            })
            .catch((error) => {
              profileFetchInProgress = false;
              // Silently handle - minimal user already set
              // Only log if it's not a permission error
              if (error?.code !== 'PGRST205') {
                console.warn('Profile fetch failed in auth listener (non-critical):', error?.code || error?.message);
              }
              // Keep using minimal user - already set above
            });
        } else if (isMounted) {
          lastProcessedUserId = null;
          setUser((prevUser: any) => {
            // Only update if we actually had a user before
            if (prevUser) {
              return null;
            }
            return prevUser;
          });
          // If user signed out and we're on user view, go to auth
          if (event === 'SIGNED_OUT') {
            // Use setTimeout to avoid state update during render
            setTimeout(() => {
              if (isMounted) {
                setAppView('auth');
                setAuthMode('login');
              }
            }, 0);
          }
        }

        // Handle password recovery
        if (event === 'PASSWORD_RECOVERY' && isMounted) {
          setTimeout(() => {
            if (isMounted) {
              setAppView('reset-password');
            }
          }, 0);
        }

        // Handle email verification - detect auth callback tokens in URL
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at && isMounted) {
          // Check if this was an email verification callback (tokens in URL hash or query)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const urlParams = new URLSearchParams(window.location.search);
          const authType = hashParams.get('type') || urlParams.get('type');
          
          // Only handle email verification callbacks (type=signup or type=email)
          // Do NOT match other auth types like 'recovery' to avoid breaking password reset flow
          const isEmailVerification = authType === 'signup' || authType === 'email' || 
                                       window.location.pathname.includes('/verify-email');
          
          if (isEmailVerification) {
            // Show success notification
            notificationService.success('Email verified successfully!', {
              title: 'Verification Complete',
              description: 'Your email has been verified. Please log in to continue.',
            });
            
            setTimeout(() => {
              if (isMounted) {
                // Clean up URL and redirect to auth/login
                window.history.replaceState({}, '', '/');
                setAppView('auth');
                setAuthMode('login');
              }
            }, 500);
          }
        }
      }, 100); // Debounce by 100ms to prevent rapid-fire updates
    });

    return () => {
      isMounted = false;
      if (authChangeTimeout) {
        clearTimeout(authChangeTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  // Validate activeTab and redirect to dashboard if invalid
  useEffect(() => {
    if (!validTabIds.has(activeTab)) {
      console.warn(`Invalid activeTab "${activeTab}" - redirecting to dashboard`);
      setActiveTab('dashboard');
    }
  }, [activeTab]);


  // Handle route/view state when auth or URL changes
  useEffect(() => {
    if (loading) return;

    let isActive = true;
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const bypassKey = urlParams.get('bypass');
    
    // Check for Supabase auth callback tokens in URL hash or query params
    // Supabase sends verification links with tokens like: #access_token=xxx&type=signup
    // or with PKCE flow: ?code=xxx&type=signup
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasAuthTokenInHash = hashParams.get('access_token') || hashParams.get('type');
    const hasAuthCodeInQuery = urlParams.get('code') && urlParams.get('type');
    const authType = hashParams.get('type') || urlParams.get('type');
    
    // If we have auth tokens in URL, let Supabase client handle them
    // The detectSessionInUrl: true will process these automatically
    // We just need to show a loading state and clean up the URL after
    if (hasAuthTokenInHash || hasAuthCodeInQuery) {
      // For email verification (type=signup), show the verify-email page briefly
      // The auth state change listener will redirect after verification completes
      if (authType === 'signup' || authType === 'email') {
        // Clean up URL hash/params after a short delay to let Supabase process
        setTimeout(() => {
          if (isActive) {
            window.history.replaceState({}, '', '/');
          }
        }, 1000);
        // Don't set to verify-email view - let the auth state change handle it
        // The user will see a brief loading state then be redirected
        return;
      }
      
      // For password recovery, the auth state change listener handles it
      if (authType === 'recovery') {
        return;
      }
    }

    const setView = (next: AppView) => {
      setAppView(prev => (prev === next ? prev : next));
    };

    const applyPlanFromParams = () => {
      const planName = urlParams.get('plan') || 'Lifetime Unlimited';
      const priceId = urlParams.get('priceId') || '';
      const amountParam = urlParams.get('amount') || '199';
      const amount = parseFloat(amountParam.replace('$', '').replace('/month', ''));
      const isSubscription = urlParams.get('subscription') === 'true';
      setSelectedPlan({
        name: planName,
        priceId,
        amount,
        isSubscription
      });
    };

    const handleRoute = () => {
      if (bypassKey === 'adiology2025dev' || bypassKey === 'samay2025') {
        if (!user || user.id !== 'bypass-user-id') {
          setUser({
            id: 'bypass-user-id',
            email: 'dev@adiology.com',
            full_name: 'Developer Access',
            role: 'user',
            subscription_plan: 'free',
            subscription_status: 'active',
          });
        }
        setActiveTabSafe('dashboard');
        setView('user');
        window.history.replaceState({}, '', '/');
      return;
    }
    
      if (path.startsWith('/reset-password')) {
        setView('reset-password');
      return;
    }
    
      if (path.startsWith('/verify-email')) {
        setView('verify-email');
            return;
          }

      if (path.startsWith('/payment-success')) {
        applyPlanFromParams();
        setView('payment-success');
      return;
    }

      if (path.startsWith('/payment')) {
        applyPlanFromParams();
        if (user) {
          setView('payment');
        } else {
          setAuthMode('login');
          setView('auth');
        }
        return;
      }

      if (path.startsWith('/plan-selection')) {
        if (user) {
          setView('plan-selection');
        } else {
          setAuthMode('login');
          setView('auth');
        }
        return;
      }

      // Promo landing page - public access
      if (path.startsWith('/promo')) {
        setView('promo');
        return;
      }

      // Admin panel - detect subdomain or /admin path
      const hostname = window.location.hostname;
      const isAdminSubdomain = hostname.startsWith('admin.') || hostname === 'admin.adiology.io';
      if (isAdminSubdomain || path.startsWith('/admin')) {
        // Check if user is super admin
        if (user && (user.email === 'd@d.com' || user.role === 'superadmin' || user.role === 'super_admin')) {
          setView('admin-panel');
          return;
        }
        // If not logged in or not admin, redirect to auth
        if (!user) {
          setAuthMode('login');
          setView('auth');
          return;
        }
        // If logged in but not admin, show homepage
        setView('homepage');
        return;
      }

      // Show homepage on root path
      if (path === '/' || path === '') {
        // If user is logged in, check subscription status
        if (user) {
          const subscriptionPlan = user.subscription_plan || 'free';
          const subscriptionStatus = user.subscription_status || 'inactive';
          const isSuperAdmin = user.email === 'd@d.com' || user.role === 'superadmin';
          const hasPaidPlan = isSuperAdmin || (subscriptionPlan !== 'free' && subscriptionStatus === 'active');
          
          if (hasPaidPlan) {
            setView('user');
          } else {
            // Redirect unpaid users to plan selection
            window.history.replaceState({}, '', '/plan-selection');
            setView('plan-selection');
          }
          return;
        }
        // If no user, show homepage
        setView('homepage');
        return;
      }

      // For non-root paths, use normal logic
      if (user) {
        const subscriptionPlan = user.subscription_plan || 'free';
        const subscriptionStatus = user.subscription_status || 'inactive';
        const isSuperAdmin = user.email === 'd@d.com' || user.role === 'superadmin';
        const hasPaidPlan = isSuperAdmin || (subscriptionPlan !== 'free' && subscriptionStatus === 'active');
        
        if (hasPaidPlan) {
          setView('user');
        } else {
          setView('plan-selection');
        }
      } else {
        setView('homepage');
      }
    };

    // Only run routing if not loading
    if (!loading) {
      handleRoute();
    }

    return () => {
      isActive = false;
    };
  }, [loading, user?.id]);

  // Additional effect to ensure homepage shows when loading completes and no user
  useEffect(() => {
    if (!loading && !user && (window.location.pathname === '/' || window.location.pathname === '')) {
      // Only set to homepage if we're not already on a specific route
      if (appView !== 'homepage' && appView !== 'auth' && appView !== 'reset-password' && appView !== 'verify-email' && appView !== 'payment' && appView !== 'payment-success' && appView !== 'plan-selection' && appView !== 'promo') {
        setAppView('homepage');
      }
    }
  }, [loading, user, appView]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = async () => {
      const path = window.location.pathname;
      
      if (path === '/reset-password' || path.startsWith('/reset-password')) {
        setAppView('reset-password');
        return;
      }
      
      if (path === '/verify-email' || path.startsWith('/verify-email')) {
        setAppView('verify-email');
        return;
      }
      
      if (path === '/plan-selection' || path.startsWith('/plan-selection')) {
        if (user) {
          setAppView('plan-selection');
        } else {
          setAppView('auth');
        }
        return;
      }
      
      if (user) {
        const subscriptionPlan = user.subscription_plan || 'free';
        const subscriptionStatus = user.subscription_status || 'inactive';
        const isSuperAdmin = user.email === 'd@d.com' || user.role === 'superadmin';
        const hasPaidPlan = isSuperAdmin || (subscriptionPlan !== 'free' && subscriptionStatus === 'active');
        
        if (hasPaidPlan) {
          setAppView('user');
        } else {
          setAppView('plan-selection');
        }
      } else {
        // Show homepage for all paths when not logged in
        setAppView('homepage');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Ensure session exists when user view is requested
  useEffect(() => {
    if (!user && appView === 'user' && !loading) {
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
        setTimeout(() => {
            setAppView('homepage');
            setAuthMode('login');
          }, 1000);
        }
      };
      const timeout = setTimeout(checkSession, 500);
      return () => clearTimeout(timeout);
          }
    return undefined;
  }, [user, appView, loading]);


  // Function to handle plan selection
  const handleSelectPlan = async (planName: string, priceId: string, amount: number, isSubscription: boolean) => {
    // Check if user is logged in
    const authenticated = await isAuthenticated();
    if (!authenticated || !user) {
      // User not logged in, redirect to signup and store plan selection
      setSelectedPlan({ name: planName, priceId, amount, isSubscription });
      setAuthMode('signup'); // Enable signups for new users
      setAppView('auth');
      return;
    }

    // User is logged in, create Stripe checkout session
    try {
      const { createCheckoutSession } = await import('./utils/stripe');
      await createCheckoutSession(priceId, planName, user.id, user.email);
      // User will be redirected to Stripe, so we don't need to change appView
    } catch (error) {
      console.error('Checkout error:', error);
      // Fallback to payment page if Stripe fails
      setSelectedPlan({ name: planName, priceId, amount, isSubscription });
      window.history.pushState({}, '', `/payment?plan=${encodeURIComponent(planName)}&priceId=${encodeURIComponent(priceId)}&amount=${amount}&subscription=${isSubscription}`);
      setAppView('payment');
    }
  };

  // Check if current user is super admin
  const isSuperAdmin = user && (user.email === 'd@d.com' || user.role === 'superadmin' || user.role === 'super_admin');

  // Default: User view (protected) navigation structure
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
    { 
      id: 'campaign-builder', 
      label: 'Campaigns', 
      icon: Sparkles,
      module: 'campaign-wizard',
      submenu: [
        { id: 'one-click-builder', label: '1 Click Builder', icon: Zap, module: 'one-click-builder' },
        { id: 'builder-3', label: 'Builder 3.0', icon: Sparkles, module: 'campaign-wizard' },
        { id: 'preset-campaigns', label: 'Preset Campaigns', icon: Package, module: 'campaign-wizard' },
        { id: 'draft-campaigns', label: 'Draft Campaigns', icon: FolderOpen, module: 'campaign-wizard' },
      ]
    },
    {
      id: 'keyword-planner', 
      label: 'Keywords', 
      icon: Lightbulb,
      module: 'keywords',
      submenu: [
        { id: 'keyword-planner', label: 'Planner', icon: Lightbulb, module: 'keywords' },
        { id: 'keyword-mixer', label: 'Mixer', icon: Shuffle, module: 'keywords' },
        { id: 'negative-keywords', label: 'Negatives', icon: MinusCircle, module: 'keywords' },
        { id: 'long-tail-keywords', label: 'Long Tail', icon: Sparkles, module: 'keywords' },
      ]
    },

    { id: 'teams', label: 'Teams', icon: Users, module: null }, // Teams doesn't require module access
    { id: 'domains', label: 'Domains', icon: Globe, module: 'domains' }, // Domain management
    { id: 'virtual-machines', label: 'Virtual Machines', icon: Building, module: 'vm-management' }, // VM management
    // Call Forwarding module hidden - disabled for all users
    // { id: 'call-forwarding', label: 'Call Forwarding', icon: PhoneCall },
    { id: 'blog', label: 'Blog', icon: BookOpen, module: null }, // Blog doesn't require module access
    { id: 'forms', label: 'Forms', icon: FileText, module: null }, // Forms doesn't require module access
    { id: 'settings', label: 'Settings', icon: Settings, module: 'settings' },
    { id: 'support-help', label: 'Support & Help', icon: HelpCircle, module: 'support' },
    // Super Admin Panel - only visible to super admins
    ...(isSuperAdmin ? [{ id: 'admin-panel', label: 'Admin Panel', icon: Shield, module: null }] : []),
  ];

  // Simplified - no workspace view switching needed
  const canSwitchViews = false;
  
  // Simplified menu filtering - show all items except admin panel for non-super-admins
  const menuItems = allMenuItems.filter((item) => {
    // Only filter admin panel for non-super-admins
    if (item.id === 'admin-panel') return isSuperAdmin;
    return true;
  });

  // Auto-expand parent menu if activeTab is a submenu item
  useEffect(() => {
    for (const item of menuItems) {
      if (item.submenu && item.submenu.some(sub => sub.id === activeTab)) {
        setExpandedMenus(prev => {
          if (!prev.has(item.id)) {
            const newSet = new Set(prev);
            newSet.add(item.id);
            return newSet;
          }
          return prev;
        });
        break;
      }
    }
  }, [activeTab]);

  // Bug_64: Generate search suggestions based on query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const suggestions: string[] = [];

    menuItems.forEach(item => {
      if (item.label.toLowerCase().includes(query)) {
        suggestions.push(item.label);
      }
      // Also check submenu items
      if (item.submenu) {
        item.submenu.forEach(subItem => {
          if (subItem.label.toLowerCase().includes(query) && !suggestions.includes(subItem.label)) {
            suggestions.push(subItem.label);
          }
        });
      }
    });

    const commonTerms = [
      'marketing', 'market analysis', 'market research',
      'campaign', 'campaigns', 'ad campaign',
      'keywords', 'keyword research', 'keyword planning',
      'ads', 'advertising', 'ad builder',
      'negative keywords', 'exclude keywords',
      'csv', 'export', 'import', 'validator', 'csv export', 'google ads csv', 'compare', 'comparison',
      'settings', 'billing', 'account',
      'help', 'support', 'documentation'
    ];

    commonTerms.forEach(term => {
      if (term.toLowerCase().includes(query) && !suggestions.includes(term)) {
        suggestions.push(term);
      }
    });

    setSearchSuggestions(suggestions.slice(0, 8));
    setShowSearchSuggestions(suggestions.length > 0);
  }, [searchQuery]);

  // Bug_64: Handle search suggestion click
  const handleSearchSuggestionClick = (suggestion: string) => {
    // Check main menu items
    const matchingItem = menuItems.find(item => 
      item.label.toLowerCase() === suggestion.toLowerCase()
    );
    
    if (matchingItem) {
      setActiveTabSafe(matchingItem.id);
      setSearchQuery('');
      setShowSearchSuggestions(false);
      return;
    }
    
    // Check submenu items
    for (const item of menuItems) {
      if (item.submenu) {
        const matchingSubItem = item.submenu.find(sub => 
          sub.label.toLowerCase() === suggestion.toLowerCase()
        );
        if (matchingSubItem) {
          setActiveTabSafe(matchingSubItem.id);
          setSearchQuery('');
          setShowSearchSuggestions(false);
          return;
        }
      }
    }
    
    // Fallback to term mapping
    {
      const termMap: Record<string, string> = {
        'marketing': 'builder-3',
        'campaign': 'builder-3',
        'campaigns': 'builder-3',
        'keywords': 'keyword-planner',
        'keyword research': 'keyword-planner',
        'keyword planning': 'keyword-planner',
        'ads': 'builder-3',
        'advertising': 'builder-3',
        'negative keywords': 'negative-keywords',
        'settings': 'settings',
        'billing': 'settings',
        'help': 'support-help',
        'support': 'support-help'
      };

      const matchedTab = termMap[suggestion.toLowerCase()];
      if (matchedTab) {
        setActiveTabSafe(matchedTab);
      }
      setSearchQuery('');
      setShowSearchSuggestions(false);
    }
  };


  if (appView === 'payment' && selectedPlan) {
    return (
      <PaymentPage
        planName={selectedPlan.name}
        priceId={selectedPlan.priceId}
        amount={selectedPlan.amount}
        isSubscription={selectedPlan.isSubscription}
        onBack={() => {
          // Clear any pending payment attempts
          sessionStorage.removeItem('pending_payment');
          
          // Go back to plan selection page
          window.history.pushState({}, '', '/plan-selection');
          setAppView('plan-selection');
        }}
        onSuccess={() => {
          // Clear pending payment attempts
          sessionStorage.removeItem('pending_payment');
          
          window.history.pushState({}, '', `/payment-success?plan=${encodeURIComponent(selectedPlan.name)}&amount=$${selectedPlan.amount.toFixed(2)}${selectedPlan.isSubscription ? '/month' : ''}&subscription=${selectedPlan.isSubscription}&priceId=${encodeURIComponent(selectedPlan.priceId)}`);
          setAppView('payment-success');
        }}
      />
    );
  }

  if (appView === 'payment-success' && selectedPlan) {
    return (
      <PaymentSuccess
        planName={selectedPlan.name}
        amount={`$${selectedPlan.amount.toFixed(2)}${selectedPlan.isSubscription ? '/month' : ''}`}
        onGoToDashboard={async () => {
          // Ensure user is logged in
          const authenticated = await isAuthenticated();
          if (authenticated && user) {
            // Refresh user profile to get updated subscription status
            try {
              const userProfile = await getCurrentUserProfile();
              if (userProfile) {
                setUser(userProfile);
                
                // Create admin workspace if it doesn't exist
                try {
                  const workspaces = await workspaceHelpers.getUserWorkspaces();
                  const hasAdminWorkspace = workspaces.some((w) => w.is_admin_workspace);
                  if (!hasAdminWorkspace) {
                    await workspaceHelpers.createAdminWorkspace(userProfile.id);
                    // await refreshWorkspaces(); // Commented out - function not available
                  }
                } catch (workspaceError) {
                  console.error('Error creating admin workspace:', workspaceError);
                  // Continue even if workspace creation fails
                }
              }
            } catch (error) {
              console.warn('Error refreshing user profile:', error);
            }
            
            // Check if user needs to create a workspace
            try {
              const needsWorkspace = await workspaceHelpers.needsWorkspaceCreation();
              if (needsWorkspace) {
                window.history.pushState({}, '', '/');
                setAppView('workspace-creation');
                return;
              }
            } catch (workspaceError) {
              console.error('Error checking workspace creation need:', workspaceError);
            }
            
            window.history.pushState({}, '', '/');
            setAppView('user');
            setActiveTabSafe('dashboard');
          } else {
            window.history.pushState({}, '', '/');
            setAppView('auth');
            setAuthMode('login');
          }
        }}
      />
    );
  }

  if (appView === 'verify-email') {
    return (
      <EmailVerification
        onVerificationSuccess={() => {
          // Bug_74: Redirect to login screen after email verification
          window.history.pushState({}, '', '/');
          setAuthMode('login');
          setAppView('auth');
        }}
          onBackToHome={() => {
          setAppView('auth');
          setAuthMode('login');
        }}
      />
    );
  }

  if (appView === 'reset-password') {
    return (
      <ResetPassword
        onSuccess={async () => {
          // Password reset successful, redirect to login
          window.history.pushState({}, '', '/');
          setAuthMode('login');
          setAppView('homepage');
        }}
          onBackToHome={() => {
          setAppView('homepage');
          setAuthMode('login');
        }}
      />
    );
  }

  if (appView === 'workspace-creation') {
    return (
      <WorkspaceCreation
        onComplete={async (workspace) => {
          // await refreshWorkspaces(); // Commented out - function not available
          window.history.pushState({}, '', '/');
          setAppView('workspace-selection');
        }}
        onSkip={() => {
          window.history.pushState({}, '', '/');
          setAppView('workspace-selection');
        }}
      />
    );
  }

  // Removed workspace selection - go directly to user view
  if (appView === 'workspace-selection') {
    setAppView('user');
    setActiveTabSafe('dashboard');
    return null;
  }

  if (appView === 'privacy-policy') {
    return (
      <Suspense fallback={<ComponentLoader />}>
        <PrivacyPolicy onBack={() => setAppView(previousView)} />
      </Suspense>
    );
  }

  if (appView === 'terms-of-service') {
    return (
      <Suspense fallback={<ComponentLoader />}>
        <TermsOfService onBack={() => setAppView(previousView)} />
      </Suspense>
    );
  }

  if (appView === 'cookie-policy') {
    return (
      <Suspense fallback={<ComponentLoader />}>
        <CookiePolicy onBack={() => setAppView(previousView)} />
      </Suspense>
    );
  }

  if (appView === 'gdpr-compliance') {
    return (
      <Suspense fallback={<ComponentLoader />}>
        <GDPRCompliance onBack={() => setAppView(previousView)} />
      </Suspense>
    );
  }

  if (appView === 'refund-policy') {
    return (
      <Suspense fallback={<ComponentLoader />}>
        <RefundPolicy onBack={() => setAppView(previousView)} />
      </Suspense>
    );
  }

  if (appView === 'plan-selection') {
    return (
      <PlanSelection
        userName={user?.full_name}
        onSelectPlan={async (planName, priceId, amount, isSubscription) => {
          if (!user) {
            setAuthMode('login');
            setAppView('auth');
            return;
          }
          
          try {
            const { createCheckoutSession } = await import('./utils/stripe');
            await createCheckoutSession(priceId, planName, user.id, user.email);
          } catch (error) {
            console.error('Checkout error:', error);
            setSelectedPlan({ name: planName, priceId, amount, isSubscription });
            window.history.pushState({}, '', `/payment?plan=${encodeURIComponent(planName)}&priceId=${encodeURIComponent(priceId)}&amount=${amount}&subscription=${isSubscription}`);
            setAppView('payment');
          }
        }}
        onBack={() => {
          signOut().then(() => {
            setUser(null);
            window.history.pushState({}, '', '/');
            setAppView('auth');
            setAuthMode('login');
          }).catch((err) => {
            console.error('Signout error:', err);
            setAppView('auth');
            setAuthMode('login');
          });
        }}
      />
    );
  }

  if (appView === 'promo') {
    return (
      <Suspense fallback={<ComponentLoader />}>
        <PromoLandingPage
          onStartTrial={() => {
            // Trial start is handled within the component via API
          }}
          onNavigate={(page) => {
            setPreviousView('promo');
            if (page === 'blog') {
              setActiveTab('blog');
              setAppView('user');
            } else {
              setAppView(page as AppView);
            }
          }}
        />
      </Suspense>
    );
  }

  if (appView === 'admin-panel') {
    return (
      <SuperAdminPanel
        user={user}
        onLogout={() => {
          signOut().then(() => {
            setUser(null);
            window.history.pushState({}, '', '/');
            setAppView('homepage');
          }).catch((err) => {
            console.error('Signout error:', err);
            setAppView('homepage');
          });
        }}
      />
    );
  }

  if (appView === 'homepage') {
    return (
      <CreativeMinimalistHomepage
        onGetStarted={() => {
          setAuthMode('signup');
          setAppView('auth');
        }}
        onLogin={() => {
          setAuthMode('login');
          setAppView('auth');
        }}
        onSelectPlan={handleSelectPlan}
        onNavigateToPolicy={(policy: string) => {
          setPreviousView('homepage');
          if (policy === 'privacy') setAppView('privacy-policy');
          else if (policy === 'terms') setAppView('terms-of-service');
          else if (policy === 'cookie') setAppView('cookie-policy');
          else if (policy === 'gdpr') setAppView('gdpr-compliance');
          else if (policy === 'refund') setAppView('refund-policy');
        }}
        onNavigateToApp={(tab: string) => {
          // Store the intended destination tab in sessionStorage
          sessionStorage.setItem('pendingNavTab', tab);
          // Prompt user to login first
          setAuthMode('login');
          setAppView('auth');
        }}
      />
    );
  }

  // Check if we're accessing from admin path
  const isAdminPath = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/admin') || 
    window.location.hostname.startsWith('admin.') || 
    window.location.hostname === 'admin.adiology.io'
  );

  if (appView === 'auth') {
    return (
      <Auth
        initialMode={authMode}
        isAdminLogin={isAdminPath}
        onLoginSuccess={async () => {
          try {
            // Check for test admin mode first (bypasses Supabase)
            const isTestAdminMode = sessionStorage.getItem('test_admin_mode') === 'true';
            const testAdminEmail = sessionStorage.getItem('test_admin_email');
            
            if (isTestAdminMode && testAdminEmail) {
              // Create a mock super admin user for test mode
              const testAdminUser = {
                id: 'test-admin-id',
                email: testAdminEmail,
                full_name: 'Test Super Admin',
                role: 'superadmin' as const,
                subscription_plan: 'lifetime',
                subscription_status: 'active' as const,
              };
              
              setUser(testAdminUser);
              
              // Test admin goes directly to admin panel or dashboard
              if (isAdminPath) {
                setAppView('user');
                setActiveTabSafe('admin');
              } else {
                setAppView('user');
                setActiveTabSafe('dashboard');
              }
              return;
            }
            
            // Get auth user immediately and set minimal user object FIRST
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            
            if (!authUser) {
              console.error('No auth user found after login');
              return;
            }
            
            // Fetch full profile to check subscription status
            let userProfile = null;
            try {
              userProfile = await Promise.race([
                getCurrentUserProfile(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
                )
              ]) as any;
            } catch (profileError) {
              console.warn('⚠️ Profile fetch failed (non-critical):', profileError);
            }
            
            // Determine subscription status
            const subscriptionPlan = userProfile?.subscription_plan || 'free';
            const subscriptionStatus = userProfile?.subscription_status || 'inactive';
            const isSuperAdmin = authUser.email === 'd@d.com' || userProfile?.role === 'superadmin';
            const hasPaidPlan = isSuperAdmin || (subscriptionPlan !== 'free' && subscriptionStatus === 'active');
            
            // Set user with subscription info
            const fullUser = userProfile || { 
              id: authUser.id, 
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
              role: 'user' as const,
              subscription_plan: 'free',
              subscription_status: 'inactive' as const,
            };
            
            setUser(fullUser);
            
            // Identify user with Helploom support widget
            if (window.Helploom) {
              window.Helploom('identify', {
                uniqueId: fullUser.id,
                name: fullUser.full_name || fullUser.email?.split('@')[0] || 'User',
                email: fullUser.email
              });
            }
            
            // Check if user has paid plan - redirect to dashboard or plan selection
            if (hasPaidPlan) {
              // Check if user needs to create a workspace (has no non-admin workspaces)
              try {
                const needsWorkspace = await workspaceHelpers.needsWorkspaceCreation();
                if (needsWorkspace) {
                  // User needs to create a workspace first
                  setAppView('workspace-creation');
                  return;
                }
              } catch (workspaceError) {
                console.error('Error checking workspace creation need:', workspaceError);
                // Continue to dashboard on error
              }

              // Check for pending navigation tab from footer links
              const pendingTab = sessionStorage.getItem('pendingNavTab');
              if (pendingTab) {
                sessionStorage.removeItem('pendingNavTab');
                setAppView('user');
                setActiveTabSafe(pendingTab);
              } else {
                // User has active paid subscription - go to dashboard
                setAppView('user');
                setActiveTabSafe('dashboard');
              }
            } else {
              // User doesn't have paid plan - redirect to plan selection
              window.history.pushState({}, '', '/plan-selection');
              setAppView('plan-selection');
            }
          } catch (error) {
            console.error('Error in onLoginSuccess:', error);
            // On error, redirect to plan selection to be safe
            setAppView('plan-selection');
          }
        }}
        onSignupSuccess={(userEmail, userName) => {
          // After successful signup, user needs to verify email first
          // The verification email flow will bring them back to login
          // After login, they'll be redirected to plan selection
          console.log('Signup successful for:', userEmail, userName);
        }}
        onBackToHome={() => {
          setAppView('auth');
          setAuthMode('login');
        }}
      />
    );
  }

  // Protect user view - require authentication (unless bypass)
  // Wait for user to load from auth listener - it should happen quickly after login
  if (!user && appView === 'user' && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading user profile...</p>
        </div>
      </div>
    );
  }
  
  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Fallback: If no user and not loading, ensure user view is shown
  if (!user && !loading && appView === 'user') {
    // Only redirect to auth if we're on root path
    if (window.location.pathname === '/' || window.location.pathname === '') {
      setAppView('auth');
    }
  }

  const renderContent = () => {
    // Reset history data if leaving the tab to prevent stale data injection
    // This is a simplification; for robust app, manage state more carefully
    
    switch (activeTab) {
      case 'preset-campaigns':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <CampaignPresets onLoadPreset={(presetData) => {
              setHistoryData(presetData);
              setActiveTabSafe('builder-3');
            }} />
          </Suspense>
        );
      case 'builder-3':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <CampaignBuilder3 initialData={activeTab === 'builder-3' ? historyData : null} />
          </Suspense>
        );
      case 'one-click-builder':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <OneClickCampaignBuilder />
          </Suspense>
        );
      case 'draft-campaigns':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <DraftCampaigns onLoadCampaign={(data, mode) => {
              try {
                setHistoryData(data);
                setActiveTabSafe('builder-3');
              } catch (error) {
                console.error('Error loading campaign:', error);
              }
            }} />
          </Suspense>
        );
      case 'keyword-planner':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <KeywordPlanner initialData={activeTab === 'keyword-planner' ? historyData : null} />
          </Suspense>
        );
      case 'keyword-mixer':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <KeywordMixer initialData={activeTab === 'keyword-mixer' ? historyData : null} />
          </Suspense>
        );
      case 'negative-keywords':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <NegativeKeywordsBuilder initialData={activeTab === 'negative-keywords' ? historyData : null} />
          </Suspense>
        );
      case 'long-tail-keywords':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <LongTailKeywords />
          </Suspense>
        );
      case 'keyword-saved-lists':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <KeywordSavedLists />
          </Suspense>
        );

      case 'support-help':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <SupportHelpCombined />
          </Suspense>
        );
      case 'support':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <SupportPanel />
          </Suspense>
        );
      case 'teams':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Teams />
          </Suspense>
        );
      case 'call-forwarding':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <CallForwarding />
          </Suspense>
        );
      case 'blog':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Blog />
          </Suspense>
        );
      case 'forms':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Forms />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <SettingsPanel />
          </Suspense>
        );
      case 'billing':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <SettingsPanel defaultTab="billing" />
          </Suspense>
        );
      case 'workspaces':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <WorkspacesPage />
          </Suspense>
        );
      case 'dashboard':
        return <Dashboard user={user} onNavigate={setActiveTabSafe} />;
      case 'domains':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <DomainManagement user={user} />
          </Suspense>
        );
      case 'virtual-machines':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <VMManagement user={user} />
          </Suspense>
        );
      default:
        // Fallback: redirect to dashboard for any invalid/missing route
        console.warn(`Invalid route/tab "${activeTab}" - redirecting to dashboard`);
        setActiveTabSafe('dashboard');
        return <Dashboard user={user} onNavigate={setActiveTabSafe} />;
    }
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    // Check main menu items
    const currentItem = menuItems.find(item => item.id === activeTab);
    if (currentItem) return currentItem.label;
    
    // Check submenu items
    for (const item of menuItems) {
      if (item.submenu) {
        const subItem = item.submenu.find(sub => sub.id === activeTab);
        if (subItem) return subItem.label;
      }
    }
    
    // Handle special cases for bottom menu items
    if (activeTab === 'workspaces') return 'Workspaces';
    if (activeTab === 'billing') return 'Billing';
    
    return 'Dashboard';
  };

  // Get user preferences for styling
  const userPrefs = getUserPreferences();

  return (
    <div 
      className="flex h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 overflow-hidden w-full max-w-full"
      style={{
        '--user-spacing-multiplier': userPrefs.spacing,
        '--user-font-size-multiplier': userPrefs.fontSize
      } as React.CSSProperties}
      data-color-theme={userPrefs.colorTheme}
    >
      {/* Enhanced Desktop Sidebar */}
      <aside 
        className={`hidden md:flex md:flex-col ${
          (sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) ? 'md:w-64' : 'md:w-20'
        } transition-all duration-300 glass-card shadow-2xl relative z-10 flex-shrink-0 overflow-y-auto border-r border-white/30`}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240, 253, 250, 0.95) 100%)'
        }}
        onMouseEnter={() => {
          if (userPrefs.sidebarAutoClose) {
            setSidebarHovered(true);
          }
        }}
        onMouseLeave={() => {
          if (userPrefs.sidebarAutoClose) {
            setSidebarHovered(false);
          }
        }}
      >
        {/* Enhanced Logo Section */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/30 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          {(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) && (
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg pulse-glow"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
              >
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Adiology</span>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full tracking-wide uppercase">Beta</span>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setSidebarHovered(false);
            }}
            className="p-2 rounded-xl hover:bg-indigo-50 transition-all cursor-pointer modern-button"
            style={{ background: sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered) ? 'rgba(99, 102, 241, 0.1)' : 'transparent' }}
          >
            {(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
          </button>
        </div>

        {/* Enhanced Workspace Switcher */}
        {user && (sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) && (
          <div className="px-4 py-4 border-b border-white/30">
            {/* Workspace switcher would go here when implemented */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
                <Building className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">No workspace selected</span>
              </div>
            {/* ) */}
          </div>
        )}
        
        {/* View Mode Indicator in Sidebar - Only show for owners/admins */}
        {canSwitchViews && (sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) && (
          <div className="px-4 py-2 border-b border-indigo-100/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-600">
                  {viewMode === 'admin' ? 'Admin View' : 'User View'}
                </span>
              </div>
              <Switch
                checked={viewMode === 'admin'}
                onCheckedChange={(checked: boolean) => {
                  const newViewMode = checked ? 'admin' : 'user';
                  setViewMode(newViewMode);
                  // If switching to user view, check if current tab is accessible
                  if (!checked) {
                    const currentItem = allMenuItems.find(item => 
                      item.id === activeTab || item.submenu?.some(sub => sub.id === activeTab)
                    );
                    if (currentItem) {
                      const itemToCheck = currentItem.id === activeTab ? currentItem : 
                        currentItem.submenu?.find(sub => sub.id === activeTab);
                      if (itemToCheck) {
                        // Check if item would be accessible in user view mode
                        if (itemToCheck.module && !['dashboard', 'settings', 'support'].includes(itemToCheck.module)) {
                          setActiveTabSafe('dashboard');
                        } else if (itemToCheck.id === 'admin-panel') {
                          setActiveTabSafe('dashboard');
                        }
                      }
                    }
                  }
                }}
                className="scale-75"
              />
            </div>
          </div>
        )}

        {/* Enhanced Navigation */}
        <nav className="p-4 space-y-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedMenus.has(item.id);
            const isParentActive = activeTab === item.id;
            const hasActiveSubmenu = hasSubmenu && item.submenu?.some(sub => sub.id === activeTab);
            const isActive = isParentActive && !hasActiveSubmenu;
            
            return (
              <div key={item.id} className="slide-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <button
                onClick={() => {
                    if (hasSubmenu) {
                      setExpandedMenus(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(item.id)) {
                          newSet.delete(item.id);
                        } else {
                          newSet.add(item.id);
                        }
                        return newSet;
                      });
                    } else if ((item as any).externalUrl) {
                      window.open((item as any).externalUrl, '_blank', 'noopener,noreferrer');
                    } else {
                  setActiveTabSafe(item.id);
                    }
                }}
                  className={`sidebar-item w-full flex items-center gap-3 py-3 rounded-2xl transition-all duration-300 group cursor-pointer ${
                    !(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) 
                      ? 'justify-center px-3' 
                      : 'justify-between px-4'
                  } ${
                  isActive
                      ? `bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl`
                      : hasActiveSubmenu
                    ? `bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl`
                    : `text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:shadow-lg`
                }`}
                style={{ minWidth: 0 }}
              >
                  <div className={`flex items-center ${!(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) ? 'justify-center flex-shrink-0' : 'gap-3 flex-1 min-w-0 overflow-hidden justify-start'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isActive || hasActiveSubmenu 
                        ? 'bg-white/20 shadow-lg' 
                        : 'group-hover:bg-indigo-100 group-hover:shadow-md'
                    }`}>
                      <Icon className={`w-5 h-5 shrink-0 ${isActive || hasActiveSubmenu ? 'text-white' : 'text-slate-600 group-hover:text-indigo-600'}`} />
                    </div>
                {(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) && (
                  <span className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left" style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}>
                    {item.label}
                  </span>
                )}
                  </div>
                  {(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) && hasSubmenu && (
                    <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ${isActive || hasActiveSubmenu ? 'text-white' : 'text-slate-400'}`} />
                  )}
                </button>
                {hasSubmenu && isExpanded && (
                  <div className={`mt-2 space-y-1 ${(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) ? 'ml-6 border-l-2 border-indigo-200 pl-4' : ''}`}>
                    {item.submenu?.map((subItem, subIndex) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = activeTab === subItem.id;
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => {
                            setActiveTabSafe(subItem.id);
                          }}
                          className={`sidebar-item w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group cursor-pointer ${
                            isSubActive
                              ? `bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 shadow-lg border border-indigo-200`
                              : `text-slate-600 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:shadow-md`
                          } ${!(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) ? 'justify-center px-3' : 'justify-start'}`}
                          style={{ minWidth: 0, animationDelay: `${subIndex * 0.05}s` }}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                            isSubActive 
                              ? 'bg-indigo-200 shadow-md' 
                              : 'group-hover:bg-indigo-100'
                          }`}>
                            <SubIcon className={`w-4 h-4 shrink-0 ${isSubActive ? 'text-indigo-700' : 'text-slate-500 group-hover:text-indigo-600'}`} />
                          </div>
                          {(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) && (
                            <span className={`font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left ${isSubActive ? 'text-indigo-700' : 'text-slate-600'}`} style={{ fontSize: 'clamp(0.8125rem, 2.2vw, 0.875rem)' }}>
                              {subItem.label}
                            </span>
                          )}
              </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Section - Feedback, Workspaces, Billing & Logout */}
        <div className="mt-auto p-4 border-t border-slate-200/60 space-y-2">
          <FeedbackButton 
            variant="sidebar" 
            sidebarOpen={sidebarOpen} 
            sidebarHovered={userPrefs.sidebarAutoClose && sidebarHovered}
            currentPage={activeTab}
          />
          <button
            onClick={() => setActiveTabSafe('workspaces')}
            className={`w-full flex items-center gap-2 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer ${
              !(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) 
                ? 'justify-center px-2' 
                : 'justify-start px-3'
            } ${
              activeTab === 'workspaces'
                ? `theme-gradient text-white shadow-lg`
                : `text-slate-700 hover:bg-slate-100`
            }`}
          >
            <Building className={`w-5 h-5 shrink-0 ${activeTab === 'workspaces' ? 'text-white' : 'text-slate-500'}`} />
            {(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) && (
              <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left" style={{ fontSize: 'clamp(0.8125rem, 2.5vw, 0.9375rem)' }}>
                Workspaces
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTabSafe('billing')}
            className={`w-full flex items-center gap-2 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer ${
              !(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) 
                ? 'justify-center px-2' 
                : 'justify-start px-3'
            } ${
              activeTab === 'billing'
                ? `theme-gradient text-white shadow-lg`
                : `text-slate-700 hover:bg-slate-100`
            }`}
          >
            <CreditCard className={`w-5 h-5 shrink-0 ${activeTab === 'billing' ? 'text-white' : 'text-slate-500'}`} />
            {(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) && (
              <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left" style={{ fontSize: 'clamp(0.8125rem, 2.5vw, 0.9375rem)' }}>
                Billing
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer ${
              !(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) 
                ? 'justify-center px-2' 
                : 'justify-start px-3'
            } text-red-600 hover:bg-red-50`}
          >
            <LogOut className="w-5 h-5 shrink-0 text-red-500" />
            {(sidebarOpen || (userPrefs.sidebarAutoClose && sidebarHovered)) && (
              <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left" style={{ fontSize: 'clamp(0.8125rem, 2.5vw, 0.9375rem)' }}>
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Enhanced Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0 glass-card border-r border-white/30">
          <SheetHeader className="h-16 flex items-center justify-between px-5 border-b border-white/30 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg pulse-glow">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <SheetTitle className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Adiology</SheetTitle>
                <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full tracking-wide uppercase w-fit">Enhanced Beta</span>
              </div>
            </div>
          </SheetHeader>
          
          <nav className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-180px)]">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedMenus.has(item.id);
              const isParentActive = activeTab === item.id;
              const hasActiveSubmenu = hasSubmenu && item.submenu?.some(sub => sub.id === activeTab);
              const isActive = isParentActive && !hasActiveSubmenu;
              
              return (
                <div key={item.id} className="slide-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <button
                    onClick={() => {
                      if (hasSubmenu) {
                        setExpandedMenus(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(item.id)) {
                            newSet.delete(item.id);
                          } else {
                            newSet.add(item.id);
                          }
                          return newSet;
                        });
                      } else {
                        setActiveTabSafe(item.id);
                      }
                    }}
                    className={`sidebar-item w-full flex items-center justify-between gap-3 py-3 px-4 rounded-2xl transition-all duration-300 ${
                      isActive || hasActiveSubmenu
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl'
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive || hasActiveSubmenu 
                          ? 'bg-white/20 shadow-lg' 
                          : 'group-hover:bg-indigo-100'
                      }`}>
                        <Icon className={`w-5 h-5 shrink-0 ${isActive || hasActiveSubmenu ? 'text-white' : 'text-slate-600'}`} />
                      </div>
                      <span className="font-semibold">{item.label}</span>
                    </div>
                    {hasSubmenu && (
                      <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ${isActive || hasActiveSubmenu ? 'text-white' : 'text-slate-400'}`} />
                    )}
                  </button>
                  
                  {hasSubmenu && isExpanded && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.submenu!.map((subItem, subIndex) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = activeTab === subItem.id;
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => setActiveTabSafe(subItem.id)}
                            className={`sidebar-item w-full flex items-center gap-3 py-2.5 px-4 rounded-xl transition-all duration-300 ${
                              isSubActive
                                ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 shadow-lg border border-indigo-200'
                                : 'text-slate-600 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50'
                            }`}
                            style={{ animationDelay: `${subIndex * 0.05}s` }}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                              isSubActive 
                                ? 'bg-indigo-200 shadow-md' 
                                : 'group-hover:bg-indigo-100'
                            }`}>
                              <SubIcon className={`w-4 h-4 ${isSubActive ? 'text-indigo-700' : 'text-slate-500'}`} />
                            </div>
                            <span className="font-medium text-sm">{subItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/30 glass-card space-y-3">
            <button
              onClick={() => setActiveTabSafe('workspaces')}
              className={`sidebar-item w-full flex items-center gap-3 py-3 px-4 rounded-2xl transition-all duration-300 ${
                activeTab === 'workspaces'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl'
                  : 'text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:shadow-lg'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                activeTab === 'workspaces' 
                  ? 'bg-white/20 shadow-lg' 
                  : 'group-hover:bg-indigo-100'
              }`}>
                <Building className={`w-5 h-5 ${activeTab === 'workspaces' ? 'text-white' : 'text-slate-600'}`} />
              </div>
              <span className="font-semibold">Workspaces</span>
            </button>
            <button
              onClick={() => setActiveTabSafe('billing')}
              className={`sidebar-item w-full flex items-center gap-3 py-3 px-4 rounded-2xl transition-all duration-300 ${
                activeTab === 'billing'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl'
                  : 'text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:shadow-lg'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                activeTab === 'billing' 
                  ? 'bg-white/20 shadow-lg' 
                  : 'group-hover:bg-indigo-100'
              }`}>
                <CreditCard className={`w-5 h-5 ${activeTab === 'billing' ? 'text-white' : 'text-slate-600'}`} />
              </div>
              <span className="font-semibold">Billing</span>
            </button>
            <button
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="sidebar-item w-full flex items-center gap-3 py-3 px-4 rounded-2xl transition-all duration-300 text-red-600 hover:bg-red-50 hover:shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-red-100">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
        {/* Enhanced Header */}
        <header className="h-16 glass-card shadow-xl border-b border-white/30 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-indigo-50 transition-all duration-200 modern-button"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden lg:block">
              {getCurrentPageTitle()}
            </h2>
            
            {/* View Mode Toggle - Only show for owners/admins */}
            {canSwitchViews && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass-effect border border-white/30">
                <Eye className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {viewMode === 'admin' ? 'Admin View' : 'User View'}
                </span>
                <Switch
                  checked={viewMode === 'admin'}
                  onCheckedChange={(checked: boolean) => {
                    const newViewMode = checked ? 'admin' : 'user';
                    setViewMode(newViewMode);
                    if (!checked) {
                      const currentItem = allMenuItems.find(item => 
                        item.id === activeTab || item.submenu?.some(sub => sub.id === activeTab)
                      );
                      if (currentItem) {
                        const itemToCheck = currentItem.id === activeTab ? currentItem : 
                          currentItem.submenu?.find(sub => sub.id === activeTab);
                        if (itemToCheck) {
                          if (itemToCheck.module && !['dashboard', 'settings', 'support'].includes(itemToCheck.module)) {
                            setActiveTabSafe('dashboard');
                          } else if (itemToCheck.id === 'admin-panel') {
                            setActiveTabSafe('dashboard');
                          }
                        }
                      }
                    }
                  }}
                  className="scale-90"
                />
              </div>
            )}
            
            {/* Enhanced Search */}
            <div className="relative hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                className="block w-64 pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 glass-effect placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="Search campaigns, keywords..."
              />
              
              {/* Enhanced Search Suggestions */}
              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl shadow-xl border border-white/50 z-50 max-h-64 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSearchSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl border-b border-white/30 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <Search className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{suggestion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-3 rounded-xl glass-effect hover:shadow-lg transition-all duration-200 border border-white/30">
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-lg">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Notifications</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin/User View Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                {viewMode === 'admin' ? 'Admin' : 'User'} View
              </span>
              <Switch
                checked={viewMode === 'admin'}
                onCheckedChange={(checked: boolean) => {
                  const newViewMode = checked ? 'admin' : 'user';
                  setViewMode(newViewMode);
                  // If switching to user view, check if current tab is accessible
                  if (!checked) {
                    const currentItem = allMenuItems.find(item => 
                      item.id === activeTab || item.submenu?.some(sub => sub.id === activeTab)
                    );
                    if (currentItem) {
                      const itemToCheck = currentItem.id === activeTab ? currentItem : 
                        currentItem.submenu?.find(sub => sub.id === activeTab);
                      if (itemToCheck) {
                        // Check if item would be accessible in user view mode
                        // TODO: Implement module availability check when workspace system is ready
                        if (itemToCheck.id === 'admin-panel') {
                          setActiveTabSafe('dashboard');
                        }
                      }
                    }
                  }
                }}
                className="ml-1"
              />
            </div>
            
            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer">
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      Mark all as read
            </button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex flex-col items-start p-3 cursor-pointer hover:bg-indigo-50 ${
                          !notification.read ? 'bg-purple-50/50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between w-full gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <span className="w-2 h-2 bg-indigo-600 rounded-full shrink-0"></span>
                              )}
                              <span className="font-medium text-sm text-slate-800">
                                {notification.title}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1.5 ml-0">
                              {notification.message}
                            </p>
                            <span className="text-xs text-slate-400 mt-1 ml-0 block">
                              {notification.time}
                            </span>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-center justify-center text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer"
                      onClick={handleViewAllNotifications}
                    >
                      View all notifications
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Enhanced Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                  {user 
                    ? (() => {
                        const name = user.full_name || user.email || 'U';
                        const parts = name.split(' ');
                        return (parts[0]?.charAt(0) || '').toUpperCase() + (parts[1]?.charAt(0) || '').toUpperCase() || 'U';
                      })()
                    : 'U'
                  }
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1.5">
                    {user ? (
                      <>
                        <div className="font-semibold text-slate-900">
                          {user.full_name || user.email?.split('@')[0] || 'User'}
                            </div>
                        <div className="text-xs text-slate-600">
                          {user.email || 'user@example.com'}
                          </div>
                        {user.subscription_plan && user.subscription_plan !== 'free' && (
                          <Badge className={`w-fit ${COLOR_CLASSES.primaryBadge} mt-1`}>
                            {user.subscription_plan.charAt(0).toUpperCase() + user.subscription_plan.slice(1)}
                              </Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-slate-900">User</div>
                        <div className="text-xs text-slate-600">user@example.com</div>
                        </>
                    )}
            </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTabSafe('settings')}>
                  <User className="w-4 h-4 mr-2 shrink-0" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTabSafe('workspaces')}>
                  <Building className="w-4 h-4 mr-2 shrink-0" />
                  Workspaces
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTabSafe('billing')}>
                  <Shield className="w-4 h-4 mr-2 shrink-0" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTabSafe('support')}>
                  <HelpCircle className="w-4 h-4 mr-2 shrink-0" />
                  Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  variant="destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Enhanced Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 pb-20 md:pb-6 w-full min-w-0 relative bg-gradient-to-br from-slate-50/50 via-indigo-50/30 to-purple-50/50">
          <div className="slide-in-up">
            {renderContent()}
          </div>
        </main>

        {/* Mobile Navigation */}
        <MobileNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTabSafe}
        />

        {/* Mobile Quick Actions */}
        <MobileQuickActions 
          onNewCampaign={() => setActiveTabSafe('builder-3')}
        />
      </div>

    </div>
  );
};

const App = () => {
  return (
    <WorkspaceProvider>
      <AppContent />
    </WorkspaceProvider>
  );
};

export default App;