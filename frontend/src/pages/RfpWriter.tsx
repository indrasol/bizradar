import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RfpEditor } from "@/components/rfp/RfpEditor";
import { RfpChat } from "@/components/rfp/RfpChat";
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Download, Upload, Eye, Save } from "lucide-react";
import { toast } from "sonner";
import { TypeWriter } from "@/components/ui/TypeWriter"; 

export default function RfpWriter() {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const contract = location.state?.contract;

  useEffect(() => {
    if (!contract) {
      toast.error('No contract information provided');
      navigate('/contracts');
      return;
    }
    
    setIsGenerating(true);
    setContent(''); // Clear previous content

    // API call to generate RFP
    fetch(`http://localhost:5000/generate-rfp/${contract.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contract)
    })
    .then(response => response.json())
    .then(data => {
      const formattedContent = `
<div class="text-center">
  <img src="/logo.jpg" alt="Company Logo" class="mx-auto h-56" />
</div>

# REQUEST FOR PROPOSAL (RFP) FOR ${contract.title}

## PROJECT OVERVIEW
<strong>${contract.agency}</strong> is seeking proposals for <strong>${contract.title}</strong>. This Request for Proposal (RFP) is issued under NAICS code <strong>${contract.naicsCode}</strong>. This document outlines the requirements and specifications for potential contractors.

## SCOPE OF WORK
The selected contractor will be responsible for delivering comprehensive solutions that meet all specified requirements and objectives outlined in this RFP.

## TIMELINE
• RFP Issue Date: ${new Date().toLocaleDateString()}
• Proposal Due Date: ${new Date(contract.dueDate).toLocaleDateString()}
• Expected Award Date: TBD

## EVALUATION CRITERIA
• Technical Capability (40%)
• Past Performance (25%)
• Cost Proposal (20%)
• Project Management (15%)

## SUBMISSION REQUIREMENTS
1. Executive Summary
2. Technical Approach
3. Past Performance References
4. Cost Breakdown
5. Project Timeline
6. Team Composition
7. Risk Management Plan

For questions regarding this RFP, please contact the contracting officer.
`.trim();

      // Simulate a gradual content load
      let currentContent = '';
      const lines = formattedContent.split('\n');
      let lineIndex = 0;

      const typeInterval = setInterval(() => {
        if (lineIndex < lines.length) {
          currentContent += lines[lineIndex] + '\n';
          setContent(currentContent);
          lineIndex++;
        } else {
          clearInterval(typeInterval);
          setIsGenerating(false);
          toast.success('RFP generated successfully');
        }
      }, 100);

    })
    .catch(error => {
      toast.error('Failed to generate RFP.');
      console.error('Error:', error);
      setIsGenerating(false);
    });
  }, [contract, navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Document saved successfully");
  };

  const handleDownload = () => {
    toast.info("Download functionality coming soon");
  };

  const handleUpload = () => {
    toast.info("Upload functionality coming soon");
  };

  const handlePreview = () => {
    toast.info("Preview functionality coming soon");
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)]">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">RFP Writer</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleUpload}>
              <Upload className="w-4 h-4 mr-2" />Upload
            </Button>
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />Preview
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />{isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />Download
            </Button>
          </div>
        </div>

        <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
          <ResizablePanel defaultSize={40} minSize={30}>
            <RfpChat onUpdateContent={setContent} />
          </ResizablePanel>
          <ResizablePanel defaultSize={60} minSize={30}>
            <RfpEditor 
              content={content} 
              onChange={setContent} 
              isGenerating={isGenerating}
              contract={contract}
            />
            <TypeWriter text={content} onComplete={() => console.log('Typewriter effect completed')} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </DashboardLayout>
  );
}
