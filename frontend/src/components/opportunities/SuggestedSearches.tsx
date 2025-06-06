import React from "react";
import { HelpCircle } from "lucide-react";

import { SuggestedSearchesProps } from "../../models/opportunities"

const SuggestedSearches: React.FC<SuggestedSearchesProps> = ({ suggestedQueries, handleSuggestedQueryClick }) => {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-md mb-4 max-w-8xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Popular Searches</h2>
      <p className="text-gray-600 mb-3">Find contract opportunities that match your business capabilities:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {suggestedQueries.map((query) => (
          <div
            key={query.id}
            onClick={() => handleSuggestedQueryClick(query.id)}
            className="bg-white rounded-xl border border-gray-200 px-3 py-2 cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center my-1">
              <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors">{query.icon}</div>
              <h3 className="font-semibold text-gray-800 ml-3 group-hover:text-blue-600 transition-colors">{query.title}</h3>
            </div>
            <div className="flex items-center mb-1">
              <div className="p-2 flex rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors">
                <p className="text-gray-600 text-sm">
                  {query.description}
                  <span className="ml-3 text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Search now &gt;</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 pt-1 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-blue-500" />
          <span className="text-sm text-gray-600">
            Need help finding opportunities? Try our <a href="#" className="text-blue-600 font-medium">guided search wizard</a> or{" "}
            <a href="#" className="text-blue-600 font-medium">contact support</a>.
          </span>
        </div>
      </div>
    </div>
  );
};

export default SuggestedSearches;