import { NextRequest, NextResponse } from 'next/server';

// Import des modules de traitement
// Note: Ces imports devront être ajustés selon la structure finale
async function importTraitementModule(parameter: string) {
    try {
        switch (parameter) {
            case 'temperature':
                const tempModule = await import('../../../../traitement/temperature.js');
                return {
                    traiter: tempModule.traiterTemperature,
                    getStats: tempModule.getTemperatureStats,
                };

            case 'temperature_apparente':
                const appTempModule = await import('../../../../traitement/temperature_apparente.js');
                return {
                    traiter: appTempModule.traiterTemperatureApparente,
                    getStats: appTempModule.getTemperatureApparenteStats,
                };

            default:
                throw new Error(`Paramètre non supporté: ${parameter}`);
        }
    } catch (error) {
        throw new Error(`Impossible d'importer le module pour ${parameter}: ${error.message}`);
    }
}

export async function POST(request: NextRequest) {
    try {
        // Parsing du body
        const body = await request.json();
        const { parameter, lat, lon } = body;

        // Validation des paramètres
        if (!parameter || typeof parameter !== 'string') {
            return NextResponse.json(
                { error: 'Paramètre "parameter" requis' },
                { status: 400 }
            );
        }

        if (typeof lat !== 'number' || typeof lon !== 'number') {
            return NextResponse.json(
                { error: 'Coordonnées lat/lon invalides' },
                { status: 400 }
            );
        }

        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return NextResponse.json(
                { error: 'Coordonnées hors limites' },
                { status: 400 }
            );
        }

        console.log(`🧪 Test paramètre ${parameter} pour (${lat}, ${lon})`);

        // Import dynamique du module de traitement
        const module = await importTraitementModule(parameter);

        // Traitement des données
        const startTime = Date.now();

        const [data, stats] = await Promise.all([
            module.traiter(lat, lon),
            module.getStats(lat, lon),
        ]);

        const processingTime = Date.now() - startTime;

        console.log(`✅ Paramètre ${parameter} traité en ${processingTime}ms - ${data.length} points`);

        // Retour des résultats
        return NextResponse.json({
            success: true,
            parameter,
            coordinates: { lat, lon },
            processing_time: processingTime,
            data,
            stats,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('❌ Erreur API test-meteo:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const parameter = searchParams.get('parameter');
        const latStr = searchParams.get('lat');
        const lonStr = searchParams.get('lon');

        // Si tous les paramètres sont fournis, traiter la requête
        if (parameter && latStr && lonStr) {
            const lat = parseFloat(latStr);
            const lon = parseFloat(lonStr);

            if (isNaN(lat) || isNaN(lon)) {
                return NextResponse.json(
                    { error: 'Coordonnées lat/lon invalides' },
                    { status: 400 }
                );
            }

            if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                return NextResponse.json(
                    { error: 'Coordonnées hors limites' },
                    { status: 400 }
                );
            }

            console.log(`🧪 Test GET paramètre ${parameter} pour (${lat}, ${lon})`);

            // Import dynamique du module de traitement
            const module = await importTraitementModule(parameter);

            // Traitement des données
            const startTime = Date.now();
            const [data, stats] = await Promise.all([
                module.traiter(lat, lon),
                module.getStats(lat, lon),
            ]);
            const processingTime = Date.now() - startTime;

            console.log(`✅ Paramètre ${parameter} traité en ${processingTime}ms - ${data.length} points`);

            // Retour des résultats
            return NextResponse.json({
                success: true,
                parameter,
                coordinates: { lat, lon },
                processing_time: processingTime,
                data,
                stats,
                timestamp: new Date().toISOString(),
            });
        }

        // Sinon, retourner les infos d'usage
        return NextResponse.json({
            message: 'API de test des paramètres météo',
            supported_parameters: [
                'temperature',
                'temperature_apparente',
            ],
            usage: {
                methods: ['GET', 'POST'],
                get_example: '/api/test-meteo?parameter=temperature&lat=47.8359&lon=-4.3722',
                post_body: {
                    parameter: 'string (temperature | temperature_apparente)',
                    lat: 'number (latitude)',
                    lon: 'number (longitude)',
                },
            },
            example: {
                parameter: 'temperature',
                lat: 48.3903,
                lon: -4.4863,
            },
        });
    } catch (error) {
        console.error('❌ Erreur API GET test-meteo:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}