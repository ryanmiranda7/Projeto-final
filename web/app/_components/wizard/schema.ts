import { z } from "zod";

// Espelha DiaSemanaSchema em backend/src/types.ts.
export const diaSemanaSchema = z.enum(["seg", "ter", "qua", "qui", "sex", "sab", "dom"]);

const horaSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida");

// Espelha PerfilAvancadoSchema em backend/src/types.ts — mesmas regras,
// para o utilizador já ver os erros no wizard antes de submeter.
export const perfilAvancadoSchema = z
  .object({
    motivo_principal: z.enum(
      ["melhorar_aparencia_fisica", "ficar_saudavel", "sentir_melhor_no_dia_a_dia", "outro"],
      { error: "Selecione uma opção" }
    ),
    motivo_principal_outro: z.string().optional(),

    gordura_corporal_atual: z.enum(
      [
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
      ],
      { error: "Selecione uma opção" }
    ),

    meta_gordura_corporal: z.enum(
      [
        "meta_6_10",
        "meta_10_15",
        "meta_15_20",
        "meta_20_25",
        "meta_25_30",
        "meta_31_50",
        "meta_30_40",
        "meta_40_60",
      ],
      { error: "Selecione uma opção" }
    ),

    peso_meta_kg: z.number({ error: "Indique o peso que quer atingir" }).positive(),

    evento_especial: z.enum(
      [
        "nenhum",
        "ferias",
        "evento_esportivo",
        "data_importante",
        "viagem_aventura",
        "aniversario",
        "viagem_praia",
        "casamento",
      ],
      { error: "Selecione uma opção" }
    ),
    data_evento: z.string().optional(),

    perfil_ganho_muscular: z.enum(
      [
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
      ],
      { error: "Selecione uma opção" }
    ),
    perfil_ganho_muscular_outro: z.string().optional(),

    // Só perguntado para sexo feminino (ver condição em step-config.ts).
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

    nivel_estresse: z.enum(["baixo", "moderado", "alto", "muito_alto"], {
      error: "Selecione uma opção",
    }),

    ritmo_preferido: z.enum(["mais_rapido_possivel", "devagar_constante", "meio_termo"], {
      error: "Selecione uma opção",
    }),

    dieta_especial: z.enum(["nenhuma", "pescetariano", "vegetariano", "paleo", "keto", "vegano"], {
      error: "Selecione uma opção",
    }),

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
      ),

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

    orcamento_semanal: z.union([z.literal(50), z.literal(100), z.literal(150), z.literal(200)], {
      error: "Selecione uma opção",
    }),

    conforto_cozinha: z.enum(
      ["nunca_cozinho", "basico", "proficiente", "gosto_e_sou_bom", "adoro_diariamente"],
      { error: "Selecione uma opção" }
    ),

    prioridade_tempo_variedade: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ]),

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

    ingestao_proteina: z.enum(
      ["estruturo_refeicoes_em_torno_proteina", "consumo_todos_os_dias", "nao_foco"],
      { error: "Selecione uma opção" }
    ),

    alimentos_excluidos: z.array(z.string()),

    almoco_tipico: z.enum(
      ["sanduiche_wrap", "salada_tigela", "proteina_acompanhamentos", "comida_rapida", "outro"],
      { error: "Selecione uma opção" }
    ),
    almoco_tipico_outro: z.string().optional(),

    jejum_intermitente: z.boolean().optional(),
    primeira_refeicao: horaSchema.optional(),
    ultima_refeicao: horaSchema.optional(),

    refeicoes_dia: z
      .array(z.enum(["cafe_da_manha", "almoco", "jantar", "lanches", "ceia"]))
      .min(2, "Escolha pelo menos 2 refeições"),

    dia_inicio_plano: diaSemanaSchema,

    comer_mais_fds: z.enum(["sex_sab_dom", "sex_sab", "sab_dom", "nao_mesma_quantidade"], {
      error: "Selecione uma opção",
    }),

    refeicoes_fora_delivery: z.object({
      almoco: z.array(diaSemanaSchema),
      jantar: z.array(diaSemanaSchema),
    }),
  })
  .refine((data) => data.evento_especial === "nenhum" || !!data.data_evento, {
    message: "Indique a data do evento",
    path: ["data_evento"],
  })
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
    (data) => !data.sensacao_entre_refeicoes.includes("outro") || !!data.sensacao_entre_refeicoes_outro?.trim(),
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

export const dietWizardSchema = z
  .object({
    nome: z.string().min(2, "O nome é obrigatório"),
    // Obrigatório (ver tarefas.md #53) — deixou de precisar do .optional()
    // que antes obrigava a evitar o .email() aqui (ver histórico do
    // ficheiro), por isso já pode validar o formato no próprio frontend.
    email: z.string().min(1, "O email é obrigatório").email("Email inválido"),
    idade: z.number({ error: "Indique a sua idade" }).int("A idade deve ser um número inteiro").positive("A idade deve ser um número positivo"),
    altura_cm: z.number({ error: "Indique a sua altura" }).positive("A altura deve ser um número positivo"),
    peso_kg: z.number({ error: "Indique o seu peso" }).positive("O peso deve ser um número positivo"),
    sexo: z.enum(["masculino", "feminino"], { error: "Selecione o sexo" }),
    nivel_atividade: z.enum(["sedentario", "levemente_ativo", "2x_semana", "4x_semana"], {
      error: "Selecione o nível de atividade",
    }),
    objetivo: z.enum(["perda_de_peso", "hipertrofia", "manter_massa_muscular"], {
      error: "Selecione seu objetivo",
    }),
    calorias_gasto_diario: z.number().positive("Deve ser um número positivo").optional(),
    deficit_calorico: z.number().positive("Deve ser um número positivo").optional(),
    superavit_calorico: z.number().positive("Deve ser um número positivo").optional(),
    perfil_avancado: perfilAvancadoSchema,
    // Foto opcional do cliente para comparar com o resultado no futuro.
    foto_antes: z.string().optional(),
  })
  .refine((data) => data.sexo !== "feminino" || !!data.perfil_avancado?.perfil_hormonal, {
    message: "Selecione uma opção",
    path: ["perfil_avancado", "perfil_hormonal"],
  });

export type DietWizardFormData = z.infer<typeof dietWizardSchema>;
