import OpenAI from "openai";
import { buildDocsSystemPrompt, buildSystemPrompt, buildUserPrompt } from './prompt'
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