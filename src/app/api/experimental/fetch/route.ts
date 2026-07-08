import { NextRequest, NextResponse } from 'next/server';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const FETCH_TIMEOUT_MS = 12000;

/** Keep in sync with HOURLY_VARS in Experimental/types.ts */
const HOURLY_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
] as const;

interface ModelFetchRequest {
  id: string;
  apiModel: string;
}

interface ModelFetchResult {
  id: string;
  status: 'success' | 'no_data' | 'error';
  dataPoints: number;
  series: Record<string, (number | null)[]>;
  times: string[];
  error?: string;
  fetchDurationMs: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lon, models } = body as {
      lat: number;
      lon: number;
      models: ModelFetchRequest[];
    };

    if (!lat || !lon || !models?.length) {
      return NextResponse.json(
        { error: 'Missing required parameters: lat, lon, models' },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      models.map((model) => fetchSingleModel(lat, lon, model))
    );

    const fetchResults: ModelFetchResult[] = results.map((result, i) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        id: models[i].id,
        status: 'error' as const,
        dataPoints: 0,
        series: {},
        times: [],
        error: result.reason?.message || 'Unknown error',
        fetchDurationMs: 0,
      };
    });

    return NextResponse.json({ results: fetchResults });
  } catch (error) {
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

async function fetchSingleModel(
  lat: number,
  lon: number,
  model: ModelFetchRequest
): Promise<ModelFetchResult> {
  const hourly = HOURLY_VARS.join(',');
  const url = `${OPEN_METEO_BASE}?latitude=${lat}&longitude=${lon}&hourly=${hourly}&models=${model.apiModel}&timezone=auto&forecast_days=16`;

  const start = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const duration = Date.now() - start;

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return {
        id: model.id,
        status: 'error',
        dataPoints: 0,
        series: {},
        times: [],
        error: `HTTP ${response.status}: ${errText.slice(0, 200)}`,
        fetchDurationMs: duration,
      };
    }

    const data = await response.json();
    const series: Record<string, (number | null)[]> = {};
    for (const key of HOURLY_VARS) {
      series[key] = data?.hourly?.[key] || [];
    }
    const times: string[] = data?.hourly?.time || [];
    const temps = series.temperature_2m;
    const nonNull = temps.filter((t) => t !== null).length;

    return {
      id: model.id,
      status: nonNull > 0 ? 'success' : 'no_data',
      dataPoints: nonNull,
      series,
      times,
      fetchDurationMs: duration,
    };
  } catch (err: unknown) {
    const duration = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      id: model.id,
      status: 'error',
      dataPoints: 0,
      series: {},
      times: [],
      error: message.includes('abort') ? 'Timeout (12s)' : message,
      fetchDurationMs: duration,
    };
  } finally {
    clearTimeout(timeout);
  }
}
