import type { PerfilAvancado } from "@/types/diet-data.type";
import { calcularMetadeDoCaminho, calcularProjecaoObjetivo } from "./goal-projection";

// Partilhado entre a aba /clientes (definir/editar o lembrete) e a página
// inicial (mostrar a caixa de avisos) — ver tarefa 26.
export interface ClienteComLembrete {
  peso_kg: number;
  lembrete_contato_data: string | null;
  lembrete_contato_feito_em: string | null;
  ultimaDietaConcluida: { createdAt: string; perfil_avancado: PerfilAvancado } | null;
}

// Data efetiva do lembrete de contacto: a manual, se definida, senão a
// calculada automaticamente (metade do caminho até à data prevista do
// objetivo, a partir da última dieta concluída).
export function lembreteEfetivo(cliente: ClienteComLembrete): string | null {
  if (cliente.lembrete_contato_data) return cliente.lembrete_contato_data;
  if (!cliente.ultimaDietaConcluida) return null;

  const projecao = calcularProjecaoObjetivo(cliente.peso_kg, cliente.ultimaDietaConcluida.perfil_avancado);
  if (!projecao) return null;

  return calcularMetadeDoCaminho(cliente.ultimaDietaConcluida.createdAt, projecao.dataObjetivo);
}

export function lembretePendente(cliente: ClienteComLembrete, agora: Date): boolean {
  const data = lembreteEfetivo(cliente);
  if (!data) return false;
  if (new Date(data) > agora) return false;
  if (cliente.lembrete_contato_feito_em && new Date(cliente.lembrete_contato_feito_em) >= new Date(data)) return false;
  return true;
}
