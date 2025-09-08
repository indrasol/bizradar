import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/Auth/useAuth';
import { Radar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../utils/supabase';
import { companyApi, CompanySetupData } from '../api/company';
import { ResponsivePatterns } from '../utils/responsivePatterns';

const CompanySetup: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state - removed role field as it will be set to 'user' by default
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: ''
  });
  
  // Check if user is authenticated and if they already have a company setup
  useEffect(() => {
    const checkUserAndCompany = async () => {
      // Since email confirmation is required, user should always have a session
      if (!user) {
        navigate('/login');
        return;
      }
      
      // Check if user already has a company setup using the new API
      try {
        const hasSetup = await companyApi.hasCompanySetup(user.id);
        if (hasSetup) {
          // User already has company setup, redirect to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking company setup:', error);
        // Continue with setup if there's an error
      }
    };
    
    checkUserAndCompany();
  }, [navigate, user]);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Since email confirmation is required, user should always be authenticated
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      console.log('Setting up company with data:', formData);
      
      // Prepare company setup data
      const setupData: CompanySetupData = {
        user_id: user.id,
        company_name: formData.name,
        company_url: formData.url || undefined,
        company_description: formData.description || undefined,
        user_role: 'user' // Default role
      };
      
      // Call the new backend API for complete company setup
      const result = await companyApi.setupCompany(setupData);
      
      if (result.success) {
        console.log('Company setup completed:', result.data);
        
        // Success notification
        toast.success('Company setup completed successfully! You now have access to the Free Tier.', 
          ResponsivePatterns.toast.config
        );
        
        // Set flag to show welcome message on dashboard
        sessionStorage.setItem('showWelcomeMessage', 'true');
        
        // Redirect to dashboard instead of opportunities
        navigate('/dashboard');
      } else {
        throw new Error(result.message || 'Company setup failed');
      }
      
    } catch (error: any) {
      console.error('Error setting up company:', error);
      toast.error(error.message || 'Failed to set up company. Please try again.', 
        ResponsivePatterns.toast.config
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  
  return (
    <div className="flex justify-center items-center min-h-screen w-full bg-gradient-to-b from-white to-gray-50 relative overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 sm:w-80 lg:w-96 h-64 sm:h-80 lg:h-96 bg-gradient-to-bl from-blue-100 to-transparent transform rotate-12 rounded-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-64 sm:w-80 lg:w-96 h-64 sm:h-80 lg:h-96 bg-gradient-to-tr from-emerald-50 to-transparent transform -rotate-12 rounded-3xl"></div>
        <div className="absolute top-1/4 right-5 sm:right-10 lg:right-20 w-20 sm:w-24 lg:w-32 h-20 sm:h-24 lg:h-32 border border-blue-300 rounded-full opacity-40"></div>
        <div className="absolute bottom-1/4 left-2 sm:left-5 lg:left-10 w-32 sm:w-40 lg:w-48 h-32 sm:h-40 lg:h-48 border border-emerald-300 rounded-full opacity-30"></div>
        <div className="absolute top-1/5 left-1/3 w-40 sm:w-52 lg:w-64 h-40 sm:h-52 lg:h-64 rounded-full bg-blue-50 blur-3xl opacity-50"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 sm:w-32 lg:w-40 h-24 sm:h-32 lg:h-40 rounded-full bg-emerald-50 blur-3xl opacity-60"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-sm sm:max-w-lg lg:max-w-2xl xl:max-w-3xl">
        <div className="bg-white/90 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
          {/* Logo & Title */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Radar className="w-8 h-8 text-blue-600" />
                <div className="absolute inset-0 bg-blue-100 rounded-full -z-10"></div>
              </div>
              <span className="text-2xl font-semibold bg-blue-600 bg-clip-text text-transparent">Bizradar</span>
            </div>
            
            <h2 className="text-2xl font-medium text-gray-800 ml-4 relative">
              <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-emerald-400 rounded-r-md"></div>
              Complete Your Profile
            </h2>
            <p className="text-gray-600 mt-2 text-center">
              Tell us about your company to get started. This information will be displayed in your profile.
            </p>
          </div>
          
          {/* Company Setup Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Company Name */}
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all text-sm sm:text-base"
                placeholder="Your Company"
                required
              />
            </div>
            
            {/* Company URL */}
            <div>
              <label htmlFor="url" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-1">
                Company Website URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all text-sm sm:text-base"
                placeholder="https://www.example.com"
                required
              />
            </div>
            
            {/* Company Description */}
            <div>
              <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-1">
                Company Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all text-sm sm:text-base"
                placeholder="Brief description of your company..."
              ></textarea>
            </div>
            
            {/* Action Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanySetup;