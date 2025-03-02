import { ScrollArea } from "@/components/ui/scroll-area";

interface RfpEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export const RfpEditor: React.FC<RfpEditorProps> = ({ content, onChange }) => {
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
    </div>
  );
};
