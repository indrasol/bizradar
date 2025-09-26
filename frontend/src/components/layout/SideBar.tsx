import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  FileText,
  Bookmark,
  Settings,
  Radar,
  Lock,
  AlertCircle,
  Bot,
  ChevronRight,
  BarChart3,
  LogOut,
  Star
} from 'lucide-react';
import SettingsNotification from './SettingsNotification';
import { useAuth } from '../Auth/useAuth';
import { supabase } from '../../utils/supabase';
import { trackersApi } from '@/api/trackers';
import { profileApi } from '@/api/profile';
import { toast } from 'sonner';
import BizradarAIModal from './BizradarAIModal';
import { subscriptionApi } from '../../api/subscription';
import { UpgradeModal } from '../subscription/UpgradeModal';
import { ThemeToggle } from '../ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isThemeToggleDisabled } = useTheme();

  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pursuitCount, setPursuitCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // NEW: Reports expand/collapse
  const [reportsExpanded, setReportsExpanded] = useState(false);
  useEffect(() => {
    // auto-expand when you're somewhere under /reports
    setReportsExpanded(location.pathname.startsWith('/reports'));
  }, [location.pathname]);

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'free':
        return { icon: Star, bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600', textColor: 'text-white' };
      case 'pro':
        return { icon: Star, bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600', textColor: 'text-white' };
      case 'premium':
        return { icon: Star, bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600', textColor: 'text-white' };
      default:
        return { icon: Star, bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600', textColor: 'text-white' };
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }
      if (profile && profile.id === user.id) {
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      setProfileError(null);

      try {
        const profile = await profileApi.getUserProfile(user.id);

        if (profile) {
          setProfile(profile);
          const userRole = (profile.company_info?.role || '').toLowerCase();
          setIsAdmin(userRole === 'admin');
        }
      } catch (err) {
        setProfileError('Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user, profile]);

  useEffect(() => {
    const fetchPursuitCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const response = await trackersApi.getTrackers(user.id);
        
        if (response.success) {
          setPursuitCount(response.trackers.length);
        } else {
          setPursuitCount(0);
        }
      } catch (error) {
        // silent
      }
    };

    fetchPursuitCount();

    const subscription = supabase
      .channel('trackers_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trackers', filter: `user_id=eq.${supabase.auth.getUser().then(res => res.data.user?.id)}` },
        () => fetchPursuitCount()
      )
      .subscribe();

    // Listen for custom tracker update events
    const handleTrackerUpdate = () => {
      fetchPursuitCount();
    };

    window.addEventListener('trackerUpdated', handleTrackerUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('trackerUpdated', handleTrackerUpdate);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleAdminClick = (e: React.MouseEvent) => {
    if (!isAdmin) {
      e.preventDefault();
      toast.error("You don't have permission to access the Admin Zone");
    }
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) {
        setSubscriptionLoading(false);
        return;
      }
      try {
        const subscription = await subscriptionApi.getCurrentSubscription();
        setCurrentSubscription(subscription);
      } catch {
        // ignore
      } finally {
        setSubscriptionLoading(false);
      }
    };
    loadSubscription();
    const handleSubscriptionUpdated = () => {
      // refetch on subscription updates (checkout returns)
      setSubscriptionLoading(true);
      subscriptionApi.getCurrentSubscription().then(setCurrentSubscription).finally(() => setSubscriptionLoading(false));
    };
    window.addEventListener('subscription-updated', handleSubscriptionUpdated);
    return () => window.removeEventListener('subscription-updated', handleSubscriptionUpdated);
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/logout');
    } catch {
      // ignore
    }
  };

  const handleTooltipHover = (itemName: string, event: React.MouseEvent) => {
    if (!collapsed) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top + rect.height / 2 - 12, // Center vertically
      left: rect.right + 8 // 8px to the right of the element
    });
    setHoveredItem(itemName);
  };

  const handleTooltipLeave = () => {
    setHoveredItem(null);
  };

  const handleNavigation = useCallback(
    (path: string, e: React.MouseEvent) => {
      if (location.pathname === path) return;
      e.preventDefault();

      setIsNavigating(true);
      setPendingRoute(path);

      const isHeavyPage = ['/trackers', '/settings'].includes(path);
      const delay = isHeavyPage ? 200 : 150;

      setTimeout(() => {
        navigate(path);
        setTimeout(() => {
          setIsNavigating(false);
          setPendingRoute(null);
        }, isHeavyPage ? 100 : 50);
      }, delay);
    },
    [location.pathname, navigate]
  );

  const handleRoutePreload = useCallback(
    (path: string) => {
      if (location.pathname !== path) {
        import(`../../pages/${path.substring(1).charAt(0).toUpperCase() + path.substring(2)}.tsx`).catch(() => {});
      }
    },
    [location.pathname]
  );

  const isRouteLoading = (path: string) => isNavigating && pendingRoute === path;

  const getNavItemState = useCallback(
    (path: string) => {
      const isCurrentlyActive = isActive(path);
      const isLoading = isRouteLoading(path);
      return { isActive: isCurrentlyActive, isLoading, isPending: isLoading && !isCurrentlyActive };
    },
    [isActive, isRouteLoading]
  );

  const profileDisplayData = useMemo(() => {
    if (isNavigating && profile) {
      return {
        showLoading: false,
        avatarContent: `${profile.personal_info?.first_name?.[0] || ''}${profile.personal_info?.last_name?.[0] || ''}`,
        displayName: `${profile.personal_info?.first_name || ''} ${profile.personal_info?.last_name || ''}`,
        showAdmin: isAdmin
      };
    }
    if (profileLoading) {
      return { showLoading: true, avatarContent: null, displayName: null, showAdmin: false };
    }
    if (profile) {
      return {
        showLoading: false,
        avatarContent: `${profile.personal_info?.first_name?.[0] || ''}${profile.personal_info?.last_name?.[0] || ''}`,
        displayName: `${profile.personal_info?.first_name || ''} ${profile.personal_info?.last_name || ''}`,
        showAdmin: isAdmin
      };
    }
    const emailName = user?.email?.split('@')[0] || 'User';
    return {
      showLoading: false,
      avatarContent: user?.email?.[0]?.toUpperCase() || 'U',
      displayName: emailName,
      showAdmin: false
    };
  }, [profileLoading, profile, isAdmin, user, isNavigating]);

  return (
    <div className={`h-full min-h-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${collapsed ? 'w-20' : 'w-64'} relative`}>
      {isNavigating && (
        <div className="absolute top-0 left-0 right-0 z-50">
          <div className="h-0.5 bg-blue-200 overflow-hidden">
            <div
              className={`h-full w-full bg-gradient-to-r from-transparent via-blue-600 to-transparent ${
                ['/trackers', '/settings'].includes(pendingRoute || '') ? 'via-emerald-600' : 'via-blue-600'
              }`}
              style={{ animation: `slideRight ${['/trackers', '/settings'].includes(pendingRoute || '') ? '2s' : '1.5s'} ease-in-out infinite`, transform: 'translateX(-100%)' }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col h-full min-h-0 py-6 relative">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md focus:outline-none transition-all"
        >
          <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
        </button>

        {/* Logo */}
        <div className={`px-6 mb-8 ${collapsed ? 'flex justify-center' : ''}`}>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="relative p-1">
              <div className="absolute inset-0 bg-blue-100 rounded-full"></div>
              <Radar className="w-6 h-6 text-blue-600 relative z-10" />
            </div>
            {!collapsed && <span className="text-xl font-semibold text-blue-600">Bizradar</span>}
          </Link>
        </div>

        {/* User */}
        <div className={`${collapsed ? 'px-2' : 'px-6'} mb-8`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl bg-gradient-to-r from-blue-50 to-white border border-blue-100 transition-all duration-300`}>
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium shadow-sm transition-all duration-300">
              {profileDisplayData.showLoading ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{profileDisplayData.avatarContent}</span>
              )}
            </div>
            {!collapsed && (
              <div className="overflow-hidden flex-1 min-w-0">
                {profileDisplayData.showLoading ? (
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate">{profileDisplayData.displayName}</p>
                    {profileDisplayData.showAdmin && (
                      <p className="text-xs text-blue-600 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        Administrator
                      </p>
                    )}
                    {profileError && <p className="text-xs text-gray-400">Profile loading...</p>}
                  </div>
                )}
              </div>
            )}
            {!collapsed && (
              <button onClick={handleLogout} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-4'} space-y-2`}>
          {/* Home */}
          <Link
            to="/dashboard"
            onClick={(e) => handleNavigation('/dashboard', e)}
            onMouseEnter={(e) => {
              handleRoutePreload('/dashboard');
              handleTooltipHover('Dashboard', e);
            }}
            onMouseLeave={handleTooltipLeave}
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 transform ${
              (() => {
                const state = getNavItemState('/dashboard');
                if (state.isActive) return 'bg-blue-100 text-blue-700 shadow-sm scale-[1.02]';
                if (state.isPending) return 'bg-blue-50 text-blue-600 shadow-sm scale-[1.01] animate-pulse';
                return 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]';
              })()
            }`}
          >
            <div
              className={`flex items-center justify-center transition-all duration-300 ${
                (() => {
                  const state = getNavItemState('/dashboard');
                  if (state.isActive) return 'text-blue-600';
                  if (state.isPending) return 'text-blue-500';
                  return 'text-gray-600 group-hover:text-blue-600';
                })()
              }`}
            >
              <Home className={`w-5 h-5 transition-transform duration-300 ${getNavItemState('/dashboard').isPending ? 'scale-110' : ''}`} />
            </div>
            {!collapsed && <span className="font-medium">Dashboard</span>}
          </Link>

          {/* Opportunities */}
          <Link
            to="/opportunities"
            onClick={(e) => handleNavigation('/opportunities', e)}
            onMouseEnter={(e) => {
              handleRoutePreload('/opportunities');
              handleTooltipHover('Opportunities', e);
            }}
            onMouseLeave={handleTooltipLeave}
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 transform ${
              (() => {
                const state = getNavItemState('/opportunities');
                if (state.isActive) return 'bg-blue-100 text-blue-700 shadow-sm scale-[1.02]';
                if (state.isPending) return 'bg-blue-50 text-blue-600 shadow-sm scale-[1.01] animate-pulse';
                return 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]';
              })()
            }`}
          >
            <div
              className={`flex items-center justify-center transition-all duration-300 ${
                (() => {
                  const state = getNavItemState('/opportunities');
                  if (state.isActive) return 'text-blue-600';
                  if (state.isPending) return 'text-blue-500';
                  return 'text-gray-600 group-hover:text-blue-600';
                })()
              }`}
            >
              <Search className={`w-5 h-5 transition-transform duration-300 ${getNavItemState('/opportunities').isPending ? 'scale-110' : ''}`} />
            </div>
            {!collapsed && <span className="font-medium">Opportunities</span>}
          </Link>

          {/* My Tracker */}
          <Link
            to="/trackers"
            onClick={(e) => handleNavigation('/trackers', e)}
            onMouseEnter={(e) => {
              handleRoutePreload('/trackers');
              handleTooltipHover(`My Tracker ${pursuitCount > 0 ? `(${pursuitCount})` : ''}`, e);
            }}
            onMouseLeave={handleTooltipLeave}
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 transform ${
              (() => {
                const state = getNavItemState('/trackers');
                if (state.isActive) return 'bg-blue-100 text-blue-700 shadow-sm scale-[1.02]';
                if (state.isPending) return 'bg-emerald-50 text-emerald-600 shadow-sm scale-[1.01] animate-pulse';
                return 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]';
              })()
            }`}
          >
            <div
              className={`relative flex items-center justify-center transition-all duration-300 ${
                (() => {
                  const state = getNavItemState('/trackers');
                  if (state.isActive) return 'text-blue-600';
                  if (state.isPending) return 'text-emerald-500';
                  return 'text-gray-600 group-hover:text-blue-600';
                })()
              }`}
            >
              <Bookmark className={`w-5 h-5 transition-transform duration-300 ${getNavItemState('/trackers').isPending ? 'scale-110 animate-pulse' : ''}`} />
              {pursuitCount > 0 && (
                <span className={`absolute -top-2 -right-2 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center ${getNavItemState('/trackers').isActive ? 'bg-blue-600' : 'bg-blue-500'}`}>
                  {pursuitCount}
                </span>
              )}
            </div>
            {!collapsed && (
              <div className="flex items-center justify-between flex-1">
                <span className="font-medium">My Tracker</span>
                {/* {pursuitCount > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${getNavItemState('/trackers').isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                    {pursuitCount}
                  </span>
                )} */}
              </div>
            )}
          </Link>

          {/* NEW: Reports (expandable) */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setReportsExpanded((v) => !v)}
              onMouseEnter={(e) => handleTooltipHover('Reports', e)}
              onMouseLeave={handleTooltipLeave}
              className={`w-full group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 ${
                location.pathname.startsWith('/reports') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className={`${location.pathname.startsWith('/reports') ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'}`}>
                <FileText className="w-5 h-5" />
              </div>
              {!collapsed && <span className="font-medium">Reports</span>}
              {!collapsed && (
                <ChevronRight
                  className={`ml-auto w-4 h-4 text-gray-400 transition-transform ${reportsExpanded ? 'rotate-90' : ''}`}
                />
              )}
            </button>

            {reportsExpanded && (
              <div className={`${collapsed ? 'px-1' : 'pl-10 pr-2'} space-y-1`}>
                <Link
                  to="/reports/ongoing"
                  onClick={(e) => handleNavigation('/reports/ongoing', e)}
                  onMouseEnter={() => handleRoutePreload('/reports')}
                  className={`block px-3 py-2 rounded-lg text-sm transition ${
                    isActive('/reports/ongoing') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Active Responses
                </Link>
                <Link
                  to="/reports/submitted"
                  onClick={(e) => handleNavigation('/reports/submitted', e)}
                  onMouseEnter={() => handleRoutePreload('/reports')}
                  className={`block px-3 py-2 rounded-lg text-sm transition ${
                    isActive('/reports/submitted') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Submitted Responses
                </Link>
              </div>
            )}
          </div>

          {/* Analytics */}
          <Link
            to="/analytics"
            onClick={(e) => handleNavigation('/analytics', e)}
            onMouseEnter={(e) => {
              handleRoutePreload('/analytics');
              handleTooltipHover('Analytics', e);
            }}
            onMouseLeave={handleTooltipLeave}
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 transform ${
              (() => {
                const state = getNavItemState('/analytics');
                if (state.isActive) return 'bg-blue-100 text-blue-700 shadow-sm scale-[1.02]';
                if (state.isPending) return 'bg-blue-50 text-blue-600 shadow-sm scale-[1.01] animate-pulse';
                return 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]';
              })()
            }`}
          >
            <div
              className={`flex items-center justify-center transition-all duration-300 ${
                (() => {
                  const state = getNavItemState('/analytics');
                  if (state.isActive) return 'text-blue-600';
                  if (state.isPending) return 'text-blue-500';
                  return 'text-gray-600 group-hover:text-blue-600';
                })()
              }`}
            >
              <BarChart3 className={`w-5 h-5 transition-transform duration-300 ${getNavItemState('/analytics').isPending ? 'scale-110' : ''}`} />
            </div>
            {!collapsed && <span className="font-medium">Analytics</span>}
          </Link>

          {/* Settings */}
          <Link
            to="/settings"
            onClick={(e) => handleNavigation('/settings', e)}
            onMouseEnter={(e) => {
              handleRoutePreload('/settings');
              handleTooltipHover('Settings', e);
            }}
            onMouseLeave={handleTooltipLeave}
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 transform ${
              (() => {
                const state = getNavItemState('/settings');
                if (state.isActive) return 'bg-blue-100 text-blue-700 shadow-sm scale-[1.02]';
                if (state.isPending) return 'bg-emerald-50 text-emerald-600 shadow-sm scale-[1.01] animate-pulse';
                return 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]';
              })()
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Settings
                className={`w-5 h-5 transition-all duration-300 ${
                  (() => {
                    const state = getNavItemState('/settings');
                    if (state.isActive) return 'text-blue-600';
                    if (state.isPending) return 'text-emerald-500 scale-110 animate-pulse';
                    return 'text-gray-600 group-hover:text-blue-600';
                  })()
                }`}
              />
              <SettingsNotification />
            </div>
            {!collapsed && <span className="font-medium">Settings</span>}
          </Link>

          {/* Theme Toggle */}
          {!isThemeToggleDisabled && (
            <div
              onMouseEnter={(e) => handleTooltipHover('Theme Toggle', e)}
              onMouseLeave={handleTooltipLeave}
              className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 text-gray-700 hover:bg-gray-100`}
            >
              <div className="flex items-center justify-center">
                <ThemeToggle collapsed={collapsed} showLabel={!collapsed} />
              </div>
            </div>
          )}

          {/* Admin Zone
          <div className="relative group">
            <Link
              to="/admin"
              onClick={(e) => {
                if (!isAdmin) {
                  handleAdminClick(e);
                } else {
                  handleNavigation('/admin', e);
                }
              }}
              onMouseEnter={() => isAdmin && handleRoutePreload('/admin')}
              className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 transform ${
                (() => {
                  if (!isAdmin) return 'text-gray-400 hover:bg-gray-100/50 cursor-not-allowed';
                  const state = getNavItemState('/admin');
                  if (state.isActive) return 'bg-blue-100 text-blue-700 shadow-sm scale-[1.02]';
                  if (state.isPending) return 'bg-blue-50 text-blue-600 shadow-sm scale-[1.01] animate-pulse';
                  return 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]';
                })()
              }`}
            >
              <div className="flex items-center justify-center">
                <Lock
                  className={`w-5 h-5 transition-all duration-300 ${
                    (() => {
                      if (!isAdmin) return 'text-gray-400';
                      const state = getNavItemState('/admin');
                      if (state.isActive) return 'text-blue-600';
                      if (state.isPending) return 'text-blue-500 scale-110';
                      return 'text-gray-600 group-hover:text-blue-600';
                    })()
                  }`}
                />
              </div>
              {!collapsed && <span className="font-medium">Admin Zone</span>}
              {!collapsed && !isAdmin && <Lock className="w-3.5 h-3.5 ml-auto text-gray-400" />}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50">
                  Admin Zone {!isAdmin && ' (Restricted)'}
                </div>
              )}
            </Link>

            {!isAdmin && !collapsed && (
              <div className="absolute left-2 -bottom-2 translate-y-full w-48 bg-gray-800 text-white text-xs rounded py-1.5 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-lg">
                <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" />
                  <span>Restricted for admins only</span>
                </div>
              </div>
            )}
          </div> */}

        

        </nav>

        {/* Bottom subscription */}
        <div className={`${collapsed ? 'px-2' : 'px-4'} pt-4 pb-4 border-t border-gray-200 dark:border-black mt-auto sidebar-separator`}>




          <button
            onClick={() => setUpgradeOpen(true)}
            onMouseEnter={(e) => handleTooltipHover(
              subscriptionLoading
                ? 'Loading...'
                : currentSubscription
                ? `${currentSubscription.plan_type?.[0]?.toUpperCase()}${currentSubscription.plan_type?.slice(1)} Plan`
                : 'Free Plan', e
            )}
            onMouseLeave={handleTooltipLeave}
            className={`group flex ${collapsed ? 'flex-col items-center' : 'items-center gap-3'} px-3 py-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-sm hover:shadow-md transition-all duration-300 w-full`}
          >
            {(() => {
              const planType = currentSubscription?.plan_type || 'free';
              const planIcon = getPlanIcon(planType);
              const IconComponent = planIcon.icon;
              return (
                <div className={`p-1.5 rounded-lg ${planIcon.bgColor} shadow-sm`}>
                  <IconComponent className={`w-4 h-4 ${planIcon.textColor}`} />
                </div>
              );
            })()}
            {!collapsed ? (
              <>
                <span className="font-medium text-blue-600">
                  {subscriptionLoading
                    ? 'Loading...'
                    : currentSubscription
                    ? `${currentSubscription.plan_type?.[0]?.toUpperCase()}${currentSubscription.plan_type?.slice(1)} Plan`
                    : 'Free Plan'}
                </span>
                <div className="ml-auto flex items-center">
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">Upgrade</span>
                </div>
              </>
            ) : (
              <div className="mt-1">
                <span className="inline-flex h-4 w-4 items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xs font-medium">U</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {isModalOpen && <BizradarAIModal onClose={handleCloseModal} />}
      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onSuccess={() => {
          setUpgradeOpen(false);
          (async () => {
            try {
              const subscription = await subscriptionApi.getCurrentSubscription();
              setCurrentSubscription(subscription);
            } catch {}
          })();
        }}
      />

      {/* Dynamic Tooltip */}
      {collapsed && hoveredItem && (
        <div
          className="fixed px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-[9999] pointer-events-none"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`
          }}
        >
          {hoveredItem}
        </div>
      )}

      <style>{`
        @keyframes slideRight {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
