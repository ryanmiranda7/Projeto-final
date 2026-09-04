import OpenAI from "openai";
import { buildDocsSystemPrompt, buildEditRequestPrompt, buildSystemPrompt, buildTranslateRequestPrompt, buildUserPrompt } from './prompt'
import type { DietPlanRequest } from './types'
import fs from 'fs'

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY as string,
    timeout: 2 * 60 * 1000, // 2 minutos
    logLevel: "debug"
})

export async function* generateDietPlan(input: DietPlanRequest) {
    const diretrizes = fs.readFileSync("knowledge/diretrizes.md", "utf-8")

    const stream = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: buildSystemPrompt()},
            {role: "system", content: buildDocsSystemPrompt(diretrizes)},
            { role: "user", content: buildUserPrompt(input) },
        ],
        temperature: 0.6, // Quanto maior mais criativo (desnecessario), quanto menor mais repetitivo. Meio termo é perfeito.
        stream: true, //Faz com que a resposta seja gerada sequencialmente, não devolve um bloco de resposta final.
    });

    for await (const chunk of stream){
        const delta = chunk.choices[0]?.delta?.content;
        if(delta) yield delta; //yield para e returna a função de onde parou. É como um return, mas que pausa a função em vez de encerra-lá.
    }

    return "Ok";

}

// Aplica um pedido de alteração (ex.: "troca o frango do dia 3 por peixe")
// a um plano já gerado. Reaproveita a mesma conversa original (contexto +
// resposta anterior) para que a IA saiba exatamente o que já tinha
// devolvido, e pede-lhe para reescrever o plano completo aplicando só a
// alteração pedida. Chamada não-streaming: é uma edição pontual, não
// precisa de aparecer a "escrever" em tempo real.
export async function editDietPlan(input: DietPlanRequest, resultadoAtual: string, pedido: string) {
    const diretrizes = fs.readFileSync("knowledge/diretrizes.md", "utf-8")

    const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: buildSystemPrompt() },
            { role: "system", content: buildDocsSystemPrompt(diretrizes) },
            { role: "user", content: buildUserPrompt(input) },
            { role: "assistant", content: resultadoAtual },
            { role: "user", content: buildEditRequestPrompt(pedido) },
        ],
        temperature: 0.4,
    });

    return completion.choices[0]?.message?.content ?? "";
}

// Traduz um plano já gerado para PDF em outro idioma. Não reaproveita o
// contexto original (não é preciso — é só tradução de texto) e não é
// guardado: serve apenas para a exportação em PDF nesse idioma.
export async function translateDietPlan(resultado: string, idioma: "pt-PT" | "en" | "es") {
    const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: buildTranslateRequestPrompt(idioma) },
            { role: "user", content: resultado },
        ],
        temperature: 0.2,
    });

    return completion.choices[0]?.message?.content ?? resultado;
}