import nodemailer from "nodemailer";

// Envio de email via SMTP genérico (funciona com Gmail, Outlook, ou
// qualquer serviço transacional — SendGrid, Mailgun, etc. — desde que
// configurado como relay SMTP). Usado só para enviar o PDF da dieta ao
// cliente (tarefas.md #36).
//
// Variáveis de ambiente necessárias no .env do backend:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (opcional,
//   por omissão usa SMTP_USER). Ver .env.example.

export function transportadorConfigurado() {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function criarTransportador() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

interface EnviarPdfParams {
    destinatario: string;
    nomeCliente: string;
    pdfBase64: string; // sem o prefixo "data:application/pdf;base64,"
    nomeArquivo: string;
}

export async function enviarPdfPorEmail({ destinatario, nomeCliente, pdfBase64, nomeArquivo }: EnviarPdfParams) {
    if (!transportadorConfigurado()) {
        throw new Error(
            "Envio de email não configurado no servidor (faltam SMTP_HOST/SMTP_USER/SMTP_PASS no .env do backend)."
        );
    }

    const transportador = criarTransportador();

    await transportador.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: destinatario,
        subject: `Plano alimentar — ${nomeCliente}`,
        text: `Olá, ${nomeCliente}!\n\nSegue em anexo o seu plano alimentar.`,
        html: `<p>Olá, ${nomeCliente}!</p><p>Segue em anexo o seu plano alimentar.</p>`,
        attachments: [
            {
                filename: nomeArquivo,
                content: pdfBase64,
                encoding: "base64",
                contentType: "application/pdf",
            },
        ],
    });
}
