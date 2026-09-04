# Divisão do trabalho em commits — Ryan Miranda, João Ferreira, Paulo Calado

Todo o trabalho feito nesta sessão está atualmente por commitar num único diretório
(`git status` mostra tudo como alterado/novo). Este ficheiro diz exatamente que
ficheiros cada pessoa deve `git add` e com que mensagem, para o histórico do
repositório refletir a divisão real de responsabilidades:

- **Ryan Miranda** — Backend e IA
- **João Ferreira** — Base de dados
- **Paulo Calado** — Frontend

> Nota: neste computador o git já está configurado como `paulo9164` / `PauloRMC9164@gmail.com`
> (dá para confirmar com `git config user.name`). Os commits do Paulo podem ser feitos
> diretamente. Para os commits do Ryan e do João aparecerem com a autoria certa,
> troca a identidade antes de cada bloco (ver secção "Como aplicar" no fim), ou
> pede a cada um para fazer os commits no seu próprio computador.

---

## Ryan Miranda — Backend e IA

### Commit 1 — "Permite editar, traduzir e apagar dietas geradas, e corrige CORS para essas operações"
```
backend/src/server.ts
backend/src/routes/plan.ts
backend/src/agent.ts
backend/src/prompt.ts
backend/src/types.ts
```
Cobre: CORS a permitir PATCH/DELETE, endpoint de editar dieta (a IA aplica o pedido
em texto), endpoint de traduzir para PDF, endpoint de apagar, header `X-Plan-Id`
para o botão "Plano completo", correção do bug que devolvia 500 em vez de 400 em
pedidos inválidos, e todas as atualizações do prompt do sistema (quantidades dos
alimentos, novas perguntas do questionário, exigir texto nas opções "Outro").

### Commit 2 — "Adiciona envio do PDF por email via SMTP e listagem de clientes com lembretes"
```
backend/src/mailer.ts
backend/src/routes/clientes.ts
backend/.env.example
backend/package.json
backend/package-lock.json
```
Cobre: serviço de email (nodemailer), rota `GET /email/status`, rota
`POST /plans/:id/enviar-email`, rota `GET /clientes` (busca/ordenação/lembrete de
contacto) e `PATCH /clientes/:id`.

---

## João Ferreira — Base de dados

### Commit único — "Adiciona colunas e migrações: perfil avançado, histórico de edições, foto do cliente, lembrete de contacto e email"
```
backend/prisma/schema.prisma
backend/prisma/migrations/20260902083837_add_clientes_deficit_superavit/
backend/prisma/migrations/20260902121216_add_perfil_avancado/
backend/prisma/migrations/20260902141229_add_historico_edicoes/
backend/prisma/migrations/20260903094841_add_foto_e_lembrete_cliente/
backend/prisma/migrations/20260903110712_add_email_cliente/
```
Cobre todas as alterações ao esquema da base de dados feitas nesta sessão:
`perfil_avancado` (JSON), `historico_edicoes` (JSON), `foto_antes`,
`lembrete_contato_data`/`lembrete_contato_feito_em`, e `email` (único) na tabela
`clientes`.

> Se preferires um commit por migração (5 commits em vez de 1), tem cuidado: o
> `schema.prisma` só deve entrar por inteiro no commit da ÚLTIMA migração, senão
> o estado do ficheiro fica à frente do que essa migração realmente altera. O mais
> simples e seguro é mesmo um único commit com tudo.

---

## Paulo Calado — Frontend

### Commit 1 — "Reestrutura o wizard em páginas de ~5 perguntas e atualiza as perguntas do questionário"
```
web/app/_components/wizard/schema.ts
web/app/_components/wizard/step-config.ts
web/app/_components/wizard/steps.tsx
web/app/_components/wizard/use-wizard.ts
web/app/_components/wizard/Wizard.tsx
web/app/_components/diet-form.tsx
web/types/diet-data.type.ts
```

### Commit 2 — "Melhora o histórico de dietas: editar, apagar, baixar PDF (com gráfico e foto), enviar por email, e o botão 'Plano completo' após gerar"
```
web/app/_components/plan-card.tsx
web/app/_components/goal-projection-chart.tsx
web/app/_components/info-callouts.tsx
web/app/_components/diet-generator.tsx
web/lib/diet-pdf.ts
web/lib/goal-projection.ts
web/lib/image.ts
web/app/historico/page.tsx
web/types/diet-plan-record.type.ts
web/app/globals.css
```

### Commit 3 — "Adiciona aba de clientes com pesquisa, filtros e lembrete de contacto na página inicial"
```
web/app/clientes/page.tsx
web/app/_components/lembretes-box.tsx
web/lib/lembretes.ts
web/app/page.tsx
```

### Commit 4 — "Adiciona componentes shadcn em falta e remove ficheiros não usados"
```
web/components/ui/checkbox.tsx
web/components/ui/radio-group.tsx
web/components/ui/scroll-area.tsx        (apagado)
web/public/file.svg                      (apagado)
web/public/globe.svg                     (apagado)
web/public/next.svg                      (apagado)
web/public/vercel.svg                    (apagado)
web/public/window.svg                    (apagado)
web/app/layout.tsx
web/package.json
web/package-lock.json
```

---

## Ficheiros de documentação (não pertencem a nenhum papel específico)

```
concluido.md
tarefas.md
DIVISAO_COMMITS.md   (este ficheiro)
```
São registos de acompanhamento do trabalho, não código de nenhuma área. Sugestão:
quem fizer o último commit/push do dia inclui estes três juntos, num commit tipo
"Atualiza registo de tarefas concluídas".

---

## Como aplicar (neste computador)

Para cada bloco acima:

```bash
# só necessário para os commits do Ryan e do João — o Paulo já é a
# identidade configurada neste computador
git config user.name "Ryan Miranda"
git config user.email "email-do-ryan@exemplo.com"

git add backend/src/server.ts backend/src/routes/plan.ts backend/src/agent.ts backend/src/prompt.ts backend/src/types.ts
git commit -m "Permite editar, traduzir e apagar dietas geradas, e corrige CORS para essas operações"

# repete git add + git commit para o Commit 2 do Ryan, depois troca a
# identidade para o João e faz o commit dele, depois volta a trocar (ou
# deixa como está, já que é a configurada por omissão) para os do Paulo.
```

No fim, repõe a tua identidade:
```bash
git config user.name "paulo9164"
git config user.email "PauloRMC9164@gmail.com"
```

Se cada um preferir fazer os commits no seu próprio computador (mais fiel ao que
aconteceria num trabalho real em equipa), basta partilhar o código atual (ex: um
zip ou uma branch) e cada um corre `git add` + `git commit` só com os ficheiros da
sua secção, na sua própria máquina com a sua própria identidade git já configurada.
