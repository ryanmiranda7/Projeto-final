import type { PerfilAvancado } from "@/types/diet-data.type";

// Lógica de projeção do objetivo (peso previsto semana a semana, data
// prevista da meta e do evento especial, se houver) partilhada entre o
// gráfico web (goal-projection-chart.tsx), o gráfico desenhado no PDF
// (lib/diet-pdf.ts) e o cálculo do lembrete de contacto a meio do caminho
// (aba de clientes) — para as três coisas usarem sempre a mesma previsão.

// Ritmo de progressão semanal aproximado, usado só para desenhar a curva
// de previsão — não é uma recomendação clínica, apenas uma aproximação
// visual baseada no ritmo que o utilizador preferiu no formulário.
const RITMO_KG_POR_SEMANA: Record<PerfilAvancado["ritmo_preferido"], number> = {
  mais_rapido_possivel: 1,
  meio_termo: 0.6,
  devagar_constante: 0.35,
};

export const EVENTO_LABEL: Record<PerfilAvancado["evento_especial"], string> = {
  nenhum: "",
  ferias: "Férias",
  evento_esportivo: "Evento esportivo",
  data_importante: "Data importante",
  viagem_aventura: "Viagem de aventura",
  aniversario: "Aniversário",
  viagem_praia: "Viagem à praia",
  casamento: "Casamento",
};

export interface PontoProjecao {
  data: string;
  peso: number;
}

export interface ProjecaoObjetivo {
  pontos: PontoProjecao[];
  evento: { data: string; peso: number; label: string } | null;
  metaKg: number;
  dataObjetivo: string;
}

export function calcularProjecaoObjetivo(
  pesoAtualKg: number,
  perfilAvancado: PerfilAvancado | null | undefined,
  agora: Date = new Date()
): ProjecaoObjetivo | null {
  if (!perfilAvancado?.peso_meta_kg) return null;

  const metaKg = perfilAvancado.peso_meta_kg;
  const diffKg = metaKg - pesoAtualKg;
  if (Math.abs(diffKg) < 0.1) return null;

  const ritmoKgSemana = RITMO_KG_POR_SEMANA[perfilAvancado.ritmo_preferido] ?? 0.6;
  const semanas = Math.min(52, Math.max(2, Math.round(Math.abs(diffKg) / ritmoKgSemana)));

  const pontos: PontoProjecao[] = Array.from({ length: semanas + 1 }, (_, i) => {
    const data = new Date(agora);
    data.setDate(data.getDate() + i * 7);

    // Progressão suave até à meta, com uma pequena ondulação para não
    // parecer uma reta perfeita — só efeito visual, não uma previsão real.
    const progresso = i / semanas;
    const ondulacao = i > 0 && i < semanas ? Math.sin(i * 1.3) * Math.abs(diffKg) * 0.03 : 0;
    const peso = pesoAtualKg + diffKg * progresso + ondulacao;

    return { data: data.toISOString(), peso: Number(peso.toFixed(1)) };
  });

  let evento: ProjecaoObjetivo["evento"] = null;
  if (perfilAvancado.evento_especial !== "nenhum" && perfilAvancado.data_evento) {
    const dataEvento = new Date(perfilAvancado.data_evento);
    const diasAteEvento = (dataEvento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24);
    const idx = Math.round(diasAteEvento / 7);

    // Só marca o evento se cair dentro do período do gráfico; usa o ponto
    // já calculado nessa semana para garantir que o marcador coincide
    // exatamente com um ponto do eixo (categórico) do gráfico.
    if (idx > 0 && idx < pontos.length) {
      const ponto = pontos[idx];
      evento = { data: ponto.data, peso: ponto.peso, label: EVENTO_LABEL[perfilAvancado.evento_especial] };
    }
  }

  return { pontos, evento, metaKg, dataObjetivo: pontos[pontos.length - 1].data };
}

// Data a meio do caminho entre "agora" (normalmente a criação da última
// dieta concluída) e a data prevista do objetivo — usada como sugestão
// automática do lembrete de contacto (ver tarefa 26 / aba de clientes).
export function calcularMetadeDoCaminho(dataInicio: string, dataObjetivo: string): string {
  const inicio = new Date(dataInicio).getTime();
  const fim = new Date(dataObjetivo).getTime();
  return new Date(inicio + (fim - inicio) / 2).toISOString();
}
