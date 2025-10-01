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
import { reportsApi } from '@/api/reports';
import { toast } from "sonner";
import { supabase } from "@/utils/supabase";  // use shared client
import { useRfpUsage } from "@/hooks/useRfpUsage";


// —— Inline Supabase client (remove if you have a shared client) ——

// Find an existing tracker for (user, opportunity); otherwise insert one.
// Returns the tracker id. This is the only piece both buttons share.
async function addToTracker(op: Opportunity, userId: string): Promise<string> {
  // Import the trackers API to ensure consistent behavior
  const { trackersApi } = await import('../api/trackers');
  
  // Check if already exists by title (since opportunity_id doesn't exist in schema)
  const existingTrackers = await trackersApi.getTrackers(userId);
  
  console.log('🔍 addToTracker: Looking for existing tracker');
  console.log('📋 Opportunity title:', op.title);
  console.log('📋 Available trackers:', existingTrackers.trackers.map(t => ({ id: t.id, title: t.title })));
  
  const existingTracker = existingTrackers.trackers.find(t => {
    const match = t.title === op.title;
    console.log(`🔍 Comparing: "${t.title}" === "${op.title}" = ${match}`);
    return match;
  });
  
  if (existingTracker) {
    console.log('✅ Found existing tracker:', existingTracker.id);
    return existingTracker.id;
  }

  console.log('❌ No existing tracker found, creating new one');
  // Create new tracker using API (this also creates the report)
  const newTracker = await trackersApi.createTracker({
    title: String(op.title || "Untitled").slice(0, 255),
    description: String(op.description || "").slice(0, 1000),
    stage: "Review",
    // Send ISO string or omit if missing
    due_date: op.response_date ? new Date(op.response_date).toISOString() : undefined,
    // Optional string field
    naicscode: op.naics_code != null ? String(op.naics_code) : undefined,
    opportunity_id: Number(op.id),
  }, userId);

  console.log('✅ Created new tracker:', newTracker.id);
  return newTracker.id;
}

const OpportunityDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const track = useTrack();

  console.log('🚀 OpportunityDetails component rendered');

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [pursuitCount, setPursuitCount] = useState<number>(0);
  const [adding, setAdding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { isLimitReached, usageStatus, loading: usageLoading } = useRfpUsage();
  const [showUpgrade, setShowUpgrade] = useState<boolean>(false);
  const [isTracked, setIsTracked] = useState<boolean>(false);
 
  // ————— EFFECTS —————
  

  // ————— HANDLERS —————

  // Add to Pursuits → add to tracker (or reuse) and stash trackerId
  const handleAddToPursuits = async () => {
    if (!opportunity || !user?.id) return;
    
    setAdding(true);
    try {
      const trackerId = await addToTracker(opportunity, user.id);
      console.log('✅ Added to tracker:', trackerId);
      
      track({
        event_name: "add_to_pursuit",
        event_type: "button_click",
        metadata: {
          opportunity_id: opportunity.id,
          title: opportunity.title,
          naics_code: opportunity.naics_code,
        },
      });
      
      setPursuitCount(prev => prev + 1);
      setIsTracked(true);
      toast.success("Added to tracker!");
    } catch (error) {
      console.error("Error adding to tracker:", error);
      toast.error("Failed to add to tracker");
    } finally {
      setAdding(false);
    }
  };

  // Generate Response → check if response exists, continue or create new
  const handleGenerateResponse = async () => {
    if (!opportunity || !user?.id) return;
    
    setGenerating(true);
    
    // Log generate response event
    track({
      event_name: "generate_rfp",
      event_type: "button_click",
      metadata: {
        search_query: null,
        stage: "review",
        section: null,
        opportunity_id: opportunity.id,
        title: opportunity.title,
        naics_code: opportunity.naics_code ?? null,
      },
    });
    
    try {
      // Do NOT auto-add to trackers from OpportunityDetails
      // const trackerId = await addToTracker(opportunity, user.id);
      // sessionStorage.setItem("currentTrackerId", trackerId);
      // navigate(`/trackers/${trackerId}`);

      // Instead, navigate directly to the RFP builder using contract route
      const contract = {
        id: opportunity.id,
        title: opportunity.title,
        department: opportunity.agency,
        noticeId: opportunity.id,
        dueDate: opportunity.response_date || null,
        response_date: opportunity.response_date || null,
        published_date: opportunity.published_date || "",
        value: opportunity.budget || "0",
        status: opportunity.active === false ? "Inactive" : "Active",
        naicsCode: opportunity.naics_code || "000000",
        solicitation_number: opportunity.solicitation_number || "",
        description: opportunity.description || "",
        external_url: opportunity.external_url || "",
        budget: opportunity.budget || "",
      } as any;
      sessionStorage.setItem("currentContract", JSON.stringify(contract));
      sessionStorage.removeItem("currentTrackerId");
      const responseId = (typeof window !== "undefined" && (window as any).crypto && "randomUUID" in (window as any).crypto)
        ? (window as any).crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
      navigate(`/contracts/rfp/${responseId}`);
    } catch (e) {
      console.error("Failed to create tracker for response", e);
      toast.error("Failed to create response");
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
    console.log('🔍 Main useEffect: Loading opportunity from sessionStorage');
    const stored = sessionStorage.getItem("selectedOpportunity");
    if (stored) {
      const opportunityData = JSON.parse(stored);
      console.log('📊 Main useEffect: Opportunity loaded:', opportunityData.title);
      setOpportunity(opportunityData);
    } else {
      console.log('❌ Main useEffect: No opportunity in sessionStorage, redirecting');
      navigate("/opportunities");
    }
  }, [id, navigate]);

  // Mirror OpportunityCard: check if already tracked for this user/opportunity title
  useEffect(() => {
    const checkTracked = async () => {
      try {
        if (!opportunity?.title) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('trackers')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', opportunity.title)
          .limit(1);
        setIsTracked(Boolean(data && data.length > 0));
      } catch {
        // ignore
      }
    };
    checkTracked();
  }, [opportunity?.title]);

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
                      className={`px-2 lg:px-3 py-1.5 disabled:opacity-60 rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center gap-1 ${
                        isTracked ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isTracked ? <CheckCircle size={14} /> : <Plus size={14} />}
                      <span className="hidden sm:inline">{adding ? (isTracked ? "Updating..." : "Adding...") : (isTracked ? "Added to Tracker" : "Add to Tracker")}</span>
                      <span className="sm:hidden">{adding ? (isTracked ? "Updating..." : "Adding...") : (isTracked ? "Added" : "Add")}</span>
                    </button>

                    <div
                      className="relative inline-block"
                      onMouseEnter={() => setShowUpgrade(true)}
                      onMouseLeave={() => setShowUpgrade(false)}
                    >
                      <button
                        onClick={handleGenerateResponse}
                        disabled={generating || !user?.id || usageLoading || isLimitReached}
                        className="px-2 lg:px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-60 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border border-green-200"
                      >
                        <FileText size={14} />
                        <span className="hidden sm:inline">{generating ? "Preparing..." : "Generate Response"}</span>
                        <span className="sm:hidden">{generating ? "Preparing..." : "Generate"}</span>
                      </button>
                      {isLimitReached && showUpgrade && (
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
