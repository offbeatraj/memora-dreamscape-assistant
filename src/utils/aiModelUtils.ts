
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

// Mock responses for when no API is available
const simulatedResponses = [
  "I understand your concern. Memory loss can be challenging to deal with. Have you noticed any specific patterns when these memory lapses occur?",
  "Based on current research, regular physical exercise, a Mediterranean diet, and cognitive stimulation may help slow cognitive decline.",
  "It's a good idea to maintain a consistent routine. Setting reminders and keeping a daily schedule can help manage daily tasks.",
  "That's a great question. Alzheimer's disease typically progresses through early, middle, and late stages, each with distinct symptoms and care needs.",
  "I recommend discussing these symptoms with a healthcare provider. They can provide proper evaluation and personalized guidance.",
  "Staying socially engaged is important. Regular interaction with family and friends can have positive effects on cognitive health.",
  "Memory exercises like puzzles, learning new skills, or using memory techniques may help maintain cognitive function.",
  "For caregivers, it's essential to also take care of your own well-being. Consider joining support groups or seeking respite care when needed."
];

// Get a random simulated response
const getSimulatedResponse = (userQuery: string): string => {
  const index = Math.floor(Math.random() * simulatedResponses.length);
  return simulatedResponses[index];
};

// Get response from the API model
export const getModelResponse = async (prompt: string): Promise<string> => {
  const apiKey = getOpenAIKey();
  
  try {
    if (!apiKey) {
      // If no API key is provided, return a simulated response
      return getSimulatedResponse(prompt);
    }

    const response = await axios.post(
      'https://router.requesty.ai/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-exp',
        messages: [
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
    // Fallback to simulated responses if API call fails
    return getSimulatedResponse(prompt);
  }
};
