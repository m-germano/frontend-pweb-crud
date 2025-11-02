import { api } from './client';

export type EnrichCountryResponse = {
  idiomaOficial?: string;
  moeda?: string;
  populacao?: number;
  fusoHorario?: string;
  iso2?: string;
};

export async function enrichCountryByName(nome: string): Promise<EnrichCountryResponse> {
  const { data } = await api.post<EnrichCountryResponse>('/api/integrations/countries/enrich', { nome });
  return data;
}
