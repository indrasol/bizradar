import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  X,
  ChevronUp,
  ChevronDown,
  Maximize,
  Minimize,
  Info,
  TrendingUp,
  Calendar,
  Check,
  Lock,
  Loader,
  Play,
  Eye,
} from "lucide-react";
import tokenService from "../../utils/tokenService";
import { UpgradeModal } from "../subscription/UpgradeModal";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
// 🆕 add tracker + toasts
import { useTrack } from "@/logging";
import { toast } from "sonner";

interface RecommendationsPanelProps {
  opportunities: any[];
  userProfile: {
    companyUrl?: string;
    companyDescription?: string;
  };
  onExpand: () => void;
  onMinimize: () => void;
  isExpanded: boolean;
  hasExistingRecommendations?: boolean;
}

// Typewriter Animation Component
const TypewriterAnimation = ({ text, onComplete }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!text) return;

    // Reset when text changes
    setDisplayText("");
    setCurrentIndex(0);

    // Type the text character by character
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 30); // Speed of typing

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, onComplete]);

  return (
    <div className="bg-black/10 backdrop-blur-sm rounded-md p-3 font-mono text-sm text-green-500 overflow-x-auto max-w-full">
      <span className="whitespace-pre-wrap">{displayText}</span>
      <span className="animate-pulse">|</span>
    </div>
  );
};

const RecommendationsPanel = ({
  opportunities = [],
  userProfile = {},
  onExpand,
  onMinimize,
  isExpanded = false,
  hasExistingRecommendations = false,
}: RecommendationsPanelProps) => {
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);
  const [aiComponentCollapsed, setAiComponentCollapsed] = useState(true);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [showDetailedReason, setShowDetailedReason] = useState({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
  const API_BASE_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : (import.meta.env.VITE_API_BASE_URL as string);
  const abortCtrlRef = useRef<AbortController | null>(null);

  // 🆕 tracker + in-flight ids for disabling buttons
  const track = useTrack();
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const ADD_TO_TRACKER_URL =
    (API_ENDPOINTS as any).ADD_TO_TRACKER || `${API_BASE_URL}/tracker/add`;

  // Generate recommendations function
  const generateRecommendations = async () => {
    if (opportunities.length === 0) return;

    setIsLoadingRecommendations(true);
    setCancelRequested(false);

    // Abort any previous request, then create a fresh controller
    abortCtrlRef.current?.abort();
    abortCtrlRef.current = new AbortController();
    const { signal } = abortCtrlRef.current;

    try {
      // Get user profile and current search query
      const userProfileLocal = {
        companyUrl: "example.com", // Replace with actual user profile data
        companyDescription:
          "Technology consulting company specializing in AI solutions and government contracts.", // Placeholder
      };

      // Get the current search query from session storage
      const searchState = sessionStorage.getItem(
        "lastOpportunitiesSearchState"
      );
      const parsedState = searchState ? JSON.parse(searchState) : {};
      const searchQuery = parsedState.query || "";
      const userId = tokenService.getUserIdFromToken?.();

      const requestBody = {
        companyUrl: userProfileLocal.companyUrl,
        companyDescription: userProfileLocal.companyDescription || "",
        opportunities: opportunities.slice(0, 2),
        responseFormat: "json",
        includeMatchReason: true,
        searchQuery: searchQuery, // Include search query for caching
        userId: userId, // Include user ID for personalization
      };

      const response = await fetch(API_ENDPOINTS.AI_RECOMMENDATIONS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.recommendations && Array.isArray(data.recommendations)) {
        const enhancedRecommendations = data.recommendations.map((rec) => {
          const oppIndex =
            typeof rec.opportunityIndex === "number"
              ? Math.min(rec.opportunityIndex, opportunities.length - 1)
              : 0;
          const opportunity = opportunities[oppIndex];

          return {
            ...rec,
            opportunity,
          };
        });

        setAiRecommendations(enhancedRecommendations);

        // Also store compact version in session storage as backup
        const compactRecs = enhancedRecommendations.map((rec) => ({
          id: rec.id || `rec-${Math.random()}`,
          title: rec.title || "",
          description: rec.description || "",
          matchScore: rec.matchScore || 0,
          matchReason: rec.matchReason || "",
          opportunityIndex: rec.opportunityIndex || 0,
          keyInsights: rec.keyInsights || [],
          matchCriteria: rec.matchCriteria || [],
        }));

        sessionStorage.setItem(
          "aiRecommendations",
          JSON.stringify({
            recommendations: compactRecs,
            searchQuery: searchQuery,
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        setAiRecommendations([]);
      }
    } catch (error: any) {
      // If we aborted, skip updating state
      if (error.name === "AbortError") {
        // no-op
      } else {
        console.error("Error fetching AI recommendations:", error);
        setAiRecommendations([
          {
            id: "fallback-rec-1",
            title: "AI Recommendation Service Temporarily Unavailable",
            description:
              "We couldn't retrieve personalized recommendations at this time. Please try again later.",
            matchScore: 75,
            opportunityIndex: 0,
            matchReason:
              "This is a fallback recommendation while the service is temporarily unavailable.",
          },
        ]);
      }
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleCancelGeneration = () => {
    // Immediately abort the fetch
    abortCtrlRef.current?.abort();
    // Hide spinner and collapse
    setIsLoadingRecommendations(false);
    onMinimize();
  };

  const toggleDetailedReason = (id) => {
    setShowDetailedReason((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // 🆕 Real "Add to Tracker" handler with analytics + backend call
  const handleAddToTracker = async (opportunity: any) => {
    const id: string = opportunity?.id || "";
    if (!id) return;

    // prevent double-clicks
    setAddingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) return next;
      next.add(id);
      return next;
    });

    // 1) analytics — immediate fire-and-forget
    track({
      event_name: "add_to_tracker",
      event_type: "button_click",
      metadata: {
        search_query: null,
        stage: null,
        opportunity_id: id,
        title: opportunity?.title,
        platform: opportunity?.platform,
        naics_code: opportunity?.naicsCode,
      },
    });

    // 2) backend — perform the actual add
    try {
      const userId = tokenService.getUserIdFromToken?.();

      const res = await fetch(ADD_TO_TRACKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          opportunity_id: id,
          title: opportunity?.title,
          platform: opportunity?.platform,
          naics_code: opportunity?.naicsCode,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Add to tracker failed: ${res.status}`);
      }

      toast.success("Added to tracker");
      // TODO: update any local "added" state if you show badges, etc.
    } catch (err: any) {
      toast.error(err?.message || "Could not add to tracker");
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Watch for cached recommendations on mount/changes
  useEffect(() => {
    const loadCachedRecommendations = () => {
      if (opportunities.length === 0) return false;

      // Check session storage first (fastest)
      const sessionRecs = sessionStorage.getItem("aiRecommendations");
      if (sessionRecs) {
        try {
          const parsed = JSON.parse(sessionRecs);
          const recommendations = parsed.recommendations || [];
          const searchQuery = parsed.searchQuery || "";
          const timestamp = parsed.timestamp || "";

          // Check if cache is fresh (less than 1 hour old)
          const hoursOld = (Date.now() - new Date(timestamp).getTime()) / 36e5;

          // Get current search query from session
          const searchState = sessionStorage.getItem(
            "lastOpportunitiesSearchState"
          );
          const currentQuery = searchState
            ? JSON.parse(searchState).query
            : "";

          // Use if fresh and matching current query
          if (
            hoursOld < 1 &&
            searchQuery === currentQuery &&
            recommendations.length > 0
          ) {
            // Enhance with current opportunities
            const enhancedRecs = recommendations.map((rec) => {
              const oppIndex =
                typeof rec.opportunityIndex === "number"
                  ? Math.min(rec.opportunityIndex, opportunities.length - 1)
                  : 0;
              const opportunity = opportunities[oppIndex];

              return {
                ...rec,
                opportunity,
              };
            });

            setAiRecommendations(enhancedRecs);
            return true;
          }
        } catch (e) {
          console.error("Error parsing cached recommendations:", e);
        }
      }

      return false;
    };

    const hasSearched = opportunities.length > 0;
    if (hasSearched) {
      loadCachedRecommendations();
    }
  }, [opportunities]);

  return (
    <div
      className={`m-2 bg-gradient-to-r from-blue-50 to-white backdrop-blur-lg border border-blue-200 rounded-xl 
                  shadow-lg transition-all duration-300 overflow-hidden
                  ${isExpanded ? "fixed inset-8 z-50 overflow-auto" : ""}`}
    >
      <div className="flex items-center justify-between px-6 py-2 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-gray-800">
              BizradarAI Recommendations
            </h2>
            <p className="text-xs text-gray-500">
              Personalized recommendations based on your profile
            </p>
          </div>
          {aiRecommendations.length > 0 && (
            <span className="ml-2 text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
              {aiRecommendations.length} recommendations
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAiComponentCollapsed((prev) => !prev)}
            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
          >
            {aiComponentCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
          <button
            onClick={isExpanded ? onMinimize : onExpand}
            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
          >
            {isExpanded ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>

      {!aiComponentCollapsed && (
        <div className="transition-all duration-300">
          {isLoadingRecommendations ? (
            <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-r from-blue-50/30 to-white">
              <div className="animate-pulse flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-blue-700 font-medium mb-2">
                Analyzing opportunities...
              </p>
              <p className="text-sm text-gray-500 mb-3">
                Finding matches for your company profile
              </p>
              <button
                onClick={handleCancelGeneration}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <X size={16} />
                <span>Cancel Generation</span>
              </button>
            </div>
          ) : aiRecommendations.length > 0 ? (
            <div className={`${isExpanded ? "max-h-none" : "max-h-96"} overflow-y-auto`}>
              <div className="divide-y divide-gray-100">
                {aiRecommendations.slice(0, 3).map((rec, index) => {
                  const opportunity = rec.opportunity || opportunities[0];
                  const oppId = opportunity?.id || `rec-${index}`;

                  return (
                    <div key={rec.id || `rec-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 mb-1">
                            {opportunity ? opportunity.title : "Unknown Opportunity"}
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            {rec.title || "Match found based on your profile"}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                              {opportunity?.agency || "Unknown Agency"}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                              {opportunity?.platform || "sam.gov"}
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <Calendar className="h-3 w-3" />
                              Published: {opportunity?.posted || "TBD"}
                            </span>
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col items-end">
                          {rec.matchScore ? (
                            <div className="flex flex-col items-center">
                              <div className="relative w-16 h-12 flex items-center justify-center mb-2">
                                <svg className="w-full h-full" viewBox="0 0 36 36">
                                  <path
                                    d="M18 2.0845
                                      a 15.9155 15.9155 0 0 1 0 31.831
                                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#E5E7EB"
                                    strokeWidth="3"
                                  />
                                  <path
                                    d="M18 2.0845
                                      a 15.9155 15.9155 0 0 1 0 31.831
                                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke={rec.matchScore > 80 ? "#10B981" : rec.matchScore > 60 ? "#3B82F6" : "#9CA3AF"}
                                    strokeWidth="3"
                                    strokeDasharray={`${rec.matchScore}, 100`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                                  {rec.matchScore}%
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddToTracker(opportunity)}
                                disabled={addingIds.has(oppId)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
                                  ${
                                    addingIds.has(oppId)
                                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                      : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                                  }`}
                              >
                                {addingIds.has(oppId) ? (
                                  <>
                                    <Loader size={14} className="animate-spin" />
                                    <span>Adding...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check size={14} />
                                    <span>Add to Tracker</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <button className="text-blue-600 px-3 py-1.5 bg-blue-50 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                              View Details
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start">
                        {/* Match Analysis Box */}
                        <div className="mt-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <div className="flex items-start">
                            <div className="bg-white p-1.5 rounded-full mr-3 mt-0.5 border border-blue-200 shadow-sm">
                              <Info size={14} className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-blue-700 text-sm mb-1">
                                Match Analysis
                              </h4>
                              <p className="text-sm leading-relaxed text-gray-700 line-clamp-2">
                                {rec.description || "No detailed explanation available."}
                              </p>

                              <button
                                onClick={() => toggleDetailedReason(rec.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mt-2"
                              >
                                Check for detailed analysis
                                {showDetailedReason[rec.id] ? (
                                  <ChevronUp size={16} className="ml-1" />
                                ) : (
                                  <ChevronDown size={16} className="ml-1" />
                                )}
                              </button>
                            </div>
                          </div>

                          {showDetailedReason[rec.id] && (
                            <div className="mt-2">
                              <div className="bg-white rounded-md p-4 border border-gray-200 mb-2">
                                <h5 className="font-medium text-gray-800 mb-2">
                                  Key Insights
                                </h5>
                                <ul className="space-y-2">
                                  {rec.keyInsights?.map((insight, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5 mr-2"></div>
                                      <span className="text-sm text-gray-700">{insight}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="overflow-hidden rounded-md border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Match Criterion
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Relevance
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Notes
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {rec.matchCriteria?.map((crit, i) => (
                                      <tr key={i}>
                                        <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                          {crit.criterion}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                          <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                              crit.relevance.includes("Strong")
                                                ? "bg-green-100 text-green-800"
                                                : crit.relevance.includes("Partial")
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-gray-100 text-gray-600"
                                            }`}
                                          >
                                            {crit.relevance}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          {crit.notes}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <div className="mt-2 bg-white rounded-md p-3 border border-gray-200">
                                <h5 className="font-semibold text-gray-800 mb-1">✅ Verdict:</h5>
                                <p className="text-sm text-gray-700">{rec.matchReason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pro Upgrade Banner */}
                {/* <div className="p-2 relative">
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center p-4 max-w-md">
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Unlock More Recommendations
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Subscribe to Pro plan to access unlimited AI-powered opportunity
                        recommendations.
                      </p>
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
                      >
                        <Check className="h-4 w-4" />
                        <span>Upgrade to Pro</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 mb-1">
                        Federal Cybersecurity Operations Support
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Strong match for technical capabilities
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                          Department of Defense
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                          sam.gov
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          Published: April 2, 2025
                        </span>
                      </div>

                      <div className="mt-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-start">
                          <div className="bg-white p-1.5 rounded-full mr-3 mt-0.5 border border-blue-200 shadow-sm">
                            <Info size={14} className="text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-blue-700 text-sm mb-1">
                              Match Analysis
                            </h4>
                            <p className="text-sm leading-relaxed text-gray-700">
                              This opportunity aligns with your company's expertise in cybersecurity
                              and federal contracting experience.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col items-end">
                      <div className="flex flex-col items-center">
                        <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                          <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#E5E7EB"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#3B82F6"
                              strokeWidth="3"
                              strokeDasharray="85, 100"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                            85%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 bg-gradient-to-r from-blue-50/30 to-white">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Sparkles className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-gray-800 font-medium mb-2">
                {hasExistingRecommendations
                  ? "Recommendations Available"
                  : "Get Personalized Recommendations"}
              </p>
              <p className="text-sm text-gray-500 max-w-md mx-auto text-center mb-4">
                {hasExistingRecommendations
                  ? "We have recommendations based on your previous searches. Click below to view them."
                  : "Let our AI assistant analyze your search results and provide tailored recommendations based on your company profile."}
              </p>
              <button
                onClick={generateRecommendations}
                disabled={opportunities.length === 0 || isLoadingProfile}
                className={`px-6 py-2.5 rounded-lg shadow-md text-sm font-medium transition-all flex items-center gap-2
                          ${opportunities.length === 0 
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {isLoadingProfile ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    <span>Loading Profile...</span>
                  </>
                ) : hasExistingRecommendations ? (
                  <>
                    <Eye size={16} />
                    <span>View Recommendations</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Generate Recommendations</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
      {showUpgradeModal &&
        createPortal(
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            onSuccess={() => setShowUpgradeModal(false)}
          />,
          document.body
        )}
    </div>
  );
};

export default RecommendationsPanel;
