import { api } from './client';
import type { Continent, Paginated } from './types';

type ListParams = { search?: string; page?: number; pageSize?: number };

export async function listContinents(params?: ListParams) {
  const { data } = await api.get<Paginated<Continent>>('/continents', { params });
  return data; 
}

export async function createContinent(payload: { nome: string; descricao?: string }) {
  const { data } = await api.post<Continent>('/continents', payload);
  return data; 
}

export async function updateContinent(id: string, payload: { nome: string; descricao?: string }) {
  const { data } = await api.put<Continent>(`/continents/${id}`, payload);
  return data; 
}

export async function deleteContinent(id: string) {
  await api.delete<void>(`/continents/${id}`);
}
