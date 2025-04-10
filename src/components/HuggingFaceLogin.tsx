
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, Key, Terminal, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authenticateWithCLI, checkModelAccess, setHuggingFaceToken } from "@/utils/aiModelUtils";

interface HuggingFaceLoginProps {
  onLoginSuccess?: (token: string) => void;
  modelId?: string;
}

export default function HuggingFaceLogin({ onLoginSuccess, modelId = "mistralai/Mistral-7B-Instruct-v0.3" }: HuggingFaceLoginProps) {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<"idle" | "success" | "error">("idle");
  const [modelAccessStatus, setModelAccessStatus] = useState<"idle" | "checking" | "granted" | "denied">("idle");
  const [showToken, setShowToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!token.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter your Hugging Face token",
        variant: "destructive",
      });
      return;
    }

    if (!token.trim().startsWith("hf_")) {
      toast({
        title: "Invalid Token Format",
        description: "Hugging Face tokens must start with 'hf_'",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAuthStatus("idle");
    setModelAccessStatus("checking");
    setErrorMessage("");

    try {
      console.log("Attempting authentication with token:", token.substring(0, 5) + "...");
      const isAuthenticated = await authenticateWithCLI(token);

      if (isAuthenticated) {
        setAuthStatus("success");
        toast({
          title: "Authentication Successful",
          description: "Your Hugging Face token has been validated",
        });

        // Check model access
        const hasAccess = await checkModelAccess(modelId);
        
        if (hasAccess) {
          setModelAccessStatus("granted");
          toast({
            title: "Model Access Granted",
            description: `You have access to ${modelId}`,
          });
          
          if (onLoginSuccess) {
            onLoginSuccess(token);
          }
        } else {
          setModelAccessStatus("denied");
          toast({
            title: "Model Access Denied",
            description: `You don't have access to ${modelId}. Please request access on Hugging Face`,
            variant: "destructive",
          });
        }
      } else {
        setAuthStatus("error");
        setModelAccessStatus("idle");
        setErrorMessage("Invalid Hugging Face token or insufficient permissions. The token may not have read access to this model.");
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
          CLI Login for Mistral 7B
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm">
            <p>$ huggingface-cli login</p>
            <p className="mt-1">Enter your Hugging Face token:</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hf-token">Hugging Face Token</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="hf-token"
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="hf_..."
                  disabled={isLoading || authStatus === "success"}
                  className="pr-10"
                />
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-0 top-0 h-full px-3"
                  disabled={isLoading}
                >
                  {showToken ? "Hide" : "Show"}
                </Button>
              </div>
              <Button 
                onClick={handleLogin} 
                disabled={isLoading || !token.trim() || authStatus === "success"}
                className={authStatus === "success" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : authStatus === "success" ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                {authStatus === "success" ? "Authenticated" : "Login"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Authentication Status</p>
            <div className="flex items-center gap-2">
              {authStatus === "idle" && !isLoading && (
                <p className="text-sm text-muted-foreground">Not authenticated</p>
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
                  <p className="text-sm text-green-600">Token authenticated successfully</p>
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
                  <p className="text-sm text-amber-500">Checking access to {modelId}...</p>
                </>
              )}
              {modelAccessStatus === "granted" && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-600">Access to {modelId} granted</p>
                </>
              )}
              {modelAccessStatus === "denied" && (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">
                    Access denied. <a href={`https://huggingface.co/${modelId}`} target="_blank" rel="noopener noreferrer" className="underline">Request access</a>
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
                {errorMessage || "Make sure you're using a valid Hugging Face token."} You can create or find your token at{" "}
                <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">
                  huggingface.co/settings/tokens
                </a>
              </p>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            <p>To use Mistral 7B, you need:</p>
            <ol className="list-decimal ml-4 mt-1 space-y-1">
              <li>A Hugging Face account</li>
              <li>A valid access token with read permissions</li>
              <li>Model access granted on the Hugging Face platform</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
