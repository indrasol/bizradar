import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Calendar, Clock, Building, DollarSign, FileText, Globe, AlertTriangle, CheckCircle, Users, Info, Plus, ExternalLink, NotepadText } from "lucide-react";
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

  const handleGenerateResponse = () => {
    if (!opportunity) return;
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
    } as any;
    sessionStorage.setItem("currentContract", JSON.stringify(contract));
    navigate(`/contracts/rfp/${opportunity.id}`);
  };

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

  // Extract contact information from opportunity summary
  const extractContactInfo = (opportunity: Opportunity) => {
    try {
      const summaryText = opportunity.summary || opportunity.summary_ai || "";
      console.log('Raw summary text:', summaryText);
      
      if (typeof summaryText === 'string') {
        // Split the text into lines and look for contact info
        const lines = summaryText.split('\n');
        console.log('Summary lines:', lines);
        
        for (const line of lines) {
          // Look for the pattern: Name — email | phone
          if (line.includes('—') && line.includes('@') && line.includes('|')) {
            console.log('Found contact line with — @ |:', line);
            
            // Check if this line starts with markdown formatting like "- **Contact information**:"
            if (line.includes('**Contact information**:')) {
              // Extract the contact details from the same line after "**Contact information**:"
              const contactInfoMatch = line.match(/\*\*Contact information\*\*:\s*(.+)/);
              if (contactInfoMatch) {
                const contactDetails = contactInfoMatch[1].trim();
                console.log('Contact details extracted:', contactDetails);
                
                // Check if the contact details contain the format: Name — email | phone
                if (contactDetails.includes('—') && contactDetails.includes('@') && contactDetails.includes('|')) {
                  const parts = contactDetails.split('—');
                  if (parts.length === 2) {
                    const name = parts[0].trim();
                    const contactPart = parts[1].trim();
                    
                    const contactParts = contactPart.split('|');
                    if (contactParts.length === 2) {
                      const email = contactParts[0].trim();
                      const phone = contactParts[1].trim();
                      
                      console.log('Extracted contact info from markdown:', { name, email, phone });
                      return {
                        name: name,
                        email: email,
                        phone: phone
                      };
                    }
                  }
                }
              }
            } else {
              // This is a standalone contact line without markdown header
              const parts = line.split('—');
              if (parts.length === 2) {
                const name = parts[0].trim();
                const contactPart = parts[1].trim();
                
                // Split the contact part by | to get email and phone
                const contactParts = contactPart.split('|');
                if (contactParts.length === 2) {
                  const email = contactParts[0].trim();
                  const phone = contactParts[1].trim();
                  
                  console.log('Extracted contact info:', { name, email, phone });
                  return {
                    name: name,
                    email: email,
                    phone: phone
                  };
                }
              }
            }
          }
        }
        
        // If no structured contact info found, just look for email
        const emailMatch = summaryText.match(/([^\s]+@[^\s]+)/);
        if (emailMatch) {
          console.log('Found email only:', emailMatch[1]);
          return {
            name: null,
            email: emailMatch[1].trim(),
            phone: null
          };
        }
      }
    } catch (error) {
      console.error('Error extracting contact info:', error);
    }
    
    console.log('No contact info found');
    return { name: null, email: null, phone: null };
  };

  // Filter out due date and contact information from summary content
  const filterSummaryContent = (summary: unknown): string => {
    if (!summary) return "";
    
    const summaryText = String(summary);
    console.log('Filtering summary:', summaryText);
    
    // Remove lines containing due date information and contact info
    const lines = summaryText.split('\n');
    const filteredLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      const trimmedLine = line.trim();
      
      console.log(`Processing line ${i}: "${trimmedLine}"`);
      
      // Remove due date lines
      if (lowerLine.includes('due date') || 
          lowerLine.includes('response date') || 
          lowerLine.includes('deadline') ||
          lowerLine.includes('closing date')) {
        console.log(`Removing due date line: "${trimmedLine}"`);
        continue;
      }
      
      // Remove contact info lines (lines with — and @ and |)
      if (trimmedLine.includes('—') && trimmedLine.includes('@') && trimmedLine.includes('|')) {
        console.log(`Removing contact info line: "${trimmedLine}"`);
        continue;
      }
      
      // Remove lines that contain contact information patterns
      if (trimmedLine.includes('**Contact information**:')) {
        console.log(`Removing contact info header line: "${trimmedLine}"`);
        continue;
      }
      
      // Remove any line that contains "Contact Person" followed by contact info
      if (trimmedLine.includes('Contact Person') && (trimmedLine.includes('—') || trimmedLine.includes('@'))) {
        console.log(`Removing contact person line: "${trimmedLine}"`);
        continue;
      }
      
      // Remove any line that contains "Contact Information" as a header
      if (trimmedLine.toLowerCase().includes('contact information')) {
        console.log(`Removing contact information header: "${trimmedLine}"`);
        continue;
      }
      
      console.log(`Keeping line: "${trimmedLine}"`);
      filteredLines.push(line);
    }
    
    const result = filteredLines.join('\n').trim();
    console.log('Filtered result:', result);
    return result;
  };

  if (!opportunity) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex flex-1">
          <SideBar />
          <div className="flex flex-1 flex-col">
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
        <div className="flex flex-1 flex-col overflow-hidden">
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

              {/* Title Section with Action Buttons */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {opportunity.title}
                  </h1>
                  <div className="flex items-center gap-3">
                    <button
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>Add to Pursuits</span>
                    </button>
                    <button
                      onClick={handleGenerateResponse}
                      className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border border-green-200"
                    >
                      <FileText size={14} />
                      <span>Generate Response</span>
                    </button>
                    {opportunity.external_url && (
                      <button
                        className="px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border border-gray-200"
                      >
                        <Globe size={14} />
                        <span>View Original Posting</span>
                      </button>
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

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column - Main Information */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Summary Card */}
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
                        <div className="text-gray-800 text-sm leading-relaxed">{opportunity.objective || 'Not specified'}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Expected Outcome</div>
                        <div className="text-gray-800 text-sm leading-relaxed">{opportunity.expected_outcome || 'Not specified'}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Description Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <NotepadText size={20} />
                        Full Description
                      </CardTitle>
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

                  {/* Key Facts Card */}
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

                  {/* Financial Details Card */}
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
                </div>

                {/* Right Column - Details */}
                <div className="space-y-6">
                  {/* Timeline Card - Replaces Key Information */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-base font-semibold text-blue-900 dark:text-blue-200 mb-4 flex items-center gap-2">
                      <Clock size={18} />
                      Timeline
                    </h3>
                    
                    {/* Published Date */}
                    <div className="mb-5">
                      <div className="text-sm text-blue-600 dark:text-blue-300 uppercase tracking-wide mb-2 dark:font-bold">Published</div>
                      <div className="font-medium text-blue-900 dark:text-blue-100 text-base">
                        {opportunity.published_date || "Recent"}
                      </div>
                    </div>

                    {/* Due Date */}
                    {opportunity.response_date && (
                      <div className="mb-5">
                        <div className="text-sm text-blue-600 dark:text-blue-300 uppercase tracking-wide mb-2 dark:font-bold">Due Date</div>
                        <div className="font-medium text-blue-900 dark:text-blue-100 text-base mb-3">
                          {opportunity.response_date}
                        </div>
                        
                        {/* Response Needed Badge */}
                        {isPastDue ? (
                          <div className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200 w-full">
                            <AlertTriangle size={14} />
                            <span>Past Due Date</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200 w-full">
                            <Clock size={14} />
                            <span>{days} day{days !== 1 ? 's' : ''} to respond</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Solicitation and NAICS Code Badges - Below Timeline Card */}
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-sm">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Solicitation #</div>
                      <div className="font-medium text-gray-900 truncate">{opportunity.solicitation_number || "N/A"}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-sm">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">NAICS Code</div>
                      <div className="font-medium text-gray-900">{opportunity.naics_code || "000000"}</div>
                    </div>
                  </div>

                  {/* Contact Info Card - Below NAICS Badges */}
                  {(() => {
                    const contactInfo = extractContactInfo(opportunity);
                    if (contactInfo.name || contactInfo.email || contactInfo.phone) {
                      return (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-sm">
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Contact Information</div>
                          {contactInfo.name && (
                            <div className="mb-2">
                              <div className="text-xs text-gray-500 mb-1">Contact Person</div>
                              <div className="font-medium text-gray-900">{contactInfo.name}</div>
                            </div>
                          )}
                          {contactInfo.email && (
                            <div className="mb-2">
                              <div className="text-xs text-gray-500 mb-1">Email</div>
                              <div className="font-medium text-gray-900 break-all">{contactInfo.email}</div>
                            </div>
                          )}
                          {contactInfo.phone && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Phone</div>
                              <div className="font-medium text-gray-900">{contactInfo.phone}</div>
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
