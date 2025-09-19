import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Clock, Building, DollarSign, FileText, Globe,
  AlertTriangle, CheckCircle, Users, Info, Plus, NotepadText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SideBar from "@/components/layout/SideBar";
import Header from "@/components/opportunities/Header";
import { Opportunity } from "@/models/opportunities";
import { useAuth } from "@/components/Auth/useAuth";
import { useTrack } from "@/logging";


// —— Inline Supabase client (remove if you have a shared client) ——
import { createClient, SupabaseClient } from "@supabase/supabase-js";
let _sb: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (_sb) return _sb;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anon) {
    throw new Error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
  }
  _sb = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _sb;
}

// Find an existing tracker for (user, opportunity); otherwise insert one.
// Returns the tracker id. This is the only piece both buttons share.
async function addToTracker(op: Opportunity, userId: string): Promise<number> {
  const sb = getSupabase();
  const oppId = Number(op.id);

  // 1) check if it already exists for this user+opportunity
  const { data: existing, error: findErr } = await sb
    .from("trackers")
    .select("id")
    .eq("user_id", userId)
    .eq("opportunity_id", oppId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing?.id) return existing.id as number;

  // 2) create a minimal draft tracker
  const { data, error } = await sb
    .from("trackers")
    .insert({
      user_id: userId,
      title: op.title?.slice(0, 255) ?? "Untitled",
      description: op.description?.slice(0, 1000) ?? null,
      stage: "Assessment",
      due_date: op.response_date ?? null,
      naicscode: op.naics_code ?? null,
      opportunity_id: oppId,
      is_submitted: false,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data!.id as number;
}

const OpportunityDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const track = useTrack();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [pursuitCount, setPursuitCount] = useState<number>(0);
  const [adding, setAdding] = useState(false);
  const [generating, setGenerating] = useState(false);
 
  // ————— HANDLERS —————

  // Add to Pursuits → add to tracker (or reuse) and stash trackerId
  const handleAddToPursuits = async () => {
    if (!opportunity || !user?.id) return;
    try {
      setAdding(true);
      const trackerId = await addToTracker(opportunity, user.id);
      // const pursuitId = String(trackerId); 
      sessionStorage.setItem("currentTrackerId", String(trackerId));
      setPursuitCount((c) => c + 1);
    } catch (e) {
      console.error("Failed to add to Trackers", e);
    } finally {
      setAdding(false);
    }
  };

  // Generate Response → **do the same add-to-tracker step**, then navigate
  const handleGenerateResponse = async () => {
    if (!opportunity || !user?.id) return;
    try {
      setGenerating(true);
  
      // Ensure a tracker exists (your existing helper)
      const trackerId = await addToTracker(opportunity, user.id);
      sessionStorage.setItem("currentTrackerId", String(trackerId));
  
      // REUSE existing draft for this user+title, else create one
      const sb = getSupabase();
      const { data: existing } = await sb
        .from("reports")
        .select("pursuit_id, is_submitted, content")
        .eq("user_id", user.id)
        .eq("is_submitted", false)
        .contains("content", { rfpTitle: opportunity.title })
        .limit(1)
        .maybeSingle();
  
      let pursuitId: string;
      if (existing?.pursuit_id) {
        pursuitId = existing.pursuit_id;
      } else {
        pursuitId =
          (crypto && "randomUUID" in crypto)
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  
        const content = {
          rfpTitle: opportunity.title,
          dueDate: opportunity.response_date || null,
          sections: [],
          isSubmitted: false,
        };
  
        const { error: repErr } = await sb.from("reports").upsert({
          pursuit_id: pursuitId,
          user_id: user.id,
          content,
          completion_percentage: 0,
          is_submitted: false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id, pursuit_id'
        });
        if (repErr) throw repErr;
        
      }
  
      // Stash what the editor expects — include pursuit_id
      const contract = {
        id: opportunity.id,
        title: opportunity.title,
        department: opportunity.agency,
        noticeId: opportunity.id,
        dueDate: opportunity.response_date || "2025-01-01",
        response_date: opportunity.response_date || "2025-01-01",
        published_date: opportunity.published_date || "",
        value: opportunity.budget || "0",
        status: (opportunity as any).active === false ? "Inactive" : "Active",
        naicsCode: opportunity.naics_code || "000000",
        solicitation_number: opportunity.solicitation_number || "",
        description: opportunity.description || "",
        external_url: opportunity.external_url || "",
        budget: opportunity.budget || "",
        tracker_id: trackerId,
        pursuit_id: pursuitId, // ← critical
      } as any;
  
      sessionStorage.setItem("currentContract", JSON.stringify(contract));
  
      // Navigate BY pursuit_id so the editor loads the right row
      navigate(`/contracts/rfp/${pursuitId}`);
    } catch (e) {
      console.error("Failed to generate response", e);
    } finally {
      setGenerating(false);
    }
  };
  
  

  // Opens the original opportunity posting in a new browser tab
  const handleViewOriginalPosting = () => {
    if (opportunity?.external_url) {
      window.open(opportunity.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Formats the opportunity description into readable paragraphs without headings.
  const formatDescription = (description: string) => {
    if (!description) return '';
    
    // Normalize whitespace
    let text = description
      .replace(/\r\n?/g, '\n')
      .replace(/\t+/g, ' ')
      .replace(/ +/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    // If the source already has blank lines, honor them as paragraphs
    if (/\n\n/.test(text)) {
      return text
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    // Otherwise, create paragraphs at safe sentence boundaries
    // Protect common abbreviations from being split
    const placeholders: Record<string, string> = {
      'U.S.C.': '<<USC>>',
      'U.S.': '<<US>>',
      'e.g.': '<<EG>>',
      'i.e.': '<<IE>>',
    };
    for (const [k, v] of Object.entries(placeholders)) {
      const re = new RegExp(k.replace(/\./g, '\\.'), 'g');
      text = text.replace(re, v);
    }

    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
    // Restore placeholders
    const restore = (s: string) => s
      .replace(/<<USC>>/g, 'U.S.C.')
      .replace(/<<US>>/g, 'U.S.')
      .replace(/<<EG>>/g, 'e.g.')
      .replace(/<<IE>>/g, 'i.e.');

    const paragraphs: string[] = [];
    let current = '';
    const target = 500; // target paragraph length
    for (const raw of sentences) {
      const sentence = restore(raw).trim();
      if (!sentence) continue;
      if ((current + ' ' + sentence).trim().length > target && current) {
        paragraphs.push(current.trim());
        current = sentence;
      } else {
        current = (current ? current + ' ' : '') + sentence;
      }
    }
    if (current.trim()) paragraphs.push(current.trim());

    return paragraphs.join('\n\n');
  };

  // ————— EFFECTS & HELPERS —————

  useEffect(() => {
    const stored = sessionStorage.getItem("selectedOpportunity");
    if (stored) {
      setOpportunity(JSON.parse(stored));
    } else {
      navigate("/opportunities");
    }
  }, [id, navigate]);

  const calculateDaysRemaining = (dueDate: string | null): { days: number; isPastDue: boolean } => {
    if (!dueDate) return { days: 0, isPastDue: false };
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { days: Math.abs(diff), isPastDue: diff < 0 };
  };

  const extractContactInfo = (op: Opportunity) => {
    try {
      const summaryText = op.summary || op.summary_ai || "";
      if (typeof summaryText === "string") {
        const lines = summaryText.split("\n");
        for (const line of lines) {
          if (line.includes("—") && line.includes("@") && line.includes("|")) {
            if (line.includes("**Contact information**:")) {
              const m = line.match(/\*\*Contact information\*\*:\s*(.+)/);
              if (m) {
                const details = m[1].trim();
                const [namePart, right] = details.split("—");
                if (right && right.includes("@") && right.includes("|")) {
                  const [email, phone] = right.split("|").map((s) => s.trim());
                  return { name: namePart.trim(), email, phone };
                }
              }
            } else {
              const [name, right] = line.split("—");
              if (right && right.includes("@") && right.includes("|")) {
                const [email, phone] = right.split("|").map((s) => s.trim());
                return { name: name.trim(), email, phone };
              }
            }
          }
        }
        const emailMatch = summaryText.match(/([^\s]+@[^\s]+)/);
        if (emailMatch) return { name: null, email: emailMatch[1].trim(), phone: null };
      }
    } catch (e) {
      console.error("extractContactInfo error:", e);
    }
    return { name: null, email: null, phone: null };
  };

  if (!opportunity) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex flex-1">
          {/* <SideBar /> */}
          <div className="flex flex-1 flex-col">
            {/* <Header logout={logout} pursuitCount={pursuitCount} /> */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading opportunity details...</h2>
                <p className="text-gray-600">Please wait while we load the information.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { days, isPastDue } = calculateDaysRemaining(opportunity.response_date);

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-800">
      <div className="flex flex-1 overflow-hidden">
        {/* <SideBar /> */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* <Header logout={logout} pursuitCount={pursuitCount} /> */}

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 w-full px-8">
              {/* Commented out Back button to return to the Opportunities list */}
              {/* <Button
                variant="ghost"
                onClick={() => navigate("/opportunities")}
                className="mb-6 flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Opportunities
              </Button> */}

              <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-4 gap-4">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex-1 min-w-0 break-words">{opportunity.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 lg:gap-3 flex-shrink-0">
                    <button
                      onClick={handleAddToPursuits}
                      disabled={adding || !user?.id}
                      className="px-2 lg:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span className="hidden sm:inline">{adding ? "Adding..." : "Add to Tracker"}</span>
                      <span className="sm:hidden">{adding ? "Adding..." : "Add"}</span>
                    </button>

                    <button
                      onClick={handleGenerateResponse}
                      disabled={generating || !user?.id}
                      className="px-2 lg:px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-60 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border border-green-200"
                    >
                      <FileText size={14} />
                      <span className="hidden sm:inline">{generating ? "Preparing..." : "Generate Response"}</span>
                      <span className="sm:hidden">{generating ? "Preparing..." : "Generate"}</span>
                    </button>

                    {opportunity.external_url && (
                      <a
                        href={opportunity.external_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          try {
                            track({
                              event_name: "view_job_details",
                              event_type: "button_click",
                              metadata: {
                                search_query: null,                     // keep search query null
                                stage: null,                     // unchanged
                                opportunity_id: Number(opportunity.id) || null,
                                title: opportunity.title || null,
                                naics_code: opportunity.naics_code || null,
                              },
                            });
                          } catch {}
                        }}
                        className="px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border border-gray-200"
                      >
                        <Globe size={14} />
                        <span className="hidden sm:inline">View Original Posting</span>
                        <span className="sm:hidden">View Original</span>
                        
                      </a>
                    )}
                  </div>
                </div>

                {opportunity.agency && (
                  <p className="text-lg text-gray-600 flex items-center gap-2">
                    <Building size={18} />
                    {opportunity.agency}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info size={20} />
                        Opportunity Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Objective</div>
                        <div className="text-gray-800 text-sm leading-relaxed">
                          {opportunity.objective || "Not specified"}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Expected Outcome</div>
                        <div className="text-gray-800 text-sm leading-relaxed">
                          {opportunity.expected_outcome || "Not specified"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <NotepadText size={20} />
                        Full Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {opportunity.description ? (
                        <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {formatDescription(opportunity.description)}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No detailed description available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users size={20} />
                        Eligibility Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {opportunity.eligibility ? (
                        <div className="prose prose-sm max-w-none text-gray-700">
                          {String(opportunity.eligibility)}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No eligibility requirements specified</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle size={20} />
                        Key Facts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {opportunity.key_facts ? (
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                          {String(opportunity.key_facts)}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No key facts available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign size={20} />
                        Financial Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Contract Value</p>
                        <p className="text-2xl font-bold text-green-600">
                          {opportunity.budget || "Not specified"}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500 italic">
                          Additional financial details will be displayed here
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-base font-semibold text-blue-900 dark:text-blue-200 mb-4 flex items-center gap-2">
                      <Clock size={18} />
                      Timeline
                    </h3>

                    <div className="mb-5">
                      <div className="text-sm text-blue-600 dark:text-blue-300 uppercase tracking-wide mb-2 dark:font-bold">Published</div>
                      <div className="font-medium text-blue-900 dark:text-blue-100 text-base">
                        {opportunity.published_date || "Recent"}
                      </div>
                    </div>

                    {opportunity.response_date && (
                      <div className="mb-5">
                        <div className="text-sm text-blue-600 dark:text-blue-300 uppercase tracking-wide mb-2 dark:font-bold">Due Date</div>
                        <div className="font-medium text-blue-900 dark:text-blue-100 text-base mb-3">
                          {opportunity.response_date}
                        </div>
                        {isPastDue ? (
                          <div className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200 w-full dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">
                            <AlertTriangle size={14} />
                            <span>Past Due Date</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200 w-full dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700">
                            <Clock size={14} />
                            <span>{days} day{days !== 1 ? "s" : ""} to respond</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-sm">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Solicitation #</div>
                      <div className="font-medium text-gray-900 truncate">
                        {opportunity.solicitation_number || "N/A"}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-sm">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">NAICS Code</div>
                      <div className="font-medium text-gray-900">
                        {opportunity.naics_code || "000000"}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const { name, email, phone } = extractContactInfo(opportunity);
                    if (name || email || phone) {
                      return (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-sm">
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Contact Information</div>
                          {name && (
                            <div className="mb-2">
                              <div className="text-xs text-gray-500 mb-1">Contact Person</div>
                              <div className="font-medium text-gray-900">{name}</div>
                            </div>
                          )}
                          {email && (
                            <div className="mb-2">
                              <div className="text-xs text-gray-500 mb-1">Email</div>
                              <div className="font-medium text-gray-900 break-all">{email}</div>
                            </div>
                          )}
                          {phone && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Phone</div>
                              <div className="font-medium text-gray-900">{phone}</div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetails;
