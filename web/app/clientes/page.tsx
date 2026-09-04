"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Loader, Search, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/api";
import type { PerfilAvancado } from "@/types/diet-data.type";
import { lembreteEfetivo, lembretePendente } from "@/lib/lembretes";

interface DietaResumo {
  id: number;
  createdAt: string;
  updatedAt: string;
  status: "gerando" | "concluido" | "erro";
}

interface ClienteResumo {
  id: number;
  nome: string;
  email: string | null;
  sexo: "masculino" | "feminino";
  peso_kg: number;
  createdAt: string;
  updatedAt: string;
  foto_antes: string | null;
  lembrete_contato_data: string | null;
  lembrete_contato_feito_em: string | null;
  ultimaDietaConcluida: { createdAt: string; perfil_avancado: PerfilAvancado } | null;
  dietas: DietaResumo[];
}

type Ordenacao = "recentes" | "antigos" | "nome_asc";
type Periodo = "todos" | "hoje" | "mes" | "ano" | "personalizado";

const ORDENACOES: { value: Ordenacao; label: string }[] = [
  { value: "recentes", label: "Mais recentes" },
  { value: "antigos", label: "Mais antigos" },
  { value: "nome_asc", label: "A-Z" },
];

function mesmoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function mesmoMes(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function mesmoAno(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear();
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteResumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("recentes");
  const [periodo, setPeriodo] = useState<Periodo>("todos");
  // Só usados quando periodo === "personalizado".
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [editandoLembreteId, setEditandoLembreteId] = useState<number | null>(null);

  // Debounce simples da pesquisa por nome.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  async function fetchClientes() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("sort", ordenacao);

      const response = await fetch(`${API_URL}/clientes?${params.toString()}`);
      if (!response.ok) throw new Error("Falha ao buscar clientes");

      const data: ClienteResumo[] = await response.json();
      setClientes(data);
      setError(null);
    } catch (err) {
      console.log(err);
      setError("Não foi possível carregar os clientes. O backend está a correr?");
    } finally {
      setIsLoading(false);
    }
  }

  // O efeito chama a sua própria função local (em vez de fetchClientes,
  // definida no corpo do componente) — o eslint só reconhece como seguro
  // (não síncrono) o setState feito a partir de uma função definida dentro
  // do próprio efeito. fetchClientes continua a existir à parte para os
  // recarregamentos disparados por cliques (editar lembrete, marcar como
  // contactado), que não têm essa restrição.
  useEffect(() => {
    async function carregarNoEfeito() {
      await fetchClientes();
    }
    carregarNoEfeito();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, ordenacao]);

  async function patchCliente(clienteId: number, data: Record<string, string | null>) {
    await fetch(`${API_URL}/clientes/${clienteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchClientes();
  }

  async function salvarLembrete(clienteId: number, dataISO: string | null) {
    await patchCliente(clienteId, { lembrete_contato_data: dataISO });
    setEditandoLembreteId(null);
  }

  async function marcarContactado(clienteId: number) {
    await patchCliente(clienteId, { lembrete_contato_feito_em: new Date().toISOString() });
  }

  // Todas as dietas de todos os clientes já carregados, para os contadores.
  const todasAsDietas = useMemo(
    () => clientes.flatMap((c) => c.dietas.map((d) => ({ ...d, sexo: c.sexo }))),
    [clientes]
  );

  const agora = new Date();
  const contagens = useMemo(() => {
    let hoje = 0,
      mes = 0,
      ano = 0;
    for (const d of todasAsDietas) {
      const data = new Date(d.createdAt);
      if (mesmoDia(data, agora)) hoje++;
      if (mesmoMes(data, agora)) mes++;
      if (mesmoAno(data, agora)) ano++;
    }
    return { hoje, mes, ano, todos: todasAsDietas.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todasAsDietas]);

  // Conta CLIENTES por sexo (cada pessoa conta uma vez), não o total de
  // dietas geradas — um cliente que gerou 3 dietas continua a ser 1 cliente.
  const contagemPorSexo = useMemo(() => {
    let homens = 0,
      mulheres = 0;
    for (const c of clientes) {
      if (c.sexo === "masculino") homens++;
      else if (c.sexo === "feminino") mulheres++;
    }
    return { homens, mulheres };
  }, [clientes]);

  const clientesVisiveis =
    periodo === "todos"
      ? clientes
      : clientes.filter((c) =>
          c.dietas.some((d) => {
            const data = new Date(d.createdAt);
            if (periodo === "hoje") return mesmoDia(data, agora);
            if (periodo === "mes") return mesmoMes(data, agora);
            if (periodo === "ano") return mesmoAno(data, agora);
            // "personalizado": sem nenhuma das duas datas preenchidas,
            // equivale a "todos".
            if (dataInicio && data < new Date(`${dataInicio}T00:00:00`)) return false;
            if (dataFim && data > new Date(`${dataFim}T23:59:59`)) return false;
            return true;
          })
        );

  return (
    <div className="min-h-screen flex flex-col items-center p-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <Link
            href="/historico"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
          >
            Histórico
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Users className="w-6 h-6 text-green-500" />
          <h1 className="text-2xl font-bold text-green-500">Clientes</h1>
        </div>

        {/* PESQUISA E ORDENAÇÃO */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Pesquisar cliente pelo nome ou email..."
              className="pl-8"
            />
          </div>
          <div className="flex gap-1.5">
            {ORDENACOES.map((o) => (
              <Button
                key={o.value}
                type="button"
                size="sm"
                variant={ordenacao === o.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setOrdenacao(o.value)}
              >
                {o.label}
              </Button>
            ))}
          </div>
        </div>

        {/* FILTROS/CONTADORES POR PERÍODO */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[
            { value: "hoje" as Periodo, label: `Hoje (${contagens.hoje})` },
            { value: "mes" as Periodo, label: `Este mês (${contagens.mes})` },
            { value: "ano" as Periodo, label: `Este ano (${contagens.ano})` },
            { value: "todos" as Periodo, label: `Todos (${contagens.todos})` },
            { value: "personalizado" as Periodo, label: "Intervalo de datas" },
          ].map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setPeriodo(chip.value)}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-full border cursor-pointer transition-colors",
                periodo === chip.value
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {periodo === "personalizado" && (
          <div className="flex flex-wrap items-end gap-3 mb-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="clientes-data-inicio" className="text-xs text-gray-500">
                De
              </label>
              <input
                id="clientes-data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="border border-input rounded-md px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="clientes-data-fim" className="text-xs text-gray-500">
                Até
              </label>
              <input
                id="clientes-data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="border border-input rounded-md px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        )}

        {/* RESUMO POR SEXO */}
        <p className="text-sm text-gray-500 mb-6">
          Clientes — Homens: <strong className="text-gray-700">{contagemPorSexo.homens}</strong> · Mulheres:{" "}
          <strong className="text-gray-700">{contagemPorSexo.mulheres}</strong>
        </p>

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader className="w-4 h-4 animate-spin" />
            Carregando clientes...
          </div>
        )}

        {error && (
          <Card className="border-0 shadow-lg p-4 text-sm text-red-600">
            {error}
          </Card>
        )}

        {!isLoading && !error && clientesVisiveis.length === 0 && (
          <Card className="border-0 shadow-lg p-6 text-center text-gray-500">
            Nenhum cliente encontrado.
          </Card>
        )}

        <div className="space-y-2">
          {clientesVisiveis.map((cliente) => {
            const pendente = lembretePendente(cliente, agora);
            const dataAtual = lembreteEfetivo(cliente);

            return (
              <Card key={cliente.id} className="border-0 shadow-lg p-0 overflow-hidden">
                <Link href={`/historico?cliente=${encodeURIComponent(cliente.nome)}`}>
                  <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex flex-row items-center gap-4">
                    {cliente.foto_antes ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cliente.foto_antes}
                        alt={cliente.nome}
                        className="w-11 h-11 rounded-full object-cover shrink-0 border border-border"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold shrink-0">
                        {cliente.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{cliente.nome}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {cliente.sexo} · Cliente desde {formatarData(cliente.createdAt)}
                      </p>
                      {cliente.email && <p className="text-xs text-gray-400 truncate lowercase">{cliente.email}</p>}
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-3">
                      {pendente && (
                        <span title="Lembrete de contacto pendente">
                          <Bell className="w-4 h-4 text-amber-500" />
                        </span>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-green-600">
                          {cliente.dietas.length} {cliente.dietas.length === 1 ? "dieta" : "dietas"}
                        </p>
                        {cliente.dietas[0] && (
                          <p className="text-xs text-gray-400">Última: {formatarData(cliente.dietas[0].updatedAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="px-4 pb-3 pt-1 border-t border-border flex items-center gap-2 text-xs text-gray-500">
                  <Bell className="w-3.5 h-3.5 shrink-0" />
                  {editandoLembreteId === cliente.id ? (
                    <>
                      <input
                        type="date"
                        defaultValue={dataAtual ? dataAtual.slice(0, 10) : ""}
                        className="border border-input rounded px-1.5 py-0.5 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditandoLembreteId(null);
                        }}
                        id={`lembrete-${cliente.id}`}
                      />
                      <button
                        type="button"
                        className="text-green-600 font-medium underline cursor-pointer"
                        onClick={() => {
                          const input = document.getElementById(`lembrete-${cliente.id}`) as HTMLInputElement;
                          salvarLembrete(cliente.id, input.value ? new Date(input.value).toISOString() : null);
                        }}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="text-red-600 cursor-pointer"
                        onClick={() => setEditandoLembreteId(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <span>
                        Lembrete de contacto:{" "}
                        {dataAtual ? (
                          <span className={pendente ? "text-amber-600 font-medium" : ""}>{formatarData(dataAtual)}</span>
                        ) : (
                          "—"
                        )}
                        {!cliente.lembrete_contato_data && dataAtual && " (automático, metade do caminho até a meta)"}
                      </span>
                      <button
                        type="button"
                        className="text-green-600 font-medium cursor-pointer"
                        onClick={() => setEditandoLembreteId(cliente.id)}
                      >
                        Definir
                      </button>
                      {pendente && (
                        <button
                          type="button"
                          className="text-gray-500 hover:text-gray-800 cursor-pointer"
                          onClick={() => marcarContactado(cliente.id)}
                        >
                          Marcar como contactado
                        </button>
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
