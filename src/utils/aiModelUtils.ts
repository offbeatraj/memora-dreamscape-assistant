import { supabase } from "@/integrations/supabase/client";

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

// Function to store patient conversation
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

export const getPatientModelResponse = async (prompt: string, context?: string): Promise<string> => {
  // Check if we have API access
  const apiKey = await getOpenAIKey();
  
  if (apiKey) {
    try {
      // Identify question type to customize the system prompt
      const questionType = identifyCaregiverQuestionType(prompt);
      
      // Customize system prompt based on question type
      let systemPrompt = "You are a specialized AI assistant for Alzheimer's and dementia caregivers.";
      
      // Add specialized instructions based on question type
      if (questionType.includes('strategy')) {
        systemPrompt += `
When providing care strategies for dementia patients, always prioritize these evidence-based approaches:

1. Person-Centered Care - Always consider the individual's preferences, history, and dignity
2. Validation - Acknowledge feelings without contradicting misconceptions
3. Redirection - Gently guide attention to another topic or activity when distressed
4. Environmental Adaptation - Suggest changes to surroundings that reduce stress
5. Simple Communication - Use clear, short sentences and visual cues

When responding to this caregiver question about ${questionType.replace('_strategy', '')}, offer at least two specific approaches:
- One approach should demonstrate validation and redirection techniques
- Compare this with direct reality orientation approaches (usually less effective)
- Explain why person-centered approaches that preserve dignity are typically more successful
- If available in the patient context, reference specific details about the patient to personalize the advice

Format your response to clearly label and compare these different approaches.`;
      } else if (questionType === "condition_information") {
        systemPrompt += `
Provide scientific, evidence-based information about Alzheimer's disease or dementia, while keeping it accessible and relevant to caregivers. Include:
- Recent research findings when relevant
- Accurate descriptions of symptoms and mechanisms
- Clear distinctions between different types of dementia when applicable
- Focus on practical implications for caregiving
- Avoid medical jargon when possible, but explain necessary terms`;
      } else if (questionType === "caregiver_support") {
        systemPrompt += `
Respond with empathy and validation to the caregiver's emotional needs. Include:
- Acknowledgment of the challenges they're facing
- Validation of their feelings
- Practical self-care suggestions
- Resources for caregiver support
- Reminders about the importance of their own wellbeing`;
      }
      
      // Enhanced prompt for care strategies
      const enhancedPrompt = `
${systemPrompt}
${context ? `\nContext about the patient:\n${context}\n` : ''}
      
The caregiver is asking about: ${prompt}

Provide a compassionate, practical response that respects the dignity of the person with dementia.
Your response should be direct, helpful, and specifically tailored to this situation for caregivers.`;
      
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
              content: enhancedPrompt
            }
          ],
          temperature: 0.5,
          max_tokens: 2000
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error("API error:", data.error);
        return `Error from API: ${data.error.message || "Unknown error"}`;
      }
      
      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      } else {
        console.error("Unexpected API response:", data);
        return getSimulatedResponse(prompt, context, questionType);
      }
    } catch (error) {
      console.error("Error calling API:", error);
      return getSimulatedResponse(prompt, context);
    }
  } else {
    return getSimulatedResponse(prompt, context);
  }
};

// Function to get a simulated response
export const getModelResponse = async (prompt: string): Promise<string> => {
  // Check if we have API access
  const apiKey = await getOpenAIKey();
  
  if (apiKey) {
    try {
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
              content: "You are a helpful assistant."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error("API error:", data.error);
        return `Error from API: ${data.error.message || "Unknown error"}`;
      }
      
      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      } else {
        console.error("Unexpected API response:", data);
        return getSimulatedResponse(prompt);
      }
    } catch (error) {
      console.error("Error calling API:", error);
      return getSimulatedResponse(prompt);
    }
  } else {
    return getSimulatedResponse(prompt);
  }
};

// Enhanced simulated responses for dementia care scenarios
const getSimulatedResponse = (prompt: string, context?: string, questionType: string = "general"): string => {
  const lowerPrompt = prompt.toLowerCase();
  const lowerContext = context ? context.toLowerCase() : '';
  
  // Check for case scenario about nighttime confusion
  if ((questionType === "sleep_strategy" || questionType === "confusion_strategy") &&
      (lowerContext.includes('pam') || lowerContext.includes('anxiously getting ready') || 
       lowerContext.includes('night') || lowerContext.includes('2 a.m.'))) {
    
    if (lowerPrompt.includes('what would you') || lowerPrompt.includes('what should') || 
        lowerPrompt.includes('how should') || lowerPrompt.includes('approach')) {
      return `## Care Strategies for Pam's Nighttime Confusion

Based on the case scenario where Pam is getting ready for work at 2 AM (despite being retired), here's a comparison of approaches:

### ✅ Recommended Approach: Validation & Redirection

**What to say:** "I see you're getting ready, Mom. It looks like you're concerned about being late. It's still nighttime though - look how dark it is outside. Why don't we have some herbal tea and then get some more rest until morning? I'll make sure you're up when it's time."

**Why this works:**
- Acknowledges Pam's feelings without contradicting her
- Uses environmental cues (darkness outside) to provide gentle orientation
- Offers a calming alternative (tea)
- Provides reassurance about her underlying concern (being late)
- Preserves dignity and reduces anxiety

### ❌ Less Effective Approach: Reality Orientation

**What to say:** "Mom, you're confused again. You've been retired for 7 years and don't need to go to work. It's the middle of the night - go back to bed."

**Why this doesn't work well:**
- Creates confrontation and may increase agitation
- May trigger shame or embarrassment
- Doesn't address the emotional need behind the behavior
- Could damage trust and increase resistance

The validation and redirection approach respects Pam as a person while gently guiding her back to bed, which minimizes confusion and distress while maintaining her dignity.`;
    } else {
      return `For Pam's nighttime confusion about going to work, I recommend using validation and redirection rather than reality orientation.

Try saying something like: "I see you're getting ready, Mom. It's still nighttime though - look how dark it is outside. We can have some herbal tea and then get some more rest until morning. I'll make sure you're up when it's time."

This approach:
- Acknowledges her feelings without contradicting her
- Uses environmental cues (darkness outside)
- Offers a calming alternative (tea)
- Reassures her that her needs will be met

This respects Pam's dignity while gently guiding her back to bed, minimizing confusion and distress.`;
    }
  }
  
  // Memory issues
  if (questionType === "memory_strategy") {
    return `## Effective Strategies for Memory Support

Memory challenges are one of the core symptoms of dementia. Here are practical approaches:

### ✅ Recommended Approach: External Memory Aids & Routine

**What to try:**
- Use consistent daily routines to create predictability
- Place simple labels on important items and doors
- Create a "memory station" with essential daily information
- Use a large, clear calendar showing only necessary information
- Provide gentle reminders without testing memory ("Lunch is ready" rather than "Do you remember it's lunchtime?")
- Create a memory book with photos and short captions of important people and events

**Why this works:**
- Reduces anxiety about forgetting
- Provides environmental support rather than requiring internal memory
- Preserves dignity by enabling more independence
- Avoids putting the person on the spot

### ❌ Less Effective Approach: Memory Quizzing

**What to avoid:**
- Asking "Do you remember..." questions
- Correcting memory mistakes immediately
- Expressing frustration at repeated questions
- Expecting the person to remember recent conversations or instructions

Remember that memory loss is not something the person can control with effort. The goal is to create an environment that supports them rather than challenging them.`;
  }
  
  // Medication management
  if (questionType === "medication_strategy") {
    return `## Medication Management Strategies

Managing medications for someone with dementia requires careful approaches:

### ✅ Recommended Approaches:

**1. Simplified Routines:**
- Give medications at the same times each day
- Link medication times to consistent daily events (breakfast, bedtime)
- Use pill organizers with clear day/time labels
- Consider automated pill dispensers with alarms for later stages

**2. Supportive Communication:**
- Provide simple, step-by-step instructions
- Use a calm, reassuring tone
- Avoid rushing or showing frustration
- Offer a small glass of water or preferred beverage

**3. Environmental Adjustments:**
- Remove visual clutter when giving medications
- Ensure good lighting
- Consider easy-to-swallow forms if pill-swallowing is difficult
- Keep backup supplies in a secure location

### ❌ Less Effective Approaches:
- Complex explanations about why medications are needed
- Arguing or forcing if resistance occurs
- Irregular timing or approaches
- Hiding medication in food without prior medical approval (may be appropriate in some cases but requires healthcare provider guidance)

Always consult with healthcare providers about medication challenges, as they may be able to simplify regimens or suggest alternative delivery methods.`;
  }
  
  // Check for specific patient questions
  if (context && (lowerPrompt.includes('alzheimer') || lowerPrompt.includes('dementia'))) {
    if (lowerPrompt.includes('medicine') || lowerPrompt.includes('medication')) {
      return `Based on the information provided, the patient should continue with their prescribed medication regimen for Alzheimer's disease. Common medications include cholinesterase inhibitors (like donepezil, rivastigmine, or galantamine) and memantine.

However, I don't have specific details about this patient's prescribed medications in the provided case information. It's important to:

1. Follow the exact dosage and timing prescribed by their doctor
2. Monitor for side effects such as:
   - Nausea, vomiting, or diarrhea
   - Loss of appetite
   - Dizziness or headaches
   - Sleep disturbances
3. Keep a regular medication schedule
4. Use pill organizers or reminders if needed
5. Track effectiveness and any changes in symptoms

Always consult with the patient's healthcare provider before making any changes to their medication routine. Regular follow-ups are essential to assess medication effectiveness and adjust as the condition progresses.`;
    } 
    else if (lowerPrompt.includes('communication') || lowerPrompt.includes('talk')) {
      return `### Effective Communication Strategies for Dementia Care

When communicating with someone who has Alzheimer's disease:

**Before Starting:**
- Reduce background distractions (turn off TV/radio)
- Position yourself at eye level, face-to-face
- Ensure adequate lighting but avoid glare
- Make sure hearing aids are working if used

**Essential Techniques:**
1. **Keep it simple**
   - Use short, direct sentences
   - Ask one question at a time
   - Offer simple choices (limit to two options)
   - Break instructions into small steps

2. **Non-verbal communication**
   - Maintain gentle eye contact
   - Use appropriate touch when welcomed
   - Demonstrate actions you're describing
   - Pay attention to your tone and facial expressions
   - Notice their non-verbal cues

3. **Patience and listening**
   - Allow extra time for responses
   - Avoid interrupting or rushing
   - Listen for the feeling behind confused words
   - Be comfortable with silences

4. **Validation over correction**
   - Respond to emotions rather than factual errors
   - Avoid arguing or correcting mistakes
   - Redirect gently rather than contradict
   - Join their reality rather than force yours

These approaches help maintain dignity and reduce frustration for both the person with Alzheimer's and their caregiver.`;
    }
  }
  
  // Default response for other questions
  return `I'm here to help with questions about Alzheimer's disease and caregiving strategies. Based on evidence-based approaches, I can provide guidance on managing symptoms, communication techniques, daily care routines, and emotional support for both patients and caregivers. 

If you're looking for specific advice about a patient case or scenario, please provide more details about the situation, and I'd be happy to suggest appropriate care strategies.

For the most effective support, consider including:
- The specific challenge you're facing
- The stage of dementia the person is experiencing
- Any approaches you've already tried
- The person's background or preferences that might be relevant`;
};
