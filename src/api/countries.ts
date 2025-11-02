import { api } from './client';
import type { Country, Paginated } from './types';

type ListParams = {
  continentId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function listCountries(params?: ListParams) {
  const { data } = await api.get<Paginated<Country>>('/countries', { params });
  return data; // -> { items, page, pageSize, total }
}

export async function createCountry(payload: Omit<Country, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data } = await api.post<Country>('/countries', payload);
  return data; // -> Country
}

export async function updateCountry(
  id: string,
  payload: {
    nome: string;
    populacao: number;
    idiomaOficial: string;
    moeda: string;
    fusoHorario?: string;
    iso2?: string;
    continentId: string;
  }
) {
  const { data } = await api.put<Country>(`/countries/${id}`, payload);
  return data; // -> Country atualizado
}

export async function deleteCountry(id: string) {
  await api.delete<void>(`/countries/${id}`);
}
