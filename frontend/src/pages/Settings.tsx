import React, { useState } from "react";
import { 
  User, CreditCard, Info, ChevronRight, Bell, Edit, Lock, Save, X,
  Shield, Building, Mail, LogOut, Trash2, HelpCircle, Settings as SettingsIcon
} from "lucide-react";
import { Link } from "react-router-dom";

export function Settings() {
  const [activeSection, setActiveSection] = useState("overview");
  
  // State for user information
  const [userInfo, setUserInfo] = useState({
    fullName: "John Smith",
    email: "john.smith@bizradar.com",
    company: "Bizradar Inc.",
    role: "Administrator",
    companyUrl: "https://www.indrasol.com/",
    companyDescription: "Indrasol is a technology and consulting company that specializes in providing innovative software solutions and digital transformation services. Based on their website, they appear to focus on helping businesses leverage technology to improve their operations, offering services in areas such as software development, digital strategy, cloud solutions, and enterprise technology consulting. The company seems to work with various industries, helping organizations modernize their technological infrastructure and develop custom software solutions to meet their specific business needs."
  });

  // State for account preferences
  const [preferences, setPreferences] = useState({
    language: "English (US)",
    timeZone: "Eastern Time (US & Canada)",
    dateFormat: "MM/DD/YYYY",
    theme: "Light"
  });

  // State for edit modes
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  
  // State for form values
  const [personalInfoForm, setPersonalInfoForm] = useState({...userInfo});
  const [preferencesForm, setPreferencesForm] = useState({...preferences});

  // Function to handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  // Handle input change for personal info
  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfoForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle input change for preferences
  const handlePreferencesChange = (e) => {
    const { name, value } = e.target;
    setPreferencesForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save personal info changes
  const savePersonalInfo = () => {
    setUserInfo(personalInfoForm);
    
    // Save to sessionStorage for AI recommendations
    const userProfile = {
      companyUrl: personalInfoForm.companyUrl,
      companyDescription: personalInfoForm.companyDescription
    };
    sessionStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    setEditingPersonalInfo(false);
  };

  // Save preferences changes
  const savePreferences = () => {
    setPreferences(preferencesForm);
    setEditingPreferences(false);
  };

  // Cancel personal info edits
  const cancelPersonalInfoEdit = () => {
    setPersonalInfoForm({...userInfo});
    setEditingPersonalInfo(false);
  };

  // Cancel preferences edits
  const cancelPreferencesEdit = () => {
    setPreferencesForm({...preferences});
    setEditingPreferences(false);
  };

  // Begin editing personal info
  const startEditingPersonalInfo = () => {
    setPersonalInfoForm({...userInfo});
    setEditingPersonalInfo(true);
  };

  // Begin editing preferences
  const startEditingPreferences = () => {
    setPreferencesForm({...preferences});
    setEditingPreferences(true);
  };

  // Rest of the component remains the same as in the previous implementation
  
  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Top Navbar with save changes logic */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Settings</span>
            <ChevronRight size={16} className="text-gray-400" />
            <span className="font-medium">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {(editingPersonalInfo || editingPreferences) && (
              <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm flex items-center gap-1 shadow-sm"
                      onClick={() => {
                        if (editingPersonalInfo) savePersonalInfo();
                        if (editingPreferences) savePreferences();
                      }}>
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Existing render method, but replace the content in the overview section with the following */}
      {activeSection === "overview" && (
        <div>
          <h1 className="text-2xl font-bold mb-6">Account Overview</h1>
          
          {/* Personal Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Personal Information</h2>
              {!editingPersonalInfo ? (
                <button 
                  onClick={startEditingPersonalInfo}
                  className="text-blue-600 flex items-center text-sm font-medium"
                >
                  <Edit size={16} className="mr-1" />
                  Edit
                </button>
              ) : (
                <button 
                  onClick={cancelPersonalInfoEdit}
                  className="text-gray-600 flex items-center text-sm font-medium"
                >
                  <X size={16} className="mr-1" />
                  Cancel
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</h3>
                {!editingPersonalInfo ? (
                  <p className="text-gray-800">{userInfo.fullName}</p>
                ) : (
                  <input
                    type="text"
                    name="fullName"
                    value={personalInfoForm.fullName}
                    onChange={handlePersonalInfoChange}
                    className="w-full p-2 border border-gray-200 rounded text-sm"
                  />
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</h3>
                {!editingPersonalInfo ? (
                  <p className="text-gray-800">{userInfo.email}</p>
                ) : (
                  <input
                    type="email"
                    name="email"
                    value={personalInfoForm.email}
                    onChange={handlePersonalInfoChange}
                    className="w-full p-2 border border-gray-200 rounded text-sm"
                  />
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Company</h3>
                {!editingPersonalInfo ? (
                  <p className="text-gray-800">{userInfo.company}</p>
                ) : (
                  <input
                    type="text"
                    name="company"
                    value={personalInfoForm.company}
                    onChange={handlePersonalInfoChange}
                    className="w-full p-2 border border-gray-200 rounded text-sm"
                  />
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Role</h3>
                {!editingPersonalInfo ? (
                  <p className="text-gray-800">{userInfo.role}</p>
                ) : (
                  <input
                    type="text"
                    name="role"
                    value={personalInfoForm.role}
                    onChange={handlePersonalInfoChange}
                    className="w-full p-2 border border-gray-200 rounded text-sm"
                  />
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Company URL</h3>
                {!editingPersonalInfo ? (
                  <p className="text-gray-800">{userInfo.companyUrl}</p>
                ) : (
                  <input
                    type="url"
                    name="companyUrl"
                    value={personalInfoForm.companyUrl}
                    onChange={handlePersonalInfoChange}
                    className="w-full p-2 border border-gray-200 rounded text-sm"
                  />
                )}
              </div>
              <div className="col-span-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Company Description</h3>
                {!editingPersonalInfo ? (
                  <p className="text-gray-800 whitespace-pre-wrap">{userInfo.companyDescription}</p>
                ) : (
                  <textarea
                    name="companyDescription"
                    value={personalInfoForm.companyDescription}
                    onChange={handlePersonalInfoChange}
                    rows={4}
                    className="w-full p-2 border border-gray-200 rounded text-sm"
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Account Preferences Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Account Preferences</h2>
              {!editingPreferences ? (
                <button 
                  onClick={startEditingPreferences}
                  className="text-blue-600 flex items-center text-sm font-medium"
                >
                  <Edit size={16} className="mr-1" />
                  Edit
                </button>
              ) : (
                <button 
                  onClick={cancelPreferencesEdit}
                  className="text-gray-600 flex items-center text-sm font-medium"
                >
                  <X size={16} className="mr-1" />
                  Cancel
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Language</h3>
                {!editingPreferences ? (
                  <p className="text-gray-800">{preferences.language}</p>
                ) : (
                  <select
                    name="language"
                    value={preferencesForm.language}
                    onChange={handlePreferencesChange}
                    className="w-full p-2 border border-gray-200 rounded text-sm"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="English (UK)">English (UK)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Time Zone</h3>
                {!editingPreferences ? (
                  <p className="text-gray-800">{preferences.timeZone}</p>
                ) : (
                  <select
                    name="timeZone"
                    value={preferencesForm.timeZone}
                    onChange={handlePreferencesChange}
                    className="w-full p-2 border border-gray-200 rounded text-sm"
                  >
                    <option value="Eastern Time (US & Canada)">Eastern Time (US & Canada)</option>
                    <option value="Central Time (US & Canada)">Central Time (US & Canada)</option>
                    <option value="Mountain Time (US & Canada)">Mountain Time (US & Canada)</option>
                    <option value="Pacific Time (US & Canada)">Pacific Time (US & Canada)</option>
                  </select>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Date Format</h3>
                {!editingPreferences ? (
                  <p className="text-gray-800">{preferences.dateFormat}</p>
                ) : (
                  <select
                    name="dateFormat"
                    value={preferencesForm.dateFormat}
                    onChange={handlePreferencesChange}
                    className="w-full p-2 border border-gray-200 rounded text-sm"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Theme</h3>
                {!editingPreferences ? (
                  <p className="text-gray-800">{preferences.theme}</p>
                ) : (
                  <select
                    name="theme"
                    value={preferencesForm.theme}
                    onChange={handlePreferencesChange}
                    className="w-full p-2 border border-gray-200 rounded text-sm"
                  >
                    <option value="Light">Light</option>
                    <option value="Dark">Dark</option>
                    <option value="System">System</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the component remains the same */}
    </div>
  );
}