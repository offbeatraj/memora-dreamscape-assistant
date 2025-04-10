
import Layout from "@/components/Layout";
import ChatInterface from "@/components/ChatInterface";
import PatientAIAssistant from "@/components/PatientAIAssistant";
import { Brain, Settings, Key, Info, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { setHuggingFaceToken, getHuggingFaceToken } from "@/utils/aiModelUtils";

// Model information including access requirements
const modelInfo = {
  "default": { name: "Default", requiresToken: false },
  "gpt2": { name: "GPT-2", requiresToken: false },
  "llama-2": { name: "Llama-2", requiresToken: true },
  "flan-t5": { name: "FLAN-T5", requiresToken: false },
  "mistral": { name: "Mistral-7B-Instruct", requiresToken: true }
};

export default function Chat() {
  const [aiModel, setAiModel] = useState("default");
  const [hfToken, setHfToken] = useState("");
  const [tokenVisible, setTokenVisible] = useState(false);

  // Initialize the token input field with any existing token
  useEffect(() => {
    const currentToken = getHuggingFaceToken();
    if (currentToken) {
      setHfToken(currentToken);
    }
  }, []);

  const saveHuggingFaceToken = () => {
    if (hfToken.trim().length < 5) {
      toast({
        title: "Invalid Token",
        description: "Please enter a valid Hugging Face token.",
        variant: "destructive",
      });
      return;
    }

    if (setHuggingFaceToken(hfToken)) {
      toast({
        title: "Token saved",
        description: "Your Hugging Face token has been saved successfully.",
      });
    } else {
      toast({
        title: "Error saving token",
        description: "There was an issue saving your Hugging Face token.",
        variant: "destructive",
      });
    }
  };

  const toggleTokenVisibility = () => {
    setTokenVisible(!tokenVisible);
  };

  const handleModelChange = (value: string) => {
    if (modelInfo[value as keyof typeof modelInfo]?.requiresToken && !getHuggingFaceToken()) {
      toast({
        title: "Token Required",
        description: `The ${modelInfo[value as keyof typeof modelInfo]?.name} model requires a Hugging Face token. Please add your token in settings.`,
        variant: "warning",
      });
    }
    setAiModel(value);
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <Settings className="h-4 w-4" />
                  <span>Model: {modelInfo[aiModel as keyof typeof modelInfo]?.name || "Default"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="end">
                <div className="p-3">
                  <p className="text-sm font-medium mb-2">Select AI Model</p>
                  <Select
                    value={aiModel}
                    onValueChange={handleModelChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(modelInfo).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{info.name}</span>
                            {info.requiresToken && (
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="mt-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="hfToken" className="text-sm font-medium">
                        Hugging Face Access Token
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="hfToken"
                            type={tokenVisible ? "text" : "password"}
                            value={hfToken}
                            onChange={(e) => setHfToken(e.target.value)}
                            placeholder="hf_..."
                            className="pr-10"
                          />
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="sm"
                            onClick={toggleTokenVisibility}
                            className="absolute right-0 top-0 h-full px-3"
                          >
                            {tokenVisible ? "Hide" : "Show"}
                          </Button>
                        </div>
                        <Button size="sm" onClick={saveHuggingFaceToken} className="whitespace-nowrap">
                          <Key className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Required for models marked with <AlertTriangle className="h-3 w-3 text-amber-500 inline" />. Get your token at <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">huggingface.co</a>
                      </p>
                      {modelInfo[aiModel as keyof typeof modelInfo]?.requiresToken && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                          <p className="text-xs text-yellow-700">
                            <Info className="h-3 w-3 inline mr-1" />
                            For Mistral and Llama-2 models, you need to request and be granted model access on Hugging Face.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-muted-foreground">
            Ask questions about Alzheimer's or request personalized help. Your AI companion can provide information, emotional support, and memory assistance.
          </p>
        </div>
        
        <PatientAIAssistant />
        
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
                <ChatInterface aiModel={aiModel} />
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
