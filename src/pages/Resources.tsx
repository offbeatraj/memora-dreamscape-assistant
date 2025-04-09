
import Layout from "@/components/Layout";
import QuestionGenerator from "@/components/QuestionGenerator";
import EnhancedFileProcessor from "@/components/EnhancedFileProcessor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Brain,
  FileQuestion,
  Play,
  Sparkles,
  CheckCircle2,
  Utensils,
  Activity,
  Book
} from "lucide-react";

export default function Resources() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-memora-purple" />
            <h1 className="text-2xl font-bold">Resources & Tools</h1>
          </div>
          <p className="text-muted-foreground">
            Access helpful resources, generate care questions, and process patient documents.
          </p>
        </div>

        <Tabs defaultValue="tools" className="mb-6">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="tools">
              <Sparkles className="h-4 w-4 mr-2" />
              Care Tools
            </TabsTrigger>
            <TabsTrigger value="resources">
              <BookOpen className="h-4 w-4 mr-2" />
              Educational Resources
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileQuestion className="h-4 w-4 mr-2" />
              Document Processing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QuestionGenerator />
              
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-memora-purple" />
                    Daily Activity Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-white/70 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Cognitive Stimulation</h3>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                          Memory
                        </Badge>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>Simple jigsaw puzzles (25-100 pieces)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>Sorting activities using familiar objects by color or shape</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>Reminiscence therapy: Looking at old photographs and discussing memories</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-white/70 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Physical Activities</h3>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Exercise
                        </Badge>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <Activity className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <span>Gentle chair exercises focusing on flexibility (15 minutes)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Activity className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <span>Short, supervised walks in a familiar environment</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Activity className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <span>Simple gardening activities like watering plants</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-white/70 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Social & Creative Activities</h3>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          Engagement
                        </Badge>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <Play className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>Music therapy: Listening to favorite songs from younger years</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Play className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>Simple art projects with non-toxic materials</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Play className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>Pet therapy sessions with calm, trained animals</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-memora-purple" />
                  Nutrition Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/70 rounded-lg">
                    <h3 className="font-medium mb-3 text-green-700">Brain-Healthy Foods</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0 mt-1.5" />
                        <span>Fatty fish rich in omega-3s (salmon, mackerel)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0 mt-1.5" />
                        <span>Berries (blueberries, strawberries)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0 mt-1.5" />
                        <span>Leafy green vegetables</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0 mt-1.5" />
                        <span>Nuts and seeds</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0 mt-1.5" />
                        <span>Whole grains</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-white/70 rounded-lg">
                    <h3 className="font-medium mb-3 text-red-700">Foods to Limit</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                        <span>Processed foods high in sodium</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                        <span>Refined sugars and sweets</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                        <span>Red and processed meats</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                        <span>Fried foods</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                        <span>Excessive alcohol</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-white/70 rounded-lg">
                    <h3 className="font-medium mb-3 text-blue-700">Mealtime Tips</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        <span>Serve small, frequent meals rather than large ones</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        <span>Use contrasting colors (white plate on dark placemat)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        <span>Limit distractions during meals</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        <span>Encourage independence but provide assistance as needed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        <span>Ensure adequate hydration throughout the day</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="resources">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5 text-memora-purple" />
                    Educational Articles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/70 rounded-lg">
                      <h3 className="font-medium mb-1">Understanding Alzheimer's Progression</h3>
                      <p className="text-sm text-muted-foreground">A comprehensive guide to the different stages of Alzheimer's disease</p>
                    </div>
                    <div className="p-3 bg-white/70 rounded-lg">
                      <h3 className="font-medium mb-1">Communication Strategies</h3>
                      <p className="text-sm text-muted-foreground">Effective ways to maintain meaningful communication</p>
                    </div>
                    <div className="p-3 bg-white/70 rounded-lg">
                      <h3 className="font-medium mb-1">Managing Behavioral Changes</h3>
                      <p className="text-sm text-muted-foreground">Techniques for addressing common behavioral symptoms</p>
                    </div>
                    <div className="p-3 bg-white/70 rounded-lg">
                      <h3 className="font-medium mb-1">Latest Research Updates</h3>
                      <p className="text-sm text-muted-foreground">Recent advances in Alzheimer's research and treatments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-memora-purple" />
                    Video Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/70 rounded-lg">
                      <h3 className="font-medium mb-1">Caregiver Training Series</h3>
                      <p className="text-sm text-muted-foreground">5-part video series on essential caregiving skills</p>
                    </div>
                    <div className="p-3 bg-white/70 rounded-lg">
                      <h3 className="font-medium mb-1">Memory Exercises Tutorial</h3>
                      <p className="text-sm text-muted-foreground">Guided demonstration of cognitive exercises</p>
                    </div>
                    <div className="p-3 bg-white/70 rounded-lg">
                      <h3 className="font-medium mb-1">Expert Interviews</h3>
                      <p className="text-sm text-muted-foreground">Conversations with leading neurologists and researchers</p>
                    </div>
                    <div className="p-3 bg-white/70 rounded-lg">
                      <h3 className="font-medium mb-1">Patient Stories</h3>
                      <p className="text-sm text-muted-foreground">Personal journeys of patients and families</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-memora-purple" />
                    Support Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/70 rounded-lg">
                      <h3 className="font-medium mb-1">Alzheimer's Association</h3>
                      <p className="text-sm text-muted-foreground">24/7 Helpline: 800-272-3900</p>
                    </div>
                    <div className="p-3 bg-white/70 rounded-lg">
                      <h3 className="font-medium mb-1">Virtual Support Groups</h3>
                      <p className="text-sm text-muted-foreground">Weekly online meetings for caregivers</p>
                    </div>
                    <div className="p-3 bg-white/70 rounded-lg">
                      <h3 className="font-medium mb-1">Community Resources Finder</h3>
                      <p className="text-sm text-muted-foreground">Locate services in your area</p>
                    </div>
                    <div className="p-3 bg-white/70 rounded-lg">
                      <h3 className="font-medium mb-1">Legal & Financial Planning</h3>
                      <p className="text-sm text-muted-foreground">Resources for long-term planning</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-memora-purple" />
                  Latest Research & Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/70 p-4 rounded-lg">
                      <Badge variant="outline" className="mb-2 bg-purple-100 text-purple-800 border-purple-200">Research</Badge>
                      <h3 className="font-medium mb-2">New Study Shows Promise in Early Alzheimer's Detection</h3>
                      <p className="text-sm text-muted-foreground mb-3">Researchers have developed a blood test that can detect biomarkers associated with Alzheimer's up to 10 years before symptoms appear, potentially allowing for earlier intervention.</p>
                      <p className="text-xs text-muted-foreground">Published: April 2, 2025 • Journal of Neuroscience</p>
                    </div>
                    
                    <div className="bg-white/70 p-4 rounded-lg">
                      <Badge variant="outline" className="mb-2 bg-blue-100 text-blue-800 border-blue-200">Treatment</Badge>
                      <h3 className="font-medium mb-2">Combined Therapy Approach Shows Improved Outcomes</h3>
                      <p className="text-sm text-muted-foreground mb-3">A clinical trial combining medication therapy with structured cognitive stimulation exercises demonstrated significantly better outcomes than medication alone.</p>
                      <p className="text-xs text-muted-foreground">Published: March 15, 2025 • Alzheimer's & Dementia Journal</p>
                    </div>
                    
                    <div className="bg-white/70 p-4 rounded-lg">
                      <Badge variant="outline" className="mb-2 bg-green-100 text-green-800 border-green-200">Lifestyle</Badge>
                      <h3 className="font-medium mb-2">Mediterranean Diet Linked to Reduced Cognitive Decline</h3>
                      <p className="text-sm text-muted-foreground mb-3">A 10-year longitudinal study confirms that adherence to a Mediterranean diet may reduce the risk of cognitive decline and Alzheimer's disease by up to 53%.</p>
                      <p className="text-xs text-muted-foreground">Published: March 28, 2025 • Nutrition Reviews</p>
                    </div>
                    
                    <div className="bg-white/70 p-4 rounded-lg">
                      <Badge variant="outline" className="mb-2 bg-amber-100 text-amber-800 border-amber-200">Technology</Badge>
                      <h3 className="font-medium mb-2">AI-Powered Tools Show Promise in Alzheimer's Care</h3>
                      <p className="text-sm text-muted-foreground mb-3">New digital platforms using artificial intelligence are helping caregivers provide more effective and personalized care for Alzheimer's patients at home.</p>
                      <p className="text-xs text-muted-foreground">Published: April 5, 2025 • Digital Health Today</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents">
            <EnhancedFileProcessor />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
