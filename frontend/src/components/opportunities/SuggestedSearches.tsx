import React from "react";
import { HelpCircle, TrendingUp, Sparkles } from "lucide-react";

import { SuggestedSearchesProps } from "../../models/opportunities"

const SuggestedSearches: React.FC<SuggestedSearchesProps> = ({ suggestedQueries, handleSuggestedQueryClick }) => {
  return (
    <div className="p-6 bg-gradient-to-br from-white via-blue-50/30 to-white rounded-2xl border border-gray-200 shadow-lg mb-6 max-w-8xl mx-auto relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-100/40 to-transparent rounded-full -ml-12 -mb-12"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">Popular Searches</h2>
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-blue-500" />
              <p className="text-gray-600 text-sm">Discover opportunities tailored to your expertise</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {suggestedQueries.map((query, index) => (
            <div
              key={query.id}
              onClick={() => handleSuggestedQueryClick(query.id)}
              className="group relative bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              {/* Card accent */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-50 to-transparent rounded-tr-xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300 shadow-sm">
                    <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
                      {query.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 text-base">
                      {query.title}
                    </h3>
                  </div>
                </div>
                
                <div className="bg-gray-50/80 group-hover:bg-blue-50/80 rounded-lg p-3 transition-all duration-300">
                  <p className="text-gray-600 text-sm leading-relaxed mb-2">
                    {query.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Click to search</span>
                    <span className="text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      Explore →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 pt-1 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-blue-500" />
          <span className="text-sm text-gray-600">
            Need help finding opportunities? Try our <a href="#" className="text-blue-600 font-medium">guided search wizard</a> 
            {/* or{" "}
            <a href="#" className="text-blue-600 font-medium">contact support</a>. */}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SuggestedSearches;