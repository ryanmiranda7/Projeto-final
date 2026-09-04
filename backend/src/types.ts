import { z } from "zod";

// Dias da semana, usados no dia de início do plano e na grelha de
// refeições fora/delivery.
const DiaSemanaSchema = z.enum(["seg", "ter", "qua", "qui", "sex", "sab", "dom"]);

// Valida "HH:mm" (horas de 00-23, minutos de 00-59).
const HoraSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida");

// Todas as respostas do wizard avançado (secções: Objetivos, Análise
// metabólica, Metas de macronutrientes e Personalização do plano).
// Guardadas como um único bloco em vez de campos soltos no schema
// principal porque só fazem sentido em conjunto e não precisam de ser
// colunas pesquisáveis (ver perfil_avancado no schema do Prisma).
export const PerfilAvancadoSchema = z
  .object({
    // --- Objetivos ---
    motivo_principal: z.enum([
      "melhorar_aparencia_fisica",
      "ficar_saudavel",
      "sentir_melhor_no_dia_a_dia",
      "outro",
    ]),
    motivo_principal_outro: z.string().optional(),

    // Faixas de gordura corporal: as "baixa_10_15" .. "muito_alta_31_50" são
    // mostradas para sexo masculino; "baixa_15_20" .. "alta_40_60" para
    // sexo feminino (ver opções condicionais em step-config.ts). Ficam
    // todas no mesmo enum para simplificar a validação.
    gordura_corporal_atual: z.enum([
      "baixa_10_15",
      "boa_15_20",
      "ok_20_25",
      "alta_25_30",
      "muito_alta_31_50",
      "baixa_15_20",
      "ideal_20_25",
      "boa_25_30",
      "ok_30_40",
      "alta_40_60",
    ]),

    // meta_15_20 / meta_20_25 / meta_25_30 são partilhadas pelos dois
    // sexos (mesma faixa percentual); meta_6_10/meta_10_15/meta_31_50 só
    // aparecem para homens, meta_30_40/meta_40_60 só para mulheres.
    meta_gordura_corporal: z.enum([
      "meta_6_10",
      "meta_10_15",
      "meta_15_20",
      "meta_20_25",
      "meta_25_30",
      "meta_31_50",
      "meta_30_40",
      "meta_40_60",
    ]),

    peso_meta_kg: z.number().positive(),

    evento_especial: z.enum([
      "nenhum",
      "ferias",
      "evento_esportivo",
      "data_importante",
      "viagem_aventura",
      "aniversario",
      "viagem_praia",
      "casamento",
    ]),
    // Obrigatória apenas se evento_especial !== "nenhum" (ver refine abaixo).
    data_evento: z.string().optional(),

    // --- Análise metabólica ---
    // "dificil_ganhar_musculo", "ganha_musculo_mas_acumula_gordura" e
    // "facil_ganhar_massa_magra" já não são oferecidas no wizard (ver
    // step-config.ts) — foram substituídas por "ganha_massa_muscular_rapido".
    // Continuam aqui só para não invalidar dietas antigas já guardadas.
    perfil_ganho_muscular: z.enum([
      "dificil_ganhar_musculo",
      "ganha_musculo_mas_acumula_gordura",
      "facil_ganhar_massa_magra",
      "ganha_massa_muscular_rapido",
      "dificuldade_ganhar_massa",
      "extremamente_dificil_perder_peso",
      "perde_peso_mas_volta",
      "nao_consegue_perder_gordura_teimosa",
      "todas_as_anteriores",
      "facil_perder_peso",
      "outro",
    ]),
    perfil_ganho_muscular_outro: z.string().optional(),

    // Só perguntado (e relevante) para sexo feminino — ver condição no
    // frontend (step-config.ts) e refine abaixo.
    perfil_hormonal: z
      .enum(["perimenopausa", "menopausa", "pos_menopausa", "nenhuma_das_anteriores"])
      .optional(),

    sintomas_testosterona_baixa: z
      .array(
        z.enum([
          "massa_muscular_diminuida",
          "gordura_corporal_alta",
          "libido_baixo",
          "fadiga",
          "sono_baixa_qualidade",
          "nenhuma",
        ])
      )
      .min(1, "Selecione pelo menos uma opção"),

    nivel_estresse: z.enum(["baixo", "moderado", "alto", "muito_alto"]),

    ritmo_preferido: z.enum(["mais_rapido_possivel", "devagar_constante", "meio_termo"]),

    // --- Metas de macronutrientes ---
    dieta_especial: z.enum([
      "nenhuma",
      "pescetariano",
      "vegetariano",
      "paleo",
      "keto",
      "vegano",
    ]),

    alergias: z
      .array(
        z.enum([
          "laticinios_alto_teor_lactose",
          "todos_laticinios",
          "ovos",
          "amendoim",
          "nozes",
          "soja",
          "gluten",
          "peixe",
          "crustaceos",
          "nenhuma",
        ])
      )
      .default([]),

    tentacoes: z
      .array(
        z.enum([
          "comer_tarde_da_noite",
          "comer_doces",
          "bebidas_acucaradas",
          "alcool",
          "alimentos_gordurosos_salgados",
          "nenhuma",
        ])
      )
      .min(1, "Selecione pelo menos uma opção"),

    orcamento_semanal: z.union([z.literal(50), z.literal(100), z.literal(150), z.literal(200)]),

    conforto_cozinha: z.enum([
      "nunca_cozinho",
      "basico",
      "proficiente",
      "gosto_e_sou_bom",
      "adoro_diariamente",
    ]),

    prioridade_tempo_variedade: z.number().int().min(1).max(5),

    sensacao_entre_refeicoes: z
      .array(
        z.enum([
          "sonolento_com_fome",
          "cansado_apos_comer",
          "energia_suficiente",
          "cansado_quando_como_demais",
          "irritado_com_fome",
          "outro",
        ])
      )
      .min(1, "Selecione pelo menos uma opção"),
    sensacao_entre_refeicoes_outro: z.string().optional(),

    riscos_saude: z
      .array(
        z.enum([
          "deficiencia_testosterona",
          "doenca_cardiaca_avc",
          "pressao_alta",
          "diabetes",
          "colesterol_alto",
          "depressao",
          "outro",
          "nenhum",
        ])
      )
      .min(1, "Selecione pelo menos uma opção"),
    riscos_saude_outro: z.string().optional(),

    ingestao_proteina: z.enum([
      "estruturo_refeicoes_em_torno_proteina",
      "consumo_todos_os_dias",
      "nao_foco",
    ]),

    // --- Personalização do plano ---
    alimentos_excluidos: z.array(z.string()).default([]),

    almoco_tipico: z.enum([
      "sanduiche_wrap",
      "salada_tigela",
      "proteina_acompanhamentos",
      "comida_rapida",
      "outro",
    ]),
    almoco_tipico_outro: z.string().optional(),

    // Só perguntado (e relevante) quando o utilizador está acima do peso e
    // quer perder bastante peso; ver condição no frontend (step-config.ts).
    jejum_intermitente: z.boolean().optional(),
    primeira_refeicao: HoraSchema.optional(),
    ultima_refeicao: HoraSchema.optional(),

    refeicoes_dia: z
      .array(z.enum(["cafe_da_manha", "almoco", "jantar", "lanches", "ceia"]))
      .min(2, "Escolha pelo menos 2 refeições"),

    dia_inicio_plano: DiaSemanaSchema,

    comer_mais_fds: z.enum(["sex_sab_dom", "sex_sab", "sab_dom", "nao_mesma_quantidade"]),

    refeicoes_fora_delivery: z
      .object({
        almoco: z.array(DiaSemanaSchema).default([]),
        jantar: z.array(DiaSemanaSchema).default([]),
      })
      .default({ almoco: [], jantar: [] }),
  })
  .refine(
    (data) => data.evento_especial === "nenhum" || !!data.data_evento,
    {
      message: "Indique a data do evento",
      path: ["data_evento"],
    }
  )
  .refine(
    (data) => {
      if (!data.jejum_intermitente) return true;
      return !!data.primeira_refeicao && !!data.ultima_refeicao;
    },
    { message: "Indique o horário da primeira e da última refeição", path: ["ultima_refeicao"] }
  )
  .refine(
    (data) => {
      if (!data.jejum_intermitente) return true;
      if (!data.primeira_refeicao || !data.ultima_refeicao) return true;

      const [hIni, mIni] = data.primeira_refeicao.split(":").map(Number);
      const [hFim, mFim] = data.ultima_refeicao.split(":").map(Number);
      const diffMinutos = hFim * 60 + mFim - (hIni * 60 + mIni);

      return diffMinutos >= 7 * 60;
    },
    {
      message: "Tem de ter pelo menos 7 horas de intervalo da primeira refeição até a última!",
      path: ["ultima_refeicao"],
    }
  )
  // Toda pergunta com opção "outro" exige o texto — selecionar "outro" e
  // deixar em branco não passa a ser aceite (ver tarefas.md #40).
  .refine((data) => data.motivo_principal !== "outro" || !!data.motivo_principal_outro?.trim(), {
    message: "Descreva o motivo",
    path: ["motivo_principal_outro"],
  })
  .refine((data) => data.perfil_ganho_muscular !== "outro" || !!data.perfil_ganho_muscular_outro?.trim(), {
    message: "Descreva",
    path: ["perfil_ganho_muscular_outro"],
  })
  .refine(
    (data) => {
      const valores = Array.isArray(data.sensacao_entre_refeicoes)
        ? data.sensacao_entre_refeicoes
        : [data.sensacao_entre_refeicoes];
      return !valores.includes("outro") || !!data.sensacao_entre_refeicoes_outro?.trim();
    },
    { message: "Descreva", path: ["sensacao_entre_refeicoes_outro"] }
  )
  .refine((data) => !data.riscos_saude.includes("outro") || !!data.riscos_saude_outro?.trim(), {
    message: "Pode indicar qual?",
    path: ["riscos_saude_outro"],
  })
  .refine((data) => data.almoco_tipico !== "outro" || !!data.almoco_tipico_outro?.trim(), {
    message: "Descreva",
    path: ["almoco_tipico_outro"],
  });

export type PerfilAvancado = z.infer<typeof PerfilAvancadoSchema>;

export const DietPlanRequestSchema = z
  .object({
    nome: z.string().min(2),
    // Obrigatório (ver tarefas.md #53) — identifica o cliente entre
    // gerações (em vez do nome) e é o destino do "enviar por email" do PDF.
    email: z.string().min(1, "O email é obrigatório").email("Email inválido"),
    idade: z.number().positive(),
    altura_cm: z.number().positive(),
    peso_kg: z.number().positive(),
    sexo: z.enum(["masculino", "feminino"]),
    nivel_atividade: z.enum(["sedentario", "levemente_ativo", "2x_semana", "4x_semana"]),
    objetivo: z.enum(["perda_de_peso", "hipertrofia", "manter_massa_muscular"]),
    // Opcional: quantas calorias o utilizador gasta por dia (TDEE).
    // Se não for indicado, a IA estima a partir dos restantes dados.
    calorias_gasto_diario: z.number().positive().optional(),
    // Opcionais: quanto o utilizador quer ficar abaixo (défice, perda
    // de peso) ou acima (superávit, hipertrofia) do gasto calórico.
    deficit_calorico: z.number().positive().optional(),
    superavit_calorico: z.number().positive().optional(),
    // Respostas do wizard avançado (ver PerfilAvancadoSchema acima).
    perfil_avancado: PerfilAvancadoSchema,
    // Foto opcional do cliente no momento desta dieta (base64 data URI),
    // guardada como referência "antes" — só é persistida na primeira vez.
    foto_antes: z.string().optional(),
  })
  .refine((data) => data.sexo !== "feminino" || !!data.perfil_avancado.perfil_hormonal, {
    message: "Indique o perfil hormonal",
    path: ["perfil_avancado", "perfil_hormonal"],
  });

export type DietPlanRequest = z.infer<typeof DietPlanRequestSchema>;

// Corpo do PATCH /plans/:id — pedido de alteração em texto livre, aplicado
// pela IA ao plano já gerado (ver editDietPlan em backend/src/agent.ts).
export const EditPlanRequestSchema = z.object({
  pedido: z.string().min(3, "Descreva a alteração que pretende"),
});

export type EditPlanRequest = z.infer<typeof EditPlanRequestSchema>;

export const TranslatePlanRequestSchema = z.object({
  idioma: z.enum(["pt-PT", "en", "es"]),
});

export type TranslatePlanRequest = z.infer<typeof TranslatePlanRequestSchema>;

// O PDF é gerado no browser (ver web/lib/diet-pdf.ts) e enviado já pronto
// para o backend só anexar ao email — evita duplicar a lógica de geração
// do PDF nos dois lados.
export const EnviarEmailRequestSchema = z.object({
  pdfBase64: z.string().min(1),
  nomeArquivo: z.string().min(1),
});

export type EnviarEmailRequest = z.infer<typeof EnviarEmailRequestSchema>;
