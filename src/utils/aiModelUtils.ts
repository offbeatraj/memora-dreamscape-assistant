import { supabase } from "@/integrations/supabase/client";
import { enhancePromptWithContext, improveResponseFormatting } from './chatbotEnhancement';

// API Key Utility Functions
let cachedOpenAIKey: string | null = "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";

export const getOpenAIKey = async (): Promise<string> => {
  // Return hardcoded key directly
  return cachedOpenAIKey || "";
};

export const setOpenAIKey = async (key: string): Promise<void> => {
  try {
    if (key) {
      // Update cache
      cachedOpenAIKey = key;
      
      // Keep in localStorage as fallback
      localStorage.setItem('openai_api_key', key);
    } else {
      // Clear cache
      cachedOpenAIKey = null;
      
      // Remove from localStorage
      localStorage.removeItem('openai_api_key');
    }
  } catch (error) {
    console.error('Error setting OpenAI key:', error);
    // Fallback to just localStorage
    if (key) {
      localStorage.setItem('openai_api_key', key);
    } else {
      localStorage.removeItem('openai_api_key');
    }
  }
};

export const hasOpenAIAccess = async (): Promise<boolean> => {
  const key = await getOpenAIKey();
  return !!key;
};

// Conversation Utilities
export const getPatientConversations = (patientId: string): any[] => {
  try {
    const key = `patient_${patientId}_conversations`;
    const storedConversations = localStorage.getItem(key);
    return storedConversations ? JSON.parse(storedConversations) : [];
  } catch (error) {
    console.error("Error getting patient conversations:", error);
    return [];
  }
};

export const formatConversationTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return timestamp || "Unknown date";
  }
};

// Function to store patient data
export const storePatientData = (patientId: string, patientData: any) => {
  try {
    const key = `patient_${patientId}_data`;
    localStorage.setItem(key, JSON.stringify(patientData));
    return true;
  } catch (error) {
    console.error("Error storing patient data:", error);
    return false;
  }
};

export const getPatientData = (patientId: string) => {
  try {
    const key = `patient_${patientId}_data`;
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : null;
  } catch (error) {
    console.error("Error getting patient data:", error);
    return null;
  }
};

export const getPatientCaseFiles = async (patientId: string) => {
  try {
    // First try to get from Supabase if available
    try {
      const { data, error } = await supabase
        .from('patient_files')
        .select('notes, file_name')
        .eq('patient_id', patientId)
        .eq('file_category', 'case')
        .order('upload_date', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Combine all notes from case files into a single text
        return data.map(file => `Case file "${file.file_name}":\n${file.notes || "No description provided"}`).join("\n\n");
      }
    } catch (err) {
      console.error("Error fetching from Supabase:", err);
    }
    
    // If no data from Supabase or error, try local storage
    const key = `patient_${patientId}_case_files`;
    const storedFiles = localStorage.getItem(key);
    return storedFiles || "";
  } catch (error) {
    console.error("Error getting patient case files:", error);
    return "";
  }
};

export const storePatientConversation = (patientId: string, conversation: any) => {
  try {
    // Store conversations in local storage
    const key = `patient_${patientId}_conversations`;
    const existingConversations = JSON.parse(localStorage.getItem(key) || "[]");
    existingConversations.push({
      ...conversation,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(key, JSON.stringify(existingConversations));
    
    // If this is a case file, update the case files storage
    if (conversation.title && conversation.title.startsWith("Case Scenario:")) {
      const caseKey = `patient_${patientId}_case_files`;
      const existingCaseFiles = localStorage.getItem(caseKey) || "";
      const newCaseFile = conversation.message || "";
      localStorage.setItem(caseKey, existingCaseFiles + "\n\n" + newCaseFile);
    }
    
    return true;
  } catch (error) {
    console.error("Error storing patient conversation:", error);
    return false;
  }
};

// Enhanced function to identify and classify caregiver questions
const identifyCaregiverQuestionType = (prompt: string): string => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for questions about caregiving strategies
  if (lowerPrompt.includes("strategy") || 
      lowerPrompt.includes("approach") || 
      lowerPrompt.includes("what would you") || 
      lowerPrompt.includes("what should i") || 
      lowerPrompt.includes("how should i") ||
      lowerPrompt.includes("how can i")) {
    
    // Identify specific situations
    if (lowerPrompt.includes("confus") || lowerPrompt.includes("disoriented")) {
      return "confusion_strategy";
    } else if (lowerPrompt.includes("agitat") || lowerPrompt.includes("upset") || lowerPrompt.includes("angry")) {
      return "agitation_strategy";
    } else if (lowerPrompt.includes("sleep") || lowerPrompt.includes("night") || 
               lowerPrompt.includes("bed") || lowerPrompt.includes("rest")) {
      return "sleep_strategy";
    } else if (lowerPrompt.includes("eat") || lowerPrompt.includes("food") || lowerPrompt.includes("meal")) {
      return "eating_strategy";
    } else if (lowerPrompt.includes("bath") || lowerPrompt.includes("shower") || lowerPrompt.includes("hygiene")) {
      return "bathing_strategy";
    } else if (lowerPrompt.includes("memor") || lowerPrompt.includes("forget")) {
      return "memory_strategy";
    } else if (lowerPrompt.includes("medic") || lowerPrompt.includes("pill") || lowerPrompt.includes("drug")) {
      return "medication_strategy";
    }
    
    // General strategy question
    return "general_strategy";
  }
  
  // Information seeking questions
  if (lowerPrompt.includes("what is") || 
      lowerPrompt.includes("what are") || 
      lowerPrompt.includes("explain") || 
      lowerPrompt.includes("tell me about")) {
    if (lowerPrompt.includes("alzheimer") || lowerPrompt.includes("dementia")) {
      return "condition_information";
    } else if (lowerPrompt.includes("medic") || lowerPrompt.includes("drug") || lowerPrompt.includes("treatment")) {
      return "treatment_information";
    } else if (lowerPrompt.includes("stage") || lowerPrompt.includes("progress")) {
      return "progression_information";
    }
    return "general_information";
  }
  
  // Emotional support questions
  if (lowerPrompt.includes("tired") || 
      lowerPrompt.includes("exhausted") || 
      lowerPrompt.includes("stressed") || 
      lowerPrompt.includes("overwhelmed") ||
      lowerPrompt.includes("help me cope")) {
    return "caregiver_support";
  }
  
  // Default - general question
  return "general";
};

// Add this helper function to extract relevant context from case studies
const extractContextFromCaseStudy = (caseStudy: string): string => {
  const lines = caseStudy.split('\n');
  let relevantContext = '';
  
  for (const line of lines) {
    // Focus on key information like symptoms, behaviors, and care situations
    if (line.toLowerCase().includes('symptom') || 
        line.toLowerCase().includes('behav') ||
        line.toLowerCase().includes('care') ||
        line.toLowerCase().includes('condition') ||
        line.toLowerCase().includes('diagnosis')) {
      relevantContext += line + '\n';
    }
  }
  
  return relevantContext.trim();
};

export const getPatientModelResponse = async (
  prompt: string, 
  context?: string,
  conversationHistory?: string[]
): Promise<string> => {
  // Check if we have API access
  const apiKey = await getOpenAIKey();
  
  if (apiKey) {
    try {
      // Identify question type to customize the system prompt
      const questionType = identifyCaregiverQuestionType(prompt);
      
      // Extract relevant context from case study if available
      const relevantContext = context ? extractContextFromCaseStudy(context) : '';
      
      // Customize system prompt based on question type and available context
      const systemPrompt = `You are a specialized AI assistant for Alzheimer's and dementia caregivers.
      ${relevantContext ? `\nRelevant patient context:\n${relevantContext}` : ''}
      ${context ? `\nFull case study context:\n${context}` : ''}`;
      
      console.log("Making API call with model: gemini-1.5-pro-latest");
      console.log("System prompt:", systemPrompt);
      
      // Try API call but don't wait too long for response
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API request timed out')), 5000)
      );
      
      const fetchPromise = fetch("https://router.requesty.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gemini-1.5-pro-latest",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 2000
        })
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error("API error:", data.error);
        return getSimulatedResponse(prompt, context, questionType);
      }
      
      console.log("API response data:", data);
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        console.error("Unexpected API response format:", data);
        throw new Error("Invalid response structure from API");
      }
    } catch (error) {
      console.error("Error calling API:", error);
      return getSimulatedResponse(prompt, context);
    }
  } else {
    console.log("No API key available, using simulated response");
    return getSimulatedResponse(prompt, context);
  }
};

// Function to get a simulated response
export const getModelResponse = async (
  prompt: string, 
  patientContext?: string | null, 
  conversationHistory?: string[]
): Promise<string> => {
  try {
    // Use enhanced prompts for better accuracy
    const enhancedPrompt = enhancePromptWithContext(
      prompt, 
      patientContext || null, 
      conversationHistory || []
    );
    
    const apiKey = await getOpenAIKey();
    
    if (apiKey) {
      try {
        console.log("Making general model API call with model: gemini-1.5-pro-latest");
        
        // Use timeout to avoid hanging on API calls
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API request timed out')), 5000)
        );
        
        const fetchPromise = fetch("https://router.requesty.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gemini-1.5-pro-latest",
            messages: [
              {
                role: "system",
                content: "You are a specialized AI assistant for Alzheimer's and dementia caregivers and patients. Provide clear, concise, and helpful responses."
              },
              {
                role: "user",
                content: enhancedPrompt
              }
            ],
            temperature: 0.5,
            max_tokens: 2000
          })
        });
        
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("General API error response:", errorText);
          throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        console.log("General API response data:", data);
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
          return improveResponseFormatting(data.choices[0].message.content);
        } else {
          console.error("Unexpected general API response format:", data);
          throw new Error("Invalid response structure from API");
        }
      } catch (error) {
        console.error("Error calling general API:", error);
        // Fall back to simulated response with the specific prompt
        return getSimulatedResponse(enhancedPrompt, patientContext || undefined);
      }
    } else {
      console.log("No API key for general response, using simulated response");
      return getSimulatedResponse(enhancedPrompt, patientContext || undefined);
    }
  } catch (error) {
    console.error("Error in getModelResponse:", error);
    return "I'm sorry, I encountered an error while processing your request. Please try again.";
  }
};

// Enhanced simulated responses for dementia care scenarios
const getSimulatedResponse = (prompt: string, context?: string, questionType: string = "general"): string => {
  const lowerPrompt = prompt.toLowerCase();
  
  // First check if this is about symptoms
  if (/(symptom|sign|indication)(s)? (of|for) (alzheimer'?s|dementia)/.test(lowerPrompt) || 
      /(alzheimer'?s|dementia) (symptom|sign|indication)(s)?/.test(lowerPrompt)) {
    return `## Common Symptoms of Alzheimer's Disease

Alzheimer's symptoms typically progress through stages:

### Early Stage Symptoms:
- Memory lapses (forgetting recent conversations or events)
- Difficulty finding the right words
- Challenges with problem-solving or planning
- Confusion about time or place
- Misplacing items frequently
- Poor judgment or decision-making
- Withdrawal from social activities
- Mood changes including anxiety or depression

### Middle Stage Symptoms:
- Increased memory loss and confusion
- Difficulty recognizing family and friends
- Inability to learn new things
- Problems with logical thinking
- Restlessness, agitation, or wandering
- Suspiciousness or paranoia
- Impulsive behavior
- Sleep disturbances
- Physical problems like incontinence

### Advanced Stage Symptoms:
- Severe communication difficulties
- Complete dependence on caregivers
- Loss of physical abilities (walking, sitting, swallowing)
- Vulnerability to infections
- Inability to recognize oneself or loved ones

Each person experiences Alzheimer's differently, and symptoms may overlap between stages.`;
  }
  
  // Check for medication questions
  else if (/medic(ation|ine|al|ines)|drug|treatment|therapy|pill/.test(lowerPrompt)) {
    return `## Medications for Alzheimer's Disease

Currently approved medications focus on managing symptoms rather than curing the disease:

### Cholinesterase Inhibitors:
- **Donepezil (Aricept)** - For all stages
- **Rivastigmine (Exelon)** - For mild to moderate stages
- **Galantamine (Razadyne)** - For mild to moderate stages
- These work by increasing levels of acetylcholine, a chemical messenger important for memory and thinking

### NMDA Receptor Antagonist:
- **Memantine (Namenda)** - For moderate to severe stages
- Works by regulating glutamate activity, another important brain chemical

### Combination Therapy:
- **Namzaric** - Combines donepezil and memantine

### Important Considerations:
- These medications cannot stop the progression of the disease
- Effects are usually modest and temporary
- Side effects may include nausea, vomiting, diarrhea, and sometimes dizziness
- Regular follow-up with healthcare providers is essential

Always consult with a healthcare professional before starting, stopping or changing any medication regimen.`;
  }
  
  // Check for brain health activities
  else if (/brain health|cognitive|mental (exercise|stimulation)|activity|activities/.test(lowerPrompt)) {
    return `## Activities That Support Brain Health

Research suggests these activities may help maintain cognitive function:

### Physical Exercise:
- Moderate aerobic exercise (30 minutes, most days)
- Strength training (2-3 times weekly)
- Balance exercises like tai chi or yoga
- Dancing, which combines physical movement and learning

### Mental Stimulation:
- Learning new skills (language, instrument, craft)
- Reading and discussing books
- Strategy games and puzzles
- Art activities like drawing, painting, or crafting

### Social Connection:
- Regular social interaction
- Group activities or clubs
- Volunteering
- Intergenerational programs

### Diet and Nutrition:
- Mediterranean or MIND diet
- Foods rich in omega-3 fatty acids
- Antioxidant-rich berries and vegetables
- Limiting processed foods and added sugars

### Stress Management:
- Mindfulness meditation
- Deep breathing exercises
- Nature walks
- Adequate sleep (7-8 hours nightly)

The most effective approach combines multiple types of activities into daily routines.`;
  }
  
  // Check for daily routine questions
  else if (/daily|routine|schedule|day to day|everyday|activities/.test(lowerPrompt)) {
    return `## Creating Effective Daily Routines for People with Dementia

A predictable daily routine helps reduce anxiety and confusion:

### Benefits of Structured Routines:
- Provides a sense of security and familiarity
- Reduces decision-making stress
- Helps maintain functional abilities longer
- Makes caregiving more manageable

### Tips for Establishing Routines:
1. **Base routines on previous habits**
   - Consider the person's lifelong preferences and patterns
   - Maintain familiar sequences (like washing face before brushing teeth)

2. **Plan activities around best times of day**
   - Schedule demanding tasks during their most alert hours
   - Allow flexibility for "good days" and "bad days"

3. **Create visual reminders**
   - Use simple written schedules with pictures
   - Set up the environment as a reminder (breakfast items visible in morning)

4. **Balance activities**
   - Include physical exercise, social interaction, and rest
   - Allow plenty of time between activities to reduce stress
   - Include enjoyable activities that connect to past interests

5. **Maintain sleep hygiene**
   - Consistent bedtime and wake time
   - Limit caffeine and create calming evening routines
   - Ensure adequate exposure to natural light during the day

Remember that as dementia progresses, routines will need adjustment, but the structure remains important at every stage.`;
  }
  
  // Check for questions about taking medicine or medications
  else if (/remember (to take|my) medicine|medicine reminder|forget (to take|my) (medicine|medication)|remind me/.test(lowerPrompt)) {
    return `## Medication Management Strategies

Remembering medications can be challenging. Here are helpful approaches:

### Visual Reminder Systems:
- Use pill organizers labeled with days and times
- Place medications in a visible (but safe) location
- Create a medication chart with simple instructions and photos
- Set up a visual calendar for marking doses taken

### Technology Solutions:
- Set alarms on phones or specialized medication reminders
- Use smartphone apps designed for medication management
- Consider automatic pill dispensers that sound alarms
- Explore smart watches with medication reminder features

### Routine-Based Strategies:
- Link medication times to specific daily activities (meals, brushing teeth)
- Keep a consistent schedule for medication times
- Create a simple checklist for daily medications
- Use notes or visual cues in key locations

### Support Systems:
- Ask family members for regular check-in calls
- Request text message reminders from caregivers
- Consider medication reminder services (some pharmacies offer these)
- Discuss concerns about forgetting with your healthcare provider

Remember that consistency is key - try to take medications at the same time and in the same way each day.`;
  }
  
  // Check for questions about today or time
  else if (/what day|what time|today|current day|date today/.test(lowerPrompt)) {
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = days[now.getDay()];
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `Today is ${day}, ${date}. The current time is ${time}.

Keeping track of time and date can be helpful for maintaining daily routines. Some tips:

- Consider using a large, clear digital clock that shows both time and date
- Calendar apps with reminders can help track appointments and events
- Daily routines structured around the same times can provide stability
- Schedule important activities during your best time of day when you feel most alert

Would you like me to help with anything else related to scheduling or time management?`;
  }
  
  // Check for social/communication questions
  else if (/communicat|talk|speak|conversation|discussing|telling/.test(lowerPrompt)) {
    return `## Effective Communication Strategies for Memory Challenges

When memory affects communication, these approaches can help:

### Speaking Clearly:
- Use simple, direct sentences
- Speak at a moderate pace
- Maintain eye contact when appropriate
- Ask one question at a time and wait for a response

### Listening Effectively:
- Give full attention without distractions
- Be patient when responses are delayed
- Watch for non-verbal cues (facial expressions, gestures)
- Avoid interrupting or rushing the conversation

### Creating the Right Environment:
- Reduce background noise (turn off TV/music)
- Ensure good lighting without glare
- Choose quiet, calm settings for important conversations
- Sit at the same level rather than standing over someone

### Supportive Techniques:
- Use names rather than pronouns (he/she/they)
- Gently redirect rather than contradict confused statements
- Break complex information into smaller pieces
- Use visual cues when helpful (pictures, objects, demonstrations)

Remember that emotional connection often remains intact even when verbal communication becomes difficult.`;
  }
  
  // Default response for any other questions
  else {
    // Analyze the prompt to generate a somewhat relevant response
    if (lowerPrompt.includes("help")) {
      return "I'm here to help with questions about Alzheimer's disease, dementia care, and strategies for supporting memory health. What specific area would you like information about today? I can provide guidance on symptoms, treatments, daily care approaches, or ways to support someone with memory challenges.";
    } 
    else if (lowerPrompt.includes("thank")) {
      return "You're welcome! I'm here to provide information and support whenever you need it. Don't hesitate to reach out with any other questions about memory care or Alzheimer's disease management.";
    }
    else if (lowerPrompt.includes("hello") || lowerPrompt.includes("hi ")) {
      return "Hello! I'm your memory care assistant. I can provide information about Alzheimer's disease, dementia care strategies, and support for memory challenges. How can I help you today?";
    }
    else {
      // Generate a response based on any available context about the patient
      if (context && context.includes("patient")) {
        let name = "the patient";
        let stage = "current";
        
        // Try to extract patient name and stage from context
        const nameMatch = context.match(/patient\s+([A-Za-z]+)/i);
        if (nameMatch && nameMatch[1]) {
          name = nameMatch[1];
        }
        
        const stageMatch = context.match(/stage[:\s]+(early|moderate|advanced)/i);
        if (stageMatch && stageMatch[1]) {
          stage = stageMatch[1].toLowerCase();
        }
        
        return `I understand you're asking about ${name}, who is in the ${stage} stage. To provide the most helpful information, could you please let me know more specifically what aspect of care or which symptoms you'd like to discuss? For example, I can provide guidance on daily routines, communication strategies, managing specific symptoms, or activities appropriate for the ${stage} stage.`;
      } else {
        return "I'd like to provide the most helpful response. Could you tell me more specifically what information you're looking for about Alzheimer's disease, memory care, or caregiving strategies? I'm here to help with a wide range of topics related to cognitive health and memory support.";
      }
    }
  }
};
