import React from "react";
import { motion } from "framer-motion";
import { 
  Calendar, Copy, Search, ChevronRight, MessageCircle,
  Calendar as CalendarIcon, BarChart2, Settings, User, 
  Radar,
  Home
} from "lucide-react";
import { Link } from "react-router-dom";

// Removed the toggle props since sidebar will be fixed
const SideBar: React.FC = () => {
  // Fixed sidebar width - no longer toggleable
  const sidebarOpen = true;
  
  const menuItems = [
    { icon: <Home size={18} />, label: "Home", path: "/" },
    // { icon: <Copy size={18} />, label: "My Proposal Documents", path: "/proposals" },
    { icon: <Search size={18} />, label: "Opportunities", path: "/opportunites", active: true },
    // { icon: <CalendarIcon size={18} />, label: "Schedules", path: "/schedules" },
    { icon: <MessageCircle size={18} />, label: "Ask AI", path: "/ask-ai" },
    { icon: <BarChart2 size={18} />, label: "Pursuits/Search", path: "/pursuits" },
    { icon: <Copy size={18} />, label: "Library", path: "/library" },
    { icon: <Settings size={18} />, label: "Settings", path: "/settings" }
  ];

  return (
    <div className="border-r border-gray-200 flex flex-col relative bg-white shadow-sm w-56">
      <div className="p-4 border-b border-gray-200 flex items-center">
        <Link to="/" className="flex items-center gap-3">
          <div className="relative">
            <Radar className="w-8 h-8 text-blue-600" />
          </div>
          <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-transparent bg-clip-text overflow-hidden whitespace-nowrap">
            Bizradar
          </span>
        </Link>
      </div>
      
      <div className="p-2 flex-1 overflow-hidden">
        <ul className="space-y-1">
          {menuItems.map((item, i) => (
            <li 
              key={i}
              className={`rounded-lg ${item.active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}
            >
              <Link 
                to={item.path} 
                className="flex items-center gap-2 px-3 py-2.5 text-sm"
              >
                <span className={item.active ? "text-blue-600" : "text-gray-500"}>
                  {item.icon}
                </span>
                <span className="whitespace-nowrap overflow-hidden font-medium">
                  {item.label}
                </span>
                {item.active && (
                  <div className="ml-auto">
                    <ChevronRight size={19} className="text-blue-600" />
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-2 mt-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <User size={16} className="text-white" />
          </div>
          <span className="text-sm whitespace-nowrap overflow-hidden font-medium">
            User
          </span>
        </div>
      </div>
    </div>
  );
};

export default SideBar;

// import React from "react";
// import { motion } from "framer-motion";
// import { 
//   Calendar, Copy, Search, ChevronRight, MessageCircle,
//   Calendar as CalendarIcon, BarChart2, Settings, User, 
//   Radar,
//   Home
// } from "lucide-react";
// import { Link } from "react-router-dom";

// // Removed the toggle props since sidebar will be fixed
// const SideBar: React.FC = () => {
//   // Fixed sidebar width - no longer toggleable
//   const sidebarOpen = true;
  
//   const menuItems = [
//     { icon: <Home size={18} />, label: "Home" },
//     // { icon: <Copy size={18} />, label: "My Proposal Documents" },
//     { icon: <Search size={18} />, label: "Opportunities", active: true },
//     // { icon: <CalendarIcon size={18} />, label: "Schedules" },
//     { icon: <MessageCircle size={18} />, label: "Ask AI" },
//     { icon: <BarChart2 size={18} />, label: "Pursuits/Search" },
//     { icon: <Copy size={18} />, label: "Library" },
//     { icon: <Settings size={18} />, label: "Settings" }
//   ];

//   return (
//     <div className="border-r border-gray-200 flex flex-col relative bg-white shadow-sm w-56">
//       <div className="p-4 border-b border-gray-200 flex items-center">
//         <Link to="/" className="flex items-center gap-3">
//           <div className="relative">
//             <Radar className="w-8 h-8 text-blue-600" />
//           </div>
//           <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-transparent bg-clip-text overflow-hidden whitespace-nowrap">
//             Bizradar
//           </span>
//         </Link>
//       </div>
      
//       <div className="p-2 flex-1 overflow-hidden">
//         <ul className="space-y-1">
//           {menuItems.map((item, i) => (
//             <li 
//               key={i}
//               className={`rounded-lg ${item.active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}
//             >
//               <a href="#" className="flex items-center gap-2 px-3 py-2.5 text-sm">
//                 <span className={item.active ? "text-blue-600" : "text-gray-500"}>
//                   {item.icon}
//                 </span>
//                 <span className="whitespace-nowrap overflow-hidden font-medium">
//                   {item.label}
//                 </span>
//                 {item.active && (
//                   <div className="ml-auto">
//                     <ChevronRight size={19} className="text-blue-600" />
//                   </div>
//                 )}
//               </a>
//             </li>
//           ))}
//         </ul>
//       </div>
      
//       <div className="p-3 border-t border-gray-200">
//         <div className="flex items-center gap-2 mt-2">
//           <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
//             <User size={16} className="text-white" />
//           </div>
//           <span className="text-sm whitespace-nowrap overflow-hidden font-medium">
//             User
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SideBar;