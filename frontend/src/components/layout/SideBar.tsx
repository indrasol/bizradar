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
  Bot,
  ChevronRight
} from 'lucide-react';
import SettingsNotification from './SettingsNotification';
import { useAuth } from '../Auth/useAuth';
import { supabase } from '../../utils/supabase';
import { toast } from 'sonner';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
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
          
        if (error) {
          console.error('Error fetching profile from Supabase:', error);
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
      }
    };
    
    fetchProfile();
  }, [user]);
  
  // Check if the path matches the given route
  const isActive = (path) => location.pathname === path;
  
  const handleAdminClick = (e) => {
    if (!isAdmin) {
      e.preventDefault();
      toast.error("You don't have permission to access the Admin Zone");
    }
  };
  
  return (
    <div className={`h-full bg-gray-50 border-r border-gray-200 transition-all duration-300 flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex flex-col h-full py-6 relative">
        {/* Toggle Button */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md focus:outline-none transition-all"
        >
          <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
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
        
        {/* User Info */}
        {profile && (
          <div className={`${collapsed ? 'px-2' : 'px-6'} mb-8`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl bg-gradient-to-r from-blue-50 to-white border border-blue-100`}>
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium shadow-sm">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {profile.first_name} {profile.last_name}
                  </p>
                  {isAdmin && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Administrator
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Navigation Links */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} space-y-2`}>
          <Link
            to="/dashboard"
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isActive('/dashboard') 
                ? 'bg-blue-100 text-blue-700 shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className={`flex items-center justify-center ${isActive('/dashboard') ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'}`}>
              <Home className="w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="font-medium">Home</span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Home
              </div>
            )}
          </Link>
          
          <Link
            to="/opportunities"
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isActive('/opportunities') 
                ? 'bg-blue-100 text-blue-700 shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className={`flex items-center justify-center ${isActive('/opportunities') ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'}`}>
              <Search className="w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="font-medium">Opportunities</span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Opportunities
              </div>
            )}
          </Link>
          
          <Link
            to="/pursuits"
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isActive('/pursuits') 
                ? 'bg-blue-100 text-blue-700 shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className={`flex items-center justify-center ${isActive('/pursuits') ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'}`}>
              <FileText className="w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="font-medium">Pursuits</span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Pursuits
              </div>
            )}
          </Link>
          
          <Link
            to="/settings"
            className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isActive('/settings') 
                ? 'bg-blue-100 text-blue-700 shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Settings className={`w-5 h-5 ${isActive('/settings') ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'}`} />
              <SettingsNotification />
            </div>
            {!collapsed && (
              <span className="font-medium">Settings</span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Settings
              </div>
            )}
          </Link>
          
          {/* Admin Zone - Visible to all but styled differently for non-admins */}
          <div className="relative group">
            <Link
              to="/admin"
              onClick={handleAdminClick}
              className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive('/admin') && isAdmin 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : isAdmin 
                    ? 'text-gray-700 hover:bg-gray-100' 
                    : 'text-gray-400 hover:bg-gray-100/50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center">
                <Lock className={`w-5 h-5 ${isAdmin && isActive('/admin') ? 'text-blue-600' : isAdmin ? 'text-gray-600 group-hover:text-blue-600' : 'text-gray-400'}`} />
              </div>
              {!collapsed && (
                <span className="font-medium">Admin Zone</span>
              )}
              {!collapsed && !isAdmin && (
                <Lock className="w-3.5 h-3.5 ml-auto text-gray-400" />
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
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
        </nav>
        
        {/* Bottom Links */}
        <div className={`${collapsed ? 'px-2' : 'px-4'} pt-4 border-t border-gray-200 mt-2`}>
          <Link
            to="/ask-ai"
            className={`group flex ${collapsed ? 'flex-col items-center' : 'items-center gap-3'} px-3 py-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white shadow-sm hover:shadow-md transition-all duration-300 ${
              isActive('/ask-ai') ? 'from-emerald-100 to-emerald-50 border-emerald-300' : ''
            }`}
          >
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            {!collapsed ? (
              <>
                <span className="font-medium text-blue-600">Bizradar AI</span>
                <div className="ml-auto flex items-center">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-xs font-medium">New</span>
                </div>
              </>
            ) : (
              <div className="mt-1">
                <span className="inline-flex h-4 w-4 items-center justify-center bg-emerald-100 text-emerald-600 rounded-full text-xs font-medium">N</span>
              </div>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Bizradar AI <span className="ml-1 px-1 bg-emerald-600 rounded text-xs">New</span>
              </div>
            )}
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