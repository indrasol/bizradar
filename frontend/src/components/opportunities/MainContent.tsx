import React from "react";
import FiltersSidebar from "./FiltersSidebar";
import SearchBar from "./SearchBar";
import ResultsList from "./ResultsList";
import { MainContentProps } from "@/models/opportunities";
import RefinedQueryDisplay from "../admin/RefinedQueryDisplay";

const MainContent: React.FC<MainContentProps> = ({
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
  applyFilters
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
        {showRefinedQuery && refinedQuery && (
          <RefinedQueryDisplay
            originalQuery={searchQuery}
            refinedQuery={refinedQuery}
            isVisible={showRefinedQuery}
            onClose={() => setShowRefinedQuery(false)}
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
        />
      </div>
    </div>
  );
};

export default MainContent;