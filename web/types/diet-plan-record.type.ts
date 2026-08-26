export interface DietPlanRecord {
  id: number;
  nome: string;
  idade: number;
  altura_cm: number;
  peso_kg: number;
  sexo: "masculino" | "feminino";
  nivel_atividade: "sedentario" | "2x_semana" | "4x_semana";
  objetivo: "perda_de_peso" | "hipertrofia" | "manter_massa_muscular";
  resultado: string | null;
  status: "gerando" | "concluido" | "erro";
  createdAt: string;
  updatedAt: string;
}
