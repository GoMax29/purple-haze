import type { NextApiRequest, NextApiResponse } from 'next'

interface SurfSpot {
    id: string
    name: string
    location: { lat: number, lng: number }
    waveHeight: number
    windSpeed: number
    windDirection: number
    tideLevel: number
    surfScore: number
    conditions: 'excellent' | 'good' | 'fair' | 'poor'
    breaks: string[]
    level: 'beginner' | 'intermediate' | 'advanced'
}

type SpotsResponse = SurfSpot[]

// Données statiques des spots de surf bretons
const surfSpots: SurfSpot[] = [
    {
        id: 'la-torche',
        name: 'La Torche',
        location: { lat: 47.8336, lng: -4.3369 },
        waveHeight: 1.8,
        windSpeed: 15,
        windDirection: 270,
        tideLevel: 2.1,
        surfScore: 8,
        conditions: 'excellent',
        breaks: ['Beach break', 'Gauche', 'Droite'],
        level: 'intermediate'
    },
    {
        id: 'guidel',
        name: 'Guidel',
        location: { lat: 47.7833, lng: -3.5167 },
        waveHeight: 1.2,
        windSpeed: 12,
        windDirection: 290,
        tideLevel: 1.8,
        surfScore: 6,
        conditions: 'good',
        breaks: ['Beach break'],
        level: 'beginner'
    },
    {
        id: 'la-palue',
        name: 'La Palue',
        location: { lat: 48.2667, lng: -4.6333 },
        waveHeight: 2.1,
        windSpeed: 18,
        windDirection: 245,
        tideLevel: 2.4,
        surfScore: 9,
        conditions: 'excellent',
        breaks: ['Beach break', 'Reef break'],
        level: 'advanced'
    },
    {
        id: 'quiberon',
        name: 'Quiberon',
        location: { lat: 47.4833, lng: -3.1167 },
        waveHeight: 1.5,
        windSpeed: 14,
        windDirection: 260,
        tideLevel: 1.9,
        surfScore: 7,
        conditions: 'good',
        breaks: ['Point break', 'Droite'],
        level: 'intermediate'
    },
    {
        id: 'penhors',
        name: 'Penhors',
        location: { lat: 47.9167, lng: -4.3667 },
        waveHeight: 1.3,
        windSpeed: 16,
        windDirection: 280,
        tideLevel: 2.0,
        surfScore: 5,
        conditions: 'fair',
        breaks: ['Beach break'],
        level: 'beginner'
    },
    {
        id: 'crozon',
        name: 'Crozon',
        location: { lat: 48.2475, lng: -4.4906 },
        waveHeight: 1.7,
        windSpeed: 13,
        windDirection: 255,
        tideLevel: 2.2,
        surfScore: 6,
        conditions: 'good',
        breaks: ['Beach break', 'Gauche'],
        level: 'intermediate'
    },
    {
        id: 'lannion',
        name: 'Lannion',
        location: { lat: 48.7317, lng: -3.4594 },
        waveHeight: 0.9,
        windSpeed: 20,
        windDirection: 300,
        tideLevel: 1.6,
        surfScore: 4,
        conditions: 'poor',
        breaks: ['Beach break'],
        level: 'beginner'
    },
    {
        id: 'erquy',
        name: 'Erquy',
        location: { lat: 48.6333, lng: -2.4667 },
        waveHeight: 1.1,
        windSpeed: 11,
        windDirection: 320,
        tideLevel: 1.7,
        surfScore: 5,
        conditions: 'fair',
        breaks: ['Beach break'],
        level: 'beginner'
    }
]

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<SpotsResponse | { error: string }>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        // TODO: Intégrer les données en temps réel depuis les APIs surf
        // Pour l'instant, on retourne les données statiques avec calculs simulés

        const enrichedSpots = surfSpots.map(spot => {
            // Simulation d'un calcul de score basé sur les conditions
            const windScore = spot.windSpeed < 20 ? 1 : 0.5
            const waveScore = spot.waveHeight > 1.5 ? 1 : spot.waveHeight > 1 ? 0.8 : 0.5
            const tideScore = spot.tideLevel > 1.5 && spot.tideLevel < 2.5 ? 1 : 0.7

            const calculatedScore = Math.round((windScore + waveScore + tideScore) * 3.33)

            return {
                ...spot,
                surfScore: Math.min(calculatedScore, 10)
            }
        })

        res.status(200).json(enrichedSpots)
    } catch (error) {
        console.error('Erreur lors de la récupération des spots de surf:', error)
        res.status(500).json({
            error: 'Erreur lors de la récupération des spots de surf'
        })
    }
} 