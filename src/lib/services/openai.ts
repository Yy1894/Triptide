import OpenAI from 'openai';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // might be dangerous
});

interface PlaceRecommendation {
    name: string;
    description: string;
}

export async function getPlaceRecommendations(
    destination: string,
    currentPlaces: string[],
    pastPlaces: string[] = [],
    recommendationType: 'new' | 'old' | 'mix'
): Promise<PlaceRecommendation[]> {
    let prompt = `You are a travel planner expert. I need recommendations for places to visit in ${destination}.

Current itinerary includes: ${currentPlaces.join(', ')}
`;

    if (pastPlaces.length > 0) {
        prompt += `From my previous trip, I visited: ${pastPlaces.join(', ')}`;

        // Adjust recommendation type based on user preference
        let recommendationGuidance = '';
        switch (recommendationType) {
            case 'new':
                recommendationGuidance = 'Please recommend 5 new places I haven\'t visited before.';
                break;
            case 'old':
                recommendationGuidance = 'Please recommend 5 places from my previous visits that are worth revisiting. If there are less than 5 places, recommend all of them.';
                break;
            case 'mix':
                recommendationGuidance = 'Please recommend a mix of 5 places, including both new locations and some worth revisiting from my previous trip.';
                break;
        }
        prompt += recommendationGuidance;
    }
    else {
        prompt += `This is my first time going to ${destination}. Please recommend 5 places I should visit.`;
    }

    prompt += `

Please return your answer as a JSON object with a key "recommendations", containing an array of 5 objects. Each object should have two keys: "name" and "desc".

Example format:
{
  "recommendations": [
    {
      "name": "Place Name 1",
      "desc": "Brief description of why to visit Place Name 1"
    },
    {
      "name": "Place Name 2",
      "desc": "Brief description of why to visit Place Name 2"
    }
  ]
}
`;

    console.log(`prompt: ${prompt}`);
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a knowledgeable travel expert providing place recommendations in JSON format.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        console.log(response);

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No recommendations received');
        }

        console.log(`content: ${content}`);

        const parsedContent = JSON.parse(content);
        return parsedContent.recommendations || [];
    } catch (error) {
        console.error('Error getting recommendations:', error);
        throw error;
    }
}