import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BarChart2,
  Plus,
  FileText,
  ExternalLink,
  Bot,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Clock,
  AlertTriangle,
  Check,
  Lock,
} from "lucide-react";
import { OpportunityCardProps } from "@/models/opportunities";
// 🆕 add tracker
import { useTrack } from "@/logging";
import { supabase } from "@/utils/supabase";
import { useRfpUsage } from "@/hooks/useRfpUsage";
import { toast } from "sonner";

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
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isTracked, setIsTracked] = useState<boolean>(false);
  const { isLimitReached, usageStatus } = useRfpUsage();

  // Determine if this opportunity is already tracked for current user
  useEffect(() => {
    const checkTracked = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("trackers")
          .select("id")
          .eq("user_id", user.id)
          .eq("title", opportunity.title)
          .limit(1);
        setIsTracked(Boolean(data && data.length > 0));
      } catch {
        // ignore
      }
    };
    checkTracked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity?.id, opportunity?.title]);

  // 🆕 one reusable tracker function for this component
  const track = useTrack();

  // Calculate days remaining until due date
  const calculateDaysRemaining = (
    dueDate: string | null
  ): { days: number; isPastDue: boolean } => {
    if (!dueDate) return { days: 0, isPastDue: false };

    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      days: Math.abs(diffDays),
      isPastDue: diffDays < 0,
    };
  };

  const normalizeSummaryToMarkdown = (
    summary: unknown,
    agency?: string,
    responseDate?: string | null
  ): string => {
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

      let chosenSponsor =
        sponsorValues.find(
          (v) => v.length > 0 && !/^not\s+specified/i.test(v)
        ) || "";
      if (!chosenSponsor && fallbackSponsor) chosenSponsor = fallbackSponsor;

      let chosenDueDate =
        dueDateValues.find(
          (v) => v.length > 0 && !/^not\s+specified/i.test(v)
        ) || "";
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
              const isNotSpecified =
                value.length === 0 ||
                value.toLowerCase().startsWith("not specified");
              if (isNotSpecified && fallbackSponsor) value = fallbackSponsor;
            }
            if (key === "due_date") {
              const isNotSpecified =
                value.length === 0 ||
                value.toLowerCase().startsWith("not specified");
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
      text = text.replace(
        regex,
        (match) =>
          `<span style="background-color: #B6D6FD; font-weight: bold;">${match}</span>`
      );
    }
    const dateRegex =
      /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/gi;
    return text.replace(
      dateRegex,
      (match) => `<strong class="font-bold text-blue-700">${match}</strong>`
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
      {/* Title Section - Full Width */}
      <div className="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-200 px-6 py-4 flex items-center gap-2">
        <BarChart2 size={18} className="text-blue-700" />
        <h2 className="text-lg font-semibold text-gray-800 flex-1">
          <strong>
            {opportunity.title || "Untitled Opportunity"}
            <button
              onClick={() => {
                // (Optional) If you later want to track details open, add a track() here.
                sessionStorage.setItem(
                  "selectedOpportunity",
                  JSON.stringify(opportunity)
                );
                window.open(
                  `/opportunities/${opportunity.id}/details`,
                  "_blank"
                );
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
            onClick={async () => {
              // 🆕 log first, then run your app logic
              track({
                event_name: "add_to_tracker",
                event_type: "button_click",
                metadata: {
                  search_query: null,
                  stage: "review",
                  section: null,
                  opportunity_id: opportunity?.id,
                  title: opportunity?.title,
                  naics_code: opportunity?.naics_code ?? opportunity?.naics_code,
                },
              });
              await handleAddToPursuit(opportunity);
              // Re-check state after action
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const { data } = await supabase
                    .from("trackers")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("title", opportunity.title)
                    .limit(1);
                  setIsTracked(Boolean(data && data.length > 0));
                }
              } catch {}
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center gap-1 ${
              isTracked ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isTracked ? <Check size={14} /> : <Plus size={14} />}
            <span>{isTracked ? "Added to Tracker" : "Add to Tracker"}</span>
          </button>
          {isLimitReached ? (
            <div
              className="relative inline-block"
              onMouseEnter={() => setShowUpgrade(true)}
              onMouseLeave={() => setShowUpgrade(false)}
            >
              <button
                disabled={true}
                onClick={() => {}}
                className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border border-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Lock size={14} />
                <span>Generate Response</span>
              </button>
              {showUpgrade && (
                <div
                  className="z-50 absolute right-0 mt-2 w-[360px] max-w-[90vw] rounded-xl border bg-white text-slate-800 shadow-2xl border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                  onMouseEnter={() => setShowUpgrade(true)}
                  onMouseLeave={() => setShowUpgrade(false)}
                >
                  <div className="px-4 py-2.5 border-b text-sm font-semibold border-slate-200 dark:border-slate-700">Upgrade Your Plan</div>
                  <div className="p-4 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <div className="font-medium text-slate-800 dark:text-white">Current Plan: Free</div>
                    <div>Unlock more AI-assisted RFP drafts per month and advanced features.</div>
                    <div className="flex items-center gap-2">
                      <a
                        href="https://checkout.stripe.com/c/pay/cs_test_b1FxfURfXbt6I7wmkXTfPgFkMVhIrcwXvPYvzlWMi4JbfAVT7lWKZfcyon#fidkdWxOYHwnPyd1blpxYHZxWjA0V2JvdjVDTlFOPUxGUHV3SUBcS0s3R1dDck92cWc9fDRiVDVpcEpqNVQwM3VxfHFrUEB8NXB0N2JfVnBpRlxyNm81VGtpMm1NfEs0RFV9X3wwdl9BVWF8NTVPNnMyUlxqSScpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc/JyZjY2NjY2MnKSdpZHxqcHFRfHVgJz8naHBpcWxabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic/cXdwYHgl"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block px-2 py-1 rounded bg-blue-600 text-white text-[10px] hover:bg-blue-700"
                      >
                        Pro: 5 drafts
                      </a>
                      <a
                        href="https://checkout.stripe.com/c/pay/cs_test_b1FxfURfXbt6I7wmkXTfPgFkMVhIrcwXvPYvzlWMi4JbfAVT7lWKZfcyon#fidkdWxOYHwnPyd1blpxYHZxWjA0V2JvdjVDTlFOPUxGUHV3SUBcS0s3R1dDck92cWc9fDRiVDVpcEpqNVQwM3VxfHFrUEB8NXB0N2JfVnBpRlxyNm81VGtpMm1NfEs0RFV9X3wwdl9BVWF8NTVPNnMyUlxqSScpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc/JyZjY2NjY2MnKSdpZHxqcHFRfHVgJz8naHBpcWxabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic/cXdwYHgl"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block px-2 py-1 rounded bg-amber-600 text-white text-[10px] hover:bg-amber-700"
                      >
                        Premium: 10 drafts
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                track({
                  event_name: "generate_rfp",
                  event_type: "button_click",
                  metadata: {
                    search_query: "null",
                    stage: "review",
                    section: null,
                    opportunity_id: opportunity?.id,
                    title: opportunity?.title,
                    naics_code: opportunity?.naics_code ?? opportunity?.naics_code,
                  },
                });
                handleBeginResponse(opportunity.id, opportunity);
              }}
              className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border border-green-200"
            >
              <FileText size={14} />
              <span>Generate Response</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Split View Layout */}
        <div className="flex gap-6">
          {/* Left Side - Main Content */}
          <div className="flex-1">
            {/* Professional Overview Section */}
            <div className="mb-4">
              <div className="space-y-2">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Objective
                  </div>
                  <div className="text-gray-800 text-sm leading-relaxed">
                    {opportunity.objective || "Not specified"}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Expected Outcome
                  </div>
                  <div className="text-gray-800 text-sm leading-relaxed">
                    {opportunity.expected_outcome || "Not specified"}
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Grid - All Fields */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Funding
                </div>
                <div className="font-medium text-gray-900">
                  {opportunity.budget || "Not specified"}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  NAICS Code
                </div>
                <div className="font-medium text-gray-900">
                  {opportunity.naics_code || "000000"}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Solicitation #
                </div>
                <div className="font-medium text-gray-900 truncate">
                  {opportunity.solicitation_number || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Timeline Information */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 h-fit">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                <Clock size={14} />
                Timeline
              </h3>

              {/* Published Date */}
              <div className="mb-4">
                <div className="text-xs text-blue-600 dark:text-blue-300 uppercase tracking-wide mb-1 dark:font-bold">Published</div>
                <div className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                  {opportunity.published_date || "Recent"}
                </div>
              </div>

              {/* Due Date */}
              {opportunity.response_date && (
                <div className="mb-4">
                  <div className="text-xs text-blue-600 dark:text-blue-300 uppercase tracking-wide mb-1 dark:font-bold">Due Date</div>
                  <div className="font-medium text-blue-900 dark:text-blue-100 text-sm mb-2">
                    {opportunity.response_date}
                  </div>

                  {/* Response Needed Badge */}
                  {(() => {
                    const { days, isPastDue } = calculateDaysRemaining(
                      opportunity.response_date
                    );
                    return isPastDue ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium border border-red-200 w-full">
                        <AlertTriangle size={12} />
                        <span>Past Due Date</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200 w-full">
                        <Clock size={12} />
                        <span>
                          {days} day{days !== 1 ? "s" : ""} to respond
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* (rest of card omitted sections left as-is) */}
    </div>
  );
};

export default OpportunityCard;
