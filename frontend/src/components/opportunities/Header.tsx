import React from "react";
import { Link } from "react-router-dom";
import { Bookmark, ChevronRight, Star, Bell, MessageCircle, Power } from "lucide-react";
import { HeaderProps } from "@/models/opportunities";

const Header: React.FC<HeaderProps> = ({ logout, pursuitCount }) => {
  return (
    <div className="border-b border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm font-medium">Portfolio</span>
          <ChevronRight size={16} className="text-gray-500" />
          <span className="font-medium text-gray-500">Opportunities</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/pursuits" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors">
            <Bookmark size={18} />
            <span className="font-medium">Pursuits</span>
            {pursuitCount > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold rounded-full px-2 py-0.5">
                {pursuitCount}
              </span>
            )}
          </Link>
          <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all flex items-center gap-1">
            <span>Upgrade</span>
            <Star size={14} className="ml-1" />
          </button>
          <div className="relative">
            <Bell size={20} className="text-gray-500 hover:text-gray-700 cursor-pointer" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
          <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-1.5 rounded-lg text-sm flex items-center gap-1 border border-blue-100 transition-colors">
            <MessageCircle size={16} />
            <span className="font-medium">Live Support</span>
          </button>
          <button
            onClick={logout}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-blue-100 transition-colors"
          >
            <Power size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;