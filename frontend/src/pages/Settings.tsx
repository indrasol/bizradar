import React, { useState, useEffect, Suspense, lazy, useMemo } from "react";

import { useAuth } from "../components/Auth/useAuth";

import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import {
  Pencil,
  LogOut,
  User,
  Building,
  Mail,
  // Link,
  FileText,
  Globe,
  Clock,
  Calendar,
  PaintBucket,
  ChevronRight,
  Shield,
  Bell,
  Lock,
  Key,
  CreditCard,
  DollarSign,
  Smartphone,
  Settings as SettingsIcon,
  Fingerprint,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  BellOff,
  Megaphone,
  Zap,
  Tag,
  CreditCard as Card,
  Download,
  FileCheck,
  History,
  Plus,
  Star,
  Power,
  Link as LinkIcon,
  ExternalLink,
  Sun,
  Moon,
} from "lucide-react";

import { toast } from "sonner";

import { supabase } from "../utils/supabase";

import { profileApi, UserProfile, PersonalInfo, CompanyInfo } from "../api/profile";

import { useNavigate, Link } from "react-router-dom";

import SideBar from "../components/layout/SideBar";

import { ResponsivePatterns, DashboardTemplate } from "../utils/responsivePatterns";

import { subscriptionApi } from "@/api/subscription";

import { paymentApi } from '@/api/payment';

import { loadStripe } from '@stripe/stripe-js';

import { Elements } from '@stripe/react-stripe-js';

import PageLoadingSkeleton from "@/components/ui/PageLoadingSkeleton";

import { API_ENDPOINTS } from "@/config/apiEndpoints";
// Lazy load heavy components

const PasswordManagement = lazy(() => import("@/components/passwordmanager/PasswordManager"));

const UpdatePhoneNumber = lazy(() => import("@/components/TwoFA/UpdatePhoneNumber"));

const UpgradeModal = lazy(() => import("@/components/subscription/UpgradeModal").then(mod => ({ default: mod.UpgradeModal })));

const NotificationDropdown = lazy(() => import('@/components/notifications/NotificationDropdown').then(mod => ({ default: mod.NotificationDropdown })));

const PaymentMethodManager = lazy(() => import("@/components/payment/PaymentMethodManager"));

const StripePaymentVerifier = lazy(() => import('@/components/ui/StripePaymentVerifier'));

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);
// Global cache for settings data

const settingsCache = {
  profile: null,
  company: null,
  preferences: null,
  timestamp: 0
};

export const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Helper function to ensure URL has proper protocol
  const formatUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };
  const [userProfile, setUserProfile] = useState(null);
  const [userCompany, setUserCompany] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressiveLoading, setProgressiveLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [backgroundRefresh, setBackgroundRefresh] = useState(false);
  // Add state for active tab with persistence
  const [activeTab, setActiveTab] = useState(() => {
    // Try to restore from sessionStorage
    const savedTab = sessionStorage.getItem("settingsActiveTab");
    return savedTab || "Account";
  });
  // Edit states
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    url: "",
    description: "",
    role: "",
  });
  const [preferences, setPreferences] = useState({
    language: "English (US)",
    time_zone: "Eastern Time (US & Canada)",
    date_format: "MM/DD/YYYY",
  });
  // Add state for security settings
  const [securityInfo, setSecurityInfo] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
  });
  // Add state for security settings
  const [securityPhoneInfo, setSecurityPhoneInfo] = useState({
    phoneNumber: "",
    phoneVerified: false
  });
  // Add state for notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    newOpportunityAlerts: true,
    weeklyReports: true,
    marketingEmails: false,
    systemAnnouncements: true,
    opportunityMatches: true,
    deadlineReminders: true,
    systemAnnouncementsInApp: true,
    teamCollaboration: true,
    statusChanges: true,
    upcomingDeadlines: true
  });
  // Add state for billing information
  const [billingInfo, setBillingInfo] = useState({
    plan: "",
    billingCycle: "",
    nextBillingDate: "",
    paymentMethod: {
      type: "",
      last4: "",
      expiryDate: "",
    },
  });
  // Invoices state
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState<boolean>(false);
  // Tax info state
  const [taxInfo, setTaxInfo] = useState<{ ein: string; billingAddress: string; country: string }>({
    ein: "",
    billingAddress: "",
    country: "",
  });
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        if (!user?.id) return;
        setIsLoadingInvoices(true);
        const data = await paymentApi.listInvoices(user.id);
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load invoices", err);
        setInvoices([]);
      } finally {
        setIsLoadingInvoices(false);
      }
    };
    fetchInvoices();
  }, [user?.id]);
  // Add state for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  // Subscription state
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);



  // --- Add state for backup codes and recent devices ---
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [recentDevices, setRecentDevices] = useState<any[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [codesLoading, setCodesLoading] = useState(false);
  // Add at the top, after other useState declarations
  const [showContactSalesModal, setShowContactSalesModal] = useState(false);
  // Fetch backup codes and recent devices from Supabase
  const fetchSecurityExtras = async () => {
    if (!user) return;
    setDevicesLoading(true);
    setCodesLoading(true);
    
    // Security features removed - using Supabase Auth built-in security only
    console.log('Security extras disabled - relying on Supabase Auth built-in features');
    
    // Set empty defaults since we're not using custom security tables
    setBackupCodes([]);
    setRecentDevices([]);
    
    setDevicesLoading(false);
    setCodesLoading(false);
  };
  useEffect(() => {
    if (user) fetchSecurityExtras();
  }, [user]);
  // --- Backup code generation disabled ---
  const generateBackupCodes = async () => {
    if (!user) return;
    
    // Backup codes feature disabled - using Supabase Auth built-in recovery methods
    toast.info('Backup codes feature disabled. Use Supabase Auth built-in password reset for account recovery.', ResponsivePatterns.toast.config);
  };
  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Backup codes copied to clipboard!', ResponsivePatterns.toast.config);
  };
  const handleDownloadBackupCodes = () => {
    const element = document.createElement('a');
    const file = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'bizradar-backup-codes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Backup codes downloaded!', ResponsivePatterns.toast.config);
  };
  // --- Device management disabled ---
  const handleRemoveDevice = async (id: string) => {
    if (!user) return;
    
    // Device management disabled - using Supabase Auth built-in session management
    toast.info('Device management disabled. Use Supabase Auth dashboard to manage sessions.', ResponsivePatterns.toast.config);
  };
  // Fetch current subscription
  const loadCurrentSubscription = async () => {
    setSubLoading(true);
    try {
      const sub = await subscriptionApi.getCurrentSubscription();
      setCurrentSubscription(sub);
    } catch (err) {
      setCurrentSubscription(null);
    } finally {
      setSubLoading(false);
    }
  };
  // Fetch available plans
  const loadAvailablePlans = async () => {
    try {
      const plans = await subscriptionApi.getAvailablePlans();
      setAvailablePlans(plans);
    } catch (err) {
      setAvailablePlans([]);
    }
  };


  const loadBillingHistory = async () => {
    try {
      if (!user) return;
      const res = await fetch(API_ENDPOINTS.BILLING_HISTORY(user.id));
      if (!res.ok) throw new Error('Failed to fetch billing history');
      const data = await res.json();
      setBillingHistory(Array.isArray(data.invoices) ? data.invoices : []);
    } catch (e) {
      setBillingHistory([]);
    }
  };

  useEffect(() => {
    loadCurrentSubscription();
    loadAvailablePlans();
    loadBillingHistory();
    const onUpdated = () => {
      loadCurrentSubscription();
      loadBillingHistory();
    };
    window.addEventListener('subscription-updated', onUpdated);
    return () => window.removeEventListener('subscription-updated', onUpdated);
  }, []);
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logging out...", ResponsivePatterns.toast.config);
      navigate("/logout");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("There was a problem logging out", ResponsivePatterns.toast.config);
    }
  };
  // Fetch user data with caching and progressive loading
  const fetchUserData = async (forceRefresh = false) => {
    if (!user) return;
    // Start progressive loading
    setProgressiveLoading(true);
    
    try {
      // Check if we have cached data and it's still valid (less than 5 minutes old)
      const now = Date.now();
      const cacheValid = 
        !forceRefresh && 
        settingsCache.profile && 
        settingsCache.company && 
        settingsCache.preferences && 
        now - settingsCache.timestamp < 5 * 60 * 1000;
      
      // If we have valid cached data, use it immediately
      if (cacheValid) {
        console.log("Using cached settings data");
        setUserProfile(settingsCache.profile);
        setUserCompany(settingsCache.company);
        setUserPreferences(settingsCache.preferences);
        
        // Set form data from cache (handle both old and new profile format)
        const profileData = settingsCache.profile;
        if (profileData) {
          setPersonalInfo({
            first_name: profileData.personal_info?.first_name || profileData.first_name || "",
            last_name: profileData.personal_info?.last_name || profileData.last_name || "",
            email: profileData.personal_info?.email || profileData.email || "",
          });
        }
        
        // Set security phone info from cache (handle both old and new profile format)
        if (profileData) {
          setSecurityPhoneInfo(prev => ({
            ...prev,
            phoneNumber: profileData.personal_info?.phone_number || profileData.phone_number || '',
            phoneVerified: profileData.personal_info?.phone_verified || profileData.phone_verified || false
          }));
        }
        
        // Set company info from cache (prioritize profile data, fallback to legacy company data)
        const cachedProfileData = settingsCache.profile;
        if (cachedProfileData?.company_info) {
          setCompanyInfo({
            name: cachedProfileData.company_info.company_name || "",
            url: cachedProfileData.company_info.company_url || "",
            description: cachedProfileData.company_info.company_description || "",
            role: cachedProfileData.company_info.role || "",
          });
        } else if (settingsCache.company) {
          setCompanyInfo({
            name: settingsCache.company.name || "",
            url: settingsCache.company.url || "",
            description: settingsCache.company.description || "",
            role: settingsCache.company.role || "",
          });
        }
        
        // End progressive loading since we have data to show
        setProgressiveLoading(false);
        
        // If this is the first load, mark it as complete
        if (!initialLoadComplete) {
          setInitialLoadComplete(true);
        }
        
        // Set background refresh
        setBackgroundRefresh(true);
      } else {
        // No valid cache, show loading state
        setLoading(true);
      }
      
      // Always fetch fresh data from the server (in background if we have cache)
      // Fetch user profile using new robust API
      try {
        const profileData = await profileApi.getUserProfile(user.id);
        
        // Update cache
        settingsCache.profile = profileData;
        settingsCache.timestamp = now;
        
        // Update state
        setUserProfile(profileData);
        setPersonalInfo({
          first_name: profileData.personal_info.first_name || "",
          last_name: profileData.personal_info.last_name || "",
          email: profileData.personal_info.email || "",
        });
        
        // Update security info with phone number
        setSecurityPhoneInfo(prev => ({
          ...prev,
          phoneNumber: profileData.personal_info.phone_number || '',
          phoneVerified: profileData.personal_info.phone_verified || false
        }));
        
        // Update company info from profile data
        if (profileData.company_info) {
          setCompanyInfo({
            name: profileData.company_info.company_name || "",
            url: profileData.company_info.company_url || "",
            description: profileData.company_info.company_description || "",
            role: profileData.company_info.role || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Continue with existing cached data or defaults
      }
      // Security settings disabled - using Supabase Auth built-in security
      console.log("Custom security settings disabled - using Supabase Auth defaults");
      setSecurityInfo({
        twoFactorEnabled: false, // Managed by Supabase Auth
        loginNotifications: true, // Default enabled
      });
      // Fetch user's primary company
      const { data: userCompanyData, error: userCompanyError } =
        await supabase
          .from("user_companies")
          .select("*")
          .eq("user_id", user.id);
      if (
        !userCompanyError &&
        userCompanyData &&
        userCompanyData.length > 0
      ) {
        // Get primary company or first one
        const primaryCompany =
          userCompanyData.find((c) => c.is_primary) || userCompanyData[0];
        // Fetch the company details
        const { data: companyDetails, error: companyDetailsError } =
          await supabase
            .from("companies")
            .select("*")
            .eq("id", primaryCompany.company_id)
            .single();
        if (!companyDetailsError && companyDetails) {
          const company = {
            id: companyDetails.id,
            name: companyDetails.name || "",
            url: companyDetails.url || "",
            description: companyDetails.description || "",
            role: primaryCompany.role || "",
            is_primary: primaryCompany.is_primary || true,
          };
          // Update cache
          settingsCache.company = company;
          
          // Update state
          setUserCompany(company);
          setCompanyInfo({
            name: company.name,
            url: company.url || "",
            description: company.description || "",
            role: company.role || "",
          });
          // Save to sessionStorage for use in recommendations
          if (company.description) {
            sessionStorage.setItem(
              "userProfile",
              JSON.stringify({
                companyUrl: company.url || "",
                companyDescription: company.description,
              })
            );
            console.log("Saved user profile to sessionStorage on load");
          }
        }
      }
      // Fetch user preferences (DISABLED - table not available)
      // try {
      //   const { data: preferencesData, error: preferencesError } =
      //     await supabase
      //       .from("user_preferences")
      //       .select("*")
      //       .eq("user_id", user.id)
      //       .single();
      //   if (!preferencesError && preferencesData) {
      //     // Update cache
      //     settingsCache.preferences = preferencesData;
          
      //     // Update state
      //     setUserPreferences(preferencesData);
      //     setPreferences({
      //       language: preferencesData.language || "English (US)",
      //       time_zone:
      //         preferencesData.time_zone || "Eastern Time (US & Canada)",
      //       date_format: preferencesData.date_format || "MM/DD/YYYY",
      //       theme: preferencesData.theme || "Light",
      //     });
      //   }
      // } catch (error) {
      //   console.warn("User preferences table not available, using defaults:", error);
        setPreferences({
          language: "English (US)",
          time_zone: "Eastern Time (US & Canada)",
          date_format: "MM/DD/YYYY",
        });
      // }
      // Fetch notification settings (DISABLED - table not available)
      // try {
      //   const { data: notificationData, error: notificationError } =
      //     await supabase
      //       .from("user_notifications")
      //       .select("*")
      //       .eq("user_id", user.id)
      //       .single();
      //   if (!notificationError && notificationData) {
      //     setNotificationSettings({
      //       emailNotifications: notificationData.email_notifications ?? true,
      //       smsNotifications: notificationData.sms_notifications ?? false,
      //       newOpportunityAlerts: notificationData.new_opportunity_alerts ?? true,
      //       weeklyReports: notificationData.weekly_reports ?? true,
      //       marketingEmails: notificationData.marketing_emails ?? false,
      //       systemAnnouncements: notificationData.system_announcements ?? true,
      //       opportunityMatches: notificationData.opportunity_matches ?? true,
      //       deadlineReminders: notificationData.deadline_reminders ?? true,
      //       systemAnnouncementsInApp: notificationData.system_announcements_in_app ?? true,
      //       teamCollaboration: notificationData.team_collaboration ?? true,
      //       statusChanges: notificationData.status_changes ?? true,
      //       upcomingDeadlines: notificationData.upcoming_deadlines ?? true,
      //     });
      //   }
      // } catch (error) {
      //   console.warn("Notification settings table not available, using defaults:", error);
        setNotificationSettings({
          emailNotifications: true,
          smsNotifications: false,
          newOpportunityAlerts: true,
          weeklyReports: true,
          marketingEmails: false,
          systemAnnouncements: true,
          opportunityMatches: true,
          deadlineReminders: true,
          systemAnnouncementsInApp: true,
          teamCollaboration: true,
          statusChanges: true,
          upcomingDeadlines: true,
        });
      // }
      
      // Mark initial load as complete
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data", ResponsivePatterns.toast.config);
    } finally {
      setLoading(false);
      setProgressiveLoading(false);
      setBackgroundRefresh(false);
    }
  };
  // Fetch user data on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);
  // Update handlers
  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      // Update profile using new robust API
      await profileApi.updatePersonalInfo(user.id, {
        first_name: personalInfo.first_name,
        last_name: personalInfo.last_name,
      });
      // Update company information using profile API
      await profileApi.updateCompanyInfo(user.id, {
        company_name: companyInfo.name,
        company_url: companyInfo.url,
        company_description: companyInfo.description,
        role: companyInfo.role,
      });
      // Generate company markdown if URL is provided
      if (companyInfo.url) {
        try {
          const response = await fetch(
            API_ENDPOINTS.GENERATE_COMPANY_MARKDOWN,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ companyUrl: companyInfo.url }),
            }
          );
          const result = await response.json();
          if (response.ok) {
            toast.success("Company website scraped and markdown generated.");
            console.log("Scrape result:", result);
            // Update company with markdown if successful
            if (userCompany?.id) {
              const { error: markdownError } = await supabase
                .from("companies")
                .update({
                  markdown_content: result.markdown,
                })
                .eq("id", userCompany.id);
              if (markdownError) {
                console.error("Error updating markdown:", markdownError);
                toast.error("Failed to save company markdown");
              }
            }
          } else {
            console.error("Scrape error:", result);
            toast.error(
              "Scraping failed: " + (result.detail || "Unknown error")
            );
          }
        } catch (err) {
          console.error("Network error calling scraper:", err);
          toast.error("Could not reach scraper service");
        }
      }
      // Save to sessionStorage for use in recommendations
      if (!companyInfo.description) {
        console.warn(
          "No company description provided, skipping sessionStorage update"
        );
        toast.warning(
          "Please provide a company description to enable AI recommendations"
        );
      } else {
        sessionStorage.setItem(
          "userProfile",
          JSON.stringify({
            companyUrl: companyInfo.url || "",
            companyDescription: companyInfo.description,
          })
        );
        console.log("Saved user profile to sessionStorage");
      }
      toast.success("Personal information updated successfully");
      setEditingPersonal(false);
      // Reload to reflect updated company info
      window.location.reload();
    } catch (error) {
      console.error("Error updating personal information:", error);
      toast.error("Failed to update personal information");
    }
  };
  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      // Update or create preferences (DISABLED - table not available)
      // try {
      //   const { error } = await supabase.from("user_preferences")
      //   .upsert(
      //     {
      //     user_id: user.id,
      //     language: preferences.language,
      //     time_zone: preferences.time_zone,
      //     date_format: preferences.date_format,
      //     theme: preferences.theme,
      //   },
      //   { onConflict: 'user_id' }
      // );
      //   if (error) throw error;
      // } catch (dbError) {
      //   console.warn("User preferences table not available, settings not saved:", dbError);
      //   // Continue without error - settings will be lost on refresh but UI still works
      // }
      toast.success("Preferences updated successfully");
      setEditingPreferences(false);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
    }
  };
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("company_")) {
      // Handle company fields
      const companyField = name.replace("company_", "");
      setCompanyInfo({ ...companyInfo, [companyField]: value });
    } else {
      // Handle personal fields
      setPersonalInfo({ ...personalInfo, [name]: value });
    }
  };
  const handlePreferencesChange = (e) => {
    const { name, value } = e.target;
    setPreferences({ ...preferences, [name]: value });
  };
  // Handle security settings change
  const handleSecurityChange = async (setting, value) => {
    if (!user) return;
    try {
      let colName: string = 'two_factor_enabled';
      switch (setting) {
        case 'loginNotifications':
          colName = 'login_notifications';
          break;
        case 'twoFactorEnabled':
          colName = 'two_factor_enabled';
          break;
        default:
          break;
      }
      // Security settings updates disabled - using Supabase Auth built-in features
      console.log("Security setting update disabled:", setting, "=", value);
      setSecurityInfo((prev) => ({
        ...prev,
        [setting]: value,
      }));
      toast.success("Security settings updated successfully");
    } catch (error) {
      console.error("Error updating security settings:", error);
      toast.error("Failed to update security settings");
    }
  };
  // Handle notification settings change
  const handleNotificationChange = async (setting, value) => {
    if (!user) return;
    try {
      let colName: string = 'two_factor_enabled';
      switch (setting) {
        case 'emailNotifications':
          colName = 'email_notifications';
          break;
        case 'smsNotifications':
          colName = 'sms_notifications';
          break;
        case 'newOpportunityAlerts':
          colName = 'new_opportunity_alerts';
          break;
        case 'weeklyReports':
          colName = 'weekly_reports';
          break;
        case 'marketingEmails':
          colName = 'marketing_emails';
          break;
        case 'systemAnnouncements':
          colName = 'system_announcements';
          break;
        case 'opportunityMatches':
          colName = 'opporunity_matches';
          break;
        case 'deadlineReminders':
          colName = 'deadline_reminders';
          break;
        case 'systemAnnouncementsInApp':
          colName = 'system_announcements_in_app';
          break;
        case 'teamCollaboration':
          colName = 'team_collaboration';
          break;
        case 'statusChanges':
          colName = 'status_changes';
          break;
        case 'upcomingDeadlines':
          colName = 'upcoming_deadlines';
          break;
        default:
          break;
      }
      // DISABLED - table not available
      // try {
      //   const { error } = await supabase
      //     .from("user_notifications")
      //     .upsert({
      //       user_id: user.id,
      //       [colName]: value,
      //     },
      //       {
      //         onConflict: 'user_id'
      //       }
      //     );
      //   if (error) throw error;
      // } catch (dbError) {
      //   console.warn("User notifications table not available, settings not saved:", dbError);
      //   // Continue without error - settings will be lost on refresh but UI still works
      // }
      setNotificationSettings((prev) => ({
        ...prev,
        [setting]: value,
      }));
      toast.success("Notification settings updated successfully");
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update notification settings");
    }
  };
  // Handle updating card information
  const handleUpdateCard = () => {
    toast.success("Payment method updated successfully");
  };
  // Handle changing subscription plan
  const handleChangePlan = () => {
    toast.success("You will be redirected to the subscription page");
  };
  const handleUpgradeSuccess = () => {
    setUpgradeOpen(false);
    toast.success('Your subscription has been upgraded successfully!');
    loadCurrentSubscription();
    setRefreshKey(k => k + 1);
  };
  // Cancel subscription handler
  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription? This action cannot be undone.")) return;
    setCancelLoading(true);
    try {
      await subscriptionApi.cancelSubscription();
      toast.success("Subscription cancelled successfully.");
      loadCurrentSubscription();
      setRefreshKey(k => k + 1);
    } catch (err) {
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };
  // Display progressive loading state
  if (progressiveLoading && !initialLoadComplete) {
    return (
      <div className={DashboardTemplate.wrapper}>
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Component */}
          <SideBar />
          
          {/* Main Content with Skeleton */}
          <div className={DashboardTemplate.main}>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <PageLoadingSkeleton type="settings" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`${DashboardTemplate.wrapper} bg-background text-foreground`}>
      <Suspense fallback={null}>
        <StripePaymentVerifier />
      </Suspense>
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Component */}
        <SideBar />
        {/* Main Content */}
        <div className={DashboardTemplate.main}>
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
            <div className="w-full max-w-full mx-auto">
              {/* Background refresh indicator */}
              {backgroundRefresh && (
                <div className="fixed top-0 right-0 mt-2 mr-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-gray-600 flex items-center gap-1 shadow-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Refreshing...
                </div>
              )}
              
              {/* Page Header - moved to top for seamless UI */}
              <div className="flex items-center mb-6 bg-card rounded-xl p-6 shadow-sm border border-border">
                <div className="mr-6 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                  <SettingsIcon className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Account Settings
                  </h1>
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <SettingsIcon className="h-4 w-4 mr-1 text-blue-500" />
                    <span>Manage your profile, company information, and preferences</span>
                  </div>
                </div>
              </div>
              {/* Settings Navigation Tabs */}
              <div className="flex border-b border-border mb-6">
                <button
                  className={`px-4 py-2 ${activeTab === "Account"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                  onClick={() => {
                    setActiveTab("Account");
                    sessionStorage.setItem("settingsActiveTab", "Account");
                  }}
                >
                  Account
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === "Notifications"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                  onClick={() => {
                    setActiveTab("Notifications");
                    sessionStorage.setItem("settingsActiveTab", "Notifications");
                  }}
                >
                  Notifications
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === "Billing"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                  onClick={() => {
                    setActiveTab("Billing");
                    sessionStorage.setItem("settingsActiveTab", "Billing");
                  }}
                >
                  Billing
                </button>
              </div>
              {/* Account Tab Content */}
              {activeTab === "Account" && (
                <>
                  {/* Personal Information Section */}
                  <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <User className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Personal Information
                        </h3>
                      </div>
                      {!editingPersonal ? (
                        <button
                          className="text-blue-500 hover:text-blue-700 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                          onClick={() => setEditingPersonal(true)}
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Edit Profile</span>
                        </button>
                      ) : null}
                    </div>
                    {editingPersonal ? (
                      <form onSubmit={handlePersonalSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <label
                              htmlFor="first_name"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              First Name
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={personalInfo.first_name}
                                onChange={handlePersonalChange}
                                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Your first name"
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor="last_name"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Last Name
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={personalInfo.last_name}
                                onChange={handlePersonalChange}
                                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Your last name"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mb-6">
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Email
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={personalInfo.email}
                              disabled
                              className="pl-10 w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500"
                              placeholder="Your email address"
                            />
                          </div>
                        </div>
                        <div className="border-t border-gray-100 pt-6 mt-6">
                          <h4 className="text-lg font-medium text-gray-800 mb-4">
                            Company Information
                          </h4>
                          <div className="mb-6">
                            <label
                              htmlFor="company_name"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Company Name
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Building className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                id="company_name"
                                name="company_name"
                                value={companyInfo.name}
                                onChange={handlePersonalChange}
                                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Company name"
                              />
                            </div>
                          </div>
                          <div className="mb-6">
                            <label
                              htmlFor="company_role"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Your Role
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                id="company_role"
                                name="company_role"
                                value={companyInfo.role}
                                onChange={handlePersonalChange}
                                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Your role"
                              />
                            </div>
                          </div>
                          <div className="mb-6">
                            <label
                              htmlFor="company_url"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Company URL
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LinkIcon className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="url"
                                id="company_url"
                                name="company_url"
                                value={companyInfo.url}
                                onChange={handlePersonalChange}
                                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="https://example.com"
                              />
                            </div>
                          </div>
                          <div className="mb-6">
                            <label
                              htmlFor="company_description"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Company Description
                            </label>
                            <div className="relative">
                              <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                                <FileText className="h-5 w-5 text-gray-400" />
                              </div>
                              <textarea
                                id="company_description"
                                name="company_description"
                                value={companyInfo.description}
                                onChange={handlePersonalChange}
                                rows={4}
                                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="A short description of your company"
                              ></textarea>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setEditingPersonal(false)}
                            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow transition-all"
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-8">
                          <div className="flex-1 space-y-6">
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Personal Details
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0 bg-blue-50 p-2 rounded-lg">
                                    <User className="w-5 h-5 text-blue-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      Full Name
                                    </p>
                                    <p className="font-medium text-gray-900">
                                      {userProfile?.personal_info?.full_name || 
                                       `${userProfile?.personal_info?.first_name || ''} ${userProfile?.personal_info?.last_name || ''}`.trim() || 
                                       'Not set'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0 bg-blue-50 p-2 rounded-lg">
                                    <Mail className="w-5 h-5 text-blue-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      Email
                                    </p>
                                    <p className="font-medium text-gray-900">
                                      {userProfile?.personal_info?.email || 'Not set'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="border-t border-gray-100 pt-6">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Company Information
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0 bg-blue-50 p-2 rounded-lg">
                                    <Building className="w-5 h-5 text-blue-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      Company
                                    </p>
                                    <p className="font-medium text-gray-900">
                                      {userProfile?.company_info?.company_name || userCompany?.name || "Not set"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0 bg-blue-50 p-2 rounded-lg">
                                    <User className="w-5 h-5 text-blue-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      Role
                                    </p>
                                    <p className="font-medium text-gray-900">
                                      {userProfile?.company_info?.role || userCompany?.role || "Not set"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3 col-span-2">
                                  <div className="flex-shrink-0 bg-blue-50 p-2 rounded-lg">
                                    <LinkIcon className="w-5 h-5 text-blue-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      Website
                                    </p>
                                    {(userProfile?.company_info?.company_url || userCompany?.url) ? (
                                      <a
                                        href={formatUrl(userProfile?.company_info?.company_url || userCompany?.url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors inline-flex items-center gap-1"
                                      >
                                        {userProfile?.company_info?.company_url || userCompany?.url}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ) : (
                                      <p className="font-medium text-gray-900">Not set</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {(userProfile?.company_info?.company_description || userCompany?.description) && (
                              <div className="border-t border-gray-100 pt-6">
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0 bg-blue-50 p-2 rounded-lg mt-1">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500 mb-2">
                                      Company Description
                                    </p>
                                    <p className="text-gray-700">
                                      {userProfile?.company_info?.company_description || userCompany?.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Account Preferences Section */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Globe className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Account Preferences
                        </h3>
                      </div>
                      {!editingPreferences ? (
                        <button
                          className="text-blue-500 hover:text-blue-700 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                          onClick={() => setEditingPreferences(true)}
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Edit Preferences</span>
                        </button>
                      ) : null}
                    </div>
                    {editingPreferences ? (
                      <form onSubmit={handlePreferencesSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <label
                              htmlFor="language"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Language
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Globe className="h-5 w-5 text-gray-400" />
                              </div>
                              <select
                                id="language"
                                name="language"
                                value={preferences.language}
                                onChange={handlePreferencesChange}
                                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
                              >
                                <option value="English (US)">
                                  English (US)
                                </option>
                                <option value="Spanish">Spanish</option>
                                <option value="French">French</option>
                                <option value="German">German</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                <svg
                                  className="h-5 w-5 text-gray-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor="time_zone"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Time Zone
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Clock className="h-5 w-5 text-gray-400" />
                              </div>
                              <select
                                id="time_zone"
                                name="time_zone"
                                value={preferences.time_zone}
                                onChange={handlePreferencesChange}
                                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
                              >
                                <option value="Eastern Time (US & Canada)">
                                  Eastern Time (US & Canada)
                                </option>
                                <option value="Central Time (US & Canada)">
                                  Central Time (US & Canada)
                                </option>
                                <option value="Pacific Time (US & Canada)">
                                  Pacific Time (US & Canada)
                                </option>
                                <option value="UTC">UTC</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                <svg
                                  className="h-5 w-5 text-gray-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <label
                              htmlFor="date_format"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Date Format
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-5 w-5 text-gray-400" />
                              </div>
                              <select
                                id="date_format"
                                name="date_format"
                                value={preferences.date_format}
                                onChange={handlePreferencesChange}
                                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
                              >
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                <svg
                                  className="h-5 w-5 text-gray-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setEditingPreferences(false)}
                            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow transition-all"
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 bg-blue-50 p-2 rounded-lg">
                              <Globe className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Language</p>
                              <p className="font-medium text-gray-900">
                                {userPreferences?.language || "English (US)"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 bg-blue-50 p-2 rounded-lg">
                              <Clock className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Time Zone</p>
                              <p className="font-medium text-gray-900">
                                {userPreferences?.time_zone ||
                                  "Eastern Time (US & Canada)"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 bg-blue-50 p-2 rounded-lg">
                              <Calendar className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                Date Format
                              </p>
                              <p className="font-medium text-gray-900">
                                {userPreferences?.date_format || "MM/DD/YYYY"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 bg-blue-50 p-2 rounded-lg">
                              <PaintBucket className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="flex-1">
                              <ThemeToggle />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              {/* Notifications Tab Content */}
              {activeTab === "Notifications" && (
                <div className="flex items-center justify-center min-h-[600px]">
                  <div className="text-center max-w-md mx-auto">
                    {/* Animated Bell Icon */}
                    <div className="relative mb-8">
                      <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-4 animate-pulse">
                        <Bell className="w-12 h-12 text-blue-600" />
                      </div>
                      {/* Notification dots */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                        <span className="text-white text-xs font-bold">3</span>
                      </div>
                    </div>
                    {/* Coming Soon Badge */}
                    <div 
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium mb-6 shadow-md hover:shadow-lg transition-all" 
                      style={{ 
                        background: 'linear-gradient(to right, #2563eb, #9333ea)',
                        color: '#ffffff'
                      }}
                    >
                      <Zap className="w-4 h-4" style={{ color: '#ffffff', fill: '#ffffff' }} />
                      <span style={{ color: '#ffffff' }}>Coming Soon</span>
                    </div>
                    {/* Main Heading */}
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Notification Center
                    </h2>
                    
                    {/* Description */}
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      We're building an amazing notification system to keep you updated on opportunities, deadlines, and important updates. Stay tuned!
                    </p>
                    {/* Feature Preview Cards */}
                    <div className="grid grid-cols-1 gap-4 mb-8">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900">Email Notifications</h4>
                          <p className="text-sm text-gray-500">Get notified about new opportunities and updates</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900">SMS Alerts</h4>
                          <p className="text-sm text-gray-500">Urgent notifications for time-sensitive opportunities</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Bell className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900">In-App Notifications</h4>
                          <p className="text-sm text-gray-500">Real-time updates while using BizRadar</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900">Deadline Reminders</h4>
                          <p className="text-sm text-gray-500">Never miss an important submission deadline</p>
                        </div>
                      </div>
                    </div>
                    {/* Call to Action */}
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                      <h3 className="font-semibold text-gray-900 mb-2">Want to be notified when it's ready?</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        We'll send you an email as soon as notification settings are available.
                      </p>
                      <button 
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg" 
                        style={{ 
                          background: 'linear-gradient(to right, #2563eb, #9333ea)',
                          color: '#ffffff'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(to right, #1d4ed8, #7e22ce)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #9333ea)';
                        }}
                      >
                        <Megaphone className="w-4 h-4" style={{ color: '#ffffff', fill: '#ffffff' }} />
                        <span style={{ color: '#ffffff' }}>Notify Me</span>
                      </button>
                    </div>
                    {/* Progress Indicator */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        </div>
                        <span>Development in progress</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Billing Tab Content */}
              {activeTab === "Billing" && (
                <>
                  {/* Current Plan Section */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Zap className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Current Subscription
                        </h3>
                      </div>
                    </div>
                    <div className="p-6">
                      {subLoading ? (
                        <div className="mb-4">Loading your current subscription...</div>
                      ) : currentSubscription ? (
                        // Map plan_type to plan details
                        (() => {
                          const plan = availablePlans.find(p => p.type === currentSubscription.plan_type);
                          return (
                            <div className="p-5 border border-gray-200 rounded-lg bg-gray-50">
                              <div className="mb-4">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                                    {plan ? plan.name : currentSubscription.plan_type}
                                  </div>
                                  <span className="text-green-600 text-sm font-medium">
                                    {currentSubscription.status || 'Active'}
                                  </span>
                                </div>
                                <p className="text-blue-600 font-medium text-lg">
                                  {plan ? `$${plan.price}/month` : ''}
                                </p>
                                {plan && (
                                  <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>
                                  Next billing: {currentSubscription.endDate ? new Date(currentSubscription.endDate).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <div className="space-y-3 mb-6">
                                {plan && plan.features.map((feature, idx) => (
                                  <div className="flex items-start gap-2" key={idx}>
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-600 text-sm">{feature}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => setUpgradeOpen(true)}
                                  className="flex-1 text-center text-sm font-medium px-4 py-2 border border-blue-300 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  Change Plan
                                </button>
                                <button
                                  onClick={handleCancelSubscription}
                                  disabled={cancelLoading}
                                  className="flex-1 text-center text-sm font-medium px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                  {cancelLoading ? 'Cancelling...' : 'Cancel Subscription'}
                                </button>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="mb-4 p-3 bg-gray-50 text-gray-700 rounded-md">
                          No active subscription found.
                          <button
                            onClick={() => setUpgradeOpen(true)}
                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Subscribe Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Enterprise Upgrade Section */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Enterprise Plan
                        </h3>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                        Upgrade Available
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg text-white p-6">
                        <h4 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Need More Features?</h4>
                        <p className="mb-6 text-sm" style={{ color: '#60a5fa' }}>
                          Upgrade to our Enterprise plan for additional features and unlimited access to take your business to the next level.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            className="flex-1 bg-white text-blue-600 font-medium rounded-lg py-3 px-4 hover:bg-blue-50 transition-colors"
                            onClick={() => setShowContactSalesModal(true)}
                          >
                            Contact Sales Team
                          </button>
                          <button
                            className="flex-1 bg-blue-500 text-white font-medium rounded-lg py-3 px-4 hover:bg-blue-400 transition-colors border border-blue-400"
                            onClick={() => setUpgradeOpen(true)}
                          >
                            View All Plans
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Payment Method Section */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <CreditCard className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Payment Method
                        </h3>
                      </div>
                      <button
                        onClick={handleUpdateCard}
                        className="text-blue-500 hover:text-blue-700 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        <span>Update</span>
                      </button>
                    </div>
                    <div className="p-6">
                      <PaymentMethodManager />
                    </div>
                  </div>
                  {/* Billing History Section */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <History className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Billing History
                        </h3>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="overflow-x-auto">

                        {billingHistory.length === 0 ? (
                          <div className="text-sm text-gray-500">No billing history found.</div>
                        ) : (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {billingHistory.map((inv) => (
                                <tr key={inv.id}>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.number || inv.id}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{inv.created ? new Date(inv.created * 1000).toLocaleDateString() : 'N/A'}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${((inv.amount_paid ?? inv.amount_due ?? 0) / 100).toFixed(2)}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{inv.status || 'paid'}</span>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {inv.invoice_pdf ? (
                                      <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                                        <Download className="h-4 w-4" />
                                        <span>PDF</span>
                                      </a>
                                    ) : inv.hosted_invoice_url ? (
                                      <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                                        <Download className="h-4 w-4" />
                                        <span>View</span>
                                      </a>
                                    ) : null}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Tax Information Section */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <FileCheck className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Tax Information
                        </h3>
                      </div>
                      <button className="text-blue-500 hover:text-blue-700 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                        <Pencil className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Business Name
                          </p>
                          <p className="font-medium text-gray-800">
                            {companyInfo.name || "Not set"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Tax ID / EIN
                          </p>
                          <p className="font-medium text-gray-800">
                            {taxInfo.ein || "Not set"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Billing Address
                          </p>
                          <p className="font-medium text-gray-800">
                            {taxInfo.billingAddress || "Not set"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Country / Region
                          </p>
                          <p className="font-medium text-gray-800">
                            {taxInfo.country || "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Phone Update Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Update Phone Number</h3>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <UpdatePhoneNumber
              onSuccess={(phone) => {
                setSecurityPhoneInfo(prev => ({
                  ...prev,
                  phoneNumber: phone,
                  phoneVerified: true
                }));
                setShowPhoneModal(false);
              }}
            />
          </div>
        </div>
      )}
      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onSuccess={handleUpgradeSuccess}
        refreshKey={refreshKey}
      />
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Your Backup Codes</h3>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-2 text-gray-600 text-sm">Store these codes in a safe place. Each code can be used once to access your account if you lose access to your phone.</p>
            <p className="mb-4 text-amber-600 text-xs font-semibold">Note: For security, backup codes can only be generated once. If you lose them, you will not be able to generate new codes and must contact support.</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="bg-gray-100 rounded px-3 py-2 font-mono text-center text-lg tracking-widest">{code}</div>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={handleCopyBackupCodes} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Copy</button>
              <button onClick={handleDownloadBackupCodes} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Download</button>
            </div>
          </div>
        </div>
      )}
      {showContactSalesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Contact Sales</h3>
              <button
                onClick={() => setShowContactSalesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ContactSalesModal onClose={() => setShowContactSalesModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

const ContactSalesModal = ({ onClose }) => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Here you would send the form data to your backend or email service
    setTimeout(() => {
      toast.success('Your message has been sent! Our sales team will contact you soon.');
      setSubmitting(false);
      onClose();
    }, 1000);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-700 bg-white shadow-md hover:border-blue-600 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-700 bg-white shadow-md hover:border-blue-600 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          required
          rows={4}
          className="w-full px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-700 bg-white shadow-md hover:border-blue-600 transition-colors resize-vertical"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={submitting}
        >
          {submitting ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
};

export default Settings;