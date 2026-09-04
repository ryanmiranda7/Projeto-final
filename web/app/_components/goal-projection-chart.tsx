"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PerfilAvancado } from "@/types/diet-data.type";
import { calcularProjecaoObjetivo } from "@/lib/goal-projection";

interface GoalProjectionChartProps {
  pesoAtualKg: number;
  perfilAvancado: PerfilAvancado | null;
}

function formatarDataCurta(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

export function GoalProjectionChart({ pesoAtualKg, perfilAvancado }: GoalProjectionChartProps) {
  const dados = useMemo(() => calcularProjecaoObjetivo(pesoAtualKg, perfilAvancado), [pesoAtualKg, perfilAvancado]);

  if (!dados) return null;

  const pesos = dados.pontos.map((p) => p.peso);
  const min = Math.floor(Math.min(...pesos, dados.metaKg) - 1);
  const max = Math.ceil(Math.max(...pesos, dados.metaKg) + 1);

  // Quando o evento cai perto da meta, os dois marcadores ficam quase no
  // mesmo ponto e as etiquetas ("Evento · Xkg" e "Objetivo Ykg") se
  // sobrepõem e ficam ilegíveis. Nesse caso, separa-as: uma acima, outra
  // abaixo do respetivo marcador, com mais distância do que o normal.
  const indiceEvento = dados.evento
    ? dados.pontos.findIndex((p) => p.data === dados.evento!.data)
    : -1;
  const eventoPertoDaMeta = indiceEvento >= 0 && dados.pontos.length - 1 - indiceEvento <= 3;

  return (
    <div>
      <p className="text-sm text-gray-600 mb-3">
        Previsão aproximada de evolução de peso até <strong>{dados.metaKg} kg</strong>, a atingir por volta de{" "}
        <strong>{formatarDataCurta(dados.dataObjetivo)}</strong>.
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dados.pontos} margin={{ top: 36, right: 24, left: 0, bottom: eventoPertoDaMeta ? 16 : 0 }}>
            <defs>
              <linearGradient id="pesoGradiente" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="data"
              tickFormatter={formatarDataCurta}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              minTickGap={30}
            />
            <YAxis domain={[min, max]} tick={{ fontSize: 11, fill: "#9ca3af" }} width={36} />
            <Tooltip
              formatter={(value: number) => [`${value} kg`, "Peso previsto"]}
              labelFormatter={(label: string) => formatarDataCurta(label)}
            />
            <Area type="monotone" dataKey="peso" stroke="#16a34a" strokeWidth={2} fill="url(#pesoGradiente)" />
            {dados.evento && (
              <ReferenceDot x={dados.evento.data} y={dados.evento.peso} r={5} fill="#16a34a" stroke="white">
                <Label
                  value={`${dados.evento.label} · ${dados.evento.peso}kg`}
                  position={eventoPertoDaMeta ? "bottom" : "top"}
                  offset={eventoPertoDaMeta ? 10 : 8}
                  fontSize={11}
                  fill="#166534"
                />
              </ReferenceDot>
            )}
            <ReferenceDot x={dados.dataObjetivo} y={dados.metaKg} r={5} fill="#166534" stroke="white">
              <Label
                value={`Objetivo ${dados.metaKg}kg`}
                position="top"
                offset={eventoPertoDaMeta ? 14 : 8}
                fontSize={11}
                fill="#166534"
              />
            </ReferenceDot>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
