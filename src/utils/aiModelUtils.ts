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
  
  // Activities and engagement
  else if (lowerPrompt.includes("activit") || lowerPrompt.includes("exercise") || lowerPrompt.includes("game") || lowerPrompt.includes("engage")) {
    return `## Beneficial Activities for People with Dementia

Appropriate activities can enhance quality of life and provide meaningful engagement:

### Cognitive Activities:
- Simple puzzles or matching games
- Looking through photo albums with simple discussions
- Listening to familiar music
- Reading together or using audiobooks
- Reminiscence activities with familiar objects
- Sorting tasks (buttons, coins, etc.)

### Physical Activities:
- Gentle walking in safe environments
- Seated exercises
- Simple dance movements
- Gardening with supervision
- Balloon volleyball or soft ball tossing
- Tai chi or gentle yoga adapted for ability level

### Sensory Activities:
- Hand massage with scented lotion
- Textured sensory items to touch and explore
- Music therapy or singing familiar songs
- Looking at colorful pictures or objects
- Simple cooking or baking with strong aromas

### Creative Activities:
- Painting or coloring with non-toxic supplies
- Clay or playdough modeling
- Simple crafts with minimal steps
- Singing or playing simple instruments

The best activities are those that:
- Connect to past interests and skills
- Match current abilities without causing frustration
- Provide a sense of accomplishment
- Allow for social interaction
- Can be broken down into simple steps

Always monitor for signs of fatigue or frustration and be ready to modify or end activities as needed.`;
  }
  
  // Caregiver self-care
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
  
  // Check for case scenario about nighttime confusion (as in the original code)
  else if ((questionType === "sleep_strategy" || questionType === "confusion_strategy") &&
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
  
  // Memory issues (as in the original code)
  else if (questionType === "memory_strategy" || lowerPrompt.includes("memory") || lowerPrompt.includes("forget") || lowerPrompt.includes("remember")) {
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
  
  // Safety concerns
  else if (lowerPrompt.includes("safe") || lowerPrompt.includes("fall") || lowerPrompt.includes("wander") || lowerPrompt.includes("danger")) {
    return `## Safety Measures for People with Dementia

Creating a safe environment is essential for someone with dementia. Here are key considerations:

### Home Safety Modifications:
- Install grab bars in bathrooms and hallways
- Remove or secure loose rugs to prevent trips
- Add adequate lighting, especially on stairs and in hallways
- Consider motion-sensor lights for nighttime
- Secure or remove dangerous items (knives, toxic cleaning supplies)
- Install stove safety devices that automatically shut off
- Lower water temperature to prevent scalding
- Add childproof locks to cabinets with hazardous items
- Remove or secure furniture with sharp edges

### Preventing Wandering:
- Install door alarms or bells
- Use visual barriers like curtains over doors
- Consider GPS tracking devices or ID bracelets
- Establish a daily routine to reduce restlessness
- Secure the yard if outdoor wandering is common
- Alert neighbors and local authorities about wandering concerns
- Keep photos and description ready in case of wandering

### Fall Prevention:
- Remove clutter from walkways
- Ensure good lighting throughout the home
- Consider contrasting colors for steps and threshold edges
- Install handrails on both sides of stairs
- Provide stable, appropriate height seating
- Consider physical therapy for gait training
- Review medications for those that might increase fall risk

Regular safety assessments become increasingly important as dementia progresses, and adaptations should be made based on changing abilities and behaviors.`;
  }
  
  // Eating and nutrition
  else if (lowerPrompt.includes("eat") || lowerPrompt.includes("food") || lowerPrompt.includes("meal") || lowerPrompt.includes("nutrition")) {
    return `## Nutrition and Mealtime Strategies for Dementia Care

People with dementia often experience challenges with eating that change throughout the disease progression:

### Common Challenges:
- Forgetting to eat or drink
- Difficulty using utensils
- Becoming overwhelmed by too many food choices
- Decreased ability to sense hunger/thirst
- Chewing or swallowing difficulties
- Reduced ability to identify foods
- Distractions causing abandonment of meals

### Helpful Mealtime Approaches:
- Establish consistent meal times and locations
- Reduce distractions (turn off TV, limit conversation)
- Use contrasting colors (blue plate on white tablecloth)
- Serve one food at a time if multiple options are overwhelming
- Cut food into bite-sized pieces before serving
- Provide adaptive utensils if needed
- Demonstrate eating motions to encourage mimicking
- Allow extra time for meals
- Offer finger foods for independence when utensils become challenging

### Between-Meal Strategies:
- Provide nutritious, easy-to-eat snacks throughout the day
- Ensure drinks are visible and accessible
- Consider smoothies or nutrition supplements for added calories
- Use verbal and visual reminders to drink water

### When Challenges Increase:
- Monitor weight regularly
- Consider consultation with a speech therapist for swallowing issues
- Focus on food preferences while maintaining nutritional balance
- Create a pleasant social atmosphere during meals

Remember that as dementia progresses, nutrition goals may shift from perfect dietary balance to ensuring adequate intake and maintaining the dignity and pleasure of eating.`;
  }
  
  // Check for specific patient questions
  else if (context && (lowerPrompt.includes('patient') || lowerContext.includes('patient'))) {
    // If we have patient context and it's a patient-specific question
    if (lowerPrompt.includes('medicine') || lowerPrompt.includes('medication')) {
      return `Based on the information provided, the patient should continue with their prescribed medication regimen for Alzheimer's disease. Common medications include cholinesterase inhibitors (like Donepezil, Rivastigmine, and Galantamine) and memantine.

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
    else if (lowerPrompt.includes('care plan') || lowerPrompt.includes('treatment plan')) {
      return `## Individualized Care Plan Recommendations

Based on the patient information provided, here's a framework for a comprehensive care plan:

### Daily Care Routine
- Establish consistent times for waking, meals, activities, and bedtime
- Schedule activities during the patient's best time of day
- Plan rest periods between stimulating activities
- Create visual reminders for the daily schedule

### Cognitive Support
- Provide memory aids appropriate to current cognitive ability
- Incorporate familiar activities from past interests
- Allow extra time for processing and responding
- Use clear, simple communication

### Physical Care
- Assist with personal hygiene as needed while promoting independence
- Monitor for pain or discomfort (especially important as verbal abilities decrease)
- Ensure regular physical activity appropriate to ability level
- Maintain regular health check-ups and monitoring of existing conditions

### Social and Emotional Support
- Facilitate social connections with family and friends
- Consider support groups for both patient and caregivers
- Recognize and address signs of depression or anxiety
- Create opportunities for meaningful engagement

### Safety Measures
- Adapt the home environment to reduce fall risks
- Implement wandering prevention strategies if needed
- Ensure medication safety protocols
- Consider driving safety if still driving

This care plan should be adjusted regularly as needs change, and all caregivers should be familiar with the approaches that work best for this specific patient.`;
    }
    else {
      return `Based on the patient information you've shared, I can provide some guidance specific to their situation.

For someone with ${lowerContext.includes('early') ? 'early-stage' : lowerContext.includes('moderate') ? 'moderate-stage' : lowerContext.includes('advanced') ? 'advanced-stage' : ''} dementia, it's important to focus on:

1. Maintaining a consistent daily routine
2. Providing appropriate levels of support while encouraging independence where possible
3. Creating a calm, familiar environment
4. Using clear, simple communication strategies
5. Ensuring safety while respecting dignity

Each person's experience with dementia is unique, and care approaches should be personalized based on their specific needs, preferences, and changing abilities.

If you can share more specific details about the challenges you're facing with this patient, I can provide more targeted guidance and strategies.`;
    }
  }
  
  // Default response for other questions
  else {
    return `I'm here to help with questions about Alzheimer's disease and caregiving strategies. Based on evidence-based approaches, I can provide guidance on managing symptoms, communication techniques, daily care routines, and emotional support for both patients and caregivers. 

If you're looking for specific advice about a patient case or scenario, please provide more details about the situation, and I'd be happy to suggest appropriate care strategies.

For the most effective support, consider including:
- The specific challenge you're facing
- The stage of dementia the person is experiencing
- Any approaches you've already tried
- The person's background or preferences that might be relevant`;
  }
};
