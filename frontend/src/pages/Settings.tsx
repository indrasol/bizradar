import React, { useState, useEffect } from "react";
import { useAuth } from "../components/Auth/useAuth";
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../utils/supabase";
import { useNavigate, Link } from "react-router-dom";
import SideBar from "../components/layout/SideBar";
import PasswordManagement from "@/components/passwordmanager/PasswordManager";
import UpdatePhoneNumber from "@/components/TwoFA/UpdatePhoneNumber";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { subscriptionApi } from "@/api/subscription";
import { paymentApi } from '@/api/payment';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import PaymentMethodManager from "@/components/payment/PaymentMethodManager";
import StripePaymentVerifier from '@/components/ui/StripePaymentVerifier';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [userCompany, setUserCompany] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add state for active tab
  const [activeTab, setActiveTab] = useState("Account");

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
    theme: "Light",
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
    plan: "Business Pro",
    billingCycle: "Annual",
    nextBillingDate: "May 15, 2025",
    paymentMethod: {
      type: "Credit Card",
      last4: "4242",
      expiryDate: "05/27",
    },
  });

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
    try {
      const { data, error } = await supabase
        .from('user_security')
        .select('backup_codes, recent_devices')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      setBackupCodes(data?.backup_codes || []);
      setRecentDevices(data?.recent_devices || []);
    } catch (err) {
      setBackupCodes([]);
      setRecentDevices([]);
    } finally {
      setDevicesLoading(false);
      setCodesLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSecurityExtras();
  }, [user]);

  // --- Backup code generation logic ---
  const generateBackupCodes = async () => {
    if (!user) return;
    setCodesLoading(true);
    // Only allow generation if no codes exist
    if (backupCodes && backupCodes.length > 0) {
      toast.warning('Backup codes can only be generated once.');
      setShowBackupModal(true);
      setCodesLoading(false);
      return;
    }
    // Generate 8 random 8-digit codes
    const codes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).slice(-8).toUpperCase()
    );
    try {
      const { error } = await supabase
        .from('user_security')
        .update({ backup_codes: codes })
        .eq('user_id', user.id);
      if (error) throw error;
      setBackupCodes(codes);
      setShowBackupModal(true);
      toast.success('Backup codes generated!');
    } catch (err) {
      toast.error('Failed to generate backup codes');
    } finally {
      setCodesLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Backup codes copied to clipboard!');
  };

  const handleDownloadBackupCodes = () => {
    const element = document.createElement('a');
    const file = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'bizradar-backup-codes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Backup codes downloaded!');
  };

  // --- Remove device logic ---
  const handleRemoveDevice = async (id: string) => {
    if (!user) return;
    setDevicesLoading(true);
    try {
      const updatedDevices = recentDevices.filter((d) => d.device_id !== id);
      const { error } = await supabase
        .from('user_security')
        .update({ recent_devices: updatedDevices })
        .eq('user_id', user.id);
      if (error) throw error;
      setRecentDevices(updatedDevices);
      toast.success('Device removed!');
    } catch (err) {
      toast.error('Failed to remove device');
    } finally {
      setDevicesLoading(false);
    }
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

  useEffect(() => {
    loadCurrentSubscription();
    loadAvailablePlans();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logging out...");
      navigate("/logout");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("There was a problem logging out");
    }
  };

  // Fetch user data
  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        if (profileData) {
          setUserProfile(profileData);
          setPersonalInfo({
            first_name: profileData.first_name || "",
            last_name: profileData.last_name || "",
            email: profileData.email || "",
          });
        }

        // Update security info with phone number
        setSecurityPhoneInfo(prev => ({
          ...prev,
          phoneNumber: profileData.phone_number || '',
          phoneVerified: profileData.phone_verified || false
        }));

        // Fetch security settings
        const { data: securityData, error: securityError } =
          await supabase
            .from("user_security")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (!securityError && securityData) {
          setSecurityInfo({
            twoFactorEnabled: securityData.two_factor_enabled ?? false,
            loginNotifications: securityData.login_notifications ?? true,
          });
        }

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

        // Fetch user preferences
        const { data: preferencesData, error: preferencesError } =
          await supabase
            .from("user_preferences")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (!preferencesError && preferencesData) {
          setUserPreferences(preferencesData);
          setPreferences({
            language: preferencesData.language || "English (US)",
            time_zone:
              preferencesData.time_zone || "Eastern Time (US & Canada)",
            date_format: preferencesData.date_format || "MM/DD/YYYY",
            theme: preferencesData.theme || "Light",
          });
        }

        // Fetch notification settings
        const { data: notificationData, error: notificationError } =
          await supabase
            .from("user_notifications")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (!notificationError && notificationData) {
          setNotificationSettings({
            emailNotifications: notificationData.email_notifications ?? true,
            smsNotifications: notificationData.sms_notifications ?? false,
            newOpportunityAlerts: notificationData.new_opportunity_alerts ?? true,
            weeklyReports: notificationData.weekly_reports ?? true,
            marketingEmails: notificationData.marketing_emails ?? false,
            systemAnnouncements: notificationData.system_announcements ?? true,
            opportunityMatches: notificationData.opportunity_matches ?? true,
            deadlineReminders: notificationData.deadline_reminders ?? true,
            systemAnnouncementsInApp: notificationData.system_announcements_in_app ?? true,
            teamCollaboration: notificationData.team_collaboration ?? true,
            statusChanges: notificationData.status_changes ?? true,
            upcomingDeadlines: notificationData.upcoming_deadlines ?? true,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user]);

  // Update handlers
  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: personalInfo.first_name,
          last_name: personalInfo.last_name,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // If we have a company, update it
      if (userCompany?.id) {
        // Update company details
        const { error: companyError } = await supabase
          .from("companies")
          .update({
            name: companyInfo.name,
            url: companyInfo.url,
            description: companyInfo.description,
          })
          .eq("id", userCompany.id);

        if (companyError) throw companyError;

        // Update role in user_companies
        const { error: roleError } = await supabase
          .from("user_companies")
          .update({
            role: companyInfo.role,
          })
          .eq("user_id", user.id)
          .eq("company_id", userCompany.id);

        if (roleError) throw roleError;
      } else {
        // Create new company if we don't have one
        const { data: newCompany, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: companyInfo.name,
            url: companyInfo.url,
            description: companyInfo.description,
          })
          .select()
          .single();

        if (companyError) throw companyError;

        // Create user-company relationship
        if (newCompany) {
          const { error: relationError } = await supabase
            .from("user_companies")
            .insert({
              user_id: user.id,
              company_id: newCompany.id,
              role: companyInfo.role,
              is_primary: true,
            });

          if (relationError) throw relationError;
        }
      }

      // Generate company markdown if URL is provided
      if (companyInfo.url) {
        try {
          const response = await fetch(
            "http://localhost:8000/api/generate-company-markdown",
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
      // Update or create preferences
      const { error } = await supabase.from("user_preferences")
      .upsert(
        {
        user_id: user.id,
        language: preferences.language,
        time_zone: preferences.time_zone,
        date_format: preferences.date_format,
        theme: preferences.theme,
      },
      { onConflict: 'user_id' }
    );

      if (error) throw error;

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

      const { error } = await supabase
        .from("user_security")
        .upsert({
          user_id: user.id,
          [colName]: value,
        },
          {
            onConflict: 'user_id'
          });

      if (error) throw error;

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
      const { error } = await supabase
        .from("user_notifications")
        .upsert({
          user_id: user.id,
          [colName]: value,
        },
          {
            onConflict: 'user_id'
          }
        );

      if (error) throw error;

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
      await subscriptionApi.cancelSubscription(currentSubscription.id);
      toast.success("Subscription cancelled successfully.");
      loadCurrentSubscription();
      setRefreshKey(k => k + 1);
    } catch (err) {
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  // Display loading state if user data is not loaded yet
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-800">
      <StripePaymentVerifier />
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Component */}
        <SideBar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="text-gray-500 text-sm font-medium hover:text-blue-600 transition-colors">Home</Link>
                <ChevronRight size={16} className="text-gray-500" />
                <span className="font-medium text-gray-500">Settings</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setUpgradeOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all flex items-center gap-2">
                  <span>Upgrade</span>
                  <Star size={14} className="ml-1" />
                </button>
                {/* <NotificationDropdown /> */}
                <button
                  onClick={handleLogout}
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-blue-100 transition-colors"
                >
                  <Power size={16} />
                  {/* <span className="font-medium">Logout</span> */}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-8xl mx-auto p-6">
              {/* Page Title */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Account Settings
                </h1>
                <p className="text-gray-500 mt-1">
                  Manage your profile, company information, and preferences
                </p>
              </div>

              {/* Settings Navigation Tabs */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  className={`px-4 py-2 ${activeTab === "Account"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setActiveTab("Account")}
                >
                  Account
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === "Security"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setActiveTab("Security")}
                >
                  Security
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === "Notifications"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setActiveTab("Notifications")}
                >
                  Notifications
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === "Billing"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setActiveTab("Billing")}
                >
                  Billing
                </button>
              </div>

              {/* Account Tab Content */}
              {activeTab === "Account" && (
                <>
                  {/* Personal Information Section */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <User className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
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
                                      {userProfile?.first_name}{" "}
                                      {userProfile?.last_name}
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
                                      {userProfile?.email}
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
                                      {userCompany?.name || "Not set"}
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
                                      {userCompany?.role || "Not set"}
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
                                    <p className="font-medium text-gray-900">
                                      {userCompany?.url || "Not set"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {userCompany?.description && (
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
                                      {userCompany.description}
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

                          <div>
                            <label
                              htmlFor="theme"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Theme
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <PaintBucket className="h-5 w-5 text-gray-400" />
                              </div>
                              <select
                                id="theme"
                                name="theme"
                                value={preferences.theme}
                                onChange={handlePreferencesChange}
                                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
                              >
                                <option value="Light">Light</option>
                                <option value="Dark">Dark</option>
                                <option value="System">System</option>
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
                            <div>
                              <p className="text-sm text-gray-500">Theme</p>
                              <p className="font-medium text-gray-900">
                                {userPreferences?.theme || "Light"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Account Actions Section */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <LogOut className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            Account Actions
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Manage your account security and access
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex flex-col md:flex-row items-center justify-between bg-gray-50 border border-gray-200 p-5 rounded-lg">
                        <div className="mb-4 md:mb-0">
                          <h4 className="font-medium text-gray-900 mb-1">
                            Logout from all devices
                          </h4>
                          <p className="text-gray-500 text-sm">
                            This will end all active sessions and require
                            re-authentication
                          </p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow"
                        >
                          <LogOut size={18} />
                          <span>Logout All Devices</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Security Tab Content */}
              {activeTab === "Security" && (
                <>
                  {/* Password Section */}
                  {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Lock className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Password Management
                        </h3>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-gray-800">
                              Change Password
                            </h4>
                            <p className="text-sm text-gray-500">
                              Last changed: {securityInfo.lastPasswordChange}
                            </p>
                          </div>
                          <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                            {securityInfo.passwordStrength} Strength
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor="current_password"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Current Password
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type={showPassword ? "text" : "password"}
                                id="current_password"
                                className="pl-10 pr-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter your current password"
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                ) : (
                                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="new_password"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              New Password
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type={showPassword ? "text" : "password"}
                                id="new_password"
                                className="pl-10 pr-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter your new password"
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                ) : (
                                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="confirm_password"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type={showPassword ? "text" : "password"}
                                id="confirm_password"
                                className="pl-10 pr-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Confirm your new password"
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                ) : (
                                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end mt-6">
                          <button
                            type="button"
                            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow transition-all"
                            onClick={() =>
                              toast.success("Password changed successfully")
                            }
                          >
                            Update Password
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-6">
                        <h4 className="font-medium text-gray-800 mb-4">
                          Password Requirements
                        </h4>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>At least 8 characters</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>At least one uppercase letter</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>At least one number</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>At least one special character</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div> */}

                  <PasswordManagement />

                  {/* Two-Factor Authentication */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Smartphone className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Two-Factor Authentication
                        </h3>
                      </div>
                      <div className="flex items-center">
                        <div
                          className={`mr-4 px-3 py-1 rounded-full text-sm font-medium ${securityInfo.twoFactorEnabled
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {securityInfo.twoFactorEnabled
                            ? "Enabled"
                            : "Disabled"}
                        </div>
                        <label
                          htmlFor="two-factor-toggle"
                          className="inline-flex relative items-center cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            value=""
                            id="two-factor-toggle"
                            className="sr-only peer"
                            checked={securityInfo.twoFactorEnabled}
                            onChange={() =>
                              handleSecurityChange(
                                "twoFactorEnabled",
                                !securityInfo.twoFactorEnabled
                              )
                            }
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    <div className="p-6">
                      {securityInfo.twoFactorEnabled ? (
                        <div>
                          <div className="flex items-center mb-4">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            <span className="font-medium text-gray-800">
                              Two-factor authentication is enabled
                            </span>
                          </div>

                          <p className="text-gray-600 mb-6">
                            Your account is currently protected with two-factor
                            authentication. We'll send a verification code to
                            your phone whenever you sign in from a new device.
                          </p>

                          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 mb-4">
                            <div className="flex items-start gap-3">
                              <div className="p-1 bg-blue-100 rounded-full">
                                <Smartphone className="h-5 w-5 text-blue-500" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  Recovery Methods
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Phone Number: {securityPhoneInfo.phoneNumber ? (
                                    <>
                                      {securityPhoneInfo.phoneNumber}
                                      {!securityPhoneInfo.phoneVerified && (
                                        <span className="ml-2 text-amber-500 text-xs">
                                          (Unverified)
                                        </span>
                                      )}
                                      <button
                                        className="text-blue-500 ml-2"
                                        onClick={() => setShowPhoneModal(true)}
                                      >
                                        Change
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      className="text-blue-500"
                                      onClick={() => setShowPhoneModal(true)}
                                    >
                                      Add Phone Number
                                    </button>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <button className="inline-flex items-center gap-2 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                              onClick={generateBackupCodes}
                              disabled={codesLoading || (backupCodes && backupCodes.length > 0)}
                            >
                              <RefreshCw className="h-4 w-4 text-gray-500" />
                              <span>{codesLoading ? 'Generating...' : 'Generate Backup Codes'}</span>
                            </button>
                            <button
                              className="inline-flex items-center gap-2 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50"
                              onClick={() =>
                                handleSecurityChange("twoFactorEnabled", false)
                              }
                            >
                              <X className="h-4 w-4" />
                              <span>Disable Two-Factor Authentication</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center mb-4">
                            <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                            <span className="font-medium text-gray-800">
                              Two-factor authentication is disabled
                            </span>
                          </div>

                          <p className="text-gray-600 mb-6">
                            Add an extra layer of security to your account. When
                            two-factor authentication is enabled, you'll need to
                            enter both your password and a verification code to
                            sign in.
                          </p>

                          <div className="flex flex-wrap gap-4 mb-6">
                            <button
                              className="inline-flex items-center gap-2 text-white bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600"
                              onClick={() =>
                                handleSecurityChange("twoFactorEnabled", true)
                              }
                            >
                              <Smartphone className="h-4 w-4 text-blue-200" />
                              <span>Set Up Using Phone Number</span>
                            </button>

                            <button className="inline-flex items-center gap-2 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
                              <Smartphone className="h-4 w-4 text-gray-500" />
                              <span>Set Up Using Authentication App</span>
                            </button>
                          </div>

                          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <h4 className="font-medium text-gray-800 mb-2">
                              Why enable two-factor authentication?
                            </h4>
                            <ul className="space-y-2">
                              <li className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span>
                                  Protects your account even if your password is
                                  compromised
                                </span>
                              </li>
                              <li className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span>
                                  Prevents unauthorized access from unknown
                                  devices
                                </span>
                              </li>
                              <li className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span>
                                  Recommended for accounts with sensitive
                                  information
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Login Security Section */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Fingerprint className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Login Security
                        </h3>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">
                              Email Login Notifications
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              Receive email notifications when your account is
                              accessed from a new device or location
                            </p>
                          </div>
                          <label
                            htmlFor="login-notifications-toggle"
                            className="inline-flex relative items-center cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              value=""
                              id="login-notifications-toggle"
                              className="sr-only peer"
                              checked={securityInfo.loginNotifications}
                              onChange={() =>
                                handleSecurityChange(
                                  "loginNotifications",
                                  !securityInfo.loginNotifications
                                )
                              }
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                          <h4 className="font-medium text-gray-800 mb-4">
                            Recent Devices
                          </h4>
                          {devicesLoading ? (
                            <div className="text-gray-500">Loading devices...</div>
                          ) : recentDevices.length === 0 ? (
                            <div className="text-gray-500">No recent devices found.</div>
                          ) : recentDevices.map(device => (
                            <div key={device.device_id} className={`p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-start gap-4${device.current ? '' : ' flex-row'}`}>
                              <div className="p-2 bg-blue-100 rounded-full">
                                {device.name && device.name.toLowerCase().includes('iphone') ? (
                                  <Smartphone className="h-5 w-5 text-blue-500" />
                                ) : (
                                  <Fingerprint className="h-5 w-5 text-blue-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <h5 className="font-medium text-gray-800">{device.name || 'Unknown Device'}</h5>
                                  {device.current && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Current Device</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Last active: {device.last_active || 'Unknown'}</p>
                                <p className="text-sm text-gray-500">Location: {device.location || 'Unknown'}</p>
                              </div>
                              {!device.current && (
                                <button className="text-red-500 hover:text-red-700" onClick={() => handleRemoveDevice(device.device_id)}>
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Notifications Tab Content */}
              {activeTab === "Notifications" && (
                <>
                  {/* Email Notifications Section */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Mail className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Email Notifications
                        </h3>
                      </div>
                      <div className="flex items-center">
                        <div
                          className={`mr-4 px-3 py-1 rounded-full text-sm font-medium ${notificationSettings.emailNotifications
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {notificationSettings.emailNotifications
                            ? "Enabled"
                            : "Disabled"}
                        </div>
                        <label
                          htmlFor="email-notifs-toggle"
                          className="inline-flex relative items-center cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            value=""
                            id="email-notifs-toggle"
                            className="sr-only peer"
                            checked={notificationSettings.emailNotifications}
                            onChange={() =>
                              handleNotificationChange(
                                "emailNotifications",
                                !notificationSettings.emailNotifications
                              )
                            }
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    <div className="p-6">
                      {notificationSettings.emailNotifications ? (
                        <div className="space-y-6">
                          <p className="text-gray-600">
                            Configure which email notifications you'd like to
                            receive about opportunities, updates, and account
                            activity.
                          </p>

                          <div className="border-t border-gray-100 pt-6">
                            <h4 className="font-medium text-gray-800 mb-4">
                              Opportunity Notifications
                            </h4>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-700">
                                    New Opportunity Alerts
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Get notified when new opportunities match
                                    your profile
                                  </p>
                                </div>
                                <label
                                  htmlFor="new-opp-toggle"
                                  className="inline-flex relative items-center cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    id="new-opp-toggle"
                                    className="sr-only peer"
                                    checked={
                                      notificationSettings.newOpportunityAlerts
                                    }
                                    onChange={() =>
                                      handleNotificationChange(
                                        "newOpportunityAlerts",
                                        !notificationSettings.newOpportunityAlerts
                                      )
                                    }
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>

                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-700">
                                    Weekly Opportunity Reports
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Receive a weekly summary of new
                                    opportunities
                                  </p>
                                </div>
                                <label
                                  htmlFor="weekly-reports-toggle"
                                  className="inline-flex relative items-center cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    id="weekly-reports-toggle"
                                    className="sr-only peer"
                                    checked={notificationSettings.weeklyReports}
                                    onChange={() =>
                                      handleNotificationChange(
                                        "weeklyReports",
                                        !notificationSettings.weeklyReports
                                      )
                                    }
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-100 pt-6">
                            <h4 className="font-medium text-gray-800 mb-4">
                              System Notifications
                            </h4>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-700">
                                    System Announcements
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Important announcements about system updates
                                    and maintenance
                                  </p>
                                </div>
                                <label
                                  htmlFor="system-announce-toggle"
                                  className="inline-flex relative items-center cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    id="system-announce-toggle"
                                    className="sr-only peer"
                                    checked={
                                      notificationSettings.systemAnnouncements
                                    }
                                    onChange={() =>
                                      handleNotificationChange(
                                        "systemAnnouncements",
                                        !notificationSettings.systemAnnouncements
                                      )
                                    }
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>

                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-700">
                                    Marketing Emails
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Promotional emails about new features and
                                    services
                                  </p>
                                </div>
                                <label
                                  htmlFor="marketing-toggle"
                                  className="inline-flex relative items-center cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    id="marketing-toggle"
                                    className="sr-only peer"
                                    checked={
                                      notificationSettings.marketingEmails
                                    }
                                    onChange={() =>
                                      handleNotificationChange(
                                        "marketingEmails",
                                        !notificationSettings.marketingEmails
                                      )
                                    }
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <BellOff className="h-8 w-8 text-gray-400" />
                          </div>
                          <h4 className="text-lg font-medium text-gray-700 mb-2">
                            Email notifications are disabled
                          </h4>
                          <p className="text-gray-500 max-w-md mx-auto mb-6">
                            You won't receive any email notifications about new
                            opportunities, updates, or account activity.
                          </p>
                          <button
                            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow transition-all"
                            onClick={() =>
                              handleNotificationChange(
                                "emailNotifications",
                                true
                              )
                            }
                          >
                            Enable Email Notifications
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SMS Notifications Section */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Smartphone className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          SMS Notifications
                        </h3>
                      </div>
                      <div className="flex items-center">
                        <div
                          className={`mr-4 px-3 py-1 rounded-full text-sm font-medium ${notificationSettings.smsNotifications
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {notificationSettings.smsNotifications
                            ? "Enabled"
                            : "Disabled"}
                        </div>
                        <label
                          htmlFor="sms-notifs-toggle"
                          className="inline-flex relative items-center cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            value=""
                            id="sms-notifs-toggle"
                            className="sr-only peer"
                            checked={notificationSettings.smsNotifications}
                            onChange={() =>
                              handleNotificationChange(
                                "smsNotifications",
                                !notificationSettings.smsNotifications
                              )
                            }
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    <div className="p-6">
                      {notificationSettings.smsNotifications ? (
                        <div>
                          <p className="text-gray-600 mb-6">
                            Receive time-sensitive notifications via SMS for
                            critical updates and opportunity deadlines.
                          </p>

                          <div className="mb-6">
                            <label
                              htmlFor="phone_number"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Phone Number
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Smartphone className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="tel"
                                id="phone_number"
                                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="(123) 456-7890"
                                value="(415) 555-1234"
                                readOnly
                              />
                            </div>
                          </div>

                          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">
                            <div className="flex items-start">
                              <div className="p-1 bg-blue-100 rounded-full mr-3">
                                <AlertCircle className="h-5 w-5 text-blue-500" />
                              </div>
                              <div>
                                <p className="text-sm text-blue-600">
                                  Message and data rates may apply. SMS
                                  notifications are limited to critical alerts
                                  only.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-100 pt-6">
                            <h4 className="font-medium text-gray-800 mb-4">
                              Notification Types
                            </h4>

                            <div className="space-y-4">
                              <div className="flex items-center">
                                <input
                                  id="sms-deadlines"
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={notificationSettings.upcomingDeadlines}
                                  onChange={() =>
                                    handleNotificationChange(
                                      "upcomingDeadlines",
                                      !notificationSettings.upcomingDeadlines
                                    )
                                  }
                                />
                                <label htmlFor="sms-deadlines" className="ml-3">
                                  <span className="block text-sm font-medium text-gray-700">
                                    Upcoming Deadlines
                                  </span>
                                  <span className="block text-sm text-gray-500">
                                    Receive alerts for opportunities due within
                                    48 hours
                                  </span>
                                </label>
                              </div>

                              <div className="flex items-center">
                                <input
                                  id="sms-status"
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={notificationSettings.statusChanges}
                                  onChange={() =>
                                    handleNotificationChange(
                                      "statusChanges",
                                      !notificationSettings.statusChanges
                                    )
                                  }
                                />
                                <label htmlFor="sms-status" className="ml-3">
                                  <span className="block text-sm font-medium text-gray-700">
                                    Status Changes
                                  </span>
                                  <span className="block text-sm text-gray-500">
                                    Notifications when pursuit status changes
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <Smartphone className="h-8 w-8 text-gray-400" />
                          </div>
                          <h4 className="text-lg font-medium text-gray-700 mb-2">
                            SMS notifications are disabled
                          </h4>
                          <p className="text-gray-500 max-w-md mx-auto mb-6">
                            Enable SMS notifications to receive time-sensitive
                            alerts about upcoming deadlines and important
                            updates.
                          </p>
                          <button
                            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow transition-all"
                            onClick={() =>
                              handleNotificationChange("smsNotifications", true)
                            }
                          >
                            Enable SMS Notifications
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* App Notification Settings */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Bell className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          In-App Notifications
                        </h3>
                      </div>
                    </div>

                    <div className="p-6">
                      <p className="text-gray-600 mb-6">
                        Configure which notifications appear in the app while
                        you're using BizRadar.
                      </p>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-700">
                              Opportunity Matches
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Notifications for new opportunities that match
                              your profile
                            </p>
                          </div>
                          <label className="inline-flex relative items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationSettings.opportunityMatches}
                              onChange={() =>
                                handleNotificationChange(
                                  "opportunityMatches",
                                  !notificationSettings.opportunityMatches
                                )
                              }
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-700">
                              Deadline Reminders
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Notifications for approaching deadlines
                            </p>
                          </div>
                          <label className="inline-flex relative items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationSettings.deadlineReminders}
                              onChange={() =>
                                handleNotificationChange(
                                  "deadlineReminders",
                                  !notificationSettings.deadlineReminders
                                )
                              }
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-700">
                              System Announcements
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Updates about platform features and maintenance
                            </p>
                          </div>
                          <label className="inline-flex relative items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationSettings.systemAnnouncementsInApp}
                              onChange={() =>
                                handleNotificationChange(
                                  "systemAnnouncementsInApp",
                                  !notificationSettings.systemAnnouncementsInApp
                                )
                              }
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-700">
                              Team Collaboration
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Notifications when team members comment or take
                              actions
                            </p>
                          </div>
                          <label className="inline-flex relative items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationSettings.teamCollaboration}
                              onChange={() =>
                                handleNotificationChange(
                                  "teamCollaboration",
                                  !notificationSettings.teamCollaboration
                                )
                              }
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
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
                      <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                        {subLoading ? 'Loading...' : currentSubscription ? currentSubscription.plan_type : 'None'}
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
                            <div className="flex flex-col md:flex-row items-start gap-6">
                              <div className="flex-1">
                                <div className="p-5 border border-gray-200 rounded-lg bg-gray-50">
                                  <div className="flex items-start justify-between mb-4">
                                    <div>
                                      <p className="text-lg font-semibold text-gray-800">
                                        {plan ? plan.name : currentSubscription.plan_type}
                                      </p>
                                      <p className="text-blue-600 font-medium">
                                        {plan ? `$${plan.price}/month` : ''}
                                      </p>
                                      {plan && (
                                        <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                                      )}
                                    </div>
                                    <div className="px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                                      {currentSubscription.status || 'Active'}
                                    </div>
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
                              </div>
                              <div className="w-full md:w-64 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg text-white p-5 shadow-md">
                                <h4 className="text-lg font-semibold mb-3">Need More?</h4>
                                <p className="text-blue-100 mb-4 text-sm">
                                  Upgrade to our Enterprise plan for additional features and unlimited access
                                </p>
                                <ul className="space-y-2 mb-5">
                                  <li className="flex items-center gap-2 text-sm text-blue-100">
                                    <CheckCircle className="h-4 w-4 text-blue-200" />
                                    <span>Unlimited RFP responses</span>
                                  </li>
                                  <li className="flex items-center gap-2 text-sm text-blue-100">
                                    <CheckCircle className="h-4 w-4 text-blue-200" />
                                    <span>Custom AI training</span>
                                  </li>
                                  <li className="flex items-center gap-2 text-sm text-blue-100">
                                    <CheckCircle className="h-4 w-4 text-blue-200" />
                                    <span>Dedicated account manager</span>
                                  </li>
                                </ul>
                                <button
                                  className="w-full bg-white text-blue-600 font-medium rounded-lg py-2 hover:bg-blue-50 transition-colors"
                                  onClick={() => setShowContactSalesModal(true)}
                                >
                                  Contact Sales
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

                  {/* Billing History Section--Hidden for now */}
                  {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
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
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Invoice
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Date
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Amount
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Status
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                              ></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            <tr>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                INV-2025-003
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                April 1, 2025
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                $199.00
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Paid
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                                  <Download className="h-4 w-4" />
                                  <span>PDF</span>
                                </button>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                INV-2025-002
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                March 1, 2025
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                $199.00
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Paid
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                                  <Download className="h-4 w-4" />
                                  <span>PDF</span>
                                </button>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                INV-2025-001
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                February 1, 2025
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                $199.00
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Paid
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                                  <Download className="h-4 w-4" />
                                  <span>PDF</span>
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div> */}

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
                            12-3456789
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Billing Address
                          </p>
                          <p className="font-medium text-gray-800">
                            {"Not set"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Country / Region
                          </p>
                          <p className="font-medium text-gray-800">
                            United States
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

