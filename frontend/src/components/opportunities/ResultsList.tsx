import React, { useRef, useEffect } from "react";
import { Download, Bell, Shield, Search, Zap, Database, Code } from "lucide-react";
import OpportunityCard from "./OpportunityCard";
import Pagination from "./Pagination";
import SuggestedSearches from "./SuggestedSearches";
import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";

import { ResultsListProps, SuggestedQuery } from "../../models/opportunities"

const ResultsList: React.FC<ResultsListProps & { onScroll?: (scrollTop: number) => void, scrollContainerRef?: React.RefObject<HTMLDivElement> }> = ({
  opportunities,
  isSearching,
  hasSearched,
  totalResults,
  currentPage,
  totalPages,
  paginate,
  handleAddToPursuit,
  handleBeginResponse,
  handleViewDetails,
  sortBy,
  setSortBy,
  expandedDescriptions,
  setExpandedDescriptions,
  refinedQuery,
  handleSuggestedQueryClick,
  onScroll,
  scrollContainerRef,
}) => {
  const suggestedQueries: SuggestedQuery[] = [
    {
      id: "cybersecurity",
      title: "Cybersecurity Contracts",
      icon: <Shield size={20} className="text-blue-500" />,
      description:
        "Find government contracts related to cybersecurity services, threat monitoring, and security operations.",
    },
    {
      id: "ai-ml",
      title: "AI & Machine Learning",
      icon: <Zap size={20} className="text-purple-500" />,
      description:
        "Explore opportunities involving artificial intelligence, machine learning, and data science.",
    },
    {
      id: "data-management",
      title: "Data Management",
      icon: <Database size={20} className="text-green-500" />,
      description:
        "Discover contracts focused on data management, analytics, and information systems.",
    },
    {
      id: "software-dev",
      title: "Software Development",
      icon: <Code size={20} className="text-amber-500" />,
      description:
        "Find contracts for custom software development, maintenance, and IT services.",
    },
  ];
   
  const internalRef = useRef<HTMLDivElement>(null);
  const refToUse = scrollContainerRef || internalRef;

  useEffect(() => {
    const handleScroll = () => {
      if (onScroll && refToUse.current) {
        onScroll(refToUse.current.scrollTop);
      }
    };
    const node = refToUse.current;
    if (node) {
      node.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (node) {
        node.removeEventListener("scroll", handleScroll);
      }
    };
  }, [onScroll, refToUse]);

  return (
    <div ref={refToUse} className="flex-1 overflow-y-auto p-2 results-container">
      <div className="border-b border-gray-200 px-5 py-2 bg-white flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div
            className={`py-3 px-1 border-b-2 ${sortBy === "relevance" ? "border-blue-500 text-blue-600 font-medium" : "border-transparent text-gray-500 hover:text-gray-700"} cursor-pointer`}
            onClick={() => setSortBy("relevance")}
          >
            Most Relevant
          </div>
          <div
            className={`py-3 px-1 border-b-2 ${sortBy === "ending_soon" ? "border-blue-500 text-blue-600 font-medium" : "border-transparent text-gray-500 hover:text-gray-700"} cursor-pointer`}
            onClick={() => setSortBy("ending_soon")}
          >
            Ending Soon
          </div>
        </div>
        {hasSearched && (
          <div className="flex items-center gap-3">
            <div className="py-1 px-3 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {totalResults} {totalResults === 1 ? "result" : "results"}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 shadow-sm hover:bg-gray-50 transition-colors"
                onClick={() => {
                  // Try to get all results from sessionStorage (allOpportunitiesForExport)
                  let allOpportunities = opportunities;
                  try {
                    const state = sessionStorage.getItem("allOpportunitiesForExport");
                    if (state) {
                      const parsed = JSON.parse(state);
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        allOpportunities = parsed;
                      }
                    }
                  } catch (e) {
                    // fallback to current opportunities
                  }
                  if (!allOpportunities || allOpportunities.length === 0) {
                    toast({ title: "No results to export", description: "There are no opportunities to export.", variant: "destructive" });
                    return;
                  }
                  const data = allOpportunities.map(({ id, title, agency, description, platform, external_url, naics_code, published_date, response_date, budget, solicitation_number }) => ({
                    ID: id,
                    Title: title,
                    Agency: agency,
                    Description: description,
                    Platform: platform,
                    URL: external_url,
                    "NAICS Code": naics_code,
                    "Published Date": published_date,
                    "Response Date": response_date,
                    Budget: budget,
                    "Solicitation #": solicitation_number,
                  }));
                  const worksheet = XLSX.utils.json_to_sheet(data);
                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, worksheet, "Opportunities");
                  XLSX.writeFile(workbook, "opportunities.xlsx");
                  toast({ title: "Export Successful", description: `Exported ${allOpportunities.length} opportunities to Excel.` });
                }}
              >
                <Download size={14} className="text-gray-500" />
                <span>Export</span>
              </button>
              <button
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 shadow-sm hover:bg-blue-700 transition-colors"
                onClick={() => {
                  toast({
                    title: "Subscribed!",
                    description: "You will be notified daily about new opportunities.",
                    variant: "default"
                  });
                }}
              >
                <Bell size={14} />
                <span>Notify Me Daily</span>
              </button>
            </div>
          </div>
        )}
      </div>
      {isSearching ? (
        <div className="p-2 mx-auto my-2 bg-white border border-gray-200 rounded-xl shadow-sm max-w-8xl">
          <div className="flex flex-col items-center justify-center py-1">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <p className="mb-8 text-gray-600 font-medium">Searching opportunities...</p>
          </div>
        </div>
      ) : hasSearched ? (
        opportunities.length > 0 ? (
          <div className="space-y-5 max-w-8xl mx-auto">
            {opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                handleAddToPursuit={handleAddToPursuit}
                handleBeginResponse={handleBeginResponse}
                handleViewDetails={handleViewDetails}
                toggleDescription={() => setExpandedDescriptions((prev) => ({ ...prev, [opportunity.id]: !prev[opportunity.id] }))}
                isExpanded={expandedDescriptions[opportunity.id] || false}
                refinedQuery={refinedQuery}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white border border-gray-200 rounded-xl shadow-sm text-center max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-50 rounded-full">
                <Search size={24} className="text-blue-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search terms or filters to find more opportunities.</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Clear Search
            </button>
          </div>
        )
      ) : (
        <SuggestedSearches suggestedQueries={suggestedQueries} handleSuggestedQueryClick={handleSuggestedQueryClick} />
      )}
      <Pagination
        hasSearched={hasSearched}
        isSearching={isSearching}
        totalResults={totalResults}
        currentPage={currentPage}
        totalPages={totalPages}
        paginate={paginate}
      />
    </div>
  );
};

export default ResultsList;