
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Loader2 } from "lucide-react";
import { getModelResponse, storePatientData } from "@/utils/aiModelUtils";
import { useToast } from "@/components/ui/use-toast";
import PatientQuestionGenerator from "./PatientQuestionGenerator";

export interface PatientDataEvent {
  patient: {
    id: string;
    name: string;
    age: number;
    diagnosis: string;
    stage: string;
  };
  caseStudy: string;
}

export default function PatientAIAssistant() {
  const [input, setInput] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [patientData, setPatientData] = useState<PatientDataEvent | null>(null);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const { toast } = useToast();

  // Listen for patient data updates
  useEffect(() => {
    const handlePatientDataLoaded = (event: CustomEvent<PatientDataEvent>) => {
      setPatientData(event.detail);
      
      // Store patient data in utility for context-aware responses
      if (event.detail && event.detail.patient) {
        storePatientData(event.detail.patient.id, event.detail);
        
        // Add initial greeting with patient name
        const initialGreeting = `I'm ready to answer questions about ${event.detail.patient.name}'s condition and care. What would you like to know?`;
        setResponse(initialGreeting);
      }
    };

    document.addEventListener('patientDataLoaded', handlePatientDataLoaded as EventListener);
    
    return () => {
      document.removeEventListener('patientDataLoaded', handlePatientDataLoaded as EventListener);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsLoading(true);
    try {
      let prompt = input;
      
      // Add patient context if available
      if (patientData && patientData.patient) {
        // Create a more detailed prompt that includes patient context
        prompt = `Context: This is about patient ${patientData.patient.name} who has ${patientData.patient.diagnosis} in ${patientData.patient.stage} stage. 
        Age: ${patientData.patient.age}
        Case Study Details: ${patientData.caseStudy}
        
        Question: ${input}
        
        Previous conversation context:
        ${conversationHistory.slice(-4).join("\n")}`;
      }
      
      const aiResponse = await getModelResponse(prompt);
      setResponse(aiResponse);
      
      // Update conversation history
      setConversationHistory(prev => [...prev, `Q: ${input}`, `A: ${aiResponse}`]);
    } catch (error) {
      console.error("Error getting response:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  const handleSelectQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className={`${patientData ? "block" : "hidden"} mb-6`}>
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {patientData && (
              <div>
                <h2 className="text-xl font-bold mb-2">
                  Patient Assistant: {patientData.patient.name}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask questions specific to this patient's condition and care needs
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                      <Textarea
                        placeholder="Ask a question about this patient..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="min-h-24 bg-white/70"
                        disabled={isLoading}
                      />
                      <Button 
                        type="submit" 
                        className="w-full bg-memora-purple hover:bg-memora-purple-dark"
                        disabled={isLoading || !input.trim()}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Ask
                          </>
                        )}
                      </Button>
                    </form>

                    {response && (
                      <div className="mt-4 bg-white p-4 rounded-lg border border-memora-purple/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="h-5 w-5 text-memora-purple" />
                          <h3 className="font-medium">AI Response</h3>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{response}</p>
                      </div>
                    )}
                  </div>
                  
                  <PatientQuestionGenerator 
                    patientName={patientData.patient.name}
                    patientStage={patientData.patient.stage}
                    caseStudy={patientData.caseStudy}
                    onSelectQuestion={handleSelectQuestion}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
