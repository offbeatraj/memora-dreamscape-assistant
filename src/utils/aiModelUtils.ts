
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
  
  // Enhanced general knowledge responses
  
  // Medication information
  if (promptLower.includes('donepezil')) {
    return "Donepezil (brand name Aricept) is a cholinesterase inhibitor medication used to treat Alzheimer's disease symptoms. It works by increasing levels of acetylcholine, a neurotransmitter important for memory and thinking, by preventing its breakdown in the brain. Donepezil is typically prescribed for all stages of Alzheimer's disease, with dosages ranging from 5mg to 23mg daily. Common side effects may include nausea, diarrhea, difficulty sleeping, muscle cramps, and fatigue. It doesn't cure Alzheimer's but can temporarily improve cognitive function or slow symptom progression in some patients.";
  }
  
  if (promptLower.includes('memantine')) {
    return "Memantine (brand name Namenda) is an NMDA receptor antagonist used for moderate to severe Alzheimer's disease. Unlike cholinesterase inhibitors, memantine works by regulating glutamate activity, which in excess can damage brain cells. It's often prescribed alongside drugs like donepezil for more advanced stages of Alzheimer's. Memantine may temporarily improve cognitive functions or slow the progression of symptoms, though it doesn't stop the underlying disease process. Side effects are generally mild and may include dizziness, headache, confusion, and constipation. The typical dosage builds gradually from 5mg to 20mg daily.";
  }
  
  if (promptLower.includes('vitamin b complex')) {
    return "Vitamin B complex supplements contain eight B vitamins: B1 (thiamine), B2 (riboflavin), B3 (niacin), B5 (pantothenic acid), B6 (pyridoxine), B7 (biotin), B9 (folate), and B12 (cobalamin). For Alzheimer's patients, B vitamins—especially B6, B9, and B12—may support brain health by reducing homocysteine levels, which in high amounts have been associated with cognitive decline. Some studies suggest these vitamins might help slow cognitive decline in early-stage Alzheimer's patients, particularly when combined with omega-3 fatty acids. However, while they support overall brain health, they're not a treatment for Alzheimer's disease itself. Always consult healthcare providers before starting supplements, as they may interact with medications or have contraindications.";
  }
  
  // Alzheimer's information
  if (promptLower.includes('what is alzheimer') || promptLower.includes('alzheimer disease')) {
    return "Alzheimer's disease is a progressive neurological disorder that causes brain cells to degenerate and die, leading to a continuous decline in thinking, behavioral and social skills. It's the most common cause of dementia, accounting for 60-80% of cases. The disease is characterized by abnormal brain deposits of proteins forming amyloid plaques and tau tangles, leading to connection loss between neurons and eventual cell death. Early symptoms include forgetting recent events or conversations, with progression to severe memory impairment and inability to perform daily tasks. Though there's no cure, treatments can temporarily improve symptoms. Risk factors include age (primarily affecting people over 65), family history, genetics, head trauma, and lifestyle factors like heart health.";
  }
  
  if (promptLower.includes('stage') && promptLower.includes('alzheimer')) {
    return "Alzheimer's disease progresses through several stages, commonly categorized as early (mild), moderate, and advanced (severe). In the early stage, a person may function independently but experiences memory lapses like forgetting familiar words or locations. The moderate stage is typically the longest, requiring greater care as the person may confuse words, get frustrated or angry, and need help with activities like dressing. In the advanced stage, individuals lose the ability to respond to their environment, carry on a conversation, and eventually control movement. They become vulnerable to infections and require full-time assistance. The progression rate varies significantly between individuals.";
  }
  
  if (promptLower.includes('symptom') && promptLower.includes('alzheimer')) {
    return "Early symptoms of Alzheimer's include memory loss affecting daily activities, difficulty completing familiar tasks, confusion with time or place, trouble understanding visual images, new problems with words in speaking or writing, misplacing things, decreased judgment, withdrawal from work or social activities, personality changes, and mood disturbances. As the disease progresses, symptoms become more severe: profound memory loss, difficulty performing basic tasks like dressing, behavioral changes including agitation and paranoia, disorientation, difficulty speaking, swallowing problems, and eventually loss of physical functions. These symptoms reflect progressive damage to brain cells, starting in memory areas before spreading throughout the brain.";
  }
  
  // General responses for other topics
  if (promptLower.includes('alzheimer') && promptLower.includes('symptom')) {
    return "Early symptoms of Alzheimer's include memory loss affecting daily activities, difficulty completing familiar tasks, confusion with time or place, trouble understanding visual images, and new problems with words in speaking or writing. As the disease progresses, symptoms worsen to include profound memory loss, inability to perform daily tasks, personality changes, language problems, disorientation, mood changes, and eventually difficulty with physical functions like walking and swallowing.";
  } else if (promptLower.includes('treatment') || promptLower.includes('medication')) {
    return "Current treatments for Alzheimer's focus on helping people maintain cognitive function and manage behavioral symptoms. Medications like cholinesterase inhibitors (Aricept, Exelon) and memantine (Namenda) may help reduce symptoms. Non-drug approaches include cognitive stimulation and lifestyle modifications. While these treatments can improve quality of life, they don't stop the underlying disease progression. In 2021, the FDA approved Aduhelm (aducanumab), which targets amyloid plaques, but its effectiveness remains controversial. Research continues for more effective treatments targeting the disease mechanisms rather than just symptoms.";
  } else if (promptLower.includes('diet') || promptLower.includes('food') || promptLower.includes('nutrition')) {
    return "A Mediterranean-style diet may benefit brain health for those with or at risk of Alzheimer's. This includes plenty of fruits, vegetables, whole grains, olive oil, fish, and limited red meat. Foods rich in omega-3 fatty acids (fatty fish, flaxseeds), antioxidants (berries, dark chocolate), and B vitamins (leafy greens, legumes) are particularly beneficial. The MIND diet, which combines Mediterranean and DASH diets, specifically targets brain health by emphasizing leafy greens, nuts, berries, beans, whole grains, and olive oil while limiting red meat, butter, cheese, pastries, and fried foods. Studies suggest these dietary patterns may slow cognitive decline and reduce Alzheimer's risk.";
  } else if (promptLower.includes('exercise') || promptLower.includes('physical')) {
    return "Regular physical exercise benefits those with Alzheimer's by potentially slowing disease progression and improving quality of life. Exercise increases blood flow and oxygen to the brain, promotes growth of new neurons, reduces inflammation, and helps manage conditions that increase dementia risk like diabetes and hypertension. For early to moderate stages, aim for 150 minutes weekly of moderate activity like walking, swimming, or dancing. For advanced stages, gentle guided movements and range-of-motion exercises help maintain mobility and reduce fall risk. Exercise should be appropriate to the individual's abilities, consistent, and ideally include social interaction. Always consult healthcare providers before starting new exercise regimens.";
  } else if (promptLower.includes('cause') || promptLower.includes('risk factor')) {
    return "Alzheimer's disease is caused by complex brain changes following cell damage, with multiple factors contributing to its development. Age is the greatest risk factor, with most cases occurring after age 65 and risk doubling every five years after 65. Genetics play a role, with the APOE-e4 gene increasing risk. Family history, cardiovascular conditions (high blood pressure, high cholesterol, diabetes), traumatic brain injuries, and lifestyle factors (smoking, excessive alcohol consumption, poor diet, lack of exercise) also increase risk. Women have slightly higher rates, possibly due to longer lifespans. Ongoing research suggests chronic inflammation, vascular problems, and infections may contribute to development of the disease.";
  } else if (promptLower.includes('prevention') || promptLower.includes('prevent')) {
    return "While there's no proven way to prevent Alzheimer's entirely, research suggests certain lifestyle changes may reduce risk or delay onset. Regular physical exercise increases blood flow to the brain and may reduce risk by up to 50%. A Mediterranean or MIND diet rich in fruits, vegetables, healthy oils, and lean proteins supports brain health. Staying mentally active through education, learning new skills, and social engagement builds cognitive reserve. Managing cardiovascular risk factors like high blood pressure, diabetes, and high cholesterol protects both heart and brain health. Quality sleep, stress management, and avoiding smoking and excessive alcohol also contribute to brain health. These approaches are most effective when combined and started early, ideally in midlife.";
  } else if (promptLower.includes('diagnosis') || promptLower.includes('diagnose')) {
    return "Diagnosing Alzheimer's involves a comprehensive assessment including medical history, mental status testing, physical and neurological exams, blood tests, and brain imaging. Doctors look for patterns of memory loss and cognitive decline that are characteristic of the disease. The process typically begins with cognitive assessments like the Mini-Mental State Examination (MMSE) or Montreal Cognitive Assessment (MoCA). Blood tests rule out other conditions like thyroid disorders or vitamin deficiencies. Brain imaging—MRI, CT, or PET scans—can reveal structural changes or abnormal protein deposits. Newer diagnostic tools include cerebrospinal fluid tests measuring beta-amyloid and tau proteins, and specialized PET scans detecting amyloid plaques. Early diagnosis allows for better symptom management and future planning, though currently available treatments don't stop disease progression.";
  }
  
  if (promptLower.includes('what') && promptLower.includes('activit') && promptLower.includes('brain')) {
    return "Activities that can improve brain health include puzzles, reading, learning new skills, playing musical instruments, card games, social interaction, physical exercise, meditation, and getting adequate sleep. The key is to challenge your brain with new and varied activities regularly. For Alzheimer's patients specifically, activities should be tailored to their abilities and interests, focusing on those that provide cognitive stimulation without causing frustration. Art therapy, music therapy, reminiscence activities with old photos, simple cooking or gardening projects, and gentle exercise are particularly beneficial. Activities should be structured but flexible, allowing for success and enjoyment while maintaining dignity.";
  } else if (promptLower.includes('what') && promptLower.includes('day')) {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options);
    return `Today is ${formattedDate}. It's important to maintain a regular schedule and routine to help with time orientation, especially for those with memory challenges. Daily routines provide structure and reduce anxiety for people with Alzheimer's by creating predictable patterns that require less decision-making and cognitive effort.`;
  } else if (promptLower.includes('family') && (promptLower.includes('photo') || promptLower.includes('picture'))) {
    return "Family photos are excellent memory aids and can provide emotional comfort for Alzheimer's patients. They help maintain connections with loved ones and can trigger positive memories from long-term memory, which often remains intact longer than short-term memory. Looking at photos together can be a wonderful shared activity that promotes reminiscence therapy—a therapeutic technique using life experiences and memories to improve psychological well-being. When using photos with Alzheimer's patients, keep sessions short, use clear, large images, label photos with names and dates, and focus on emotional connections rather than testing memory. Digital frames displaying rotating images can provide ongoing stimulation and comfort.";
  } else if (promptLower.includes('help') && promptLower.includes('medicine')) {
    return "Managing medications for Alzheimer's patients requires organizational strategies that evolve with the disease progression. In early stages, pill organizers with time-of-day compartments, medication reminder apps, and establishing consistent routines help patients maintain independence. As the disease progresses, caregivers typically need to take over medication management, using alarm systems, maintaining detailed medication logs, and coordinating with healthcare providers to simplify regimens where possible. It's essential to monitor for side effects and drug interactions, as Alzheimer's patients may not report problems. For administration difficulties, ask pharmacists about alternative formulations like liquids or patches. Regular medication reviews with healthcare providers help ensure optimal treatment as the disease progresses.";
  } else if (promptLower.includes('mood') || promptLower.includes('feeling')) {
    return "Mood changes are common in Alzheimer's disease due to both neurological changes and psychological reactions to cognitive decline. Depression affects up to 40% of patients and may manifest as apathy, loss of interest, or irritability rather than sadness. Anxiety often stems from confusion and fear about lost abilities. As the disease progresses, some patients experience agitation, aggression, or paranoia, particularly during the 'sundowning' period in late afternoon or evening. Non-pharmacological approaches like maintaining routines, creating calm environments, music therapy, and validation therapy (acknowledging emotions without contradiction) often help manage mood disturbances. When necessary, medications may be prescribed, though they're used cautiously due to potential side effects. Caregiver education about recognizing triggers and responding to emotional needs is essential for effective management.";
  } else if (promptLower.includes('sleep') || promptLower.includes('insomnia')) {
    return "Sleep disturbances affect up to 70% of Alzheimer's patients and include difficulty falling or staying asleep, nighttime wandering, and day-night reversal (sleeping during day, awake at night). These problems result from brain changes affecting the sleep-wake cycle and can worsen cognitive symptoms and caregiver burden. Improving sleep hygiene—maintaining regular bedtimes, creating comfortable sleep environments, limiting daytime napping and evening stimulation—forms the foundation of management. Daily exposure to morning sunlight helps regulate circadian rhythms, while physical activity during the day promotes better sleep. Treating pain, addressing sleep apnea, and managing medications that affect sleep are also important. For persistent problems, melatonin supplements may help, while prescription sleep medications are used cautiously due to increased fall risk and potential cognitive side effects.";
  } else if (promptLower.includes('caregiver') || promptLower.includes('caring')) {
    return "Caregivers for Alzheimer's patients face significant challenges including physical demands, emotional stress, and navigating complex healthcare systems. Effective caregiving involves education about the disease, creating structured routines, simplifying communication, ensuring home safety, and adapting activities to changing abilities. Equally important is caregiver self-care—utilizing respite services, joining support groups, practicing stress management techniques, and maintaining personal health. Resources like the Alzheimer's Association, Area Agencies on Aging, and memory care professionals provide valuable support. Understanding that behaviors like aggression or repetition stem from the disease rather than intentional actions helps caregivers respond more effectively. As needs change, regularly reassessing care plans and considering additional services or residential options ensures sustainable care throughout the disease progression.";
  } else if (promptLower.includes('research') || promptLower.includes('cure')) {
    return "Alzheimer's research is advancing on multiple fronts with promising developments. Drug research focuses on removing abnormal protein deposits (amyloid and tau), reducing inflammation, protecting neurons, and targeting genetic factors. Recent FDA approval of aducanumab (Aduhelm) and lecanemab (Leqembi), which target amyloid plaques, represents a shift toward disease-modifying treatments rather than just symptom management. Beyond medications, research explores blood tests for earlier diagnosis, lifestyle interventions, repurposed drugs, and gene therapy. Prevention studies examine how diet, exercise, cognitive stimulation, and treating conditions like hypertension might reduce risk or delay onset. While a cure remains elusive, the focus has expanded to early detection and intervention before symptoms appear, when treatments might be most effective. Participating in clinical trials (available through clinicaltrials.gov or the Alzheimer's Association) helps advance research efforts.";
  } else {
    return "I'm here to help with information about Alzheimer's disease and memory care. You can ask me about symptoms, treatments, medications (like Donepezil or Memantine), dietary recommendations, exercise benefits, daily living strategies, or specific memory concerns. I can also provide information about different stages of Alzheimer's, caregiving approaches, and the latest research developments. How can I assist you today?";
  }
}

