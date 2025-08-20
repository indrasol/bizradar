import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Calendar, Clock, Building, DollarSign, FileText, Globe, AlertTriangle, CheckCircle, Users, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SideBar from "@/components/layout/SideBar";
import Header from "@/components/opportunities/Header";
import { Opportunity } from "@/models/opportunities";
import { useAuth } from "@/components/Auth/useAuth";

const OpportunityDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [pursuitCount, setPursuitCount] = useState<number>(0);

  useEffect(() => {
    // Get opportunity data from sessionStorage
    const storedOpportunity = sessionStorage.getItem("selectedOpportunity");
    if (storedOpportunity) {
      setOpportunity(JSON.parse(storedOpportunity));
    } else {
      // If no stored data, redirect back to opportunities
      navigate("/opportunities");
    }
  }, [id, navigate]);

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

  // Extract eligibility and key facts from opportunity summary
  const extractSummaryFields = (opportunity: Opportunity) => {
    try {
      // Try to parse the summary as JSON object first
      if (opportunity.summary && typeof opportunity.summary === 'object') {
        const summaryObj = opportunity.summary as Record<string, unknown>;
        return {
          eligibility: summaryObj.eligibility ? String(summaryObj.eligibility).trim() : null,
          keyFacts: summaryObj.key_facts ? String(summaryObj.key_facts).trim() : null
        };
      }
      
      // If summary is a string, try to extract from markdown-like format
      const summaryText = opportunity.summary || opportunity.summary_ai || "";
      if (typeof summaryText === 'string') {
        const eligibilityMatch = summaryText.match(/[-*]\s*\*\*Eligibility\*\*:\s*(.+?)(?=\n[-*]|\n\n|$)/i);
        const keyFactsMatch = summaryText.match(/[-*]\s*\*\*Key Facts\*\*:\s*(.+?)(?=\n[-*]|\n\n|$)/i);
        
        return {
          eligibility: eligibilityMatch ? eligibilityMatch[1].trim() : null,
          keyFacts: keyFactsMatch ? keyFactsMatch[1].trim() : null
        };
      }
    } catch (error) {
      console.error('Error extracting summary fields:', error);
    }
    
    return { eligibility: null, keyFacts: null };
  };

  if (!opportunity) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex flex-1">
          <SideBar />
          <div className="flex-1 flex flex-col">
            <Header logout={logout} pursuitCount={pursuitCount} />
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
        <SideBar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header logout={logout} pursuitCount={pursuitCount} />
          
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 w-full px-8">
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={() => navigate("/opportunities")}
                className="mb-6 flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Opportunities
              </Button>

              {/* Title Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {opportunity.title}
                  </h1>
                  {opportunity.response_date && (
                    <div className="flex items-center gap-2">
                      {isPastDue ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle size={12} />
                          Past Due Date
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock size={12} />
                          {days} day{days !== 1 ? 's' : ''} remaining
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {opportunity.agency && (
                  <p className="text-lg text-gray-600 flex items-center gap-2">
                    <Building size={18} />
                    {opportunity.agency}
                  </p>
                )}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column - Main Information */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Summary Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText size={20} />
                        Opportunity Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {opportunity.summary || opportunity.summary_ai ? (
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                              p: ({ children }) => <p className="mb-2">{children}</p>,
                              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>
                            }}
                          >
                            {String(opportunity.summary || opportunity.summary_ai)}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No summary available</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Description Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Full Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {opportunity.description ? (
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                          {opportunity.description}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No detailed description available</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Eligibility Card */}
                  {(() => {
                    const { eligibility } = extractSummaryFields(opportunity);
                    return eligibility ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users size={20} />
                            Eligibility Requirements
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none text-gray-700">
                            <p>{String(eligibility)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null;
                  })()}

                  {/* Key Facts Card */}
                  {(() => {
                    const { keyFacts } = extractSummaryFields(opportunity);
                    return keyFacts ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Info size={20} />
                            Key Facts
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none text-gray-700">
                            <p>{String(keyFacts)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null;
                  })()}

                  {/* Requirements Card - Placeholder */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Requirements & Qualifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500 italic">Requirements information will be extracted and displayed here.</p>
                      <div className="mt-4 space-y-2">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700">📋 Minimum qualifications</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-700">✅ Required certifications</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-700">⚠️ Special requirements</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Details */}
                <div className="space-y-6">
                  {/* Key Information Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar size={20} />
                        Key Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Published Date</p>
                        <p className="text-lg font-semibold text-gray-900">{opportunity.published_date || "Not specified"}</p>
                      </div>
                      
                      {opportunity.response_date && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Response Due</p>
                          <p className="text-lg font-semibold text-gray-900">{opportunity.response_date}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Solicitation Number</p>
                        <p className="text-lg font-semibold text-gray-900">{opportunity.solicitation_number || "Not specified"}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">NAICS Code</p>
                        <p className="text-lg font-semibold text-gray-900">{opportunity.naics_code || "Not specified"}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financial Information Card */}
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
                        <p className="text-2xl font-bold text-green-600">{opportunity.budget || "Not specified"}</p>
                      </div>
                      
                      {/* Placeholder for additional financial info */}
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500 italic">Additional financial details will be displayed here</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full" size="lg">
                        Add to Pursuits
                      </Button>
                      <Button variant="outline" className="w-full" size="lg">
                        Generate Response
                      </Button>
                      {opportunity.external_url && (
                        <Button variant="outline" className="w-full" size="lg" asChild>
                          <a href={opportunity.external_url} target="_blank" rel="noopener noreferrer">
                            <Globe size={16} className="mr-2" />
                            View Original Posting
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Status Card - Placeholder */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Status & History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-500" />
                          <span className="text-sm">Opportunity identified</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                          <span className="text-sm text-gray-500">Analysis pending</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                          <span className="text-sm text-gray-500">Proposal preparation</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
