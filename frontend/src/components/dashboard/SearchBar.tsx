import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TypeWriter } from "../ui/TypeWriter";  // Update this line
import { motion, AnimatePresence } from "framer-motion";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

interface SearchBarProps {
  selectionType: string;
  platform: string;
  onSearchResults: (results: any) => void;
  onRefinedQuery?: (originalQuery: string, refinedQuery: string) => void;
}

export const SearchBar = ({ 
  selectionType, 
  platform, 
  onSearchResults,
  onRefinedQuery
}: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refinedQuery, setRefinedQuery] = useState("");
  const [showRefinedQuery, setShowRefinedQuery] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setShowRefinedQuery(false);
    
    try {
      const response = await fetch(API_ENDPOINTS.SEARCH_OPPORTUNITIES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          contract_type: selectionType,
          platform
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Search response:', data);
      
      if (data.refined_query) {
        // Clear existing query first
        setRefinedQuery('');
        
        // Show the container first
        setShowRefinedQuery(true);
        
        // Short delay before starting the animation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Set the new query to trigger animation
        setRefinedQuery(data.refined_query);
        
        // Notify parent component
        onRefinedQuery?.(query, data.refined_query);
        
        // Wait for animation to complete before showing results
        const animationDuration = data.refined_query.length * 35 + 500;
        await new Promise(resolve => setTimeout(resolve, animationDuration));
        
        onSearchResults(data);
      } else {
        onSearchResults(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search opportunities..."
          value={query}
          // onChange={(e) => setQuery(e.target.value)}
          // onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="w-full"
        />
        <Link 
          to="/Login"
          // onClick={handleSearch} 
          // disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all flex items-center gap-1"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
          {/* {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Searching...</span>
            </div>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search
            </>
          )} */}
        </Link>
      </div>

      <AnimatePresence mode="wait">
        {showRefinedQuery && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-lg border border-blue-100 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">AI-Enhanced Search Query:</span>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-md p-4">
              {refinedQuery && (
                <TypeWriter
                  text={refinedQuery}
                  onComplete={() => {
                    console.log('Animation completed');
                  }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
