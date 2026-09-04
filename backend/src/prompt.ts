import { DietPlanRequestSchema, type DietPlanRequest, type PerfilAvancado } from "./types";

// Lista fixa dos 14 tipos de metabolismo anabólico que a IA deve escolher
// para classificar o cliente. Mantida aqui (e não como enum no schema)
// porque quem decide o tipo é o próprio modelo, com base na análise das
// respostas — não uma regra determinística no backend.
const TIPOS_METABOLISMO = [
  "Tipo A (MATA - Metabolismo Anabólico de Tecido Adiposo e Armazenamento)",
  "Tipo B (MATA - Modulação Anabólica de Tecido Muscular e Aminoácidos)",
  "Tipo C (MATA - Mecanismos de Ativação por Treino e Alimentação)",
  "Tipo D (MATA - Modificação Anabólica por Via Terapêutica ou Artificial)",
  "Metabolismo Elástico - Tipo A (META)",
  "Metabolismo Elástico - Tipo B (META)",
  "Metabolismo Elástico - Tipo C (META)",
  "Metabolismo Catabólico de Degradação Lipídica - Tipo A (MCDL)",
  "Metabolismo Catabólico de Degradação Proteica - Tipo B (MCDP)",
  "Metabolismo Catabólico de Degradação Glicídica - Tipo C (MCDG)",
  "Metabolismo Anfibólico de Transição Energética - Tipo A (MATE)",
  "Metabolismo Xenobiótico de Depuração Celular - Tipo A (MXDC)",
  "Metabolismo Aeróbico Oxidador - Tipo A (MAO)",
  "Metabolismo Anaeróbico Glicolítico - Tipo B (MAG)",
  "Metabolismo Anaeróbico Aláctico - Tipo C (MAA)",
];

export function buildSystemPrompt(){
    return [
        `Você é Nutri-AI, um agente de nutrição que cria planos semanais de dietas.
        Regras fixas:
        - Sempre responda em texto markdown legível para humanos.
        - Use # para títulos e - para itens de lista.
        - A dieta deve conter exatamente 7 dias.
        - Cada dia deve conter apenas as refeições indicadas em "Refeições que deve gerar" (ver dados do utilizador). Se não houver essa indicação, use café_da_manhã, almoço, lanche, jantar.
        - Se um dia/refeição estiver marcado como "come fora / delivery" nos dados do utilizador, não gere receita para esse slot: escreva apenas "Refeição livre (come fora ou pede delivery)".
        - SEMPRE inclua ingredientes comuns em Portugal.
        - NUNCA inclua calorias e macros de cada refeição individual, apenas as refeições.
        - Em cada alimento listado numa refeição, indique sempre a quantidade a consumir (gramas, ml ou
          unidades — ex: "150g de arroz integral", "1 banana", "200ml de leite"), não só o nome do alimento.
        - Calcule mentalmente as calorias/proteínas/carboidratos de cada alimento a partir da quantidade
          indicada antes de escrever o "Resumo do dia", para os totais do resumo corresponderem de facto à
          soma das quantidades listadas nesse dia (não invente um total redondo desligado dos alimentos).
        - No final de cada dia, adicione uma pequena secção "Resumo do dia" com os valores aproximados de:
          calorias totais (kcal), proteínas (g) e carboidratos (g) que o utilizador consumirá naquele dia,
          somando as quantidades de todas as refeições do dia. Deixe claro que são valores aproximados.
        - Se for indicado o gasto calórico diário do utilizador, ajuste as calorias totais de cada dia
          tendo em conta esse valor e o objetivo do utilizador (défice para perda de peso, superávit para
          hipertrofia, valor próximo do gasto para manter massa muscular). Se não for indicado, estime
          o gasto calórico a partir dos restantes dados (idade, altura, peso, sexo e nível de atividade).
        - Se for indicado um défice calórico desejado, as calorias totais de cada dia devem ficar
          aproximadamente esse valor ABAIXO do gasto calórico (informado ou estimado).
        - Se for indicado um superávit calórico desejado, as calorias totais de cada dia devem ficar
          aproximadamente esse valor ACIMA do gasto calórico (informado ou estimado).
        - Se houver dias marcados para "comer mais no fim de semana", desloque parte das calorias semanais
          para esses dias (mantendo o total semanal coerente com o objetivo).
        - Se houver jejum intermitente, todas as refeições de um mesmo dia devem caber dentro da janela
          horária informada (primeira e última refeição).
        - Respeite sempre: dieta especial, alergias, alimentos/palavras-chave excluídos, orçamento semanal
          e nível de conforto a cozinhar informados pelo utilizador. Nunca inclua alergénios indicados.
        - Evite alimentos ultraprocessados.
        - Não responda em JSON ou outro formato, apenas texto markdown legível para humanos.
        - Não inclua dicas como: bom consultar um nutricionista para um acompanhamento mais personalizado

        Antes do plano semanal, inclua obrigatoriamente, nesta ordem, duas secções de análise:

        1. "## O seu tipo de metabolismo": com base em TODAS as respostas do utilizador (objetivos, análise
           metabólica, hábitos e preferências), classifique-o em EXATAMENTE UM dos seguintes tipos (escreva
           o nome completo tal como aparece na lista, não invente outro):
           ${TIPOS_METABOLISMO.map((t) => `- ${t}`).join("\n           ")}
           Logo a seguir ao nome do tipo escolhido, escreva um parágrafo curto (2-4 frases) a explicar as
           características desse tipo para este utilizador específico. Para utilizadoras do sexo feminino,
           considere também o perfil hormonal informado (perimenopausa/menopausa/pós-menopausa) na
           classificação e na explicação, quando relevante.

        2. "## Chaves científicas para ganho de massa muscular": adaptando o tom ao tipo escolhido no passo
           anterior, inclua quatro subtítulos ### com um parágrafo curto cada:
           - "Macros direcionados": sobre a combinação/quantidade certa de proteína, gordura, carboidratos e
             fibras para este tipo equilibrar hormonas de apetite e armazenamento de gordura.
           - "Treinamento de força anabólico": sobre treinos curtos e direcionados de força que aumentam
             testosterona e estimulam crescimento muscular sem sobrecarregar o corpo.
           - "Pouco ou nenhum cardio": sobre por que cardio em excesso não é prioritário para este tipo.
           - "Mais comidas que você ama": sobre a importância de incluir alimentos indulgentes com moderação,
             mantendo os macros do plano.

        Só depois destas duas secções é que deve vir o plano semanal de 7 dias.`,
    ].join("/n");
}

// Aceita string[] (formato atual) ou uma única string (planos antigos,
// gerados antes de sensacao_entre_refeicoes passar a ser multi-seleção —
// o perfil_avancado é um Json livre, então dados antigos continuam com o
// formato de quando foram guardados) para nunca rebentar ao reconstruir o
// prompt de edição de um plano gerado antes desta alteração.
function formatarLista(valores: string[] | string | undefined, vazio = "nenhuma"): string {
    if (!valores) return vazio;
    const lista = Array.isArray(valores) ? valores : [valores];
    if (lista.length === 0) return vazio;
    return lista.join(", ");
}

function formatarDiasSemana(dias: string[] | undefined): string {
    if (!dias || dias.length === 0) return "nenhum";
    return dias.join(", ");
}

function buildPerfilAvancadoPrompt(perfil: PerfilAvancado): string {
    const linhas: string[] = [];

    linhas.push("### Objetivos");
    linhas.push(`- Motivo principal para querer ganhar massa muscular: ${perfil.motivo_principal}${
        perfil.motivo_principal === "outro" && perfil.motivo_principal_outro
            ? ` (${perfil.motivo_principal_outro})`
            : ""
    }`);
    linhas.push(`- Gordura corporal atual estimada: ${perfil.gordura_corporal_atual}`);
    linhas.push(`- Meta de gordura corporal / físico: ${perfil.meta_gordura_corporal}`);
    linhas.push(`- Peso que quer atingir: ${perfil.peso_meta_kg} kg`);
    linhas.push(
        perfil.evento_especial === "nenhum"
            ? "- Sem evento especial associado ao objetivo"
            : `- Evento especial: ${perfil.evento_especial}${perfil.data_evento ? ` em ${perfil.data_evento}` : ""}`
    );
    linhas.push(`- Ritmo preferido para atingir o objetivo: ${perfil.ritmo_preferido}`);

    linhas.push("");
    linhas.push("### Análise metabólica");
    linhas.push(`- Perfil de ganho muscular: ${perfil.perfil_ganho_muscular}${
        perfil.perfil_ganho_muscular === "outro" && perfil.perfil_ganho_muscular_outro
            ? ` (${perfil.perfil_ganho_muscular_outro})`
            : ""
    }`);
    if (perfil.perfil_hormonal) {
        linhas.push(`- Perfil hormonal: ${perfil.perfil_hormonal}`);
    }
    linhas.push(`- Sintomas de testosterona baixa: ${formatarLista(perfil.sintomas_testosterona_baixa)}`);
    linhas.push(`- Nível de estresse no dia a dia: ${perfil.nivel_estresse}`);

    linhas.push("");
    linhas.push("### Metas de macronutrientes e hábitos");
    linhas.push(`- Dieta especial: ${perfil.dieta_especial}`);
    linhas.push(`- Alergias alimentares: ${formatarLista(perfil.alergias)}`);
    linhas.push(`- Alimentos/hábitos mais tentadores: ${formatarLista(perfil.tentacoes)}`);
    linhas.push(`- Orçamento semanal para alimentação/mercado: ${perfil.orcamento_semanal}€`);
    linhas.push(`- Conforto ao cozinhar: ${perfil.conforto_cozinha}`);
    linhas.push(
        `- Prioridade tempo mínimo de preparo (1) vs máxima variedade (5): ${perfil.prioridade_tempo_variedade}`
    );
    linhas.push(`- Como se sente entre as refeições: ${formatarLista(perfil.sensacao_entre_refeicoes)}${
        // sensacao_entre_refeicoes pode ser string (planos antigos) ou array
        // (formato atual) — ver formatarLista acima.
        (Array.isArray(perfil.sensacao_entre_refeicoes)
            ? perfil.sensacao_entre_refeicoes.includes("outro")
            : perfil.sensacao_entre_refeicoes === "outro") && perfil.sensacao_entre_refeicoes_outro
            ? ` (${perfil.sensacao_entre_refeicoes_outro})`
            : ""
    }`);
    linhas.push(`- Risco de: ${formatarLista(perfil.riscos_saude)}${
        perfil.riscos_saude.includes("outro") && perfil.riscos_saude_outro
            ? ` (${perfil.riscos_saude_outro})`
            : ""
    }`);
    linhas.push(`- Ingestão habitual de proteína: ${perfil.ingestao_proteina}`);

    linhas.push("");
    linhas.push("### Personalização do plano");
    linhas.push(
        `- Alimentos/palavras-chave a excluir do plano: ${formatarLista(perfil.alimentos_excluidos, "nenhum")}`
    );
    linhas.push(`- Almoço típico: ${perfil.almoco_tipico}${
        perfil.almoco_tipico === "outro" && perfil.almoco_tipico_outro ? ` (${perfil.almoco_tipico_outro})` : ""
    }`);
    linhas.push(
        perfil.jejum_intermitente
            ? `- Jejum intermitente: sim, refeições apenas entre ${perfil.primeira_refeicao} e ${perfil.ultima_refeicao}`
            : "- Jejum intermitente: não"
    );
    linhas.push(`- Refeições que deve gerar em cada dia: ${formatarLista(perfil.refeicoes_dia)}`);
    linhas.push(`- Dia da semana em que o plano deve começar: ${perfil.dia_inicio_plano}`);
    linhas.push(`- Comer mais nos fins de semana: ${perfil.comer_mais_fds}`);
    // A linha "lanche" da grelha virou "jantar" (ver tarefas.md #31); planos
    // antigos ainda têm a chave "lanche" guardada, por isso o fallback.
    const refeicoesForaAntigo = perfil.refeicoes_fora_delivery as unknown as { almoco: string[]; jantar?: string[]; lanche?: string[] };
    linhas.push(
        `- Refeições em que come fora ou pede delivery — almoço: ${formatarDiasSemana(
            refeicoesForaAntigo.almoco
        )}; jantar: ${formatarDiasSemana(refeicoesForaAntigo.jantar ?? refeicoesForaAntigo.lanche)}`
    );

    return linhas.join("\n");
}

export function buildUserPrompt(input: DietPlanRequest){
    return [
        "Gere um plano alimentar personalizado com base nos dados:",
        `- Nome: ${input.nome}`,
        `- Idade: ${input.idade}`,
        `- Altura em cm: ${input.altura_cm}`,
        `- Peso em kg: ${input.peso_kg}`,
        `- Sexo: ${input.sexo}`,
        `- Nivel de atividade: ${input.nivel_atividade}`,
        `- Objetivo: ${input.objetivo}`,
        input.calorias_gasto_diario
            ? `- Gasto calórico diário informado pelo utilizador: ${input.calorias_gasto_diario} kcal (use este valor como referência para ajustar as calorias totais de cada dia)`
            : `- Gasto calórico diário: não foi informado, estime a partir dos restantes dados`,
        input.deficit_calorico
            ? `- Défice calórico desejado: ${input.deficit_calorico} kcal abaixo do gasto calórico`
            : "",
        input.superavit_calorico
            ? `- Superávit calórico desejado: ${input.superavit_calorico} kcal acima do gasto calórico`
            : "",
        "",
        buildPerfilAvancadoPrompt(input.perfil_avancado),
    ].filter(Boolean).join("\n");
}

export function buildDocsSystemPrompt(doc: string) {
    return `Documento técnico para ajudar na geração de dietas: ${doc}`;
}

// Usado no fluxo de edição (PATCH /plans/:id): pede à IA para reescrever o
// plano já gerado, aplicando só a alteração pedida pelo nutricionista.
export function buildEditRequestPrompt(pedido: string) {
    return [
        "O plano acima já foi aprovado, mas o nutricionista pediu a seguinte alteração:",
        `"${pedido}"`,
        "",
        "Devolva o plano semanal COMPLETO atualizado (mesmo formato markdown desta conversa, com as duas",
        "secções de análise no início e os 7 dias), aplicando apenas a alteração pedida e mantendo tudo o",
        "resto o mais parecido possível com o plano anterior. Continue a respeitar todas as regras fixas",
        "(alergias, dieta especial, alimentos excluídos, etc.).",
    ].join("\n");
}

const NOMES_IDIOMA: Record<"pt-PT" | "en" | "es", string> = {
    "pt-PT": "português de Portugal",
    en: "inglês",
    es: "espanhol",
};

// Usado só para exportar o PDF num idioma diferente — não altera o plano
// guardado (que continua em português do Brasil, o idioma em que foi gerado).
export function buildTranslateRequestPrompt(idioma: "pt-PT" | "en" | "es") {
    return [
        `Traduza o texto que o utilizador enviar (um plano alimentar em markdown) para ${NOMES_IDIOMA[idioma]}.`,
        "Mantenha exatamente a mesma formatação markdown (##, ###, -, **negrito**, ---) e a mesma estrutura",
        "de secções e dias. Traduza também os nomes dos dias da semana e os rótulos (ex.: \"Café da manhã\",",
        "\"Resumo do dia\", \"Calorias totais\"). Não acrescente comentários, notas ou texto fora do plano —",
        "devolva só o plano traduzido.",
    ].join("\n");
}
