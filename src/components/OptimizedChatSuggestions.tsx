
import { useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OptimizedChatSuggestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
  isPatientMode?: boolean;
}

export default function OptimizedChatSuggestions({
  questions,
  onSelectQuestion,
  isPatientMode = false
}: OptimizedChatSuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const displayedQuestions = isExpanded ? questions : questions.slice(0, 3);

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className="h-4 w-4 text-memora-purple" />
        <h3 className="text-sm font-medium">
          {isPatientMode ? "Patient-specific questions" : "Suggested questions"}
        </h3>
        {questions.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2 text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show More
              </>
            )}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {displayedQuestions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className={`text-left justify-start h-auto py-2 text-sm ${
              isPatientMode ? "bg-memora-purple/5 border-memora-purple/20" : ""
            }`}
            onClick={() => onSelectQuestion(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}
