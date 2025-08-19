import React, { useState } from "react";
import { BarChart2, Plus, FileText, ExternalLink, Share, Bot, Sparkles, ChevronUp, ChevronDown, Clock } from "lucide-react";
import { OpportunityCardProps } from "@/models/opportunities";

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  handleAddToPursuit,
  handleBeginResponse,
  handleViewDetails,
  toggleDescription,
  isExpanded,
  refinedQuery,
}) => {

  const [isExpandedAI, setIsExpandedAI] = useState(false)

  const highlightSearchTerms = (text: string): string => {
    const searchTerms = refinedQuery
      .replace("site:sam.gov", "")
      .replace("government contract", "")
      .split(" OR")
      .map((term) => term.replace(/AND|OR|"/g, "").trim())
      .filter((term) => term.length > 0);
    if (searchTerms.length) {
      const regex = new RegExp(`\\b(${searchTerms.join("|")})\\b`, "gi");
      text = text.replace(regex, (match) => `<span style="background-color: #B6D6FD; font-weight: bold;">${match}</span>`);
    }
    const dateRegex = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/gi;
    return text.replace(dateRegex, (match) => `<strong class="font-bold text-blue-700">${match}</strong>`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-blue-200">
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3">
          <BarChart2 size={22} className="text-blue-500" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
              <strong dangerouslySetInnerHTML={{ __html: highlightSearchTerms(opportunity.title || 'Untitled Opportunity') }} />
            </h2>
            <div className="flex items-center text-sm text-gray-500 mt-1">{opportunity.agency}</div>
          </div>
          {opportunity.response_date && (
            <div className="flex-shrink-0">
              <div
                className={`px-3 py-1.5 rounded-lg text-center ${
                  new Date(opportunity.response_date) < new Date()
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : "bg-blue-50 text-blue-600 border border-blue-100"
                }`}
              >
                <div className="text-xs font-medium">DUE</div>
                <div className="text-sm font-bold">{opportunity.response_date || "TBD"}</div>
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div>
            <div className="text-sm text-gray-500">Published</div>
            <div className="font-medium">{opportunity.published_date || "Recent"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Funding</div>
            <div className="font-medium">{opportunity.budget || "Not specified"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">NAICS Code</div>
            <div className="font-medium">{opportunity.naics_code || "000000"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Solicitation #</div>
            <div className="font-medium truncate">{opportunity.solicitation_number || "N/A"}</div>
          </div>
        </div>
        {/* <div className="mt-3 bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl rounded-xl border border-blue-100 transition-all duration-300 ease-in-out overflow-hidden">
          
          <div className="text-base p-4 bg-white/80 backdrop-blur-sm" style={{ fontFamily: "Geneva, sans-serif" }}>
            {opportunity.additional_description && (
              <div className="relative">
                <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-blue-600 to-blue-700 h-full rounded-full mr-3"></div>
                {(() => {
                  const paragraphs = opportunity.additional_description.split("\n\n");
                  const firstHalf = paragraphs.slice(0, Math.ceil(paragraphs.length / 2)).join("\n\n");
                  const secondHalf = paragraphs.slice(Math.ceil(paragraphs.length / 2)).join("\n\n");
                  return (
                    <div>
                      <p
                        className={`text-gray-700 pl-4 overflow-hidden transition-all duration-300 ${isExpanded ? "" : "line-clamp-4"}`}
                        dangerouslySetInnerHTML={{ __html: highlightSearchTerms(firstHalf) }}
                      />
                      {isExpanded && <p className="text-gray-700 pl-4 mt-2" dangerouslySetInnerHTML={{ __html: highlightSearchTerms(secondHalf) }} />}
                    </div>
                  );
                })()}
                <button
                  onClick={toggleDescription}
                  className="mt-2 ml-4 text-blue-600 hover:text-blue-800 inline-flex items-center text-sm font-medium transition-colors duration-200"
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={16} className="mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} className="mr-1" />
                      Read more
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div> */}
        <div className="mt-3 bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl rounded-xl border border-blue-100 transition-all duration-300 ease-in-out overflow-hidden">
          <div className="p-4 border-b border-blue-200 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300 flex items-center">
            <div className="p-2 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-md mr-3">
              <Bot size={20} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 text-base flex-grow">Bizradar AI Generated Summary</h3>
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className="text-blue-600" />
              <span className="text-xs text-gray-600 font-medium">AI Generated</span>
            </div>
          </div>
          <div className="text-base p-4 bg-white/80 backdrop-blur-sm" style={{ fontFamily: "Geneva, sans-serif" }}>
            {opportunity.summary_ai && (
              <div className="relative">
                <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-blue-600 to-blue-700 h-full rounded-full mr-3"></div>
                {(() => {
                  const lines = (opportunity.summary_ai || "")
                    .split("\n")
                    .map(l => l.trim())
                    .filter(l => l.length > 0);
                  const bulletLines = lines.every(l => l.startsWith("- ")) ? lines : null;
                  if (bulletLines) {
                    const half = Math.ceil(bulletLines.length / 2);
                    const firstHalf = bulletLines.slice(0, half);
                    const secondHalf = bulletLines.slice(half);
                    return (
                      <div>
                        <ul className={`list-disc pl-8 text-gray-700 overflow-hidden transition-all duration-300 ${isExpandedAI ? "" : "line-clamp-4"}`}>
                          {firstHalf.map((l, idx) => (
                            <li key={`ai-b1-${idx}`} dangerouslySetInnerHTML={{ __html: highlightSearchTerms(l.replace(/^\-\s*/, "")) }} />
                          ))}
                        </ul>
                        {isExpandedAI && (
                          <ul className="list-disc pl-8 text-gray-700 mt-2">
                            {secondHalf.map((l, idx) => (
                              <li key={`ai-b2-${idx}`} dangerouslySetInnerHTML={{ __html: highlightSearchTerms(l.replace(/^\-\s*/, "")) }} />
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  }
                  // Fallback to paragraph split if not bullets
                  const paragraphs = opportunity.summary_ai.split("\n\n");
                  const firstHalf = paragraphs.slice(0, Math.ceil(paragraphs.length / 2)).join("\n\n");
                  const secondHalf = paragraphs.slice(Math.ceil(paragraphs.length / 2)).join("\n\n");
                  return (
                    <div>
                      <p
                        className={`text-gray-700 pl-4 overflow-hidden transition-all duration-300 ${isExpandedAI ? "" : "line-clamp-4"}`}
                        dangerouslySetInnerHTML={{ __html: highlightSearchTerms(firstHalf) }}
                      />
                      {isExpandedAI && <p className="text-gray-700 pl-4 mt-2" dangerouslySetInnerHTML={{ __html: highlightSearchTerms(secondHalf) }} />}
                    </div>
                  );
                })()}
                <button
                  onClick={() => {setIsExpandedAI(!isExpandedAI)}}
                  className="mt-2 ml-4 text-blue-600 hover:text-blue-800 inline-flex items-center text-sm font-medium transition-colors duration-200"
                  aria-expanded={isExpandedAI}
                >
                  {isExpandedAI ? (
                    <>
                      <ChevronUp size={16} className="mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} className="mr-1" />
                      Read more
                    </>
                  )}
                </button>
              </div>
            )}

            {!(opportunity.summary_ai) && (
              <span>
                Generating ...
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 py-1.5 flex flex-wrap items-center gap-2">
        <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
          {opportunity.platform === "sam_gov" ? "sam.gov" : opportunity.platform}
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${opportunity.active === false ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-600"}`}>
          {opportunity.active === false ? "Inactive" : "Active"}
        </div>
        <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">{opportunity.type || "RFP"}</div>
        <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-sm">Federal</div>
        {opportunity.response_date && new Date(opportunity.response_date) > new Date() && (new Date(opportunity.response_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) < 7 && (
          <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-sm flex items-center">
            <Clock size={12} className="mr-1" />
            Ending Soon
          </div>
        )}
      </div>
      <div className="p-3 flex items-center gap-2">
        <button
          onClick={() => handleAddToPursuit(opportunity)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Add to Pursuits</span>
        </button>
        <button
          onClick={() => handleBeginResponse(opportunity.id, opportunity)}
          className="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-green-200"
        >
          <FileText size={16} />
          <span>Generate Response</span>
        </button>
        <button
          onClick={() => handleViewDetails(opportunity)}
          className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-gray-200"
        >
          <ExternalLink size={16} className="text-gray-500" />
          <span>View on SAM.gov</span>
        </button>
        <button className="ml-auto p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
          <Share size={18} />
        </button>
      </div>
    </div>
  );
};

export default OpportunityCard;