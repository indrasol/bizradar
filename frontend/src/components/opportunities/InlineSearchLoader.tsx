import React from "react";
import { Search, Loader2 } from "lucide-react";

interface InlineSearchLoaderProps {
  searchQuery: string;
  resultCount?: number;
  isSearching: boolean;
}

const InlineSearchLoader: React.FC<InlineSearchLoaderProps> = ({ 
  searchQuery, 
  resultCount = 0, 
  isSearching 
}) => {
  // No complex state needed - just show search then results
  return (
    <div className="p-8 mx-auto my-4 bg-gradient-to-br from-white via-blue-50/30 to-white border border-gray-200 rounded-2xl shadow-lg max-w-4xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-100/40 to-transparent rounded-full -ml-12 -mb-12"></div>
      
      <div className="relative z-10">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center text-center">
            {/* Animated Search Icon */}
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Loader2 size={28} className="text-white animate-spin" />
              </div>
              {/* Pulse rings */}
              <div className="absolute inset-0 w-16 h-16 bg-blue-400 rounded-2xl animate-ping opacity-20"></div>
              <div className="absolute inset-0 w-16 h-16 bg-blue-300 rounded-2xl animate-ping opacity-10" style={{ animationDelay: '0.5s' }}></div>
            </div>

            {/* Title with animated dots */}
            <div className="mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent flex items-center gap-2">
                Searching for opportunities
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </h3>
            </div>

            {/* Search query display */}
            <div className="mb-6 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
              <p className="text-gray-600 text-sm font-medium">
                <span className="text-blue-600">"</span>
                <span className="text-gray-800">{searchQuery}</span>
                <span className="text-blue-600">"</span>
              </p>
            </div>



            {/* Enhanced Blue-themed Progress bar with moving animation */}
            <div className="w-full max-w-md">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative">
                {/* Base blue gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-full"></div>
                {/* Moving shine effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"
                  style={{
                    animation: 'shimmer 2.5s infinite',
                    backgroundSize: '200% 100%'
                  }}
                ></div>
                {/* Pulsing overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-300/40 via-blue-200/40 to-blue-300/40 rounded-full animate-pulse"></div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">This usually takes a few seconds...</p>
            </div>
            
            {/* Add shimmer keyframe animation */}
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes shimmer {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
              `
            }} />
          </div>
        ) : (
          /* Search Complete State */
          <div className="flex flex-col items-center justify-center text-center">
            {/* Success Icon */}
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Search size={28} className="text-white" />
              </div>
              {/* Success pulse */}
              <div className="absolute inset-0 w-16 h-16 bg-emerald-400 rounded-2xl animate-ping opacity-20"></div>
            </div>

            {/* Success message */}
            <div className="mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                Search Complete!
              </h3>
            </div>

            {/* Search query */}
            <div className="mb-4 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
              <p className="text-gray-600 text-sm font-medium">
                <span className="text-emerald-600">"</span>
                <span className="text-gray-800">{searchQuery}</span>
                <span className="text-emerald-600">"</span>
              </p>
            </div>

            {/* Results count */}
            <div className="px-6 py-3 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 rounded-xl border border-emerald-300">
              <div className="flex items-center gap-2 text-lg font-bold">
                <span className="animate-in zoom-in-50 duration-500">
                  {resultCount.toLocaleString()}
                </span>
                <span>opportunity{resultCount !== 1 ? 's' : ''} found</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineSearchLoader;
