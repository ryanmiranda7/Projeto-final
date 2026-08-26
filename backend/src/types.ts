import { z } from "zod";

export const DietPlanRequestSchema = z.object({
    nome: z.string().min(2),
    idade: z.number().positive(),
    altura_cm: z.number().positive(),
    peso_kg: z.number().positive(),
    sexo: z.enum(["masculino", "feminino"]),
    nivel_atividade: z.enum(["sedentario", "2x_semana", "4x_semana"]),
    objetivo: z.enum(["perda_de_peso", "hipertrofia", "manter_massa_muscular"]),
})

export type DietPlanRequest = z.infer<typeof DietPlanRequestSchema>;