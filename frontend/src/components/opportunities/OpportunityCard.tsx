import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BarChart2, Plus, FileText, ExternalLink, Bot, Sparkles, ChevronUp, ChevronDown, Clock, AlertTriangle } from "lucide-react";
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
  const [isExpandedAI, setIsExpandedAI] = useState(false);

  // Calculate days remaining until due date
  const calculateDaysRemaining = (dueDate: string | null): { days: number; isPastDue: boolean } => {
    if (!dueDate) return { days: 0, isPastDue: false };
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      days: Math.abs(diffDays),
      isPastDue: diffDays < 0
    };
  };



  const normalizeSummaryToMarkdown = (summary: unknown, agency?: string, responseDate?: string | null): string => {
    if (!summary) return "";
    const fallbackSponsor = (agency || "").split(".")[0].trim();
    if (typeof summary === "string") {
      let text = summary;
      const lines = text.split(/\r?\n/);
      const sponsorPatterns = [
        /^\s*(?:[-*+]\s*)?\*\*?\s*Sponsor\s*\*\*?\s*:\s*(.*)$/i,
        /^\s*Sponsor\s*:\s*(.*)$/i,
      ];
      const dueDatePatterns = [
        /^\s*(?:[-*+]\s*)?\*\*?\s*Due\s*Date\s*\*\*?\s*:\s*(.*)$/i,
        /^\s*Due\s*Date\s*:\s*(.*)$/i,
      ];
      const sponsorValues: string[] = [];
      const dueDateValues: string[] = [];
      const remainingLines: string[] = [];
      for (const line of lines) {
        let matched = false;
        for (const rx of sponsorPatterns) {
          const m = line.match(rx);
          if (m) {
            sponsorValues.push((m[1] || "").trim());
            matched = true;
            break;
          }
        }
        if (!matched) {
          for (const rx of dueDatePatterns) {
            const m = line.match(rx);
            if (m) {
              dueDateValues.push((m[1] || "").trim());
              matched = true;
              break;
            }
          }
        }
        if (!matched) remainingLines.push(line);
      }

      let chosenSponsor = sponsorValues.find(v => v.length > 0 && !/^not\s+specified/i.test(v)) || "";
      if (!chosenSponsor && fallbackSponsor) chosenSponsor = fallbackSponsor;

      let chosenDueDate = dueDateValues.find(v => v.length > 0 && !/^not\s+specified/i.test(v)) || "";
      if (!chosenDueDate && responseDate) chosenDueDate = responseDate;

      const rebuiltLines = [...remainingLines];
      if (chosenSponsor) rebuiltLines.unshift(`- **Sponsor**: ${chosenSponsor}`);
      if (chosenDueDate) rebuiltLines.push(`- **Due Date**: ${chosenDueDate}`);
      return rebuiltLines.join("\n");
    }
    if (typeof summary === "object") {
      try {
        const s = summary as Record<string, unknown>;
        const order = [
          ["sponsor", "Sponsor"],
          ["objective", "Objective"],
          ["goal", "Expected Outcome"],
          ["contact_info", "Contact information"],
          ["due_date", "Due Date"],
        ] as const;
        const lines: string[] = [];
        for (const [key, label] of order) {
          if (key in s && s[key] !== undefined && s[key] !== null) {
            let value = String(s[key]).trim();
            if (key === "sponsor") {
              const isNotSpecified = value.length === 0 || value.toLowerCase().startsWith("not specified");
              if (isNotSpecified && fallbackSponsor) value = fallbackSponsor;
            }
            if (key === "due_date") {
              const isNotSpecified = value.length === 0 || value.toLowerCase().startsWith("not specified");
              if (isNotSpecified && responseDate) value = responseDate;
            }
            if (value.length > 0) lines.push(`- **${label}**: ${value}`);
          } else if (key === "sponsor" && fallbackSponsor) {
            lines.push(`- **${label}**: ${fallbackSponsor}`);
          } else if (key === "due_date" && responseDate) {
            lines.push(`- **${label}**: ${responseDate}`);
          }
        }
        if (lines.length) return lines.join("\n");
        return Object.entries(s)
          .map(([k, v]) => `- **${k}**: ${String(v ?? "").trim()}`)
          .join("\n");
      } catch {
        return "";
      }
    }
    return "";
  };

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
    <div className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-300 overflow-hidden">
      {/* Title Section - Full Width */}
      <div className="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-200 px-6 py-4 flex items-center gap-2">
        <BarChart2 size={18} className="text-blue-700" />
        <h2 className="text-lg font-semibold text-gray-800 flex-1">
          <strong>
            {opportunity.title || 'Untitled Opportunity'}
            <button
              onClick={() => {
                // Store opportunity data in sessionStorage for the details page
                sessionStorage.setItem("selectedOpportunity", JSON.stringify(opportunity));
                window.open(`/opportunities/${opportunity.id}/details`, '_blank');
              }}
              className="ml-2 px-2 py-1 text-blue-700 hover:text-blue-900 hover:bg-blue-200 rounded-md transition-colors inline-flex items-center gap-1 text-sm font-medium"
              title="View Details"
            >
              <ExternalLink size={14} />
              <span>Detail</span>
            </button>
          </strong>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddToPursuit(opportunity)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center gap-1"
          >
            <Plus size={14} />
            <span>Add to Pursuits</span>
          </button>
          <button
            onClick={() => handleBeginResponse(opportunity.id, opportunity)}
            className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border border-green-200"
          >
            <FileText size={14} />
            <span>Generate Response</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Split View Layout */}
        <div className="flex gap-6">
          {/* Left Side - Main Content */}
          <div className="flex-1">
            {/* Summary Section */}
            <div className="mb-4">
              <div className="text-base" style={{ fontFamily: "Arial, Arial" }}>
                {(opportunity.summary || opportunity.summary_ai) ? (
                  <div className="relative">
                    <div className={`prose prose-sm text-gray-700`}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          ul: ({ children }) => <div className="space-y-0.5">{children}</div>,
                          ol: ({ children }) => <div className="space-y-0.5">{children}</div>,
                          li: ({ children }) => {
                            const flatten = (nodes: any[]): any[] => nodes.flatMap((n) => {
                              if (Array.isArray(n)) return flatten(n);
                              return [n];
                            });
                            const childArray = flatten(React.Children.toArray(children));
                            let seq = childArray;
                            if (seq.length === 1 && React.isValidElement(seq[0]) && (seq[0] as any).type === 'p') {
                              seq = flatten(React.Children.toArray((seq[0] as any).props.children));
                            }

                            // Helper to safely extract text from any React element or string
                            const getTextContent = (element: any): string => {
                              if (typeof element === 'string') return element;
                              if (React.isValidElement(element)) {
                                const children = React.Children.toArray((element as any).props?.children || []);
                                return children.map(child => getTextContent(child)).join('');
                              }
                              return '';
                            };

                            // Get full text content of this list item
                            const fullText = seq.map(getTextContent).join('').trim();
                            
                            // Skip empty items
                            if (!fullText) return null;

                            // Parse key-value pairs
                            let key = '';
                            let value = '';

                            // Method 1: Check if first element is strong (bold)
                            if (seq.length > 0 && React.isValidElement(seq[0]) && (seq[0] as any).type === 'strong') {
                              const strongEl = seq[0] as React.ReactElement<any>;
                              key = getTextContent(strongEl).trim();
                              
                              // Get the rest as value
                              const restText = seq.slice(1).map(getTextContent).join('').trim();
                              value = restText.startsWith(':') ? restText.slice(1).trim() : restText;
                            }
                            // Method 2: Look for colon in the text
                            else {
                              const colonIndex = fullText.indexOf(':');
                              if (colonIndex > 0) {
                                key = fullText.substring(0, colonIndex).trim();
                                value = fullText.substring(colonIndex + 1).trim();
                              } else {
                                // Treat the whole thing as a key with empty value
                                key = fullText;
                                value = '';
                              }
                            }

                            // Skip unwanted fields
                            const keyLower = key.toLowerCase();
                            if (keyLower === 'due date' || keyLower === 'eligibility' || keyLower === 'key facts') {
                              return null;
                            }

                            // Transform Goal to Expected Outcome
                            let displayKey = key;
                            if (keyLower === 'goal') {
                              displayKey = 'Expected Outcome';
                            }

                            // Determine if background should be removed for certain keys
                            const plainKeys = ['sponsor', 'expected outcome', 'objective', 'contact information', 'contact info'];
                            const isPlain = plainKeys.includes(displayKey.toLowerCase());

                            // Show as key-value card with conditional background
                            return (
                              <div
                                className={`mb-1 p-1.5 rounded-lg border border-gray-100 ${
                                  isPlain ? '' : 'bg-gray-50'
                                }`}
                              >
                                <div className="font-semibold text-gray-900 mb-0">
                                  <strong>{displayKey}</strong>
                                </div>
                                <div className="text-gray-700 leading-snug">
                                  {value || 'Not specified'}
                                </div>
                              </div>
                            );
                          }
                        }}
                      >
                        {normalizeSummaryToMarkdown(opportunity.summary ?? opportunity.summary_ai ?? "", opportunity.agency, opportunity.response_date)}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <span>Generating ...</span>
                )}
              </div>
            </div>

            {/* Metadata Grid - All Fields */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Funding</div>
                <div className="font-medium text-gray-900">{opportunity.budget || "Not specified"}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">NAICS Code</div>
                <div className="font-medium text-gray-900">{opportunity.naics_code || "000000"}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Solicitation #</div>
                <div className="font-medium text-gray-900 truncate">{opportunity.solicitation_number || "N/A"}</div>
              </div>
            </div>
          </div>

          {/* Right Side - Timeline Information */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 h-fit">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Clock size={14} />
                Timeline
              </h3>
              
              {/* Published Date */}
              <div className="mb-4">
                <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">Published</div>
                <div className="font-medium text-blue-900 text-sm">
                  {opportunity.published_date || "Recent"}
                </div>
              </div>

              {/* Due Date */}
              {opportunity.response_date && (
                <div className="mb-4">
                  <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">Due Date</div>
                  <div className="font-medium text-blue-900 text-sm mb-2">
                    {opportunity.response_date}
                  </div>
                  
                  {/* Response Needed Badge */}
                  {(() => {
                    const { days, isPastDue } = calculateDaysRemaining(opportunity.response_date);
                    return isPastDue ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium border border-red-200 w-full">
                        <AlertTriangle size={12} />
                        <span>Past Due Date</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200 w-full">
                        <Clock size={12} />
                        <span>{days} day{days !== 1 ? 's' : ''} left</span>
                      </div>
                    );
                  })()}
                </div>
              )}


            </div>
          </div>
        </div>
      </div>
      {/* <div className="px-5 py-1.5 flex flex-wrap items-center gap-2">
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
      </div> */}

    </div>
  );
};

export default OpportunityCard;