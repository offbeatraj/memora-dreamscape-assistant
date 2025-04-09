
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Brain, Send, Loader2, User, Bot } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
};

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hello! I'm Memora, your personal assistant. How can I help you today?",
    role: "assistant",
    timestamp: new Date(),
  },
];

const sampleQuestions = [
  "What are the early symptoms of Alzheimer's?",
  "How can I support someone with memory loss?",
  "What activities are good for brain health?",
  "Tell me about new research on Alzheimer's",
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    // Simulate AI response (in a real app, this would call an AI API)
    setTimeout(() => {
      let response: string;
      
      // Simple response logic based on user input
      if (input.toLowerCase().includes("symptoms") || input.toLowerCase().includes("signs")) {
        response = "Early signs of Alzheimer's disease include memory loss that disrupts daily life, challenges in planning or solving problems, difficulty completing familiar tasks, and confusion with time or place. It's important to consult a healthcare professional if you notice these symptoms.";
      } else if (input.toLowerCase().includes("treatment") || input.toLowerCase().includes("cure")) {
        response = "While there's no cure for Alzheimer's disease yet, there are medications that can temporarily improve symptoms or slow the rate of decline. Non-drug approaches like cognitive stimulation, physical activity, and social engagement are also beneficial.";
      } else if (input.toLowerCase().includes("help") || input.toLowerCase().includes("support")) {
        response = "Supporting someone with Alzheimer's includes establishing regular routines, creating a safe environment, providing memory cues, and encouraging social activities. It's also important to take care of yourself as a caregiver by seeking support groups and respite care when needed.";
      } else {
        response = "Thank you for your question. I'm designed to provide information about Alzheimer's disease and support for patients and caregivers. Could you please specify what aspect of Alzheimer's you'd like to know more about?";
      }
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: response,
        role: "assistant",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSampleQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="flex flex-col h-[70vh] md:h-[80vh]">
      <Card className="flex-1 p-4 overflow-y-auto glass-card mb-4">
        <div className="space-y-4 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex gap-3 max-w-[80%] ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className={message.role === "assistant" ? "bg-memora-purple" : "bg-gray-300"}>
                  <div className="text-white">
                    {message.role === "assistant" ? <Bot size={20} /> : <User size={20} />}
                  </div>
                </Avatar>
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.role === "assistant"
                      ? "bg-white border border-memora-purple/20"
                      : "bg-memora-purple text-white"
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <Avatar className="bg-memora-purple">
                  <div className="text-white">
                    <Bot size={20} />
                  </div>
                </Avatar>
                <div className="rounded-2xl px-4 py-3 bg-white border border-memora-purple/20">
                  <Loader2 className="h-5 w-5 animate-spin text-memora-purple" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>
      
      <div className="mb-4 flex flex-wrap gap-2">
        {sampleQuestions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => handleSampleQuestion(question)}
            className="text-xs bg-white/50 hover:bg-white"
          >
            {question}
          </Button>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="resize-none bg-white/70"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="bg-memora-purple hover:bg-memora-purple-dark"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
