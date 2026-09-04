import { z } from "zod";
import { diaSemanaSchema, dietWizardSchema, perfilAvancadoSchema } from "@/app/_components/wizard/schema";

// Todos os tipos abaixo derivam diretamente do schema Zod usado pelo
// próprio formulário (web/app/_components/wizard/schema.ts), para nunca
// haver divergência entre a validação e os tipos usados no resto da app.
export type DiaSemana = z.infer<typeof diaSemanaSchema>;
export type PerfilAvancado = z.infer<typeof perfilAvancadoSchema>;
export type DietData = z.infer<typeof dietWizardSchema>;
