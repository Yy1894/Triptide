const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

export async function fetchUnsplashPhoto(query: string): Promise<string | null> {
    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}`
        );

        if (!response.ok) {
            console.error("Failed to fetch Unsplash photo");
            return null;
        }

        const data = await response.json();
        const firstPhoto = data.results?.[0];
        return firstPhoto?.urls?.regular || null;
    } catch (error) {
        console.error("Error fetching Unsplash photo:", error);
        return null;
    }
} 