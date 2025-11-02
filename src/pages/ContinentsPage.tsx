import { useEffect, useState, useCallback } from 'react';
import { listContinents, createContinent, deleteContinent, updateContinent } from '@/api/continents';
import type { Continent, Paginated } from '@/api/types';
import ContinentMap from '@/components/visual/ContinentMap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, Plus, Search, Globe, Save, X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useDebounce } from '@/hooks/useDebounce';

export default function ContinentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContinent, setEditingContinent] = useState<Continent | null>(null);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);

  const [data, setData] = useState<Paginated<Continent> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({ nome: '', descricao: '' });

  const fetchData = useCallback(
    async (override?: { page?: number; search?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const effectivePage = override?.page ?? page;
        const effectiveSearch = (override?.search ?? debouncedSearch) || undefined;
        const res = await listContinents({
          search: effectiveSearch,
          page: effectivePage,
          pageSize,
        });
        setData(res);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Erro ao buscar continentes';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, page, pageSize]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function onCreate(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();

    // ✅ GUARDE A REFERÊNCIA DO FORM ANTES DO AWAIT
    const formEl = ev.currentTarget;

    const form = new FormData(formEl);
    const nome = String(form.get('nome') || '');
    const descricaoRaw = form.get('descricao');
    const descricao = descricaoRaw != null ? String(descricaoRaw) : undefined;

    if (!nome.trim()) return;

    try {
      await createContinent({ nome: nome.trim(), descricao: descricao?.trim() || undefined });
      // ✅ use a referência salva; não use ev.currentTarget após await
      formEl.reset();
      setIsModalOpen(false);
      setPage(1);
      await fetchData({ page: 1, search: debouncedSearch || undefined });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erro ao criar continente';
      setError(msg);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este continente?')) return;
    try {
      await deleteContinent(id);

      const currTotal = Math.max(0, (data?.total ?? 0) - 1);
      const lastPage = Math.max(1, Math.ceil(currTotal / pageSize));
      const nextPage = Math.min(page, lastPage);
      setPage(nextPage);

      await fetchData({ page: nextPage, search: debouncedSearch || undefined });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erro ao excluir continente';
      setError(msg);
    }
  }

  function onEdit(continent: Continent) {
    setEditingContinent(continent);
    setEditForm({
      nome: continent.nome,
      descricao: continent.descricao ?? '',
    });
    setIsEditModalOpen(true);
  }

  async function handleUpdateContinent() {
    if (!editingContinent) return;
    if (!editForm.nome.trim()) return;

    try {
      await updateContinent(editingContinent.id, {
        nome: editForm.nome.trim(),
        descricao: editForm.descricao?.trim() || undefined,
      });

      setIsEditModalOpen(false);
      setEditingContinent(null);

      await fetchData({ page, search: debouncedSearch || undefined });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erro ao atualizar continente';
      setError(msg);
    }
  }

  return (
    <div className="space-y-6 min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Continentes</h1>
          <p className="text-muted-foreground">Gerencie todos os continentes do sistema</p>
        </div>
        <Button
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          className="sm:w-auto w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Continente
        </Button>
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription className="text-muted-foreground">
            Pesquise continentes pelo nome
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="search">Pesquisar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Pesquisar continentes..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (page !== 1) setPage(1);
                  }}
                  className="pl-8 bg-background text-foreground border-input placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>
            Continentes {data?.total ? `(${data.total})` : ''}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {data?.total
              ? `Total de ${data.total} continentes encontrados`
              : 'Nenhum continente cadastrado'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Carregando continentes...</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          {!loading && !error && data?.items && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.items.map((continent) => (
                <Card
                  key={continent.id}
                  className="relative group hover:shadow-sm transition-shadow bg-background border-border"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {continent.nome}
                          </h3>
                          {continent.descricao && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {continent.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-950"
                          onClick={() => onEdit(continent)}
                          aria-label="Editar continente"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-100/60 dark:hover:bg-red-900/40"
                          onClick={() => onDelete(continent.id)}
                          aria-label="Excluir continente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <ContinentMap name={continent.nome} height={140} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && !error && data?.items?.length === 0 && (
            <div className="text-center py-8">
              <div className="rounded-lg p-8 bg-muted/40">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum continente encontrado</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setError(null);
                    setIsModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Continente
                </Button>
              </div>
            </div>
          )}

          {/* Paginação */}
          {data && data.total > 0 && (
            <div className="flex items-center justify-between space-x-2 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, data.total)} de {data.total} continentes
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const next = Math.max(1, page - 1);
                    setPage(next);
                    await fetchData({ page: next, search: debouncedSearch || undefined });
                  }}
                  disabled={page <= 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const hasMore = page * pageSize < (data?.total ?? 0);
                    if (!hasMore) return;
                    const next = page + 1;
                    setPage(next);
                    await fetchData({ page: next, search: debouncedSearch || undefined });
                  }}
                  disabled={page * pageSize >= (data?.total ?? 0)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Adicionar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adicionar Novo Continente"
      >
        <form onSubmit={onCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              name="nome"
              placeholder="Nome do continente"
              required
              className="bg-background text-foreground border-input placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              name="descricao"
              placeholder="Descrição do continente"
              className="bg-background text-foreground border-input placeholder:text-muted-foreground"
            />
          </div>
          <Button type="submit" className="w-full">
            Adicionar Continente
          </Button>
        </form>
      </Modal>

      {/* Modal: Editar */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingContinent(null);
        }}
        title="Editar Continente"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nome">Nome *</Label>
            <Input
              id="edit-nome"
              value={editForm.nome}
              onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
              className="bg-background text-foreground border-input placeholder:text-muted-foreground"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-descricao">Descrição</Label>
            <Input
              id="edit-descricao"
              value={editForm.descricao}
              onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
              className="bg-background text-foreground border-input placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleUpdateContinent}
              disabled={!editForm.nome.trim()}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingContinent(null);
              }}
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
