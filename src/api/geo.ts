// Integração com Open-Meteo Geocoding API (sem API key, com CORS)
// Docs: https://open-meteo.com/en/docs/geocoding-api

export type GeoCity = {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string; // ISO2
  population?: number;
  admin1?: string;
  admin2?: string;
  timezone?: string;
};

type GeoSearchResponse = {
  results?: Array<{
    id?: number;
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    country_code: string;
    population?: number;
    admin1?: string;
    admin2?: string;
    timezone?: string;
  }>;
};

export async function searchCitiesByName(
  name: string,
  opts: { countryIso2?: string; limit?: number; language?: string } = {}
): Promise<GeoCity[]> {
  const { countryIso2, limit = 10, language = 'pt' } = opts;

  const params = new URLSearchParams();
  params.set('name', name);
  params.set('count', String(limit));
  params.set('language', language);
  params.set('format', 'json');
  // ajuda a priorizar cidades
  params.set('type', 'city');
  if (countryIso2) params.set('country', countryIso2.toUpperCase());

  const url = `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao buscar cidades');
  const data: GeoSearchResponse = await res.json();

  return (data.results || []).map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    country_code: r.country_code,
    population: r.population,
    admin1: r.admin1,
    admin2: r.admin2,
    timezone: r.timezone,
  }));
}
