import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, FileText } from "lucide-react";
import jsPDF from "jspdf";

interface RfpChatProps {
  onUpdateContent: (content: string) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function RfpChat({ onUpdateContent }: RfpChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "This is a simulated AI response. The actual AI integration will be implemented later.",
    };

    setTimeout(() => {
      setMessages(prev => [...prev, aiMessage]);
      onUpdateContent(aiMessage.content);
    }, 1000);
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    let y = 10;
    messages.forEach((message) => {
      doc.text(`${message.role === "assistant" ? "AI" : "User"}: ${message.content}`, 10, y);
      y += 10;
    });
    doc.save("chat.pdf");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold">AI Assistant</h2>
      </div>

      <ScrollArea className="flex-1 p-4 bg-white rounded-lg">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.role === "assistant" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {message.role === "assistant" ? (
                  <Bot className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.role === "assistant"
                    ? "bg-secondary"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="w-4 h-4" />
          </Button>
          <Button type="button" size="icon" onClick={handleGeneratePDF}>
            <FileText className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
