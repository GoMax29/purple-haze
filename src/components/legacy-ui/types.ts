// Types pour les données météo
export interface WeatherDetails {
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    visibility: number;
    uvIndex: number;
    cloudCover: number;
}

export interface HourlyData {
    time: string;
    temperature: number;
    emoji: string;
    precipitation: number;
    windSpeed: number;
    windDirection: number;
    uvIndex: number;
    aqi?: number;
}

export interface PrecipitationData {
    time: string;
    precipitation: number;
    probability: number;
}

export interface DailyData {
    date: string;
    dayName: string;
    emoji: string;
    tempMin: number;
    tempMax: number;
    precipitation: number;
    precipitationProbability: number;
    windSpeed: number;
    windDirection: number;
    uvIndex: number;
    description: string;
}

export interface City {
    name: string;
    lat: number;
    lon: number;
} 