import { useEffect, useMemo, useState } from 'react';
import { listContinents } from '@/api/continents';
import { listCountries } from '@/api/countries';
import { createCity, deleteCity, getWeather, listCities, updateCity } from '@/api/cities';
import type { City, Continent, Country, Paginated, WeatherNow } from '@/api/types';
import Map from '@/components/visual/Map';
import CityForm from '@/components/CityForm';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, Plus, Search, MapPin, Users, Navigation, Cloud, Thermometer, Wind, Droplets, Save, X } from 'lucide-react';
import { Modal } from '@/components/Modal';

export default function CitiesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [continents, setContinents] = useState<Continent[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [continentId, setContinentId] = useState('all');
  const [countryId, setCountryId] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [data, setData] = useState<Paginated<City> | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    nome: '',
    populacao: 0,
    latitude: 0,
    longitude: 0,
    countryId: ''
  });

  // Carregar continentes
  useEffect(() => {
    (async () => {
      const r = await listContinents({ page: 1, pageSize: 100 });
      setContinents(r.items);
    })();
  }, []);

  // Carregar países baseado no continente selecionado
  useEffect(() => {
    (async () => {
      const r = await listCountries({
        page: 1,
        pageSize: 200,
        continentId: continentId !== 'all' ? continentId : undefined
      });
      setCountries(r.items);
    })();
  }, [continentId]);

  // Buscar dados das cidades
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCities({
        countryId: countryId !== 'all' ? countryId : undefined,
        continentId: continentId !== 'all' ? continentId : undefined,
        search: debouncedSearch,
        page,
        pageSize,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar cidades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, continentId, countryId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta cidade?')) return;
    try {
      await deleteCity(id);
      if (selectedCity?.id === id) {
        setSelectedCity(null);
        setWeather(null);
      }
      fetchData();
    } catch {
      setError('Erro ao excluir cidade');
    }
  };

  const handleSelectCity = async (city: City) => {
    setSelectedCity(city);
    setWeather(null);
    try {
      const weatherData = await getWeather(Number(city.latitude), Number(city.longitude));
      setWeather(weatherData);
    } catch {
      // Ignora erro do clima
    }
  };

  const handleEdit = (city: City) => {
    setEditingCity(city);
    setEditForm({
      nome: city.nome,
      populacao: city.populacao,
      latitude: Number(city.latitude),
      longitude: Number(city.longitude),
      countryId: city.countryId
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCity = async () => {
    if (!editingCity) return;
    try {
      await updateCity(editingCity.id, editForm);
      setIsEditModalOpen(false);
      setEditingCity(null);
      fetchData();
      if (selectedCity?.id === editingCity.id) {
        setSelectedCity({ ...selectedCity, ...editForm });
      }
    } catch {
      setError('Erro ao atualizar cidade');
    }
  };

  const handleCreateCity = async (payload: {
    nome: string;
    populacao: number;
    latitude: number;
    longitude: number;
    countryId: string;
  }) => {
    try {
      await createCity(payload);
      setIsModalOpen(false);
      setPage(1);
      fetchData();
    } catch {
      setError('Erro ao criar cidade');
    }
  };

  const filteredCountries = useMemo(() => countries, [countries]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-slate-900 dark:text-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cidades</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gerencie todas as cidades do sistema
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="sm:w-auto w-full bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Cidade
          </Button>
        </div>

        {/* Filtros */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Filtros</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Filtre cidades por continente, país ou pesquisa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="continent" className="text-sm font-medium">Continente</Label>
                <select
                  id="continent"
                  value={continentId}
                  onChange={(e) => { 
                    setContinentId(e.target.value); 
                    setCountryId('all');
                    setPage(1);
                  }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Todos os continentes</option>
                  {continents.map((continent) => (
                    <option key={continent.id} value={continent.id}>
                      {continent.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium">País</Label>
                <select
                  id="country"
                  value={countryId}
                  onChange={(e) => {
                    setCountryId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Todos os países</option>
                  {filteredCountries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="search" className="text-sm font-medium">Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="search"
                    placeholder="Pesquisar cidades..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Lista de Cidades */}
          <div className="xl:col-span-2 space-y-4">
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader className="pb-4">
                <CardTitle>Cidades {data?.total ? `(${data.total})` : ''}</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {data?.total ? `Total de ${data.total} cidades encontradas` : 'Nenhuma cidade cadastrada'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">Carregando cidades...</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 rounded-md border border-red-500/20">
                    {error}
                  </div>
                )}

                {!loading && !error && data?.items && data.items.length > 0 && (
                  <div className="space-y-3">
                    {data.items.map((city) => (
                      <Card
                        key={city.id}
                        className="cursor-pointer transition-all duration-200 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1" onClick={() => handleSelectCity(city)}>
                              <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                  <MapPin className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold truncate">{city.nome}</h3>
                                  <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <Navigation className="h-3 w-3" />
                                      {Number(city.latitude).toFixed(4)}, {Number(city.longitude).toFixed(4)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {city.populacao.toLocaleString('pt-BR')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                onClick={() => handleEdit(city)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => handleDelete(city.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {!loading && data?.items?.length === 0 && (
                  <div className="text-center py-8">
                    <div className="rounded-lg p-8 bg-slate-50 dark:bg-slate-800/50">
                      <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">Nenhuma cidade encontrada</p>
                      <Button
                        variant="outline"
                        className="mt-4 border-slate-200 dark:border-slate-700"
                        onClick={() => setIsModalOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Primeira Cidade
                      </Button>
                    </div>
                  </div>
                )}

                {/* Paginação */}
                {data && data.total > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, data.total)} de {data.total} cidades
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                        className="border-slate-200 dark:border-slate-700"
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page * pageSize >= data.total}
                        className="border-slate-200 dark:border-slate-700"
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Painel de Detalhes */}
          <div className="space-y-6">
            {selectedCity ? (
              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-6">
                <CardHeader className="pb-4">
                  <CardTitle>Detalhes da Cidade</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Informações sobre {selectedCity.nome}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Info básicas */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nome</p>
                        <p className="text-lg font-semibold">{selectedCity.nome}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">População</p>
                          <p className="text-sm font-semibold">{selectedCity.populacao.toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Navigation className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Coordenadas</p>
                          <p className="text-sm font-semibold">
                            {Number(selectedCity.latitude).toFixed(4)}, {Number(selectedCity.longitude).toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mapa */}
                  <div className="pt-2">
                    <Map
                      lat={Number(selectedCity.latitude)}
                      lon={Number(selectedCity.longitude)}
                      zoom={10}
                      label={selectedCity.nome}
                      height={200}
                    />
                  </div>

                  {/* Clima */}
                  {weather && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-4">
                        <Cloud className="h-5 w-5 text-slate-500" />
                        <p className="text-sm font-medium">Clima Atual</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <Thermometer className="h-4 w-4 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Temperatura</p>
                            <p className="text-sm font-semibold">{Math.round(weather.main?.temp || 0)}°C</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Droplets className="h-4 w-4 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Umidade</p>
                            <p className="text-sm font-semibold">{weather.main?.humidity || 0}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Wind className="h-4 w-4 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Vento</p>
                            <p className="text-sm font-semibold">{weather.wind?.speed || 0} m/s</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Cloud className="h-4 w-4 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Condição</p>
                            <p className="text-sm font-semibold capitalize">{weather.weather?.[0]?.description || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="p-6 text-center">
                  <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">Selecione uma cidade para ver os detalhes</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Modal de Adicionar Cidade */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Adicionar Nova Cidade"
          size="lg"
        >
          <CityForm countries={filteredCountries} onSubmit={handleCreateCity} />
        </Modal>

        {/* Modal de Editar Cidade */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCity(null);
          }}
          title="Editar Cidade"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome" className="text-sm font-medium">Nome *</Label>
                <Input
                  id="edit-nome"
                  value={editForm.nome}
                  onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-populacao" className="text-sm font-medium">População</Label>
                <Input
                  id="edit-populacao"
                  type="number"
                  value={editForm.populacao}
                  onChange={(e) => setEditForm({ ...editForm, populacao: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-latitude" className="text-sm font-medium">Latitude</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  step="0.000001"
                  value={editForm.latitude}
                  onChange={(e) => setEditForm({ ...editForm, latitude: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-longitude" className="text-sm font-medium">Longitude</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  step="0.000001"
                  value={editForm.longitude}
                  onChange={(e) => setEditForm({ ...editForm, longitude: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-country" className="text-sm font-medium">País *</Label>
                <select
                  id="edit-country"
                  value={editForm.countryId}
                  onChange={(e) => setEditForm({ ...editForm, countryId: e.target.value })}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="" disabled>Selecione um país</option>
                  {filteredCountries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleUpdateCity} disabled={!editForm.nome || !editForm.countryId} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingCity(null);
                }}
                className="border-slate-200 dark:border-slate-700"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
