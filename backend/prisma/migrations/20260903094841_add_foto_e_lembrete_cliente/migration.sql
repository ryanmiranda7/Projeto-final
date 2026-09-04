-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "foto_antes" TEXT,
ADD COLUMN     "lembrete_contato_data" TIMESTAMP(3),
ADD COLUMN     "lembrete_contato_feito_em" TIMESTAMP(3);
