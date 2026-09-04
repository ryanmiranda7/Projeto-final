import type { DietWizardFormData } from "./schema";

// Motor do wizard dirigido por configuração: cada pergunta das capturas de
// referência vira uma entrada aqui, em vez de um ficheiro JSX por pergunta.
// `field` usa dot-path (ex.: "perfil_avancado.motivo_principal") e é lido/
// escrito via react-hook-form (getValues/setValue) com `as any` nos pontos
// de fronteira do motor genérico — os steps individuais continuam
// tipados normalmente.

export type Opcao = { value: string; label: string; descricao?: string };

// As opções podem ser uma lista fixa ou uma função dos valores atuais do
// formulário — usado para perguntas cujas opções dependem do sexo
// escolhido (ex.: faixas de gordura corporal).
export type Opcoes = Opcao[] | ((values: DietWizardFormData) => Opcao[]);

type BaseStep = {
  id: string;
  pergunta: string;
  subtexto?: string;
  // Decide se este passo aparece, com base nos valores atuais do formulário.
  condicao?: (values: DietWizardFormData) => boolean;
};

export type RadioStep = BaseStep & {
  tipo: "radio";
  field: string;
  opcoes: Opcoes;
  // Se true, o valor é gravado como Number(value) em vez de string
  // (ex.: orcamento_semanal, que no schema é 50 | 100 | 150 | 200).
  numeric?: boolean;
};

export type CheckboxStep = BaseStep & {
  tipo: "checkbox";
  field: string;
  opcoes: Opcoes;
  // Valor que, ao ser selecionado, desmarca todos os outros (ex.: "Nenhuma das opções").
  exclusivo?: string;
};

export type NumberStep = BaseStep & {
  tipo: "number";
  field: string;
  placeholder?: string;
  sufixo?: string;
};

export type TextStep = BaseStep & {
  tipo: "text";
  field: string;
  placeholder?: string;
};

export type ScaleStep = BaseStep & {
  tipo: "scale";
  field: string;
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
};

export type DateStep = BaseStep & {
  tipo: "date";
  field: string;
};

export type BooleanStep = BaseStep & {
  tipo: "boolean";
  field: string;
};

export type TagsStep = BaseStep & {
  tipo: "tags";
  field: string;
};

export type TimeRangeStep = BaseStep & {
  tipo: "time-range";
  fieldInicio: string;
  fieldFim: string;
};

export type WeeklyGridStep = BaseStep & {
  tipo: "weekly-grid";
  field: string;
  linhas: { key: "almoco" | "jantar"; label: string }[];
};

export type StepDef =
  | RadioStep
  | CheckboxStep
  | NumberStep
  | TextStep
  | ScaleStep
  | DateStep
  | BooleanStep
  | TagsStep
  | TimeRangeStep
  | WeeklyGridStep;

const DIAS_SEMANA: Opcao[] = [
  { value: "dom", label: "Domingo" },
  { value: "seg", label: "Segunda" },
  { value: "ter", label: "Terça" },
  { value: "qua", label: "Quarta" },
  { value: "qui", label: "Quinta" },
  { value: "sex", label: "Sexta" },
  { value: "sab", label: "Sábado" },
];

// Resolve `opcoes` (lista fixa ou função) para a lista de opções a mostrar.
export function resolverOpcoes(opcoes: Opcoes, values: DietWizardFormData): Opcao[] {
  return typeof opcoes === "function" ? opcoes(values) : opcoes;
}

// "Acima do peso e quer perder muito peso": IMC atual >= 25 (sobrepeso/
// obesidade, OMS) e diferença para o peso-meta > 5kg. Regra aproximada —
// documentada aqui porque o pedido original não define um limiar exato.
function querPerderMuitoPeso(values: DietWizardFormData) {
  const { altura_cm, peso_kg } = values;
  const metaPeso = values.perfil_avancado?.peso_meta_kg;
  if (!altura_cm || !peso_kg || !metaPeso) return false;

  const imc = peso_kg / (altura_cm / 100) ** 2;
  return values.objetivo === "perda_de_peso" && imc >= 25 && peso_kg - metaPeso > 5;
}

export const PERFIL_STEPS: StepDef[] = [
  // ---------------- Objetivos ----------------
  {
    id: "motivo_principal",
    tipo: "radio",
    pergunta: "Qual é o seu principal motivo para querer ganhar massa muscular?",
    field: "perfil_avancado.motivo_principal",
    opcoes: [
      { value: "melhorar_aparencia_fisica", label: "Melhorar a aparência física" },
      { value: "ficar_saudavel", label: "Ficar saudável" },
      { value: "sentir_melhor_no_dia_a_dia", label: "Sentir-se melhor no dia a dia" },
      { value: "outro", label: "Outro" },
    ],
  },
  {
    id: "motivo_principal_outro",
    tipo: "text",
    pergunta: "Pode indicar qual?",
    field: "perfil_avancado.motivo_principal_outro",
    placeholder: "Escreva aqui...",
    condicao: (v) => v.perfil_avancado?.motivo_principal === "outro",
  },
  {
    id: "gordura_corporal_atual",
    tipo: "radio",
    pergunta: "Vamos estimar sua gordura corporal atual",
    subtexto: "Selecione o físico que mais se assemelha ao seu tipo de corpo",
    field: "perfil_avancado.gordura_corporal_atual",
    opcoes: (v) =>
      v.sexo === "feminino"
        ? [
            { value: "baixa_15_20", label: "Baixa gordura corporal", descricao: "Gordura corporal estimada 15 - 20% (Do ideal ao baixo)" },
            { value: "ideal_20_25", label: "Gordura corporal estimada 20 - 25%", descricao: "Ideal" },
            { value: "boa_25_30", label: "Gordura corporal estimada 25 - 30%", descricao: "Bom" },
            { value: "ok_30_40", label: "Gordura corporal estimada 30 - 40%", descricao: "Ok" },
            { value: "alta_40_60", label: "Gordura corporal estimada 40 - 60%", descricao: "Alto" },
          ]
        : [
            { value: "baixa_10_15", label: "Baixa gordura corporal", descricao: "Gordura corporal estimada 10 - 15% (Ideal)" },
            { value: "boa_15_20", label: "Gordura corporal estimada 15 - 20%", descricao: "Bom" },
            { value: "ok_20_25", label: "Gordura corporal estimada 20 - 25%", descricao: "Ok" },
            { value: "alta_25_30", label: "Gordura corporal estimada 25 - 30%", descricao: "Alto" },
            { value: "muito_alta_31_50", label: "Gordura corporal estimada 31 - 50%", descricao: "Muito alto" },
          ],
  },
  {
    id: "meta_gordura_corporal",
    tipo: "radio",
    pergunta: "Selecione sua meta de gordura corporal/físico",
    field: "perfil_avancado.meta_gordura_corporal",
    opcoes: (v) =>
      v.sexo === "feminino"
        ? [
            { value: "meta_15_20", label: "Meta de gordura corporal 15 - 20%" },
            { value: "meta_20_25", label: "Meta de gordura corporal 20 - 25%" },
            { value: "meta_25_30", label: "Meta de gordura corporal 25 - 30%" },
            { value: "meta_30_40", label: "Meta de gordura corporal 30 - 40%" },
            { value: "meta_40_60", label: "Meta de gordura corporal 40 - 60%" },
          ]
        : [
            { value: "meta_6_10", label: "Meta de gordura corporal 6 - 10%" },
            { value: "meta_10_15", label: "Meta de gordura corporal 10 - 15%" },
            { value: "meta_15_20", label: "Meta de gordura corporal 15 - 20%" },
            { value: "meta_20_25", label: "Meta de gordura corporal 20 - 25%" },
            { value: "meta_25_30", label: "Meta de gordura corporal 25 - 30%" },
            { value: "meta_31_50", label: "Meta de gordura corporal 31 - 50%" },
          ],
  },
  {
    id: "peso_meta_kg",
    tipo: "number",
    pergunta: "Qual peso você quer atingir?",
    field: "perfil_avancado.peso_meta_kg",
    placeholder: "Ex: 80",
    sufixo: "kg",
  },
  {
    id: "evento_especial",
    tipo: "radio",
    pergunta: "Há algum evento especial para o qual você quer ganhar massa muscular?",
    field: "perfil_avancado.evento_especial",
    opcoes: [
      { value: "nenhum", label: "Não" },
      { value: "ferias", label: "Férias" },
      { value: "evento_esportivo", label: "Evento esportivo" },
      { value: "data_importante", label: "Data importante" },
      { value: "viagem_aventura", label: "Viagem de aventura" },
      { value: "aniversario", label: "Aniversário" },
      { value: "viagem_praia", label: "Viagem à praia" },
      { value: "casamento", label: "Casamento" },
    ],
  },
  {
    id: "data_evento",
    tipo: "date",
    pergunta: "Quando é o evento?",
    field: "perfil_avancado.data_evento",
    condicao: (v) => v.perfil_avancado?.evento_especial !== "nenhum",
  },

  // ---------------- Análise metabólica ----------------
  {
    id: "perfil_ganho_muscular",
    tipo: "radio",
    pergunta: "Quais das opções melhor descreve você?",
    field: "perfil_avancado.perfil_ganho_muscular",
    // As antigas opções específicas de ganho de músculo (dificil_ganhar_musculo,
    // ganha_musculo_mas_acumula_gordura, facil_ganhar_massa_magra) e
    // "todas_as_anteriores" foram removidas da lista abaixo, mas continuam
    // válidas no schema (types.ts / schema.ts) só para não invalidar
    // dietas antigas já guardadas com esses valores.
    opcoes: [
      { value: "ganha_massa_muscular_rapido", label: "Consigo ganhar massa muscular rápido" },
      { value: "dificuldade_ganhar_massa", label: "Tenho dificuldade de ganhar massa muscular" },
      { value: "extremamente_dificil_perder_peso", label: "É extremamente difícil para mim perder peso" },
      { value: "perde_peso_mas_volta", label: "Consigo perder peso, mas ele volta aos poucos" },
      { value: "nao_consegue_perder_gordura_teimosa", label: "Simplesmente não consigo perder aquela última gordura teimosa" },
      { value: "facil_perder_peso", label: "É fácil para mim perder peso" },
      { value: "outro", label: "Outro" },
    ],
  },
  {
    id: "perfil_ganho_muscular_outro",
    tipo: "text",
    pergunta: "Pode descrever?",
    field: "perfil_avancado.perfil_ganho_muscular_outro",
    placeholder: "Escreva aqui...",
    condicao: (v) => v.perfil_avancado?.perfil_ganho_muscular === "outro",
  },
  {
    id: "perfil_hormonal",
    tipo: "radio",
    pergunta: "Qual perfil hormonal melhor descreve você?",
    field: "perfil_avancado.perfil_hormonal",
    condicao: (v) => v.sexo === "feminino",
    opcoes: [
      { value: "perimenopausa", label: "Perimenopausa" },
      { value: "menopausa", label: "Menopausa" },
      { value: "pos_menopausa", label: "Pós-menopausa" },
      { value: "nenhuma_das_anteriores", label: "Nenhuma das anteriores" },
    ],
  },
  {
    id: "sintomas_testosterona_baixa",
    tipo: "checkbox",
    pergunta: "Você tem algum dos seguintes sintomas de baixa testosterona?",
    field: "perfil_avancado.sintomas_testosterona_baixa",
    exclusivo: "nenhuma",
    opcoes: [
      { value: "massa_muscular_diminuida", label: "Diminuição da massa muscular" },
      { value: "gordura_corporal_alta", label: "Maior percentual de gordura corporal" },
      { value: "libido_baixo", label: "Baixo libido" },
      { value: "fadiga", label: "Fadiga" },
      { value: "sono_baixa_qualidade", label: "Baixa qualidade do sono" },
      { value: "nenhuma", label: "Nenhuma das opções" },
    ],
  },
  {
    id: "nivel_estresse",
    tipo: "radio",
    pergunta: "Como são seus níveis de estresse no dia a dia?",
    field: "perfil_avancado.nivel_estresse",
    opcoes: [
      { value: "baixo", label: "Baixo" },
      { value: "moderado", label: "Moderado" },
      { value: "alto", label: "Alto" },
      { value: "muito_alto", label: "Muito Alto" },
    ],
  },
  {
    id: "ritmo_preferido",
    tipo: "radio",
    pergunta: "Qual ritmo você prefere?",
    subtexto: "O melhor plano funciona num ritmo que faça mais sentido para você pessoalmente.",
    field: "perfil_avancado.ritmo_preferido",
    opcoes: [
      { value: "mais_rapido_possivel", label: "O mais rápido possível" },
      { value: "devagar_constante", label: "Devagar e constante" },
      { value: "meio_termo", label: "Algo entre os dois" },
    ],
  },

  // ---------------- Metas de macronutrientes ----------------
  {
    id: "dieta_especial",
    tipo: "radio",
    pergunta: "Você quer seguir algum tipo especial de dieta?",
    field: "perfil_avancado.dieta_especial",
    opcoes: [
      { value: "nenhuma", label: "Não, eu só quero resultados" },
      { value: "pescetariano", label: "Pescetariano" },
      { value: "vegetariano", label: "Vegetariano" },
      { value: "paleo", label: "Paleo", descricao: "Carnes, peixe, ovos, vegetais e frutas — sem processados, grãos ou laticínios." },
      { value: "keto", label: "Keto", descricao: "Muito baixa em carboidratos e rica em gorduras, para induzir cetose." },
      { value: "vegano", label: "Vegano" },
    ],
  },
  {
    id: "alergias",
    tipo: "checkbox",
    pergunta: "Você tem alguma alergia alimentar?",
    field: "perfil_avancado.alergias",
    exclusivo: "nenhuma",
    opcoes: [
      { value: "laticinios_alto_teor_lactose", label: "Laticínios (alto teor de lactose)" },
      { value: "todos_laticinios", label: "Todos os laticínios" },
      { value: "ovos", label: "Ovos" },
      { value: "amendoim", label: "Amendoim" },
      { value: "nozes", label: "Nozes" },
      { value: "soja", label: "Soja" },
      { value: "gluten", label: "Glúten" },
      { value: "peixe", label: "Peixe" },
      { value: "crustaceos", label: "Crustáceos" },
      { value: "nenhuma", label: "Nenhum" },
    ],
  },
  {
    id: "tentacoes",
    tipo: "checkbox",
    pergunta: "Quais alimentos ou hábitos você acha mais tentadores?",
    field: "perfil_avancado.tentacoes",
    exclusivo: "nenhuma",
    opcoes: [
      { value: "comer_tarde_da_noite", label: "Comer tarde da noite" },
      { value: "comer_doces", label: "Comer doces" },
      { value: "bebidas_acucaradas", label: "Beber refrigerantes/bebidas açucaradas" },
      { value: "alcool", label: "Beber álcool" },
      { value: "alimentos_gordurosos_salgados", label: "Comer alimentos gordurosos/salgados" },
      { value: "nenhuma", label: "Nenhuma das opções acima" },
    ],
  },
  {
    id: "orcamento_semanal",
    tipo: "radio",
    pergunta: "Como você classificaria seu orçamento semanal para alimentação/mercado?",
    field: "perfil_avancado.orcamento_semanal",
    numeric: true,
    opcoes: [
      { value: "50", label: "50€" },
      { value: "100", label: "100€" },
      { value: "150", label: "150€" },
      { value: "200", label: "200€" },
    ],
  },
  {
    id: "conforto_cozinha",
    tipo: "radio",
    pergunta: "Quão confortável você está ao cozinhar?",
    field: "perfil_avancado.conforto_cozinha",
    opcoes: [
      { value: "nunca_cozinho", label: "Nunca cozinho e não sei como" },
      { value: "basico", label: "Consigo cozinhar o básico" },
      { value: "proficiente", label: "Sou proficiente nisso" },
      { value: "gosto_e_sou_bom", label: "Gosto e sou bom em cozinhar" },
      { value: "adoro_diariamente", label: "Adoro cozinhar e faço isso diariamente" },
    ],
  },
  {
    id: "prioridade_tempo_variedade",
    tipo: "scale",
    pergunta: "O que é mais importante para você?",
    subtexto: "1 - Tempo mínimo de preparo, 5 - Máxima variedade",
    field: "perfil_avancado.prioridade_tempo_variedade",
    min: 1,
    max: 5,
    minLabel: "Tempo mínimo",
    maxLabel: "Máxima variedade",
  },
  {
    id: "sensacao_entre_refeicoes",
    tipo: "checkbox",
    pergunta: "Como você se sente entre as refeições?",
    subtexto: "Pode selecionar mais do que uma opção",
    field: "perfil_avancado.sensacao_entre_refeicoes",
    opcoes: [
      { value: "sonolento_com_fome", label: "Fico sonolento quando estou com fome" },
      { value: "cansado_apos_comer", label: "Fico cansado depois de comer" },
      { value: "energia_suficiente", label: "Tenho energia suficiente durante o dia" },
      { value: "cansado_quando_como_demais", label: "Fico cansado quando como demais" },
      { value: "irritado_com_fome", label: "Fico irritado quando estou com fome" },
      { value: "outro", label: "Outro" },
    ],
  },
  {
    id: "sensacao_entre_refeicoes_outro",
    tipo: "text",
    pergunta: "Pode descrever?",
    field: "perfil_avancado.sensacao_entre_refeicoes_outro",
    placeholder: "Escreva aqui...",
    condicao: (v) => !!v.perfil_avancado?.sensacao_entre_refeicoes?.includes("outro"),
  },
  {
    id: "riscos_saude",
    tipo: "checkbox",
    pergunta: "Você corre risco de alguma das condições a seguir?",
    field: "perfil_avancado.riscos_saude",
    exclusivo: "nenhum",
    opcoes: [
      { value: "deficiencia_testosterona", label: "Deficiência de testosterona" },
      { value: "doenca_cardiaca_avc", label: "Doença cardíaca ou AVC" },
      { value: "pressao_alta", label: "Pressão alta" },
      { value: "diabetes", label: "Diabetes" },
      { value: "colesterol_alto", label: "Colesterol alto" },
      { value: "depressao", label: "Depressão" },
      { value: "outro", label: "Outro" },
      { value: "nenhum", label: "Nenhum" },
    ],
  },
  {
    id: "riscos_saude_outro",
    tipo: "text",
    pergunta: "Pode indicar qual?",
    field: "perfil_avancado.riscos_saude_outro",
    placeholder: "Escreva aqui...",
    condicao: (v) => !!v.perfil_avancado?.riscos_saude?.includes("outro"),
  },
  {
    id: "ingestao_proteina",
    tipo: "radio",
    pergunta: "Como você descreveria a quantidade de proteína que normalmente ingere?",
    subtexto:
      "A proteína é encontrada em alimentos como carne, frutos do mar, peixe, tofu, ovos, shakes de proteína e alguns iogurtes.",
    field: "perfil_avancado.ingestao_proteina",
    opcoes: [
      { value: "estruturo_refeicoes_em_torno_proteina", label: "Estruturo todas as minhas refeições em torno da proteína" },
      { value: "consumo_todos_os_dias", label: "Consumo proteína todos os dias" },
      { value: "nao_foco", label: "Não foco em comer proteína" },
    ],
  },

  // ---------------- Personalização do plano ----------------
  {
    id: "alimentos_excluidos",
    tipo: "tags",
    pergunta: "Há alimentos que você gostaria de excluir do seu plano além das alergias que você já excluiu?",
    subtexto:
      "Receitas/alimentos que incluam qualquer uma das palavras-chave que você inserir serão excluídos do seu plano.",
    field: "perfil_avancado.alimentos_excluidos",
  },
  {
    id: "almoco_tipico",
    tipo: "radio",
    pergunta: "Como é seu almoço típico?",
    field: "perfil_avancado.almoco_tipico",
    opcoes: [
      { value: "sanduiche_wrap", label: "Sanduíche ou wrap" },
      { value: "salada_tigela", label: "Salada ou tigela mista" },
      { value: "proteina_acompanhamentos", label: "Proteína com acompanhamentos" },
      { value: "comida_rapida", label: "Comida rápida" },
      { value: "outro", label: "Outro" },
    ],
  },
  {
    id: "almoco_tipico_outro",
    tipo: "text",
    pergunta: "Pode descrever?",
    field: "perfil_avancado.almoco_tipico_outro",
    placeholder: "Escreva aqui...",
    condicao: (v) => v.perfil_avancado?.almoco_tipico === "outro",
  },
  {
    id: "jejum_intermitente",
    tipo: "boolean",
    pergunta: "Você quer tentar o jejum intermitente?",
    field: "perfil_avancado.jejum_intermitente",
    condicao: querPerderMuitoPeso,
  },
  {
    id: "janela_jejum",
    tipo: "time-range",
    pergunta: "Qual o horário da sua primeira e da sua última refeição do dia?",
    fieldInicio: "perfil_avancado.primeira_refeicao",
    fieldFim: "perfil_avancado.ultima_refeicao",
    condicao: (v) => querPerderMuitoPeso(v) && v.perfil_avancado?.jejum_intermitente === true,
  },
  {
    id: "refeicoes_dia",
    tipo: "checkbox",
    pergunta: "Quais refeições você come em um dia típico?",
    subtexto: "Escolha pelo menos 2",
    field: "perfil_avancado.refeicoes_dia",
    opcoes: [
      { value: "cafe_da_manha", label: "Café da manhã" },
      { value: "almoco", label: "Almoço" },
      { value: "lanches", label: "Lanches" },
      { value: "jantar", label: "Jantar" },
      { value: "ceia", label: "Ceia" },
    ],
  },
  {
    id: "dia_inicio_plano",
    tipo: "radio",
    pergunta: "Em que dia seu plano alimentar deve começar a cada semana?",
    subtexto:
      "Isto ajudará no planeamento da lista de compras semanal e das refeições.",
    field: "perfil_avancado.dia_inicio_plano",
    opcoes: DIAS_SEMANA,
  },
  {
    id: "comer_mais_fds",
    tipo: "radio",
    pergunta: "Você gostaria de comer mais nos finais de semana?",
    subtexto:
      "Transferir algumas calorias semanais para os finais de semana pode acelerar seu progresso, tornando mais fácil aderir ao seu plano.",
    field: "perfil_avancado.comer_mais_fds",
    opcoes: [
      { value: "sex_sab_dom", label: "Comer mais em sex, sab, e dom" },
      { value: "sex_sab", label: "Comer mais em sex e sab" },
      { value: "sab_dom", label: "Comer mais em sab e dom" },
      { value: "nao_mesma_quantidade", label: "Não, comer a mesma quantidade todos os dias" },
    ],
  },
  {
    id: "refeicoes_fora_delivery",
    tipo: "weekly-grid",
    pergunta: "Selecione as refeições em que você come fora ou pede delivery em uma semana típica",
    field: "perfil_avancado.refeicoes_fora_delivery",
    linhas: [
      { key: "almoco", label: "Almoço" },
      { key: "jantar", label: "Jantar" },
    ],
  },
];
