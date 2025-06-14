import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, ArrowRight, Settings } from "lucide-react";
import { SearchBarProps } from "@/models/opportunities";

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, handleSearch, clearSearch }) => {
  const navigate = useNavigate();

  return (
    <div className="p-2 border-b border-gray-200 bg-white sticky top-0 z-20">
      <form onSubmit={handleSearch} className="flex items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-blue-400" />
          </div>
          <input
            type="text"
            placeholder="Search opportunities by keywords, agency, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all shadow-sm bg-gray-50"
          />
          {searchQuery && (
            <div className="absolute inset-y-0 right-12 pr-3 flex items-center">
              <button
                type="button"
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="submit"
              className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-sm transition-all"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="p-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
        >
          <Settings size={18} />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;