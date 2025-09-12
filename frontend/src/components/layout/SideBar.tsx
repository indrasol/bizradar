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
import { toast } from 'sonner';
import BizradarAIModal from './BizradarAIModal';
import { subscriptionApi } from '../../api/subscription';
import { UpgradeModal } from '../subscription/UpgradeModal';
import ThemeToggle from '../ThemeToggle';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pursuitCount, setPursuitCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  
  // Function to get plan icon and styling
  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'free':
        return {
          icon: Star,
          bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
          textColor: 'text-white'
        };
      case 'pro':
        return {
          icon: Star,
          bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
          textColor: 'text-white'
        };
      case 'premium':
        return {
          icon: Star,
          bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600',
          textColor: 'text-white'
        };
      default:
        return {
          icon: Star,
          bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
          textColor: 'text-white'
        };
    }
  };
  
  // Fetch user profile with enhanced state management
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }
      
      // Don't refetch if we already have profile data for this user
      if (profile && profile.id === user.id) {
        setProfileLoading(false);
        return;
      }
      
      setProfileLoading(true);
      setProfileError(null);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile from Supabase:', error);
          setProfileError(error.message);
          throw error;
        }
        
        if (data) {
          setProfile(data);
          
          // Simple role check - just look for 'admin' in the role field
          const userRole = (data.role || '').toLowerCase();
          const adminStatus = userRole === 'admin';
          
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('Error in profile fetch process:', error);
        setProfileError('Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, profile]);

  // Load pursuit count from localStorage
  useEffect(() => {
    const fetchPursuitCount = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log("No user logged in");
          return;
        }
        
        // Count the user's trackers
        const { count, error } = await supabase
          .from('trackers')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        setPursuitCount(count || 0);
      } catch (error) {
        console.error("Error fetching pursuit count:", error);
      }
    };
    
    fetchPursuitCount();
    
    // Subscribe to changes in the pursuits table for real-time updates
    const subscription = supabase
      .channel('pursuits_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pursuits',
        filter: `user_id=eq.${supabase.auth.getUser().then(res => res.data.user?.id)}` 
      }, 
      () => {
        fetchPursuitCount();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Check if the path matches the given route
  const isActive = (path) => location.pathname === path;
  
  const handleAdminClick = (e) => {
    if (!isAdmin) {
      e.preventDefault();
      toast.error("You don't have permission to access the Admin Zone");
    }
  };
  
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Load subscription data
  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) {
        setSubscriptionLoading(false);
        return;
      }

      try {
        const subscription = await subscriptionApi.getCurrentSubscription();
        setCurrentSubscription(subscription);
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    loadSubscription();
  }, [user]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/register');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Enhanced navigation with smooth transitions and preloading
  const handleNavigation = useCallback((path, e) => {
    // Don't prevent default for external links or if already on the page
    if (location.pathname === path) {
      return;
    }

    e.preventDefault();
    
    // Set loading state
    setIsNavigating(true);
    setPendingRoute(path);
    
    // For heavy pages like Trackers and Settings, add extra visual feedback
    const isHeavyPage = ['/trackers', '/settings'].includes(path);
    const delay = isHeavyPage ? 200 : 150;
    
    // Add a small delay for smooth visual feedback
    setTimeout(() => {
      navigate(path);
      // Reset navigation state after a brief delay to allow for smooth transitions
      setTimeout(() => {
        setIsNavigating(false);
        setPendingRoute(null);
      }, isHeavyPage ? 100 : 50);
    }, delay);
  }, [location.pathname, navigate]);

  // Preload routes on hover for faster navigation
  const handleRoutePreload = useCallback((path) => {
    if (location.pathname !== path) {
      // Preload the route component (this works with React Router's lazy loading)
      import(`../../pages/${path.substring(1).charAt(0).toUpperCase() + path.substring(2)}.tsx`).catch(() => {
        // Ignore preload errors - the route will load normally when clicked
      });
    }
  }, [location.pathname]);

  // Check if route is currently loading
  const isRouteLoading = (path) => {
    return isNavigating && pendingRoute === path;
  };

  // Enhanced active state check with loading consideration - Memoized for performance
  const getNavItemState = useCallback((path) => {
    const isCurrentlyActive = isActive(path);
    const isLoading = isRouteLoading(path);
    
    return {
      isActive: isCurrentlyActive,
      isLoading,
      isPending: isLoading && !isCurrentlyActive
    };
  }, [isActive, isRouteLoading]);

  // Memoize profile display data to prevent unnecessary re-renders
  const profileDisplayData = useMemo(() => {
    // During navigation, keep the existing profile data stable
    if (isNavigating && profile) {
      return {
        showLoading: false,
        avatarContent: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`,
        displayName: `${profile.first_name} ${profile.last_name}`,
        showAdmin: isAdmin
      };
    }
    
    if (profileLoading) {
      return {
        showLoading: true,
        avatarContent: null,
        displayName: null,
        showAdmin: false
      };
    }
    
    if (profile) {
      return {
        showLoading: false,
        avatarContent: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`,
        displayName: `${profile.first_name} ${profile.last_name}`,
        showAdmin: isAdmin
      };
    }
    
    // Fallback to user email
    const emailName = user?.email?.split('@')[0] || 'User';
    return {
      showLoading: false,
      avatarContent: user?.email?.[0]?.toUpperCase() || 'U',
      displayName: emailName,
      showAdmin: false
    };
  }, [profileLoading, profile, isAdmin, user, isNavigating]);
  
  return (
    <div className={`relative z-[9999] h-full bg-card border-r border-border transition-all duration-300 flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Global Loading Indicator */}
      {isNavigating && (
        <div className="absolute top-0 left-0 right-0 z-50">
          <div className="h-0.5 bg-blue-200 overflow-hidden">
            <div 
              className={`h-full w-full bg-gradient-to-r from-transparent via-blue-600 to-transparent ${
                ['/trackers', '/settings'].includes(pendingRoute) 
                  ? 'bg-gradient-to-r from-transparent via-emerald-600 to-transparent' 
                  : 'bg-gradient-to-r from-transparent via-blue-600 to-transparent'
              }`}
              style={{
                animation: `slideRight ${['/trackers', '/settings'].includes(pendingRoute) ? '2s' : '1.5s'} ease-in-out infinite`,
                transform: 'translateX(-100%)'
              }}
            />
          </div>
        </div>
      )}
      
      <div className="flex flex-col h-full py-6 relative">
        {/* Toggle Button */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center shadow-sm hover:shadow-md focus:outline-none transition-all"
        >
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
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
        
        {/* User Info - Enhanced with stable loading states */}
        <div className={`${collapsed ? 'px-2' : 'px-6'} mb-8`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl bg-gradient-to-r from-blue-50 to-card border border-blue-100 transition-all duration-300`}>
            {/* Avatar - Always visible with stable content */}
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium shadow-sm transition-all duration-300">
              {profileDisplayData.showLoading ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="transition-all duration-300">
                  {profileDisplayData.avatarContent}
                </span>
              )}
            </div>
            
            {/* Profile Info - Smooth transitions with stable content */}
            {!collapsed && (
              <div className="overflow-hidden flex-1 min-w-0">
                {profileDisplayData.showLoading ? (
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                ) : (
                  <div className="transition-all duration-300 opacity-100">
                    <p className="text-sm font-medium text-foreground truncate transition-all duration-300">
                      {profileDisplayData.displayName}
                    </p>
                    {profileDisplayData.showAdmin && (
                      <p className="text-xs text-blue-600 flex items-center gap-1 transition-all duration-300">
                        <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        Administrator
                      </p>
                    )}
                    {profileError && (
                      <p className="text-xs text-muted-foreground transition-all duration-300">Profile loading...</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Logout Button */}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} space-y-2`}>
          <Link
            to="/dashboard"
            onClick={(e) => handleNavigation('/dashboard', e)}
            onMouseEnter={() => handleRoutePreload('/dashboard')}
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 transform ${
              (() => {
                const state = getNavItemState('/dashboard');
                if (state.isActive) {
                  return 'bg-blue-100 text-blue-700 shadow-sm scale-[1.02]';
                } else if (state.isPending) {
                  return 'bg-blue-50 text-blue-600 shadow-sm scale-[1.01] animate-pulse';
                } else {
                  return 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]';
                }
              })()
            }`}
          >
            <div className={`flex items-center justify-center transition-all duration-300 ${
              (() => {
                const state = getNavItemState('/dashboard');
                if (state.isActive) {
                  return 'text-blue-600';
                } else if (state.isPending) {
                  return 'text-blue-500';
                } else {
                  return 'text-gray-600 group-hover:text-blue-600';
                }
              })()
            }`}>
              <Home className={`w-5 h-5 transition-transform duration-300 ${getNavItemState('/dashboard').isPending ? 'scale-110' : ''}`} />
            </div>
            {!collapsed && (
              <span className="font-medium transition-all duration-300">Home</span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[10000] shadow-lg">
                Home
              </div>
            )}
          </Link>
          
          <Link
            to="/opportunities"
            onClick={(e) => handleNavigation('/opportunities', e)}
            onMouseEnter={() => handleRoutePreload('/opportunities')}
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 transform ${
              (() => {
                const state = getNavItemState('/opportunities');
                if (state.isActive) {
                  return 'bg-blue-100 text-blue-700 shadow-sm scale-[1.02]';
                } else if (state.isPending) {
                  return 'bg-blue-50 text-blue-600 shadow-sm scale-[1.01] animate-pulse';
                } else {
                  return 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]';
                }
              })()
            }`}
          >
            <div className={`flex items-center justify-center transition-all duration-300 ${
              (() => {
                const state = getNavItemState('/opportunities');
                if (state.isActive) {
                  return 'text-blue-600';
                } else if (state.isPending) {
                  return 'text-blue-500';
                } else {
                  return 'text-gray-600 group-hover:text-blue-600';
                }
              })()
            }`}>
              <Search className={`w-5 h-5 transition-transform duration-300 ${getNavItemState('/opportunities').isPending ? 'scale-110' : ''}`} />
            </div>
            {!collapsed && (
              <span className="font-medium transition-all duration-300">Opportunities</span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[10000] shadow-lg">
                Opportunities
              </div>
            )}
          </Link>
          
          <Link
            to="/trackers"
            onClick={(e) => handleNavigation('/trackers', e)}
            onMouseEnter={() => handleRoutePreload('/trackers')}
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 transform ${
              (() => {
                const state = getNavItemState('/trackers');
                if (state.isActive) {
                  return 'bg-blue-100 text-blue-700 shadow-sm scale-[1.02]';
                } else if (state.isPending) {
                  return 'bg-emerald-50 text-emerald-600 shadow-sm scale-[1.01] animate-pulse';
                } else {
                  return 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]';
                }
              })()
            }`}
          >
            <div className={`relative flex items-center justify-center transition-all duration-300 ${
              (() => {
                const state = getNavItemState('/trackers');
                if (state.isActive) {
                  return 'text-blue-600';
                } else if (state.isPending) {
                  return 'text-emerald-500';
                } else {
                  return 'text-gray-600 group-hover:text-blue-600';
                }
              })()
            }`}>
              <Bookmark className={`w-5 h-5 transition-transform duration-300 ${
                getNavItemState('/trackers').isPending ? 'scale-110 animate-pulse' : ''
              }`} />
              {/* Add Tracker Counter */}
              {pursuitCount > 0 && (
                <span className={`absolute -top-2 -right-2 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center transition-all duration-300 ${
                  getNavItemState('/trackers').isActive ? 'bg-blue-600' : 'bg-blue-500'
                }`}>
                  {pursuitCount}
                </span>
              )}
            </div>
            {!collapsed && (
              <div className="flex items-center justify-between flex-1">
                <span className="font-medium transition-all duration-300">My Tracker</span>
                {/* Add counter on the right when sidebar is expanded */}
                {pursuitCount > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full transition-all duration-300 ${
                    getNavItemState('/trackers').isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                  }`}>
                    {pursuitCount}
                  </span>
                )}
              </div>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[10000] shadow-lg">
                My Tracker {pursuitCount > 0 ? `(${pursuitCount})` : ''}
              </div>
            )}
          </Link>
          
          <Link
            to="/analytics"
            onClick={(e) => handleNavigation('/analytics', e)}
            onMouseEnter={() => handleRoutePreload('/analytics')}
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 transform ${
              (() => {
                const state = getNavItemState('/analytics');
                if (state.isActive) {
                  return 'bg-blue-100 text-blue-700 shadow-sm scale-[1.02]';
                } else if (state.isPending) {
                  return 'bg-blue-50 text-blue-600 shadow-sm scale-[1.01] animate-pulse';
                } else {
                  return 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]';
                }
              })()
            }`}
          >
            <div className={`flex items-center justify-center transition-all duration-300 ${
              (() => {
                const state = getNavItemState('/analytics');
                if (state.isActive) {
                  return 'text-blue-600';
                } else if (state.isPending) {
                  return 'text-blue-500';
                } else {
                  return 'text-gray-600 group-hover:text-blue-600';
                }
              })()
            }`}>
              <BarChart3 className={`w-5 h-5 transition-transform duration-300 ${getNavItemState('/analytics').isPending ? 'scale-110' : ''}`} />
            </div>
            {!collapsed && (
              <span className="font-medium transition-all duration-300">Analytics</span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[10000] shadow-lg">
                Analytics
              </div>
            )}
          </Link>
          
          <Link
            to="/settings"
            onClick={(e) => handleNavigation('/settings', e)}
            onMouseEnter={() => handleRoutePreload('/settings')}
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 transform ${
              (() => {
                const state = getNavItemState('/settings');
                if (state.isActive) {
                  return 'bg-blue-100 text-blue-700 shadow-sm scale-[1.02]';
                } else if (state.isPending) {
                  return 'bg-emerald-50 text-emerald-600 shadow-sm scale-[1.01] animate-pulse';
                } else {
                  return 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]';
                }
              })()
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Settings className={`w-5 h-5 transition-all duration-300 ${
                (() => {
                  const state = getNavItemState('/settings');
                  if (state.isActive) {
                    return 'text-blue-600';
                  } else if (state.isPending) {
                    return 'text-emerald-500 scale-110 animate-pulse';
                  } else {
                    return 'text-gray-600 group-hover:text-blue-600';
                  }
                })()
              }`} />
              <SettingsNotification />
            </div>
            {!collapsed && (
              <span className="font-medium transition-all duration-300">Settings</span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[10000] shadow-lg">
                Settings
              </div>
            )}
          </Link>
          
          {/* Admin Zone - Visible to all but styled differently for non-admins */}
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
                  if (!isAdmin) {
                    return 'text-gray-400 hover:bg-gray-100/50 cursor-not-allowed';
                  }
                  const state = getNavItemState('/admin');
                  if (state.isActive) {
                    return 'bg-blue-100 text-blue-700 shadow-sm scale-[1.02]';
                  } else if (state.isPending) {
                    return 'bg-blue-50 text-blue-600 shadow-sm scale-[1.01] animate-pulse';
                  } else {
                    return 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]';
                  }
                })()
              }`}
            >
              <div className="flex items-center justify-center">
                <Lock className={`w-5 h-5 transition-all duration-300 ${
                  (() => {
                    if (!isAdmin) {
                      return 'text-gray-400';
                    }
                    const state = getNavItemState('/admin');
                    if (state.isActive) {
                      return 'text-blue-600';
                    } else if (state.isPending) {
                      return 'text-blue-500 scale-110';
                    } else {
                      return 'text-gray-600 group-hover:text-blue-600';
                    }
                  })()
                }`} />
              </div>
              {!collapsed && (
                <span className="font-medium transition-all duration-300">Admin Zone</span>
              )}
              {!collapsed && !isAdmin && (
                <Lock className="w-3.5 h-3.5 ml-auto text-gray-400" />
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[10000] shadow-lg">
                  Admin Zone
                  {!isAdmin && " (Restricted)"}
                </div>
              )}
            </Link>
            
            {/* Tooltip for non-admins */}
            {!isAdmin && !collapsed && (
              <div className="absolute left-2 -bottom-2 translate-y-full w-48 bg-gray-800 text-white text-xs rounded py-1.5 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-lg">
                <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" />
                  <span>Restricted for admins only</span>
                </div>
              </div>
            )}
          </div>

          {/* Bizradar AI - Moved from bottom */}
          <Link
            to="#"
            onClick={handleOpenModal}
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 transform text-gray-700 hover:bg-gray-100 hover:scale-[1.01] mb-2`}
          >
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div className="flex items-center justify-between flex-1">
                <span className="font-medium text-blue-600">Bizradar AI</span>
              </div>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[10000] shadow-lg">
                Bizradar AI
              </div>
            )}
          </Link>
          
          {/* Theme Toggle */}
          <div className={`${collapsed ? 'flex justify-center' : 'px-3'} py-2`}>
            <ThemeToggle collapsed={collapsed} />
          </div>
        </nav>
        
        {/* Bottom Links */}
        <div className={`${collapsed ? 'px-2' : 'px-4'} pt-4 border-t border-gray-200 mt-2`}>
          {/* Subscription Button */}
          <button
            onClick={() => setUpgradeOpen(true)}
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
                  {subscriptionLoading ? 'Loading...' : 
                   currentSubscription ? `${currentSubscription.plan_type?.charAt(0).toUpperCase() + currentSubscription.plan_type?.slice(1)} Plan` : 
                   'Basic Plan'}
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
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[10000] shadow-lg">
                {subscriptionLoading ? 'Loading...' : 
                 currentSubscription ? `${currentSubscription.plan_type?.charAt(0).toUpperCase() + currentSubscription.plan_type?.slice(1)} Plan` : 
                 'Basic Plan'} <span className="ml-1 px-1 bg-blue-600 rounded text-xs">Upgrade</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Render the modals if they're open */}
      {isModalOpen && <BizradarAIModal onClose={handleCloseModal} />}
      <UpgradeModal 
        isOpen={upgradeOpen} 
        onClose={() => setUpgradeOpen(false)}
        onSuccess={() => {
          setUpgradeOpen(false);
          // Reload subscription data
          const loadSubscription = async () => {
            try {
              const subscription = await subscriptionApi.getCurrentSubscription();
              setCurrentSubscription(subscription);
            } catch (error) {
              console.error('Error reloading subscription:', error);
            }
          };
          loadSubscription();
        }}
      />
      
      {/* Add CSS animation keyframes */}
      <style>{`
        @keyframes slideRight {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default Sidebar;


