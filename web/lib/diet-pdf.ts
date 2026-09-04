import { jsPDF } from "jspdf";
import type { DietPlanRecord } from "@/types/diet-plan-record.type";
import type { PerfilAvancado } from "@/types/diet-data.type";
import { calcularProjecaoObjetivo } from "./goal-projection";

// Gera o PDF desenhando texto e formas vetoriais diretamente (jsPDF), em vez
// de tirar um "print" do DOM (html2canvas). O html2canvas não consegue
// interpretar as cores modernas do Tailwind v4 (oklch()/lab()), o que
// rebentava a app inteira ao clicar em "Baixar PDF" — ver tarefas.md.
// Os "ícones" abaixo são formas geométricas simples desenhadas com as
// primitivas do jsPDF (círculo/quadrado/triângulo/linhas) — sem emojis e
// sem precisar de embutir imagens.

export type IdiomaPdf = "pt-BR" | "pt-PT" | "en" | "es";

const TEXTOS_POR_IDIOMA: Record<IdiomaPdf, { titulo: string; geradoEm: string; locale: string }> = {
  "pt-BR": { titulo: "Plano alimentar", geradoEm: "Gerado em", locale: "pt-BR" },
  "pt-PT": { titulo: "Plano alimentar", geradoEm: "Gerado em", locale: "pt-PT" },
  en: { titulo: "Meal Plan", geradoEm: "Generated on", locale: "en-US" },
  es: { titulo: "Plan alimenticio", geradoEm: "Generado el", locale: "es-ES" },
};

const VERDE = { r: 22, g: 163, b: 74 }; // #16a34a
const VERDE_ESCURO = { r: 21, g: 94, b: 60 }; // ~#155e3c
const VERDE_CLARO = { r: 240, g: 253, b: 244 }; // #f0fdf4
const CINZA_TEXTO = { r: 39, g: 39, b: 42 };
const CINZA_CLARO = { r: 244, g: 244, b: 245 };

const MARGEM = 15;
const LARGURA_PAGINA = 210; // A4, em mm
const ALTURA_PAGINA = 297;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;

// ---------------------------------------------------------------------------
// Análise estrutural do markdown (sem depender de palavras-chave em nenhum
// idioma específico, para funcionar igual em PT/EN/ES depois da tradução).
// ---------------------------------------------------------------------------

type Bloco =
  | { tipo: "h1"; texto: string }
  | { tipo: "h2"; texto: string }
  | { tipo: "h3"; texto: string }
  | { tipo: "bullets"; itens: string[] }
  | { tipo: "statbox"; titulo: string; itens: string[] }
  | { tipo: "destaque"; texto: string }
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "hr" };

function tokenizar(markdown: string): Bloco[] {
  const linhas = markdown.split("\n").map((l) => l.trim());
  const blocos: Bloco[] = [];
  let i = 0;

  while (i < linhas.length) {
    const linha = linhas[i];

    if (!linha) {
      i++;
      continue;
    }
    if (linha === "---") {
      blocos.push({ tipo: "hr" });
      i++;
      continue;
    }
    if (linha.startsWith("### ")) {
      blocos.push({ tipo: "h3", texto: linha.slice(4) });
      i++;
      continue;
    }
    if (linha.startsWith("## ")) {
      blocos.push({ tipo: "h2", texto: linha.slice(3) });
      i++;
      continue;
    }
    if (linha.startsWith("# ")) {
      blocos.push({ tipo: "h1", texto: linha.slice(2) });
      i++;
      continue;
    }
    if (linha.startsWith("- ")) {
      const itens: string[] = [];
      while (i < linhas.length && linhas[i].startsWith("- ")) {
        itens.push(linhas[i].slice(2));
        i++;
      }
      blocos.push({ tipo: "bullets", itens });
      continue;
    }

    // Uma linha inteiramente em negrito (ex.: "**Resumo do dia**") seguida
    // de 2+ linhas curtas do tipo "rótulo: valor" vira uma caixa de
    // estatísticas; se não tiver seguidoras assim, vira só um destaque.
    const ehNegritoTotal = /^\*\*[^*]+\*\*:?$/.test(linha);
    if (ehNegritoTotal) {
      const titulo = linha.replace(/\*\*/g, "").replace(/:$/, "");
      const seguintes: string[] = [];
      let j = i + 1;
      while (
        j < linhas.length &&
        linhas[j] &&
        linhas[j].includes(":") &&
        !linhas[j].startsWith("#") &&
        !linhas[j].startsWith("-") &&
        linhas[j].length < 90
      ) {
        seguintes.push(linhas[j]);
        j++;
      }
      if (seguintes.length >= 2) {
        blocos.push({ tipo: "statbox", titulo, itens: seguintes });
        i = j;
        continue;
      }
      blocos.push({ tipo: "destaque", texto: titulo });
      i++;
      continue;
    }

    // Parágrafo normal: junta linhas seguidas até uma linha vazia/heading/bullet/hr.
    let texto = linha;
    i++;
    while (i < linhas.length && linhas[i] && !linhas[i].startsWith("#") && !linhas[i].startsWith("-") && linhas[i] !== "---") {
      texto += " " + linhas[i];
      i++;
    }
    blocos.push({ tipo: "paragrafo", texto });
  }

  return blocos;
}

function segmentosComNegrito(texto: string): { texto: string; negrito: boolean }[] {
  return texto
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((parte) =>
      parte.startsWith("**") && parte.endsWith("**")
        ? { texto: parte.slice(2, -2), negrito: true }
        : { texto: parte, negrito: false }
    );
}

// ---------------------------------------------------------------------------
// Ícones vetoriais simples (sem emojis, sem imagens externas).
// ---------------------------------------------------------------------------

function corRGB(doc: jsPDF, cor: { r: number; g: number; b: number }, tipo: "fill" | "draw") {
  if (tipo === "fill") doc.setFillColor(cor.r, cor.g, cor.b);
  else doc.setDrawColor(cor.r, cor.g, cor.b);
}

// Prato com talheres estilizados — usado no cabeçalho.
function desenharIconePrato(doc: jsPDF, cx: number, cy: number, raio: number) {
  corRGB(doc, { r: 255, g: 255, b: 255 }, "fill");
  doc.circle(cx, cy, raio, "F");
  corRGB(doc, VERDE, "fill");
  doc.circle(cx, cy, raio * 0.62, "F");
  corRGB(doc, { r: 255, g: 255, b: 255 }, "draw");
  doc.setLineWidth(0.35);
  // garfo (3 dentes curtos) à esquerda do prato
  for (const dx of [-0.9, 0, 0.9]) {
    doc.line(cx - raio - 2.4 + dx * 0.4, cy - raio * 0.7, cx - raio - 2.4 + dx * 0.4, cy - raio * 0.05);
  }
  doc.line(cx - raio - 2.2, cy - raio * 0.05, cx - raio - 2.2, cy + raio * 0.7);
  // faca à direita do prato
  doc.line(cx + raio + 2.2, cy - raio * 0.7, cx + raio + 2.2, cy + raio * 0.7);
}

// Alvo (círculos concêntricos) — usado antes do tipo de metabolismo.
function desenharIconeAlvo(doc: jsPDF, cx: number, cy: number, raio: number) {
  corRGB(doc, VERDE, "fill");
  doc.circle(cx, cy, raio, "F");
  corRGB(doc, { r: 255, g: 255, b: 255 }, "fill");
  doc.circle(cx, cy, raio * 0.62, "F");
  corRGB(doc, VERDE, "fill");
  doc.circle(cx, cy, raio * 0.26, "F");
}

// Visto (check) — usado antes de "chaves científicas"/pontos-chave.
function desenharIconeVisto(doc: jsPDF, cx: number, cy: number, tamanho: number) {
  corRGB(doc, VERDE, "fill");
  doc.circle(cx, cy, tamanho, "F");
  corRGB(doc, { r: 255, g: 255, b: 255 }, "draw");
  doc.setLineWidth(0.5);
  doc.lines(
    [
      [tamanho * 0.35, tamanho * 0.35],
      [tamanho * 0.75, -tamanho * 0.75],
    ],
    cx - tamanho * 0.45,
    cy
  );
}

// Ícones pequenos e distintos para a caixa de estatísticas (círculo/
// quadrado/triângulo), sem depender de palavras-chave em nenhum idioma.
function desenharIconeStat(doc: jsPDF, indice: number, cx: number, cy: number, tamanho: number) {
  corRGB(doc, VERDE, "fill");
  if (indice % 3 === 0) {
    doc.circle(cx, cy, tamanho, "F");
  } else if (indice % 3 === 1) {
    doc.rect(cx - tamanho, cy - tamanho, tamanho * 2, tamanho * 2, "F");
  } else {
    doc.triangle(cx, cy - tamanho * 1.1, cx - tamanho, cy + tamanho * 0.8, cx + tamanho, cy + tamanho * 0.8, "F");
  }
}

function pontoBala(doc: jsPDF, x: number, y: number) {
  corRGB(doc, VERDE, "fill");
  doc.circle(x, y - 1.1, 0.8, "F");
}

function formatarDataCurtaPdf(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "short" });
}

// jsPDF precisa da largura/altura reais da imagem para a desenhar sem
// distorcer — descobre isso carregando-a no browser antes de a embutir.
function carregarDimensoesImagem(dataUri: string): Promise<{ largura: number; altura: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ largura: img.naturalWidth, altura: img.naturalHeight });
    img.onerror = () => reject(new Error("Não foi possível carregar a foto"));
    img.src = dataUri;
  });
}

// Desenha o gráfico de previsão do objetivo (mesma lógica de
// calcularProjecaoObjetivo usada no gráfico da página web), com os pontos
// do objetivo e do evento sempre bem visíveis — inclusive quando caem perto
// um do outro, caso em que as etiquetas se separam (uma acima, outra
// abaixo) em vez de se sobrepor. Devolve false se não houver meta definida
// (nesse caso nada é desenhado e o chamador não avança o cursor).
function desenharGraficoObjetivo(
  doc: jsPDF,
  x: number,
  yInicio: number,
  largura: number,
  pesoAtualKg: number,
  perfilAvancado: PerfilAvancado | null | undefined,
  locale: string
): boolean {
  const dados = calcularProjecaoObjetivo(pesoAtualKg, perfilAvancado);
  if (!dados) return false;

  const alturaGrafico = 42;
  const yEixoBase = yInicio + alturaGrafico;
  const pesos = dados.pontos.map((p) => p.peso);
  const min = Math.floor(Math.min(...pesos, dados.metaKg) - 1);
  const max = Math.ceil(Math.max(...pesos, dados.metaKg) + 1);

  function xDoIndice(i: number) {
    return x + (i / (dados!.pontos.length - 1)) * largura;
  }
  function yDoPeso(peso: number) {
    return yInicio + ((max - peso) / (max - min || 1)) * alturaGrafico;
  }

  // Grelha horizontal + rótulos do eixo Y (min/meio/max).
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  for (const fracao of [0, 0.5, 1]) {
    const yLinha = yInicio + fracao * alturaGrafico;
    doc.line(x, yLinha, x + largura, yLinha);
    const valor = Math.round(max - fracao * (max - min));
    doc.text(`${valor}kg`, x - 1.5, yLinha + 1, { align: "right" });
  }

  // Linha de peso previsto.
  doc.setDrawColor(VERDE.r, VERDE.g, VERDE.b);
  doc.setLineWidth(0.6);
  for (let i = 0; i < dados.pontos.length - 1; i++) {
    doc.line(xDoIndice(i), yDoPeso(dados.pontos[i].peso), xDoIndice(i + 1), yDoPeso(dados.pontos[i + 1].peso));
  }

  // Rótulos do eixo X (início, meio, fim).
  doc.setTextColor(150, 150, 150);
  doc.text(formatarDataCurtaPdf(dados.pontos[0].data, locale), x, yEixoBase + 4);
  doc.text(
    formatarDataCurtaPdf(dados.pontos[dados.pontos.length - 1].data, locale),
    x + largura,
    yEixoBase + 4,
    { align: "right" }
  );

  // Os dois marcadores (evento perto, objetivo sempre) — se estiverem
  // próximos, separa as etiquetas para nenhuma ficar ilegível.
  const idxEvento = dados.evento ? dados.pontos.findIndex((p) => p.data === dados.evento!.data) : -1;
  const pertoDaMeta = idxEvento >= 0 && dados.pontos.length - 1 - idxEvento <= 2;

  function desenharMarcador(indice: number, peso: number, rotulo: string, corTexto: typeof VERDE, emCima: boolean) {
    const cx = xDoIndice(indice);
    const cy = yDoPeso(peso);
    corRGB(doc, corTexto, "fill");
    doc.circle(cx, cy, 1.3, "F");
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.circle(cx, cy, 1.3, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(corTexto.r, corTexto.g, corTexto.b);
    const textoY = emCima ? cy - 3 : cy + 5.5;
    const alinhamento = indice > dados!.pontos.length * 0.8 ? "right" : indice < dados!.pontos.length * 0.2 ? "left" : "center";
    doc.text(rotulo, cx, textoY, { align: alinhamento as "left" | "right" | "center" });
  }

  // Quando os dois marcadores ficam perto, o evento desce para baixo do
  // ponto e o objetivo fica sempre acima — assim nunca se sobrepõem.
  if (dados.evento) {
    desenharMarcador(idxEvento, dados.evento.peso, `${dados.evento.label} · ${dados.evento.peso}kg`, VERDE, !pertoDaMeta);
  }
  desenharMarcador(dados.pontos.length - 1, dados.metaKg, `Objetivo ${dados.metaKg}kg`, VERDE_ESCURO, true);

  doc.setTextColor(CINZA_TEXTO.r, CINZA_TEXTO.g, CINZA_TEXTO.b);
  return true;
}

// ---------------------------------------------------------------------------
// Geração do PDF.
// ---------------------------------------------------------------------------

export async function gerarPdfDieta(plan: DietPlanRecord, resultadoTexto: string, idioma: IdiomaPdf = "pt-BR") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const t = TEXTOS_POR_IDIOMA[idioma];
  let y = 0;

  function novaPagina() {
    doc.addPage();
    y = MARGEM;
  }

  function quebrarSeNecessario(alturaBloco: number) {
    if (y + alturaBloco > ALTURA_PAGINA - MARGEM) novaPagina();
  }

  // ---- Cabeçalho (banda verde com o nome do cliente e um ícone de prato) ----
  doc.setFillColor(VERDE.r, VERDE.g, VERDE.b);
  doc.rect(0, 0, LARGURA_PAGINA, 28, "F");
  desenharIconePrato(doc, LARGURA_PAGINA - MARGEM - 6, 14, 5);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(t.titulo, MARGEM, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(plan.nome, MARGEM, 21.5);
  doc.setFontSize(8.5);
  doc.text(
    `${t.geradoEm} ${new Date(plan.createdAt).toLocaleDateString(t.locale)}`,
    LARGURA_PAGINA - MARGEM,
    24.5,
    { align: "right" }
  );
  doc.setTextColor(CINZA_TEXTO.r, CINZA_TEXTO.g, CINZA_TEXTO.b);
  y = 38;

  // ---- Gráfico de previsão do objetivo (se houver meta definida) ----
  const desenhouGrafico = desenharGraficoObjetivo(
    doc,
    MARGEM + 8,
    y + 4,
    LARGURA_UTIL - 8,
    plan.peso_kg,
    plan.perfil_avancado,
    t.locale
  );
  if (desenhouGrafico) y += 54;

  // ---- Texto corrido (com negrito inline) que quebra linha e página sozinho ----
  function escreverRico(
    segmentos: { texto: string; negrito: boolean }[],
    { tamanho, x = MARGEM, largura = LARGURA_UTIL, cor = CINZA_TEXTO }: { tamanho: number; x?: number; largura?: number; cor?: typeof CINZA_TEXTO }
  ) {
    doc.setFontSize(tamanho);
    doc.setTextColor(cor.r, cor.g, cor.b);
    const alturaLinha = tamanho * 0.42 + 1.1;
    let cursorX = x;
    quebrarSeNecessario(alturaLinha);

    for (const seg of segmentos) {
      doc.setFont("helvetica", seg.negrito ? "bold" : "normal");
      const palavras = seg.texto.split(/\s+/).filter(Boolean);
      for (const palavra of palavras) {
        const larguraPalavra = doc.getTextWidth(palavra + " ");
        if (cursorX + larguraPalavra > x + largura) {
          cursorX = x;
          y += alturaLinha;
          quebrarSeNecessario(alturaLinha);
        }
        doc.text(palavra, cursorX, y);
        cursorX += larguraPalavra;
      }
    }
    y += alturaLinha + 1.5;
    doc.setTextColor(CINZA_TEXTO.r, CINZA_TEXTO.g, CINZA_TEXTO.b);
  }

  function contarLinhasEnvolvidas(segmentos: { texto: string }[], tamanho: number, largura: number) {
    doc.setFontSize(tamanho);
    const texto = segmentos.map((s) => s.texto).join("");
    return doc.splitTextToSize(texto, largura).length;
  }

  const blocos = tokenizar(resultadoTexto || "");

  for (let idx = 0; idx < blocos.length; idx++) {
    const bloco = blocos[idx];

    if (bloco.tipo === "hr") {
      quebrarSeNecessario(6);
      doc.setDrawColor(VERDE_CLARO.r + 5, 230, 210);
      doc.setLineWidth(0.4);
      doc.line(MARGEM, y, LARGURA_PAGINA - MARGEM, y);
      y += 6;
      continue;
    }

    if (bloco.tipo === "h1") {
      quebrarSeNecessario(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(CINZA_TEXTO.r, CINZA_TEXTO.g, CINZA_TEXTO.b);
      doc.text(bloco.texto, MARGEM, y);
      y += 9;
      continue;
    }

    if (bloco.tipo === "h2") {
      quebrarSeNecessario(14);
      y += 2;
      corRGB(doc, VERDE, "fill");
      doc.rect(MARGEM, y - 4, 1.4, 6, "F");
      desenharIconeAlvo(doc, MARGEM + 6, y - 1.2, 2.4);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(VERDE_ESCURO.r, VERDE_ESCURO.g, VERDE_ESCURO.b);
      doc.text(bloco.texto, MARGEM + 11, y);
      y += 8;
      continue;
    }

    if (bloco.tipo === "h3") {
      quebrarSeNecessario(10);
      y += 1;
      desenharIconeVisto(doc, MARGEM + 1.6, y - 1.2, 1.7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(VERDE.r, VERDE.g, VERDE.b);
      doc.text(bloco.texto, MARGEM + 5.5, y);
      y += 6;
      continue;
    }

    if (bloco.tipo === "destaque") {
      quebrarSeNecessario(9);
      doc.setFillColor(VERDE_CLARO.r, VERDE_CLARO.g, VERDE_CLARO.b);
      const linhasDestaque = doc.splitTextToSize(bloco.texto, LARGURA_UTIL - 6);
      const altura = linhasDestaque.length * 5 + 4;
      doc.roundedRect(MARGEM, y - 4.5, LARGURA_UTIL, altura, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(VERDE_ESCURO.r, VERDE_ESCURO.g, VERDE_ESCURO.b);
      doc.text(linhasDestaque, MARGEM + 3, y);
      y += altura + 2;
      continue;
    }

    if (bloco.tipo === "paragrafo") {
      escreverRico(segmentosComNegrito(bloco.texto), { tamanho: 9.7 });
      continue;
    }

    if (bloco.tipo === "bullets") {
      for (const item of bloco.itens) {
        const segmentos = segmentosComNegrito(item);
        const nLinhas = contarLinhasEnvolvidas(segmentos, 9.7, LARGURA_UTIL - 6);
        quebrarSeNecessario(nLinhas * 5.2 + 1);
        pontoBala(doc, MARGEM + 1.2, y + 1.5);
        escreverRico(segmentos, { tamanho: 9.7, x: MARGEM + 4.5, largura: LARGURA_UTIL - 4.5 });
      }
      continue;
    }

    if (bloco.tipo === "statbox") {
      const alturaCaixa = 8 + bloco.itens.length * 5.5;
      quebrarSeNecessario(alturaCaixa + 2);
      doc.setFillColor(CINZA_CLARO.r, CINZA_CLARO.g, CINZA_CLARO.b);
      doc.roundedRect(MARGEM, y, LARGURA_UTIL, alturaCaixa, 1.5, 1.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(VERDE_ESCURO.r, VERDE_ESCURO.g, VERDE_ESCURO.b);
      doc.text(bloco.titulo, MARGEM + 4, y + 6);

      let linhaY = y + 12;
      bloco.itens.forEach((item, i) => {
        desenharIconeStat(doc, i, MARGEM + 5.5, linhaY - 1.3, 1.5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(CINZA_TEXTO.r, CINZA_TEXTO.g, CINZA_TEXTO.b);
        doc.text(item, MARGEM + 10, linhaY);
        linhaY += 5.5;
      });

      y += alturaCaixa + 4;
      continue;
    }
  }

  // ---- Foto "antes" do cliente, numa página própria no final ----
  if (plan.foto_antes) {
    try {
      const { largura, altura } = await carregarDimensoesImagem(plan.foto_antes);
      novaPagina();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(VERDE_ESCURO.r, VERDE_ESCURO.g, VERDE_ESCURO.b);
      doc.text("Foto antes da dieta", MARGEM, y);
      y += 8;

      const larguraMax = LARGURA_UTIL;
      const alturaMax = ALTURA_PAGINA - MARGEM - y;
      let larguraFinal = larguraMax;
      let alturaFinal = (altura / largura) * larguraFinal;
      if (alturaFinal > alturaMax) {
        alturaFinal = alturaMax;
        larguraFinal = (largura / altura) * alturaFinal;
      }

      const formato = plan.foto_antes.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(plan.foto_antes, formato, MARGEM, y, larguraFinal, alturaFinal);
    } catch {
      // Se a foto não carregar por algum motivo, o PDF continua sem ela
      // em vez de falhar a geração toda.
    }
  }

  return doc;
}
