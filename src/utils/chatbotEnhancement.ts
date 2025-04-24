
// Define question categories with improved patterns for better classification
interface QuestionPattern {
  category: string;
  patterns: RegExp[];
  contextImportance: number; // 1-10, how important is context for this type of question
}

// Enhanced patterns for question classification
export const questionPatterns: QuestionPattern[] = [
  {
    category: "medical",
    patterns: [
      /medication|medicine|drug|treatment|therapy|prescription|dose|side effect|clinical|symptom|diagnosis/i,
      /disease|condition|disorder|syndrome|doctor|nurse|hospital|clinic|medical|healthcare/i,
      /test|scan|exam|blood|urine|sample|specimen|result|report|referral|specialist/i
    ],
    contextImportance: 10
  },
  {
    category: "daily_care",
    patterns: [
      /bath|shower|dress|groom|toilet|hygiene|eat|drink|meal|food|diet|nutrition/i,
      /sleep|rest|bed|chair|sit|stand|walk|move|transfer|mobility|exercise|activity/i,
      /clean|tidy|housekeeping|laundry|dishes|cooking|shopping|errand/i
    ],
    contextImportance: 7
  },
  {
    category: "emotional",
    patterns: [
      /feel|feeling|emotion|mood|happy|sad|angry|upset|anxious|worried|scared|afraid/i,
      /stress|depression|anxiety|grief|loss|cope|coping|support|comfort|reassure/i,
      /lonely|alone|isolated|connect|relationship|family|friend|social|community/i
    ],
    contextImportance: 8
  },
  {
    category: "memory",
    patterns: [
      /remember|forget|memory|recall|recognize|familiar|confusion|disoriented|lost/i,
      /time|date|day|month|year|season|clock|calendar|schedule|appointment|reminder/i,
      /name|face|place|event|story|past|history|childhood|young|earlier/i
    ],
    contextImportance: 9
  },
  {
    category: "safety",
    patterns: [
      /safe|safety|danger|risk|hazard|accident|injury|fall|burn|cut|wound/i,
      /wander|lost|escape|leave|door|lock|alarm|alert|monitor|supervision/i,
      /fire|smoke|heat|cold|weather|emergency|help|assistance|aid|support/i
    ],
    contextImportance: 9
  },
  {
    category: "general_knowledge",
    patterns: [
      /what is|what are|who is|who are|where is|where are|when is|when was|how does|why does/i,
      /explain|describe|define|meaning|definition|concept|fact|information|knowledge|learn/i,
      /history|science|math|art|literature|geography|technology|sports|entertainment/i
    ],
    contextImportance: 3
  },
  {
    category: "current_events",
    patterns: [
      /news|current|recent|latest|today|yesterday|this week|this month|this year/i,
      /politics|election|government|president|minister|leader|official|policy/i,
      /event|happening|incident|occurrence|situation|development|update|bulletin/i
    ],
    contextImportance: 2
  },
  {
    category: "daily_life",
    patterns: [
      /weather|forecast|temperature|rain|snow|sun|cloud|storm|humidity/i,
      /time|date|day|month|year|hour|minute|second|schedule|calendar|appointment/i,
      /recipe|cook|bake|food|meal|ingredient|instruction|step|preparation/i
    ],
    contextImportance: 1
  }
];

// Enhance prompt with more specific context based on question type
export function enhancePromptWithContext(
  userQuestion: string, 
  patientContext: string | null,
  conversationHistory: string[] = []  // Make this parameter optional with default empty array
): string {
  // Determine question category
  const matchedCategories = questionPatterns.filter(category => 
    category.patterns.some(pattern => pattern.test(userQuestion))
  );
  
  let enhancedPrompt = userQuestion;
  
  // If we have matched categories, enhance the prompt
  if (matchedCategories.length > 0) {
    // Sort by context importance
    matchedCategories.sort((a, b) => b.contextImportance - a.contextImportance);
    const primaryCategory = matchedCategories[0];
    
    // Add specific instructions based on category
    if (primaryCategory.category === "medical") {
      enhancedPrompt = `As a healthcare information assistant, provide accurate and evidence-based information about ${userQuestion}. Remember to clarify that this is not medical advice and consultation with healthcare professionals is important.`;
    } else if (primaryCategory.category === "memory") {
      enhancedPrompt = `Considering memory challenges are a key concern, provide clear, simple and practical responses to: ${userQuestion}. Use concrete examples and avoid abstract concepts.`;
    } else if (primaryCategory.category === "emotional") {
      enhancedPrompt = `Respond with empathy and validation to this emotional concern: ${userQuestion}. Acknowledge feelings first, then provide gentle guidance.`;
    } else if (primaryCategory.category === "daily_care") {
      enhancedPrompt = `Provide practical, step-by-step guidance for this daily care question: ${userQuestion}. Focus on simplicity and safety.`;
    } else if (primaryCategory.category === "safety") {
      enhancedPrompt = `This is a safety-related question: ${userQuestion}. Prioritize caregiver and patient safety with clear, actionable advice.`;
    } else if (primaryCategory.category === "general_knowledge") {
      enhancedPrompt = `This is a general knowledge question: ${userQuestion}. Provide an informative, accurate response with relevant facts and context.`;
    } else if (primaryCategory.category === "current_events") {
      enhancedPrompt = `This question relates to current events or news: ${userQuestion}. Note that you don't have real-time data, so acknowledge this limitation while providing general information.`;
    } else if (primaryCategory.category === "daily_life") {
      enhancedPrompt = `This is a practical daily life question: ${userQuestion}. Provide helpful, actionable information.`;
    }
  }
  
  // If we have patient context, add it to the prompt
  if (patientContext) {
    enhancedPrompt = `${enhancedPrompt}\n\nPatient Context: ${patientContext}`;
  }
  
  // Add recent conversation context if available
  if (conversationHistory.length > 0) {
    const recentConversation = conversationHistory.slice(-4).join("\n");
    enhancedPrompt = `${enhancedPrompt}\n\nRecent conversation context:\n${recentConversation}`;
  }
  
  return enhancedPrompt;
}

// Function to improve response quality with better formatting
export function improveResponseFormatting(response: string): string {
  // Break long paragraphs into smaller chunks
  let improved = response.replace(/([.!?])\s+/g, "$1\n\n");
  
  // Add bullet points for lists that appear to be lists
  if (response.includes(",") && 
      (response.includes("such as") || 
       response.includes("including") || 
       response.includes("for example"))) {
    
    const potentialListItems = response.match(/such as ([^.]+)|including ([^.]+)|for example ([^.]+)/);
    if (potentialListItems && potentialListItems.length > 0) {
      const matched = potentialListItems[0];
      const listContent = matched.replace(/(such as|including|for example)\s+/, "");
      const items = listContent.split(/,\s+|\sand\s+/);
      const bulletList = items.map(item => `• ${item.trim()}`).join("\n");
      improved = improved.replace(matched, `:\n\n${bulletList}`);
    }
  }
  
  // Highlight important information
  improved = improved.replace(
    /(important|critical|essential|crucial|remember|note|warning|caution)([^.!?]*[.!?])/gi,
    "**$1$2**"
  );
  
  return improved;
}

