import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";

interface RfpEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function RfpEditor({ content, onChange }: RfpEditorProps) {
  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    doc.text(content, 10, 10);
    doc.save("document.pdf");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <h2 className="font-semibold">Document Editor</h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full min-h-[500px] p-4 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Your RFP document content will appear here..."
        />
      </ScrollArea>
      <div className="p-2 border-t flex justify-end">
        <Button onClick={handleGeneratePDF} size="sm">
          Generate PDF
        </Button>
      </div>
    </div>
  );
}
