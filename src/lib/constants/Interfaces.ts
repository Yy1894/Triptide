// the trip data structure saved in the database
export interface Trip {
    tid: string;
    destination: {
        name: string;
        photo: string;
        formatted_address: string;
        location: {
            lat: number;
            lng: number;
        }
    };
    _cardImage?: string;
    startDate: string;
    endDate: string;
    tripmates: string[];
    created_at: string;
}

// the place data structure saved in the database
export interface Place {
    name: string;
    desc?: string;
    image?: string;
    time?: string;
    geometry?: {
        lat: number;
        lng: number;
    };
}