import { useEffect, useState, useCallback } from 'react';
import { listContinents } from '@/api/continents';
import { createCountry, deleteCountry, listCountries, updateCountry } from '@/api/countries';
import { enrichCountryByName } from '@/api/integrations';
import type { Continent, Country, Paginated } from '@/api/types';
import CountryCard from '@/components/visual/CountryCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, Plus, Search, Flag, Save, X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useDebounce } from '@/hooks/useDebounce';
import { toastError, toastSuccess } from '@/lib/toast';

export default function CountriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);

  const [continents, setContinents] = useState<Continent[]>([]);
  const [continentId, setContinentId] = useState('all');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);

  const [data, setData] = useState<Paginated<Country> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    nome: '',
    populacao: 0,
    idiomaOficial: '',
    moeda: '',
    fusoHorario: '',
    iso2: '',
    continentId: '',
  });

  // Carrega continentes
  useEffect(() => {
    (async () => {
      try {
        const res = await listContinents({ page: 1, pageSize: 100 });
        setContinents(res.items);
      } catch (e: any) {
        console.error(e);
      }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCountries({
        continentId: continentId !== 'all' ? continentId : undefined,
        search: debouncedSearch || undefined,
        page,
        pageSize,
      });
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao buscar países');
    } finally {
      setLoading(false);
    }
  }, [continentId, debouncedSearch, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function onCreate(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();

    // CAPTURE o form ANTES do await — evita event pooling null
    const form = ev.currentTarget;

    const fd = new FormData(form);
    const payload = {
      nome: String(fd.get('nome') || '').trim(),
      populacao: Number(fd.get('populacao') || 0),
      idiomaOficial: String(fd.get('idiomaOficial') || '').trim(),
      moeda: String(fd.get('moeda') || '').trim(),
      fusoHorario: (String(fd.get('fusoHorario') || '').trim() || undefined) as string | undefined,
      iso2: (String(fd.get('iso2') || '').trim() || undefined) as string | undefined,
      continentId: String(fd.get('continentId') || ''),
    };

    if (!payload.nome || !payload.continentId) return;

    try {
      await createCountry(payload as any);
      form.reset();            // agora seguro
      setIsModalOpen(false);
      setPage(1);
      toastSuccess('País criado com sucesso!');
      fetchData();
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao criar país');
      toastError('Erro ao criar país.');
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este país?')) return;
    try {
      await deleteCountry(id);
      // ajusta página se necessário
      setPage((prev) => {
        const currTotal = Math.max(0, (data?.total ?? 1) - 1);
        const lastPage = Math.max(1, Math.ceil(currTotal / pageSize));
        return Math.min(prev, lastPage);
      });
      toastSuccess('País excluído.');
      fetchData();
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao excluir país');
      toastError('Erro ao excluir país.');
    }
  }

  function onEdit(country: Country) {
    setEditingCountry(country);
    setEditForm({
      nome: country.nome,
      populacao: country.populacao,
      idiomaOficial: country.idiomaOficial,
      moeda: country.moeda,
      fusoHorario: country.fusoHorario ?? '',
      iso2: country.iso2 ?? '',
      continentId: country.continentId,
    });
    setIsEditModalOpen(true);
  }

  async function handleUpdateCountry() {
    if (!editingCountry) return;
    try {
      await updateCountry(editingCountry.id, {
        ...editForm,
        fusoHorario: editForm.fusoHorario || undefined,
        iso2: editForm.iso2 || undefined,
      });
      setIsEditModalOpen(false);
      setEditingCountry(null);
      toastSuccess('País atualizado com sucesso!');
      fetchData();
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao atualizar país');
      toastError('Erro ao atualizar país.');
    }
  }

  async function onEnrich() {
    const form = document.getElementById('country-form') as HTMLFormElement | null;
    if (!form) return;
    const nome = (form.elements.namedItem('nome') as HTMLInputElement)?.value?.trim();
    if (!nome) return;

    const enriched = await enrichCountryByName(nome).catch(() => null);
    if (!enriched) return;

    if (enriched.idiomaOficial)
      (form.elements.namedItem('idiomaOficial') as HTMLInputElement).value = enriched.idiomaOficial;
    if (enriched.moeda)
      (form.elements.namedItem('moeda') as HTMLInputElement).value = enriched.moeda;
    if (typeof enriched.populacao === 'number')
      (form.elements.namedItem('populacao') as HTMLInputElement).value = String(enriched.populacao);
    if (enriched.fusoHorario)
      (form.elements.namedItem('fusoHorario') as HTMLInputElement).value = enriched.fusoHorario;
    if (enriched.iso2)
      (form.elements.namedItem('iso2') as HTMLInputElement).value = enriched.iso2;

    toastSuccess('Dados enriquecidos com sucesso!');
  }

  async function onEnrichEdit() {
    if (!editForm.nome) return;

    const enriched = await enrichCountryByName(editForm.nome).catch(() => null);
    if (!enriched) return;

    setEditForm((prev) => ({
      ...prev,
      idiomaOficial: enriched.idiomaOficial || prev.idiomaOficial,
      moeda: enriched.moeda || prev.moeda,
      populacao: typeof enriched.populacao === 'number' ? enriched.populacao : prev.populacao,
      fusoHorario: enriched.fusoHorario || prev.fusoHorario,
      iso2: enriched.iso2 || prev.iso2,
    }));

    toastSuccess('Dados enriquecidos com sucesso!');
  }

  return (
    <div className="space-y-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Países</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os países do sistema</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="sm:w-auto w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar País
        </Button>
      </div>

      {/* Filtros */}
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre países por continente ou pesquisa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="continent">Continente</Label>
              <select
                id="continent"
                value={continentId}
                onChange={(e) => {
                  setContinentId(e.target.value);
                  setPage(1);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">Todos os continentes</option>
                {continents.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="search">Pesquisar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Pesquisar países..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle>
            Países {data?.total ? `(${data.total})` : ''}
          </CardTitle>
          <CardDescription>
            {data?.total ? `Total de ${data.total} países encontrados` : 'Nenhum país cadastrado'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Carregando países...</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          {!loading && !error && data?.items && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.items.map((country) => (
                <Card key={country.id} className="relative bg-card text-card-foreground border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CountryCard country={country} />
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                          onClick={() => onEdit(country)}
                          aria-label="Editar país"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(country.id)}
                          aria-label="Excluir país"
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
              <div className="rounded-lg p-8 bg-muted/40">
                <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum país encontrado</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro País
                </Button>
              </div>
            </div>
          )}

          {/* Paginação */}
          {data && data.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border mt-6">
              <div className="text-sm text-muted-foreground">
                Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, data.total)} de {data.total} países
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => (p * pageSize < (data?.total ?? 0) ? p + 1 : p))}
                  disabled={page * pageSize >= (data?.total ?? 0)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Adicionar País */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adicionar Novo País"
        size="lg"
        className="bg-card text-card-foreground" // garante dark no conteúdo do modal
      >
        <form id="country-form" onSubmit={onCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" name="nome" placeholder="Nome do país" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="continentId">Continente *</Label>
              <select
                id="continentId"
                name="continentId"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" disabled>Selecione um continente</option>
                {continents.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idiomaOficial">Idioma Oficial</Label>
              <Input id="idiomaOficial" name="idiomaOficial" placeholder="Idioma oficial" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moeda">Moeda</Label>
              <Input id="moeda" name="moeda" placeholder="Moeda" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="populacao">População</Label>
              <Input id="populacao" name="populacao" type="number" placeholder="População" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fusoHorario">Fuso Horário</Label>
              <Input id="fusoHorario" name="fusoHorario" placeholder="Fuso horário" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iso2">ISO2</Label>
              <Input id="iso2" name="iso2" placeholder="Ex: BR" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button type="submit" className="flex-1">Adicionar País</Button>
            <Button type="button" variant="outline" onClick={onEnrich}>Enriquecer Dados</Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Editar País */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingCountry(null); }}
        title="Editar País"
        size="lg"
        className="bg-card text-card-foreground"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-continentId">Continente *</Label>
              <select
                id="edit-continentId"
                value={editForm.continentId}
                onChange={(e) => setEditForm({ ...editForm, continentId: e.target.value })}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" disabled>Selecione um continente</option>
                {continents.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-idiomaOficial">Idioma Oficial</Label>
              <Input
                id="edit-idiomaOficial"
                value={editForm.idiomaOficial}
                onChange={(e) => setEditForm({ ...editForm, idiomaOficial: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-moeda">Moeda</Label>
              <Input
                id="edit-moeda"
                value={editForm.moeda}
                onChange={(e) => setEditForm({ ...editForm, moeda: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-populacao">População</Label>
              <Input
                id="edit-populacao"
                type="number"
                value={editForm.populacao}
                onChange={(e) => setEditForm({ ...editForm, populacao: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-fusoHorario">Fuso Horário</Label>
              <Input
                id="edit-fusoHorario"
                value={editForm.fusoHorario}
                onChange={(e) => setEditForm({ ...editForm, fusoHorario: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-iso2">ISO2</Label>
              <Input
                id="edit-iso2"
                value={editForm.iso2}
                onChange={(e) => setEditForm({ ...editForm, iso2: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button onClick={handleUpdateCountry} disabled={!editForm.nome || !editForm.continentId} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
            <Button variant="outline" onClick={onEnrichEdit}>Enriquecer Dados</Button>
            <Button
              variant="outline"
              onClick={() => { setIsEditModalOpen(false); setEditingCountry(null); }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
