import { useEffect, useMemo, useRef, useState } from 'react';
import type { Country } from '@/api/types';
import { useDebounce } from '@/hooks/useDebounce';
import { searchCitiesByName, type GeoCity } from '@/api/geo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Navigation, Globe, AlertCircle, Loader2 } from 'lucide-react';

type Props = {
  countries: Country[];
  onSubmit: (payload: {
    nome: string;
    populacao: number;
    latitude: number;
    longitude: number;
    countryId: string;
  }) => Promise<void> | void;
  disabled?: boolean;
};

export default function CityForm({ countries, onSubmit, disabled }: Props) {
  const [countryId, setCountryId] = useState<string>('');
  const [countryIso2, setCountryIso2] = useState<string | null>(null);
  const [cityName, setCityName] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lon, setLon] = useState<string>('');
  const [pop, setPop] = useState<string>('');
  const [openList, setOpenList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GeoCity[]>([]);
  const debouncedName = useDebounce(cityName, 300);
  const listRef = useRef<HTMLDivElement>(null);

  // Atualizar ISO2 quando país mudar
  useEffect(() => {
    const selected = countries.find((c) => c.id === countryId) || null;
    setCountryIso2(selected?.iso2 || null);
  }, [countryId, countries]);

  // Buscar sugestões de cidades
  useEffect(() => {
    let aborted = false;
    
    const fetchSuggestions = async () => {
      if (!debouncedName || debouncedName.trim().length < 2 || !countryId) {
        setSuggestions([]);
        return;
      }
      
      setLoading(true);
      try {
        const list = await searchCitiesByName(debouncedName.trim(), {
          countryIso2: countryIso2 || undefined,
          limit: 8,
          language: 'pt',
        });
        if (!aborted) {
          setSuggestions(list);
          setOpenList(true);
        }
      } catch {
        if (!aborted) setSuggestions([]);
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    fetchSuggestions();
    
    return () => {
      aborted = true;
    };
  }, [debouncedName, countryId, countryIso2]);

  // Fechar lista ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!listRef.current?.contains(e.target as Node)) {
        setOpenList(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const pickSuggestion = (suggestion: GeoCity) => {
    setCityName(suggestion.name);
    setLat(String(suggestion.latitude));
    setLon(String(suggestion.longitude));
    setPop(String(suggestion.population ?? ''));
    setOpenList(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cityName || !countryId) return;
    
    await onSubmit({
      nome: cityName,
      populacao: Number(pop || 0),
      latitude: Number(lat || 0),
      longitude: Number(lon || 0),
      countryId,
    });
    
    // Reset form
    setCityName('');
    setLat('');
    setLon('');
    setPop('');
    setCountryId('');
  };

  const selectedCountry = useMemo(
    () => countries.find((c) => c.id === countryId) || null,
    [countries, countryId]
  );

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* País */}
      <div className="space-y-3">
        <Label htmlFor="countryId" className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4" />
          País *
        </Label>
        <select
          id="countryId"
          value={countryId}
          onChange={(e) => setCountryId(e.target.value)}
          className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
          required
        >
          <option value="" disabled>Selecione um país</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.nome} {country.iso2 ? `(${country.iso2})` : ''}
            </option>
          ))}
        </select>
        {selectedCountry?.iso2 ? (
          <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            ✓ ISO2 detectado: <b>{selectedCountry.iso2}</b>
          </div>
        ) : (
          <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Dica: Use "Enrich" nos países para salvar ISO2 e melhorar as sugestões.
          </div>
        )}
      </div>

      {/* Cidade com autocomplete */}
      <div className="space-y-3 relative" ref={listRef}>
        <Label htmlFor="cityName" className="text-sm font-medium">
          Cidade *
        </Label>
        <Input
          id="cityName"
          placeholder="Digite o nome da cidade (mín. 2 caracteres)"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpenList(true)}
          disabled={disabled || !countryId}
          required
          className="h-10"
        />
        
        {openList && suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
            {suggestions.map((suggestion) => (
              <button
                type="button"
                key={`${suggestion.id ?? `${suggestion.latitude},${suggestion.longitude}`}`}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-600 last:border-b-0 transition-colors"
                onClick={() => pickSuggestion(suggestion)}
              >
                <div className="font-medium">{suggestion.name}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {suggestion.admin2 ? `${suggestion.admin2}, ` : ''}
                  {suggestion.admin1 ? `${suggestion.admin1}, ` : ''}
                  {suggestion.country}
                  {suggestion.population ? ` • pop. ${suggestion.population.toLocaleString()}` : ''}
                </div>
              </button>
            ))}
          </div>
        )}
        
        {loading && (
          <div className="absolute right-3 top-9">
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          </div>
        )}
      </div>

      {/* Coordenadas e População */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-3">
          <Label htmlFor="latitude" className="text-sm font-medium flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Latitude
          </Label>
          <Input
            id="latitude"
            type="number"
            step="0.000001"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            disabled={disabled}
            placeholder="-23.550650"
            className="h-10"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="longitude" className="text-sm font-medium flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Longitude
          </Label>
          <Input
            id="longitude"
            type="number"
            step="0.000001"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            disabled={disabled}
            placeholder="-46.633382"
            className="h-10"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="population" className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            População
          </Label>
          <Input
            id="population"
            type="number"
            value={pop}
            onChange={(e) => setPop(e.target.value)}
            disabled={disabled}
            placeholder="123456"
            className="h-10"
          />
        </div>
      </div>

      {/* Botão de Submit */}
      <Button
        type="submit"
        disabled={disabled || !countryId || !cityName}
        className="w-full h-11 bg-primary hover:bg-primary/90"
      >
        <MapPin className="h-4 w-4 mr-2" />
        Adicionar Cidade
      </Button>
    </form>
  );
}