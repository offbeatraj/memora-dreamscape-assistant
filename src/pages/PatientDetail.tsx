
import { useState } from "react";
import Layout from "@/components/Layout";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Brain,
  FileText,
  Calendar,
  Clock,
  SquareCheck,
  PenLine,
  FileQuestion,
  UploadCloud,
  DownloadCloud,
  Heart,
  Utensils,
  Activity,
  MessageCircle
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface CareTask {
  id: string;
  title: string;
  description: string;
  frequency: string;
  status: "pending" | "completed" | "overdue";
}

interface DietItem {
  meal: string;
  food: string;
  time: string;
  notes?: string;
}

interface PatientNote {
  id: string;
  date: string;
  author: string;
  content: string;
  type: "medical" | "caregiver" | "cognitive" | "other";
}

export default function PatientDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("careplan");
  const [isEditMode, setIsEditMode] = useState(false);
  
  // This would be fetched from an API in a real application
  const patient = {
    id: id || "p1",
    name: "Eleanor Johnson",
    age: 73,
    gender: "Female",
    diagnosis: "Alzheimer's Disease",
    stage: "moderate",
    dateOfBirth: "1952-06-15",
    address: "123 Maple Street, Riverside, CA 92506",
    phone: "(555) 123-4567",
    emergencyContact: "Thomas Johnson (Son) - (555) 987-6543",
    primaryPhysician: "Dr. Sarah Williams",
    medications: [
      { name: "Donepezil", dosage: "10mg", frequency: "Once daily in the morning" },
      { name: "Memantine", dosage: "10mg", frequency: "Once daily in the evening" },
      { name: "Sertraline", dosage: "50mg", frequency: "Once daily in the morning" }
    ],
    allergies: ["Penicillin", "Shellfish"],
    medicalHistory: [
      "Hypertension (diagnosed 2015)",
      "Hip replacement surgery (2018)",
      "Mild depression (managed with medication)"
    ],
    cognitiveSummary: {
      memory: "Moderate decline - difficulty with short-term memory, can recall long-term memories",
      language: "Mild decline - occasional difficulty finding words",
      attention: "Moderate decline - easily distracted, difficulty following complex instructions",
      visualSpatial: "Moderate decline - occasional disorientation in unfamiliar environments",
      lastAssessment: "2025-03-28"
    },
    photo: "/placeholder.svg",
    careTasks: [
      { id: "t1", title: "Medication administration", description: "Ensure morning and evening medications are taken with food", frequency: "Twice daily", status: "completed" },
      { id: "t2", title: "Personal hygiene assistance", description: "Help with bathing and grooming as needed", frequency: "Daily", status: "pending" },
      { id: "t3", title: "Cognitive exercises", description: "Complete 15 minutes of memory exercises using the provided materials", frequency: "Daily", status: "pending" },
      { id: "t4", title: "Walking routine", description: "Assist with a 15-minute walk around the neighborhood", frequency: "Daily (weather permitting)", status: "overdue" },
      { id: "t5", title: "Social interaction", description: "Engage in conversation about family photos or past experiences", frequency: "Daily", status: "pending" }
    ],
    dietPlan: [
      { meal: "Breakfast", food: "Oatmeal with berries and honey; Orange juice (small)", time: "8:00 AM", notes: "Take morning medications after eating" },
      { meal: "Mid-morning snack", food: "Apple slices with almond butter", time: "10:30 AM" },
      { meal: "Lunch", food: "Grilled chicken salad with olive oil dressing; Whole grain bread", time: "12:30 PM" },
      { meal: "Afternoon snack", food: "Greek yogurt with walnuts", time: "3:30 PM" },
      { meal: "Dinner", food: "Baked salmon; Steamed vegetables; Brown rice", time: "6:00 PM", notes: "Take evening medications after eating" },
      { meal: "Evening snack", food: "Herbal tea with honey; Small banana", time: "8:00 PM" }
    ],
    notes: [
      { id: "n1", date: "2025-04-08", author: "Dr. Sarah Williams", content: "Patient showing stable cognitive function compared to last month. Continue current medication regimen.", type: "medical" },
      { id: "n2", date: "2025-04-06", author: "Thomas Johnson (Caregiver)", content: "Mom had a good day today. Successfully completed a 500-piece puzzle with minimal assistance. Seemed to enjoy the activity.", type: "caregiver" },
      { id: "n3", date: "2025-04-04", author: "Dr. Robert Chen", content: "Cognitive assessment shows slight improvement in attention span. Recommend continuing daily cognitive exercises.", type: "cognitive" },
      { id: "n4", date: "2025-04-01", author: "Thomas Johnson (Caregiver)", content: "Mom had difficulty recognizing her sister during video call today. Became agitated afterward. Will monitor for similar episodes.", type: "caregiver" }
    ]
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case "medical":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "caregiver":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cognitive":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start gap-6 mb-6">
          <Card className="glass-card w-full md:w-1/3">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center mb-4">
                <Avatar className="h-24 w-24 mb-3">
                  {patient.photo ? (
                    <img src={patient.photo} alt={patient.name} />
                  ) : (
                    <User className="h-12 w-12" />
                  )}
                </Avatar>
                <h1 className="text-2xl font-bold">{patient.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                    Alzheimer's
                  </Badge>
                  <Badge variant="outline" className={
                    patient.stage === "early" ? "bg-green-100 text-green-800 border-green-200" :
                    patient.stage === "moderate" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                    "bg-red-100 text-red-800 border-red-200"
                  }>
                    {patient.stage.charAt(0).toUpperCase() + patient.stage.slice(1)} Stage
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/70 p-3 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-1">
                    <User className="h-4 w-4 text-memora-purple" />
                    Personal Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Age:</span> {patient.age}</p>
                    <p><span className="text-muted-foreground">Gender:</span> {patient.gender}</p>
                    <p><span className="text-muted-foreground">Date of Birth:</span> {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {patient.phone}</p>
                    <p><span className="text-muted-foreground">Address:</span> {patient.address}</p>
                  </div>
                </div>
                
                <div className="bg-white/70 p-3 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-1">
                    <Heart className="h-4 w-4 text-memora-purple" />
                    Medical Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Primary Physician:</span> {patient.primaryPhysician}</p>
                    <p><span className="text-muted-foreground">Emergency Contact:</span> {patient.emergencyContact}</p>
                    <p><span className="text-muted-foreground">Allergies:</span> {patient.allergies.join(", ")}</p>
                  </div>
                </div>
                
                <div className="bg-white/70 p-3 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-1">
                    <Brain className="h-4 w-4 text-memora-purple" />
                    Cognitive Status
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Memory:</span> {patient.cognitiveSummary.memory}</p>
                    <p><span className="text-muted-foreground">Language:</span> {patient.cognitiveSummary.language}</p>
                    <p><span className="text-muted-foreground">Attention:</span> {patient.cognitiveSummary.attention}</p>
                    <p><span className="text-muted-foreground">Visual-Spatial:</span> {patient.cognitiveSummary.visualSpatial}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Last assessment: {new Date(patient.cognitiveSummary.lastAssessment).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="w-full" size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  Export Data
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <PenLine className="h-4 w-4 mr-1" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="w-full md:w-2/3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="careplan">
                  <SquareCheck className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden md:inline">Care Plan</span>
                </TabsTrigger>
                <TabsTrigger value="diet">
                  <Utensils className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden md:inline">Diet Plan</span>
                </TabsTrigger>
                <TabsTrigger value="notes">
                  <MessageCircle className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden md:inline">Notes</span>
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileQuestion className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden md:inline">Documents</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="careplan">
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-memora-purple" />
                        Care Plan
                      </CardTitle>
                      <Button 
                        variant={isEditMode ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={isEditMode ? "bg-memora-purple hover:bg-memora-purple-dark" : ""}
                      >
                        <PenLine className="h-4 w-4 mr-1" />
                        {isEditMode ? "Save Changes" : "Edit Plan"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {patient.careTasks.map((task) => (
                        <div key={task.id} className="bg-white/70 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{task.title}</h3>
                            <Badge variant="outline" className={getStatusColor(task.status)}>
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{task.frequency}</span>
                          </div>
                          
                          {isEditMode && (
                            <div className="mt-3 flex justify-end gap-2">
                              <Button variant="outline" size="sm">
                                Mark Complete
                              </Button>
                              <Button variant="destructive" size="sm">
                                Remove
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {isEditMode && (
                        <div className="bg-white/70 p-4 rounded-lg border-2 border-dashed border-memora-purple/30">
                          <h3 className="font-medium mb-3">Add New Care Task</h3>
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="new-task-title">Task Title</Label>
                              <Input id="new-task-title" placeholder="Enter task title" className="bg-white/70" />
                            </div>
                            <div>
                              <Label htmlFor="new-task-description">Description</Label>
                              <Textarea id="new-task-description" placeholder="Enter task description" className="bg-white/70" />
                            </div>
                            <div>
                              <Label htmlFor="new-task-frequency">Frequency</Label>
                              <Input id="new-task-frequency" placeholder="E.g., Daily, Weekly, As needed" className="bg-white/70" />
                            </div>
                            <Button className="w-full bg-memora-purple hover:bg-memora-purple-dark">
                              Add Task
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="diet">
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Utensils className="h-5 w-5 text-memora-purple" />
                        Nutrition & Diet Plan
                      </CardTitle>
                      <Button variant="outline" size="sm">
                        <PenLine className="h-4 w-4 mr-1" />
                        Edit Diet
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {patient.dietPlan.map((item, index) => (
                        <div key={index} className="bg-white/70 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{item.meal}</h3>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                              {item.time}
                            </Badge>
                          </div>
                          <p className="text-sm mb-1">{item.food}</p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-2">
                              <span className="font-medium">Note:</span> {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                      
                      <div className="bg-blue-50/70 p-4 rounded-lg">
                        <h3 className="font-medium mb-2 text-blue-800">Dietary Recommendations</h3>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Maintain a Mediterranean-style diet rich in fruits, vegetables, and lean proteins</li>
                          <li>• Limit sugar intake, especially processed foods and sweetened beverages</li>
                          <li>• Ensure adequate hydration throughout the day (reminder: at least 6 glasses of water)</li>
                          <li>• Monitor for difficulty swallowing and adjust food textures as needed</li>
                          <li>• Small, frequent meals may be better tolerated than three large meals</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notes">
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-memora-purple" />
                        Patient Notes
                      </CardTitle>
                      <Button className="bg-memora-purple hover:bg-memora-purple-dark" size="sm">
                        <PenLine className="h-4 w-4 mr-1" />
                        Add Note
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {patient.notes.map((note) => (
                        <div key={note.id} className="bg-white/70 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{note.author}</h3>
                            <Badge variant="outline" className={getNoteTypeColor(note.type)}>
                              {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{note.content}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{new Date(note.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                      
                      <div className="bg-white/70 p-4 rounded-lg border-2 border-dashed border-memora-purple/30">
                        <h3 className="font-medium mb-3">Add New Note</h3>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="note-type">Note Type</Label>
                            <select id="note-type" className="w-full h-10 px-3 py-2 rounded-md border bg-white/70">
                              <option value="medical">Medical</option>
                              <option value="caregiver">Caregiver</option>
                              <option value="cognitive">Cognitive</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="note-content">Note Content</Label>
                            <Textarea id="note-content" placeholder="Enter your note here..." className="bg-white/70" rows={4} />
                          </div>
                          <Button className="w-full bg-memora-purple hover:bg-memora-purple-dark">
                            Save Note
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents">
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <FileQuestion className="h-5 w-5 text-memora-purple" />
                        Patient Documents
                      </CardTitle>
                      <Button className="bg-memora-purple hover:bg-memora-purple-dark" size="sm">
                        <UploadCloud className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-white/70 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">Medical Assessment Report</h3>
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                            Medical
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">Comprehensive neurological assessment - Dr. Sarah Williams</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>April 2, 2025</span>
                          </div>
                          <Button variant="outline" size="sm">
                            <DownloadCloud className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-white/70 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">Brain MRI Scan Results</h3>
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                            Medical
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">Riverside Medical Center - Radiology Department</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>March 28, 2025</span>
                          </div>
                          <Button variant="outline" size="sm">
                            <DownloadCloud className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-white/70 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">Medication History</h3>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                            Pharmacy
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">Complete prescription history - Citywide Pharmacy</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>April 1, 2025</span>
                          </div>
                          <Button variant="outline" size="sm">
                            <DownloadCloud className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-white/70 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">Cognitive Assessment Scores</h3>
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                            Assessment
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">Memory and executive function testing results</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>March 28, 2025</span>
                          </div>
                          <Button variant="outline" size="sm">
                            <DownloadCloud className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-4 border-2 border-dashed border-memora-purple/30 rounded-lg flex flex-col items-center justify-center">
                        <UploadCloud className="h-10 w-10 text-memora-purple/50 mb-2" />
                        <p className="text-sm text-muted-foreground">Drop files here or click to upload</p>
                        <Button variant="link" size="sm" className="text-memora-purple">
                          Browse Files
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
