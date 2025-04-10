
import Layout from "@/components/Layout";
import ChatInterface from "@/components/ChatInterface";
import PatientAIAssistant from "@/components/PatientAIAssistant";
import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import HuggingFaceLogin from "@/components/HuggingFaceLogin";

export default function Chat() {
  const [showCLILogin, setShowCLILogin] = useState(true);

  const handleLoginSuccess = () => {
    setShowCLILogin(false);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-memora-purple" />
              <h1 className="text-2xl font-bold">Memory Assistant Chat</h1>
            </div>
          </div>
          <p className="text-muted-foreground">
            Ask questions about Alzheimer's or request personalized help. Your AI companion can provide information, emotional support, and memory assistance.
          </p>
        </div>
        
        <PatientAIAssistant />
        
        {showCLILogin && (
          <div className="mb-6">
            <HuggingFaceLogin onLoginSuccess={handleLoginSuccess} />
          </div>
        )}
        
        <Card className="glass-card">
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="assistant" className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="assistant">
                  Personal Assistant
                </TabsTrigger>
                <TabsTrigger value="info">
                  Information Mode
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="assistant" className="mt-0">
                <ChatInterface />
              </TabsContent>
              
              <TabsContent value="info" className="mt-0">
                <div className="text-center py-8 px-4">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-memora-purple/70" />
                  <h2 className="text-xl font-bold mb-2">Information Mode</h2>
                  <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                    This mode provides factual information about Alzheimer's disease, treatments, and care strategies without personalization.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                    <div className="bg-white/70 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">About Alzheimer's Disease</h3>
                      <p className="text-sm text-muted-foreground">
                        Alzheimer's is a progressive brain disorder that slowly destroys memory and thinking skills. It's the most common cause of dementia in older adults.
                      </p>
                    </div>
                    <div className="bg-white/70 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Warning Signs</h3>
                      <p className="text-sm text-muted-foreground">
                        Memory loss disrupting daily life, challenges in planning or problem-solving, difficulty completing familiar tasks, and confusion with time or place.
                      </p>
                    </div>
                    <div className="bg-white/70 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Current Treatments</h3>
                      <p className="text-sm text-muted-foreground">
                        While there's no cure, medications can help manage symptoms. Non-drug approaches include cognitive stimulation and lifestyle modifications.
                      </p>
                    </div>
                    <div className="bg-white/70 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Caregiving Tips</h3>
                      <p className="text-sm text-muted-foreground">
                        Establish routines, simplify communication, create a safe environment, and focus on remaining abilities rather than lost ones.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
