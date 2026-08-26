# Banco de dados

O backend agora persiste toda dieta gerada em um banco PostgreSQL, usando
Prisma como ORM. Isso não muda o comportamento do site: o formulário e a
tela de geração continuam funcionando exatamente como antes (streaming
em tempo real). A diferença é que, por trás, cada geração fica salva.

## Como rodar pela primeira vez

1. Subir o banco local (requer Docker):
   ```
   docker compose up -d
   ```
   Isso sobe um PostgreSQL na porta 5432 com usuário/senha `postgres`/`postgres`
   e banco `dietas`.

2. Instalar as novas dependências do backend:
   ```
   cd backend
   npm install
   ```
   (o `postinstall` já roda `prisma generate` automaticamente)

3. Criar as tabelas no banco:
   ```
   npm run prisma:migrate
   ```
   Vai pedir um nome para a migration, pode usar algo como `init`.

4. Rodar o backend normalmente:
   ```
   npm run dev
   ```

Se preferir usar um Postgres já existente (Supabase, Neon, Railway, etc.)
em vez do docker-compose, só trocar o `DATABASE_URL` no `.env` pela
connection string fornecida pelo serviço, e repetir os passos 3 e 4.

## O que foi adicionado

- `prisma/schema.prisma`: define a tabela `diet_plans`, com os dados do
  formulário + o resultado gerado pela IA + status (`gerando`, `concluido`,
  `erro`).
- `src/lib/prisma.ts`: instância única do Prisma Client.
- `src/routes/plan.ts`: a rota `POST /plan` continua respondendo o stream
  exatamente igual, mas agora também salva o registro no banco (criado no
  início, atualizado quando o stream termina). Também foram adicionadas
  `GET /plans` (lista as últimas 50 dietas geradas) e `GET /plans/:id`
  (detalhe de uma dieta), prontas para uma futura tela de histórico —
  hoje nenhuma delas é usada pelo frontend.

## Explorar os dados

```
npm run prisma:studio
```
Abre uma interface visual no navegador para ver/editar os dados salvos.
