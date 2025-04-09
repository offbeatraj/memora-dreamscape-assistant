
import Layout from "@/components/Layout";
import PatientProfile from "@/components/PatientProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, FileText, Brain, MessageSquare, Activity } from "lucide-react";

export default function Dashboard() {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Memory Support Dashboard</h1>
        <p className="text-muted-foreground">
          Track cognitive health, daily activities, and access support resources.
        </p>
      </div>
      
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
                  <p className="text-2xl font-bold">4</p>
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
                  <p className="text-2xl font-bold">12</p>
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
                  <p className="text-2xl font-bold">75%</p>
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
                    <div className="bg-white/70 p-3 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="bg-memora-purple/20 p-2 rounded-full shrink-0">
                          <Brain className="h-4 w-4 text-memora-purple" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">Memory Support</p>
                          <p className="text-sm">Remember to take your medication at 7:00 PM with dinner. I'll send you a reminder when it's time.</p>
                          <p className="text-xs text-muted-foreground mt-1">Today at 2:34 PM</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/70 p-3 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="bg-memora-purple/20 p-2 rounded-full shrink-0">
                          <Brain className="h-4 w-4 text-memora-purple" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">Family Visit</p>
                          <p className="text-sm">Your daughter Sarah is coming to visit this weekend. She mentioned bringing photos from your trip to the lake last summer.</p>
                          <p className="text-xs text-muted-foreground mt-1">Yesterday at 6:15 PM</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="recent">
                  <div className="space-y-3">
                    <div className="bg-white/70 p-3 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="bg-memora-purple/20 p-2 rounded-full shrink-0">
                          <Brain className="h-4 w-4 text-memora-purple" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">Today's Weather</p>
                          <p className="text-sm">It's sunny and 72°F outside today. A perfect day for a short walk in the garden.</p>
                          <p className="text-xs text-muted-foreground mt-1">Today at 9:12 AM</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/70 p-3 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="bg-memora-purple/20 p-2 rounded-full shrink-0">
                          <Brain className="h-4 w-4 text-memora-purple" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">Memory Exercise</p>
                          <p className="text-sm">We completed a memory game this morning. You correctly identified 8 out of 10 items - that's 20% better than last week!</p>
                          <p className="text-xs text-muted-foreground mt-1">Today at 11:45 AM</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <PatientProfile />
          
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
    </Layout>
  );
}
