
import axios from 'axios';

// Store the API key in local storage
export const setOpenAIKey = (key: string) => {
  if (key) {
    localStorage.setItem('openai_api_key', key);
  } else {
    localStorage.removeItem('openai_api_key');
  }
};

// Retrieve the API key from local storage
export const getOpenAIKey = (): string => {
  return localStorage.getItem('openai_api_key') || '';
};

// Check if OpenAI access is available
export const hasOpenAIAccess = (): boolean => {
  return !!getOpenAIKey();
};

// Store patient data for context aware responses
export const storePatientData = (patientId: string, patientData: any): void => {
  try {
    localStorage.setItem(`patient_${patientId}`, JSON.stringify(patientData));
  } catch (error) {
    console.error('Error storing patient data:', error);
  }
};

// Get stored patient data
export const getPatientData = (patientId: string): any => {
  try {
    const data = localStorage.getItem(`patient_${patientId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving patient data:', error);
    return null;
  }
};

// Clean text of any markdown syntax or asterisks
const cleanTextFormatting = (text: string): string => {
  // Replace markdown bold/italic syntax with plain text
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
    .replace(/__(.*?)__/g, '$1')     // Remove underscore bold markdown
    .replace(/_(.*?)_/g, '$1')       // Remove underscore italic markdown
    .replace(/`(.*?)`/g, '$1')       // Remove code markdown
    .trim();
};

// Enhanced topic-based responses with much greater variety when no API is available
const topicResponses: Record<string, string[]> = {
  memory: [
    "Memory loss that disrupts daily life may be a symptom of Alzheimer's. It's normal to occasionally forget names or appointments but remember them later.",
    "Short-term memory is often affected first in Alzheimer's disease. The person may forget information they just learned or ask the same question repeatedly.",
    "Memory aids like calendars, to-do lists, and reminder notes can help manage memory problems in early-stage Alzheimer's.",
    "In Alzheimer's disease, the ability to form new memories is often impaired first, while long-term memories from many years ago might remain intact longer.",
    "Regular mental exercises like puzzles, reading, and learning new skills can help maintain cognitive function and potentially slow memory decline.",
    "Reminiscence therapy using old photos, music, and familiar objects can help trigger memories and improve mood in people with Alzheimer's.",
  ],
  symptoms: [
    "**Early symptoms of Alzheimer's** include memory problems that disrupt daily life, such as *forgetting recently learned information* and important dates or events.",
    "**Early Alzheimer's signs** often include *challenges in planning or solving problems*, like trouble following a familiar recipe or managing monthly bills.",
    "**Common early symptoms** include *difficulty completing familiar tasks* at home, at work, or at leisure, such as driving to a familiar location or remembering rules of a favorite game.",
    "**Early indicators of Alzheimer's** include *confusion with time or place* - people may lose track of dates, seasons, and the passage of time.",
    "**Early warning signs** include *trouble understanding visual images and spatial relationships*, which may cause problems with reading, judging distance, and determining color or contrast.",
    "**Key early symptoms** include *new problems with words* in speaking or writing, such as following or joining a conversation or struggling with vocabulary.",
  ],
  medication: [
    "It's important to take medications as prescribed. Setting alarms or using pill organizers can help maintain your medication schedule.",
    "Cholinesterase inhibitors like donepezil, rivastigmine, and galantamine are common medications that may help manage Alzheimer's symptoms by boosting levels of a chemical messenger involved in memory and judgment.",
    "Memantine (Namenda) works by regulating glutamate, another chemical messenger involved in brain functions like learning and memory.",
    "Always consult with your doctor before making any changes to your medication regimen, as abrupt changes can sometimes worsen symptoms.",
    "Side effects of Alzheimer's medications may include nausea, vomiting, diarrhea, decreased appetite, and sleep disturbances. Report any concerning side effects to your healthcare provider.",
    "Some supplements like vitamin E have been studied for Alzheimer's, but their benefits are limited and should only be taken under medical supervision.",
  ],
  family: [
    "Family photos can help stimulate memories and provide emotional comfort. Looking at them regularly can be a meaningful activity.",
    "Creating a family photo album with labels can help identify people and remember special events, which may become more difficult as Alzheimer's progresses.",
    "Family members should try to maintain regular routines and familiar environments, as this can help reduce anxiety and confusion.",
    "Engaging family members in simple activities like looking through photo albums, listening to familiar music, or cooking simple recipes together can help maintain connections.",
    "Family caregivers should also prioritize their own health and well-being, as caregiver burnout is common and can affect the quality of care provided.",
    "Support groups for family members of people with Alzheimer's can provide valuable emotional support and practical advice.",
  ],
  activities: [
    "Engaging in familiar activities that you enjoy can help maintain skills and provide a sense of accomplishment and purpose.",
    "Physical activities like walking, chair exercises, or gentle yoga can improve mood, maintain physical health, and potentially help manage behavioral symptoms.",
    "Creative activities like painting, coloring, or simple crafts can be engaging and don't require significant memory skills to enjoy.",
    "Music therapy can be particularly beneficial, as musical memory often remains intact even in advanced stages of Alzheimer's.",
    "Activities should be adapted to the person's current abilities to avoid frustration. Break complex activities into simple steps.",
    "Sensory activities involving different textures, sounds, or scents can be engaging and soothing, especially in later stages.",
  ],
  safety: [
    "Home safety modifications like removing tripping hazards, installing handrails, and using locks on potentially dangerous items can help prevent accidents.",
    "Consider using door alarms or monitoring systems if wandering is a concern.",
    "Medical ID bracelets with contact information can be crucial if the person becomes lost or confused outside the home.",
    "As Alzheimer's progresses, regular assessment of driving ability is important, as impaired judgment and slower reaction times can make driving dangerous.",
    "Keep medications in a secure location and consider using a pill organizer with supervision to prevent medication errors.",
    "Simplify the home environment to reduce confusion - clear paths, reduce clutter, and use labels or pictures on important items.",
  ],
  communication: [
    "Speak slowly and clearly using simple words and short sentences when communicating with someone who has Alzheimer's.",
    "Maintain eye contact and call the person by name to help maintain their attention during conversations.",
    "Ask one question at a time and provide simple choices rather than open-ended questions that might cause confusion.",
    "Be patient and allow extra time for the person to process information and respond.",
    "Use visual cues and gestures along with verbal communication to help convey your message.",
    "Avoid arguing or correcting misconceptions directly. Instead, validate feelings and redirect the conversation if needed.",
  ],
  diet: [
    "The Mediterranean diet, rich in fruits, vegetables, whole grains, fish, and olive oil, has been associated with better cognitive function and may help slow cognitive decline.",
    "Staying hydrated is important, but some people with Alzheimer's may forget to drink enough fluids, so regular reminders may be necessary.",
    "As Alzheimer's progresses, swallowing difficulties may develop. Food might need to be cut into smaller pieces or puréed.",
    "Regular meal times and familiar foods can help establish routine and improve food intake.",
    "Some people with Alzheimer's may develop increased cravings for sweet foods, but balanced nutrition remains important.",
    "Nutritional supplements might be recommended if the person is losing weight or not eating enough variety.",
  ],
  sleep: [
    "Sleep disturbances are common in Alzheimer's and can include difficulty falling asleep, frequent waking, and day-night reversal.",
    "Maintaining a regular sleep schedule and creating a calming bedtime routine can help improve sleep quality.",
    "Limiting caffeine and alcohol, especially in the afternoon and evening, may help improve sleep.",
    "Exposure to natural daylight during the day and keeping the bedroom dark at night can help maintain normal sleep-wake cycles.",
    "If the person wakes during the night, gentle reassurance and redirection back to bed is better than arguing or complex explanations.",
    "Discuss persistent sleep problems with a healthcare provider, as medications might be considered if non-medical approaches aren't effective.",
  ],
  stages: [
    "Early-stage Alzheimer's typically involves mild memory lapses, difficulty with organization, and occasional word-finding problems, though the person can still function independently in many areas.",
    "In middle-stage Alzheimer's, memory loss worsens and assistance with daily activities becomes necessary. Confusion about time and place becomes more common.",
    "Late-stage Alzheimer's involves severe memory loss, physical challenges, and the need for full-time care. The person may no longer recognize close family members.",
    "The progression of Alzheimer's varies greatly between individuals. Some people may live with the disease for 20 years, while others may decline more rapidly.",
    "Even in advanced stages, emotional connections often remain, and the person may still respond to familiar voices, touch, and music.",
    "As the disease progresses, care needs to evolve from supporting independence to providing more direct assistance with daily activities.",
  ],
  general: [
    "It's important to maintain regular check-ups with your healthcare provider to monitor your condition and adjust treatment as needed.",
    "A structured daily routine can help provide a sense of security and stability for someone with Alzheimer's.",
    "Both physical exercise and mental stimulation are important components of managing Alzheimer's disease.",
    "Social engagement remains important throughout the course of Alzheimer's disease, though the nature of activities may need to change over time.",
    "Reducing stress through relaxation techniques can help with managing symptoms, as stress can sometimes worsen cognitive symptoms.",
    "Adequate sleep is important for cognitive function and emotional well-being, and sleep disturbances should be addressed with a healthcare provider.",
    "While there is no cure for Alzheimer's disease, treatments can help manage symptoms and potentially slow disease progression.",
  ]
};

// Track recent responses to avoid repetition
let recentGeneralResponses: string[] = [];
let recentPatientResponses: string[] = [];

// Get a more contextually relevant simulated response with improved topic detection
const getSimulatedResponse = (userQuery: string, previousResponses: string[] = []): string => {
  // Convert query to lowercase for easier matching
  const query = userQuery.toLowerCase();
  
  // Add special handling for questions about early symptoms or signs of Alzheimer's
  if (query.includes('early symptom') || query.includes('early sign') || 
      (query.includes('symptom') && query.includes('alzheimer')) ||
      (query.includes('sign') && query.includes('alzheimer'))) {
    const responses = topicResponses.symptoms;
    
    // Avoid repeating the last response for this topic if possible
    if (previousResponses.length > 0 && responses.length > 1) {
      const filteredResponses = responses.filter(resp => !previousResponses.includes(resp));
      if (filteredResponses.length > 0) {
        return filteredResponses[Math.floor(Math.random() * filteredResponses.length)];
      }
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // More comprehensive keyword matching for better topic identification
  const topicKeywords = {
    memory: ['memory', 'forget', 'remember', 'recall', 'brain', 'cognitive', 'thinking', 'mind', 'concentration', 'focus'],
    medication: ['medicine', 'medication', 'pill', 'drug', 'prescription', 'treatment', 'donepezil', 'aricept', 'memantine', 'namenda', 'rivastigmine', 'exelon', 'galantamine', 'razadyne'],
    family: ['family', 'photo', 'picture', 'relative', 'son', 'daughter', 'husband', 'wife', 'parent', 'child', 'spouse', 'sibling'],
    activities: ['activity', 'exercise', 'routine', 'task', 'hobby', 'game', 'puzzle', 'music', 'art', 'walk', 'craft', 'gardening'],
    safety: ['safety', 'fall', 'wander', 'lost', 'driving', 'kitchen', 'bathroom', 'stairs', 'trip', 'hazard', 'danger', 'accident'],
    communication: ['talk', 'speak', 'conversation', 'communicate', 'language', 'word', 'speech', 'understand', 'comprehend', 'explain'],
    diet: ['food', 'eat', 'diet', 'nutrition', 'meal', 'drink', 'appetite', 'weight', 'cooking', 'swallow'],
    sleep: ['sleep', 'night', 'insomnia', 'rest', 'bed', 'wake', 'nap', 'tired', 'fatigue', 'drowsy'],
    stages: ['stage', 'progress', 'worsen', 'advance', 'deteriorate', 'decline', 'early', 'middle', 'late', 'mild', 'moderate', 'severe']
  };
  
  // Check for specific date/time questions
  if (query.includes('day') || query.includes('date') || query.includes('time') || query.includes('today') || query.includes('month') || query.includes('year')) {
    const date = new Date();
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const fullDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `Today is ${dayOfWeek}, ${fullDate}. The current time is ${time}. It's important to keep track of the date and time to maintain daily routines and remember appointments.`;
  }
  
  // Identify topics based on keywords
  const matchedTopics: string[] = [];
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => query.includes(keyword))) {
      matchedTopics.push(topic);
    }
  }
  
  // If we have matched topics, select one (prioritizing the most relevant)
  if (matchedTopics.length > 0) {
    // If multiple topics match, either pick the most specific one or randomly choose one
    const selectedTopic = matchedTopics[Math.floor(Math.random() * matchedTopics.length)];
    const responses = topicResponses[selectedTopic];
    
    // Avoid repeating the last response for this topic if possible
    if (previousResponses.length > 0 && responses.length > 1) {
      const filteredResponses = responses.filter(resp => !previousResponses.includes(resp));
      if (filteredResponses.length > 0) {
        return filteredResponses[Math.floor(Math.random() * filteredResponses.length)];
      }
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Check for greeting patterns
  if (query.includes('hello') || query.includes('hi ') || query.includes('hey') || query.match(/^hi$/) || query.includes('greetings')) {
    const greetings = [
      "Hello! I'm your memory care assistant. How can I help you today?",
      "Hi there! I'm here to provide information and support about Alzheimer's and memory care. What would you like to know?",
      "Hello! I'm ready to answer your questions about memory care, daily activities, or anything else related to Alzheimer's support.",
      "Greetings! I'm here to assist with information about Alzheimer's disease and memory care. How may I help you?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // Check for thank you patterns
  if (query.includes('thank') || query.includes('thanks') || query.includes('appreciate')) {
    const acknowledgements = [
      "You're welcome! I'm here to help whenever you need information or support.",
      "I'm glad I could assist. Please don't hesitate to ask if you have more questions.",
      "Happy to help! Is there anything else you'd like to know about?",
      "You're very welcome. Remember, I'm available anytime you need assistance with Alzheimer's and memory care questions."
    ];
    return acknowledgements[Math.floor(Math.random() * acknowledgements.length)];
  }
  
  // If no specific topic is identified, provide a general response
  const generalResponses = topicResponses.general;
  
  // Avoid repeating recent general responses
  if (previousResponses.length > 0 && generalResponses.length > 1) {
    const filteredResponses = generalResponses.filter(resp => !previousResponses.includes(resp));
    if (filteredResponses.length > 0) {
      return filteredResponses[Math.floor(Math.random() * filteredResponses.length)];
    }
  }
  
  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
};

// Get response from the API model for general chatbot assistant
export const getModelResponse = async (prompt: string): Promise<string> => {
  const apiKey = getOpenAIKey();
  
  try {
    if (!apiKey) {
      // If no API key is provided, return a more contextually relevant simulated response
      const response = getSimulatedResponse(prompt, recentGeneralResponses);
      
      // Track recent responses (keep last 3)
      recentGeneralResponses.push(response);
      if (recentGeneralResponses.length > 3) {
        recentGeneralResponses = recentGeneralResponses.slice(-3);
      }
      
      return response;
    }

    const response = await axios.post(
      'https://router.requesty.ai/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-exp',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant specializing in Alzheimer\'s and memory care. Provide clear, concise, and accurate information. Your responses should be supportive, practical, and vary based on the specific questions asked. Never repeat the same response for different questions.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const textResponse = response.data.choices[0].message.content;
      // Clean any markdown formatting before returning
      return cleanTextFormatting(textResponse);
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('API request error:', error);
    // Fallback to contextual simulated responses if API call fails
    const response = getSimulatedResponse(prompt, recentGeneralResponses);
    
    // Track recent responses
    recentGeneralResponses.push(response);
    if (recentGeneralResponses.length > 3) {
      recentGeneralResponses = recentGeneralResponses.slice(-3);
    }
    
    return response;
  }
};

// Get response specifically for the Patient Assistant using the Gemini model
export const getPatientModelResponse = async (prompt: string, patientContext: string = ''): Promise<string> => {
  const apiKey = getOpenAIKey();
  
  try {
    if (!apiKey) {
      // Special handling for early symptom questions in patient context
      if (prompt.toLowerCase().includes('early symptom') || 
          prompt.toLowerCase().includes('early sign') || 
          (prompt.toLowerCase().includes('symptom') && prompt.toLowerCase().includes('alzheimer'))) {
        const responses = topicResponses.symptoms;
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        // Track recent responses
        recentPatientResponses.push(response);
        if (recentPatientResponses.length > 3) {
          recentPatientResponses = recentPatientResponses.slice(-3);
        }
        
        // Extract patient name if available in the context
        const patientName = patientContext.match(/patient\s+(\w+)/i)?.[1] || '';
        return patientName ? `For ${patientName}: ${response}` : response;
      }
      
      // Extract patient name if available in the context
      const patientName = patientContext.match(/patient\s+(\w+)/i)?.[1] || '';
      
      // Get a personalized simulated response that varies based on the question
      const response = getSimulatedResponse(prompt, recentPatientResponses);
      
      // Track recent responses
      recentPatientResponses.push(response);
      if (recentPatientResponses.length > 3) {
        recentPatientResponses = recentPatientResponses.slice(-3);
      }
      
      // Personalize the response with the patient's name if available
      return patientName ? `For ${patientName}: ${response}` : response;
    }

    // Create a prompt that includes patient context if available
    const enhancedPrompt = patientContext ? 
      `${patientContext}\n\nQuestion about this patient: ${prompt}` : 
      prompt;

    const response = await axios.post(
      'https://router.requesty.ai/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-exp', // Specifically use Gemini model for patient assistant
        messages: [
          { 
            role: 'system', 
            content: 'You are a specialized patient care assistant for Alzheimer\'s and dementia. When given patient context, tailor your responses specifically to that patient\'s situation, stage, and needs. Provide personalized, practical advice relevant to their exact condition. Ensure your responses are varied and directly address the specific questions asked.'
          },
          { role: 'user', content: enhancedPrompt }
        ],
        temperature: 0.7, // Slightly higher temperature for more varied responses
        max_tokens: 700  // Allow slightly longer responses for detailed patient info
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const textResponse = response.data.choices[0].message.content;
      // Clean any markdown formatting before returning
      return cleanTextFormatting(textResponse);
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('API request error:', error);
    // Fallback to contextual simulated responses if API call fails
    const response = getSimulatedResponse(prompt, recentPatientResponses);
    
    // Track recent responses
    recentPatientResponses.push(response);
    if (recentPatientResponses.length > 3) {
      recentPatientResponses = recentPatientResponses.slice(-3);
    }
    
    return response;
  }
};
