"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { API_URL } from "@/lib/api";
import { lembreteEfetivo, lembretePendente, type ClienteComLembrete } from "@/lib/lembretes";

interface ClienteParaLembrete extends ClienteComLembrete {
  id: number;
  nome: string;
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Caixa de mensagens no canto superior esquerdo só com uma função: lembrar
// o nutricionista de contactar o cliente a meio do caminho até ao objetivo
// (ou na data que ele próprio definiu manualmente na aba de clientes) — ver
// tarefa 26. Começa recolhida (só um sino com contador) e só expande a
// lista ao clicar — nesse canto, uma caixa sempre aberta tapava as
// primeiras perguntas do formulário (ver tarefas.md #32).
export function LembretesBox() {
  const [clientes, setClientes] = useState<ClienteParaLembrete[] | null>(null);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/clientes`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setClientes)
      .catch(() => setClientes([]));
  }, []);

  async function marcarContactado(clienteId: number) {
    await fetch(`${API_URL}/clientes/${clienteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lembrete_contato_feito_em: new Date().toISOString() }),
    });
    setClientes((atual) => atual?.filter((c) => c.id !== clienteId) ?? null);
  }

  if (!clientes) return null;

  const agora = new Date();
  const pendentes = clientes.filter((c) => lembretePendente(c, agora));
  if (pendentes.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 z-20">
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className="flex items-center gap-1.5 bg-white text-amber-800 text-sm font-semibold pl-3 pr-2.5 py-1.5 rounded-full shadow-md border border-amber-200 cursor-pointer hover:bg-amber-50"
      >
        <Bell className="w-4 h-4" />
        {pendentes.length}
      </button>

      {expandido && (
        <div className="mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-amber-200 overflow-hidden">
          <div className="flex items-center justify-between gap-2 bg-amber-50 px-4 py-2.5">
            <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-sm">
              <Bell className="w-4 h-4" />
              Lembretes de contacto
            </div>
            <button
              type="button"
              aria-label="Fechar"
              className="text-amber-700 hover:text-amber-900 cursor-pointer"
              onClick={() => setExpandido(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto divide-y divide-border">
            {pendentes.map((cliente) => (
              <li key={cliente.id} className="px-4 py-2.5 flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <Link href={`/historico?cliente=${encodeURIComponent(cliente.nome)}`} className="font-medium text-gray-900 hover:underline truncate block">
                    {cliente.nome}
                  </Link>
                  <p className="text-xs text-gray-500">
                    Contactar desde {formatarData(lembreteEfetivo(cliente)!)}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-green-600 font-medium cursor-pointer shrink-0"
                  onClick={() => marcarContactado(cliente.id)}
                >
                  Já contactei
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
