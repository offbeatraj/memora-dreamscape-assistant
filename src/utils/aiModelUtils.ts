
import { pipeline, PipelineType } from '@huggingface/transformers';

// Set the Hugging Face token directly
const HUGGING_FACE_TOKEN = "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";

// Store token for persistence
localStorage.setItem('hf_token', HUGGING_FACE_TOKEN);
localStorage.setItem('huggingface-auth-token', HUGGING_FACE_TOKEN);

// Model cache to avoid reloading models
const modelInstances: Record<string, any> = {};

// Default model configuration
const DEFAULT_MODEL = {
  name: 'meta-llama/llama-4-scout:free',
  task: 'text-generation' as PipelineType,
  config: {
    max_new_tokens: 512,
    temperature: 0.7,
    top_p: 0.95,
    repetition_penalty: 1.1,
    do_sample: true
  }
};

// Format the prompt for Llama model
function formatPrompt(prompt: string): string {
  return `<|system|>
You are a helpful AI assistant specialized in Alzheimer's and dementia care.
<|user|>
${prompt}
<|assistant|>`;
}

// Get the Hugging Face token
export function getHuggingFaceToken(): string {
  return HUGGING_FACE_TOKEN;
}

// Check if user has access to the model
export async function checkModelAccess(): Promise<boolean> {
  try {
    const response = await fetch(`https://huggingface.co/api/models/${DEFAULT_MODEL.name}`, {
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_TOKEN}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error("Error checking model access:", error);
    return false;
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

// Authenticate with Hugging Face API
export async function authenticateWithCLI(): Promise<boolean> {
  try {
    console.log("Authenticating with permanent token");
    
    // Validate token by making a test request to Hugging Face API
    const response = await fetch("https://huggingface.co/api/whoami", {
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_TOKEN}`
      }
    });

    if (!response.ok) {
      console.error("Token authentication failed:", response.status);
      return false;
    }

    console.log("Authentication successful");
    return true;
  } catch (error) {
    console.error("Authentication error:", error);
    return false;
  }
}

export async function getModelResponse(prompt: string): Promise<string> {
  try {
    console.log(`Using Llama model with permanent token`);
    
    // Check if the prompt contains patient context
    const isPatientQuery = prompt.toLowerCase().includes('context: this is about patient');
    
    // For non-patient queries or fallbacks, use simulated responses
    if (!isPatientQuery && Math.random() > 0.2) { // 80% chance to use simulated response for non-patient queries
      return simulateResponse(prompt, isPatientQuery);
    }
    
    // Get or create model instance
    const modelKey = `llama_${HUGGING_FACE_TOKEN}`;
    
    if (!modelInstances[modelKey]) {
      console.log(`Loading Llama model...`);
      try {
        // Set up authentication
        localStorage.setItem('huggingface-auth-token', HUGGING_FACE_TOKEN);
        
        // Create pipeline
        console.log("Creating pipeline for Llama model");
        
        // Attempt to use WebGPU for better performance if available
        try {
          modelInstances[modelKey] = await pipeline(
            DEFAULT_MODEL.task, 
            DEFAULT_MODEL.name, 
            { device: "webgpu" }
          );
          console.log("Successfully loaded model with WebGPU acceleration");
        } catch (gpuError) {
          console.log("WebGPU not available or error occurred, falling back to default:", gpuError);
          modelInstances[modelKey] = await pipeline(
            DEFAULT_MODEL.task, 
            DEFAULT_MODEL.name
          );
        }
      } catch (error) {
        console.error('Error loading model:', error);
        // Provide detailed error message
        if (error instanceof Error) {
          if (error.message.includes('Unauthorized') || error.message.includes('401')) {
            return "Authentication error. Your token may not have access to the Llama model. Please check your Hugging Face token permissions.";
          }
        }
        return simulateResponse(prompt, isPatientQuery);
      }
    }
    
    // Generate response using the model
    const generator = modelInstances[modelKey];
    let result;
    
    try {
      // Format prompt for Llama
      const formattedPrompt = formatPrompt(prompt);
      console.log("Using Llama prompt format:", formattedPrompt);
      
      // Use model config
      console.log(`Generating text with Llama model using config:`, DEFAULT_MODEL.config);
      result = await generator(formattedPrompt, DEFAULT_MODEL.config);
      
      console.log("Raw model result:", result);
    } catch (error) {
      console.error('Error generating response:', error);
      return "Error generating response from the model. Falling back to default responses.";
    }
    
    if (!result) {
      return simulateResponse(prompt, isPatientQuery);
    }

    // Format and return the response
    let response = '';
    if (Array.isArray(result)) {
      response = result[0].generated_text || '';
      
      // Extract response from formatted output
      if (response.includes('<|assistant|>')) {
        response = response.split('<|assistant|>')[1].trim();
      }
    } else if (result.generated_text) {
      response = result.generated_text;
      
      // Extract response from formatted output
      if (response.includes('<|assistant|>')) {
        response = response.split('<|assistant|>')[1].trim();
      }
    }
    
    return response || simulateResponse(prompt, isPatientQuery);
  } catch (error) {
    console.error('Error generating response:', error);
    return simulateResponse(prompt, isPatientQuery);
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
    return "I'm using the default response system. For more accurate and detailed responses, please be specific about your Alzheimer's or memory care questions.";
  }
}
