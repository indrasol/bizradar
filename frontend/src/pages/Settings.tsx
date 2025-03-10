import React, { useState } from "react";
import { 
  User, CreditCard, Info, ChevronRight, Bell, Edit, Lock,
  Shield, Building, Mail, LogOut, Trash2, HelpCircle, Settings as SettingsIcon
} from "lucide-react";
import { Link } from "react-router-dom";

// Changed from export default function SettingsPage() to export function Settings()
export function Settings() {
  const [activeSection, setActiveSection] = useState("overview");
  
  // Function to handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  // Settings navigation items
  const navItems = [
    {
      title: "General",
      items: [
        { id: "overview", label: "Overview", icon: <User size={18} /> },
        { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
        { id: "security", label: "Security", icon: <Shield size={18} /> }
      ]
    },
    {
      title: "Billing",
      items: [
        { id: "billing", label: "Billing and Payments", icon: <CreditCard size={18} /> },
        { id: "subscription", label: "Subscription", icon: <Building size={18} /> }
      ]
    },
    {
      title: "Other",
      items: [
        { id: "about", label: "About Us", icon: <Info size={18} /> },
        { id: "help", label: "Help & Support", icon: <HelpCircle size={18} /> }
      ]
    }
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Top Navbar */}
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
            <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm flex items-center gap-1 shadow-sm">
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Settings Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-white overflow-y-auto">
          {navItems.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="px-4 pt-5 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
              <ul>
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleSectionChange(item.id)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                        activeSection === item.id
                          ? "text-blue-600 bg-blue-50 border-l-2 border-blue-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className={`mr-3 ${activeSection === item.id ? "text-blue-600" : "text-gray-500"}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {/* Danger Zone */}
          <div className="px-4 pt-5 pb-5">
            <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">
              Danger Zone
            </h3>
            <button className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md w-full">
              <Trash2 size={18} className="mr-3 text-red-500" />
              Delete Account
            </button>
            <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md w-full mt-2">
              <LogOut size={18} className="mr-3 text-gray-500" />
              Logout
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === "overview" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Account Overview</h1>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Personal Information</h2>
                  <button className="text-blue-600 flex items-center text-sm font-medium">
                    <Edit size={16} className="mr-1" />
                    Edit
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</h3>
                    <p className="text-gray-800">John Smith</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</h3>
                    <p className="text-gray-800">john.smith@bizradar.com</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Company</h3>
                    <p className="text-gray-800">Bizradar Inc.</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Role</h3>
                    <p className="text-gray-800">Administrator</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Account Preferences</h2>
                  <button className="text-blue-600 flex items-center text-sm font-medium">
                    <Edit size={16} className="mr-1" />
                    Edit
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Language</h3>
                    <p className="text-gray-800">English (US)</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Time Zone</h3>
                    <p className="text-gray-800">Eastern Time (US & Canada)</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Date Format</h3>
                    <p className="text-gray-800">MM/DD/YYYY</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Theme</h3>
                    <p className="text-gray-800">Light</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "billing" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Billing and Payments</h1>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Current Plan</h2>
                  <button className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm">
                    Upgrade Plan
                  </button>
                </div>
                
                <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                  <div className="mr-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building size={24} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Business Plan</h3>
                    <p className="text-sm text-gray-600">Up to 10 users, unlimited searches, 100 RFP responses per month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">$199<span className="text-sm font-normal text-gray-500">/month</span></p>
                    <p className="text-sm text-gray-500">Billed annually</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium mb-1">Current Billing Cycle</h4>
                    <p className="text-sm text-gray-600">Jan 1, 2025 - Dec 31, 2025</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium mb-1">Next Invoice</h4>
                    <p className="text-sm text-gray-600">Dec 15, 2025 ($2,388.00)</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium mb-1">Payment Method</h4>
                    <p className="text-sm text-gray-600">Visa ending in 4242</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Payment Methods</h2>
                  <button className="text-blue-600 flex items-center text-sm font-medium">
                    <CreditCard size={16} className="mr-1" />
                    Add New Card
                  </button>
                </div>
                
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-6 bg-blue-600 rounded mr-3 flex items-center justify-center text-white text-xs font-bold">
                        VISA
                      </div>
                      <div>
                        <p className="font-medium">Visa ending in 4242</p>
                        <p className="text-sm text-gray-500">Expires 12/2028</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-3">Default</span>
                      <button className="text-gray-500 hover:text-gray-700">
                        <Edit size={16} />
                      </button>
                      <button className="text-gray-500 hover:text-red-600 ml-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-6 bg-gray-800 rounded mr-3 flex items-center justify-center text-white text-xs font-bold">
                        MC
                      </div>
                      <div>
                        <p className="font-medium">Mastercard ending in 8888</p>
                        <p className="text-sm text-gray-500">Expires 07/2026</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button className="text-blue-600 text-sm font-medium mr-3">Set as default</button>
                      <button className="text-gray-500 hover:text-gray-700">
                        <Edit size={16} />
                      </button>
                      <button className="text-gray-500 hover:text-red-600 ml-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "about" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">About Bizradar</h1>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex mb-6">
                  <div className="mr-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                      <SettingsIcon size={32} className="text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Bizradar v3.4.2</h2>
                    <p className="text-gray-600">The leading platform for government contract opportunities</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Company Information</h3>
                    <p className="text-sm text-gray-600 mb-1">Bizradar Inc.</p>
                    <p className="text-sm text-gray-600 mb-1">123 Tech Parkway, Suite 400</p>
                    <p className="text-sm text-gray-600 mb-1">San Francisco, CA 94105</p>
                    <p className="text-sm text-gray-600">support@bizradar.com</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-2">System Information</h3>
                    <p className="text-sm text-gray-600 mb-1">Version: 3.4.2 (Build 27685)</p>
                    <p className="text-sm text-gray-600 mb-1">Last Updated: February 28, 2025</p>
                    <p className="text-sm text-gray-600 mb-1">Database Version: 12.4</p>
                    <p className="text-sm text-gray-600">Environment: Production</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Legal Information</h3>
                  <div className="flex gap-4">
                    <a href="#" className="text-blue-600 text-sm hover:underline">Terms of Service</a>
                    <a href="#" className="text-blue-600 text-sm hover:underline">Privacy Policy</a>
                    <a href="#" className="text-blue-600 text-sm hover:underline">Security</a>
                    <a href="#" className="text-blue-600 text-sm hover:underline">Compliance</a>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold mb-2">Our Mission</h3>
                  <p className="text-gray-600 mb-4">
                    Bizradar is dedicated to democratizing access to government contracts. Our platform simplifies 
                    the process of finding, analyzing, and responding to RFPs across federal, state, and local
                    government agencies. By leveraging AI and machine learning, we help businesses of all sizes
                    compete more effectively in the government marketplace.
                  </p>
                  <p className="text-gray-600">
                    Founded in 2021, Bizradar has helped over 5,000 companies secure more than $1.2 billion
                    in government contracts. Our team of experts combines deep knowledge of procurement
                    processes with cutting-edge technology to deliver the most comprehensive government
                    contracting platform available.
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg border border-blue-100 p-6">
                <h2 className="text-lg font-semibold mb-3">Need Help?</h2>
                <p className="text-gray-700 mb-4">
                  Our support team is available 24/7 to assist you with any questions about Bizradar.
                </p>
                <div className="flex gap-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-1 shadow-sm">
                    <Mail size={16} />
                    <span>Contact Support</span>
                  </button>
                  <button className="bg-white text-gray-700 px-4 py-2 rounded-md text-sm flex items-center gap-1 shadow-sm border border-gray-200">
                    <HelpCircle size={16} className="text-blue-600" />
                    <span>Visit Help Center</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Add more sections as needed */}
          {activeSection === "notifications" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
              {/* Notification content goes here */}
            </div>
          )}
          
          {activeSection === "security" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
              {/* Security content goes here */}
            </div>
          )}
          
          {activeSection === "subscription" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Subscription Plans</h1>
              {/* Subscription content goes here */}
            </div>
          )}
          
          {activeSection === "help" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Help & Support</h1>
              {/* Help content goes here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}