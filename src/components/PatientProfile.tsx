
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Calendar, Clock, ListTodo, AlertTriangle, Activity, Heart } from "lucide-react";

export default function PatientProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const cognitiveStatus = {
    memory: "Moderate decline",
    attention: "Mild decline",
    language: "Stable",
    visualSpatial: "Moderate decline",
    lastAssessment: "2025-03-28",
  };
  
  const upcomingReminders = [
    { id: 1, time: "08:00 AM", task: "Morning medication", priority: "high" },
    { id: 2, time: "12:30 PM", task: "Lunch with family", priority: "medium" },
    { id: 3, time: "03:00 PM", task: "Doctor's appointment", priority: "high" },
    { id: 4, time: "07:00 PM", task: "Evening medication", priority: "high" },
  ];
  
  const recentActivities = [
    { id: 1, date: "Today", activity: "Completed memory game - 8 min" },
    { id: 2, date: "Today", activity: "Morning walk - 15 min" },
    { id: 3, date: "Yesterday", activity: "Family video call - 25 min" },
    { id: 4, date: "Yesterday", activity: "Reading session - 30 min" },
  ];
  
  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
          <div>
            <CardTitle className="text-xl font-semibold">Patient Profile</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: April 8, 2025</p>
          </div>
          <Button size="sm" variant="outline">Edit Profile</Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4 bg-background/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-memora-purple data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="reminders" className="data-[state=active]:bg-memora-purple data-[state=active]:text-white">
              Reminders
            </TabsTrigger>
            <TabsTrigger value="activities" className="data-[state=active]:bg-memora-purple data-[state=active]:text-white">
              Activities
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <div className="grid gap-4">
              <div className="bg-white/70 p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-memora-purple" />
                  <h3 className="font-medium">Cognitive Status</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Memory</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                        Moderate decline
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Attention</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Mild decline
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Language</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        Stable
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Visual-Spatial</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                        Moderate decline
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Last Assessment: March 28, 2025</p>
                </div>
              </div>
              
              <div className="bg-white/70 p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-memora-purple" />
                    <h3 className="font-medium">Well-being Summary</h3>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="bg-blue-50 p-3 rounded-md text-center">
                    <p className="text-2xl font-semibold text-blue-700">82%</p>
                    <p className="text-xs text-blue-600">Sleep Quality</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md text-center">
                    <p className="text-2xl font-semibold text-green-700">65%</p>
                    <p className="text-xs text-green-600">Activity Level</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-md text-center">
                    <p className="text-2xl font-semibold text-purple-700">78%</p>
                    <p className="text-xs text-purple-600">Mood Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reminders" className="mt-0">
            <div className="space-y-3">
              {upcomingReminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center gap-3 bg-white/70 p-3 rounded-lg shadow-sm">
                  <div className={`p-2 rounded-full ${
                    reminder.priority === "high" ? "bg-red-100" : "bg-yellow-100"
                  }`}>
                    <Clock className={`h-4 w-4 ${
                      reminder.priority === "high" ? "text-red-500" : "text-yellow-500"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{reminder.task}</p>
                    <p className="text-sm text-muted-foreground">{reminder.time}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ListTodo className="h-4 w-4 mr-1" />
                    Mark Done
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2">
                <Calendar className="h-4 w-4 mr-2" />
                Add New Reminder
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="activities" className="mt-0">
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 bg-white/70 p-3 rounded-lg shadow-sm">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Activity className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.activity}</p>
                    <p className="text-sm text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2">
                <Activity className="h-4 w-4 mr-2" />
                View All Activities
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
