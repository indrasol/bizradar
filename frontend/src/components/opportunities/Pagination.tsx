import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PaginationProps } from "../../models/opportunities"

const Pagination: React.FC<PaginationProps> = ({ hasSearched, isSearching, totalResults, currentPage, totalPages, paginate }) => {
  return (
    hasSearched &&
    !isSearching &&
    totalResults > 5 && (
      <div className="flex justify-center items-center my-6">
        <div className="bg-white rounded-full shadow-sm border border-gray-200 flex items-center gap-1 p-1">
          <button
            onClick={() => paginate(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded-full ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"}`}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-sm font-medium text-gray-700 px-3">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={() => paginate(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-full ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"}`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    )
  );
};

export default Pagination;