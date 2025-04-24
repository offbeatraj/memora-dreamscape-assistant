
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
    
    // Add a random delay between 500-1500ms to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
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
  
  // First, let's check for specific topics to provide more varied responses
  
  // Check for greetings and conversation starters
  if (/^(hello|hi|hey|good morning|good afternoon|good evening|greetings)/.test(lowerPrompt)) {
    const greetings = [
      "Hello! I'm your memory assistant. How can I help you today?",
      "Hi there! I'm ready to assist with any questions about memory care or Alzheimer's.",
      "Good day! I'm here to provide information and support for caregivers and patients. What would you like to know?",
      "Hello! I'm your AI companion for memory care. Feel free to ask me anything about dementia or caregiving."
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // Check for "how are you" questions
  if (/how are you|how do you feel|how'?s it going|how'?s your day/.test(lowerPrompt)) {
    return "I'm functioning well, thank you for asking! More importantly, how are you feeling today? Remember that taking care of your own wellbeing is crucial, especially when caring for someone else.";
  }
  
  // Check for general questions about the day, time, or weather
  if (/what (day|date|time) is it|what'?s (today|the date|the time)/.test(lowerPrompt)) {
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = days[now.getDay()];
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `Today is ${day}, ${date}. The current time is ${time}. It's important to help orient someone with memory issues by regularly reminding them of the day, date, and time.`;
  }
  
  // Check for thank you messages
  if (/thank you|thanks|appreciate|grateful/.test(lowerPrompt)) {
    const responses = [
      "You're welcome! I'm glad I could help. Is there anything else you'd like to know?",
      "It's my pleasure to assist. Please don't hesitate to ask if you have more questions.",
      "You're very welcome. Supporting caregivers and patients is important work, and I'm here to help.",
      "Happy to assist! Remember that you can return anytime you need information or support."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Check for questions about what the AI can do
  if (/what can you (do|help with)|how (can|do) you (work|help)|what are you capable of/.test(lowerPrompt)) {
    return "I can help with a variety of topics related to memory care and Alzheimer's disease. I can provide information about symptoms, treatments, caregiving strategies, communication techniques, and daily care routines. I can also offer emotional support for caregivers and answer specific questions about patient care. What would you like to know more about?";
  }
  
  // Now check for specific question categories to provide detailed responses
  
  // Alzheimer's symptoms questions
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
  
  // Medication questions
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
  
  // Communication strategies
  else if (/communicat|talk|speak|conversation|discussing|telling/.test(lowerPrompt)) {
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
  
  // Daily activities or routine questions
  else if (/daily|routine|schedule|day to day|everyday|activities/.test(lowerPrompt)) {
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
  
  // Food and nutrition questions
  else if (/food|eat|meal|diet|nutrition|hungry|appetite|cooking/.test(lowerPrompt)) {
    return `## Nutrition and Meal Strategies for People with Dementia

Proper nutrition becomes increasingly challenging as dementia progresses:

### Practical Approaches:
1. **Adapt to changing preferences**
   - Offer smaller, more frequent meals
   - Serve one food at a time if multiple foods cause confusion
   - Provide finger foods for those who have difficulty with utensils

2. **Create a positive eating environment**
   - Minimize distractions during mealtimes
   - Use contrasting colors (dark plate on light tablecloth)
   - Ensure adequate lighting
   - Maintain a calm, unhurried atmosphere

3. **Address common challenges**
   - For decreased appetite: serve favorite foods, eat together socially
   - For forgotten meals: establish regular meal schedule with reminders
   - For difficulty swallowing: offer soft foods, consult with a speech therapist
   - For forgetting to chew: gentle verbal reminders, smaller bites

4. **Consider nutritional content**
   - Focus on nutrient-dense foods
   - Ensure adequate hydration (offer beverages regularly)
   - Consider supplements if recommended by healthcare provider
   - Monitor weight and adjust caloric intake accordingly

Remember that maintaining dignity and independence during meals is just as important as the nutritional content.`;
  }
  
  // Safety and wandering questions
  else if (/safe|safety|wander|fall|accident|risk|hazard|danger|protect|secure/.test(lowerPrompt)) {
    return `## Safety Strategies for People with Dementia

Creating a safe environment reduces risks while promoting independence:

### Home Modifications:
1. **Prevent falls**
   - Remove tripping hazards (rugs, cords)
   - Improve lighting, especially in hallways and bathrooms
   - Install grab bars in bathrooms
   - Consider contrasting colors on steps and thresholds

2. **Address wandering**
   - Secure doors with additional locks placed high or low
   - Use door alarms or wearable location devices
   - Create a safe walking path or garden area
   - Register with MedicAlert® + Alzheimer's Association Safe Return®

3. **Kitchen safety**
   - Install appliances with auto-shutoff features
   - Remove or secure dangerous items (knives, cleaning products)
   - Consider removing stove knobs when not supervised
   - Maintain familiar placement of necessary items

4. **Bathroom safety**
   - Set water heater to safe temperature (120°F/49°C)
   - Use non-slip mats in shower/tub
   - Consider a shower chair and handheld showerhead
   - Remove locks from bathroom doors

5. **General safety measures**
   - Keep emergency numbers visible
   - Have person wear medical ID
   - Secure medications
   - Remove or secure toxic plants and substances

Regular safety assessments become increasingly important as the disease progresses.`;
  }
  
  // Sleep issues
  else if (/sleep|insomnia|night|bed|rest|awake|up all night|sundown|evening/.test(lowerPrompt)) {
    return `## Managing Sleep Issues in Dementia

Sleep disturbances are common in people with dementia and can be challenging for caregivers:

### Effective Strategies:
1. **Establish consistent routines**
   - Maintain regular sleep and wake times
   - Create a calming bedtime ritual (soft music, gentle lighting)
   - Avoid stimulating activities before bed

2. **Optimize the sleep environment**
   - Ensure comfortable room temperature
   - Reduce noise and light disruptions
   - Consider a night light to prevent disorientation
   - Use familiar bedding and comfort objects

3. **Address sundowning**
   - Increase lighting in early evening to reduce shadows
   - Plan engaging activities during typical sundowning hours
   - Reduce caffeine and sugar intake in afternoon/evening
   - Consider moving dinner to an earlier time

4. **Manage daytime factors**
   - Encourage regular physical activity (but not too close to bedtime)
   - Limit daytime napping, especially late in the day
   - Ensure adequate exposure to natural daylight
   - Address pain or medical issues that might interrupt sleep

5. **When sleep problems persist**
   - Track sleep patterns to identify triggers
   - Discuss with healthcare provider before using sleep medications
   - Consider respite care to ensure caregiver can rest
   - Evaluate for sleep apnea or other sleep disorders

Remember that changes in sleep patterns are often part of the disease progression and may require ongoing adaptation of strategies.`;
  }
  
  // Caregiver stress and burnout
  else if (/stress|burnout|exhaust|tired|overwhelm|caregiver|self[ -]?care/.test(lowerPrompt)) {
    return `## Self-Care Strategies for Caregivers

Caring for someone with dementia is demanding. Taking care of yourself isn't selfish—it's essential.

### Practical Self-Care Tips:

1. **Accept help**
   - Make a specific list of tasks others can do
   - Use online care calendars to coordinate help
   - Consider respite care services for regular breaks
   - Don't wait until you're overwhelmed to ask for assistance

2. **Set realistic expectations**
   - Break large tasks into smaller steps
   - Establish priorities and learn to say no
   - Understand that perfect care isn't possible
   - Focus on meaningful moments rather than perfection

3. **Connect with others**
   - Join a caregiver support group (online or in-person)
   - Schedule regular check-ins with friends or family
   - Consider speaking with a therapist or counselor
   - Share your experiences and feelings with understanding listeners

4. **Protect your health**
   - Schedule and keep your own medical appointments
   - Aim for sufficient sleep (even if in shorter segments)
   - Choose nutritious foods when possible
   - Find ways to incorporate movement into your day

5. **Take brief restorative breaks**
   - Practice 5-minute meditation or deep breathing
   - Step outside for fresh air
   - Listen to favorite music
   - Keep a gratitude journal
   - Use visualization techniques to mentally escape briefly

Remember that your well-being directly affects your ability to provide care. Reaching out for support is a sign of strength, not weakness.`;
  }
  
  // Memory improvement questions
  else if (/memory (exercise|improve|enhance|boost|help)|brain game|cognitive|mental stimulation|brain health/.test(lowerPrompt)) {
    return `## Cognitive Stimulation Activities for Brain Health

Appropriate cognitive activities can provide meaningful engagement and potentially help maintain function:

### Beneficial Activities:
1. **Music therapy**
   - Listening to familiar songs from their past
   - Simple singing or rhythm activities
   - Music-associated movement
   - Using music to trigger positive memories

2. **Sensory stimulation**
   - Texture exploration with different fabrics
   - Aromatherapy with familiar scents (coffee, vanilla, etc.)
   - Nature sounds or guided sensory experiences
   - Taste experiences with favorite foods or flavors

3. **Art and creativity**
   - Simple painting or coloring with adult themes
   - Collage making with pre-cut images 
   - Clay or playdough modeling
   - Photography or viewing highly visual books

4. **Reminiscence activities**
   - Looking through photo albums with simple narration
   - Discussion of past occupations or hobbies
   - Handling familiar objects from earlier life
   - Creating a simple life story book

5. **Simple games**
   - Matching or sorting activities
   - Large-piece puzzles
   - Modified versions of familiar card games
   - Word association or simple word games

### Guidelines for Activities:
- Match difficulty to current abilities to avoid frustration
- Focus on enjoyment rather than achievement or correction
- Build on remaining strengths and past interests
- Adapt activities as abilities change
- Schedule during best time of day for energy levels

The goal is to provide meaningful engagement that creates positive emotional experiences rather than testing or challenging the person.`;
  }
  
  // Questions about a specific patient (if context is provided)
  else if (context && /specific|individual|tailored|personal|customized|this patient|their case/.test(lowerPrompt)) {
    // Extract patient name, age, and stage from context if available
    let patientName = "the patient";
    let patientAge = "";
    let patientStage = "";
    
    if (lowerContext.includes("name")) {
      const nameMatch = context.match(/name[:\s]+([A-Za-z]+)/i);
      if (nameMatch && nameMatch[1]) {
        patientName = nameMatch[1];
      }
    }
    
    if (lowerContext.includes("age")) {
      const ageMatch = context.match(/age[:\s]+(\d+)/i);
      if (ageMatch && ageMatch[1]) {
        patientAge = ageMatch[1];
      }
    }
    
    if (lowerContext.includes("stage")) {
      const stageMatch = context.match(/stage[:\s]+(early|moderate|advanced)/i);
      if (stageMatch && stageMatch[1]) {
        patientStage = stageMatch[1].toLowerCase();
      }
    }
    
    return `Based on the information provided about ${patientName}${patientAge ? ` who is ${patientAge} years old` : ""}, 
    ${patientStage ? `and is in the ${patientStage} stage of dementia` : ""}, 
    I can provide some tailored guidance.

${patientStage === "early" ? 
  `Since ${patientName} is in the early stage, focus on maintaining independence while providing subtle support. 
  Encourage continued participation in favorite activities, establish simple memory systems like calendars and notes, 
  and facilitate their involvement in future care planning while they can actively participate.` :
  patientStage === "moderate" ? 
  `For ${patientName}'s moderate stage dementia, structure and routine become increasingly important. 
  Simplify communication, provide visual cues around the home, monitor for safety concerns more closely, 
  and adapt activities to match current abilities while still providing a sense of accomplishment.` :
  patientStage === "advanced" ? 
  `In ${patientName}'s advanced stage, comfort and dignity are paramount. 
  Focus on sensory experiences rather than cognitive challenges, maintain physical comfort through proper positioning and touch, 
  use a calm and soothing tone even when unsure if they understand, and recognize that emotional connections often remain intact even when other abilities have declined.` :
  `Each person's experience with dementia is unique. Regular assessment of abilities and needs is important to provide appropriate care 
  that balances support with maintaining dignity and as much independence as possible.`}

Would you like me to provide more specific recommendations about a particular aspect of ${patientName}'s care?`;
  }
  
  // If no specific patterns match, provide a more generic but still helpful response
  else {
    // Check if the prompt contains certain keywords to make the response a bit more specific
    const topics = [];
    
    if (lowerPrompt.includes("help")) topics.push("assistance");
    if (lowerPrompt.includes("forget") || lowerPrompt.includes("rememb")) topics.push("memory");
    if (lowerPrompt.includes("sad") || lowerPrompt.includes("depress") || lowerPrompt.includes("upset")) topics.push("emotional support");
    if (lowerPrompt.includes("family") || lowerPrompt.includes("relative") || lowerPrompt.includes("husband") || 
        lowerPrompt.includes("wife") || lowerPrompt.includes("parent")) topics.push("family relationships");
    if (lowerPrompt.includes("explain") || lowerPrompt.includes("understand") || lowerPrompt.includes("what is")) topics.push("explanation");
    if (lowerPrompt.includes("suggest") || lowerPrompt.includes("recommend") || lowerPrompt.includes("advise")) topics.push("recommendations");
    
    if (topics.length > 0) {
      if (topics.includes("memory")) {
        return "Memory challenges can be frustrating both for the person experiencing them and for caregivers. Simple strategies like maintaining routines, using visual cues and reminders, breaking tasks into smaller steps, and creating a calm environment can help. Would you like specific memory support strategies for a particular situation?";
      } else if (topics.includes("emotional support")) {
        return "Emotional well-being is just as important as physical care. Many people affected by memory conditions experience feelings of frustration, sadness, or anxiety. Validating these emotions without trying to 'fix' them is often helpful. Professional support through counselors who specialize in dementia care can also be valuable. Would you like to explore specific emotional support strategies?";
      } else if (topics.includes("family relationships")) {
        return "Family dynamics often change when memory conditions are involved. Open communication, shared care responsibilities, and education about the condition can help family members adapt. Family counseling can sometimes help navigate these changes, and support groups can connect you with others having similar experiences. What specific aspect of family relationships are you concerned about?";
      } else if (topics.includes("explanation")) {
        return "I'd be happy to explain more about this topic. Could you let me know which specific aspects you'd like me to clarify further? I can provide information about the progression of memory conditions, treatment options, caregiving approaches, or resources available to help.";
      } else if (topics.includes("recommendations")) {
        return "I'd be happy to provide some suggestions based on best practices in memory care. To give you the most relevant recommendations, could you share a bit more about the specific situation you're facing? Different stages and symptoms often require different approaches.";
      } else {
        return "I'm here to help with information about Alzheimer's disease, dementia care, caregiver support, and daily management strategies. Could you provide more details about what you're looking for so I can give you the most helpful response?";
      }
    } else {
      // Truly generic response when we can't detect any specific topic
      const genericResponses = [
        "I'm here to help with questions about Alzheimer's disease and caregiving strategies. I can provide guidance on managing symptoms, communication techniques, daily care routines, and emotional support. What specific information would be most helpful to you right now?",
        
        "Thank you for your message. To provide the most helpful information, could you share more details about what you're looking for? I can discuss aspects of memory care, caregiver support, or specific symptoms and strategies.",
        
        "I'm your memory care assistant, here to provide information and support. Would you like to know more about managing specific symptoms, creating supportive environments, communication strategies, or something else related to memory and cognitive care?",
        
        "I'd be happy to assist you with information about dementia care, treatment options, support strategies, or resources. Could you let me know what specific aspect you're interested in learning more about?"
      ];
      
      return genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }
  }
};
