import { supabase } from "@/integrations/supabase/client";
import { getOpenAIKey, hasOpenAIAccess } from "./apiKeyUtils";

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

// Function to get patient data
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

// Function to get patient case files
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

export const getPatientModelResponse = async (prompt: string, context?: string): Promise<string> => {
  // Check if we have OpenAI API access
  if (hasOpenAIAccess()) {
    try {
      // Enhanced prompt for care strategies
      const enhancedPrompt = `
You are a specialized AI assistant for Alzheimer's and dementia caregivers. 
${context ? `\n${context}\n` : ''}

The person is asking about: ${prompt}

If the question relates to a case scenario involving a patient with confusion, apply these care strategies:
1. Validation - Acknowledge the person's feelings and concerns without contradicting them
2. Gentle Redirection - Calmly guide them to a different activity or topic
3. Environmental Cues - Use the environment to help orient the person
4. Person-Centered Communication - Focus on the person's emotions and needs, not just facts
5. Avoid Reality Orientation - Don't directly contradict or correct misconceptions as this can cause distress

Provide a compassionate, practical response that respects the dignity of the person with dementia.
Your response should be direct and helpful for caregivers.`;

      const apiKey = getOpenAIKey();
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a specialized AI assistant for Alzheimer's and dementia caregivers."
            },
            {
              role: "user",
              content: enhancedPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });
      
      const data = await response.json();
      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      } else {
        console.error("Unexpected API response:", data);
        return getSimulatedResponse(prompt, context);
      }
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      return getSimulatedResponse(prompt, context);
    }
  } else {
    return getSimulatedResponse(prompt, context);
  }
};

// Function to get a simulated response
export const getModelResponse = async (prompt: string): Promise<string> => {
  // Check if we have OpenAI API access
  if (hasOpenAIAccess()) {
    try {
      const apiKey = getOpenAIKey();
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
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
      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      } else {
        console.error("Unexpected API response:", data);
        return getSimulatedResponse(prompt);
      }
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      return getSimulatedResponse(prompt);
    }
  } else {
    return getSimulatedResponse(prompt);
  }
};

// Enhanced simulated responses for dementia care scenarios
const getSimulatedResponse = (prompt: string, context?: string): string => {
  const lowerPrompt = prompt.toLowerCase();
  const lowerContext = context ? context.toLowerCase() : '';
  
  // Check for case scenario about nighttime confusion
  if ((lowerPrompt.includes('night') || lowerPrompt.includes('confused') || lowerPrompt.includes('work')) && 
      (lowerContext.includes('pam') || lowerContext.includes('anxiously getting ready'))) {
    if (lowerPrompt.includes('strategy') || lowerPrompt.includes('approach')) {
      return `Based on the case scenario with Pam experiencing nighttime confusion about going to work, here are the recommended strategies:

1. **Validation and Redirection** (Recommended): 
   Instead of directly contradicting Pam's belief that she needs to go to work, acknowledge her feelings and gently redirect. For example: "I see you're getting ready. It's still nighttime though. Let's have some tea and rest until morning."

2. **Environmental Cues** (Recommended): 
   Use the environment to help orient Pam to the time. For example: "Let me open the curtains so you can see it's dark outside. We still have time to sleep."

3. **Reality Orientation** (Not Recommended): 
   Directly telling Pam "You're retired and need to go back to sleep" may cause distress and confusion.

The best approach combines validation with gentle environmental cues. This respects Pam's dignity while helping her return to bed with minimal distress.`;
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
  
  // Check for specific patient questions
  if (context && lowerPrompt.includes('alzheimer') || lowerPrompt.includes('dementia')) {
    if (lowerPrompt.includes('medicine') || lowerPrompt.includes('medication')) {
      return `Based on the information provided, the patient should continue with their prescribed medication regimen for Alzheimer's disease. Common medications include cholinesterase inhibitors (like donepezil, rivastigmine, or galantamine) and memantine.

However, I don't have specific details about this patient's prescribed medications in the provided case information. It's important to:

1. Follow the exact dosage and timing prescribed by their doctor
2. Monitor for side effects
3. Keep a regular medication schedule
4. Use pill organizers or reminders if needed

Always consult with the patient's healthcare provider before making any changes to their medication routine.`;
    } 
    else if (lowerPrompt.includes('communication') || lowerPrompt.includes('talk')) {
      return `When communicating with someone who has Alzheimer's disease:

1. Use simple, direct language
2. Ask one question at a time
3. Be patient and allow extra time for responses
4. Maintain a calm, reassuring tone
5. Minimize distractions and background noise
6. Use gentle touch when appropriate
7. Pay attention to non-verbal cues
8. Avoid arguing or correcting mistakes
9. Use visual cues along with verbal communication
10. Focus on feelings rather than facts

These approaches help maintain dignity and reduce frustration for both the person with Alzheimer's and their caregiver.`;
    }
  }
  
  // Default response for other questions
  return `I'm here to help with questions about Alzheimer's disease and caregiving strategies. Based on evidence-based approaches, I can provide guidance on managing symptoms, communication techniques, daily care routines, and emotional support for both patients and caregivers. 

If you're looking for specific advice about a patient case or scenario, please provide more details about the situation, and I'd be happy to suggest appropriate care strategies.`;
};
