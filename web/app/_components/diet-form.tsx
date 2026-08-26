"use client";

import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Sparkles, Utensils } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const dietSchema = z.object({
    nome: z.string().min(2, "O nome é obrigatório"),
    idade: z.number().int().positive(),
    altura_cm: z.number().positive(),
    peso_kg: z.number().positive(),
    sexo: z.enum(["masculino", "feminino"], {error: "Selecione o sexo"}),
    nivel_atividade: z.enum(["sedentario", "2x_semana", "4x_semana"], {error: "Selecione o nível de atividade"}),
    objetivo: z.enum(["perda_de_peso", "hipertrofia", "manter_massa_muscular"], {error: "Selecione seu objetivo"}),
})

type DietSchemaFormData = z.infer<typeof dietSchema>;

interface DietFormProps {
    onSubmit: (data: DietSchemaFormData) => void
}

export function DietForm({onSubmit}: DietFormProps){

    const form = useForm<DietSchemaFormData>({
        resolver: zodResolver(dietSchema),
        defaultValues: {
            nome: "",
            idade: undefined,
            altura_cm: undefined,
            peso_kg: undefined,
            sexo: "" as any,
            nivel_atividade: "" as any,
            objetivo: "" as any,
        },
    })

    return(
        <div className='min-h-screen flex items-center justify-center p-4'>
            <Card className='w-full max-w-2xl border-0 shadow-lg'>
                <div className='p-8'>
                    <div className='text-center mb-8'>
                        <div className='flex items-center justify-center mb-4 mx-auto'>
                            <Utensils className='w-14 h-14 text-green-500' />
                        </div>
                        <h1 className='text-3xl font-bold text-green-500 mb-2'>Gerador de Dietas</h1>
                        <p className='text-gray-500 text-sm'>Preencha seus dados para gerar uma dieta personalizada</p>
                    </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>

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
                                            value={field.value}>
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
                                            value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className='w-full'>
                                                    <SelectValue placeholder="Selecione o nível de atividade" />
                                                </SelectTrigger>
                                            </FormControl>

                                            <SelectContent>
                                                <SelectItem value="sedentario">Sedentário</SelectItem>
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
                                            value={field.value}
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
                        </div>

                        <Button type="submit" className='w-full mt-2 hover:opacity-90 cursor-pointer gap-2'>
                            <Sparkles className='w-4 h-4' />
                            Gerar Minha Dieta Personalizada
                        </Button>

                    </form>
                </Form>

                </div>
            </Card>
        </div>
    )
}