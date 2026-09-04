import { Brain, HeartPulse, Utensils } from "lucide-react";

// Blocos informativos de copy fixa (não gerados pela IA, para garantir que
// o texto e o tom ficam sempre corretos), equivalentes aos ecrãs "Boas
// notícias" e "Strongr Fastr = Mais saudável, mais feliz" das capturas de
// referência.
export function InfoCallouts() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-green-100 bg-green-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Utensils className="w-4 h-4 text-green-600" />
          <p className="font-semibold text-green-800">
            Boas notícias! Você ainda pode comer os seus alimentos favoritos
          </p>
        </div>
        <p className="text-sm text-green-900/80">
          Comer alimentos de que gosta é fundamental para o sucesso do plano a longo prazo. Este
          plano alimentar foi desenhado para atingir os seus macros com a flexibilidade necessária
          para o manter de forma consistente.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="font-semibold text-gray-900 mb-3">Mais saudável, mais feliz</p>
        <div className="space-y-3">
          <div className="flex gap-3">
            <HeartPulse className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Redução do risco de mortalidade: </span>
              aumentar a força e a massa muscular está associado a uma redução significativa da
              mortalidade por todas as causas, em comparação com um estilo de vida sedentário.
            </p>
          </div>
          <div className="flex gap-3">
            <Brain className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Melhora da saúde mental: </span>
              estudos mostram que o treino de força é tão ou mais eficaz do que a medicação na
              melhoria de sintomas depressivos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
