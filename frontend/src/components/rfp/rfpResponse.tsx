import React, { useState, useRef, useEffect } from 'react';
import mammoth from "mammoth";
import {
  Download,
  Sparkles,
  PenLine,
  Image,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Eye,
  Settings,
  CheckCircle,
  Circle,
  X,
  Move,
  Save,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  Calendar
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { toast } from "sonner";
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } from 'docx';
import RfpPreview from './rfpPreview';
import RfpPreviewContent from './rfpPreviewContent';
import DocumentEditor from './DocumentEditor';
import jsPDF from 'jspdf';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { API_ENDPOINTS } from '@/config/apiEndpoints';


const cleanEmptyParagraphs = (html: string): string => {
  return html.replace(/<p><br(?: class="[^"]*")?\s*\/?><\/p>/g, '');
};

const renderTemplate = (template: string, data: any): string => {
  // First handle for loops
  template = processForLoops(template, data);
  
  // Then handle conditionals
  template = processConditionals(template, data);
  
  // Finally handle simple variable substitution
  let rendered = template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const value = key.split('.').reduce((obj, k) => obj?.[k.trim()], data);
    return value !== undefined ? String(value) : match;
  });
  // Clean empty paragraphs
  rendered = cleanEmptyParagraphs(rendered);
  return rendered;
};

const processForLoops = (template: string, data: any): string => {
  const forStartTag = /{%\s*for\s+(\w+)\s+in\s+([\w.]+)\s*%}/;
  const endTag = /{%\s*endfor\s*%}/;

  let result = '';
  let remaining = template;

  while (true) {
    const startMatch = forStartTag.exec(remaining);
    if (!startMatch) {
      result += remaining;
      break;
    }

    const [startTag, itemName, arrayPath] = startMatch;
    const startIndex = startMatch.index;
    result += remaining.slice(0, startIndex);

    let cursor = startIndex + startTag.length;
    let openCount = 1;
    let endIndex = -1;

    // Find the matching endfor by counting nested loops
    while (cursor < remaining.length) {
      const nextStart = remaining.slice(cursor).search(forStartTag);
      const nextEnd = remaining.slice(cursor).search(endTag);

      if (nextEnd === -1) break;

      if (nextStart !== -1 && nextStart < nextEnd) {
        openCount++;
        cursor += nextStart + startTag.length;
      } else {
        openCount--;
        if (openCount === 0) {
          endIndex = cursor + nextEnd;
          break;
        }
        cursor += nextEnd + 1;
      }
    }

    if (endIndex === -1) {
      console.error("Unmatched {% for %} tag");
      break;
    }

    const loopBody = remaining.slice(startMatch.index + startTag.length, endIndex);
    remaining = remaining.slice(endIndex + remaining.slice(endIndex).match(endTag)[0].length);

    const array = arrayPath.split('.').reduce((obj, k) => obj?.[k.trim()], data);
    if (!Array.isArray(array)) {
      console.warn(`Expected array for '${arrayPath}', got`, array);
      continue;
    }

    for (const item of array) {
      const loopContext = { ...data, [itemName]: item };
      let processed = processForLoops(loopBody, loopContext);
      processed = processConditionals(processed, loopContext);
      processed = processed.replace(/\{\{([^}]+)\}\}/g, (varMatch, key) => {
        const value = key.trim().split('.').reduce((obj, k) => obj?.[k.trim()], loopContext);
        return value !== undefined ? String(value) : varMatch;
      });
      result += processed;
    }
  }

  return result;
};

const processConditionals = (template: string, data: any): string => {
  // Match {% if condition %} ... {% endif %}
  const ifRegex = /\{%\s*if\s+([^%]+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g;
  
  return template.replace(ifRegex, (match, condition, content) => {
    const isTrue = evaluateCondition(condition, data);
    return isTrue ? content : '';
  });
};

const evaluateCondition = (condition: string, data: any): boolean => {
  // Simple condition evaluation
  // Supports: variable, variable == value, variable != value, variable.length > 0
  
  const trimmedCondition = condition.trim();
  
  // Check if it's a simple variable existence check
  if (!trimmedCondition.includes(' ')) {
    const value = trimmedCondition.split('.').reduce((obj, k) => obj?.[k.trim()], data);
    return value !== undefined && value !== null && value !== '';
  }
  
  // Check for equality/inequality
  const equalityMatch = trimmedCondition.match(/^(.+)\s*(==|!=)\s*(.+)$/);
  if (equalityMatch) {
    const [, left, operator, right] = equalityMatch;
    const leftValue = left.trim().split('.').reduce((obj, k) => obj?.[k.trim()], data);
    const rightValue = right.trim().replace(/['"]/g, ''); // Remove quotes
    
    if (operator === '==') {
      return String(leftValue) === rightValue;
    } else if (operator === '!=') {
      return String(leftValue) !== rightValue;
    }
  }
  
  // Check for length comparisons
  const lengthMatch = trimmedCondition.match(/^(.+)\.length\s*(>|<|>=|<=)\s*(\d+)$/);
  if (lengthMatch) {
    const [, arrayPath, operator, length] = lengthMatch;
    const array = arrayPath.trim().split('.').reduce((obj, k) => obj?.[k.trim()], data);
    const arrayLength = Array.isArray(array) ? array.length : 0;
    const compareLength = parseInt(length);
    
    switch (operator) {
      case '>': return arrayLength > compareLength;
      case '<': return arrayLength < compareLength;
      case '>=': return arrayLength >= compareLength;
      case '<=': return arrayLength <= compareLength;
    }
  }
  
  return false;
};

// API base URL and endpoints are centralized in API_ENDPOINTS

const RfpResponse = ({ contract, pursuitId, aiOpportunityId }: { contract: any; pursuitId: string; aiOpportunityId?: number }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const exampleJob = contract || {
    title: 'DA10--Retail Merchandising System (RMS) and the Oracle Retail Store Inventory Management (SIM)',
    dueDate: '2025-04-11',
    publishedDate: '2025-04-04',
    department: 'Veterans Affairs, Department of Technology Acquisition Center NJ (36C10B)',
    naicsCode: '541512',
    solicitationNumber: '36C10B25Q0245'
  };

  const documentRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [logo, setLogo] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [letterhead, setLetterhead] = useState('');
  const [phone, setPhone] = useState('');
  const [rfpTitle, setRfpTitle] = useState(contract?.title || 'Proposal for Cybersecurity Audit & Penetration Testing Services');
  const [rfpNumber, setRfpNumber] = useState(exampleJob.solicitationNumber);
  const [issuedDate, setIssuedDate] = useState(contract?.published_date || new Date().toLocaleDateString());
  const [submittedBy, setSubmittedBy] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);
  const [theme, setTheme] = useState('professional'); // professional, modern, classic

  // Add new state for tracking saving and completion
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Change these state variables
  const [naicsCode, setNaicsCode] = useState(contract?.naicsCode || '000000');
  const [solicitationNumber, setSolicitationNumber] = useState(contract?.solicitation_number || '');

  // Add new state for modal and PDF URL
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  // State for preview modal
  const [showMergedPreview, setShowMergedPreview] = useState(false);
  const [mergedPreviewContent, setMergedPreviewContent] = useState('');

  // Ref for the DocumentEditor preview
  const previewEditorRef = useRef(null);

  // Move the defaultTemplate function above the sections state declaration
  const defaultTemplate = (job) => [
    {
      id: 1,
      title: 'COVER PAGE',
      content: '/rfp_templates/cover_page_template.docx',
      icon: 'cover',
      completed: false
    },
    {
      id: 2,
      title: 'TABLE OF CONTENTS',
      content: '/rfp_templates/table_of_content_template.docx',
      icon: 'toc',
      completed: false
    },
    {
      id: 3,
      title: 'EXECUTIVE SUMMARY',
      content: '/rfp_templates/executive_summary_template.docx',
      icon: 'summary',
      completed: false
    },
    {
      id: 4,
      title: 'COMPANY OVERVIEW',
      content: '/rfp_templates/company_overview_template.docx',
      icon: 'company',
      completed: false
    },
    {
      id: 5,
      title: 'QUALIFICATIONS AND EXPERIENCE',
      content: '/rfp_templates/qualifications_experience_template.docx',
      icon: 'qualifications',
      completed: false
    },
    {
      id: 6,
      title: 'TECHNICAL APPROACH',
      content: '/rfp_templates/technical_approach_template.docx',
      icon: 'technical',
      completed: false
    },
    {
      id: 7,
      title: 'PRICING STRUCTURE',
      content: '/rfp_templates/pricing_structure_template.docx',
      icon: 'pricing',
      completed: false
    }
  ];

  // Utility function to convert a docx file (by URL or path) to HTML using mammoth
  // Note: This function assumes mammoth is available in the environment.
  // Usage: const html = await docxToHtml('/path/to/file.docx');
  async function docxToHtml(docxUrl: string): Promise<string> {
    try {
      // Fetch the docx file as an ArrayBuffer
      const response = await fetch(docxUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch docx file: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();

      // Use mammoth to convert the ArrayBuffer to HTML
      // @ts-ignore
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      if (/<img\s/i.test(html)) {
        const imgMatch = html.match(/<img[^>]*>/i);
        if (imgMatch) {
          const imgTag = imgMatch[0];
          console.log(`Image detected in HTML from docx: ${docxUrl}. First 50 chars: ${imgTag.substring(0, 50)}`);
        } else {
          console.log(`Image detected in HTML from docx: ${docxUrl}, but could not extract <img> tag.`);
        }
      }
      return html;
    } catch (error) {
      console.error('Error converting docx to HTML:', error);
      return '<p>Error loading document content.</p>';
    }
  }

  // Reusable function to load docx templates and set as HTML in sections
  const resetSectionsWithDocxHtml = async () => {
    const templateSections = defaultTemplate(exampleJob);
    const sectionsWithHtml = await Promise.all(
      templateSections.map(async (section, idx) => {
        if (typeof section.content === 'string' && section.content.endsWith('.docx')) {
          const html = await docxToHtml(section.content);
          // We'll set the content in the DocumentEditor after mount using useEffect
          return { ...section, content: html };
        }
        return section;
      })
    );
    setSections(sectionsWithHtml);
  };

  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    // On mount, load docx templates as HTML for DocumentEditors
    resetSectionsWithDocxHtml();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [proposalData, setProposalData] = useState({
    logo: null,
    companyName: '',
    companyWebsite: '',
    letterhead: '',
    phone: '',
    rfpTitle: contract?.title || 'Proposal for Cybersecurity Audit & Penetration Testing Services',
    naicsCode: contract?.naicsCode || '000000',
    solicitationNumber: contract?.solicitation_number || '',
    issuedDate: contract?.published_date || new Date().toLocaleDateString(),
    submittedBy: '',
    theme: 'professional',
    sections: defaultTemplate(exampleJob)
  });

  // Add useEffect to log state changes
  useEffect(() => {
    console.log('isSubmitted state:', isSubmitted);
  }, [isSubmitted]);

  // Modify the loadRfpData function to properly set isSubmitted and load profile data
  useEffect(() => {
    const loadRfpData = async () => {
      if (!pursuitId) return;

      try {
        console.log("Loading RFP data for pursuit ID:", pursuitId);

        // Fetch user profile data first
        const userProfile = await fetchUserProfile();

        // Fetch RFP response data for this pursuit
        const { data: responses, error } = await supabase
          .from('rfp_responses')
          .select('*')
          .eq('pursuit_id', pursuitId);

        if (error) {
          console.error("Error loading RFP data:", error);
          toast?.error("Failed to load saved RFP data.");
          return;
        }

        if (responses && responses.length > 0) {
          const data = responses[0];
          console.log("Loaded RFP data:", data);

          // Set submission status first
          setIsSubmitted(data.is_submitted || false);
          console.log("Setting isSubmitted to:", data.is_submitted);

          if (data.content) {
            const content = data.content;

            // Set all state values from saved data, with profile fallbacks
            setLogo(content.logo || userProfile?.avatar_url || null);
            console.log("Logo:", logo);
            setCompanyName(content.companyName || userProfile?.company_name || 'BizRadar Solutions');
            setCompanyWebsite(content.companyWebsite || userProfile?.company_url || 'https://www.bizradar.com');
            setLetterhead(content.letterhead || '123 Innovation Drive, Suite 100, TechCity, TX 75001'); // No address field in profile
            setPhone(content.phone || userProfile?.phone_number || '(510) 754-2001');
            setRfpTitle(content.rfpTitle || 'Proposal for Cybersecurity Audit & Penetration Testing Services');
            setRfpNumber(content.rfpNumber || exampleJob.solicitationNumber);
            setIssuedDate(content.issuedDate || 'December 26th, 2024');
            setSubmittedBy(content.submittedBy || `${userProfile?.first_name || 'Admin'} ${userProfile?.last_name || 'User'}, ${userProfile?.company_name || 'BizRadar'}`);
            setTheme(content.theme || 'professional');
            if (Array.isArray(content.sections)) {
              setSections(content.sections);
            }

            setProposalData({
              logo: content.logo || userProfile?.avatar_url || null,
              companyName: content.companyName || userProfile?.company_name || 'BizRadar Solutions',
              companyWebsite: content.companyWebsite || userProfile?.company_url || 'https://www.bizradar.com',
              letterhead: content.letterhead || '123 Innovation Drive, Suite 100, TechCity, TX 75001', // No address field in profile
              phone: content.phone || userProfile?.phone_number || '(510) 754-2001',
              rfpTitle: content.rfpTitle || 'Proposal for Cybersecurity Audit & Penetration Testing Services',
              naicsCode: content.naicsCode || '000000',
              solicitationNumber: content.solicitationNumber || exampleJob.solicitationNumber,
              issuedDate: content.issuedDate || 'December 26th, 2024',
              submittedBy: content.submittedBy || `${userProfile?.first_name || 'Admin'} ${userProfile?.last_name || 'User'}, ${userProfile?.company_name || 'BizRadar'}`,
              theme: content.theme || 'professional',
              sections: Array.isArray(content.sections) ? content.sections : defaultTemplate(exampleJob),
            });
          }

          // Set last saved timestamp
          if (data.updated_at) {
            setLastSaved(new Date(data.updated_at).toLocaleTimeString());
          }

          console.log("Successfully loaded saved RFP data");
        } else {
          console.log("No existing RFP response found, loading templates and converting to HTML");
          // No saved data found, load DOCX templates and convert to HTML for editing
          setRfpTitle(contract?.title || 'Proposal for Cybersecurity Audit & Penetration Testing Services');
          setNaicsCode(contract?.naicsCode || '000000');
          setSolicitationNumber(contract?.solicitation_number || '');
          setIssuedDate(contract?.published_date || new Date().toLocaleDateString());

          setSections(defaultTemplate(exampleJob));
          
          // Set profile data if available
          if (userProfile) {
            setCompanyName(userProfile?.company_name || 'BizRadar Solutions');
            setCompanyWebsite(userProfile?.company_url || 'https://www.bizradar.com');
            setLetterhead('123 Innovation Drive, Suite 100, TechCity, TX 75001'); // No address field in profile
            setPhone(userProfile?.phone_number || '(510) 754-2001');
            setSubmittedBy(`${userProfile?.first_name || 'Admin'} ${userProfile?.last_name || 'User'}, ${userProfile?.company_name || 'BizRadar'}`);
            
            // Also update proposalData
            setProposalData(prev => ({
              ...prev,
              companyName: userProfile?.company_name || 'BizRadar Solutions',
              companyWebsite: userProfile?.company_url || 'https://www.bizradar.com',
              letterhead: '123 Innovation Drive, Suite 100, TechCity, TX 75001', // No address field in profile
              phone: userProfile?.phone_number || '(510) 754-2001',
              submittedBy: `${userProfile?.first_name || 'Admin'} ${userProfile?.last_name || 'User'}, ${userProfile?.company_name || 'BizRadar'}`
            }));
          }
          await resetSectionsWithDocxHtml();
        }
      } catch (err) {
        console.error("Error in RFP data loading:", err);
        toast?.error("An unexpected error occurred while loading RFP data.");
      }
    };

    loadRfpData();
  }, [pursuitId]);

  // Auto-save feature
  useEffect(() => {
    if (!autoSaveEnabled || !pursuitId) return;

    const autoSaveTimer = setTimeout(() => {
      saveRfpData(false); // Don't show notification for auto-save
    }, 300000); // Auto-save every 5 minutes

    return () => clearTimeout(autoSaveTimer);
  }, [
    logo, companyName, companyWebsite, letterhead, phone,
    rfpTitle, rfpNumber, issuedDate, submittedBy, theme, sections,
    autoSaveEnabled, pursuitId
  ]);

  // Function to fetch user profile data
  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, cannot fetch profile');
        return null;
      }

      // Fetch user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }

      console.log('Fetched user profile:', profile);
      return profile;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  // Helper function to check if a tracker exists
  const trackerExists = async (trackerId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('trackers')
        .select('id')
        .eq('id', trackerId)
        .single();
      
      return !error && !!data;
    } catch (error) {
      console.error('Error checking tracker existence:', error);
      return false;
    }
  };

  // Helper function to ensure a tracker exists for this opportunity
  const ensureTrackerExists = async (contractData: any): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Try to find existing tracker by opportunity_id or title
      const { data: existingByOpp } = await supabase
        .from('trackers')
        .select('id')
        .eq('user_id', user.id)
        .eq('opportunity_id', contractData.noticeId || contractData.id)
        .maybeSingle();

      if (existingByOpp?.id) {
        return existingByOpp.id;
      }

      // Try by title as fallback
      const { data: existingByTitle } = await supabase
        .from('trackers')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', contractData.title)
        .maybeSingle();

      if (existingByTitle?.id) {
        return existingByTitle.id;
      }

      // Create new tracker if none exists
      const newId = (typeof window !== 'undefined' && (window as any).crypto && 'randomUUID' in (window as any).crypto)
        ? (window as any).crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

      const { data: created, error: createError } = await supabase
        .from('trackers')
        .insert([{
          id: newId,
          title: contractData.title,
          description: contractData.description || '',
          stage: 'Assessment',
          user_id: user.id,
          due_date: contractData.dueDate || contractData.response_date,
          opportunity_id: contractData.noticeId || contractData.id
        }])
        .select();

      if (createError || !created?.length) {
        throw new Error('Failed to create tracker');
      }

      return created[0].id;
    } catch (error) {
      console.error('Error ensuring tracker exists:', error);
      throw error;
    }
  };

  // Function to save RFP data to the database
  const saveRfpData = async (showNotification = true) => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Ensure tracker exists before saving RFP response
      let currentPursuitId = pursuitId;
      if (!currentPursuitId || !(await trackerExists(currentPursuitId))) {
        console.log('Creating or finding tracker for opportunity...');
        currentPursuitId = await ensureTrackerExists(contract);
        console.log('Tracker ID set to:', currentPursuitId);
      }
      
      // Fetch user profile data
      const userProfile = await fetchUserProfile();
      
      console.log('Current state values:', {
        companyName,
        companyWebsite,
        letterhead,
        phone,
        submittedBy
      });
      
      console.log('User profile data:', userProfile);
      
      // Calculate completion percentage
      const completedSections = sections.filter(section => section.completed).length;
      const totalSections = sections.length;
      const completionPercentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

      // Determine stage based on completion
      let stageToSet;
      if (completedSections === totalSections && totalSections > 0) {
        stageToSet = "RFP Response Completed";
      } else if (completedSections > 0) {
        stageToSet = "RFP Response Initiated";
      } else {
        stageToSet = "Assessment";
      }

      // Prepare the content object to save with profile data
      const contentToSave = {
        logo: logo || userProfile?.avatar_url || null,
        companyName: companyName || userProfile?.company_name || 'BizRadar Solutions',
        companyWebsite: companyWebsite || userProfile?.company_url || 'https://www.bizradar.com',
        letterhead: letterhead || '123 Innovation Drive, Suite 100, TechCity, TX 75001', // No address field in profile
        phone: phone || userProfile?.phone_number || '(510) 754-2001',
        rfpTitle,
        naicsCode,
        solicitationNumber,
        issuedDate,
        submittedBy: submittedBy || `${userProfile?.first_name || 'Admin'} ${userProfile?.last_name || 'User'}, ${userProfile?.company_name || 'BizRadar'}`,
        theme,
        sections,
        isSubmitted
      };
      
      console.log('Content to save:', contentToSave);

      // Update stage in trackers table
      const { error: trackerError } = await supabase
        .from('trackers')
        .update({ stage: stageToSet })
        .eq('id', currentPursuitId);

      if (trackerError) {
        throw trackerError;
      }

      // Save to rfp_responses table
      const { error: rfpError } = await supabase
        .from('rfp_responses')
        .upsert({
          pursuit_id: currentPursuitId,
          user_id: user?.id,
          content: contentToSave,
          is_submitted: isSubmitted,
          completion_percentage: completionPercentage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'pursuit_id'
        });

      if (rfpError) {
        throw rfpError;
      }

      // Update last saved timestamp
      setLastSaved(new Date().toLocaleTimeString());

      // Show success notification
      if (showNotification) {
        toast?.success(`Saved with stage: ${stageToSet}`);
      }

    } catch (error) {
      console.error("Error saving RFP data:", error);
      if (showNotification) {
        toast?.error("Failed to save RFP response. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e) => {
    if (!isEditingAllowed()) {
      console.log('Editing not allowed - proposal is submitted');
      return;
    }
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogo(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Update proposalData when logo changes
  useEffect(() => {
    setProposalData((prev) => ({
      ...prev,
      logo: logo, // Update logo in proposalData
    }));
  }, [logo]);

  useEffect(() => {
    setProposalData({
      logo,
      companyName,
      companyWebsite,
      letterhead,
      phone,
      rfpTitle,
      naicsCode,
      solicitationNumber,
      issuedDate,
      submittedBy,
      theme,
      sections, // Ensure sections is included and updated
    });
  }, [
    logo,
    companyName,
    companyWebsite,
    letterhead,
    phone,
    rfpTitle,
    naicsCode,
    solicitationNumber,
    issuedDate,
    submittedBy,
    theme,
    sections, // Add sections to the dependency array
  ]);

  const updateField = (index, field, value) => {
    if (!isEditingAllowed()) {
      console.log('Editing not allowed - proposal is submitted');
      return;
    }
    const copy = [...sections];
    copy[index][field] = value;
    console.log("Updated field:", copy[index][field]);
    setSections(copy);
  };

  const toggleCompleted = (index) => {
    if (!isEditingAllowed()) {
      console.log('Editing not allowed - proposal is submitted');
      return;
    }
    const copy = [...sections];
    copy[index].completed = !copy[index].completed;
    setSections(copy);
  };

  const deleteSection = (id) => {
    if (!isEditingAllowed()) {
      console.log('Editing not allowed - proposal is submitted');
      return;
    }
    const updated = sections.filter((s) => s.id !== id);
    setSections(updated.map((s, i) => ({ ...s, id: i + 1 })));
  };

  const addSectionBelow = (index) => {
    if (!isEditingAllowed()) {
      console.log('Editing not allowed - proposal is submitted');
      return;
    }
    const newSection = {
      id: sections.length + 1,
      title: 'CUSTOM SECTION',
      content: 'Write your custom content here...',
      icon: 'custom',
      completed: false
    };
    const updated = [...sections.slice(0, index + 1), newSection, ...sections.slice(index + 1)];
    setSections(updated.map((s, i) => ({ ...s, id: i + 1 })));
    setExpandedSection(newSection.id);
  };

  const moveSection = (id, direction) => {
    if (!isEditingAllowed()) {
      console.log('Editing not allowed - proposal is submitted');
      return;
    }
    const index = sections.findIndex(s => s.id === id);
    if ((direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const copy = [...sections];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;

    setSections(copy.map((s, i) => ({ ...s, id: i + 1 })));
  };

  // Modify the toggleSection function to allow expansion/collapse regardless of submission status
  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  // Add a separate function for checking if editing is allowed
  const isEditingAllowed = () => {
    console.log('Checking if editing is allowed. isSubmitted:', isSubmitted);
    return !isSubmitted;
  };

  // Add event handlers for input changes that check isSubmitted
  const handleInputChange = (setter) => (e) => {
    if (!isEditingAllowed()) {
      console.log('Editing not allowed - proposal is submitted');
      return;
    }
    setter(e.target.value);
  };

  const getSectionIcon = (icon) => {
    switch (icon) {
      case 'cover': return <Image className="w-5 h-5" />;
      case 'toc': return <FileText className="w-5 h-5" />;
      case 'summary': return <FileText className="w-5 h-5" />;
      case 'company': return <FileText className="w-5 h-5" />;
      case 'qualifications': return <FileText className="w-5 h-5" />;
      case 'technical': return <FileText className="w-5 h-5" />;
      case 'pricing': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getThemeColors = () => {
    switch (theme) {
      case 'professional':
        return {
          primary: 'bg-blue-600',
          primaryHover: 'hover:bg-blue-700',
          secondary: 'bg-blue-500',
          accent: 'bg-blue-500',
          text: 'text-white',
          hover: 'hover:bg-blue-700',
          border: 'border-blue-200',
          activeBorder: 'border-blue-500',
          sectionBg: 'bg-white',
          sectionHeaderBg: 'bg-gray-50',
          sectionHeaderBgActive: 'bg-blue-50',
          completedBg: 'bg-green-50',
          completedText: 'text-green-700',
          completedIcon: 'text-green-600',
          incompleteIcon: 'text-gray-400',
          gradient: 'from-blue-600 to-blue-700'
        };
      case 'modern':
        return {
          primary: 'bg-indigo-600',
          primaryHover: 'hover:bg-indigo-700',
          secondary: 'bg-indigo-500',
          accent: 'bg-purple-500',
          text: 'text-white',
          hover: 'hover:bg-indigo-700',
          border: 'border-indigo-200',
          activeBorder: 'border-indigo-400',
          sectionBg: 'bg-white',
          sectionHeaderBg: 'bg-indigo-50',
          sectionHeaderBgActive: 'bg-indigo-100',
          completedBg: 'bg-green-50',
          completedText: 'text-green-700',
          completedIcon: 'text-green-600',
          incompleteIcon: 'text-indigo-300',
          gradient: 'from-indigo-600 to-indigo-700'
        };
      case 'classic':
        return {
          primary: 'bg-amber-600',
          primaryHover: 'hover:bg-amber-700',
          secondary: 'bg-amber-600',
          accent: 'bg-amber-500',
          text: 'text-white',
          hover: 'hover:bg-amber-700',
          border: 'border-amber-200',
          activeBorder: 'border-amber-500',
          sectionBg: 'bg-amber-50',
          sectionHeaderBg: 'bg-amber-100',
          sectionHeaderBgActive: 'bg-amber-200',
          completedBg: 'bg-green-50',
          completedText: 'text-green-700',
          completedIcon: 'text-green-600',
          incompleteIcon: 'text-amber-400',
          gradient: 'from-amber-600 to-amber-700'
        };
      default:
        return {
          primary: 'bg-blue-600',
          primaryHover: 'hover:bg-blue-700',
          secondary: 'bg-blue-500',
          accent: 'bg-blue-500',
          text: 'text-white',
          hover: 'hover:bg-blue-700',
          border: 'border-blue-200',
          activeBorder: 'border-blue-500',
          sectionBg: 'bg-white',
          sectionHeaderBg: 'bg-gray-50',
          sectionHeaderBgActive: 'bg-blue-50',
          completedBg: 'bg-green-50',
          completedText: 'text-green-700',
          completedIcon: 'text-green-600',
          incompleteIcon: 'text-gray-400',
          gradient: 'from-blue-600 to-blue-700'
        };
    }
  };

  const colors = getThemeColors();

  const downloadPDF = async () => {
    try {
      const contentElement = contentRef.current;
      if (!contentElement) throw new Error('Content element not found');

      // Store original styles
      const originalStyles = {
        position: contentElement.style.position,
        left: contentElement.style.left,
        top: contentElement.style.top,
        zIndex: contentElement.style.zIndex,
        width: contentElement.style.width,
        minHeight: contentElement.style.minHeight,
        backgroundColor: contentElement.style.backgroundColor,
        color: contentElement.style.color,
      };

      // Temporarily adjust contentElement to ensure rendering
      contentElement.style.position = 'fixed';
      contentElement.style.left = '-9999px';
      contentElement.style.top = '0';
      contentElement.style.width = '8.5in';
      contentElement.style.minHeight = '11in';
      contentElement.style.backgroundColor = '#ffffff';
      contentElement.style.color = '#000000';
      contentElement.style.zIndex = '-1000';

      // Force a repaint to ensure content is rendered
      window.getComputedStyle(contentElement).height;

      // Create a PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter',
      });

      const pageWidth = 8.5;
      const pageHeight = 11;
      const scale = 1.5;
      const maxPageHeightPx = pageHeight * 96 * scale;

      // Get all section elements
      const sectionElements = Array.from(contentElement.querySelectorAll('div.section')) as HTMLElement[];
      if (sectionElements.length === 0) {
        throw new Error('No sections found in content');
      }

      let currentHeight = 0;
      let currentPageElements: HTMLElement[] = [];
      let pageIndex = 0;

      // Create a temporary container for rendering each page
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '0';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '8.5in';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.color = '#000000';
      tempContainer.style.zIndex = '-1000';
      document.body.appendChild(tempContainer);

      for (let i = 0; i < sectionElements.length; i++) {
        const section = sectionElements[i];
        const clonedSection = section.cloneNode(true) as HTMLElement;
        clonedSection.style.display = 'block';

        // Append to measure height
        tempContainer.appendChild(clonedSection);

        // Force a repaint
        const computedStyle = window.getComputedStyle(clonedSection);
        console.log(`Section ${i + 1} computed styles:`, {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          height: computedStyle.height,
        });

        const sectionHeightPx = clonedSection.offsetHeight * scale;
        if (sectionHeightPx === 0) {
          console.warn(`Section ${i + 1} has zero height, skipping.`);
          tempContainer.removeChild(clonedSection);
          continue;
        }

        console.log(`Section ${i + 1} height (px, scaled): ${sectionHeightPx}`);
        console.log(`Section ${i + 1} content:`, clonedSection.outerHTML);

        tempContainer.removeChild(clonedSection);

        if (currentHeight + sectionHeightPx > maxPageHeightPx && currentPageElements.length > 0) {
          tempContainer.innerHTML = '';
          currentPageElements.forEach(element => {
            tempContainer.appendChild(element);
          });

          // Force a repaint
          const firstElement = tempContainer.firstChild as HTMLElement;
          if (firstElement) {
            window.getComputedStyle(firstElement).height;
          }

          // Minimal delay to ensure rendering
          await new Promise((resolve) => setTimeout(resolve, 100));

          const canvas = await html2canvas(tempContainer, {
            scale: scale,
            useCORS: true,
            logging: true,
            windowWidth: 816,
            windowHeight: 1056,
            backgroundColor: '#ffffff',
            foreignObjectRendering: false,
          });

          console.log('Canvas dimensions for page', pageIndex + 1, ':', { width: canvas.width, height: canvas.height });

          const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
          console.log('Data URL length for page', pageIndex + 1, ':', dataUrl.length);

          let imgHeight = (canvas.height * pageWidth) / canvas.width;
          imgHeight = Math.min(imgHeight, pageHeight);

          console.log('Calculated imgHeight for page', pageIndex + 1, ':', imgHeight);

          if (!canvas.width || !canvas.height || !isFinite(imgHeight) || imgHeight <= 0) {
            console.error('Invalid canvas dimensions or imgHeight for page', pageIndex + 1, ':', {
              width: canvas.width,
              height: canvas.height,
              imgHeight,
            });
            tempContainer.innerHTML = '';
            currentPageElements = [];
            currentHeight = 0;
            pageIndex++;
            continue;
          }

          if (pageIndex > 0) {
            pdf.addPage();
          }
          pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, imgHeight, undefined, 'FAST');

          tempContainer.innerHTML = '';
          currentPageElements = [];
          currentHeight = 0;
          pageIndex++;
        }

        currentPageElements.push(clonedSection);
        currentHeight += sectionHeightPx;
      }

      if (currentPageElements.length > 0) {
        tempContainer.innerHTML = '';
        currentPageElements.forEach(element => {
          tempContainer.appendChild(element);
        });

        // Force a repaint
        const firstElement = tempContainer.firstChild as HTMLElement;
        if (firstElement) {
          window.getComputedStyle(firstElement).height;
        }

        // Minimal delay to ensure rendering
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log('Last page elements:', currentPageElements.map(el => el.outerHTML));
        console.log('Rendering last page with elements:', tempContainer.innerHTML);

        const canvas = await html2canvas(tempContainer, {
          scale: scale,
          useCORS: true,
          logging: true,
          windowWidth: 816,
          windowHeight: 1056,
          backgroundColor: '#ffffff',
          foreignObjectRendering: false,
        });

        console.log('Last page canvas dimensions:', { width: canvas.width, height: canvas.height });

        const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
        console.log('Last page data URL length:', dataUrl.length);

        let imgHeight = (canvas.height * pageWidth) / canvas.width;
        imgHeight = Math.min(imgHeight, pageHeight);

        console.log('Last page imgHeight:', imgHeight);

        if (!canvas.width || !canvas.height || !isFinite(imgHeight) || imgHeight <= 0) {
          console.error('Invalid canvas dimensions or imgHeight for last page:', {
            width: canvas.width,
            height: canvas.height,
            imgHeight,
          });
        } else {
          if (pageIndex > 0) {
            pdf.addPage();
          }
          pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, imgHeight, undefined, 'FAST');
        }
      }

      document.body.removeChild(tempContainer);
      Object.assign(contentElement.style, originalStyles);

      pdf.save(`${proposalData.rfpTitle || 'Proposal'}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
    setShowDownloadOptions(false);
  };

  const downloadWord = async () => {
    let contentElement: HTMLDivElement | null = null;
    let originalStyles: { [key: string]: string } | null = null;

    try {
      contentElement = contentRef.current;
      if (!contentElement) throw new Error('Content element not found');

      originalStyles = {
        position: contentElement.style.position,
        left: contentElement.style.left,
        display: contentElement.style.display,
      };
      contentElement.style.position = 'fixed';
      contentElement.style.left = '0';
      contentElement.style.display = 'block';

      await new Promise((resolve) => setTimeout(resolve, 100));
      window.getComputedStyle(contentElement).height;

      const sectionElements = Array.from(contentElement.querySelectorAll('div.section')) as HTMLElement[];
      if (sectionElements.length === 0) {
        throw new Error('No sections found in content');
      }
      console.log('Section elements:', sectionElements.map(s => s.outerHTML));

      const alignmentMap: { [key: string]: typeof AlignmentType[keyof typeof AlignmentType] } = {
        center: AlignmentType.CENTER,
        left: AlignmentType.LEFT,
        right: AlignmentType.RIGHT,
        justify: AlignmentType.JUSTIFIED,
      };

      const underlineMap: { [key: string]: string } = {
        underline: 'single',
        none: 'none',
      };

      const paragraphs = sectionElements.flatMap((section, sectionIndex) => {
        // Include div.whitespace-pre-line in the selector
        const textElements = Array.from(section.querySelectorAll('h1, h2, h3, p, div.whitespace-pre-line')) as HTMLElement[];
        if (textElements.length === 0) return [];

        const sectionParagraphs: Paragraph[] = [];
        textElements.forEach((element) => {
          const computedStyle = window.getComputedStyle(element);
          const textAlign = computedStyle.textAlign || 'left';
          const fontWeight = computedStyle.fontWeight;
          const fontSize = parseFloat(computedStyle.fontSize) * 2;

          let color: string | undefined;
          const rawColor = computedStyle.color;
          const hexMatch = rawColor.match(/#([0-9a-f]{3,6})/i);
          if (hexMatch) {
            let hex = hexMatch[1];
            if (hex.length === 3) {
              hex = hex.split('').map(char => char + char).join('');
            }
            color = hex.toUpperCase();
          } else if (rawColor.startsWith('rgb')) {
            const hex = rgbToHex(rawColor);
            color = hex || undefined;
          }

          const textDecoration = computedStyle.textDecorationLine || 'none';
          const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
          const spacingAfter = marginBottom * 20;

          let defaultFontSize = 20;
          let defaultBold = false;
          if (element.tagName === 'H1') {
            defaultFontSize = 24;
            defaultBold = true;
          } else if (element.tagName === 'H2') {
            defaultFontSize = 22;
            defaultBold = true;
          } else if (element.tagName === 'H3') {
            defaultFontSize = 20;
            defaultBold = true;
          }

          // If the element is div.whitespace-pre-line, split its content on newlines
          if (element.classList.contains('whitespace-pre-line')) {
            const lines = (element.textContent || '').split('\n').map(line => line.trim()).filter(line => line);
            lines.forEach((line) => {
              sectionParagraphs.push(
                new Paragraph({
                  alignment: alignmentMap[textAlign] || AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: line,
                      bold: fontWeight === 'bold' || parseInt(fontWeight) >= 700 || defaultBold,
                      size: isNaN(fontSize) ? defaultFontSize : fontSize,
                      font: 'Arial',
                      color: color && /^[0-9a-f]{6}$/i.test(color) ? color : undefined,
                      underline: underlineMap[textDecoration] ? { type: underlineMap[textDecoration] as any } : undefined,
                    }),
                  ],
                  spacing: { after: spacingAfter },
                })
              );
            });
          } else {
            // Handle h1, h2, h3, p as before
            sectionParagraphs.push(
              new Paragraph({
                alignment: alignmentMap[textAlign] || AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: element.textContent || '',
                    bold: fontWeight === 'bold' || parseInt(fontWeight) >= 700 || defaultBold,
                    size: isNaN(fontSize) ? defaultFontSize : fontSize,
                    font: 'Arial',
                    color: color && /^[0-9a-f]{6}$/i.test(color) ? color : undefined,
                    underline: underlineMap[textDecoration] ? { type: underlineMap[textDecoration] as any } : undefined,
                  }),
                ],
                spacing: { after: spacingAfter },
              })
            );
          }
        });

        return sectionParagraphs;
      });

      Object.assign(contentElement.style, originalStyles);

      const doc = new Document({
        sections: [
          {
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${proposalData.rfpTitle || 'Proposal'}.docx`);
    } catch (error) {
      console.error('Word generation failed:', error);
      if (contentElement && originalStyles) {
        Object.assign(contentElement.style, originalStyles);
      }
      alert('Failed to generate Word document. Please try again.');
    }
    setShowDownloadOptions(false);
  };

  // Utility function to convert RGB to 6-digit hex
  const rgbToHex = (rgb: string): string | null => {
    const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
    if (!rgbMatch) return null;

    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);

    // Convert to hex and ensure 2 digits per channel
    const toHex = (value: number) => {
      const hex = value.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const enhanceWithAI = async (sectionsToEnhance: any[]) => {
    try {
      // Show loading state
      toast?.info("Enhancing RFP with AI...");

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Determine profile_id from authenticated user
      const profile_id = user.id;

      // Resolve ai_enhanced_opportunities.id from prop or fallback lookup
      let ai_opportunity_id: number | null = aiOpportunityId || null;
      if (!ai_opportunity_id) {
        try {
          const { data: aiOpp, error: aiOppError } = await supabase
            .from('ai_enhanced_opportunities')
            .select('id')
            .eq('title', contract?.title || rfpTitle)
            .limit(1)
            .maybeSingle();
          if (!aiOppError && aiOpp && aiOpp.id) {
            ai_opportunity_id = aiOpp.id;
          }
        } catch (e) {
          // Ignore and proceed without id
        }
      }

      console.log("Posting IDs for contexts:", { profile_id, ai_opportunity_id });

      // Call the backend API
      const response = await fetch(`${API_ENDPOINTS.ENHANCE_RFP_WITH_AI}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_id,
          ai_opportunity_id,
          pursuitId,
          userId: user?.id
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.enhanced_data) {
        // Process the enhanced data and update the sections
        const enhancedData = result.enhanced_data;
        // const pdf_download_url = result.pdf_download_url;
        // const docx_download_url = result.docx_download_url;

        // For each section to enhance, treat the current HTML as a template, render with enhancedData, and set it back
        const enhancedSections = sectionsToEnhance.map((section) => {
          const template = section.content;
          const rendered = renderTemplate(template, enhancedData);
          return { ...section, content: rendered };
        });

        // Update only the relevant sections in the main sections state
        setSections((prevSections) =>
          prevSections.map((section) => {
            const match = enhancedSections.find((s) => s.id === section.id);
            return match ? match : section;
          })
        );

        toast?.success("RFP enhanced successfully with AI!");

        // Auto-save the enhanced content
        setTimeout(() => {
          saveRfpData(true);
        }, 1000);

        // Set PDF URL but do not show the PDF modal
        // if (pdf_download_url) {
        //   setPdfUrl(pdf_download_url);
        // }

      } else {
        throw new Error(result.message || 'Failed to enhance RFP');
      }

    } catch (error) {
      console.error('Error enhancing RFP with AI:', error);
      toast?.error(`Failed to enhance RFP: ${error.message}`);
    }
  };

  // Show preview screen
  const handlePreview = () => {
    // Merge all section contents with a horizontal rule or page break
    const merged = sections.map(s => s.content).join('<hr style="page-break-after:always; margin:32px 0;"/>');
    
    // Use the preview editor ref to set content with image handling
    if (previewEditorRef.current) {
      setDocxHtmlInEditor(merged, previewEditorRef);
    } else {
      setMergedPreviewContent(merged);
    }
    setShowMergedPreview(true);
  };

  // Calculate completion percentage
  const completionPercentage = Math.round(
    (sections.filter(section => section.completed).length / sections.length) * 100
  );

  // Function to close the RFP builder
  const closeRfpBuilder = (): void => {
    // Check if there's a current RFP pursuit ID
    if (pursuitId) {
      const savedData = localStorage.getItem(`rfp_response_${pursuitId}`);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (parsedData.stage) {
            // Update the pursuit stage in the local state
            setSections(prevSections =>
              prevSections.map(section =>
                section.id === pursuitId
                  ? { ...section, stage: parsedData.stage }
                  : section
              )
            );
          }
        } catch (e) {
          console.error("Error parsing saved RFP data when closing:", e);
        }
      }
    }

    // Close the RFP builder and reset the current pursuit ID
    setShowPreview(false);
    setExpandedSection(null);
  };

  // Calculate due date proximity for display
  const getDueDateProximity = () => {
    if (!contract?.dueDate || contract.dueDate === "Not specified") return null;

    try {
      const dueDateObj = new Date(contract.dueDate);
      const today = new Date();
      const diffTime = dueDateObj.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { label: "Past Due", color: "text-red-600 bg-red-50 border-red-200" };
      if (diffDays === 0) return { label: "Due Today", color: "text-red-600 bg-red-50 border-red-200" };
      if (diffDays <= 7) return { label: `Due in ${diffDays} days`, color: "text-amber-600 bg-amber-50 border-amber-200" };
      if (diffDays <= 30) return { label: `Due in ${diffDays} days`, color: "text-blue-600 bg-blue-50 border-blue-200" };

      return { label: `Due in ${diffDays} days`, color: "text-green-600 bg-green-50 border-green-200" };
    } catch (e) {
      return null;
    }
  };

  const dueDateInfo = getDueDateProximity();

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Handler to download the preview as PDF
  const handleDownloadPreviewPDF = async () => {
    // Find the editor content DOM node
    const editorElement = document.querySelector('.ProseMirror');
    if (!editorElement) return;

    // Create a temporary container for PDF rendering
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.background = 'white';
    tempContainer.style.padding = '32px';
    tempContainer.style.width = '794px'; // A4 width in px at 96 DPI
    tempContainer.style.fontFamily = 'Times New Roman, serif';
    tempContainer.style.fontSize = '16px';
    tempContainer.style.lineHeight = '1.6';
    tempContainer.style.color = '#000000';
    tempContainer.innerHTML = editorElement.innerHTML;
    tempContainer.className = 'temp-pdf-container';
    document.body.appendChild(tempContainer);

    const style = document.createElement('style');
    style.textContent = `
      .temp-pdf-container h1 { font-size: 32px; font-weight: bold; margin: 24px 0 16px 0; color: #1f2937; page-break-after: avoid; }
      .temp-pdf-container h2 { font-size: 24px; font-weight: bold; margin: 20px 0 12px 0; color: #374151; page-break-after: avoid; }
      .temp-pdf-container h3 { font-size: 20px; font-weight: bold; margin: 16px 0 8px 0; color: #4b5563; page-break-after: avoid; }
      .temp-pdf-container p { margin: 12px 0; page-break-inside: avoid; }
      .temp-pdf-container ul, .temp-pdf-container ol { margin: 12px 0; padding-left: 24px; page-break-inside: avoid; }
      .temp-pdf-container li { margin: 4px 0; }
      .temp-pdf-container strong { font-weight: bold; }
      .temp-pdf-container em { font-style: italic; }
      .temp-pdf-container u { text-decoration: underline; }
      .temp-pdf-container table { border-collapse: collapse; margin: 16px 0; width: 100%; page-break-inside: avoid; }
      .temp-pdf-container table td, .temp-pdf-container table th { border: 2px solid #e5e7eb; padding: 8px 12px; }
      .temp-pdf-container table th { background-color: #f9fafb; font-weight: bold; }
      .temp-pdf-container img { max-width: 100%; height: auto; margin: 16px 0; page-break-inside: avoid; }
    `;
    document.head.appendChild(style);

    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      height: tempContainer.scrollHeight,
    });

    document.body.removeChild(tempContainer);
    document.head.removeChild(style);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let y = margin;
    let remainingHeight = imgHeight;
    let sourceY = 0;

    while (remainingHeight > 0) {
      const availableHeight = pageHeight - (margin * 2);
      const sliceHeight = Math.min(remainingHeight, availableHeight);
      const sourceHeight = (sliceHeight * canvas.width) / imgWidth;
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sourceHeight;
      const sliceCtx = sliceCanvas.getContext('2d');
      if (sliceCtx) {
        sliceCtx.drawImage(
          canvas,
          0, sourceY,
          canvas.width, sourceHeight,
          0, 0,
          canvas.width, sourceHeight
        );
        const sliceImgData = sliceCanvas.toDataURL('image/png');
        pdf.addImage(sliceImgData, 'PNG', margin, y, imgWidth, sliceHeight);
      }
      remainingHeight -= sliceHeight;
      sourceY += sourceHeight;
      if (remainingHeight > 0) {
        pdf.addPage();
        y = margin;
      }
    }
    pdf.save('proposal-preview.pdf');
  };

  // Add a ref to store DocumentEditor refs for each section
  const editorRefs = useRef([]);

  // Utility to set docx HTML in DocumentEditor with image compatibility
  function setDocxHtmlInEditor(html, editorRef) {
    console.log('html after fn call', html);
    if (!editorRef?.current) return;
    const { editor, insertImageHtmlString } = editorRef.current;
    if (!editor) return;

    // Parse HTML and extract images
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = Array.from(doc.querySelectorAll('img'));
    images.forEach(img => img.parentNode?.removeChild(img));
    const htmlWithoutImages = doc.body.innerHTML;

    // Set HTML without images
    editor.commands.setContent(htmlWithoutImages);
    console.log('htmlWithoutImages', htmlWithoutImages);
    // Insert images at the end
    images.forEach(img => {
      insertImageHtmlString(img.outerHTML);
    });
    console.log('images', images);
  }

  useEffect(() => {
    console.log("Sections being enhanced");
    sections.forEach((section, idx) => {
      console.log("Section:", section);
      if (typeof section.content === 'string' && /<img/i.test(section.content)) {
        const editorRef = editorRefs.current[idx];
        console.log("Editor ref:", editorRef);
        if (editorRef && editorRef.current) {
          setDocxHtmlInEditor(section.content, editorRef);
          console.log("Set docx HTML in editor for section:", section.id);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, expandedSection]);

  return (
    <div className="w-full min-h-full bg-gray-50">
      <div className="w-full">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {/* Hidden ProposalContent for External Downloads */}
          <div style={{ position: 'absolute', left: '-9999px' }} ref={contentRef}>
            <RfpPreviewContent {...proposalData} />
          </div>
          {/* Preview Modal */}
          {showPreview && (
            <RfpPreview
              {...proposalData}
              closeRfpBuilder={() => setShowPreview(false)}
            />
          )}

          {/* Page Header with Contract Info */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
            <div className="flex justify-between items-start flex-wrap md:flex-nowrap gap-4">
              {/* Contract Title and Details */}
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">{contract?.title || 'Create RFP Response'}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mt-2">
                  {contract?.department && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>{contract.department}</span>
                    </div>
                  )}

                  {dueDateInfo && (
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${dueDateInfo.color}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-medium">{dueDateInfo.label}</span>
                    </div>
                  )}

                  {contract?.naicsCode && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">#</span>
                      <span>NAICS: {contract.naicsCode}</span>
                    </div>
                  )}

                  {contract?.solicitation_number && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">#</span>
                      <span>Solicitation: {contract.solicitation_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Completion Status */}
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-sm font-medium">
                    <span className="text-gray-600">Completion:</span>
                    <span className={`ml-1 ${completionPercentage === 100 ? 'text-green-600' : completionPercentage > 50 ? 'text-blue-600' : 'text-amber-600'}`}>
                      {completionPercentage}%
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-white shadow-sm"
                    style={{
                      background: `conic-gradient(#10B981 ${completionPercentage}%, #F3F4F6 0)`
                    }}>
                    <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-700">{completionPercentage}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {sections.filter(s => s.completed).length} of {sections.length} sections completed
                </div>
              </div>
            </div>
          </div>

          {/* Top Header with Action Buttons */}
          <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-gray-200">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-blue-600 text-white shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <h1 className="text-lg md:text-xl font-bold text-gray-800">RFP Response Builder</h1>
              </div>
              <div className="flex gap-3 items-center flex-wrap">
                {/* Save button and indicator */}
                <button
                  onClick={() => saveRfpData(true)}
                  disabled={isSaving || isSubmitted}
                  className={`inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm ${(isSaving || isSubmitted) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 hover:border-gray-400'} transition-all`}
                >
                  <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save'}
                </button>

                {lastSaved && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last saved: {lastSaved}
                  </div>
                )}
                <div className="flex gap-3 flex-wrap">
                  {/* <div className="relative">
                    <button
                      onClick={() => {
                        const themes = ['professional', 'modern', 'classic'];
                        const currentIndex = themes.indexOf(theme);
                        const nextIndex = (currentIndex + 1) % themes.length;
                        setTheme(themes[nextIndex]);
                      }}
                      disabled={isSubmitted}
                      className={`inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm ${isSubmitted ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 hover:border-gray-400'} transition-all`}
                    >
                      <Settings className="w-4 h-4" /> Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </button>
                  </div> */}
                  <button
                    onClick={handlePreview}
                    className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                  <button
                    onClick={() => enhanceWithAI(sections)}//Top action enhancewithai
                    disabled={isSubmitted}
                    className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all hover:from-blue-700 hover:to-blue-800 ${isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Sparkles className="w-4 h-4" /> Enhance with AI
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Company Info */}
            <div className="md:col-span-1">
              <div className={`bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200 transition-all hover:shadow-md ${isSubmitted ? 'opacity-75' : ''}`}>
                <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                    <Image className="w-4 h-4" />
                  </div>
                  Company Information
                  {isSubmitted && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      Submitted
                    </span>
                  )}
                </h2>

                <div className="space-y-4">
                  {logo ? (
                    <div className="flex flex-col items-center text-center mb-4">
                      <img src={logo} alt="Company Logo" className="max-h-20 object-contain mb-3 p-2 border border-gray-100 rounded-lg bg-white shadow-sm" />
                      {!isSubmitted && (
                        <button
                          onClick={() => setLogo(null)}
                          className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 mt-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <X className="w-3 h-3" /> Remove Logo
                        </button>
                      )}
                    </div>
                  ) : (
                    !isSubmitted && (
                      <div className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex items-center justify-center bg-gray-50 mb-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                        <label className="flex flex-col items-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-blue-600 transition-colors">
                          <Image className="w-10 h-10 text-gray-400" />
                          <span className="font-medium">Upload Company Logo</span>
                          <span className="text-xs text-gray-400">Recommended: 300x100px</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      </div>
                    )
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={handleInputChange(setCompanyName)}
                      placeholder="Company Name"
                      disabled={isSubmitted}
                      className={`w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm ${isSubmitted ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Website</label>
                    <input
                      type="text"
                      value={companyWebsite}
                      onChange={handleInputChange(setCompanyWebsite)}
                      placeholder="https://www.example.com"
                      disabled={isSubmitted}
                      className={`w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm ${isSubmitted ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Address</label>
                    <input
                      type="text"
                      value={letterhead}
                      onChange={handleInputChange(setLetterhead)}
                      placeholder="Company Address"
                      disabled={isSubmitted}
                      className={`w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm ${isSubmitted ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={handleInputChange(setPhone)}
                      placeholder="Phone Number"
                      disabled={isSubmitted}
                      className={`w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm ${isSubmitted ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
              </div>

              <div className={`bg-white rounded-xl shadow-sm p-6 border border-gray-200 transition-all hover:shadow-md ${isSubmitted ? 'opacity-75' : ''}`}>
                <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  Proposal Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">RFP Title</label>
                    <input
                      type="text"
                      value={rfpTitle}
                      onChange={handleInputChange(setRfpTitle)}
                      placeholder="Proposal Title"
                      disabled={isSubmitted}
                      className={`w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm ${isSubmitted ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">NAICS Code</label>
                    <input
                      type="text"
                      value={naicsCode}
                      onChange={handleInputChange(setNaicsCode)}
                      placeholder="NAICS Code"
                      disabled={isSubmitted}
                      className={`w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm ${isSubmitted ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Solicitation Number</label>
                    <input
                      type="text"
                      value={solicitationNumber}
                      onChange={handleInputChange(setSolicitationNumber)}
                      placeholder="Solicitation Number"
                      disabled={isSubmitted}
                      className={`w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm ${isSubmitted ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Issue Date</label>
                    <input
                      type="text"
                      value={issuedDate}
                      onChange={handleInputChange(setIssuedDate)}
                      placeholder="Issue Date"
                      disabled={isSubmitted}
                      className={`w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm ${isSubmitted ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Submitted By</label>
                    <input
                      type="text"
                      value={submittedBy}
                      onChange={handleInputChange(setSubmittedBy)}
                      placeholder="Your Name and Title"
                      disabled={isSubmitted}
                      className={`w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm ${isSubmitted ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sections */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-green-100 text-green-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  Proposal Sections
                </h2>
                <div className="flex gap-2">
                  {!isSubmitted && (
                    <button
                      onClick={() => addSectionBelow(sections.length - 1)}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow transition-all hover:from-blue-700 hover:to-blue-800"
                    >
                      <Plus className="w-4 h-4" /> Add Section
                    </button>
                  )}
                  {/* Reset Button */}
                  <button
                    onClick={async () => {
                      if (isSubmitted) return;
                      if (window.confirm('Are you sure you want to reset all Proposal Sections to the default template? This will erase all current section content.')) {
                        await resetSectionsWithDocxHtml();
                      }
                    }}
                    disabled={isSubmitted}
                    className={`inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all ${isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Trash2 className="w-4 h-4" /> Reset Sections
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    className={`rounded-xl shadow-sm border transition-all duration-300 
                      ${section.completed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'} 
                      ${expandedSection === section.id ? 'shadow-md border-blue-200' : 'hover:border-blue-200 hover:shadow-sm'}`}
                  >
                    <div
                      className={`flex justify-between items-center p-4 cursor-pointer rounded-t-xl
                        ${expandedSection === section.id ? 'bg-blue-50' : section.completed ? 'bg-green-50' : 'bg-white'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection(section.id);
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSubmitted) {
                              toggleCompleted(index);
                            }
                          }}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          {section.completed ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-300 hover:text-blue-400" />
                          )}
                        </button>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${section.completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          {getSectionIcon(section.icon)}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateField(index, 'title', e.target.value)}
                            disabled={isSubmitted}
                            className={`text-base font-semibold w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none py-1 ${section.completed ? 'text-green-700' : 'text-gray-700'} ${isSubmitted ? 'cursor-not-allowed' : ''}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isSubmitted) {
                                moveSection(section.id, 'up');
                              }
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-blue-600 ${index === 0 || isSubmitted ? 'opacity-30 cursor-not-allowed' : ''}`}
                            disabled={index === 0 || isSubmitted}
                            title="Move Up"
                          >
                            <ChevronUp className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isSubmitted) {
                                moveSection(section.id, 'down');
                              }
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-blue-600 ${index === sections.length - 1 || isSubmitted ? 'opacity-30 cursor-not-allowed' : ''}`}
                            disabled={index === sections.length - 1 || isSubmitted}
                            title="Move Down"
                          >
                            <ChevronDown className="w-5 h-5" />
                          </button>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSubmitted) {
                              deleteSection(section.id);
                            }
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors ${isSubmitted ? 'opacity-30 cursor-not-allowed' : ''}`}
                          disabled={isSubmitted}
                          title="Delete Section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSection(section.id);
                          }}
                        >
                          {expandedSection === section.id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {expandedSection === section.id && (
                      <div className="p-5 border-t border-gray-200 bg-white">
                        <DocumentEditor
                          ref={el => editorRefs.current[index] = el}
                          value={section.content}
                          onChange={(value) => updateField(index, 'content', value)}
                          disabled={isSubmitted}
                          placeholder="Enter section content here..."
                          className="min-h-[400px]"
                        />
                        <div className="flex justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleCompleted(index)}
                              disabled={isSubmitted}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                                ${section.completed ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                                ${isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {section.completed ? (
                                <>
                                  <CheckCircle className="w-4 h-4" /> Completed
                                </>
                              ) : (
                                <>
                                  <Circle className="w-4 h-4" /> Mark as Complete
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => enhanceWithAI([section])}// Sectional enhance with AI
                              disabled={isSubmitted}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors
                                ${isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <Sparkles className="w-4 h-4" /> Enhance with AI
                            </button>
                          </div>
                          <button
                            onClick={() => addSectionBelow(index)}
                            disabled={isSubmitted}
                            className={`inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-full hover:bg-blue-50
                              ${isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Plus className="w-4 h-4" /> Insert Section Below
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Buttons at bottom */}
              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={handlePreview}
                  className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  <Eye className="w-5 h-5" /> Preview Proposal
                </button>
                {/* <button
                  onClick={() => setShowDownloadOptions(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  <Download className="w-5 h-5" /> Download Proposal
                </button> */}
                {showDownloadOptions && (
                  <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center" onClick={() => setShowDownloadOptions(false)}>
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Download Options</h3>
                        <button
                          onClick={() => setShowDownloadOptions(false)}
                          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <button
                          onClick={downloadPDF}
                          className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors group"
                        >
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                            <FileText className="w-6 h-6 text-red-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-gray-800 group-hover:text-red-700 transition-colors">PDF Document</div>
                            <div className="text-sm text-gray-500">Best for printing and sharing</div>
                          </div>
                        </button>

                        <button
                          onClick={downloadWord}
                          className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                        >
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">Word Document</div>
                            <div className="text-sm text-gray-500">Best for editing and customization</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Merged DocumentEditor Preview Modal */}
          {showMergedPreview && (
            <div
              className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center"
              onClick={() => setShowMergedPreview(false)}
            >
              <div
                className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] relative flex flex-col"
                style={{ width: '95vw' }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowMergedPreview(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  aria-label="Close preview"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-bold mb-4">Proposal Preview</h2>
                <div className="w-full mb-4 flex-1 overflow-y-auto">
                  <DocumentEditor 
                    ref={previewEditorRef}
                    value={mergedPreviewContent} 
                    onChange={setMergedPreviewContent} 
                    disabled={false} 
                    className="preview-editor" 
                    data-component-content="preview"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RfpResponse;
















