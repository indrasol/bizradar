import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
          ["goal", "Goal"],
          ["eligibility", "Eligibility"],
          ["key_facts", "Key Facts"],
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
    <div className="border-b border-gray-100 pb-3">
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="rounded-md bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300 px-3 py-2 flex items-center gap-2">
              <BarChart2 size={18} className="text-blue-700" />
              <h2 className="text-lg font-semibold text-gray-800">
                <strong dangerouslySetInnerHTML={{ __html: highlightSearchTerms(opportunity.title || 'Untitled Opportunity') }} />
              </h2>
            </div>
            {/* <div className="flex items-center text-sm text-gray-500 mt-1">{opportunity.agency}</div> */}
          </div>
          {/*
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
          */}
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
        <div className="mt-3">
          <div className="text-base" style={{ fontFamily: "Arial, Arial" }}>
            {(opportunity.summary || opportunity.summary_ai) ? (
              <div className="relative">
                <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-blue-600 to-blue-700 h-full rounded-full"></div>
                <div className={`prose prose-sm text-gray-700 pl-4`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
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
                        if (seq.length > 0 && React.isValidElement(seq[0]) && (seq[0] as any).type === 'strong') {
                          const strongEl = seq[0] as React.ReactElement<any>;
                          const label = React.Children.toArray(strongEl.props.children)
                            .map((c) => (typeof c === 'string' ? c : ''))
                            .join('')
                            .trim()
                            .toLowerCase();
                          if (label === 'due date') {
                            let idx = 1;
                            let colonPrefix: string | null = null;
                            const restNodes: any[] = [];
                            if (idx < seq.length && typeof seq[idx] === 'string') {
                              const s = seq[idx] as string;
                              const m = s.match(/^:\s*/);
                              if (m) {
                                colonPrefix = m[0];
                                const tail = s.slice(m[0].length);
                                if (tail.length > 0) restNodes.push(tail);
                                idx += 1;
                              }
                            }
                            for (; idx < seq.length; idx++) restNodes.push(seq[idx]);
                            return (
                              <li>
                                <p>
                                  {strongEl}
                                  {colonPrefix ?? ': '}
                                  <span className="bg-red-50 text-red-700 border border-red-200 rounded px-2 py-0.5">
                                    {restNodes}
                                  </span>
                                </p>
                              </li>
                            );
                          }
                        }
                        return <li>{children}</li>;
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
        {/* <button
          onClick={() => handleViewDetails(opportunity)}
          className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-gray-200"
        >
          <ExternalLink size={16} className="text-gray-500" />
          <span>View on SAM.gov</span>
        </button> */}
        <button className="ml-auto p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
          <Share size={18} />
        </button>
      </div>
    </div>
  );
};

export default OpportunityCard;