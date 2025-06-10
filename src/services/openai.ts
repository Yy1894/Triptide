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

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No recommendations received');
        }

        const parsedContent = JSON.parse(content);
        return parsedContent.recommendations || [];
    } catch (error) {
        console.error('Error getting recommendations:', error);
        throw error;
    }
}

export async function distributePlacesToItinerary(
    places: Array<{ name: string; desc?: string; image?: string; geometry?: { lat: number; lng: number } }>,
    dates: string[],
    destination: string,
    existingPlacesPlanned: Record<string, { placesPlanned: any[] }> = {}
): Promise<Record<string, { placesPlanned: any[] }>> {
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key is missing');
    }

    const placesData = places.map(place => ({
        name: place.name,
        location: place.geometry ? `${place.geometry.lat},${place.geometry.lng}` : 'unknown'
    }));

    const prompt = `You are a travel planner helping to distribute ${places.length} places across ${dates.length} days in ${destination}. 
Here are the places with their coordinates: ${JSON.stringify(placesData)}.
The available dates are: ${dates.join(', ')}.

Please distribute these places into a daily itinerary following these rules:
1. Group places that are geographically close to each other on the same day to minimize travel time
2. Consider a realistic number of places per day (typically 2–4 places)
3. If there are more days than needed, it's okay to leave some days empty
4. Return the result as a JSON object where:
   - Keys are dates in DD-MM-YYYY format
   - Values are objects with a 'placesPlanned' array containing the place names (just the names as strings)
   - Each place should be assigned to exactly one day

The response should be ONLY the JSON object, nothing else.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful travel itinerary planner.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No itinerary received from OpenAI.');
        }

        const distribution = JSON.parse(content) as Record<string, { placesPlanned: string[] }>;

        // Start with the existing places planned
        const result: Record<string, { placesPlanned: any[] }> = { ...existingPlacesPlanned };
        
        // Add new places while preserving all their properties
        for (const [date, dayData] of Object.entries(distribution)) {
            // Initialize the date's places array with existing places or empty array
            result[date] = {
                placesPlanned: [...(result[date]?.placesPlanned || [])]
            };
            
            // Add the new places with all their properties
            const newPlaces = dayData.placesPlanned.map((placeName: string) => {
                const originalPlace = places.find(p => p.name === placeName);
                if (!originalPlace) return { name: placeName };
                
                // Keep all original properties
                return {
                    name: originalPlace.name,
                    desc: originalPlace.desc,
                    image: originalPlace.image,
                    geometry: originalPlace.geometry
                };
            });
            
            // Append new places to existing ones
            result[date].placesPlanned = [...result[date].placesPlanned, ...newPlaces];
        }

        return result;
    } catch (error) {
        console.error('Error distributing places:', error);
        throw error;
    }
}