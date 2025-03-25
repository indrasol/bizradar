import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth/useAuth';
import { Pencil, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userCompany, setUserCompany] = useState<any>(null);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  
  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    url: '',
    description: '',
    role: '',
  });
  
  const [preferences, setPreferences] = useState({
    language: 'English (US)',
    time_zone: 'Eastern Time (US & Canada)',
    date_format: 'MM/DD/YYYY',
    theme: 'Light',
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logging out...");
      navigate('/logout');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('There was a problem logging out');
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
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        if (profileData) {
          setUserProfile(profileData);
          setPersonalInfo({
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            email: profileData.email || '',
          });
        }

        // Fetch user's primary company
        const { data: userCompanyData, error: userCompanyError } = await supabase
          .from('user_companies')
          .select('*')
          .eq('user_id', user.id);
        
        if (!userCompanyError && userCompanyData && userCompanyData.length > 0) {
          // Get primary company or first one
          const primaryCompany = userCompanyData.find(c => c.is_primary) || userCompanyData[0];
          
          // Fetch the company details
          const { data: companyDetails, error: companyDetailsError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', primaryCompany.company_id)
            .single();
          
          if (!companyDetailsError && companyDetails) {
            const company = {
              id: companyDetails.id,
              name: companyDetails.name || '',
              url: companyDetails.url || '',
              description: companyDetails.description || '',
              role: primaryCompany.role || '',
              is_primary: primaryCompany.is_primary || true,
            };
            
            setUserCompany(company);
            setCompanyInfo({
              name: company.name,
              url: company.url || '',
              description: company.description || '',
              role: company.role || '',
            });
          }
        }

        // Fetch user preferences
        const { data: preferencesData, error: preferencesError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!preferencesError && preferencesData) {
          setUserPreferences(preferencesData);
          setPreferences({
            language: preferencesData.language || 'English (US)',
            time_zone: preferencesData.time_zone || 'Eastern Time (US & Canada)',
            date_format: preferencesData.date_format || 'MM/DD/YYYY',
            theme: preferencesData.theme || 'Light',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user]);
  
  // Update handlers
  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: personalInfo.first_name,
          last_name: personalInfo.last_name,
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // If we have a company, update it
      if (userCompany?.id) {
        // Update company details
        const { error: companyError } = await supabase
          .from('companies')
          .update({
            name: companyInfo.name,
            url: companyInfo.url,
            description: companyInfo.description,
          })
          .eq('id', userCompany.id);
        
        if (companyError) throw companyError;
        
        // Update role in user_companies
        const { error: roleError } = await supabase
          .from('user_companies')
          .update({
            role: companyInfo.role,
          })
          .eq('user_id', user.id)
          .eq('company_id', userCompany.id);
        
        if (roleError) throw roleError;
      } else {
        // Create new company if we don't have one
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
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
            .from('user_companies')
            .insert({
              user_id: user.id,
              company_id: newCompany.id,
              role: companyInfo.role,
              is_primary: true,
            });
          
          if (relationError) throw relationError;
        }
      }
      
      toast.success('Personal information updated successfully');
      setEditingPersonal(false);
      
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error updating personal information:', error);
      toast.error('Failed to update personal information');
    }
  };
  
  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      // Update or create preferences
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          language: preferences.language,
          time_zone: preferences.time_zone,
          date_format: preferences.date_format,
          theme: preferences.theme,
        });
      
      if (error) throw error;
      
      toast.success('Preferences updated successfully');
    setEditingPreferences(false);
      
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };
  
  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('company_')) {
      // Handle company fields
      const companyField = name.replace('company_', '');
      setCompanyInfo({ ...companyInfo, [companyField]: value });
    } else {
      // Handle personal fields
      setPersonalInfo({ ...personalInfo, [name]: value });
    }
  };
  
  const handlePreferencesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences({ ...preferences, [name]: value });
  };
  
  // Display loading state if user data is not loaded yet
  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Title and Logout Button */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-gray-600 text-sm">Manage your account settings and preferences</p>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      {/* Account Overview Section */}
      <h2 className="text-xl font-medium text-gray-800 mb-6 mt-8">Account Overview</h2>
      
      {/* Personal Information Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-800">Personal Information</h3>
          
          {!editingPersonal ? (
                <button 
              className="text-green-600 hover:text-green-800 flex items-center gap-1"
              onClick={() => setEditingPersonal(true)}
                >
              <Pencil className="w-4 h-4" />
              <span>Edit</span>
                </button>
          ) : null}
            </div>
            
        {editingPersonal ? (
          <form onSubmit={handlePersonalSubmit} className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                  <input
                    type="text"
                  id="first_name"
                  name="first_name"
                  value={personalInfo.first_name}
                  onChange={handlePersonalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={personalInfo.last_name}
                  onChange={handlePersonalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
                  <input
                    type="email"
                id="email"
                    name="email"
                value={personalInfo.email}
                disabled
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={companyInfo.name}
                onChange={handlePersonalChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="company_role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <input
                type="text"
                id="company_role"
                name="company_role"
                value={companyInfo.role}
                onChange={handlePersonalChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="company_url" className="block text-sm font-medium text-gray-700 mb-1">
                Company URL
              </label>
              <input
                type="url"
                id="company_url"
                name="company_url"
                value={companyInfo.url}
                onChange={handlePersonalChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="company_description" className="block text-sm font-medium text-gray-700 mb-1">
                Company Description
              </label>
              <textarea
                id="company_description"
                name="company_description"
                value={companyInfo.description}
                onChange={handlePersonalChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditingPersonal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">FULL NAME</h4>
                <p className="mt-1 text-gray-900">{userProfile?.first_name} {userProfile?.last_name}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">EMAIL</h4>
                <p className="mt-1 text-gray-900">{userProfile?.email}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">COMPANY</h4>
                <p className="mt-1 text-gray-900">{userCompany?.name || 'Not set'}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">ROLE</h4>
                <p className="mt-1 text-gray-900">{userCompany?.role || 'Not set'}</p>
              </div>
              <div className="col-span-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">COMPANY URL</h4>
                <p className="mt-1 text-gray-900">{userCompany?.url || 'Not set'}</p>
              </div>
              <div className="col-span-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">COMPANY DESCRIPTION</h4>
                <p className="mt-1 text-gray-900">{userCompany?.description || 'Not set'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Account Preferences Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-800">Account Preferences</h3>
          
              {!editingPreferences ? (
                <button 
              className="text-green-600 hover:text-green-800 flex items-center gap-1"
              onClick={() => setEditingPreferences(true)}
                >
              <Pencil className="w-4 h-4" />
              <span>Edit</span>
                </button>
          ) : null}
            </div>
            
        {editingPreferences ? (
          <form onSubmit={handlePreferencesSubmit} className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                  <select
                  id="language"
                    name="language"
                  value={preferences.language}
                    onChange={handlePreferencesChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  <option value="German">German</option>
                  </select>
              </div>
              
              <div>
                <label htmlFor="time_zone" className="block text-sm font-medium text-gray-700 mb-1">
                  Time Zone
                </label>
                  <select
                  id="time_zone"
                  name="time_zone"
                  value={preferences.time_zone}
                    onChange={handlePreferencesChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Eastern Time (US & Canada)">Eastern Time (US & Canada)</option>
                    <option value="Central Time (US & Canada)">Central Time (US & Canada)</option>
                    <option value="Pacific Time (US & Canada)">Pacific Time (US & Canada)</option>
                  <option value="UTC">UTC</option>
                  </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="date_format" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Format
                </label>
                  <select
                  id="date_format"
                  name="date_format"
                  value={preferences.date_format}
                    onChange={handlePreferencesChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
              </div>
              
              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                  Theme
                </label>
                  <select
                  id="theme"
                    name="theme"
                  value={preferences.theme}
                    onChange={handlePreferencesChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Light">Light</option>
                    <option value="Dark">Dark</option>
                    <option value="System">System</option>
                  </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditingPreferences(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">LANGUAGE</h4>
                <p className="mt-1 text-gray-900">{userPreferences?.language || 'English (US)'}</p>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">TIME ZONE</h4>
                <p className="mt-1 text-gray-900">{userPreferences?.time_zone || 'Eastern Time (US & Canada)'}</p>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">DATE FORMAT</h4>
                <p className="mt-1 text-gray-900">{userPreferences?.date_format || 'MM/DD/YYYY'}</p>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">THEME</h4>
                <p className="mt-1 text-gray-900">{userPreferences?.theme || 'Light'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Account Actions Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-800">Account Actions</h3>
          <p className="text-sm text-gray-600">Manage your account access</p>
        </div>
        
        <div className="px-6 py-4 flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            <LogOut size={18} />
            <span>Logout from all devices</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;