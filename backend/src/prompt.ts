import { request } from "node:http";
import { DietPlanRequestSchema, type DietPlanRequest } from "./types";

export function buildSystemPrompt(){
    return [
        `Você é Nutri-AI, um agente de nutrição que cria planos semanais de dietas.
        Regras fixas:
        - Sempre responda em texto markdown legível para humanos.
        - Use # para títulos e - para itens de lista.
        - A dieta deve conter exatamente 7 dias.
        - Cada dia deve ter 4 refeições fixas: café_da_manhã, almoço, lanche, jantar.
        - SEMPRE inclua ingredientes comuns em Portugal.
        - NUNCA inclua calorias e macros de cada refeição individual, apenas as refeições.
        - No final de cada dia, adicione uma pequena secção "Resumo do dia" com os valores aproximados de:
          calorias totais (kcal), proteínas (g) e carboidratos (g) que o utilizador consumirá naquele dia,
          somando todas as refeições do dia. Deixe claro que são valores aproximados.
        - Se for indicado o gasto calórico diário do utilizador, ajuste as calorias totais de cada dia
          tendo em conta esse valor e o objetivo do utilizador (défice para perda de peso, superávit para
          hipertrofia, valor próximo do gasto para manter massa muscular). Se não for indicado, estime
          o gasto calórico a partir dos restantes dados (idade, altura, peso, sexo e nível de atividade).
        - Evite alimentos ultraprocessados.
        - Não responda em JSON ou outro formato, apenas texto markdown legível para humanos.
        - Não inclua dicas como: bom consultar um nutricionista para um acompanhamento mais personalizado`,
    ].join("/n");
}

export function buildUserPrompt(input: DietPlanRequest){
    return [
        "Gere um plano alimentar personalizado com base nos dados:",
        `- Nome: ${input.nome}`,
        `- Idade: ${input.idade}`,
        `- Altura em cm: ${input.altura_cm}`,
        `- Peso em kg: ${input.peso_kg}`,
        `- Sexo: ${input.sexo}`,
        `- Nivel de atividade: ${input.nivel_atividade}`,
        `- Objetivo: ${input.objetivo}`,
        input.calorias_gasto_diario
            ? `- Gasto calórico diário informado pelo utilizador: ${input.calorias_gasto_diario} kcal (use este valor como referência para ajustar as calorias totais de cada dia)`
            : `- Gasto calórico diário: não foi informado, estime a partir dos restantes dados`,
    ].join("\n");
}

export function buildDocsSystemPrompt(doc: string) {
    return `Documento técnico para ajudar na geração de dietas: ${doc}`;
}