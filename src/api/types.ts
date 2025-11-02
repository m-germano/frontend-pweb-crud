export type Paginated<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export type Continent = {
  id: string
  nome: string
  descricao?: string | null
  createdAt: string
  updatedAt: string
}

export type Country = {
  id: string
  nome: string
  populacao: number
  idiomaOficial: string
  moeda: string
  fusoHorario?: string | null
  iso2?: string | null
  continentId: string
  createdAt: string
  updatedAt: string
}

export type City = {
  id: string
  nome: string
  populacao: number
  latitude: number
  longitude: number
  countryId: string
  createdAt: string
  updatedAt: string
}

export type WeatherNow = {
  weather?: { description?: string }[]
  main?: { temp?: number; humidity?: number }
  wind?: { speed?: number }
}
