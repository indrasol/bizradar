
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RfpEditor } from "@/components/rfp/RfpEditor";
import { RfpChat } from "@/components/rfp/RfpChat";
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Download, Upload, Eye, Save } from "lucide-react";
import { toast } from "sonner";

export default function RfpWriter() {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Document saved successfully");
  };

  const handleDownload = () => {
    // TODO: Implement document download
    toast.info("Download functionality coming soon");
  };

  const handleUpload = () => {
    // TODO: Implement document upload
    toast.info("Upload functionality coming soon");
  };

  const handlePreview = () => {
    // TODO: Implement preview mode
    toast.info("Preview functionality coming soon");
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)]">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">RFP Writer</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <ResizablePanelGroup
          direction="horizontal"
          className="h-full rounded-lg border"
        >
          <ResizablePanel defaultSize={40} minSize={30}>
            <RfpChat onUpdateContent={setContent} />
          </ResizablePanel>
          <ResizablePanel defaultSize={60} minSize={30}>
            <RfpEditor content={content} onChange={setContent} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </DashboardLayout>
  );
}
