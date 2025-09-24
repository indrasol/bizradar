import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import { Calendar, Trash2, PencilLine, AlertCircle, Check, Square } from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { reportsApi } from "@/api/reports";

type ReportRow = {
  response_id: string;
  user_id: string;
  content: any | null;
  completion_percentage: number | null;
  is_submitted: boolean;
  updated_at: string | null;
};

type ReportItem = {
  pursuit_id: string;
  title: string;
  due_date: string | null;
  created_at: string | null;
  completion: number;
  is_submitted: boolean;
  content: any | null;
  opportunity_id?: number;
};

const stageFromCompletion = (
  pct: number
): "Review" | "In Progress" | "Completed" => {
  if (pct >= 100) return "Completed";
  if (pct > 0) return "In Progress";
  return "Review";
};

const stageBadgeClasses = (stage: string) => {
  const s = stage.toLowerCase();
  if (s.includes("review"))
    return "bg-amber-100 text-amber-800 border-amber-200";
  if (s.includes("in progress"))
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (s.includes("completed"))
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

const niceDate = (d?: string | null) => {
  if (!d) return "TBD";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "TBD";
  }
};

export default function ReportsList(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  // Route mode: /reports/ongoing -> false, /reports/submitted -> true
  const modeSubmitted = location.pathname.includes("/reports/submitted");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ReportItem[]>([]);
  const [filterStage, setFilterStage] = useState<
    "all" | "review" | "in progress" | "completed"
  >("all");

  // State for which (if any) report is being deleted
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // State for confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ReportItem | null>(null);

  // Fetch: reports for this user (NOT merged with trackers anymore)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        if (!userId) {
          setItems([]);
          setLoading(false);
          return;
        }

        try {
          console.log('Calling reportsApi.getReports with:', { userId, modeSubmitted });
          const reportsResponse = await reportsApi.getReports(userId, modeSubmitted);
          console.log('Reports API response:', reportsResponse);
          console.log('Reports API response type:', typeof reportsResponse);
          console.log('Reports API response keys:', reportsResponse ? Object.keys(reportsResponse) : 'undefined');
          const reports = reportsResponse?.reports || [];
          
          const merged: ReportItem[] = (reports || []).map((r: any) => {
            const completion = Math.max(
              0,
              Math.min(100, r.completion_percentage ?? 0)
            );
            // Use the new schema fields: r.title and r.due_date (extracted from content)
            const fallbackTitle = r.title || r?.content?.rfpTitle || "Untitled Opportunity";
            const dueDate = r.due_date || r?.content?.dueDate || null;
            return {
              pursuit_id: r.response_id,
              title: fallbackTitle,
              due_date: dueDate,
              created_at: r.updated_at,
              completion,
              is_submitted: !!r.is_submitted,
              content: r.content || null,
              opportunity_id: r.opportunity_id,
            };
          });

          if (!cancelled) {
            setItems(merged);
          }
        } catch (apiError) {
          console.error('Reports API error:', apiError);
          throw apiError;
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error("Failed to load reports:", e);
          toast.error("Failed to load reports.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [modeSubmitted, location.pathname]);

  const filtered = useMemo(() => {
    if (filterStage === "all") return items;
    return items.filter(
      (it) => stageFromCompletion(it.completion).toLowerCase() === filterStage
    );
  }, [items, filterStage]);

  const handleToggleSubmitted = async (
    pursuitId: string,
    checked: boolean,
    stage: string
  ) => {
    if (stage !== "Completed" && checked) {
      toast.info("You can only submit when the report is Completed.");
      return;
    }
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      if (!userId) return;

      // Optimistic UI
      setItems((prev) =>
        prev.map((it) =>
          it.pursuit_id === pursuitId ? { ...it, is_submitted: checked } : it
        )
      );

      await reportsApi.toggleSubmittedStatus(pursuitId, userId);

      // If the item no longer belongs in this list, remove it (moves between Ongoing/Submitted)
      setItems((prev) => prev.filter((it) => it.is_submitted === modeSubmitted));

      toast.success(checked ? "Marked as submitted" : "Marked as ongoing");
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to update submission state.");
      // Revert
      setItems((prev) =>
        prev.map((it) =>
          it.pursuit_id === pursuitId ? { ...it, is_submitted: !checked } : it
        )
      );
    }
  };

  const handleDeleteClick = (item: ReportItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setIsDeleting(itemToDelete.pursuit_id);

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      if (!userId) {
        setIsDeleting(null);
        return;
      }

      // Use the API client instead of direct Supabase call
      await reportsApi.deleteReport(itemToDelete.pursuit_id, userId);

      // Remove from UI ONLY after API confirms deletion
      setItems((p) => p.filter((it) => it.pursuit_id !== itemToDelete.pursuit_id));
      toast.success("Report removed successfully.");
      
      // Close modal and reset state
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (e: any) {
      console.error("Failed to delete report:", e);
      toast.error("Failed to remove report.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleEditResponse = (item: ReportItem) => {
    console.log('🔍 Reports Edit Debug:', {
      item: item,
      opportunity_id: item.opportunity_id,
      pursuit_id: item.pursuit_id,
      contractId: item.opportunity_id || item.pursuit_id
    });
    
    console.log('🔍 About to resolve opportunity_id...');
    
    // Try to get opportunity_id from the content if it's not directly available
    const opportunityId = item.opportunity_id || item.content?.opportunity_id || null;
    console.log('🔍 Opportunity ID resolution:', {
      direct: item.opportunity_id,
      fromContent: item.content?.opportunity_id,
      resolved: opportunityId
    });
    
    const contract = {
      id: item.opportunity_id || item.pursuit_id, // Use opportunity_id if available, fallback to pursuit_id
      title: item.title,
      department: "",
      noticeId: null,
      dueDate: item.due_date || "TBD",
      response_date: item.due_date || "TBD",
      published_date: "",
      value: "0",
      status: "Active",
      naicsCode: "",
      solicitation_number: "",
      description: "",
      external_url: "",
      budget: "",
      pursuit_id: item.pursuit_id,
      opportunity_id: opportunityId, // Include opportunity_id in the contract object
    };
    try {
      sessionStorage.setItem("currentContract", JSON.stringify(contract));
    } catch {}

    navigate(`/contracts/rfp/${item.pursuit_id}`);
  };

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-blue-600 text-white shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {modeSubmitted ? "Submitted Responses" : "Active Responses"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {modeSubmitted
                  ? "All proposals you've marked as submitted."
                  : "Work-in-progress proposals not yet submitted."}
              </p>
            </div>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filter:</label>
            <select
              value={filterStage}
              onChange={(e) =>
                setFilterStage(e.target.value as typeof filterStage)
              }
              className="border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            >
              <option value="all">All</option>
              <option value="review">Review</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-gray-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Loading reports…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
          No reports found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((it) => {
            const stage = stageFromCompletion(it.completion);
            const canSubmit = stage === "Completed";
            const isRowDeleting = isDeleting === it.pursuit_id;

            return (
              <div
                key={it.pursuit_id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow transition-all"
              >
                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: title + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                          {it.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${stageBadgeClasses(
                            stage
                          )}`}
                        >
                          {stage}
                        </span>
                      </div>

                      {/* Edit response button */}
                      <div className="mt-2">
                        <button
                          onClick={() => handleEditResponse(it)}
                          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-blue-600 bg-gray-100/80 hover:bg-gray-100 border border-gray-200 shadow-inner transition"
                        >
                          <PencilLine className="w-4 h-4" />
                          Edit response
                        </button>
                      </div>

                      {/* Created at on separate row */}
                      <div className="mt-2 text-xs text-gray-500">
                        Created: {niceDate(it.created_at)}
                      </div>
                    </div>

                    {/* Right: due + progress + actions */}
                    <div className="flex items-center gap-6">
                      {/* Due date pill */}
                      <div className="hidden sm:flex flex-col items-end">
                        <div className="text-xs text-gray-500 mb-1">Due date</div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700 text-xs">
                          <Calendar className="w-3.5 h-3.5" />
                          {niceDate(it.due_date)}
                        </div>
                      </div>

                      {/* Progress ring */}
                      <div className="flex items-center">
                        <div
                          className="h-16 w-16 rounded-full flex items-center justify-center text-white shadow-sm border-4 border-gray-200"
                          style={{
                            background: `conic-gradient(#10B981 ${it.completion}%, #F3F4F6 0)`,
                          }}
                          aria-label={`Completion ${it.completion}%`}
                          title={`Completion ${it.completion}%`}
                        >
                          <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                            <span className="text-xs font-semibold text-gray-700">
                              {it.completion}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Submitted checkbox and Delete icon */}
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs text-gray-500">Submit</div>
                          <button
                            onClick={() => {
                              if (canSubmit) {
                                handleToggleSubmitted(
                                  it.pursuit_id,
                                  !it.is_submitted,
                                  stage
                                );
                              } else {
                                toast.info(
                                  "Complete all sections (100%) before submitting."
                                );
                              }
                            }}
                            disabled={!canSubmit}
                            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${
                              canSubmit
                                ? "border-emerald-500 hover:bg-emerald-50 cursor-pointer"
                                : "border-gray-300 cursor-not-allowed"
                            } ${
                              it.is_submitted && canSubmit
                                ? "bg-emerald-500 text-white"
                                : "bg-white"
                            }`}
                            title={
                              canSubmit
                                ? it.is_submitted
                                  ? "Mark as not submitted"
                                  : "Mark as submitted"
                                : "Complete all sections to enable submission"
                            }
                          >
                            {it.is_submitted && canSubmit ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <Square
                                className={`w-5 h-5 ${
                                  canSubmit ? "text-emerald-500" : "text-gray-400"
                                }`}
                              />
                            )}
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteClick(it)}
                          className={`text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors ${isRowDeleting ? "cursor-progress opacity-60" : ""}`}
                          title="Remove from Reports"
                          disabled={isRowDeleting}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Report"
        description={
          itemToDelete
            ? `Are you sure you want to remove "${itemToDelete.title}" from your reports? This action cannot be undone.`
            : "Are you sure you want to delete this report?"
        }
        confirmText="Delete Report"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting === itemToDelete?.pursuit_id}
      />
    </div>
  );
}
