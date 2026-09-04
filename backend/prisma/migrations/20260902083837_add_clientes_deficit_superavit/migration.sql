/*
  Warnings:

  - You are about to drop the column `altura_cm` on the `diet_plans` table. All the data in the column will be lost.
  - You are about to drop the column `idade` on the `diet_plans` table. All the data in the column will be lost.
  - You are about to drop the column `nivel_atividade` on the `diet_plans` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `diet_plans` table. All the data in the column will be lost.
  - You are about to drop the column `peso_kg` on the `diet_plans` table. All the data in the column will be lost.
  - You are about to drop the column `sexo` on the `diet_plans` table. All the data in the column will be lost.
  - Added the required column `clienteId` to the `diet_plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "diet_plans" DROP COLUMN "altura_cm",
DROP COLUMN "idade",
DROP COLUMN "nivel_atividade",
DROP COLUMN "nome",
DROP COLUMN "peso_kg",
DROP COLUMN "sexo",
ADD COLUMN     "clienteId" INTEGER NOT NULL,
ADD COLUMN     "deficit_calorico" INTEGER,
ADD COLUMN     "superavit_calorico" INTEGER;

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "idade" INTEGER NOT NULL,
    "altura_cm" DOUBLE PRECISION NOT NULL,
    "peso_kg" DOUBLE PRECISION NOT NULL,
    "sexo" TEXT NOT NULL,
    "nivel_atividade" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_nome_key" ON "clientes"("nome");

-- AddForeignKey
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
