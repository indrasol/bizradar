import React, { useState, useRef, useEffect } from 'react';
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

const RfpResponse = ({ contract, pursuitId }) => {
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
  const [companyName, setCompanyName] = useState('BizRadar Solutions');
  const [companyWebsite, setCompanyWebsite] = useState('https://www.bizradar.com');
  const [letterhead, setLetterhead] = useState('123 Innovation Drive, Suite 100, TechCity, TX 75001');
  const [phone, setPhone] = useState('(510) 754-2001');
  const [rfpTitle, setRfpTitle] = useState(contract?.title || 'Proposal for Cybersecurity Audit & Penetration Testing Services');
  const [rfpNumber, setRfpNumber] = useState(exampleJob.solicitationNumber);
  const [issuedDate, setIssuedDate] = useState(contract?.published_date || new Date().toLocaleDateString());
  const [submittedBy, setSubmittedBy] = useState('Admin, BizRadar');
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

  // Move the defaultTemplate function above the sections state declaration
  const defaultTemplate = (job) => [
    {
      id: 1,
      title: 'COVER PAGE',
      content: `[Automatically generated from your company information]`,
      icon: 'cover',
      completed: false
    },
    {
      id: 2,
      title: 'TABLE OF CONTENTS',
      content: 'Executive Summary\nCompany Overview\nQualifications and Experience\nTechnical Approach\nProject Management Plan\nCompliance & Certifications\nPricing Structure\nReferences\nAppendices',
      icon: 'toc',
      completed: false
    },
    {
      id: 3,
      title: 'EXECUTIVE SUMMARY',
      content: "This section briefly introduces your company's understanding of the project and how your solution aligns with the client's goals.",
      icon: 'summary',
      completed: false
    },
    {
      id: 4,
      title: 'COMPANY OVERVIEW',
      content: `${companyName} is a leading provider of innovative solutions for government and commercial clients. With extensive experience in delivering high-quality services, we are well-positioned to meet the requirements outlined in this RFP.`,
      icon: 'company',
      completed: false
    },
    {
      id: 5,
      title: 'QUALIFICATIONS AND EXPERIENCE',
      content: 'Outline your company\'s qualifications and experience relevant to this RFP.',
      icon: 'qualifications',
      completed: false
    },
    {
      id: 6,
      title: 'TECHNICAL APPROACH',
      content: 'Detail your approach to addressing the requirements in this RFP.',
      icon: 'technical',
      completed: false
    },
    {
      id: 7,
      title: 'PRICING STRUCTURE',
      content: 'Provide your pricing details and payment terms.',
      icon: 'pricing',
      completed: false
    }
  ];

  const [sections, setSections] = useState(defaultTemplate(exampleJob));

  // Load saved RFP data when component mounts
  useEffect(() => {
    const loadRfpData = async () => {
      if (!pursuitId) return;
      
      try {
        console.log("Loading RFP data for pursuit ID:", pursuitId);
        
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
          
          if (data.content) {
            const content = data.content;
            
            // Set all state values from saved data
            setLogo(content.logo || null);
            setCompanyName(content.companyName || 'BizRadar Solutions');
            setCompanyWebsite(content.companyWebsite || 'https://www.bizradar.com');
            setLetterhead(content.letterhead || '123 Innovation Drive, Suite 100, TechCity, TX 75001');
            setPhone(content.phone || '(510) 754-2001');
            setRfpTitle(content.rfpTitle || 'Proposal for Cybersecurity Audit & Penetration Testing Services');
            setRfpNumber(content.rfpNumber || exampleJob.solicitationNumber);
            setIssuedDate(content.issuedDate || 'December 26th, 2024');
            setSubmittedBy(content.submittedBy || 'Jane Smith, BizRadar (CEO)');
            setTheme(content.theme || 'professional');
            if (Array.isArray(content.sections)) {
              setSections(content.sections);
            }
          }
          
          // Set submission status
          setIsSubmitted(data.is_submitted || false);
          
          // Set last saved timestamp
          if (data.updated_at) {
            setLastSaved(new Date(data.updated_at).toLocaleTimeString());
          }
          
          console.log("Successfully loaded saved RFP data");
        } else {
          console.log("No existing RFP response found, using default template");
          // No saved data found, use default template with contract data
          setRfpTitle(contract?.title || 'Proposal for Cybersecurity Audit & Penetration Testing Services');
          setNaicsCode(contract?.naicsCode || '000000');
          setSolicitationNumber(contract?.solicitation_number || '');
          setIssuedDate(contract?.published_date || new Date().toLocaleDateString());
          setSections(defaultTemplate(exampleJob));
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
    }, 60000); // Auto-save every minute
    
    return () => clearTimeout(autoSaveTimer);
  }, [
    logo, companyName, companyWebsite, letterhead, phone, 
    rfpTitle, rfpNumber, issuedDate, submittedBy, theme, sections,
    autoSaveEnabled, pursuitId
  ]);
  
  // Function to save RFP data to the database
  const saveRfpData = async (showNotification = true) => {
    try {
      setIsSaving(true);
      
      // Determine the appropriate stage based on completion percentage
      const completedSections = sections.filter(section => section.completed).length;
      const totalSections = sections.length;
      
      let stageToSet;
      if (completedSections === totalSections && totalSections > 0) {
        stageToSet = "RFP Response Completed";
      } else if (completedSections > 0) {
        stageToSet = "RFP Response Initiated";
      } else {
        stageToSet = "Assessment";
      }
      
      console.log("Saving RFP with stage:", stageToSet);
      
      // Prepare the content object to save
      const contentToSave = {
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
        sections,
        isSubmitted,
        stage: stageToSet
      };
      
      // Store content in localStorage
      localStorage.setItem(`rfp_response_${pursuitId || 'draft'}`, JSON.stringify(contentToSave));
      
      // Update last saved timestamp
      setLastSaved(new Date().toLocaleTimeString());
      
      // Dispatch a custom event that the Pursuits component can listen for
      console.log("Dispatching rfp_saved event with details:", { pursuitId, stage: stageToSet });
      
      const customEvent = new CustomEvent('rfp_saved', { 
        detail: { 
          pursuitId, 
          stage: stageToSet
        } 
      });
      
      window.dispatchEvent(customEvent);
      
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
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogo(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const updateField = (index, field, value) => {
    const copy = [...sections];
    copy[index][field] = value;
    setSections(copy);
  };

  const toggleCompleted = (index) => {
    const copy = [...sections];
    copy[index].completed = !copy[index].completed;
    setSections(copy);
  };

  const deleteSection = (id) => {
    const updated = sections.filter((s) => s.id !== id);
    setSections(updated.map((s, i) => ({ ...s, id: i + 1 })));
  };

  const addSectionBelow = (index) => {
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

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
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

  const downloadPDF = () => {
    alert("PDF download feature will be implemented here");
    setShowDownloadOptions(false);
  };

  const downloadWord = () => {
    alert("Word download feature will be implemented here");
    setShowDownloadOptions(false);
  };

  const enhanceWithAI = () => {
    // AI enhancement logic would go here
    alert("AI enhancement feature would be implemented here");
  };
  
  // Show preview screen
  const handlePreview = () => {
    setShowPreview(true);
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

  return (
    <div className="p-2 md:p-6 max-w-6xl mx-auto">
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-start overflow-y-auto pt-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 relative">
            <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-100 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-800">Proposal Preview</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                    className={`inline-flex items-center gap-2 ${colors.primary} ${colors.text} px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all ${colors.primaryHover}`}
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  {showDownloadOptions && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border border-gray-100 overflow-hidden">
                      <button 
                        onClick={downloadPDF}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-red-500" /> Download as PDF
                      </button>
                      <button 
                        onClick={downloadWord}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-blue-500" /> Download as Word
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={enhanceWithAI}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all hover:from-purple-700 hover:to-purple-800"
                >
                  <Sparkles className="w-4 h-4" /> Enhance with AI
                </button>
                <button
                  onClick={closeRfpBuilder}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-8 min-h-screen bg-gray-50">
              {/* Cover Page Preview */}
              <div className="bg-white p-12 shadow-md mb-8 rounded-xl">
                <div className="flex flex-col items-center text-center mb-16">
                  {logo && (
                    <img src={logo} alt="Company Logo" className="max-h-24 object-contain mb-4" />
                  )}
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{companyName}</h1>
                  <a href={companyWebsite} className="text-blue-600 hover:underline mb-4">{companyWebsite}</a>
                  <p className="text-gray-600">{letterhead}</p>
                  <p className="text-gray-600">Phone: {phone}</p>
                </div>
                
                <div className="mt-24 mb-24">
                  <h1 className="text-4xl font-bold text-center mb-8">{rfpTitle}</h1>
                  <div className="border-t border-b border-gray-200 py-6 text-center">
                    <p className="font-semibold mb-2">NAICS CODE: {naicsCode}</p>
                    <p className="font-semibold mb-2">SOLICITATION NUMBER: {solicitationNumber}</p>
                    <p>Issued: {issuedDate}</p>
                  </div>
                </div>
                
                <div className="mt-32">
                  <p className="font-semibold">Submitted By:</p>
                  <p>{submittedBy}</p>
                  <p>{letterhead}</p>
                  <p>Phone: {phone}</p>
                </div>
              </div>
              
              {/* Other Sections Preview */}
              {sections.slice(1).map((section) => (
                <div key={section.id} className="bg-white p-8 shadow-md mb-8 rounded-xl">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">{section.title}</h2>
                  <div className="whitespace-pre-line">{section.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
              disabled={isSaving}
              className={`inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm ${isSaving ? 'opacity-70' : 'hover:bg-gray-50 hover:border-gray-400'} transition-all`}
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
              <div className="relative">
                <button
                  onClick={() => {
                    const themes = ['professional', 'modern', 'classic'];
                    const currentIndex = themes.indexOf(theme);
                    const nextIndex = (currentIndex + 1) % themes.length;
                    setTheme(themes[nextIndex]);
                  }}
                  className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  <Settings className="w-4 h-4" /> Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              </div>
              <button
                onClick={handlePreview}
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button
                onClick={enhanceWithAI}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all hover:from-blue-700 hover:to-blue-800"
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
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200 transition-all hover:shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                <Image className="w-4 h-4" />
              </div>
              Company Information
            </h2>
            
            <div className="space-y-4">
              {logo ? (
                <div className="flex flex-col items-center text-center mb-4">
                  <img src={logo} alt="Company Logo" className="max-h-20 object-contain mb-3 p-2 border border-gray-100 rounded-lg bg-white shadow-sm" />
                  <button 
                    onClick={() => setLogo(null)}
                    className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 mt-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3 h-3" /> Remove Logo
                  </button>
                </div>
              ) : (
                <div className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex items-center justify-center bg-gray-50 mb-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                  <label className="flex flex-col items-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-blue-600 transition-colors">
                    <Image className="w-10 h-10 text-gray-400" />
                    <span className="font-medium">Upload Company Logo</span>
                    <span className="text-xs text-gray-400">Recommended: 300x100px</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company Name"
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Website</label>
                <input
                  type="text"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://www.example.com"
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Address</label>
                <input
                  type="text"
                  value={letterhead}
                  onChange={(e) => setLetterhead(e.target.value)}
                  placeholder="Company Address"
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 transition-all hover:shadow-md">
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
                  onChange={(e) => setRfpTitle(e.target.value)}
                  placeholder="Proposal Title"
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">NAICS Code</label>
                <input
                  type="text"
                  value={naicsCode}
                  onChange={(e) => setNaicsCode(e.target.value)}
                  placeholder="NAICS Code"
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Solicitation Number</label>
                <input
                  type="text"
                  value={solicitationNumber}
                  onChange={(e) => setSolicitationNumber(e.target.value)}
                  placeholder="Solicitation Number"
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Issue Date</label>
                <input
                  type="text"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  placeholder="Issue Date"
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Submitted By</label>
                <input
                  type="text"
                  value={submittedBy}
                  onChange={(e) => setSubmittedBy(e.target.value)}
                  placeholder="Your Name and Title"
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-sm"
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
            <button
              onClick={() => addSectionBelow(sections.length - 1)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow transition-all hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="w-4 h-4" /> Add Section
            </button>
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
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompleted(index);
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
                        className={`text-base font-semibold w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none py-1 ${section.completed ? 'text-green-700' : 'text-gray-700'}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(section.id, 'up');
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-blue-600 ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                        disabled={index === 0}
                        title="Move Up"
                      >
                        <ChevronUp className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(section.id, 'down');
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-blue-600 ${index === sections.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                        disabled={index === sections.length - 1}
                        title="Move Down"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(section.id);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                      onClick={() => toggleSection(section.id)}
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
                    <textarea
                      rows={8}
                      className="w-full border border-gray-200 p-4 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none shadow-inner bg-white"
                      value={section.content}
                      onChange={(e) => updateField(index, 'content', e.target.value)}
                      placeholder="Enter section content here..."
                    />
                    <div className="flex justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleCompleted(index)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                            ${section.completed ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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
                          onClick={() => enhanceWithAI()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        >
                          <Sparkles className="w-4 h-4" /> Enhance with AI
                        </button>
                      </div>
                      <button
                        onClick={() => addSectionBelow(index)}
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-full hover:bg-blue-50"
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
            <button
              onClick={() => setShowDownloadOptions(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              <Download className="w-5 h-5" /> Download Proposal
            </button>
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
    </div>
  );
};

export default RfpResponse;
















