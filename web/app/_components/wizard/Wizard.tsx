"use client";

import { useEffect } from "react";
import { ChevronLeft, FileText } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { DietWizardFormData } from "./schema";
import type { StepDef } from "./step-config";
import { useWizard } from "./use-wizard";
import {
  BooleanStepView,
  CheckboxStepView,
  DateStepView,
  NumberStepView,
  RadioStepView,
  ScaleStepView,
  TagsStepView,
  TextStepView,
  TimeRangeStepView,
  WeeklyGridStepView,
} from "./steps";

interface WizardProps {
  form: UseFormReturn<DietWizardFormData>;
  // Chamado ao recuar a partir da primeira página do wizard (volta ao ecrã inicial).
  onVoltarInicio: () => void;
  // Chamado ao avançar a partir da última página do wizard (submete o formulário).
  onConcluir: () => void;
}

// Renderiza uma pergunta (cabeçalho + controlo do tipo certo). Cada página
// do wizard mostra várias destas seguidas.
function PerguntaRenderer({ form, step }: { form: UseFormReturn<DietWizardFormData>; step: StepDef }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="text-lg font-bold text-gray-900">{step.pergunta}</h2>
        {step.referenciaPdf && (
          <a
            href={step.referenciaPdf.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-full whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            {step.referenciaPdf.label}
          </a>
        )}
      </div>
      {step.subtexto && <p className="text-gray-500 text-sm mb-3">{step.subtexto}</p>}

      <div className={step.subtexto ? "" : "mt-3"}>
        {step.tipo === "radio" && <RadioStepView form={form} step={step} />}
        {step.tipo === "checkbox" && <CheckboxStepView form={form} step={step} />}
        {step.tipo === "number" && <NumberStepView form={form} step={step} />}
        {step.tipo === "text" && <TextStepView form={form} step={step} />}
        {step.tipo === "scale" && <ScaleStepView form={form} step={step} />}
        {step.tipo === "date" && <DateStepView form={form} step={step} />}
        {step.tipo === "boolean" && <BooleanStepView form={form} step={step} />}
        {step.tipo === "tags" && <TagsStepView form={form} step={step} />}
        {step.tipo === "time-range" && <TimeRangeStepView form={form} step={step} />}
        {step.tipo === "weekly-grid" && <WeeklyGridStepView form={form} step={step} />}
      </div>
    </div>
  );
}

export function Wizard({ form, onVoltarInicio, onConcluir }: WizardProps) {
  const wizard = useWizard(form);
  const { paginaAtual, index } = wizard;

  // Ao mudar de página, volta o scroll para o topo — sem isto, quem
  // avançava a partir do fim de uma página comprida caía a meio da
  // próxima em vez de a ver desde o início.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index]);

  if (paginaAtual.length === 0) return null;

  async function handleProximo() {
    const valido = await wizard.avancar();
    if (valido && wizard.ehUltimo) {
      onConcluir();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-8">
          <button
            type="button"
            onClick={wizard.ehPrimeiro ? onVoltarInicio : wizard.voltar}
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-sm text-gray-400">
            Página {wizard.index + 1} de {wizard.total}
          </span>
        </div>

        <div className="space-y-8 mb-8">
          {paginaAtual.map((step, i) => (
            <div key={step.id} className={i > 0 ? "pt-8 border-t border-gray-200" : ""}>
              <PerguntaRenderer form={form} step={step} />
            </div>
          ))}
        </div>

        <Button type="button" className="w-full cursor-pointer" onClick={handleProximo}>
          {wizard.ehUltimo ? "Concluir" : "Próximo"}
        </Button>
      </div>
    </div>
  );
}
