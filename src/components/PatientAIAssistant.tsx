import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Loader2 } from "lucide-react";
import { getPatientModelResponse, storePatientData, getPatientCaseFiles } from "@/utils/aiModelUtils";
import { useToast } from "@/components/ui/use-toast";
import PatientQuestionGenerator from "./PatientQuestionGenerator";
import { savePatientConversation } from "@/integrations/supabase/client";
import OptimizedChatSuggestions from "./OptimizedChatSuggestions";

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
  const [caseFiles, setCaseFiles] = useState<string>("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchPatientCaseFiles = useCallback(async (patientId: string) => {
    try {
      const patientCaseFiles = await getPatientCaseFiles(patientId);
      setCaseFiles(patientCaseFiles);
      return patientCaseFiles;
    } catch (error) {
      console.error("Error getting case files:", error);
      return "";
    }
  }, []);

  const handlePatientDataLoaded = useCallback(async (event: CustomEvent<PatientDataEvent>) => {
    setPatientData(event.detail);
    
    if (event.detail && event.detail.patient) {
      storePatientData(event.detail.patient.id, event.detail);
      
      const initialGreeting = `I'm ready to answer questions about ${event.detail.patient.name}'s condition and care. What would you like to know?`;
      setResponse(initialGreeting);
      
      setConversationHistory([`AI: ${initialGreeting}`]);
      
      const initialQuestions = [
        `What are the best activities for ${event.detail.patient.name} at the ${event.detail.patient.stage} stage?`,
        `What symptoms might ${event.detail.patient.name} experience?`,
        `How can I help ${event.detail.patient.name} with daily activities?`,
        `What medications might help ${event.detail.patient.name}?`,
      ];
      setSuggestedQuestions(initialQuestions);
      
      await fetchPatientCaseFiles(event.detail.patient.id);
    }
  }, [fetchPatientCaseFiles]);

  const handleFileUploaded = useCallback(async (event: CustomEvent<{patientId: string}>) => {
    if (patientData?.patient && event.detail.patientId === patientData.patient.id) {
      try {
        const updatedCaseFiles = await fetchPatientCaseFiles(patientData.patient.id);
        
        if (updatedCaseFiles && !caseFiles) {
          toast({
            title: "Case Files Added",
            description: "New case information is now available to the assistant.",
          });
        }
      } catch (error) {
        console.error("Error refreshing case files:", error);
      }
    }
  }, [patientData, caseFiles, fetchPatientCaseFiles, toast]);

  useEffect(() => {
    document.addEventListener('patientDataLoaded', handlePatientDataLoaded as EventListener);
    document.addEventListener('patientFileUploaded', handleFileUploaded as EventListener);
    
    return () => {
      document.removeEventListener('patientDataLoaded', handlePatientDataLoaded as EventListener);
      document.removeEventListener('patientFileUploaded', handleFileUploaded as EventListener);
    };
  }, [handlePatientDataLoaded, handleFileUploaded]);

  const patientContext = useMemo(() => {
    if (!patientData?.patient) return "";
    
    return `Context: This is about patient ${patientData.patient.name} who has ${patientData.patient.diagnosis} in ${patientData.patient.stage} stage. 
    Age: ${patientData.patient.age}
    Case Study Details: ${patientData.caseStudy}
    
    ${caseFiles ? `Additional Case Files: ${caseFiles}` : ''}
    
    Previous conversation context:
    ${conversationHistory.slice(-6).join("\n")}`;
  }, [patientData, caseFiles, conversationHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userQuestion = `Q: ${input}`;
    setConversationHistory(prev => [...prev, userQuestion]);
    
    setIsLoading(true);
    try {
      console.log("Patient query:", input);
      console.log("Patient context:", patientContext);
      
      const aiResponse = await getPatientModelResponse(
        input, 
        patientContext
      );
      
      console.log("AI response:", aiResponse);
      setResponse(aiResponse);
      
      if (patientData?.patient?.id) {
        Promise.resolve().then(() => {
          try {
            savePatientConversation(patientData.patient.id, `Q: ${input}\nA: ${aiResponse}`, "AI Caregiver Assistant");
          } catch (err) {
            console.error("Error saving conversation:", err);
          }
        });
      }
      
      setConversationHistory(prev => [...prev, `AI: ${aiResponse}`]);
      
      const newQuestions = generateRelatedQuestions(input, patientData.patient.name, patientData.patient.stage);
      setSuggestedQuestions(newQuestions);
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

  const generateRelatedQuestions = (currentQuery: string, patientName: string, stage: string): string[] => {
    const lowerQuery = currentQuery.toLowerCase();
    
    if (lowerQuery.includes("memory") || lowerQuery.includes("forget")) {
      return [
        `What activities can help strengthen ${patientName}'s remaining memory?`,
        `How should I respond when ${patientName} doesn't recognize family members?`,
        `What memory aids are most effective at the ${stage} stage?`,
        `How can I help ${patientName} recall important daily routines?`
      ];
    } else if (lowerQuery.includes("agitat") || lowerQuery.includes("anger") || lowerQuery.includes("upset")) {
      return [
        `What are common triggers for agitation at the ${stage} stage?`,
        `What calming techniques work best for ${patientName}?`,
        `How can I prevent agitation during daily care activities?`,
        `When should I seek medical help for behavior changes?`
      ];
    } else if (lowerQuery.includes("medication") || lowerQuery.includes("medicine") || lowerQuery.includes("drug")) {
      return [
        `What are common side effects to watch for with ${patientName}'s medications?`,
        `What strategies help ensure medication adherence?`,
        `How can I track if ${patientName}'s medications are working?`,
        `When should medication doses be adjusted?`
      ];
    } else if (lowerQuery.includes("eat") || lowerQuery.includes("food") || lowerQuery.includes("meal") || lowerQuery.includes("diet")) {
      return [
        `What foods might benefit brain health for ${patientName}?`,
        `How can I make mealtimes less stressful?`,
        `What strategies help when ${patientName} refuses to eat?`,
        `How should eating habits change as dementia progresses?`
      ];
    } else {
      return [
        `What changes should I expect as ${patientName} progresses in this stage?`,
        `What resources are available for caregivers of ${stage} stage patients?`,
        `How can I best communicate with ${patientName} at this stage?`,
        `What activities are most appropriate for ${patientName} now?`
      ];
    }
  };

  const handleSelectQuestion = useCallback((question: string) => {
    setInput(question);
  }, []);

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

                    {suggestedQuestions.length > 0 && (
                      <OptimizedChatSuggestions
                        questions={suggestedQuestions}
                        onSelectQuestion={handleSelectQuestion}
                        isPatientMode={true}
                      />
                    )}

                    {caseFiles && (
                      <div className="mt-3 px-3 py-2 bg-blue-50 border-l-4 border-blue-300 rounded text-sm">
                        <p className="text-blue-800">
                          <strong>Case information available</strong> - The AI has access to this patient's case files
                        </p>
                      </div>
                    )}

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
