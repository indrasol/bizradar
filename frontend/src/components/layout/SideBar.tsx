import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  FileText, 
  Settings,
  Radar
} from 'lucide-react';
import SettingsNotification from './SettingsNotification';
import { useAuth } from '../Auth/useAuth';
import { supabase } from '../../utils/supabase';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  
  // Fetch user profile separately
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        if (data) setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchProfile();
  }, [user]);
  
  // Check if the path matches the given route
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="h-full w-64 bg-gray-50 border-r border-gray-200">
      <div className="flex flex-col h-full py-6">
        {/* Logo */}
        <div className="px-6 mb-8">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="relative">
              <Radar className="w-6 h-6 text-blue-600" />
              <div className="absolute inset-0 bg-blue-100 rounded-full -z-10"></div>
            </div>
            <span className="font-semibold text-lg text-gray-900">Bizradar</span>
          </Link>
        </div>
        
        {/* User Info */}
        {profile && (
          <div className="px-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {profile.first_name} {profile.last_name}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${
              isActive('/dashboard') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
          
          <Link
            to="/opportunities"
            className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${
              isActive('/opportunities') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Search className="w-5 h-5" />
            <span>Opportunities</span>
          </Link>
          
          <Link
            to="/pursuits"
            className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${
              isActive('/pursuits') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Pursuits</span>
          </Link>
        </nav>
        
        {/* Bottom Links */}
        <div className="px-4 pt-4 border-t border-gray-200">
          <Link
            to="/settings"
            className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors group ${
              isActive('/settings') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="relative">
              <Settings className="w-5 h-5" />
              <SettingsNotification />
            </div>
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;