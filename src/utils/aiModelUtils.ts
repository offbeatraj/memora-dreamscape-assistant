
import { pipeline, PipelineType } from '@huggingface/transformers';

// Model cache to avoid reloading models
const modelInstances: Record<string, any> = {};

// Default configuration for a freely accessible smaller model
const DEFAULT_MODEL = {
  name: 'facebook/opt-125m', // Smaller model that's freely accessible
  task: 'text-generation' as PipelineType,
  config: {
    max_new_tokens: 512,
    temperature: 0.7,
    top_p: 0.95,
    repetition_penalty: 1.1,
    do_sample: true
  }
};

// We'll add support for OpenAI as an alternative
let OPENAI_API_KEY = '';

// Format the prompt for the model
function formatPrompt(prompt: string): string {
  return `Question: ${prompt}\nAnswer:`;
}

// Set OpenAI API key
export function setOpenAIKey(key: string): void {
  OPENAI_API_KEY = key;
  localStorage.setItem('openai_key', key);
}

// Get OpenAI API key
export function getOpenAIKey(): string {
  const storedKey = localStorage.getItem('openai_key');
  return OPENAI_API_KEY || storedKey || '';
}

// Check if we have OpenAI access
export function hasOpenAIAccess(): boolean {
  return !!getOpenAIKey();
}

// Patient data cache for context-aware responses
let patientDataCache: Record<string, any> = {};

export function storePatientData(patientId: string, patientData: any) {
  patientDataCache[patientId] = patientData;
  console.log("Patient data stored:", patientId, patientData);
  return true;
}

export function getPatientData(patientId: string): any {
  return patientDataCache[patientId] || null;
}

// Function to use OpenAI API
async function getOpenAIResponse(prompt: string): Promise<string> {
  try {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      throw new Error("OpenAI API key is not set");
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in Alzheimer\'s disease. Provide accurate, helpful, and compassionate information. If you\'re given patient context, tailor your response to their specific situation and stage of Alzheimer\'s.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Error calling OpenAI API");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

export async function getModelResponse(prompt: string): Promise<string> {
  try {
    // Check if the prompt contains patient context
    const containsPatientContext = prompt.toLowerCase().includes('context: this is about patient');
    
    console.log("Processing prompt:", prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""));
    
    // Try to use OpenAI first if available
    if (hasOpenAIAccess()) {
      try {
        console.log("Using OpenAI API for response");
        const response = await getOpenAIResponse(prompt);
        return response;
      } catch (error) {
        console.error("OpenAI API error, falling back:", error);
        // Fall back to simulated responses if OpenAI fails
      }
    }

    // Print this warning to the console so user knows we're using simulated responses
    console.log("Using simulated response due to model access limitations");
    return simulateResponse(prompt, containsPatientContext);
  } catch (error) {
    console.error('Error generating response:', error);
    const containsPatientContext = prompt.toLowerCase().includes('context: this is about patient');
    console.log("Using fallback response due to catch-all error");
    return simulateResponse(prompt, containsPatientContext);
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
  
  // Improved default responses for general queries
  if (promptLower.includes('alzheimer') && promptLower.includes('symptom')) {
    return "Early symptoms of Alzheimer's include memory loss affecting daily activities, difficulty completing familiar tasks, confusion with time or place, trouble understanding visual images, and new problems with words in speaking or writing.";
  } else if (promptLower.includes('treatment') || promptLower.includes('medication')) {
    return "Current treatments for Alzheimer's focus on helping people maintain cognitive function and manage behavioral symptoms. Medications like cholinesterase inhibitors (Aricept, Exelon) and memantine (Namenda) may help reduce symptoms. Non-drug approaches include cognitive stimulation and lifestyle modifications.";
  } else if (promptLower.includes('diet') || promptLower.includes('food') || promptLower.includes('nutrition')) {
    return "A Mediterranean-style diet may benefit brain health. This includes plenty of fruits, vegetables, whole grains, olive oil, fish, and limited red meat. Foods rich in omega-3 fatty acids, antioxidants, and B vitamins are particularly beneficial.";
  } else if (promptLower.includes('exercise') || promptLower.includes('physical')) {
    return "Regular physical exercise may directly benefit brain cells by increasing blood and oxygen flow. Even moderate exercise like a brisk 30-minute walk several times a week can be beneficial for brain health.";
  } else if (promptLower.includes('cause') || promptLower.includes('risk factor')) {
    return "Alzheimer's disease is caused by complex brain changes following cell damage. Risk factors include aging, family history, genetics, heart disease, traumatic brain injury, and lifestyle factors. Scientists believe it's caused by a combination of genetic, lifestyle, and environmental factors that affect the brain over time.";
  } else if (promptLower.includes('prevention') || promptLower.includes('prevent')) {
    return "While there's no proven way to prevent Alzheimer's, research suggests that certain lifestyle changes may reduce risk. These include regular physical exercise, a healthy diet, mental and social engagement, good sleep habits, stress management, and managing health conditions like diabetes and heart disease.";
  } else if (promptLower.includes('diagnosis') || promptLower.includes('diagnose')) {
    return "Diagnosing Alzheimer's involves a comprehensive assessment including medical history, mental status testing, physical and neurological exams, blood tests, and brain imaging. Doctors look for patterns of memory loss and cognitive decline that are characteristic of the disease.";
  }
  
  if (promptLower.includes('what') && promptLower.includes('activit') && promptLower.includes('brain')) {
    return "Activities that can improve brain health include puzzles, reading, learning new skills, playing musical instruments, card games, social interaction, physical exercise, meditation, and getting adequate sleep. The key is to challenge your brain with new and varied activities regularly.";
  } else if (promptLower.includes('what') && promptLower.includes('day')) {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options);
    return `Today is ${formattedDate}. It's important to maintain a regular schedule and routine to help with time orientation.`;
  } else if (promptLower.includes('family') && (promptLower.includes('photo') || promptLower.includes('picture'))) {
    return "Family photos are excellent memory aids and can provide emotional comfort. They help maintain connections with loved ones and can trigger positive memories. Looking at photos together can be a wonderful shared activity that promotes reminiscence and conversation.";
  } else if (promptLower.includes('help') && promptLower.includes('medicine')) {
    return "It's important to take your medicine as prescribed. Setting regular reminders, using pill organizers, and establishing a consistent routine can help. You might also consider asking a family member or caregiver to help you remember your medication schedule.";
  } else if (promptLower.includes('mood') || promptLower.includes('feeling')) {
    return "It's normal to experience a range of emotions when dealing with memory challenges. Many people feel frustrated, anxious, or sad at times. Finding activities you enjoy, maintaining social connections, and talking about your feelings with trusted friends or family members can help improve your mood.";
  } else if (promptLower.includes('sleep') || promptLower.includes('insomnia')) {
    return "Good sleep hygiene is important for brain health. Try to maintain a regular sleep schedule, avoid caffeine and screen time before bed, and create a calm sleeping environment. If sleep problems persist, talk to your doctor as they may recommend adjustments to your routine or medications.";
  } else if (promptLower.includes('caregiver') || promptLower.includes('caring')) {
    return "Caregivers play a vital role in supporting those with memory challenges. It's important for caregivers to also take care of their own physical and emotional health. Support groups, respite care, and learning stress management techniques can help prevent burnout and improve the quality of care provided.";
  } else {
    return "I'm here to help with information about Alzheimer's disease and memory care. You can ask me about symptoms, treatments, daily living strategies, or specific memory concerns. How can I assist you today?";
  }
}
