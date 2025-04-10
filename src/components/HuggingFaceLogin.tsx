
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hasOpenAIAccess } from "@/utils/aiModelUtils";

interface HuggingFaceLoginProps {
  onLoginSuccess?: () => void;
}

export default function HuggingFaceLogin({ onLoginSuccess }: HuggingFaceLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<"idle" | "success" | "error">("idle");
  const [modelAccessStatus, setModelAccessStatus] = useState<"idle" | "checking" | "granted" | "denied">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  
  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    setAuthStatus("idle");
    setModelAccessStatus("checking");
    setErrorMessage("");

    try {
      // Since we're using OpenAI now instead of HuggingFace, we'll check if OpenAI access is available
      const hasAccess = hasOpenAIAccess();
      
      if (hasAccess) {
        setAuthStatus("success");
        setModelAccessStatus("granted");
        toast({
          title: "Authentication Successful",
          description: "OpenAI access is available"
        });
        
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        setAuthStatus("error");
        setModelAccessStatus("denied");
        setErrorMessage("No OpenAI API key provided. You can add one in the settings to enable advanced AI capabilities.");
        toast({
          title: "OpenAI Access Unavailable",
          description: "Please add an OpenAI API key to enable advanced features",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthStatus("error");
      setModelAccessStatus("idle");
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred");
      toast({
        title: "Authentication Error",
        description: "An error occurred during authentication",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-memora-purple" />
          AI Model Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Authentication Status</p>
            <div className="flex items-center gap-2">
              {authStatus === "idle" && !isLoading && (
                <p className="text-sm text-muted-foreground">Checking authentication...</p>
              )}
              {isLoading && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  <p className="text-sm text-amber-500">Checking access...</p>
                </>
              )}
              {authStatus === "success" && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-600">Authentication successful</p>
                </>
              )}
              {authStatus === "error" && (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">Authentication unavailable</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Model Access Status</p>
            <div className="flex items-center gap-2">
              {modelAccessStatus === "idle" && (
                <p className="text-sm text-muted-foreground">Not checked</p>
              )}
              {modelAccessStatus === "checking" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  <p className="text-sm text-amber-500">Checking OpenAI access...</p>
                </>
              )}
              {modelAccessStatus === "granted" && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-600">Access to OpenAI granted</p>
                </>
              )}
              {modelAccessStatus === "denied" && (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">
                    OpenAI access unavailable
                  </p>
                </>
              )}
            </div>
          </div>

          {authStatus === "success" && modelAccessStatus === "granted" && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm text-green-700 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                You're all set! You can now use the OpenAI model.
              </p>
            </div>
          )}
          
          {authStatus === "error" && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-700">
                {errorMessage || "There was an issue authenticating."}
              </p>
            </div>
          )}
          
          <div className="flex justify-center">
            <Button 
              onClick={checkAuthStatus} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Terminal className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Checking..." : "Retry Authentication"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
