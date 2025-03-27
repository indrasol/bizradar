import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  FileText, 
  Settings,
  Radar,
  Lock,
  AlertCircle,
  Bot
} from 'lucide-react';
import SettingsNotification from './SettingsNotification';
import { useAuth } from '../Auth/useAuth';
import { supabase } from '../../utils/supabase';
import { toast } from 'sonner';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Fetch user profile separately
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      console.log('Fetching profile for user:', user.id);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile from Supabase:', error);
          throw error;
        }
        
        if (data) {
          console.log('Profile data received:', data);
          setProfile(data);
          
          // Simple role check - just look for 'admin' in the role field
          const userRole = (data.role || '').toLowerCase();
          const adminStatus = userRole === 'admin';
          
          console.log('User role:', data.role);
          console.log('Is admin?', adminStatus);
          
          setIsAdmin(adminStatus);
        } else {
          console.log('No profile data found for user');
        }
      } catch (error) {
        console.error('Error in profile fetch process:', error);
      }
    };
    
    fetchProfile();
  }, [user]);
  
  // Check if the path matches the given route
  const isActive = (path: string) => location.pathname === path;
  
  const handleAdminClick = (e: React.MouseEvent) => {
    console.log('Admin link clicked, isAdmin:', isAdmin);
    if (!isAdmin) {
      e.preventDefault();
      toast.error("You don't have permission to access the Admin Zone");
    }
  };
  
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
            <span className="text-xl font-semibold text-blue-600">Bizradar</span>
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
                {isAdmin && (
                  <p className="text-xs text-blue-600">Administrator</p>
                )}
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
          
          {/* Admin Zone - Visible to all but styled differently for non-admins */}
          <div className="relative group">
            <Link
              to="/admin"
              onClick={handleAdminClick}
              className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${
                isActive('/admin') && isAdmin 
                  ? 'bg-blue-100 text-blue-700' 
                  : isAdmin 
                    ? 'text-gray-700 hover:bg-gray-100' 
                    : 'text-gray-400 hover:bg-gray-100/50 cursor-not-allowed'
              }`}
            >
              <Lock className={`w-5 h-5 ${isAdmin ? '' : 'text-gray-400'}`} />
              <span>Admin Zone</span>
              
              {!isAdmin && (
                <Lock className="w-3.5 h-3.5 ml-auto text-gray-400" />
              )}
            </Link>
            
            {/* Tooltip for non-admins */}
            {!isAdmin && (
              <div className="absolute left-0 -bottom-2 translate-y-full w-48 bg-gray-800 text-white text-xs rounded py-1.5 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-lg">
                <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" />
                  <span>Restricted for admins only</span>
                </div>
              </div>
            )}
          </div>
        </nav>
        
        {/* Bottom Links */}
        <div className="px-4 pt-4 border-t border-gray-500">
          <Link
            to="/ask-ai"
            className={`flex items-center gap-3 px-3 py-3 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white shadow-sm hover:shadow-md transition-all duration-300 ${
              isActive('/ask-ai') ? 'from-emerald-100 to-emerald-50 border-emerald-300' : ''
            }`}
          >
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-blue-600">Bizradar AI</span>
            <div className="ml-auto flex items-center">
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-xs font-medium">New</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;



// import React, { useState, useEffect } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { 
//   Home, 
//   Search, 
//   FileText, 
//   Settings,
//   Radar,
//   Lock,
//   AlertCircle
// } from 'lucide-react';
// import SettingsNotification from './SettingsNotification';
// import { useAuth } from '../Auth/useAuth';
// import { supabase } from '../../utils/supabase';
// import { toast } from 'sonner';

// const Sidebar: React.FC = () => {
//   const location = useLocation();
//   const { user } = useAuth();
//   const [profile, setProfile] = useState<any>(null);
//   const [isAdmin, setIsAdmin] = useState(false);
  
//   // Fetch user profile separately
//   useEffect(() => {
//     const fetchProfile = async () => {
//       if (!user) return;
      
//       console.log('Fetching profile for user:', user.id);
      
//       try {
//         const { data, error } = await supabase
//           .from('profiles')
//           .select('*')
//           .eq('id', user.id)
//           .single();
          
//         if (error) {
//           console.error('Error fetching profile from Supabase:', error);
//           throw error;
//         }
        
//         if (data) {
//           console.log('Profile data received:', data);
//           setProfile(data);
          
//           // Simple role check - just look for 'admin' in the role field
//           const userRole = (data.role || '').toLowerCase();
//           const adminStatus = userRole === 'admin';
          
//           console.log('User role:', data.role);
//           console.log('Is admin?', adminStatus);
          
//           setIsAdmin(adminStatus);
//         } else {
//           console.log('No profile data found for user');
//         }
//       } catch (error) {
//         console.error('Error in profile fetch process:', error);
//       }
//     };
    
//     fetchProfile();
//   }, [user]);
  
//   // Check if the path matches the given route
//   const isActive = (path: string) => location.pathname === path;
  
//   const handleAdminClick = (e: React.MouseEvent) => {
//     console.log('Admin link clicked, isAdmin:', isAdmin);
//     if (!isAdmin) {
//       e.preventDefault();
//       toast.error("You don't have permission to access the Admin Zone");
//     }
//   };
  
//   return (
//     <div className="h-full w-64 bg-gray-50 border-r border-gray-200">
//       <div className="flex flex-col h-full py-6">
//         {/* Logo */}
//         <div className="px-6 mb-8">
//           <Link to="/dashboard" className="flex items-center gap-2">
//             <div className="relative">
//               <Radar className="w-6 h-6 text-blue-600" />
//               <div className="absolute inset-0 bg-blue-100 rounded-full -z-10"></div>
//             </div>
//             <span className="font-semibold text-lg text-gray-900">Bizradar</span>
//           </Link>
//         </div>
        
//         {/* User Info */}
//         {profile && (
//           <div className="px-6 mb-6">
//             <div className="flex items-center gap-2">
//               <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium">
//                 {profile.first_name?.[0]}{profile.last_name?.[0]}
//               </div>
//               <div className="overflow-hidden">
//                 <p className="text-sm font-medium text-gray-800 truncate">
//                   {profile.first_name} {profile.last_name}
//                 </p>
//                 {isAdmin && (
//                   <p className="text-xs text-blue-600">Administrator</p>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}
        
//         {/* Navigation Links */}
//         <nav className="flex-1 px-4 space-y-1">
//           <Link
//             to="/dashboard"
//             className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${
//               isActive('/dashboard') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
//             }`}
//           >
//             <Home className="w-5 h-5" />
//             <span>Home</span>
//           </Link>
          
//           <Link
//             to="/opportunities"
//             className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${
//               isActive('/opportunities') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
//             }`}
//           >
//             <Search className="w-5 h-5" />
//             <span>Opportunities</span>
//           </Link>
          
//           <Link
//             to="/pursuits"
//             className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${
//               isActive('/pursuits') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
//             }`}
//           >
//             <FileText className="w-5 h-5" />
//             <span>Pursuits</span>
//           </Link>
          
//           {/* Admin Zone - Visible to all but styled differently for non-admins */}
//           <div className="relative group">
//             <Link
//               to="/admin"
//               onClick={handleAdminClick}
//               className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${
//                 isActive('/admin') && isAdmin 
//                   ? 'bg-blue-100 text-blue-700' 
//                   : isAdmin 
//                     ? 'text-gray-700 hover:bg-gray-100' 
//                     : 'text-gray-400 hover:bg-gray-100/50 cursor-not-allowed'
//               }`}
//             >
//               <Lock className={`w-5 h-5 ${isAdmin ? '' : 'text-gray-400'}`} />
//               <span>Admin Zone</span>
              
//               {!isAdmin && (
//                 <Lock className="w-3.5 h-3.5 ml-auto text-gray-400" />
//               )}
//             </Link>
            
//             {/* Tooltip for non-admins */}
//             {!isAdmin && (
//               <div className="absolute left-0 -bottom-2 translate-y-full w-48 bg-gray-800 text-white text-xs rounded py-1.5 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-lg">
//                 <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
//                 <div className="flex items-center gap-1.5">
//                   <AlertCircle className="w-3 h-3" />
//                   <span>Restricted for admins only</span>
//                 </div>
//               </div>
//             )}
//           </div>
//         </nav>
        
//         {/* Bottom Links */}
//         <div className="px-4 pt-4 border-t border-gray-200">
//           <Link
//             to="/settings"
//             className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors group ${
//               isActive('/settings') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
//             }`}
//           >
//             <div className="relative">
//               <Settings className="w-5 h-5" />
//               <SettingsNotification />
//             </div>
//             <span>Settings</span>
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;