
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Brain, Send, Loader2, User, Bot, ChevronDown, Star, Image, Paperclip, MessageCircleQuestion, Activity } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MessageType = "text" | "image" | "reminder" | "health" | "question";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  important?: boolean;
  type?: MessageType;
  metadata?: Record<string, any>;
};

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hello! I'm Memora, your personal memory assistant. How can I help you today? I can answer questions about Alzheimer's, provide daily support, or just chat.",
    role: "assistant",
    timestamp: new Date(),
    type: "text"
  },
];

const sampleQuestions = [
  "What are the early symptoms of Alzheimer's?",
  "Help me remember to take my medicine",
  "What activities can improve brain health?",
  "Tell me about my family photos",
  "What day is it today?",
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "insights">("chat");
  const [attachmentType, setAttachmentType] = useState<"none" | "image" | "health" | "question">("none");
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
    
    if (!input.trim() && attachmentType === "none") return;
    
    let content = input.trim();
    let type: MessageType = "text";
    let metadata = {};
    
    if (attachmentType === "image") {
      type = "image";
      content = "Shared a family photo";
      metadata = { imagePath: "/placeholder.svg", caption: input || "Family photo" };
    } else if (attachmentType === "health") {
      type = "health";
      content = "Shared health data";
      metadata = { 
        bloodPressure: "120/80", 
        temperature: "98.6°F",
        heartRate: "72 bpm",
        oxygen: "98%",
        note: input || "Daily health check"
      };
    } else if (attachmentType === "question") {
      type = "question";
      content = input || "Generated question about memory";
    }
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
      type,
      metadata
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachmentType("none");
    setIsLoading(true);
    
    // Simulate AI response (in a real app, this would call an AI API)
    setTimeout(() => {
      let response: string;
      let responseType: MessageType = "text";
      let responseMetadata = {};
      
      // Enhanced response logic based on message type and content
      if (type === "image") {
        response = "This seems to be a family photo. Based on previous conversations, I believe this might be from the family reunion last summer at Lake Tahoe. You particularly enjoyed the barbecue that day. Would you like me to tell you more about the people in this photo?";
      } else if (type === "health") {
        response = "Your health readings look good today! Your blood pressure of 120/80 is within ideal range, and your other vitals are normal. This is an improvement from last week's readings. Remember to continue taking your medication with breakfast.";
        responseType = "health";
        responseMetadata = {
          assessment: "Normal readings",
          comparison: "Improved from last week",
          recommendations: ["Continue medication schedule", "Stay hydrated", "Gentle exercise recommended"]
        };
      } else if (type === "question") {
        response = "That's an excellent question about memory. Short-term memory loss is often one of the first noticeable symptoms of Alzheimer's. It's important to note that occasional forgetfulness differs from persistent memory issues that interfere with daily life. Would you like some strategies that might help with memory retention?";
        responseType = "question";
      } else if (input.toLowerCase().includes("symptoms") || input.toLowerCase().includes("signs")) {
        response = "Early signs of Alzheimer's disease include memory loss that disrupts daily life, challenges in planning or solving problems, difficulty completing familiar tasks, confusion with time or place, and trouble understanding visual images or spatial relationships. It's important to consult a healthcare professional if you notice these symptoms.";
      } else if (input.toLowerCase().includes("treatment") || input.toLowerCase().includes("cure")) {
        response = "While there's no cure for Alzheimer's disease yet, there are medications that can temporarily improve symptoms or slow the rate of decline. Non-drug approaches like cognitive stimulation, physical activity, social engagement, and proper nutrition are also beneficial. Recent research is exploring promising new treatments targeting the underlying biology of the disease.";
      } else if (input.toLowerCase().includes("help") || input.toLowerCase().includes("support")) {
        response = "Supporting someone with Alzheimer's includes establishing regular routines, creating a safe environment, providing memory cues, encouraging social activities, and maintaining good nutrition and exercise habits. It's also important to take care of yourself as a caregiver by seeking support groups and respite care when needed.";
      } else if (input.toLowerCase().includes("medicine") || input.toLowerCase().includes("medication")) {
        response = "I've made a note to remind you about your medicine. Your current regimen includes Donepezil (10mg) to be taken each morning and Memantine (10mg) in the evening with dinner. Would you like me to set up specific reminder times for these medications?";
        responseType = "reminder";
        responseMetadata = {
          medicationName: "Donepezil and Memantine",
          schedule: "Morning and evening",
          nextDose: "Today at 7:00 PM"
        };
      } else if (input.toLowerCase().includes("day") || input.toLowerCase().includes("date")) {
        const today = new Date();
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        response = `Today is ${today.toLocaleDateString('en-US', options)}. Your schedule today includes a doctor's appointment at 2:00 PM with Dr. Wilson and a video call with your daughter Sarah at 5:30 PM.`;
      } else if (input.toLowerCase().includes("exercise") || input.toLowerCase().includes("activities") || input.toLowerCase().includes("brain health")) {
        response = "Activities that promote brain health include daily puzzles like crosswords or Sudoku, learning new skills, regular physical exercise like walking or swimming, maintaining social connections, eating a balanced diet rich in antioxidants, and getting quality sleep. Research shows that a combination of these activities provides the best cognitive benefits.";
      } else {
        response = "Thank you for your message. I've noted this information in your personal memory bank. I'm here to provide information about Alzheimer's disease and support for patients and caregivers. Is there anything specific you'd like to know more about?";
      }
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: response,
        role: "assistant",
        timestamp: new Date(),
        type: responseType,
        metadata: responseMetadata,
        important: input.toLowerCase().includes("medicine") || input.toLowerCase().includes("medication"),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSampleQuestion = (question: string) => {
    setInput(question);
  };

  const markAsImportant = (messageId: string) => {
    setMessages(prev => 
      prev.map(message => 
        message.id === messageId 
          ? { ...message, important: !message.important } 
          : message
      )
    );
    
    toast({
      title: "Message marked as important",
      description: "This message will be saved for future reference.",
    });
  };

  const renderMessage = (message: Message) => {
    return (
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
            className={`rounded-2xl px-4 py-2 relative ${
              message.role === "assistant"
                ? "bg-white border border-memora-purple/20"
                : "bg-memora-purple text-white"
            } ${message.important ? "border-2 border-amber-400" : ""}`}
          >
            {message.type === "image" && message.metadata?.imagePath && (
              <div className="mb-2">
                <img 
                  src={message.metadata.imagePath} 
                  alt={message.metadata.caption || "Shared image"} 
                  className="rounded-lg max-h-40 w-auto"
                />
                <p className="text-xs mt-1 text-gray-500">{message.metadata.caption}</p>
              </div>
            )}
            
            {message.type === "health" && message.role === "assistant" && message.metadata && (
              <div className="mb-2 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-700">Health Assessment</p>
                <ul className="mt-1 space-y-1">
                  {message.metadata.recommendations?.map((rec: string, i: number) => (
                    <li key={i} className="text-xs flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-blue-700"></div>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {message.type === "reminder" && message.metadata && (
              <div className="mb-2 p-2 bg-purple-50 rounded-lg">
                <p className="text-xs font-medium text-purple-700">Medication Reminder</p>
                <p className="text-xs mt-1">{message.metadata.medicationName}: {message.metadata.nextDose}</p>
              </div>
            )}
            
            <div className="prose prose-sm max-w-none">
              {message.content}
            </div>
            
            {message.role === "assistant" && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute -bottom-2 right-2 h-6 w-6 rounded-full p-0 opacity-70 hover:opacity-100"
                onClick={() => markAsImportant(message.id)}
              >
                <Star className={`h-4 w-4 ${message.important ? "fill-amber-400 text-amber-400" : "text-gray-400"}`} />
                <span className="sr-only">Mark as important</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getInsights = () => {
    // In a real app, this would analyze conversation history
    return [
      {
        title: "Memory Status",
        description: "Short-term memory shows moderate decline compared to last week",
        change: "decline",
        data: {
          current: 65,
          previous: 72
        }
      },
      {
        title: "Conversation Topics",
        description: "Most frequent topics: medications, family, daily activities",
        change: "neutral",
        data: {
          medications: 42,
          family: 28,
          activities: 18,
          other: 12
        }
      },
      {
        title: "Emotional Wellbeing",
        description: "Sentiment analysis shows improved mood from previous sessions",
        change: "improvement",
        data: {
          current: 78,
          previous: 65
        }
      }
    ];
  };

  return (
    <div className="flex flex-col h-[70vh] md:h-[80vh]">
      <Tabs 
        defaultValue="chat" 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "chat" | "insights")}
        className="w-full mb-4"
      >
        <TabsList className="grid grid-cols-2 w-full mb-2">
          <TabsTrigger value="chat">Conversation</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="flex-1 flex flex-col space-y-4">
          <Card className="flex-1 p-4 overflow-y-auto glass-card mb-4">
            <div className="space-y-4 pb-4">
              {messages.map(renderMessage)}
              
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
                className="text-xs bg-white/50 hover:bg-white transition-all duration-300 hover:shadow-md"
              >
                {question}
              </Button>
            ))}
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
                className="resize-none bg-white/70 text-lg pr-10"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 bottom-2"
                    disabled={isLoading}
                  >
                    <Paperclip className="h-5 w-5 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="grid gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => setAttachmentType("image")}
                    >
                      <Image className="mr-2 h-4 w-4" />
                      Share Family Photo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => setAttachmentType("health")}
                    >
                      <Activity className="mr-2 h-4 w-4" />
                      Share Health Data
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => setAttachmentType("question")}
                    >
                      <MessageCircleQuestion className="mr-2 h-4 w-4" />
                      Ask About Memory
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || (!input.trim() && attachmentType === "none")}
              className="bg-memora-purple hover:bg-memora-purple-dark transition-all duration-300"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </form>
          
          {attachmentType !== "none" && (
            <div className="flex items-center gap-2 text-sm text-memora-purple font-medium">
              {attachmentType === "image" && <Image className="h-4 w-4" />}
              {attachmentType === "health" && <Activity className="h-4 w-4" />}
              {attachmentType === "question" && <MessageCircleQuestion className="h-4 w-4" />}
              <span>
                {attachmentType === "image" && "Family photo selected"}
                {attachmentType === "health" && "Health data ready to share"}
                {attachmentType === "question" && "Memory question ready"}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setAttachmentType("none")} 
                className="p-0 h-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="insights" className="flex-1">
          <Card className="glass-card p-4">
            <h3 className="text-lg font-medium mb-4">AI-Generated Insights</h3>
            <div className="space-y-4">
              {getInsights().map((insight, index) => (
                <div key={index} className="bg-white/70 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{insight.title}</h4>
                    <div className={`flex items-center gap-1 text-sm ${
                      insight.change === "improvement" ? "text-green-600" : 
                      insight.change === "decline" ? "text-red-600" : "text-blue-600"
                    }`}>
                      {insight.change === "improvement" && "▲"}
                      {insight.change === "decline" && "▼"}
                      {insight.change === "neutral" && "●"}
                      <span>{insight.change === "improvement" ? "Improving" : 
                             insight.change === "decline" ? "Declining" : "Stable"}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              ))}
              
              <p className="text-sm text-muted-foreground mt-4">
                These insights are generated based on conversation analysis and pattern recognition. 
                They are intended to provide general guidance and should be discussed with healthcare professionals.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
