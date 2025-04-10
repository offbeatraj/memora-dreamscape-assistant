
import { pipeline } from '@huggingface/transformers';

// Model cache to avoid reloading models
const modelInstances: Record<string, any> = {};

// Model configurations
const modelConfigs = {
  'gpt2': {
    name: 'gpt2',
    task: 'text-generation',
  },
  'llama-2': {
    name: 'TheBloke/Llama-2-7B-Chat-ONNX',
    task: 'text-generation',
  },
  'flan-t5': {
    name: 'google/flan-t5-small',
    task: 'text2text-generation',
  },
};

// Store the token in localStorage for persistence
export function setHuggingFaceToken(token: string) {
  try {
    if (token && token.trim()) {
      localStorage.setItem('hf_token', token);
      // Clear model cache to reload with new token
      Object.keys(modelInstances).forEach(key => {
        delete modelInstances[key];
      });
      console.log("Hugging Face token set successfully. Models will reload with the new token.");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error saving token:", error);
    return false;
  }
}

export function getHuggingFaceToken(): string | null {
  try {
    return localStorage.getItem('hf_token');
  } catch {
    return null;
  }
}

// Patient data cache for context-aware responses
let patientDataCache: Record<string, any> = {};

export function storePatientData(patientId: string, patientData: any) {
  patientDataCache[patientId] = patientData;
  return true;
}

export function getPatientData(patientId: string): any {
  return patientDataCache[patientId] || null;
}

export async function getModelResponse(modelName: string, prompt: string): Promise<string> {
  try {
    console.log(`Using model: ${modelName}`);
    
    // Check if the prompt contains patient context
    const isPatientQuery = prompt.toLowerCase().includes('context: this is about patient');
    
    // For default model, use our predefined responses with patient context if available
    if (modelName === 'default') {
      return simulateResponse(prompt, isPatientQuery);
    }
    
    const config = modelConfigs[modelName];
    if (!config) {
      console.error(`Model ${modelName} not supported`);
      return "I'm sorry, this AI model is not currently supported.";
    }
    
    // Get the token
    const hfToken = getHuggingFaceToken();
    
    // Check if token exists for non-default models
    if (!hfToken) {
      return "Please provide a valid Hugging Face access token in the settings to use this model.";
    }
    
    // Load or retrieve cached model
    const modelKey = `${modelName}_${hfToken ? 'auth' : 'noauth'}`;
    
    if (!modelInstances[modelKey]) {
      console.log(`Loading model ${config.name}...`);
      try {
        const options = {
          credentials: {
            accessToken: hfToken
          },
          cache: true,
        };
        
        modelInstances[modelKey] = await pipeline(config.task, config.name, options);
      } catch (error) {
        console.error('Error loading model:', error);
        return "I'm sorry, there was an error loading the AI model. Please check your Hugging Face token or try a different model.";
      }
    }
    
    // Generate response using the model
    const generator = modelInstances[modelKey];
    let result;
    
    try {
      if (config.task === 'text-generation') {
        result = await generator(prompt, {
          max_length: 100,
          temperature: 0.7,
          no_repeat_ngram_size: 3,
        });
      } else if (config.task === 'text2text-generation') {
        result = await generator(prompt);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      return "Authentication error with the Hugging Face API. Please verify your token is valid and has the necessary permissions.";
    }
    
    if (!result) {
      return "I apologize, but I wasn't able to generate a response. Please try again.";
    }

    // Format and return the response
    let response = '';
    if (Array.isArray(result)) {
      response = result[0].generated_text || '';
      // Clean up response - remove the prompt part if it's included
      if (response.startsWith(prompt)) {
        response = response.substring(prompt.length).trim();
      }
    } else if (result.generated_text) {
      response = result.generated_text;
    }
    
    return response || "I apologize, but I wasn't able to generate a meaningful response.";
  } catch (error) {
    console.error('Error generating response:', error);
    return "I'm sorry, there was an error generating a response. Please try again later.";
  }
}

// Enhanced simulate responses when models aren't loaded or for testing
function simulateResponse(prompt: string, isPatientQuery: boolean): string {
  const promptLower = prompt.toLowerCase();
  
  // Extract patient name and condition if this is a patient query
  let patientName = "";
  let patientStage = "";
  let patientAge = "";
  
  if (isPatientQuery) {
    // Parse patient information from the prompt
    const nameMatch = prompt.match(/patient\s+([A-Za-z\s]+)\s+who/i);
    if (nameMatch && nameMatch[1]) {
      patientName = nameMatch[1].trim();
    }
    
    const stageMatch = prompt.match(/(early|moderate|advanced)\s+stage/i);
    if (stageMatch && stageMatch[1]) {
      patientStage = stageMatch[1].toLowerCase();
    }
    
    const ageMatch = prompt.match(/Age:\s*(\d+)/i);
    if (ageMatch && ageMatch[1]) {
      patientAge = ageMatch[1];
    }
    
    // Patient-specific responses based on stage
    if (promptLower.includes('medication') || promptLower.includes('medicine')) {
      if (patientStage === "early") {
        return `${patientName} is currently taking Donepezil (5mg) once daily in the morning. This medication helps manage symptoms by increasing acetylcholine levels in the brain. The doctor has also recommended a vitamin B complex supplement to support overall brain health.`;
      } else if (patientStage === "moderate") {
        return `${patientName} is on Donepezil (10mg) and Memantine (10mg), taken in the morning and evening respectively. These medications work together to manage symptoms more effectively at this stage. Regular monitoring for side effects is important.`;
      } else if (patientStage === "advanced") {
        return `${patientName}'s current medication regimen includes Donepezil (10mg), Memantine (20mg), and Trazodone as needed for sleep disturbances. Medication is administered by the caregiver twice daily, and swallowing assistance may be required.`;
      }
    }
    
    if (promptLower.includes('activities') || promptLower.includes('exercise')) {
      if (patientStage === "early") {
        return `For ${patientName} at the early stage, I recommend daily cognitive exercises like puzzles, reading, and memory games. Physical activities like walking for 30 minutes daily are also beneficial. Maintaining social engagement through group activities helps preserve cognitive function.`;
      } else if (patientStage === "moderate") {
        return `At the moderate stage, ${patientName} would benefit from structured activities with some assistance. Simple crafts, listening to familiar music, and gentle exercise like seated yoga can be helpful. Activities should be scheduled during their best time of day, typically mornings.`;
      } else if (patientStage === "advanced") {
        return `For ${patientName} in the advanced stage, sensory stimulation activities are most appropriate. These include listening to favorite music, looking at family photos, gentle touch therapy, and aromatherapy. Short, simple interactions throughout the day are better than longer sessions.`;
      }
    }
    
    if (promptLower.includes('diet') || promptLower.includes('nutrition') || promptLower.includes('food')) {
      if (patientStage === "early") {
        return `${patientName} should follow a Mediterranean-style diet rich in vegetables, fruits, whole grains, fish, and olive oil. This diet has been shown to support brain health. Regular meal times and adequate hydration are important. ${patientName} can still prepare simple meals with minimal assistance.`;
      } else if (patientStage === "moderate") {
        return `At this moderate stage, ${patientName} benefits from nutrient-dense, easy-to-eat foods. Finger foods can promote independence. Meals should be served in a calm environment with minimal distractions. Regular monitoring of fluid intake is essential to prevent dehydration.`;
      } else if (patientStage === "advanced") {
        return `${patientName} requires a carefully planned diet of soft or pureed foods to address swallowing difficulties. High-calorie, nutrient-dense options are important as weight loss is common at this stage. Supervision during all meals is necessary, and thickened liquids may be recommended.`;
      }
    }
    
    if (promptLower.includes('symptoms') || promptLower.includes('experiencing')) {
      if (patientStage === "early") {
        return `${patientName} is experiencing mild memory lapses, especially with recent events, occasional word-finding difficulties, and some challenges with complex tasks like managing finances. However, ${patientName} still maintains independence in daily activities and recognizes these changes.`;
      } else if (patientStage === "moderate") {
        return `At this moderate stage, ${patientName} shows significant memory impairment affecting both recent and some past events, increased confusion especially in the evening (sundowning), difficulty recognizing some family members, and requires assistance with activities like dressing and bathing.`;
      } else if (patientStage === "advanced") {
        return `${patientName} is experiencing severe cognitive decline including minimal verbal communication, inability to recognize close family members, and complete dependence on caregivers for all activities of daily living. Physical symptoms include difficulty walking, swallowing problems, and increased susceptibility to infections.`;
      }
    }
    
    // Generic personalized response if no specific topic is matched
    return `Based on ${patientName}'s case study and current ${patientStage} stage of Alzheimer's at age ${patientAge}, I would recommend discussing this specific question with their healthcare provider at the next appointment. Each patient's journey with Alzheimer's is unique, and personalized care recommendations are essential.`;
  }
  
  // Default responses for general queries
  if (promptLower.includes('alzheimer') && promptLower.includes('symptom')) {
    return "Early symptoms of Alzheimer's include memory loss affecting daily activities, difficulty completing familiar tasks, confusion with time or place, trouble understanding visual images, and new problems with words in speaking or writing.";
  } else if (promptLower.includes('treatment') || promptLower.includes('medication')) {
    return "Current treatments for Alzheimer's focus on helping people maintain cognitive function and manage behavioral symptoms. Medications like cholinesterase inhibitors (Aricept, Exelon) and memantine (Namenda) may help reduce symptoms. Non-drug approaches include cognitive stimulation and lifestyle modifications.";
  } else if (promptLower.includes('diet') || promptLower.includes('food') || promptLower.includes('nutrition')) {
    return "A Mediterranean-style diet may benefit brain health. This includes plenty of fruits, vegetables, whole grains, olive oil, fish, and limited red meat. Foods rich in omega-3 fatty acids, antioxidants, and B vitamins are particularly beneficial.";
  } else if (promptLower.includes('exercise') || promptLower.includes('physical')) {
    return "Regular physical exercise may directly benefit brain cells by increasing blood and oxygen flow. Even moderate exercise like a brisk 30-minute walk several times a week can be beneficial for brain health.";
  } else {
    return "I'm using the default response system. For more accurate and detailed responses, try selecting one of the AI models from the dropdown menu above.";
  }
}
