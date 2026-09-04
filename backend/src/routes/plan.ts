import type { FastifyInstance } from "fastify";
import { DietPlanRequestSchema, EditPlanRequestSchema, EnviarEmailRequestSchema, TranslatePlanRequestSchema, type DietPlanRequest } from "../types";
import { editDietPlan, generateDietPlan, translateDietPlan } from "../agent";
import { enviarPdfPorEmail, transportadorConfigurado } from "../mailer";
import { prisma } from "../lib/prisma";

export async function planRoutes(app: FastifyInstance) {
    
    app.post("/plan", async (request, reply) => {
        const parse = DietPlanRequestSchema.safeParse(request.body);
        if(!parse.success){
            // Os headers de streaming só são definidos DEPOIS desta
            // verificação — defini-los antes fazia o reply.status(400).send(objeto)
            // abaixo falhar com um 500 ("Expected a string or Buffer"),
            // porque o Content-Type já dizia text/event-stream.
            return reply.status(400).send({
                error: "ValidationError",
                details: parse.error.flatten(issue => issue.message)
            })
        }

        reply.raw.setHeader("Access-Control-Allow-Origin", "*");
        reply.raw.setHeader("Content-Type", "text/event-stream");
        reply.raw.setHeader("Cache-Control", "no-cache");
        reply.raw.setHeader("Connection", "keep-alive");

        // Garante que não existem clientes duplicados. Quando o email é
        // indicado, passa a ser ele o identificador (mais fiável do que o
        // nome — duas pessoas diferentes podem ter o mesmo nome, mas não o
        // mesmo email); sem email, mantém o comportamento anterior de
        // reaproveitar pelo nome.
        const dadosCliente = {
            nome: parse.data.nome,
            idade: parse.data.idade,
            altura_cm: parse.data.altura_cm,
            peso_kg: parse.data.peso_kg,
            sexo: parse.data.sexo,
            nivel_atividade: parse.data.nivel_atividade,
        };

        let cliente;
        if (parse.data.email) {
            try {
                cliente = await prisma.cliente.upsert({
                    where: { email: parse.data.email },
                    update: dadosCliente,
                    create: { ...dadosCliente, email: parse.data.email },
                });
            } catch {
                // Já existe um cliente com este nome mas sem este email
                // (provavelmente a mesma pessoa a indicar o email pela
                // primeira vez) — atualiza esse registo em vez de tentar
                // criar um novo com o mesmo nome.
                cliente = await prisma.cliente.upsert({
                    where: { nome: parse.data.nome },
                    update: { ...dadosCliente, email: parse.data.email },
                    create: { ...dadosCliente, email: parse.data.email },
                });
            }
        } else {
            cliente = await prisma.cliente.upsert({
                where: { nome: parse.data.nome },
                update: dadosCliente,
                create: dadosCliente,
            });
        }

        // A foto "antes" só é guardada na primeira vez que chega — gerações
        // seguintes não a substituem (é uma referência fixa do início).
        if (parse.data.foto_antes) {
            await prisma.cliente.updateMany({
                where: { id: cliente.id, foto_antes: null },
                data: { foto_antes: parse.data.foto_antes },
            });
        }

        // Cria o registro no banco já no início, com status "gerando".
        // Assim, mesmo que a geração falhe ou o usuário cancele no meio,
        // fica registrado que essa tentativa aconteceu.
        const dietPlan = await prisma.dietPlan.create({
            data: {
                clienteId: cliente.id,
                objetivo: parse.data.objetivo,
                calorias_gasto_diario: parse.data.calorias_gasto_diario ?? null,
                deficit_calorico: parse.data.deficit_calorico ?? null,
                superavit_calorico: parse.data.superavit_calorico ?? null,
                perfil_avancado: parse.data.perfil_avancado,
                status: "gerando",
            },
        });

        // Vai num header (não no corpo, que é só o markdown do plano em
        // streaming) para o frontend poder ligar o botão "Plano completo"
        // diretamente a esta dieta assim que a geração terminar.
        reply.raw.setHeader("X-Plan-Id", String(dietPlan.id));
        reply.raw.setHeader("Access-Control-Expose-Headers", "X-Plan-Id");

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
    // O formato devolvido mantém nome/idade/etc. diretamente no objeto
    // (em vez de aninhados em "cliente"), para o frontend não precisar
    // de mudar nada além dos novos campos opcionais.
    app.get("/plans", async (request, reply) => {
        // Ordena por updatedAt (não createdAt): uma dieta editada volta a
        // subir para o topo, já que "editada agora" é, na prática, "gerada
        // pela última vez agora" — é essa a ordem que deve ficar correta.
        const plans = await prisma.dietPlan.findMany({
            orderBy: { updatedAt: "desc" },
            take: 50,
            include: { cliente: true },
        });

        return reply.send(plans.map(flattenPlan));
    });

    // Detalhe de uma dieta específica pelo id.
    app.get("/plans/:id", async (request, reply) => {
        const { id } = request.params as { id: string };

        const plan = await prisma.dietPlan.findUnique({
            where: { id: Number(id) },
            include: { cliente: true },
        });

        if (!plan) {
            return reply.status(404).send({ error: "NotFound" });
        }

        return reply.send(flattenPlan(plan));
    });

    // Edita uma dieta já gerada: a IA aplica o pedido em texto ao plano
    // existente (ver editDietPlan em ../agent), mantendo o resto igual.
    app.patch("/plans/:id", async (request, reply) => {
        const { id } = request.params as { id: string };

        const parse = EditPlanRequestSchema.safeParse(request.body);
        if (!parse.success) {
            return reply.status(400).send({
                error: "ValidationError",
                details: parse.error.flatten((issue) => issue.message),
            });
        }

        const plan = await prisma.dietPlan.findUnique({
            where: { id: Number(id) },
            include: { cliente: true },
        });

        if (!plan) {
            return reply.status(404).send({ error: "NotFound" });
        }

        if (plan.status !== "concluido" || !plan.resultado) {
            return reply.status(400).send({
                error: "PlanoNaoConcluido",
                details: "Só é possível editar dietas já concluídas.",
            });
        }

        // Reconstrói o contexto original enviado à IA a partir do que já
        // está persistido (cliente + campos da dieta), para a edição
        // continuar a respeitar as mesmas regras/preferências.
        const contexto: DietPlanRequest = {
            nome: plan.cliente.nome,
            idade: plan.cliente.idade,
            altura_cm: plan.cliente.altura_cm,
            peso_kg: plan.cliente.peso_kg,
            sexo: plan.cliente.sexo as DietPlanRequest["sexo"],
            nivel_atividade: plan.cliente.nivel_atividade as DietPlanRequest["nivel_atividade"],
            objetivo: plan.objetivo as DietPlanRequest["objetivo"],
            calorias_gasto_diario: plan.calorias_gasto_diario ?? undefined,
            deficit_calorico: plan.deficit_calorico ?? undefined,
            superavit_calorico: plan.superavit_calorico ?? undefined,
            perfil_avancado: plan.perfil_avancado as DietPlanRequest["perfil_avancado"],
        };

        try {
            const novoResultado = await editDietPlan(contexto, plan.resultado, parse.data.pedido);

            const historico = Array.isArray(plan.historico_edicoes) ? plan.historico_edicoes : [];
            const atualizado = await prisma.dietPlan.update({
                where: { id: plan.id },
                data: {
                    resultado: novoResultado,
                    historico_edicoes: [
                        ...historico,
                        { pedido: parse.data.pedido, data: new Date().toISOString() },
                    ],
                },
                include: { cliente: true },
            });

            return reply.send(flattenPlan(atualizado));
        } catch (err: any) {
            request.log.error(err);
            return reply.status(502).send({
                error: "EdicaoFalhou",
                details: "Não foi possível aplicar a alteração. Tente novamente.",
            });
        }
    });

    // Traduz o resultado de uma dieta para outro idioma — usado só na hora
    // de baixar o PDF; não altera o plano guardado (fica sempre em
    // português do Brasil, o idioma em que é gerado e editado).
    app.post("/plans/:id/traduzir", async (request, reply) => {
        const { id } = request.params as { id: string };

        const parse = TranslatePlanRequestSchema.safeParse(request.body);
        if (!parse.success) {
            return reply.status(400).send({
                error: "ValidationError",
                details: parse.error.flatten((issue) => issue.message),
            });
        }

        const plan = await prisma.dietPlan.findUnique({ where: { id: Number(id) } });
        if (!plan) {
            return reply.status(404).send({ error: "NotFound" });
        }
        if (plan.status !== "concluido" || !plan.resultado) {
            return reply.status(400).send({
                error: "PlanoNaoConcluido",
                details: "Só é possível traduzir dietas já concluídas.",
            });
        }

        try {
            const resultado = await translateDietPlan(plan.resultado, parse.data.idioma);
            return reply.send({ resultado });
        } catch (err: any) {
            request.log.error(err);
            return reply.status(502).send({
                error: "TraducaoFalhou",
                details: "Não foi possível traduzir a dieta. Tente novamente.",
            });
        }
    });

    // Diz ao frontend se o envio de email está configurado no servidor,
    // para mostrar o botão "Enviar por email" já desativado com uma
    // explicação em vez de deixar clicar e só falhar depois.
    app.get("/email/status", async (_request, reply) => {
        return reply.send({ configurado: transportadorConfigurado() });
    });

    // Envia o PDF da dieta (já gerado no browser, em base64) para o email
    // guardado do cliente. Não gera o PDF aqui — só anexa e envia.
    app.post("/plans/:id/enviar-email", async (request, reply) => {
        const { id } = request.params as { id: string };

        const parse = EnviarEmailRequestSchema.safeParse(request.body);
        if (!parse.success) {
            return reply.status(400).send({
                error: "ValidationError",
                details: parse.error.flatten((issue) => issue.message),
            });
        }

        const plan = await prisma.dietPlan.findUnique({ where: { id: Number(id) }, include: { cliente: true } });
        if (!plan) {
            return reply.status(404).send({ error: "NotFound" });
        }
        if (!plan.cliente.email) {
            return reply.status(400).send({
                error: "SemEmail",
                details: "Este cliente não tem email guardado.",
            });
        }

        try {
            await enviarPdfPorEmail({
                destinatario: plan.cliente.email,
                nomeCliente: plan.cliente.nome,
                pdfBase64: parse.data.pdfBase64,
                nomeArquivo: parse.data.nomeArquivo,
            });
            return reply.send({ enviado: true, destinatario: plan.cliente.email });
        } catch (err: any) {
            request.log.error(err);
            return reply.status(502).send({
                error: "EnvioFalhou",
                details: err.message || "Não foi possível enviar o email. Tente novamente.",
            });
        }
    });

    // Apaga uma dieta gerada.
    app.delete("/plans/:id", async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            await prisma.dietPlan.delete({ where: { id: Number(id) } });
        } catch {
            return reply.status(404).send({ error: "NotFound" });
        }

        return reply.status(204).send();
    });
}

// Junta os dados do cliente (nome, idade, ...) com os dados da dieta
// num único objeto plano, mantendo o formato que o frontend já espera.
function flattenPlan(plan: any) {
    const { cliente, clienteId, ...rest } = plan;
    return {
        nome: cliente.nome,
        email: cliente.email,
        idade: cliente.idade,
        altura_cm: cliente.altura_cm,
        peso_kg: cliente.peso_kg,
        sexo: cliente.sexo,
        nivel_atividade: cliente.nivel_atividade,
        foto_antes: cliente.foto_antes,
        ...rest,
    };
}