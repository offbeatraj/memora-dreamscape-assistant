import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Brain, FileText, User, AlertCircle, Calendar, ClipboardList, HeartPulse, Upload, Paperclip, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  stage: "early" | "moderate" | "advanced";
  caseStudy?: string;
}

export interface PatientDataEvent {
  patient: Patient;
  caseStudy: string;
}

export default function PatientAIAssistant() {
  const [patients, setPatients] = useState<Patient[]>([
    { id: "p1", name: "Eleanor Johnson", age: 73, diagnosis: "Alzheimer's Disease", stage: "moderate" },
    { id: "p2", name: "Robert Wilson", age: 68, diagnosis: "Early-onset Alzheimer's", stage: "early" },
    { id: "p3", name: "Margaret Thompson", age: 82, diagnosis: "Alzheimer's Disease", stage: "advanced" },
  ]);
  
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [caseStudy, setCaseStudy] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<{
    carePlan: string | null;
    dietPlan: string | null;
    reminders: string[] | null;
  }>({ carePlan: null, dietPlan: null, reminders: null });
  
  const { toast } = useToast();

  const dispatchPatientDataEvent = (patientData: PatientDataEvent) => {
    const event = new CustomEvent('patientDataLoaded', { 
      detail: patientData,
      bubbles: true 
    });
    document.dispatchEvent(event);
  };

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(interval);
            setIsProcessing(false);
            return 100;
          }
          return newProgress;
        });
      }, 200);
      
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  useEffect(() => {
    setCaseStudy("");
    setGeneratedContent({ carePlan: null, dietPlan: null, reminders: null });
    setProcessingProgress(0);
  }, [selectedPatient]);

  const handleProcessCaseStudy = () => {
    if (!selectedPatient) {
      toast({
        title: "Patient Required",
        description: "Please select a patient before processing",
        variant: "destructive",
      });
      return;
    }

    if (!caseStudy.trim()) {
      toast({
        title: "Case Study Required",
        description: "Please enter case study details",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    
    const updatedPatients = patients.map(p => 
      p.id === selectedPatient ? { ...p, caseStudy } : p
    );
    setPatients(updatedPatients);
    
    setTimeout(() => {
      const patient = patients.find(p => p.id === selectedPatient);
      
      const generateForStage = (stage: string) => {
        if (stage === "early") {
          return {
            carePlan: "**Early Stage Care Plan**\n\n- Daily cognitive exercises focusing on memory retention\n- Maintain independence with subtle supervision\n- Regular social engagement activities\n- Establish consistent daily routines\n- Weekly check-ins with healthcare provider",
            dietPlan: "**Early Stage Diet Plan**\n\n- Mediterranean diet rich in omega-3 fatty acids\n- Limit sugar and processed foods\n- Increase antioxidant-rich foods\n- Ensure adequate hydration (8 glasses daily)\n- Small, frequent meals to maintain energy levels",
            reminders: [
              "Take Donepezil (5mg) with breakfast",
              "Morning walk at 9:30 AM",
              "Brain training app for 15 minutes at 11:00 AM",
              "Family video call at 4:00 PM",
              "Evening medication at 8:00 PM"
            ]
          };
        } else if (stage === "moderate") {
          return {
            carePlan: "**Moderate Stage Care Plan**\n\n- Supervised daily activities\n- Regular cognitive stimulation therapy\n- Assistance with personal care as needed\n- Structured environment to reduce confusion\n- Weekly medical monitoring\n- Safety modifications to living space",
            dietPlan: "**Moderate Stage Diet Plan**\n\n- Nutrient-dense, easy to chew foods\n- Finger foods to encourage self-feeding\n- Avoid caffeine and alcohol\n- Monitor for swallowing difficulties\n- Supplement with vitamins B12, D, and E as recommended\n- Ensure regular meal times",
            reminders: [
              "Morning medication with breakfast (8:00 AM)",
              "Physical therapy exercises (10:00 AM)",
              "Memory activity with caregiver (1:00 PM)",
              "Afternoon rest period (3:00 PM)",
              "Evening medication (7:00 PM)",
              "Calming bedtime routine (9:00 PM)"
            ]
          };
        } else {
          return {
            carePlan: "**Advanced Stage Care Plan**\n\n- Full assistance with all activities of daily living\n- Comfort-focused care\n- Regular repositioning to prevent pressure sores\n- Sensory stimulation (music, touch, aromas)\n- Monitor for pain and discomfort\n- Specialized memory care services",
            dietPlan: "**Advanced Stage Diet Plan**\n\n- Soft or pureed foods as needed\n- High-calorie, nutrient-dense options\n- Thickened liquids if swallowing is compromised\n- Small, frequent feedings\n- Monitor for weight loss\n- Ensure proper hydration with assistance",
            reminders: [
              "Morning care routine (8:00 AM)",
              "Medication administration (9:00 AM, 1:00 PM, 7:00 PM)",
              "Gentle exercise/movement (11:00 AM)",
              "Repositioning schedule (every 2 hours)",
              "Music therapy session (3:00 PM)",
              "Evening comfort care (8:00 PM)"
            ]
          };
        }
      };
      
      if (patient) {
        setGeneratedContent(generateForStage(patient.stage));
      }
      
      toast({
        title: "Analysis Complete",
        description: "AI has generated personalized care and diet plans",
      });
    }, 5000);
  };

  const saveToPatientRecord = () => {
    toast({
      title: "Saved to Patient Record",
      description: `Plans and reminders saved to ${patients.find(p => p.id === selectedPatient)?.name}'s profile`,
    });
  };

  const loadPatientToChat = () => {
    const patient = patients.find(p => p.id === selectedPatient);
    if (!patient || !caseStudy) {
      toast({
        title: "Patient Data Incomplete",
        description: "Please ensure patient and case study are fully entered before loading to chat",
        variant: "destructive",
      });
      return;
    }

    dispatchPatientDataEvent({
      patient,
      caseStudy
    });
    
    toast({
      title: "Patient Loaded to Chat",
      description: `${patient.name}'s data has been loaded to chat. You can now ask questions about this patient.`,
    });
  };

  return (
    <Card className="glass-card mb-6">
      <CardContent className="p-4">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" /> Upload Patient Data
            </TabsTrigger>
            <TabsTrigger value="monitor">
              <HeartPulse className="h-4 w-4 mr-2" /> Monitor & Remind
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="patient-select">Select Patient</label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} ({patient.age}) - {patient.stage.charAt(0).toUpperCase() + patient.stage.slice(1)} Stage
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium" htmlFor="case-study">
                    Enter Case Study or Clinical Notes
                  </label>
                  <Button variant="outline" size="sm" className="h-7">
                    <Paperclip className="h-3.5 w-3.5 mr-1" />
                    Attach File
                  </Button>
                </div>
                <Textarea
                  id="case-study"
                  placeholder="Enter patient case study, observations, or clinical notes..."
                  value={caseStudy}
                  onChange={(e) => setCaseStudy(e.target.value)}
                  className="min-h-32 bg-white/70"
                />
              </div>
              
              <Button 
                onClick={handleProcessCaseStudy} 
                className="w-full bg-memora-purple hover:bg-memora-purple-dark"
                disabled={isProcessing || !selectedPatient || !caseStudy.trim()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Generate AI Recommendations
                  </>
                )}
              </Button>
              
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Analyzing case study...</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                </div>
              )}
              
              {generatedContent.carePlan && (
                <div className="space-y-4">
                  <div className="bg-white/70 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium flex items-center">
                        <ClipboardList className="h-4 w-4 mr-2 text-memora-purple" />
                        Care Plan
                      </h3>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                        AI Generated
                      </Badge>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-line">{generatedContent.carePlan}</div>
                    </div>
                  </div>
                  
                  <div className="bg-white/70 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-memora-purple" />
                        Diet Plan
                      </h3>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        AI Generated
                      </Badge>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-line">{generatedContent.dietPlan}</div>
                    </div>
                  </div>
                  
                  {generatedContent.reminders && (
                    <div className="bg-white/70 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-memora-purple" />
                          Daily Reminders
                        </h3>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          AI Generated
                        </Badge>
                      </div>
                      <ul className="space-y-2">
                        {generatedContent.reminders.map((reminder, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-memora-purple"></div>
                            <span className="text-sm">{reminder}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button onClick={saveToPatientRecord} className="flex-1 bg-memora-purple hover:bg-memora-purple-dark">
                      Save to Patient Record
                    </Button>
                    <Button onClick={loadPatientToChat} variant="outline" className="flex-1">
                      <User className="mr-2 h-4 w-4" />
                      Load to Chat
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="monitor" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="monitoring-patient">Select Patient to Monitor</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} ({patient.age})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-white/70 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-memora-purple" />
                Patient Monitoring
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select a patient above to view their real-time monitoring data and set up reminders.
              </p>
              <Button className="w-full bg-memora-purple hover:bg-memora-purple-dark">
                <User className="mr-2 h-4 w-4" />
                Load Patient to Chat
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
