"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ChevronDown, ChevronUp, History, Loader } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DietPlanRecord } from "@/types/diet-plan-record.type";
import { API_URL } from "@/lib/api";

const objetivoLabel: Record<DietPlanRecord["objetivo"], string> = {
  perda_de_peso: "Perda de peso",
  hipertrofia: "Hipertrofia",
  manter_massa_muscular: "Manter massa muscular",
};

const statusLabel: Record<DietPlanRecord["status"], string> = {
  gerando: "Gerando...",
  concluido: "Concluído",
  erro: "Erro",
};

const statusClass: Record<DietPlanRecord["status"], string> = {
  gerando: "bg-amber-100 text-amber-700",
  concluido: "bg-green-100 text-green-700",
  erro: "bg-red-100 text-red-700",
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoricoPage() {
  const [plans, setPlans] = useState<DietPlanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch(`${API_URL}/plans`);
        if (!response.ok) throw new Error("Falha ao buscar histórico");

        const data: DietPlanRecord[] = await response.json();
        setPlans(data);
      } catch (err) {
        console.log(err);
        setError("Não foi possível carregar o histórico. O backend está rodando?");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 py-10">
      <div className="w-full max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="flex items-center gap-2 mb-6">
          <History className="w-6 h-6 text-green-500" />
          <h1 className="text-2xl font-bold text-green-500">Histórico de dietas</h1>
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

        {!isLoading && !error && plans.length === 0 && (
          <Card className="border-0 shadow-lg p-6 text-center text-gray-500">
            Nenhuma dieta gerada ainda.
          </Card>
        )}

        <div className="space-y-3">
          {plans.map((plan) => {
            const isExpanded = expandedId === plan.id;

            return (
              <Card key={plan.id} className="border-0 shadow-lg p-4 md:p-5">
                <button
                  className="w-full flex items-center justify-between gap-4 cursor-pointer text-left"
                  onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                >
                  <div>
                    <p className="font-semibold text-gray-900">{plan.nome}</p>
                    <p className="text-sm text-gray-500">
                      {objetivoLabel[plan.objetivo]} · {formatarData(plan.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${statusClass[plan.status]}`}
                    >
                      {statusLabel[plan.status]}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 bg-card rounded-lg p-4 border border-border max-h-[400px] overflow-y-auto">
                    {plan.resultado ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            h2: ({ node, ...props }) => (
                              <h2 className="text-lg font-bold text-green-600 my-1" {...props} />
                            ),
                            h1: ({ node, ...props }) => (
                              <h1 className="text-xl font-bold text-zinc-900 mb-1" {...props} />
                            ),
                          }}
                        >
                          {plan.resultado}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Sem resultado salvo para esta geração.
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
