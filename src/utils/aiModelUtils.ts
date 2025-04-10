
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

// Enhanced topic-based responses when no API is available
const topicResponses: Record<string, string[]> = {
  memory: [
    "Memory loss that disrupts daily life may be a symptom of Alzheimer's. It's normal to occasionally forget names or appointments but remember them later.",
    "Strategies that can help with memory include keeping a regular routine, using reminder notes, and breaking tasks into small steps.",
    "Regular mental exercises like puzzles, reading, and learning new skills can help maintain cognitive function.",
  ],
  medication: [
    "It's important to take medications as prescribed. Setting alarms or using pill organizers can help maintain your medication schedule.",
    "Always consult with your doctor before making any changes to your medication regimen.",
    "Keep a list of all medications, their dosages, and schedules to share with healthcare providers at appointments.",
  ],
  family: [
    "Family photos can help stimulate memories and provide emotional comfort. Looking at them regularly can be a meaningful activity.",
    "Creating a family photo album with labels can help identify people and remember special events.",
    "Sharing stories about family members and events can help maintain connections and stimulate memories.",
  ],
  activities: [
    "Engaging in familiar activities that you enjoy can help maintain skills and provide a sense of accomplishment.",
    "Physical activities like walking can improve mood and maintain physical health, which supports brain health.",
    "Social activities are important for maintaining cognitive function and emotional well-being.",
  ],
  general: [
    "It's important to maintain regular check-ups with your healthcare provider to monitor your condition.",
    "A balanced diet rich in fruits, vegetables, and omega-3 fatty acids may support brain health.",
    "Adequate sleep is important for cognitive function and emotional well-being.",
    "Reducing stress through relaxation techniques can help with managing symptoms.",
  ]
};

// Get a more contextually relevant simulated response
const getSimulatedResponse = (userQuery: string): string => {
  // Convert query to lowercase for easier matching
  const query = userQuery.toLowerCase();
  
  // Check for keywords to determine the response category
  if (query.includes('memory') || query.includes('forget') || query.includes('remember')) {
    const responses = topicResponses.memory;
    return responses[Math.floor(Math.random() * responses.length)];
  } else if (query.includes('medicine') || query.includes('medication') || query.includes('pill') || query.includes('drug')) {
    const responses = topicResponses.medication;
    return responses[Math.floor(Math.random() * responses.length)];
  } else if (query.includes('family') || query.includes('photo') || query.includes('picture') || query.includes('relative')) {
    const responses = topicResponses.family;
    return responses[Math.floor(Math.random() * responses.length)];
  } else if (query.includes('activity') || query.includes('exercise') || query.includes('routine') || query.includes('task')) {
    const responses = topicResponses.activities;
    return responses[Math.floor(Math.random() * responses.length)];
  } else if (query.includes('day') || query.includes('date') || query.includes('time') || query.includes('today')) {
    // Add responses for date/time questions
    return `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. It's important to keep track of the date for appointments and daily routines.`;
  } else {
    // Default to general responses
    const responses = topicResponses.general;
    return responses[Math.floor(Math.random() * responses.length)];
  }
};

// Get response from the API model
export const getModelResponse = async (prompt: string): Promise<string> => {
  const apiKey = getOpenAIKey();
  
  try {
    if (!apiKey) {
      // If no API key is provided, return a more contextually relevant simulated response
      return getSimulatedResponse(prompt);
    }

    const response = await axios.post(
      'https://router.requesty.ai/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-exp',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant specializing in Alzheimer\'s and memory care. Provide clear, concise, and accurate information. Your responses should be supportive and practical.'
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
    return getSimulatedResponse(prompt);
  }
};
