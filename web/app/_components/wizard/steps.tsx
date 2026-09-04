"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DietWizardFormData } from "./schema";
import {
  resolverOpcoes,
  type BooleanStep,
  type CheckboxStep,
  type DateStep,
  type NumberStep,
  type RadioStep,
  type ScaleStep,
  type TagsStep,
  type TextStep,
  type TimeRangeStep,
  type WeeklyGridStep,
} from "./step-config";

type FormT = UseFormReturn<DietWizardFormData>;

// Lê um valor aninhado a partir de um dot-path (ex.: "perfil_avancado.peso_meta_kg").
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPath(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function ErroCampo({ form, path }: { form: FormT; path: string }) {
  const mensagem = getPath(form.formState.errors, path)?.message as string | undefined;
  if (!mensagem) return null;
  return <p className="text-sm text-red-500 mt-2">{mensagem}</p>;
}

const opcaoBaseClass =
  "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors";
const opcaoMarcadaClass = "border-green-500 bg-green-50";
const opcaoNormalClass = "border-gray-200 hover:border-gray-300";

export function RadioStepView({ form, step }: { form: FormT; step: RadioStep }) {
  const values = form.watch();
  const valorAtual = getPath(values, step.field);
  const valorTexto = valorAtual === undefined || valorAtual === null ? "" : String(valorAtual);
  const opcoes = resolverOpcoes(step.opcoes, values);

  return (
    <div>
      <RadioGroup
        value={valorTexto}
        onValueChange={(v) => {
          const novoValor = step.numeric ? Number(v) : v;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          form.setValue(step.field as any, novoValor as any, { shouldValidate: true });
        }}
        className="gap-3"
      >
        {opcoes.map((opcao) => (
          <label
            key={opcao.value}
            className={cn(opcaoBaseClass, valorTexto === opcao.value ? opcaoMarcadaClass : opcaoNormalClass)}
          >
            <RadioGroupItem value={opcao.value} className="mt-1" />
            <span>
              <span className="block font-medium text-gray-900">{opcao.label}</span>
              {opcao.descricao && <span className="block text-sm text-gray-500">{opcao.descricao}</span>}
            </span>
          </label>
        ))}
      </RadioGroup>
      <ErroCampo form={form} path={step.field} />
    </div>
  );
}

export function CheckboxStepView({ form, step }: { form: FormT; step: CheckboxStep }) {
  const values = form.watch();
  const valorAtual: string[] = getPath(values, step.field) ?? [];
  const opcoes = resolverOpcoes(step.opcoes, values);

  function toggle(value: string) {
    let novo: string[];
    if (step.exclusivo && value === step.exclusivo) {
      novo = valorAtual.includes(value) ? [] : [value];
    } else {
      const semExclusivo = valorAtual.filter((v) => v !== step.exclusivo);
      novo = semExclusivo.includes(value)
        ? semExclusivo.filter((v) => v !== value)
        : [...semExclusivo, value];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue(step.field as any, novo as any, { shouldValidate: true });
  }

  return (
    <div>
      <div className="grid gap-3">
        {opcoes.map((opcao) => {
          const marcado = valorAtual.includes(opcao.value);
          return (
            <label
              key={opcao.value}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors",
                marcado ? opcaoMarcadaClass : opcaoNormalClass
              )}
            >
              <Checkbox checked={marcado} onCheckedChange={() => toggle(opcao.value)} />
              <span className="font-medium text-gray-900">{opcao.label}</span>
            </label>
          );
        })}
      </div>
      <ErroCampo form={form} path={step.field} />
    </div>
  );
}

export function NumberStepView({ form, step }: { form: FormT; step: NumberStep }) {
  const valorAtual = getPath(form.watch(), step.field);

  return (
    <div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="any"
          value={valorAtual ?? ""}
          onChange={(e) => {
            const v = e.target.value === "" ? undefined : Number(e.target.value);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            form.setValue(step.field as any, v as any, { shouldValidate: true });
          }}
          placeholder={step.placeholder}
          className="max-w-[200px]"
        />
        {step.sufixo && <span className="text-gray-500">{step.sufixo}</span>}
      </div>
      <ErroCampo form={form} path={step.field} />
    </div>
  );
}

export function TextStepView({ form, step }: { form: FormT; step: TextStep }) {
  const valorAtual = getPath(form.watch(), step.field) ?? "";

  return (
    <div>
      <Input
        value={valorAtual}
        onChange={(e) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          form.setValue(step.field as any, e.target.value as any, { shouldValidate: true })
        }
        placeholder={step.placeholder}
      />
      <ErroCampo form={form} path={step.field} />
    </div>
  );
}

export function ScaleStepView({ form, step }: { form: FormT; step: ScaleStep }) {
  const valorAtual = getPath(form.watch(), step.field);
  const opcoes = Array.from({ length: step.max - step.min + 1 }, (_, i) => step.min + i);

  return (
    <div>
      <div className="flex justify-between gap-2">
        {opcoes.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              form.setValue(step.field as any, n as any, { shouldValidate: true })
            }
            className={cn(
              "flex-1 h-12 rounded-lg border font-semibold transition-colors",
              valorAtual === n
                ? "border-green-500 bg-green-500 text-white"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      {(step.minLabel || step.maxLabel) && (
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{step.minLabel}</span>
          <span>{step.maxLabel}</span>
        </div>
      )}
      <ErroCampo form={form} path={step.field} />
    </div>
  );
}

export function DateStepView({ form, step }: { form: FormT; step: DateStep }) {
  const valorAtual = getPath(form.watch(), step.field) ?? "";

  return (
    <div>
      <Input
        type="date"
        value={valorAtual}
        onChange={(e) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          form.setValue(step.field as any, e.target.value as any, { shouldValidate: true })
        }
        className="max-w-[220px]"
      />
      <ErroCampo form={form} path={step.field} />
    </div>
  );
}

export function BooleanStepView({ form, step }: { form: FormT; step: BooleanStep }) {
  const valorAtual = getPath(form.watch(), step.field);
  const opcoes: { value: boolean; label: string }[] = [
    { value: true, label: "Sim" },
    { value: false, label: "Não" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {opcoes.map((opcao) => {
          const marcado = valorAtual === opcao.value;
          return (
            <button
              key={String(opcao.value)}
              type="button"
              onClick={() =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                form.setValue(step.field as any, opcao.value as any, { shouldValidate: true })
              }
              className={cn(
                "h-14 rounded-lg border font-semibold transition-colors",
                marcado ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 hover:border-gray-300 text-gray-700"
              )}
            >
              {opcao.label}
            </button>
          );
        })}
      </div>
      <ErroCampo form={form} path={step.field} />
    </div>
  );
}

export function TagsStepView({ form, step }: { form: FormT; step: TagsStep }) {
  const valorAtual: string[] = getPath(form.watch(), step.field) ?? [];
  const [input, setInput] = useState("");

  function adicionar() {
    const v = input.trim();
    if (!v) return;
    if (!valorAtual.includes(v)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setValue(step.field as any, [...valorAtual, v] as any, { shouldValidate: true });
    }
    setInput("");
  }

  function remover(v: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue(step.field as any, valorAtual.filter((x) => x !== v) as any, { shouldValidate: true });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-3 focus-within:border-green-500">
        {valorAtual.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 text-sm px-3 py-1"
          >
            {v}
            <button type="button" onClick={() => remover(v)} aria-label={`Remover ${v}`}>
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              adicionar();
            }
          }}
          onBlur={adicionar}
          placeholder="Escreva e pressione Enter..."
          className="flex-1 min-w-[140px] outline-none text-sm py-1"
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Receitas/alimentos que incluam qualquer uma das palavras-chave serão excluídos do plano.
      </p>
    </div>
  );
}

export function TimeRangeStepView({ form, step }: { form: FormT; step: TimeRangeStep }) {
  const inicio = getPath(form.watch(), step.fieldInicio) ?? "";
  const fim = getPath(form.watch(), step.fieldFim) ?? "";

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-500 mb-1">Primeira refeição</label>
          <Input
            type="time"
            value={inicio}
            onChange={(e) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              form.setValue(step.fieldInicio as any, e.target.value as any, { shouldValidate: true })
            }
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Última refeição</label>
          <Input
            type="time"
            value={fim}
            onChange={(e) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              form.setValue(step.fieldFim as any, e.target.value as any, { shouldValidate: true })
            }
          />
        </div>
      </div>
      <ErroCampo form={form} path={step.fieldFim} />
    </div>
  );
}

const DIAS = [
  { key: "seg", label: "seg" },
  { key: "ter", label: "ter" },
  { key: "qua", label: "qua" },
  { key: "qui", label: "qui" },
  { key: "sex", label: "sex" },
  { key: "sab", label: "sab" },
  { key: "dom", label: "dom" },
] as const;

export function WeeklyGridStepView({ form, step }: { form: FormT; step: WeeklyGridStep }) {
  const valorAtual: Record<string, string[]> = getPath(form.watch(), step.field) ?? {};

  function toggle(linha: string, dia: string) {
    const atual: string[] = valorAtual[linha] ?? [];
    const novo = atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue(`${step.field}.${linha}` as any, novo as any, { shouldValidate: true });
  }

  const totalCelulas = step.linhas.length * DIAS.length;
  const totalMarcadas = step.linhas.reduce((acc, l) => acc + (valorAtual[l.key]?.length ?? 0), 0);
  const tudoSelecionado = totalMarcadas === totalCelulas;

  function definirTudo(marcar: boolean) {
    const novo = Object.fromEntries(step.linhas.map((l) => [l.key, marcar ? DIAS.map((d) => d.key) : []]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue(step.field as any, novo as any, { shouldValidate: true });
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr>
              <th />
              {DIAS.map((d) => (
                <th key={d.key} className="text-xs font-semibold text-gray-500 pb-2">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {step.linhas.map((linha) => (
              <tr key={linha.key}>
                <td className="text-sm font-medium text-gray-700 text-left pr-3 py-1">{linha.label}</td>
                {DIAS.map((d) => {
                  const marcado = (valorAtual[linha.key] ?? []).includes(d.key);
                  return (
                    <td key={d.key} className="p-1">
                      <button
                        type="button"
                        onClick={() => toggle(linha.key, d.key)}
                        className={cn(
                          "w-9 h-9 rounded-md border flex items-center justify-center transition-colors",
                          marcado ? "border-green-500 bg-green-100" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        )}
                        aria-label={`${linha.label} de ${d.label}`}
                      >
                        {marcado && <Check className="w-4 h-4 text-green-600" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="text-sm underline text-gray-500 mt-4 cursor-pointer"
        onClick={() => definirTudo(!tudoSelecionado)}
      >
        {tudoSelecionado ? "Deselecionar tudo" : "Selecionar tudo"}
      </button>
    </div>
  );
}
