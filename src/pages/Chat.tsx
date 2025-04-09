
import Layout from "@/components/Layout";
import ChatInterface from "@/components/ChatInterface";
import { Brain } from "lucide-react";

export default function Chat() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-5 w-5 text-memora-purple" />
            <h1 className="text-2xl font-bold">Memory Assistant Chat</h1>
          </div>
          <p className="text-muted-foreground">
            Ask questions about Alzheimer's or request personalized help. Your conversation history is saved to provide better assistance.
          </p>
        </div>
        
        <ChatInterface />
      </div>
    </Layout>
  );
}
