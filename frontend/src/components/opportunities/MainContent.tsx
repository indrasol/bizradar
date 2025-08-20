import React from "react";
import FiltersSidebar from "./FiltersSidebar";
import SearchBar from "./SearchBar";
import ResultsList from "./ResultsList";
import { MainContentProps } from "@/models/opportunities";
import RefinedQueryDisplay from "../admin/RefinedQueryDisplay";
import { AnimatePresence, motion } from "framer-motion";
import RecommendationsPanel from "../dashboard/RecommendationsPanel";

const MainContent: React.FC<MainContentProps & { userProfile: { companyUrl?: string; companyDescription?: string }, onResultsScroll?: (scrollTop: number) => void, resultsListRef?: React.RefObject<HTMLDivElement> }> = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  clearSearch,
  filterValues,
  setFilterValues,
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
  refinedQuery,
  showRefinedQuery,
  setShowRefinedQuery,
  sortBy,
  setSortBy,
  expandedDescriptions,
  setExpandedDescriptions,
  handleSuggestedQueryClick,
  applyFilters,
  onResultsScroll,
  resultsListRef,
  userProfile
}) => {
  return (
    <div className="flex-1 flex overflow-hidden">
      <FiltersSidebar
        filterValues={filterValues}
        setFilterValues={setFilterValues}
        applyFilters={applyFilters}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          clearSearch={clearSearch}
        />
        {/* <AnimatePresence mode="wait">
        {showRefinedQuery && refinedQuery && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-lg border border-blue-100 shadow-sm"
          >
          <RefinedQueryDisplay
            originalQuery={searchQuery}
            refinedQuery={refinedQuery}
            isVisible={showRefinedQuery}
            onClose={() => setShowRefinedQuery(false)}
          />
          </motion.div>
        )}
        </AnimatePresence> */}
        {hasSearched && (
          <RecommendationsPanel
            opportunities={opportunities}
            userProfile={userProfile}
            onExpand={() => {}}
            onMinimize={() => {}}
            isExpanded={false}
          />
        )}
        <ResultsList
          opportunities={opportunities}
          isSearching={isSearching}
          hasSearched={hasSearched}
          totalResults={totalResults}
          currentPage={currentPage}
          totalPages={totalPages}
          paginate={paginate}
          handleAddToPursuit={handleAddToPursuit}
          handleBeginResponse={handleBeginResponse}
          handleViewDetails={handleViewDetails}
          sortBy={sortBy}
          setSortBy={setSortBy}
          expandedDescriptions={expandedDescriptions}
          setExpandedDescriptions={setExpandedDescriptions}
          refinedQuery={refinedQuery}
          handleSuggestedQueryClick={handleSuggestedQueryClick}
          onScroll={onResultsScroll}
          scrollContainerRef={resultsListRef}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
};

export default MainContent;