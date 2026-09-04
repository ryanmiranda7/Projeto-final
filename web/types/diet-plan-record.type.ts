import { PerfilAvancado } from "./diet-data.type";

export interface DietPlanRecord {
  id: number;
  nome: string;
  email: string | null;
  idade: number;
  altura_cm: number;
  peso_kg: number;
  sexo: "masculino" | "feminino";
  nivel_atividade: "sedentario" | "levemente_ativo" | "2x_semana" | "4x_semana";
  objetivo: "perda_de_peso" | "hipertrofia" | "manter_massa_muscular";
  calorias_gasto_diario: number | null;
  deficit_calorico: number | null;
  superavit_calorico: number | null;
  perfil_avancado: PerfilAvancado | null;
  foto_antes: string | null;
  resultado: string | null;
  historico_edicoes: { pedido: string; data: string }[] | null;
  status: "gerando" | "concluido" | "erro";
  // Fica true assim que a dieta é baixada em PDF ou enviada por email —
  // a partir daí não pode mais ser apagada (nem o backend deixa).
  protegido_contra_exclusao: boolean;
  createdAt: string;
  updatedAt: string;
}
