import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/Auth/useAuth';
import { Radar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../utils/supabase';

const CompanySetup: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    role: 'Administrator' // Default role
  });
  
  // Check if user is authenticated, if not redirect to login
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [navigate]);
  
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
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      console.log('Creating company with data:', formData);
      
      // First, create the company in the database
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.name,
          url: formData.url,
          description: formData.description
        })
        .select()
        .single();
      
      if (companyError) {
        console.error('Error creating company:', companyError);
        throw companyError;
      }
      
      console.log('Company created:', companyData);
      
      // Then, create the relationship between user and company
      const { error: relationError } = await supabase
        .from('user_companies')
        .insert({
          user_id: user.id,
          company_id: companyData.id,
          role: formData.role,
          is_primary: true
        });
      
      if (relationError) {
        console.error('Error creating company relationship:', relationError);
        throw relationError;
      }
      
      // Success notification
      toast.success('Company information saved successfully!');
      
      // Show settings notification and redirect to dashboard
      sessionStorage.setItem('showSettingsNotification', 'true');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving company information:', error);
      toast.error('Failed to save company information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Skip setup and continue to dashboard
  const handleSkip = () => {
    sessionStorage.setItem('showSettingsNotification', 'true');
    navigate('/dashboard');
  };
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-bl from-blue-100 to-transparent transform rotate-12 rounded-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-gradient-to-tr from-emerald-50 to-transparent transform -rotate-12 rounded-3xl"></div>
        <div className="absolute top-1/4 right-20 w-32 h-32 border border-blue-300 rounded-full opacity-40"></div>
        <div className="absolute bottom-1/4 left-10 w-48 h-48 border border-emerald-300 rounded-full opacity-30"></div>
        <div className="absolute top-1/5 left-1/3 w-64 h-64 rounded-full bg-blue-50 blur-3xl opacity-50"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full bg-emerald-50 blur-3xl opacity-60"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-2xl mx-4">
        <div className="bg-white/90 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-gray-200 p-8">
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="Your Company"
                required
              />
            </div>
            
            {/* Company URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                Company Website URL
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="https://www.example.com"
              />
            </div>
            
            {/* Company Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                Company Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="Brief description of your company..."
              ></textarea>
            </div>
            
            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                Your Role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="Administrator"
                required
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Skip for now
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-6 text-sm text-gray-500">
            You can always update this information later from your Settings page.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySetup;