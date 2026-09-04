import { useState } from "react";
import type { FieldPath, UseFormReturn } from "react-hook-form";
import type { DietWizardFormData } from "./schema";
import { PERFIL_STEPS, type StepDef } from "./step-config";

// Quantas perguntas mostrar por página do wizard (pedido do utilizador:
// "cerca de 5 perguntas por página" em vez de uma por ecrã).
const PASSOS_POR_PAGINA = 5;

function camposDoPasso(step: StepDef): FieldPath<DietWizardFormData>[] {
  if (step.tipo === "time-range") {
    return [step.fieldInicio, step.fieldFim] as FieldPath<DietWizardFormData>[];
  }
  return [step.field as FieldPath<DietWizardFormData>];
}

function agruparEmPaginas(passos: StepDef[], tamanho: number): StepDef[][] {
  const paginas: StepDef[][] = [];
  for (let i = 0; i < passos.length; i += tamanho) {
    paginas.push(passos.slice(i, i + tamanho));
  }
  return paginas.length > 0 ? paginas : [[]];
}

// Motor de navegação do wizard: agrupa os passos visíveis em páginas de
// ~5 perguntas, recalculando sempre que os valores do formulário mudam
// (algumas perguntas só aparecem consoante respostas anteriores — ver
// `condicao` em step-config.ts) e valida todos os campos da página atual
// antes de avançar.
export function useWizard(form: UseFormReturn<DietWizardFormData>) {
  const values = form.watch();
  const [paginaIndex, setPaginaIndex] = useState(0);

  // Sem useMemo de propósito: a lista tem ~30 entradas, o filtro/agrupamento
  // é desprezável, e `values` (form.watch()) já é uma referência nova a
  // cada render — memoizar aqui não pouparia trabalho real.
  const passosVisiveis = PERFIL_STEPS.filter((step) => !step.condicao || step.condicao(values));
  const paginas = agruparEmPaginas(passosVisiveis, PASSOS_POR_PAGINA);

  const index = Math.min(paginaIndex, paginas.length - 1);
  const paginaAtual: StepDef[] = paginas[index] ?? [];

  async function avancar(): Promise<boolean> {
    if (paginaAtual.length === 0) return true;

    const campos = paginaAtual.flatMap(camposDoPasso);
    const valido = await form.trigger(campos);
    if (!valido) return false;

    if (index < paginas.length - 1) {
      setPaginaIndex(index + 1);
    }
    return true;
  }

  function voltar() {
    setPaginaIndex((i) => Math.max(0, i - 1));
  }

  return {
    paginaAtual,
    index,
    total: paginas.length,
    ehPrimeiro: index === 0,
    ehUltimo: index === paginas.length - 1,
    avancar,
    voltar,
  };
}
