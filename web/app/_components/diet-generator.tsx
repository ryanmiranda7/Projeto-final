"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DietData } from "@/types/diet-data.type";
import { ClipboardCheck, Loader, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown"
import { API_URL } from "@/lib/api"

export function DietGenerator({data}: { data: DietData }) {
    const router = useRouter();
    const [output, setOutput] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [planoId, setPlanoId] = useState<string | null>(null)

    const controllerRef = useRef<AbortController | null>(null)

    async function startStreaming() {
        const controller = new AbortController();
        controllerRef.current = controller

        setOutput("")
        setError(null)
        setPlanoId(null)
        setIsStreaming(true);

        try{

            const response = await fetch(`${API_URL}/plan`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nome: data.nome,
                    // "" (campo não preenchido) vira undefined — ver
                    // schema.ts para o motivo de não fazer isto no zod.
                    email: data.email?.trim() || undefined,
                    idade: data.idade,
                    altura_cm: data.altura_cm,
                    peso_kg: data.peso_kg,
                    sexo: data.sexo,
                    nivel_atividade: data.nivel_atividade,
                    objetivo: data.objetivo,
                    calorias_gasto_diario: data.calorias_gasto_diario,
                    deficit_calorico: data.deficit_calorico,
                    superavit_calorico: data.superavit_calorico,
                    perfil_avancado: data.perfil_avancado,
                    foto_antes: data.foto_antes

                }),

                //PERMITE CANCELAR A REQ A QUALQUER MOMENTO
                signal: controller.signal
            })

            if (!response.ok) {
                let mensagem = "Não foi possível gerar a dieta. Tente novamente.";
                try {
                    const corpo = await response.json();
                    if (response.status >= 500) {
                        mensagem = "Ocorreu um erro no servidor ao gerar a dieta. Tente novamente dentro de instantes.";
                    } else if (corpo?.details) {
                        mensagem = "Verifique os dados introduzidos e tente novamente.";
                    }
                } catch {
                    // corpo não era JSON válido; mantém a mensagem genérica
                }
                setError(mensagem);
                return;
            }

            setPlanoId(response.headers.get("X-Plan-Id"));

            const reader = response.body?.getReader()
            const decoder = new TextDecoder("utf-8")

            while(true){
                const { done, value } = await reader!.read()
                if(done) break;

                setOutput(prev => prev + decoder.decode(value))
            }

        }catch(err: any){
            if(err.name === "AbortError") {
                console.log("Request Cancelada")
            return;
            }

            console.log(err);
            setError("Não foi possível gerar a dieta. O backend está a correr?");
        }finally{
            setIsStreaming(false);
            controllerRef.current = null
        }
    }

    async function handleGenerate() {
        if(isStreaming){
            controllerRef.current?.abort()
            setIsStreaming(false)
            return
        }

        await startStreaming();
    }


    return(
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-4xl border-0 shadow-lg p-4 md:p-6">

                <div className="flex justify-center gap-3">
                    <Button className="cursor-pointer gap-2"
                    size="lg"
                    onClick={handleGenerate}>
                        {isStreaming ? <Loader className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        {isStreaming ? "Parar dieta" : "Gerar dieta"}
                    </Button>

                    {/* Só aparece depois de terminar a geração com sucesso —
                        leva diretamente a esta dieta já expandida no histórico. */}
                    {!isStreaming && !error && planoId && (
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer gap-2"
                            size="lg"
                            onClick={() =>
                                router.push(`/historico?cliente=${encodeURIComponent(data.nome)}&plano=${planoId}`)
                            }
                        >
                            <ClipboardCheck className="w-4 h-4" />
                            Plano completo
                        </Button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm rounded-lg p-4 border border-red-100 mt-6">
                        {error}
                    </div>
                )}

                {output && (
                    <div className="bg-card rounded-lg p-6 border border-border max-h-[500px] overflow-y-auto mt-6">
                        <div className="prose prose-sm max-w-none">
                            <ReactMarkdown
                            components={{
                                h2: ({ node, ...props }) => (
                                <h2
                                    className="text-xl font-bold text-green-600 my-1"
                                    {...props}
                                />
                                ),
                                h1: ({ node, ...props }) => (
                                <h1
                                    className="text-2xl font-bold text-zinc-900 mb-1"
                                    {...props}
                                />
                                ),
                            }}
                            >
                            {output}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}

            </Card>
        </div>
  )
}