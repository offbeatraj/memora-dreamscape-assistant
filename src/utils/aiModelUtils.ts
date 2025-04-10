
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
    name: 'onnx-community/tiny-random-llama2',
    task: 'text-generation',
  },
  'flan-t5': {
    name: 'onnx-community/flan-t5-small',
    task: 'text2text-generation',
  },
};

// Store the token in memory (not persisted after page reload)
let hfToken: string | null = null;

export function setHuggingFaceToken(token: string) {
  hfToken = token;
  // Clear model cache to reload with new token
  Object.keys(modelInstances).forEach(key => {
    delete modelInstances[key];
  });
  console.log("Hugging Face token set successfully. Models will reload with the new token.");
  return true;
}

export function getHuggingFaceToken(): string | null {
  return hfToken;
}

export async function getModelResponse(modelName: string, prompt: string): Promise<string> {
  try {
    console.log(`Using model: ${modelName}`);
    
    // For default model, use our predefined responses
    if (modelName === 'default') {
      return simulateResponse(prompt);
    }
    
    const config = modelConfigs[modelName];
    if (!config) {
      console.error(`Model ${modelName} not supported`);
      return "I'm sorry, this AI model is not currently supported.";
    }
    
    // Load or retrieve cached model
    if (!modelInstances[modelName]) {
      console.log(`Loading model ${config.name}...`);
      try {
        // Pass the token in options if we have it
        const options: any = {};
        if (hfToken) {
          options.credentials = {
            accessToken: hfToken
          };
        }
        
        modelInstances[modelName] = await pipeline(config.task, config.name, options);
      } catch (error) {
        console.error('Error loading model:', error);
        if (!hfToken) {
          return "Authentication error. Please provide a valid Hugging Face access token in the settings to use this model.";
        }
        return "I'm sorry, there was an error loading the AI model. Please check your Hugging Face token or try a different model.";
      }
    }
    
    // Generate response using the model
    const generator = modelInstances[modelName];
    let result;
    
    if (config.task === 'text-generation') {
      result = await generator(prompt, {
        max_length: 100,
        temperature: 0.7,
        no_repeat_ngram_size: 3,
      });
    } else if (config.task === 'text2text-generation') {
      result = await generator(prompt);
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

// Simulate responses when models aren't loaded or for testing
function simulateResponse(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
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
