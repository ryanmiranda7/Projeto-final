import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const PatchClienteSchema = z.object({
  lembrete_contato_data: z.string().datetime().nullable().optional(),
  lembrete_contato_feito_em: z.string().datetime().nullable().optional(),
});

// Lista de clientes para a aba /clientes do frontend: busca por nome,
// ordenação, e as datas de cada dieta gerada (para o frontend calcular os
// contadores de hoje/mês/ano e homens/mulheres sem precisar de outro
// pedido). Também inclui peso_kg + perfil_avancado da dieta mais recente
// (para calcular a projeção do objetivo/lembrete de contacto no frontend)
// e a foto "antes" + lembrete de contacto do cliente.
export async function clientesRoutes(app: FastifyInstance) {
  app.get("/clientes", async (request, reply) => {
    const { search, sort } = request.query as { search?: string; sort?: string };

    // "recentes"/"antigos" usa updatedAt do cliente (atualizado sempre que
    // ele gera uma nova dieta), não createdAt — assim reflete a atividade
    // mais recente, não só o registo original.
    const orderBy =
      sort === "nome_asc"
        ? { nome: "asc" as const }
        : sort === "antigos"
        ? { updatedAt: "asc" as const }
        : { updatedAt: "desc" as const }; // "recentes" (padrão)

    const clientes = await prisma.cliente.findMany({
      where: search
        ? {
            OR: [
              { nome: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy,
      include: {
        dietas: {
          select: { id: true, createdAt: true, updatedAt: true, status: true, perfil_avancado: true },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    return reply.send(
      clientes.map((c) => {
        const ultimaConcluida = c.dietas.find((d) => d.status === "concluido");
        return {
          id: c.id,
          nome: c.nome,
          email: c.email,
          sexo: c.sexo,
          peso_kg: c.peso_kg,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          foto_antes: c.foto_antes,
          lembrete_contato_data: c.lembrete_contato_data,
          lembrete_contato_feito_em: c.lembrete_contato_feito_em,
          // Só o necessário para o cálculo da projeção do objetivo no
          // frontend (não a lista toda de dietas, que já vai abaixo).
          ultimaDietaConcluida: ultimaConcluida
            ? { createdAt: ultimaConcluida.createdAt, perfil_avancado: ultimaConcluida.perfil_avancado }
            : null,
          dietas: c.dietas.map((d) => ({ id: d.id, createdAt: d.createdAt, updatedAt: d.updatedAt, status: d.status })),
        };
      })
    );
  });

  // Atualiza o lembrete de contacto de um cliente: definir/limpar a data
  // manual (lembrete_contato_data) e/ou marcar como já contactado
  // (lembrete_contato_feito_em). Não mexe em mais nenhum dado do cliente.
  app.patch("/clientes/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const parse = PatchClienteSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: "ValidationError",
        details: parse.error.flatten((issue) => issue.message),
      });
    }

    try {
      const data: Record<string, Date | null> = {};
      if ("lembrete_contato_data" in parse.data) {
        data.lembrete_contato_data = parse.data.lembrete_contato_data
          ? new Date(parse.data.lembrete_contato_data)
          : null;
      }
      if ("lembrete_contato_feito_em" in parse.data) {
        data.lembrete_contato_feito_em = parse.data.lembrete_contato_feito_em
          ? new Date(parse.data.lembrete_contato_feito_em)
          : null;
      }

      const atualizado = await prisma.cliente.update({
        where: { id: Number(id) },
        data,
      });

      return reply.send({
        id: atualizado.id,
        lembrete_contato_data: atualizado.lembrete_contato_data,
        lembrete_contato_feito_em: atualizado.lembrete_contato_feito_em,
      });
    } catch {
      return reply.status(404).send({ error: "NotFound" });
    }
  });
}
