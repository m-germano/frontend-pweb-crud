import { api } from './client';

export type EnrichCountryResponse = {
  idiomaOficial?: string;
  moeda?: string;
  populacao?: number;
  fusoHorario?: string;
  iso2?: string;
};

/**
 * Retorna apenas o `data` (não o AxiosResponse),
 * evitando o erro de acessar propriedades em AxiosResponse.
 */
export async function enrichCountryByName(nome: string): Promise<EnrichCountryResponse> {
  const { data } = await api.post<EnrichCountryResponse>('/api/integrations/countries/enrich', { nome });
  return data;
}
