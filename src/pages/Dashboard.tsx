import Layout from "@/components/Layout";
import PatientProfile from "@/components/PatientProfile";
import PatientSelector from "@/components/PatientSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, FileText, Brain, MessageSquare, Activity, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PatientAIAssistant from "@/components/PatientAIAssistant";
import PatientWellbeingQuestionnaire from "@/components/PatientWellbeingQuestionnaire";
import { useToast } from "@/components/ui/use-toast";
import { getPatientConversations, formatConversationTimestamp } from "@/utils/aiModelUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PatientManager from "@/components/PatientManager";

interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  stage: string;
  gender: string;
}

interface PatientTask {
  id: string;
  title: string;
  due_date: string;
  status: string;
  priority: "high" | "medium" | "low";
}

interface PatientFile {
  id: string;
  file_name: string;
  upload_date: string;
  file_category: string;
}

interface PatientConversation {
  id: string;
  title: string;
  message: string;
  timestamp: string;
}

export default function Dashboard() {
  console.log("Dashboard component rendering - this is the PATIENT DASHBOARD page");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [patientTasks, setPatientTasks] = useState<PatientTask[]>([]);
  const [patientFiles, setPatientFiles] = useState<PatientFile[]>([]);
  const [patientConversations, setPatientConversations] = useState<PatientConversation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [wellbeingScores, setWellbeingScores] = useState({
    sleep: 0,
    activity: 0,
    mood: 0,
    overall: 0
  });
  const { toast } = useToast();

  const handlePatientSelect = (patient: Patient) => {
    console.log("Patient selected:", patient);
    setSelectedPatient(patient);
    fetchPatientData(patient.id);
  };

  const fetchPatientData = async (patientId: string) => {
    console.log("Fetching data for patient ID:", patientId);
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('patient_tasks')
        .select('*')
        .eq('patient_id', patientId)
        .order('due_date', { ascending: true })
        .limit(5);
      
      if (tasksError) {
        console.error('Error fetching patient tasks:', tasksError);
        throw tasksError;
      }
      
      console.log("Tasks data received:", tasksData);
      
      const formattedTasks = tasksData?.map(task => ({
        id: task.id,
        title: task.title,
        due_date: new Date(task.due_date).toLocaleDateString(),
        status: task.status,
        priority: determinePriority(task.due_date, task.status)
      })) || [];
      
      setPatientTasks(formattedTasks);
      
      const { data: filesData, error: filesError } = await supabase
        .from('patient_files')
        .select('*')
        .eq('patient_id', patientId)
        .order('upload_date', { ascending: false })
        .limit(10);
      
      if (filesError) {
        console.error('Error fetching patient files:', filesError);
        throw filesError;
      }
      
      console.log("Files data received:", filesData);
      
      const formattedFiles = filesData?.map(file => ({
        id: file.id,
        file_name: file.file_name,
        upload_date: new Date(file.upload_date).toLocaleDateString(),
        file_category: file.file_category
      })) || [];
      
      setPatientFiles(formattedFiles);
      
      fetchPatientConversations(patientId);
      
      generateWellbeingScores();
    } catch (error: any) {
      console.error('Error fetching patient data:', error);
      setError(error?.message || 'Failed to load patient data');
      toast({
        title: "Error fetching patient data",
        description: "Could not load patient information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const determinePriority = (dueDate: string, status: string): "high" | "medium" | "low" => {
    if (status === "overdue") return "high";
    
    const today = new Date();
    const taskDate = new Date(dueDate);
    const diffDays = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return "high";
    if (diffDays <= 3) return "medium";
    return "low";
  };

  const fetchPatientConversations = (patientId: string) => {
    const storedConversations = getPatientConversations(patientId);
    
    if (storedConversations && storedConversations.length > 0) {
      const formattedConversations = storedConversations.map(conv => ({
        id: conv.id || crypto.randomUUID(),
        title: conv.title || "AI Assistant",
        message: conv.message || conv.content || "",
        timestamp: formatConversationTimestamp(conv.timestamp)
      }));
      
      setPatientConversations(formattedConversations);
    } else {
      createFallbackConversations(patientId);
    }
  };

  const createFallbackConversations = (patientId: string) => {
    const mockConversations = [
      {
        id: "1",
        title: "Memory Support",
        message: selectedPatient ? `Remember to take your medication at 7:00 PM with dinner, ${selectedPatient.name}. I'll send you a reminder when it's time.` : "",
        timestamp: "Today at 2:34 PM"
      },
      {
        id: "2",
        title: "Family Visit",
        message: "Your daughter Sarah is coming to visit this weekend. She mentioned bringing photos from your trip to the lake last summer.",
        timestamp: "Yesterday at 6:15 PM"
      },
      {
        id: "3",
        title: "Today's Weather",
        message: "It's sunny and 72°F outside today. A perfect day for a short walk in the garden.",
        timestamp: "Today at 9:12 AM"
      },
      {
        id: "4",
        title: "Memory Exercise",
        message: selectedPatient ? `We completed a memory game this morning. You correctly identified 8 out of 10 items - that's great progress, ${selectedPatient.name}!` : "",
        timestamp: "Today at 11:45 AM"
      }
    ];
    
    setPatientConversations(mockConversations);
  };

  const generateWellbeingScores = () => {
    const sleep = Math.floor(Math.random() * 30) + 70;
    const activity = Math.floor(Math.random() * 40) + 60;
    const mood = Math.floor(Math.random() * 35) + 65;
    const overall = Math.floor((sleep + activity + mood) / 3);
    
    setWellbeingScores({
      sleep,
      activity,
      mood,
      overall
    });
  };

  const handleQuestionnaireSubmit = (scores: {sleep: number, activity: number, mood: number, overall: number}) => {
    setWellbeingScores(scores);
    
    toast({
      title: "Wellbeing assessment updated",
      description: "The patient's wellbeing summary has been updated based on the questionnaire.",
    });
  };

  useEffect(() => {
    document.title = "Patient Dashboard | Memora";
    console.log("Dashboard page mounted");
    
    const handleNewConversation = (event: CustomEvent) => {
      if (selectedPatient && event.detail.patientId === selectedPatient.id) {
        fetchPatientConversations(selectedPatient.id);
      }
    };

    document.addEventListener('newPatientConversation', handleNewConversation as EventListener);
    
    return () => {
      document.removeEventListener('newPatientConversation', handleNewConversation as EventListener);
    };
  }, [selectedPatient]);

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Patient Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor and manage patient care, cognitive health, and support resources.
            </p>
          </div>
          <PatientSelector onSelectPatient={handlePatientSelect} />
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!selectedPatient ? (
        <PatientManager />
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-16 w-16 text-memora-purple animate-spin mb-4" />
          <p className="text-muted-foreground">Loading patient data...</p>
        </div>
      ) : (
        <>
          <PatientAIAssistant />
        
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                        <p className="font-medium">Today's Tasks</p>
                      </div>
                      <p className="text-2xl font-bold">{patientTasks.length || 0}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <FileText className="h-5 w-5 text-purple-500" />
                        </div>
                        <p className="font-medium">Documents</p>
                      </div>
                      <p className="text-2xl font-bold">{patientFiles.length || 0}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Activity className="h-5 w-5 text-green-500" />
                        </div>
                        <p className="font-medium">Well-being</p>
                      </div>
                      <p className="text-2xl font-bold">{wellbeingScores.overall}%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Recent Conversations</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="important">
                    <TabsList className="mb-4 bg-background/50">
                      <TabsTrigger value="important" className="data-[state=active]:bg-memora-purple data-[state=active]:text-white">
                        Important
                      </TabsTrigger>
                      <TabsTrigger value="recent" className="data-[state=active]:bg-memora-purple data-[state=active]:text-white">
                        Recent
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="important">
                      <div className="space-y-3">
                        {patientConversations.slice(0, 2).map((conv) => (
                          <div key={conv.id} className="bg-white/70 p-3 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="bg-memora-purple/20 p-2 rounded-full shrink-0">
                                <Brain className="h-4 w-4 text-memora-purple" />
                              </div>
                              <div>
                                <p className="font-medium mb-1">{conv.title}</p>
                                <p className="text-sm">{conv.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">{conv.timestamp}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {patientConversations.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>No conversations with this patient yet.</p>
                            <p className="text-sm mt-1">Try using the AI Assistant above to start a conversation.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="recent">
                      <div className="space-y-3">
                        {patientConversations.slice(0, 4).map((conv) => (
                          <div key={conv.id} className="bg-white/70 p-3 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="bg-memora-purple/20 p-2 rounded-full shrink-0">
                                <Brain className="h-4 w-4 text-memora-purple" />
                              </div>
                              <div>
                                <p className="font-medium mb-1">{conv.title}</p>
                                <p className="text-sm">{conv.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">{conv.timestamp}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {patientConversations.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>No conversations with this patient yet.</p>
                            <p className="text-sm mt-1">Try using the AI Assistant above to start a conversation.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              
              <PatientWellbeingQuestionnaire onSubmit={handleQuestionnaireSubmit} />
            </div>
            
            <div className="space-y-6">
              <PatientProfile 
                patientId={selectedPatient.id} 
                wellbeingScores={wellbeingScores}
              />
              
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold">Support Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-white/70 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-memora-purple" />
                        <h3 className="font-medium">Alzheimer's Association</h3>
                      </div>
                      <p className="text-sm mt-1">24/7 Helpline: 800-272-3900</p>
                    </div>
                    <div className="bg-white/70 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-memora-purple" />
                        <h3 className="font-medium">Caregiver Support Group</h3>
                      </div>
                      <p className="text-sm mt-1">Next meeting: April 15, 2025</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
