"use client";
import { useState } from "react"; 
import Link from "next/link";
import { History, Users } from "lucide-react";
import { DietForm } from "./_components/diet-form";
import { DietGenerator } from "./_components/diet-generator";
import { LembretesBox } from "./_components/lembretes-box";
import { DietData } from "@/types/diet-data.type";


export default function Home() {
  const [data, setData] = useState<DietData | null>(null)


  function handleSubmit(useInfo: DietData) {
    setData(useInfo)
  }

  return (
      <>
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm"
        >
          <Users className="w-4 h-4" />
          Clientes
        </Link>
        <Link
          href="/historico"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm"
        >
          <History className="w-4 h-4" />
          Histórico
        </Link>
      </div>

      {!data ?(
        <DietForm onSubmit={handleSubmit} />
      ) : (
        <DietGenerator data={data} />
      )}

      <LembretesBox />
    </>
  );
}
