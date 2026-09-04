"use client";

import { useState } from "react";
import { Card } from '@/components/ui/card'
import { Sparkles, Utensils } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { dietWizardSchema, type DietWizardFormData } from './wizard/schema';
import { Wizard } from './wizard/Wizard';

interface DietFormProps {
    onSubmit: (data: DietWizardFormData) => void
}

// Campos do ecrã inicial (dados pessoais + atividade/objetivo). O resto das
// respostas (secções Objetivos, Análise metabólica, Metas de
// macronutrientes e Personalização) é recolhido pelo wizard passo-a-passo
// em ./wizard, dirigido por ./wizard/step-config.ts.
const CAMPOS_ECRA_INICIAL = [
    "nome",
    "email",
    "idade",
    "altura_cm",
    "peso_kg",
    "sexo",
    "nivel_atividade",
    "objetivo",
] as const;

export function DietForm({onSubmit}: DietFormProps){
    const [fase, setFase] = useState<"inicial" | "wizard">("inicial");
    const [carregandoFoto, setCarregandoFoto] = useState(false);

    const form = useForm<DietWizardFormData>({
        resolver: zodResolver(dietWizardSchema),
        defaultValues: {
            nome: "",
            email: undefined,
            idade: undefined,
            altura_cm: undefined,
            peso_kg: undefined,
            sexo: undefined,
            nivel_atividade: undefined,
            objetivo: undefined,
            calorias_gasto_diario: undefined,
            deficit_calorico: undefined,
            superavit_calorico: undefined,
            foto_antes: undefined,
            perfil_avancado: {
                motivo_principal: undefined,
                motivo_principal_outro: undefined,
                gordura_corporal_atual: undefined,
                meta_gordura_corporal: undefined,
                peso_meta_kg: undefined,
                evento_especial: undefined,
                data_evento: undefined,
                perfil_ganho_muscular: undefined,
                perfil_ganho_muscular_outro: undefined,
                sintomas_testosterona_baixa: [],
                nivel_estresse: undefined,
                ritmo_preferido: undefined,
                dieta_especial: undefined,
                alergias: [],
                tentacoes: [],
                orcamento_semanal: undefined,
                conforto_cozinha: undefined,
                prioridade_tempo_variedade: undefined,
                sensacao_entre_refeicoes: [],
                sensacao_entre_refeicoes_outro: undefined,
                riscos_saude: [],
                riscos_saude_outro: undefined,
                ingestao_proteina: undefined,
                alimentos_excluidos: [],
                almoco_tipico: undefined,
                almoco_tipico_outro: undefined,
                jejum_intermitente: undefined,
                primeira_refeicao: undefined,
                ultima_refeicao: undefined,
                refeicoes_dia: [],
                dia_inicio_plano: undefined,
                comer_mais_fds: undefined,
                refeicoes_fora_delivery: { almoco: [], jantar: [] },
            },
        },
    })

    async function handleContinuar() {
        const valido = await form.trigger([...CAMPOS_ECRA_INICIAL]);
        if (valido) setFase("wizard");
    }

    if (fase === "wizard") {
        return (
            <Wizard
                form={form}
                onVoltarInicio={() => setFase("inicial")}
                onConcluir={form.handleSubmit(onSubmit)}
            />
        );
    }

    return(
        <div className='min-h-screen flex items-center justify-center p-4'>
            <Card className='w-full max-w-2xl border-0 shadow-lg'>
                <div className='p-8'>
                    <div className='text-center mb-8'>
                        <div className='flex items-center justify-center mb-4 mx-auto'>
                            <Utensils className='w-14 h-14 text-green-500' />
                        </div>
                        <h1 className='text-3xl font-bold text-green-500 mb-2'>Gerador de Dietas</h1>
                        <p className='text-gray-500 text-sm'>Preencha os dados para gerar uma dieta</p>
                    </div>

                <Form {...form}>
                    <form onSubmit={(e) => { e.preventDefault(); handleContinuar(); }} className='space-y-6'>

                        {/* SEÇÃO DADOS PESSOAIS */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-900'>
                                Dados Pessoais
                            </h3>

                            {/* CAMPOS NOME E IDADE */}
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <FormField
                                 control={form.control}
                                 name="nome"
                                 render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome</FormLabel>
                                        <FormControl>
                                            <Input
                                              {...field}
                                              placeholder='Digite seu nome...'
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                 )}
                                 />

                                <FormField
                                 control={form.control}
                                 name="idade"
                                 render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Idade</FormLabel>
                                        <FormControl>
                                            <Input
                                            type='number'
                                            step="any"
                                              {...form.register("idade", {
                                                setValueAs: (v) => v === ""? undefined : Number (v),
                                              })}
                                              placeholder='Ex: 25'
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                 )}
                                 />
                            </div>

                            {/* EMAIL (opcional) — diferencia clientes com o mesmo nome e é o
                                destino do "enviar por email" do PDF no histórico. */}
                            <FormField
                             control={form.control}
                             name="email"
                             render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                          {...field}
                                          value={field.value ?? ""}
                                          type='email'
                                          required
                                          placeholder='cliente@exemplo.com'
                                        />
                                    </FormControl>
                                    <p className='text-xs text-gray-400'>
                                        Diferencia clientes com o mesmo nome e permite enviar o PDF da dieta por email depois.
                                    </p>
                                    <FormMessage />
                                </FormItem>
                             )}
                             />

                            {/* CAMPOS ALTURA, PESO E SEXO */}
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <FormField
                                 control={form.control}
                                 name="altura_cm"
                                 render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Altura (cm)</FormLabel>
                                        <FormControl>
                                            <Input
                                            type='number'
                                            step="any"
                                              {...form.register("altura_cm", {
                                                setValueAs: (v) => v === ""? undefined : Number (v),
                                              })}
                                              placeholder='Ex: 1.80'
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                 )}
                                 />

                                <FormField
                                 control={form.control}
                                 name="peso_kg"
                                 render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Peso (kg)</FormLabel>
                                        <FormControl>
                                            <Input
                                            type='number'
                                            step="any"
                                              {...form.register("peso_kg", {
                                                setValueAs: (v) => v === ""? undefined : parseFloat(v),
                                              })}
                                              placeholder='Ex: 75'
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                 )}
                                />

                                <FormField
                                 control={form.control}
                                 name="sexo"
                                 render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sexo</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ?? ""}>
                                            <FormControl>
                                                <SelectTrigger className='w-full'>
                                                    <SelectValue placeholder="Selecione o sexo" />
                                                </SelectTrigger>
                                            </FormControl>

                                            <SelectContent>
                                                <SelectItem value="masculino">Masculino</SelectItem>
                                                <SelectItem value="feminino">Feminino</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                 )}
                                 />
                            </div>

                            <FormField
                             control={form.control}
                             name="foto_antes"
                             render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Foto atual (opcional)</FormLabel>
                                    <FormControl>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            disabled={carregandoFoto}
                                            className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-input file:bg-white file:text-sm file:cursor-pointer cursor-pointer disabled:opacity-60"
                                            onChange={async (e) => {
                                                const arquivo = e.target.files?.[0];
                                                if (!arquivo) return;
                                                setCarregandoFoto(true);
                                                try {
                                                    const { redimensionarParaBase64 } = await import("@/lib/image");
                                                    field.onChange(await redimensionarParaBase64(arquivo));
                                                } finally {
                                                    setCarregandoFoto(false);
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    <p className='text-xs text-gray-400'>
                                        Guardada como referência &ldquo;antes&rdquo; para comparar com o resultado no futuro. Só é guardada na primeira dieta gerada para este cliente.
                                    </p>
                                    {field.value && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={field.value}
                                            alt="Pré-visualização da foto atual"
                                            className='mt-1 h-20 w-20 rounded-md object-cover border border-border'
                                        />
                                    )}
                                    <FormMessage />
                                </FormItem>
                             )}
                             />
                        </div>

                        {/* SEÇÃO ATIVIDADE E OBJETIVOS */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-900'>
                                Atividade e Objetivos
                            </h3>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <FormField
                                 control={form.control}
                                 name="nivel_atividade"
                                 render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nível de Atividade</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ?? ""}>
                                            <FormControl>
                                                <SelectTrigger className='w-full'>
                                                    <SelectValue placeholder="Selecione o nível de atividade" />
                                                </SelectTrigger>
                                            </FormControl>

                                            <SelectContent>
                                                <SelectItem value="sedentario">Sedentário</SelectItem>
                                                <SelectItem value="levemente_ativo">Levemente ativo</SelectItem>
                                                <SelectItem value="2x_semana">2x por semana</SelectItem>
                                                <SelectItem value="4x_semana">4x por semana</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                 )}
                                 />

                                <FormField
                                 control={form.control}
                                 name="objetivo"
                                 render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Objetivo</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ?? ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger className='w-full'>
                                                    <SelectValue placeholder="Selecione o seu objetivo" />
                                                </SelectTrigger>
                                            </FormControl>

                                            <SelectContent>
                                                <SelectItem value="perda_de_peso">Perda de peso</SelectItem>
                                                <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                                                <SelectItem value="manter_massa_muscular">Manter massa muscular</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                 )}
                                 />
                            </div>

                            {/* CAMPO OPCIONAL: GASTO CALÓRICO DIÁRIO */}
                            <FormField
                             control={form.control}
                             name="calorias_gasto_diario"
                             render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Calorias que gasta por dia (opcional)</FormLabel>
                                    <FormControl>
                                        <Input
                                        type='number'
                                        step="any"
                                          {...form.register("calorias_gasto_diario", {
                                            setValueAs: (v) => v === "" ? undefined : Number(v),
                                          })}
                                          placeholder='Ex: 2200 — deixe em branco se não souber'
                                        />
                                    </FormControl>
                                    <p className='text-xs text-gray-400'>
                                        Se souber, indique o seu gasto calórico diário (TDEE) para uma dieta mais ajustada. Se não souber, pode deixar em branco.
                                    </p>
                                    <FormMessage />
                                </FormItem>
                             )}
                             />

                            {/* CAMPOS OPCIONAIS: DÉFICE / SUPERÁVIT CALÓRICO */}
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <FormField
                                 control={form.control}
                                 name="deficit_calorico"
                                 render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Défice calórico desejado (opcional)</FormLabel>
                                        <FormControl>
                                            <Input
                                            type='number'
                                            step="any"
                                              {...form.register("deficit_calorico", {
                                                setValueAs: (v) => v === "" ? undefined : Number(v),
                                              })}
                                              placeholder='Ex: 300 kcal abaixo do gasto'
                                            />
                                        </FormControl>
                                        <p className='text-xs text-gray-400'>
                                            Para perda de peso. Deixe em branco se não tiver um valor em mente.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                 )}
                                 />

                                <FormField
                                 control={form.control}
                                 name="superavit_calorico"
                                 render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Superávit calórico desejado (opcional)</FormLabel>
                                        <FormControl>
                                            <Input
                                            type='number'
                                            step="any"
                                              {...form.register("superavit_calorico", {
                                                setValueAs: (v) => v === "" ? undefined : Number(v),
                                              })}
                                              placeholder='Ex: 300 kcal acima do gasto'
                                            />
                                        </FormControl>
                                        <p className='text-xs text-gray-400'>
                                            Para hipertrofia. Deixe em branco se não tiver um valor em mente.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                 )}
                                 />
                            </div>
                        </div>

                        <Button type="submit" className='w-full mt-2 hover:opacity-90 cursor-pointer gap-2'>
                            <Sparkles className='w-4 h-4' />
                            Continuar
                        </Button>

                    </form>
                </Form>

                </div>
            </Card>
        </div>
    )
}
