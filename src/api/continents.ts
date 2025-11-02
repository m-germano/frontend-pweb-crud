import { api } from './client';
import type { Continent, Paginated } from './types';

type ListParams = { search?: string; page?: number; pageSize?: number };

export async function listContinents(params?: ListParams) {
  const { data } = await api.get<Paginated<Continent>>('/api/continents', { params });
  return data; // -> { items, page, pageSize, total }
}

export async function createContinent(payload: { nome: string; descricao?: string }) {
  const { data } = await api.post<Continent>('/api/continents', payload);
  return data; // -> Continent
}

export async function updateContinent(id: string, payload: { nome: string; descricao?: string }) {
  const { data } = await api.put<Continent>(`/api/continents/${id}`, payload);
  return data; // -> Continent atualizado
}

export async function deleteContinent(id: string) {
  await api.delete<void>(`/api/continents/${id}`);
}
