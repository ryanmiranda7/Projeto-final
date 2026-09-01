import type { FastifyInstance } from "fastify";
import { DietPlanRequestSchema } from "../types";
import { generateDietPlan } from "../agent";
import { prisma } from "../lib/prisma";

export async function planRoutes(app: FastifyInstance) {
    
    app.post("/plan", async (request, reply) => {
        reply.raw.setHeader("Access-Control-Allow-Origin", "*");
        reply.raw.setHeader("Content-Type", "text/plain; charset=utf-8");

        reply.raw.setHeader("Content-Type", "text/event-stream");
        reply.raw.setHeader("Cache-Control", "no-cache");
        reply.raw.setHeader("Connection", "keep-alive");

        const parse = DietPlanRequestSchema.safeParse(request.body);
        if(!parse.success){
            return reply.status(400).send({
                error: "ValidationError",
                details: parse.error.flatten(issue => issue.message)
            })
        }

        // Cria o registro no banco já no início, com status "gerando".
        // Assim, mesmo que a geração falhe ou o usuário cancele no meio,
        // fica registrado que essa tentativa aconteceu.
        const dietPlan = await prisma.dietPlan.create({
            data: {
                nome: parse.data.nome,
                idade: parse.data.idade,
                altura_cm: parse.data.altura_cm,
                peso_kg: parse.data.peso_kg,
                sexo: parse.data.sexo,
                nivel_atividade: parse.data.nivel_atividade,
                objetivo: parse.data.objetivo,
                calorias_gasto_diario: parse.data.calorias_gasto_diario ?? null,
                status: "gerando",
            },
        });

        let resultadoCompleto = "";

        try{

            for await (const delta of generateDietPlan(parse.data)){
                resultadoCompleto += delta;
                reply.raw.write(delta);
            }

            reply.raw.end();

            // Salva o resultado final depois que o stream termina,
            // sem impactar o tempo de resposta percebido pelo usuário.
            await prisma.dietPlan.update({
                where: { id: dietPlan.id },
                data: { resultado: resultadoCompleto, status: "concluido" },
            });

        }catch(err: any){
            request.log.error(err);
            reply.raw.write(`event: error\n ${JSON.stringify(err.message)}`)
            reply.raw.end();

            await prisma.dietPlan.update({
                where: { id: dietPlan.id },
                data: {
                    resultado: resultadoCompleto || null,
                    status: "erro",
                },
            });
        }

        return reply;
    });

    // Histórico: lista as dietas já geradas (mais recentes primeiro).
    // Não é usado pelo frontend atual, mas fica disponível para
    // features futuras (ex: tela de histórico).
    app.get("/plans", async (request, reply) => {
        const plans = await prisma.dietPlan.findMany({
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return reply.send(plans);
    });

    // Detalhe de uma dieta específica pelo id.
    app.get("/plans/:id", async (request, reply) => {
        const { id } = request.params as { id: string };

        const plan = await prisma.dietPlan.findUnique({
            where: { id: Number(id) },
        });

        if (!plan) {
            return reply.status(404).send({ error: "NotFound" });
        }

        return reply.send(plan);
    });
}