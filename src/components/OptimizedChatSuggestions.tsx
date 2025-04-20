
import { Button } from "@/components/ui/button";
import { memo } from "react";

interface ChatSuggestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
  isPatientMode?: boolean;
}

// Create a memoized component for suggestions to prevent unnecessary re-renders
const OptimizedChatSuggestions = memo(function OptimizedChatSuggestions({
  questions,
  onSelectQuestion,
  isPatientMode = false,
}: ChatSuggestionsProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {questions.map((question, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelectQuestion(question)}
          className={`text-xs ${
            isPatientMode 
              ? "bg-white/80 hover:bg-white transition-all duration-300 border-memora-purple/20" 
              : "bg-white/80 hover:bg-white transition-all duration-300 hover:shadow-sm"
          }`}
        >
          {question.length > 40 ? question.substring(0, 37) + "..." : question}
        </Button>
      ))}
    </div>
  );
});

export default OptimizedChatSuggestions;
