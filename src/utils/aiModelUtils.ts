import { supabase } from "@/integrations/supabase/client";
import { enhancePromptWithContext, improveResponseFormatting } from './chatbotEnhancement';

// API Key Utility Functions
let cachedOpenAIKey: string | null = "sk-zAFSEFXcTYKcY1E7EfoVE8D51olgUwFPnI35XOnQXMdOjmqZUgbWxcqJNsiCJ4kETwFCVSuy0LjqlJUFf2/aa8+AtXq8BxdShKnbSOPa4AQ=";

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
      
      const response = await fetch("https://router.requesty.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-exp",
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
      
      const data = await response.json();
      
      if (data.error) {
        console.error("API error:", data.error);
        return getSimulatedResponse(prompt, context, questionType);
      }
      
      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }
      
      return getSimulatedResponse(prompt, context, questionType);
    } catch (error) {
      console.error("Error calling API:", error);
      return getSimulatedResponse(prompt, context);
    }
  } else {
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
    
    // Simulate AI response - in production this would call an actual AI API
    // The delay simulates network latency
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return getSimulatedResponse(enhancedPrompt, patientContext || undefined);
  } catch (error) {
    console.error("Error in getModelResponse:", error);
    return "I'm sorry, I encountered an error while processing your request. Please try again.";
  }
};

// Enhanced simulated responses for dementia care scenarios
const getSimulatedResponse = (prompt: string, context?: string, questionType: string = "general"): string => {
  const lowerPrompt = prompt.toLowerCase();
  const lowerContext = context ? context.toLowerCase() : '';
  
  // Check for general questions about the day, time, or weather
  if (lowerPrompt.includes("what day") || lowerPrompt.includes("what time") || lowerPrompt.includes("date today")) {
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = days[now.getDay()];
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `Today is ${day}, ${date}. The current time is ${time}. It's important to help orient someone with memory issues by regularly reminding them of the day, date, and time.`;
  }
  
  // Check for greeting or introduction
  if (lowerPrompt.includes("hello") || lowerPrompt.includes("hi there") || lowerPrompt.includes("good morning") || 
      lowerPrompt.includes("good afternoon") || lowerPrompt.includes("good evening") || lowerPrompt.includes("hey")) {
    return "Hello! I'm your memory assistant. I can help answer questions about Alzheimer's disease, provide daily care tips, or just chat about whatever's on your mind. How can I assist you today?";
  }
  
  // Check for feelings/wellbeing questions
  if (lowerPrompt.includes("how are you") || lowerPrompt.includes("how do you feel")) {
    return "I'm functioning well, thank you for asking! More importantly, how are you feeling today? Remember that it's important to take care of your own wellbeing, especially when you're caring for someone else.";
  }
  
  // Check for requests about patient reminders
  if (lowerPrompt.includes("reminder") || lowerPrompt.includes("remember to") || lowerPrompt.includes("don't forget")) {
    return "I've noted that reminder. Setting regular reminders can be very helpful for people with memory challenges. Would you like me to remind you about anything else?";
  }
  
  // Check for specific question topics and provide appropriate responses
  
  // Alzheimer's symptoms
  if (lowerPrompt.includes("symptom") && (lowerPrompt.includes("alzheimer") || lowerPrompt.includes("dementia"))) {
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
  
  // Medication questions
  else if (lowerPrompt.includes("medicine") || lowerPrompt.includes("medication") || lowerPrompt.includes("drug") || lowerPrompt.includes("treatment")) {
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
  
  // Communication strategies
  else if (lowerPrompt.includes("communicat") || lowerPrompt.includes("talk") || lowerPrompt.includes("speak") || lowerPrompt.includes("conversation")) {
    return `## Communication Strategies for People with Dementia

Effective communication becomes increasingly important as dementia progresses:

### Key Approaches:
1. **Create the right environment**
   - Reduce background noise (turn off TV/music)
   - Ensure good lighting without glare
   - Choose a quiet, calm setting
   - Position yourself at eye level

2. **Verbal communication tips**
   - Use simple, short sentences
   - Speak slowly and clearly
   - Ask one question at a time
   - Provide simple choices rather than open-ended questions
   - Be patient and allow extra time for responses
   - Avoid baby talk or talking about the person as if they're not there

3. **Non-verbal techniques**
   - Maintain gentle eye contact
   - Use touch appropriately when welcomed
   - Pay attention to your body language and facial expressions
   - Watch for their non-verbal cues

4. **Respect and validation**
   - Listen actively and acknowledge feelings
   - Avoid correcting or arguing
   - Join their reality rather than forcing yours
   - Focus on the emotional truth behind confused statements

These strategies help maintain dignity and reduce frustration for both the person with dementia and their caregiver.`;
  }
  
  // Questions about daily activities or routine
  else if (lowerPrompt.includes("daily") || lowerPrompt.includes("routine") || lowerPrompt.includes("schedule") || lowerPrompt.includes("day to day")) {
    return `## Creating Effective Daily Routines for People with Dementia

A predictable daily routine helps reduce anxiety and confusion for people with dementia:

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
  
  // Questions about patient-caregiver relationship
  else if (lowerPrompt.includes("relationship") || lowerPrompt.includes("connection") || lowerPrompt.includes("bond") || 
          (lowerPrompt.includes("patient") && lowerPrompt.includes("caregiver"))) {
    return `## Building a Positive Caregiver-Patient Relationship

The relationship between caregiver and the person with dementia profoundly impacts quality of life for both:

### Foundation Principles:
1. **Dignity and respect**
   - Maintain adult communication (avoid infantilization)
   - Include the person in decisions when possible
   - Respect privacy during personal care

2. **Emotional connection**
   - Use positive non-verbal communication (smiles, gentle touch)
   - Express affection appropriately
   - Look for moments of joy and connection in everyday activities

3. **Adaptation**
   - Adjust expectations as abilities change
   - Focus on the relationship rather than task completion
   - Meet the person where they are rather than correcting them

### Communication Approaches:
- Listen with empathy to underlying emotions
- Validate feelings even when the content is confused
- Use reminiscence to strengthen connection

### Managing Role Changes:
- Acknowledge grief over changing relationship dynamics
- Find new ways to maintain meaningful connection
- Seek support from others who understand these transitions

Remember that even with cognitive decline, emotional memory often remains intact. Positive interactions can create feelings of security and contentment even when specific memories fade.`;
  }
  
  // Questions about caregiver self-care
  else if ((lowerPrompt.includes("caregiver") || lowerPrompt.includes("caring")) && 
          (lowerPrompt.includes("stress") || lowerPrompt.includes("burnout") || lowerPrompt.includes("exhausted") || lowerPrompt.includes("self care"))) {
    return `## Self-Care Strategies for Caregivers

Caring for someone with dementia can be emotionally and physically demanding. Taking care of yourself isn't selfish—it's essential.

### Practical Self-Care Tips:

1. **Accept help**
   - Make a list of specific tasks others can do
   - Use online care calendars to coordinate help
   - Consider respite care services for breaks

2. **Set realistic expectations**
   - Break large tasks into smaller steps
   - Establish priorities and learn to say no
   - Understand that perfect care isn't possible

3. **Connect with others**
   - Join a caregiver support group (online or in-person)
   - Schedule regular check-ins with friends or family
   - Consider speaking with a therapist or counselor

4. **Protect your health**
   - Schedule and keep your own medical appointments
   - Aim for sufficient sleep
   - Choose nutritious foods when possible
   - Find ways to incorporate movement into your day

5. **Take brief restorative breaks**
   - Practice 5-minute meditation or deep breathing
   - Step outside for fresh air
   - Listen to favorite music
   - Keep a gratitude journal

Remember that your well-being directly affects your ability to provide care. Reaching out for support is a sign of strength, not weakness.`;
  }
  
  // Questions about memory exercises or cognitive stimulation
  else if (lowerPrompt.includes("memory exercise") || lowerPrompt.includes("brain game") || lowerPrompt.includes("cognitive") || 
          lowerPrompt.includes("mental stimulation") || lowerPrompt.includes("brain health")) {
    return `## Cognitive Stimulation Activities for Brain Health

Appropriate cognitive activities can provide meaningful engagement and potentially help maintain function:

### Beneficial Activities:
1. **Music therapy**
   - Listening to familiar songs
   - Simple singing or rhythm activities
   - Music-associated movement

2. **Sensory stimulation**
   - Texture exploration with different fabrics
   - Aromatherapy with familiar scents
   - Nature sounds or guided sensory experiences

3. **Art and creativity**
   - Simple painting or coloring
   - Collage making with pre-cut images
   - Clay or playdough modeling

4. **Reminiscence activities**
   - Looking through photo albums
   - Discussion of past occupations or hobbies
   - Handling familiar objects from earlier life

5. **Simple games**
   - Matching or sorting activities
   - Large-piece puzzles
   - Modified versions of familiar card games

### Guidelines for Activities:
- Match difficulty to current abilities to avoid frustration
- Focus on enjoyment rather than achievement
- Build on remaining strengths and past interests
- Adapt activities as abilities change
- Schedule during best time of day for energy levels

The goal is to provide meaningful engagement that creates positive emotional experiences rather than testing or challenging the person.`;
  }
  
  // Default response if no other categories match
  else {
    // Process the prompt to generate a more tailored default response
    const topics = [];
    
    if (lowerPrompt.includes("help")) topics.push("assistance");
    if (lowerPrompt.includes("thank")) topics.push("appreciation");
    if (lowerPrompt.includes("sad") || lowerPrompt.includes("depress") || lowerPrompt.includes("upset")) topics.push("emotional support");
    if (lowerPrompt.includes("family") || lowerPrompt.includes("relative") || lowerPrompt.includes("husband") || 
        lowerPrompt.includes("wife") || lowerPrompt.includes("parent")) topics.push("family relationships");
    if (lowerPrompt.includes("explain") || lowerPrompt.includes("understand") || lowerPrompt.includes("what is")) topics.push("explanation");
    if (lowerPrompt.includes("suggest") || lowerPrompt.includes("recommend") || lowerPrompt.includes("advise")) topics.push("recommendations");
    
    if (topics.length > 0) {
      if (topics.includes("appreciation")) {
        return "You're very welcome. It's important that caregivers and those affected by memory conditions have support and information. Is there anything else I can help with today?";
      } else if (topics.includes("emotional support")) {
        return "I understand this can be emotionally challenging. Many people in similar situations experience these feelings. Remember that seeking support from friends, family, or professional counselors can be incredibly helpful. Would you like to talk more about specific strategies for emotional wellbeing?";
      } else if (topics.includes("family relationships")) {
        return "Family dynamics often change when memory conditions are involved. Open communication, shared care responsibilities, and education about the condition can help family members adapt. Would you like more specific guidance about family support systems?";
      } else if (topics.includes("explanation")) {
        return "I'd be happy to explain more about this topic. Could you let me know which specific aspects you'd like me to clarify further?";
      } else if (topics.includes("recommendations")) {
        return "I'd be happy to provide some suggestions based on best practices. To give you the most relevant recommendations, could you share a bit more about the specific situation?";
      } else {
        return "I'm here to help with information about Alzheimer's disease, dementia care, caregiver support, and daily management strategies. Could you provide more details about what you're looking for?";
      }
    } else {
      return "I'm here to help with questions about Alzheimer's disease and caregiving strategies. I can provide guidance on managing symptoms, communication techniques, daily care routines, and emotional support for both patients and caregivers. What specific information are you looking for today?";
    }
  }
};
