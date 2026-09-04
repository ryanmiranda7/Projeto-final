"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, ChevronDown, ChevronUp, Download, Loader, Lock as LockIcon, Mail, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DietPlanRecord } from "@/types/diet-plan-record.type";
import { API_URL } from "@/lib/api";
import { GoalProjectionChart } from "./goal-projection-chart";
import { InfoCallouts } from "./info-callouts";

const objetivoLabel: Record<DietPlanRecord["objetivo"], string> = {
  perda_de_peso: "Perda de peso",
  hipertrofia: "Hipertrofia",
  manter_massa_muscular: "Manter massa muscular",
};

const statusLabel: Record<DietPlanRecord["status"], string> = {
  gerando: "Gerando...",
  concluido: "Concluído",
  erro: "Erro",
};

const statusClass: Record<DietPlanRecord["status"], string> = {
  gerando: "bg-amber-100 text-amber-700",
  concluido: "bg-green-100 text-green-700",
  erro: "bg-red-100 text-red-700",
};

const IDIOMAS_PDF: { value: "pt-BR" | "pt-PT" | "en" | "es"; label: string }[] = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "pt-PT", label: "Português (Portugal)" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

export function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarDataSemHora(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

interface PlanCardProps {
  plan: DietPlanRecord;
  isExpanded: boolean;
  onToggle: () => void;
  onDeleted: (id: number) => void;
  onUpdated: (plan: DietPlanRecord) => void;
  // null enquanto ainda não se sabe; false = backend sem SMTP configurado.
  // Nesse caso o botão fica desativado com uma explicação, em vez de
  // deixar clicar e só mostrar o erro depois (ver tarefas.md #42).
  emailConfigurado: boolean | null;
}

export function PlanCard({ plan, isExpanded, onToggle, onDeleted, onUpdated, emailConfigurado }: PlanCardProps) {
  const [pedido, setPedido] = useState("");
  const [aplicando, setAplicando] = useState(false);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);
  const [edicaoSucesso, setEdicaoSucesso] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [idiomaPdf, setIdiomaPdf] = useState<(typeof IDIOMAS_PDF)[number]["value"]>("pt-BR");
  const [erroPdf, setErroPdf] = useState<string | null>(null);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [emailEnviado, setEmailEnviado] = useState(false);

  async function aplicarEdicao() {
    if (pedido.trim().length < 3) {
      setErroEdicao("Descreva a alteração que pretende.");
      return;
    }

    setAplicando(true);
    setErroEdicao(null);
    setEdicaoSucesso(false);

    try {
      const response = await fetch(`${API_URL}/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido }),
      });

      if (!response.ok) {
        setErroEdicao("Não foi possível aplicar a alteração. Tente novamente.");
        return;
      }

      const atualizado: DietPlanRecord = await response.json();
      onUpdated(atualizado);
      setPedido("");
      setEdicaoSucesso(true);
    } catch {
      setErroEdicao("Não foi possível aplicar a alteração. O backend está a correr?");
    } finally {
      setAplicando(false);
    }
  }

  async function apagar() {
    if (!window.confirm(`Apagar a dieta de ${plan.nome} gerada em ${formatarData(plan.createdAt)}?`)) {
      return;
    }

    setApagando(true);
    try {
      const response = await fetch(`${API_URL}/plans/${plan.id}`, { method: "DELETE" });
      if (response.ok || response.status === 404) {
        onDeleted(plan.id);
      }
    } catch {
      // silencioso: se a rede falhar, o item simplesmente continua na lista
    } finally {
      setApagando(false);
    }
  }

  // Traduz (se necessário) e gera o PDF no idioma selecionado — usado
  // tanto para baixar quanto para enviar por email, para não duplicar essa
  // lógica nos dois sítios.
  async function gerarDocumento() {
    let texto = plan.resultado ?? "";

    // "pt-BR" é o idioma em que o plano já foi gerado — só traduz para
    // as outras opções, e só para efeitos do PDF (não altera o plano).
    if (idiomaPdf !== "pt-BR") {
      const response = await fetch(`${API_URL}/plans/${plan.id}/traduzir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idioma: idiomaPdf }),
      });
      if (!response.ok) throw new Error("Falha ao traduzir");
      const data: { resultado: string } = await response.json();
      texto = data.resultado;
    }

    const { gerarPdfDieta } = await import("@/lib/diet-pdf");
    const doc = await gerarPdfDieta(plan, texto, idiomaPdf);
    const sufixo = idiomaPdf !== "pt-BR" ? `-${idiomaPdf}` : "";
    const nomeArquivo = `dieta-${plan.nome.replace(/\s+/g, "_")}${sufixo}.pdf`;
    return { doc, nomeArquivo };
  }

  async function baixarPdf() {
    setGerandoPdf(true);
    setErroPdf(null);
    try {
      const { doc, nomeArquivo } = await gerarDocumento();
      doc.save(nomeArquivo);

      // Uma vez baixada, fica protegida contra exclusão PARA SEMPRE — não
      // é um bloqueio só enquanto gerandoPdf está true (ver botão Apagar
      // abaixo). O backend também recusa o DELETE depois disto, não é só
      // o botão escondido aqui.
      const response = await fetch(`${API_URL}/plans/${plan.id}/marcar-protegido`, { method: "POST" });
      if (response.ok) {
        onUpdated(await response.json());
      }
    } catch {
      setErroPdf("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setGerandoPdf(false);
    }
  }

  async function enviarEmail() {
    setEnviandoEmail(true);
    setErroEmail(null);
    setEmailEnviado(false);
    try {
      const { doc, nomeArquivo } = await gerarDocumento();
      const dataUri = doc.output("datauristring");
      const pdfBase64 = dataUri.slice(dataUri.indexOf("base64,") + "base64,".length);

      const response = await fetch(`${API_URL}/plans/${plan.id}/enviar-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64, nomeArquivo }),
      });

      if (!response.ok) {
        const corpo = await response.json().catch(() => null);
        throw new Error(corpo?.details || "Falha ao enviar");
      }

      const corpo: { plan: DietPlanRecord } = await response.json();
      onUpdated(corpo.plan);
      setEmailEnviado(true);
    } catch (err) {
      setErroEmail(err instanceof Error ? err.message : "Não foi possível enviar o email. Tente novamente.");
    } finally {
      setEnviandoEmail(false);
    }
  }

  return (
    <Card className="border-0 shadow-lg p-4 md:p-5">
      <button
        className="w-full flex items-center justify-between gap-4 cursor-pointer text-left"
        onClick={onToggle}
      >
        <div>
          <p className="font-semibold text-gray-900">{plan.nome}</p>
          {/* Data da última geração (updatedAt: uma edição atualiza esta
              data) numa linha, hora numa linha própria por baixo — mais
              fácil de ler do que tudo espremido numa linha só. */}
          <p className="text-sm text-gray-500">
            {objetivoLabel[plan.objetivo]} · {formatarDataSemHora(plan.updatedAt)}
          </p>
          <p className="text-xs text-gray-400">às {formatarHora(plan.updatedAt)}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* "Concluído" já é o estado normal/esperado — só vale a pena
              destacar os estados excecionais (a gerar / erro). */}
          {plan.status !== "concluido" && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusClass[plan.status]}`}>
              {statusLabel[plan.status]}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {plan.status === "concluido" && plan.perfil_avancado && (
            <div className="bg-card rounded-lg p-4 border border-border">
              <p className="text-sm font-semibold text-gray-900 mb-2">Previsão da data do objetivo</p>
              <GoalProjectionChart pesoAtualKg={plan.peso_kg} perfilAvancado={plan.perfil_avancado} />
            </div>
          )}

          <div className="bg-card rounded-lg p-5 border border-border max-h-[420px] overflow-y-auto">
            {plan.resultado ? (
              <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-li:my-0.5">
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 className="text-xl font-bold text-zinc-900 mb-2" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 className="text-lg font-bold text-green-700 mt-5 mb-1 first:mt-0" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="text-sm font-semibold text-green-600 mt-3 mb-1" {...props} />
                    ),
                    hr: ({ node, ...props }) => <hr className="my-4 border-green-100" {...props} />,
                    strong: ({ node, ...props }) => (
                      <strong className="font-semibold text-zinc-900" {...props} />
                    ),
                  }}
                >
                  {plan.resultado}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sem resultado salvo para esta geração.</p>
            )}
          </div>

          {plan.status === "concluido" && <InfoCallouts />}

          {plan.status === "concluido" && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={idiomaPdf}
                onChange={(e) => setIdiomaPdf(e.target.value as (typeof IDIOMAS_PDF)[number]["value"])}
                disabled={gerandoPdf}
                className="text-sm border border-border rounded-md px-2 py-1.5 bg-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Idioma do PDF"
              >
                {IDIOMAS_PDF.map((idioma) => (
                  <option key={idioma.value} value={idioma.value}>
                    {idioma.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer gap-1.5"
                onClick={baixarPdf}
                disabled={gerandoPdf}
              >
                {gerandoPdf ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {gerandoPdf && idiomaPdf !== "pt-BR" ? "A traduzir..." : "Baixar PDF"}
              </Button>
              {plan.email && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer gap-1.5 disabled:cursor-not-allowed"
                  onClick={enviarEmail}
                  disabled={enviandoEmail || emailConfigurado === false}
                  title={
                    emailConfigurado === false
                      ? "Envio de email por configurar no servidor (SMTP_HOST/SMTP_USER/SMTP_PASS no .env do backend)"
                      : `Enviar para ${plan.email}`
                  }
                >
                  {enviandoEmail ? (
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                  ) : emailEnviado ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                  {enviandoEmail ? "A enviar..." : emailEnviado ? "Enviado!" : "Enviar por email"}
                </Button>
              )}
              {plan.email && emailConfigurado === false && (
                <p className="text-xs text-amber-600 basis-full">
                  Envio de email ainda não configurado no servidor (passe o rato sobre o botão acima para ver o que falta).
                </p>
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="cursor-pointer gap-1.5"
                onClick={apagar}
                // Bloqueado enquanto o PDF está a ser gerado/enviado (para
                // não apagar a meio desses processos) e PARA SEMPRE depois
                // de a dieta já ter sido baixada ou enviada por email — o
                // backend também recusa o DELETE nesse caso, não é só o
                // botão escondido aqui.
                disabled={apagando || gerandoPdf || enviandoEmail || plan.protegido_contra_exclusao}
                title={
                  plan.protegido_contra_exclusao
                    ? "Esta dieta já foi baixada ou enviada por email e não pode ser apagada"
                    : gerandoPdf || enviandoEmail
                    ? "Aguarde o PDF terminar para apagar"
                    : undefined
                }
              >
                {apagando ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : plan.protegido_contra_exclusao ? (
                  <LockIcon className="w-3.5 h-3.5" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Apagar
              </Button>
              {erroPdf && <p className="text-xs text-red-600 basis-full">{erroPdf}</p>}
              {erroEmail && <p className="text-xs text-red-600 basis-full">{erroEmail}</p>}
            </div>
          )}

          {plan.status === "concluido" && (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Editar dieta
              </p>
              <p className="text-xs text-gray-400 mb-2">
                Descreva a alteração que pretende (ex: &ldquo;troca o frango do dia 3 por peixe&rdquo;) e a IA
                atualiza o plano mantendo o resto igual.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={pedido}
                  onChange={(e) => {
                    setPedido(e.target.value);
                    setEdicaoSucesso(false);
                  }}
                  placeholder='Ex: "troca o frango do dia 3 por peixe"'
                  className="flex-1 h-9 rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
                  disabled={aplicando}
                />
                <Button
                  type="button"
                  size="sm"
                  className="cursor-pointer shrink-0"
                  onClick={aplicarEdicao}
                  disabled={aplicando}
                >
                  {aplicando ? <Loader className="w-3.5 h-3.5 animate-spin" /> : "Aplicar alteração"}
                </Button>
              </div>
              {erroEdicao && <p className="text-sm text-red-500 mt-2">{erroEdicao}</p>}
              {edicaoSucesso && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Dieta editada com sucesso!
                </p>
              )}
              {plan.historico_edicoes && plan.historico_edicoes.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  {plan.historico_edicoes.length} alteração(ões) já aplicada(s) a este plano.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
