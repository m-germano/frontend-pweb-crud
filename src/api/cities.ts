import { api } from './client';
import type { City, Paginated, WeatherNow } from './types';

export async function listCities(params?: {
  countryId?: string;
  continentId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<City>> {
  const q = new URLSearchParams();
  if (params?.countryId) q.set('countryId', params.countryId);
  if (params?.continentId) q.set('continentId', params.continentId);
  if (params?.search) q.set('search', params.search);
  if (params?.page) q.set('page', String(params.page));
  if (params?.pageSize) q.set('pageSize', String(params.pageSize));

  const { data } = await api.get<Paginated<City>>(`/api/cities?${q.toString()}`);
  return data;
}

export async function createCity(
  payload: Omit<City, 'id' | 'createdAt' | 'updatedAt'>
): Promise<City> {
  const { data } = await api.post<City>('/api/cities', payload);
  return data;
}

export async function updateCity(
  id: string,
  payload: {
    nome: string;
    populacao: number;
    latitude: number;
    longitude: number;
    countryId: string;
  }
): Promise<City> {
  const { data } = await api.put<City>(`/api/cities/${id}`, payload);
  return data;
}

export async function deleteCity(id: string): Promise<void> {
  await api.delete<void>(`/api/cities/${id}`);
}

export async function getWeather(lat: number, lon: number): Promise<WeatherNow> {
  const q = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  const { data } = await api.get<WeatherNow>(`/api/integrations/weather?${q.toString()}`);
  return data;
}
