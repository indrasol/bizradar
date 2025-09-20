import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TypeWriter } from "../ui/TypeWriter";
import { motion, AnimatePresence } from "framer-motion";
// 🆕
import { useTrack } from "@/logging";

const isDevelopment =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_BASE_URL = isDevelopment
  ? "http://localhost:5000"
  : import.meta.env.VITE_API_BASE_URL;

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
  onRefinedQuery,
}: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refinedQuery, setRefinedQuery] = useState("");
  const [showRefinedQuery, setShowRefinedQuery] = useState(false);

  // 🆕 get the reusable tracker
  const track = useTrack();

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;

    // 🆕 fire the log immediately (one POST)
    track({
      event_name: "search_initiated",
      event_type: "btn_click",
      metadata: {
        search_query: query,
        stage: null,
        section: null,
        opportunity_id: null,
        title: null,           
        naics_code: null,
      },
    });

    setIsLoading(true);
    setShowRefinedQuery(false);

    try {
      const response = await fetch(`${API_BASE_URL}/search-opportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          contract_type: selectionType,
          platform,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.refined_query) {
        setRefinedQuery("");
        setShowRefinedQuery(true);
        await new Promise((r) => setTimeout(r, 100));
        setRefinedQuery(data.refined_query);

        onRefinedQuery?.(query, data.refined_query);

        const animationDuration = data.refined_query.length * 35 + 500;
        await new Promise((r) => setTimeout(r, animationDuration));

        onSearchResults(data);
      } else {
        onSearchResults(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search opportunities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}         
          onKeyDown={handleKeyDown}                          
          className="w-full"
        />
        {/* 🆕 real button instead of Link */}
        <Button
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all flex items-center gap-1"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search
            </>
          )}
        </Button>
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
              <span className="text-sm font-medium text-blue-600">
                AI-Enhanced Search Query:
              </span>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-md p-4">
              {refinedQuery && (
                <TypeWriter
                  text={refinedQuery}
                  onComplete={() => {
                    /* no-op */
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
