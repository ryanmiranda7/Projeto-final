"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, History, Loader, Users, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DietPlanRecord } from "@/types/diet-plan-record.type";
import { API_URL } from "@/lib/api";
import { PlanCard } from "../_components/plan-card";

function HistoricoContent() {
  const searchParams = useSearchParams();
  const clienteFiltro = searchParams.get("cliente");
  // Vem do botão "Plano completo" (logo após gerar uma dieta) — expande e
  // rola até essa dieta específica assim que a lista carregar.
  const planoParam = searchParams.get("plano");

  const [plans, setPlans] = useState<DietPlanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  // null enquanto não sabemos ainda (evita mostrar o botão brevemente
  // antes de descobrir que o email não está configurado).
  const [emailConfigurado, setEmailConfigurado] = useState<boolean | null>(null);
  // Filtro por intervalo de datas (quando a dieta foi gerada) — "" = sem
  // limite desse lado.
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch(`${API_URL}/plans`);
        if (!response.ok) throw new Error("Falha ao buscar histórico");

        const data: DietPlanRecord[] = await response.json();
        setPlans(data);
      } catch (err) {
        console.log(err);
        setError("Não foi possível carregar o histórico. O backend está a correr?");
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchEmailStatus() {
      try {
        const response = await fetch(`${API_URL}/email/status`);
        const data: { configurado: boolean } = await response.json();
        setEmailConfigurado(data.configurado);
      } catch {
        setEmailConfigurado(false);
      }
    }

    fetchPlans();
    fetchEmailStatus();
  }, []);

  useEffect(() => {
    if (!planoParam) return;
    const id = Number(planoParam);
    if (!plans.some((p) => p.id === id)) return;

    // setState (e o scroll) só correm dentro do timeout — o eslint
    // (react-hooks/set-state-in-effect) não deixa chamar setState direto
    // no corpo síncrono de um efeito.
    const timeout = setTimeout(() => {
      setExpandedId(id);
      document.getElementById(`plano-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timeout);
  }, [planoParam, plans]);

  const plansVisiveis = plans.filter((p) => {
    if (clienteFiltro && p.nome !== clienteFiltro) return false;
    const geradaEm = new Date(p.createdAt);
    if (dataInicio && geradaEm < new Date(`${dataInicio}T00:00:00`)) return false;
    if (dataFim && geradaEm > new Date(`${dataFim}T23:59:59`)) return false;
    return true;
  });
  const temFiltroData = !!dataInicio || !!dataFim;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <Link
            href="/clientes"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
          >
            <Users className="w-4 h-4" />
            Clientes
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <History className="w-6 h-6 text-green-500" />
          <h1 className="text-2xl font-bold text-green-500">Histórico de dietas</h1>
        </div>

        {clienteFiltro && (
          <Link
            href="/historico"
            className="inline-flex items-center gap-1.5 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-full mb-4 hover:bg-green-100"
          >
            A ver dietas de: <strong>{clienteFiltro}</strong>
            <X className="w-3.5 h-3.5" />
          </Link>
        )}

        {/* Filtro por intervalo de datas em que a dieta foi gerada */}
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="data-inicio" className="text-xs text-gray-500">
              De
            </label>
            <input
              id="data-inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="border border-input rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="data-fim" className="text-xs text-gray-500">
              Até
            </label>
            <input
              id="data-fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="border border-input rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          {temFiltroData && (
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-gray-800 cursor-pointer underline mb-1.5"
              onClick={() => {
                setDataInicio("");
                setDataFim("");
              }}
            >
              Limpar datas
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader className="w-4 h-4 animate-spin" />
            Carregando histórico...
          </div>
        )}

        {error && (
          <Card className="border-0 shadow-lg p-4 text-sm text-red-600">
            {error}
          </Card>
        )}

        {!isLoading && !error && plansVisiveis.length === 0 && (
          <Card className="border-0 shadow-lg p-6 text-center text-gray-500">
            {clienteFiltro || temFiltroData
              ? "Nenhuma dieta encontrada com esses filtros."
              : "Nenhuma dieta gerada ainda."}
          </Card>
        )}

        <div className="space-y-3">
          {plansVisiveis.map((plan) => (
            <div key={plan.id} id={`plano-${plan.id}`}>
              <PlanCard
                plan={plan}
                isExpanded={expandedId === plan.id}
                onToggle={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
                onDeleted={(id) => setPlans((prev) => prev.filter((p) => p.id !== id))}
                onUpdated={(atualizado) =>
                  setPlans((prev) => prev.map((p) => (p.id === atualizado.id ? atualizado : p)))
                }
                emailConfigurado={emailConfigurado}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HistoricoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          <Loader className="w-4 h-4 animate-spin mr-2" /> Carregando...
        </div>
      }
    >
      <HistoricoContent />
    </Suspense>
  );
}
