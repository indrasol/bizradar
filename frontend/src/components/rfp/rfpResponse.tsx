import React, { useState, useRef, useEffect } from 'react';
import { Download, Sparkles, PenLine, Image, Plus, Trash2, ChevronDown, ChevronUp, FileText, Eye, Settings, CheckCircle, Circle, X, Move, Save } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { toast } from "sonner";

interface Section {
  id: number;
  title: string;
  content: string;
  icon: string;
  completed: boolean;
}

interface RfpSaveEventDetail {
  pursuitId: string;
  stage: string;
  percentage: number;
}

const RfpResponse = ({ contract, pursuitId }) => {
  console.log("RfpResponse received contract:", contract);
  console.log("RfpResponse received pursuitId prop:", pursuitId);
  
  // CRITICAL: Always use the explicitly passed pursuitId, not contract.id
  const actualPursuitId = pursuitId || contract?.pursuitId || contract?.id;
  console.log("RfpResponse using pursuit ID:", actualPursuitId);
  
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
  const defaultTemplate = (job: any): Section[] => [
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
      if (!actualPursuitId) return;
      
      try {
        console.log("Loading RFP data for pursuit ID:", actualPursuitId);
        
        // Fetch RFP response data for this pursuit
        const { data: responses, error } = await supabase
          .from('rfp_responses')
          .select('*')
          .eq('pursuit_id', actualPursuitId);
        
        if (error) {
          console.error("Error loading RFP data:", error);
          toast?.error("Failed to load saved RFP data.");
          return;
        }
        
        if (responses && responses.length > 0) {
          // Existing opportunity with saved data found
          console.log("Found existing RFP response data");
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
            
            // For existing opportunities, ALWAYS use their saved sections, EVEN if empty
            // This preserves user's work (including if they deliberately deleted sections)
            if (Array.isArray(content.sections)) {
              console.log(`Loading existing opportunity's sections: ${content.sections.length} sections found`);
              setSections(content.sections);
            } else {
              // This only happens if sections wasn't saved as an array type
              console.log("Warning: saved sections is not an array, initializing empty sections");
              setSections([]);
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
          // New opportunity, no saved data found - use default template
          console.log("No existing RFP response found, using default template for new opportunity");
          setRfpTitle(contract?.title || 'Proposal for Cybersecurity Audit & Penetration Testing Services');
          setNaicsCode(contract?.naicsCode || '000000');
          setSolicitationNumber(contract?.solicitation_number || '');
          setIssuedDate(contract?.published_date || new Date().toLocaleDateString());
          
          // Apply default template only for new opportunities
          console.log("Initializing with default template sections");
          setSections(defaultTemplate(exampleJob));
        }
      } catch (err) {
        console.error("Error in RFP data loading:", err);
        toast?.error("An unexpected error occurred while loading RFP data.");
      }
    };
    
    loadRfpData();
  }, [actualPursuitId]);
  
  // Auto-save feature
  useEffect(() => {
    if (!autoSaveEnabled || !actualPursuitId) return;
    
    const autoSaveTimer = setTimeout(() => {
      saveRfpData(false); // Don't show notification for auto-save
    }, 60000); // Auto-save every minute
    
    return () => clearTimeout(autoSaveTimer);
  }, [
    logo, companyName, companyWebsite, letterhead, phone, 
    rfpTitle, rfpNumber, issuedDate, submittedBy, theme, sections,
    autoSaveEnabled, actualPursuitId
  ]);
  
  // Function to save RFP data to the database
  const saveRfpData = async (showNotification: boolean = true): Promise<void> => {
    try {
      setIsSaving(true);
      
      // Calculate completion percentage
      const completedSections = sections.filter(section => section.completed).length;
      const totalSections = sections.length;
      const percentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0; // Avoid division by zero
      
      // Determine the appropriate stage based on completion percentage
      let stageToSet: string;
      if (percentage === 100) {
        stageToSet = "RFP Response Completed";
      } else if (percentage > 0) {
        stageToSet = "RFP Response Initiated";
      } else {
        stageToSet = "Assessment";
      }
      
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
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user logged in");
        toast?.error("You must be logged in to save your RFP response.");
        return;
      }
      
      console.log("User ID:", user.id);
      
      // Save to rfp_responses table
      const { data: rfpData, error: rfpError } = await supabase
        .from('rfp_responses')
        .upsert({
          pursuit_id: actualPursuitId, // Use the correct ID here
          user_id: user.id, // Explicitly provide user ID
          content: contentToSave,
          completion_percentage: percentage,
          is_submitted: isSubmitted
        })
        .select('id');
        
      if (rfpError) {
        console.error("Error saving RFP response:", rfpError);
        toast?.error("Failed to save RFP response. Please try again.");
        return; // Exit if there's an error
      }
      
      // Update the pursuit stage
      const { error: pursuitError } = await supabase
        .from('pursuits')
        .update({ 
          stage: stageToSet,
          is_submitted: isSubmitted,
          updated_at: new Date().toISOString()
        })
        .eq('id', actualPursuitId);
      
      if (pursuitError) {
        console.error("Error updating pursuit stage:", pursuitError);
        toast?.error("Failed to update pursuit stage. Please try again.");
      }
      
      // Optionally show a success notification
      if (showNotification) {
        toast?.success("RFP response saved successfully!");
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
          primary: 'bg-gray-800',
          secondary: 'bg-gray-700',
          accent: 'bg-gray-600',
          text: 'text-white',
          hover: 'hover:bg-gray-700',
          border: 'border-gray-300',
          activeBorder: 'border-gray-500',
          sectionBg: 'bg-white',
          sectionHeaderBg: 'bg-gray-50',
          sectionHeaderBgActive: 'bg-gray-100',
          completedBg: 'bg-green-50',
          completedIcon: 'text-green-600',
          incompleteIcon: 'text-gray-400'
        };
      case 'modern':
        return {
          primary: 'bg-indigo-600',
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
          completedIcon: 'text-green-600',
          incompleteIcon: 'text-indigo-300'
        };
      case 'classic':
        return {
          primary: 'bg-amber-700',
          secondary: 'bg-amber-600',
          accent: 'bg-amber-500',
          text: 'text-white',
          hover: 'hover:bg-amber-800',
          border: 'border-amber-200',
          activeBorder: 'border-amber-500',
          sectionBg: 'bg-amber-50',
          sectionHeaderBg: 'bg-amber-100',
          sectionHeaderBgActive: 'bg-amber-200',
          completedBg: 'bg-green-50',
          completedIcon: 'text-green-600',
          incompleteIcon: 'text-amber-400'
        };
      default:
        return {
          primary: 'bg-gray-800',
          secondary: 'bg-gray-700',
          accent: 'bg-gray-600',
          text: 'text-white',
          hover: 'hover:bg-gray-700',
          border: 'border-gray-300',
          activeBorder: 'border-gray-500',
          sectionBg: 'bg-white',
          sectionHeaderBg: 'bg-gray-50',
          sectionHeaderBgActive: 'bg-gray-100',
          completedBg: 'bg-green-50',
          completedIcon: 'text-green-600',
          incompleteIcon: 'text-gray-400'
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
    if (actualPursuitId) {
      const savedData = localStorage.getItem(`rfp_response_${actualPursuitId}`);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (parsedData.stage) {
            // Update the pursuit stage in the local state
            setSections(prevSections => 
              prevSections.map(section => 
                section.id === actualPursuitId
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start overflow-y-auto pt-10">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 relative">
            <div className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Preview</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                    className={`inline-flex items-center gap-2 ${colors.primary} ${colors.text} px-4 py-2 rounded-lg shadow`}
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  {showDownloadOptions && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border">
                      <button 
                        onClick={downloadPDF}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" /> Download as PDF
                      </button>
                      <button 
                        onClick={downloadWord}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" /> Download as Word
                      </button>
                    </div>
                  )}
                </div>
        <button
                  onClick={enhanceWithAI}
                  className={`inline-flex items-center gap-2 ${colors.accent} ${colors.text} px-4 py-2 rounded-lg shadow`}
        >
                  <Sparkles className="w-4 h-4" /> Enhance with AI
        </button>
        <button
                  onClick={closeRfpBuilder}
                  className="text-gray-500 hover:text-gray-700 p-1 bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-8 min-h-screen bg-gray-50">
              {/* Cover Page Preview */}
              <div className="bg-white p-12 shadow-md mb-8">
                <div className="flex flex-col items-center text-center mb-16">
                  {logo && (
                    <img src={logo} alt="Company Logo" className="max-h-24 object-contain mb-4" />
                  )}
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{companyName}</h1>
                  <a href={companyWebsite} className="text-gray-600 mb-4">{companyWebsite}</a>
                  <p className="text-gray-600">{letterhead}</p>
                  <p className="text-gray-600">Phone: {phone}</p>
                </div>
                
                <div className="mt-24 mb-24">
                  <h1 className="text-4xl font-bold text-center mb-8">{rfpTitle}</h1>
                  <div className="border-t border-b border-gray-300 py-6 text-center">
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
                <div key={section.id} className="bg-white p-8 shadow-md mb-8">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">{section.title}</h2>
                  <div className="whitespace-pre-line">{section.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Header with Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${colors.primary}`}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">RFP Response Builder</h1>
          </div>
          <div className="flex gap-3 items-center">
            {/* Save button and indicator */}
            <button
              onClick={() => saveRfpData(true)}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm ${isSaving ? 'opacity-70' : 'hover:bg-gray-50'} transition-colors`}
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save'}
            </button>
            
            {lastSaved && (
              <div className="text-xs text-gray-500">
                Last saved: {lastSaved}
              </div>
            )}
            <div className="flex gap-3">
              <div className="relative">
                <button
                  onClick={() => {
                    const themes = ['professional', 'modern', 'classic'];
                    const currentIndex = themes.indexOf(theme);
                    const nextIndex = (currentIndex + 1) % themes.length;
                    setTheme(themes[nextIndex]);
                  }}
                  className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" /> Theme
                </button>
              </div>
              <button
                onClick={handlePreview}
                className={`inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors`}
              >
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button
                onClick={enhanceWithAI}
                className={`inline-flex items-center gap-2 ${colors.primary} ${colors.text} px-4 py-2 rounded-lg shadow ${colors.hover} transition-colors`}
              >
                <Sparkles className="w-4 h-4" /> Enhance with AI
        </button>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-gray-200 h-2 rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-green-500 transition-all duration-500 ease-in-out"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Proposal Completion: {completionPercentage}%</span>
          <span>{sections.filter(s => s.completed).length} of {sections.length} sections completed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Company Info */}
        <div className="md:col-span-1">
          <div className={`${colors.sectionBg} rounded-xl shadow-md p-6 mb-6`}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-gray-600" />
              Company Information
            </h2>
            
            <div className="space-y-4">
          {logo ? (
                <div className="flex flex-col items-center text-center mb-4">
                  <img src={logo} alt="Company Logo" className="max-h-20 object-contain mb-3" />
                  <button 
                    onClick={() => setLogo(null)}
                    className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
              ) : (
                <div className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 flex items-center justify-center bg-gray-50 mb-4">
                  <label className="flex flex-col items-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    <Image className="w-10 h-10 text-gray-400" />
                    <span className="font-medium">Upload Company Logo</span>
                    <span className="text-xs text-gray-400">Recommended: 300x100px</span>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
                </div>
          )}
              
          <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Website</label>
                <input
                  type="text"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://www.example.com"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
            <input
              type="text"
              value={letterhead}
              onChange={(e) => setLetterhead(e.target.value)}
                  placeholder="Company Address"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

          <div className={`${colors.sectionBg} rounded-xl shadow-md p-6`}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Proposal Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">RFP Title</label>
                <input
                  type="text"
                  value={rfpTitle}
                  onChange={(e) => setRfpTitle(e.target.value)}
                  placeholder="Proposal Title"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">NAICS Code</label>
                <input
                  type="text"
                  value={naicsCode}
                  onChange={(e) => setNaicsCode(e.target.value)}
                  placeholder="NAICS Code"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Solicitation Number</label>
                <input
                  type="text"
                  value={solicitationNumber}
                  onChange={(e) => setSolicitationNumber(e.target.value)}
                  placeholder="Solicitation Number"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Issue Date</label>
                <input
                  type="text"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  placeholder="Issue Date"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Submitted By</label>
            <input
              type="text"
                  value={submittedBy}
                  onChange={(e) => setSubmittedBy(e.target.value)}
                  placeholder="Your Name and Title"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sections */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Proposal Sections
            </h2>
            <button
              onClick={() => addSectionBelow(sections.length - 1)}
              className={`inline-flex items-center gap-2 ${colors.primary} ${colors.text} px-4 py-2 rounded-lg shadow ${colors.hover} transition-colors`}
            >
              <Plus className="w-4 h-4" /> Add Section
            </button>
          </div>
          
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div 
                key={section.id} 
                className={`rounded-xl shadow-sm border transition-all duration-200 
                  ${section.completed ? colors.completedBg : colors.sectionBg} 
                  ${expandedSection === section.id ? `${colors.activeBorder} shadow-md` : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div 
                  className={`flex justify-between items-center p-4 cursor-pointer rounded-t-xl
                    ${expandedSection === section.id ? colors.sectionHeaderBgActive : colors.sectionHeaderBg}`}
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompleted(index);
                      }} 
                      className="focus:outline-none"
                    >
                      {section.completed ? (
                        <CheckCircle className={`w-6 h-6 ${colors.completedIcon}`} />
                      ) : (
                        <Circle className={`w-6 h-6 ${colors.incompleteIcon}`} />
                      )}
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      {getSectionIcon(section.icon)}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateField(index, 'title', e.target.value)}
                        className={`text-lg font-semibold w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none ${section.completed ? 'text-gray-800' : 'text-gray-700'}`}
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
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700"
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
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700"
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
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {expandedSection === section.id && (
                  <div className="p-5 border-t border-gray-200">
          <textarea
            rows={6}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none"
            value={section.content}
            onChange={(e) => updateField(index, 'content', e.target.value)}
                      placeholder="Enter section content here..."
                    />
                    <div className="flex justify-between mt-3">
                      <div className="flex items-center">
                        <button 
                          onClick={() => toggleCompleted(index)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm 
                            ${section.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                        >
                          {section.completed ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Completed
                            </>
                          ) : (
                            <>
                              <Circle className="w-3 h-3" /> Mark as Complete
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => enhanceWithAI()}
                          className="ml-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          <Sparkles className="w-3 h-3" /> Enhance with AI
                        </button>
                      </div>
                      <button
                        onClick={() => addSectionBelow(index)}
                        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Insert Section Below
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
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-5 h-5" /> Preview Proposal
            </button>
            <button
              onClick={() => setShowDownloadOptions(true)}
              className={`inline-flex items-center gap-2 ${colors.primary} ${colors.text} px-6 py-3 rounded-xl shadow-md hover:shadow-lg ${colors.hover} transition-colors`}
            >
              <Download className="w-5 h-5" /> Download Proposal
            </button>
            {showDownloadOptions && (
              <div className="fixed inset-0 bg-black bg-opacity-20 z-40 flex items-center justify-center" onClick={() => setShowDownloadOptions(false)}>
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-4">Download Options</h3>
                  <div className="space-y-4">
                    <button 
                      onClick={downloadPDF}
                      className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">PDF Document</div>
                        <div className="text-sm text-gray-500">Best for printing and sharing</div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={downloadWord}
                      className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Word Document</div>
                        <div className="text-sm text-gray-500">Best for editing and customization</div>
                      </div>
                    </button>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => setShowDownloadOptions(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
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