-- CreateTable
CREATE TABLE "diet_plans" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "idade" INTEGER NOT NULL,
    "altura_cm" DOUBLE PRECISION NOT NULL,
    "peso_kg" DOUBLE PRECISION NOT NULL,
    "sexo" TEXT NOT NULL,
    "nivel_atividade" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "resultado" TEXT,
    "status" TEXT NOT NULL DEFAULT 'gerando',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diet_plans_pkey" PRIMARY KEY ("id")
);
