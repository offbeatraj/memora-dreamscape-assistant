
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authenticateWithCLI, checkModelAccess } from "@/utils/aiModelUtils";

interface HuggingFaceLoginProps {
  onLoginSuccess?: () => void;
}

export default function HuggingFaceLogin({ onLoginSuccess }: HuggingFaceLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<"idle" | "success" | "error">("idle");
  const [modelAccessStatus, setModelAccessStatus] = useState<"idle" | "checking" | "granted" | "denied">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  
  // Authenticate automatically on component mount
  useEffect(() => {
    handleLogin();
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setAuthStatus("idle");
    setModelAccessStatus("checking");
    setErrorMessage("");

    try {
      console.log("Attempting authentication with permanent token");
      const isAuthenticated = await authenticateWithCLI();

      if (isAuthenticated) {
        setAuthStatus("success");
        toast({
          title: "Authentication Successful",
          description: "Your Hugging Face token has been validated"
        });

        // Check model access
        const hasAccess = await checkModelAccess();
        
        if (hasAccess) {
          setModelAccessStatus("granted");
          toast({
            title: "Mistral 7B Ready",
            description: "You have access to the Mistral 7B model"
          });
          
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        } else {
          setModelAccessStatus("denied");
          toast({
            title: "Model Access Denied",
            description: "You don't have access to Mistral 7B. Please request access on Hugging Face",
            variant: "destructive",
          });
          setErrorMessage("You don't have access to Mistral 7B. Please visit huggingface.co/mistralai/Mistral-7B-Instruct-v0.3 and request access to use this model.");
        }
      } else {
        setAuthStatus("error");
        setModelAccessStatus("idle");
        setErrorMessage("Invalid Hugging Face token or insufficient permissions. The token may not have read access to the Mistral model.");
        toast({
          title: "Authentication Failed",
          description: "Invalid Hugging Face token or insufficient permissions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
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
          Mistral 7B Status
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
                  <p className="text-sm text-amber-500">Authenticating...</p>
                </>
              )}
              {authStatus === "success" && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-600">Authenticated successfully</p>
                </>
              )}
              {authStatus === "error" && (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">Authentication failed</p>
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
                  <p className="text-sm text-amber-500">Checking access to Mistral 7B...</p>
                </>
              )}
              {modelAccessStatus === "granted" && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-600">Access to Mistral 7B granted</p>
                </>
              )}
              {modelAccessStatus === "denied" && (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">
                    Access denied. <a href="https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3" target="_blank" rel="noopener noreferrer" className="underline">Request access</a>
                  </p>
                </>
              )}
            </div>
          </div>

          {authStatus === "success" && modelAccessStatus === "granted" && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm text-green-700 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                You're all set! You can now use the Mistral 7B model.
              </p>
            </div>
          )}
          
          {authStatus === "error" && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-700">
                {errorMessage || "There was an issue authenticating with the Hugging Face API."}
              </p>
            </div>
          )}
          
          <div className="flex justify-center">
            <Button 
              onClick={handleLogin} 
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
