import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listContinents } from '@/api/continents';
import { listCountries } from '@/api/countries';
import { listCities } from '@/api/cities';
import type { City, Country, Continent } from '@/api/types';
import { Globe, Flag, MapPin, Users, Navigation, TrendingUp, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Stats {
  totalContinents: number;
  totalCountries: number;
  totalCities: number;
  totalPopulation: number;
  countriesWithIso: number;
  averagePopulation: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalContinents: 0,
    totalCountries: 0,
    totalCities: 0,
    totalPopulation: 0,
    countriesWithIso: 0,
    averagePopulation: 0,
  });
  const [recentCities, setRecentCities] = useState<City[]>([]);
  const [recentCountries, setRecentCountries] = useState<Country[]>([]);
  const [continents, setContinents] = useState<Continent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [continentsRes, countriesRes, citiesRes] = await Promise.all([
          listContinents({ page: 1, pageSize: 1000 }),
          listCountries({ page: 1, pageSize: 1000 }),
          listCities({ page: 1, pageSize: 1000 }) // Busca todas as cidades para calcular estatísticas
        ]);

        // Ordena as cidades por ID (assumindo que IDs mais altos são mais recentes)
        const sortedCities = [...citiesRes.items].sort((a, b) => 
          parseInt(b.id) - parseInt(a.id)
        ).slice(0, 5); // Pega as 5 mais recentes

        // Ordena os países por ID
        const sortedCountries = [...countriesRes.items].sort((a, b) => 
          parseInt(b.id) - parseInt(a.id)
        ).slice(0, 5); // Pega os 5 mais recentes

        const totalPopulation = citiesRes.items.reduce((sum, city) => sum + city.populacao, 0);
        const countriesWithIso = countriesRes.items.filter(country => country.iso2).length;
        const averagePopulation = citiesRes.total > 0 ? Math.round(totalPopulation / citiesRes.total) : 0;

        setStats({
          totalContinents: continentsRes.total,
          totalCountries: countriesRes.total,
          totalCities: citiesRes.total,
          totalPopulation,
          countriesWithIso,
          averagePopulation,
        });

        setRecentCities(sortedCities);
        setRecentCountries(sortedCountries);
        setContinents(continentsRes.items);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: 'Continentes',
      value: stats.totalContinents,
      icon: Globe,
      description: 'Total de continentes',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Países',
      value: stats.totalCountries,
      icon: Flag,
      description: 'Total de países cadastrados',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Cidades',
      value: stats.totalCities,
      icon: MapPin,
      description: 'Total de cidades cadastradas',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'População Total',
      value: stats.totalPopulation > 1000000 
        ? `${(stats.totalPopulation / 1000000).toFixed(1)}M`
        : `${(stats.totalPopulation / 1000).toFixed(0)}K`,
      icon: Users,
      description: 'População total das cidades',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Países com ISO2',
      value: stats.countriesWithIso,
      icon: Languages,
      description: 'Países com código ISO2',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Média Populacional',
      value: `${(stats.averagePopulation / 1000).toFixed(1)}K`,
      icon: TrendingUp,
      description: 'Média por cidade',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
  ];

  const continentDistribution = continents.map(continent => ({
    name: continent.nome,
    countryCount: recentCountries.filter(country => country.continentId === continent.id).length
  })).filter(item => item.countryCount > 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-600">Bem-vindo ao GeoInfo Manager</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card
              key={i}
              className="animate-pulse border border-slate-200 bg-slate-50"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 rounded bg-slate-200" />
                <div className="h-4 w-4 rounded bg-slate-200" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 rounded mt-2 bg-slate-200" />
                <div className="h-3 w-32 rounded mt-2 bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-600 mt-1">Visão geral do GeoInfo Manager</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/countries')} variant="outline">
            <Flag className="h-4 w-4 mr-2" />
            Ver Países
          </Button>
          <Button onClick={() => navigate('/cities')}>
            <MapPin className="h-4 w-4 mr-2" />
            Gerenciar Cidades
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="border border-slate-200 bg-white hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-900">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </div>
                <p className="text-xs text-slate-600">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cidades Recentes */}
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-900">Cidades Recentes</CardTitle>
              <CardDescription className="text-slate-600">
                Últimas cidades adicionadas
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/cities')}
              className="text-slate-600 hover:text-slate-900"
            >
              Ver todas
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCities.map((city) => (
                <div
                  key={city.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <MapPin className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">
                        {city.nome}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {city.populacao.toLocaleString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {Number(city.latitude).toFixed(2)}, {Number(city.longitude).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {recentCities.length === 0 && (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">Nenhuma cidade encontrada</p>
                  <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => navigate('/cities')}
                  >
                    Adicionar Primeira Cidade
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Países Recentes */}
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-900">Países Recentes</CardTitle>
              <CardDescription className="text-slate-600">
                Últimos países adicionados
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/countries')}
              className="text-slate-600 hover:text-slate-900"
            >
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCountries.map((country) => (
                <div
                  key={country.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Flag className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">
                        {country.nome}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {country.populacao.toLocaleString('pt-BR')}
                        </span>
                        {country.iso2 && (
                          <span className="flex items-center gap-1">
                            <Languages className="h-3 w-3" />
                            {country.iso2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {recentCountries.length === 0 && (
                <div className="text-center py-8">
                  <Flag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">Nenhum país encontrado</p>
                  <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => navigate('/countries')}
                  >
                    Adicionar Primeiro País
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Continente */}
      {continentDistribution.length > 0 && (
        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Distribuição por Continente</CardTitle>
            <CardDescription className="text-slate-600">
              Quantidade de países por continente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {continentDistribution.map((continent, index) => (
                <div key={continent.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'][index % 5]
                    }`} />
                    <span className="text-sm font-medium text-slate-900">{continent.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">{continent.countryCount} países</span>
                    <div className="w-20 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'][index % 5]
                        }`}
                        style={{ 
                          width: `${(continent.countryCount / Math.max(...continentDistribution.map(c => c.countryCount))) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo do Sistema */}
      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-slate-900">Resumo do Sistema</CardTitle>
          <CardDescription className="text-slate-600">
            Estatísticas gerais do GeoInfo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 border border-slate-100 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{stats.totalContinents}</div>
              <div className="text-sm text-slate-600">Continentes</div>
            </div>
            <div className="p-4 border border-slate-100 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{stats.totalCountries}</div>
              <div className="text-sm text-slate-600">Países</div>
            </div>
            <div className="p-4 border border-slate-100 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{stats.totalCities}</div>
              <div className="text-sm text-slate-600">Cidades</div>
            </div>
            <div className="p-4 border border-slate-100 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">
                {stats.totalPopulation > 1000000 
                  ? `${(stats.totalPopulation / 1000000).toFixed(1)}M`
                  : `${(stats.totalPopulation / 1000).toFixed(0)}K`
                }
              </div>
              <div className="text-sm text-slate-600">População Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}