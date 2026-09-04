-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

