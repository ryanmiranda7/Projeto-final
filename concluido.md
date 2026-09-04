# Tarefas concluídas

Registo do que foi feito a partir de `tarefas.md`. Datas em GMT (fuso do servidor).

## 2026-09-02

1. **Multi-seleção em "Como você se sente entre as refeições?"** — passou de pergunta de escolha única (radio) para múltipla escolha (checkbox), no wizard e nos schemas (frontend e backend).
2. **Erro ao editar ingrediente ("Não foi possível aplicar a alteração")** — causa raiz: o CORS do backend só permitia `GET`/`POST`, bloqueando os pedidos `PATCH`/`DELETE` no browser antes de chegarem ao servidor. Corrigido em `backend/src/server.ts`. Também foi encontrado e corrigido um segundo bug pelo caminho: dietas geradas antes desta sessão guardavam `sensacao_entre_refeicoes` como texto simples (formato antigo), e a nova validação esperava sempre uma lista — `formatarLista` em `backend/src/prompt.ts` agora aceita os dois formatos.
3. **Erro ao baixar PDF ("Attempting to parse an unsupported color function 'lab'")** — o `html2canvas` (usado pelo `html2pdf.js`) não sabe interpretar as cores `oklch()`/`lab()` que o Tailwind v4 usa em todas as classes de cor. Trocada a geração do PDF para desenhar texto diretamente com `jsPDF` (`web/lib/diet-pdf.ts`), sem depender do DOM/canvas — resolve o problema pela raiz em vez de o contornar.
4. **Site trava ao clicar em Baixar PDF** — mesma causa da tarefa 3; resolvido pela mesma correção.
5. **Apagar dieta não funcionava** — mesma causa da tarefa 2 (CORS bloqueava o `DELETE`); resolvido pela mesma correção.
6. **Layout do cartão de cliente em `/clientes`** — o componente `Card` já vinha com `flex-col` embutido, o que empilhava as informações verticalmente em vez de as pôr lado a lado; corrigido com `!flex-row` e mais espaçamento (`gap-10`). Também corrigida a contagem "Homens/Mulheres": antes contava o total de dietas geradas por sexo (um cliente com 3 dietas contava 3), agora conta o número de clientes distintos por sexo.
7. **Questionário com muitas páginas** — o wizard mostrava uma pergunta por ecrã (~25-29 passos). Reestruturado para agrupar em páginas de ~5 perguntas (`web/app/_components/wizard/use-wizard.ts` e `Wizard.tsx`), reduzindo para ~5-6 páginas.
9. Este ficheiro.

## 2026-09-02 (continuação)

12. **Pergunta "Quais das opções melhor descreve você?"** — substituídas as 3 opções antigas sobre ganho de músculo por uma única "Consigo ganhar massa muscular rápido", mantendo as 5 opções sobre dificuldade em perder peso. Valores antigos continuam válidos no schema só para não invalidar dietas já guardadas.
13. **Scroll ao avançar de página do wizard** — ao clicar em "Próximo", a página agora abre sempre no topo (antes ficava na posição de scroll da página anterior).
14. **Opção "Nenhum" na pergunta de alergias** — adicionada, com a mesma exclusividade já usada noutras perguntas (marcar "Nenhum" desmarca as outras e vice-versa).
15. **Gráfico com marcações sobrepostas** — quando o evento especial cai perto da data do objetivo, as duas etiquetas agora se separam automaticamente (uma acima, outra abaixo) em vez de se sobrepor. Também instalado o `@tailwindcss/typography` (estava em falta — as classes `prose` não tinham efeito nenhum) e melhorado o estilo do conteúdo da dieta e do gráfico.
16. **Visual do PDF** — reescrito para ter cabeçalho colorido, ícones vetoriais (prato/alvo/visto — sem emojis, desenhados diretamente, sem imagens externas), caixas de resumo do dia e separadores entre secções, mantendo a abordagem em texto puro (sem `html2canvas`) que já corrigia o crash anterior.
17. **Download do PDF traduzido** — nova rota `POST /plans/:id/traduzir` (backend) e seletor de idioma (Português BR/PT, English, Español) na aba de histórico; a tradução é feita pela IA só na hora de baixar o PDF, sem alterar o plano guardado.

## 2026-09-03

20. **Erro ao abrir "Clientes" (imagem A1)** — investigado, mas não foi possível reproduzir; coincide com uma janela em que o backend/base de dados estava mesmo em baixo nesta sessão de testes. Não encontrei nenhum bug de código associado — avisar se voltar a acontecer.
21. **Ordem e hora das dietas** — `GET /plans` e a lista de dietas de cada cliente passam a ordenar por `updatedAt` (última geração/edição) em vez de `createdAt`, para uma dieta editada voltar a subir para o topo do histórico. No cartão da dieta, a hora passou a aparecer numa linha própria por baixo da data (antes: tudo espremido numa linha só).
24. **Gráfico no PDF** — a lógica de previsão do objetivo foi extraída para `web/lib/goal-projection.ts` (partilhada entre o gráfico da página web e o novo gráfico do PDF) e agora o PDF também mostra o gráfico, desenhado com as primitivas do jsPDF (linha, grelha, marcadores), com o ponto do objetivo e do evento sempre legíveis — inclusive quando ficam perto um do outro.
25. **Foto "antes" do cliente** — campo opcional de foto no formulário inicial (redimensionada/comprimida no browser antes de enviar), guardada em `Cliente.foto_antes` só na primeira dieta gerada para essa pessoa. Aparece como avatar na aba de clientes.
26. **Lembrete de contacto a meio do objetivo** — caixa de avisos na página inicial que lembra de contactar clientes a meio do caminho até à meta (calculado automaticamente a partir da previsão do objetivo, ou definido manualmente na aba de clientes). Tem um botão "Já contactei" que dispensa o aviso.

## 2026-09-03 (continuação)

28. **Opção "Outro" em "Como você se sente entre as refeições?"** — adicionada, com o mesmo padrão já usado noutras perguntas (campo de texto "Pode descrever?" que só aparece se "Outro" for selecionado).
29. **Descrição do Paleo e do Keto** — pequena explicação de cada dieta ao lado do nome, na pergunta "Você quer seguir algum tipo especial de dieta?".
30. **Opção "Ceia" e reordenação** — adicionada ao fim da pergunta "Quais refeições você come em um dia típico?", com "Lanches" a aparecer antes de "Jantar".
31. **"Lanche" → "Jantar" na grelha de refeições fora/delivery** — a linha da grelha "Selecione as refeições em que você come fora ou pede delivery..." passou de "Lanche" para "Jantar". Dados antigos guardados com a chave "lanche" continuam a ser lidos corretamente (fallback no prompt).
32. **Lembrete no canto superior esquerdo** — reposicionado de baixo para cima à esquerda. Ao testar, encontrei um problema novo causado por essa mudança: a caixa aberta tapava as primeiras perguntas do formulário nesse canto — corrigido deixando-a recolhida por padrão (só um sino com contador), expandindo a lista apenas ao clicar.

## 2026-09-03 (continuação 2)

35. **Email do cliente** — campo opcional no formulário inicial. Quando indicado, passa a identificar o cliente entre gerações (em vez do nome — duas pessoas diferentes podem chamar-se igual, mas não têm o mesmo email); sem email, mantém o comportamento anterior. Aparece também na aba de clientes, e a pesquisa passou a procurar por nome ou email.
36. **Enviar PDF por email** — botão "Enviar por email" no histórico (só aparece se o cliente tiver email guardado), no idioma selecionado no mesmo seletor do "Baixar PDF". O PDF continua a ser gerado no browser (reaproveita a mesma lógica do download); o backend só recebe o ficheiro pronto e envia por SMTP. **Precisa de configuração**: preencher `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` no `.env` do backend (ver `.env.example`) — sem isso, o botão mostra um erro claro em vez de falhar em silêncio (testado).
37. **Foto "antes" no fim do PDF** — quando o cliente tem uma foto guardada, o PDF ganha uma página extra no final com essa imagem (mantendo a proporção original). Testado com download real — o PDF passou a ter 3 páginas em vez de 2.

## 2026-09-03 (continuação 3)

39. **Opções de "Quais das opções melhor descreve você?"** — removida "Todas as anteriores", adicionada "Outro" como última opção (com campo de texto condicional), e adicionada "Tenho dificuldade de ganhar massa muscular" logo a seguir a "Consigo ganhar massa muscular rápido".
40. **Campo obrigatório quando "Outro" é escolhido** — em todas as perguntas com essa opção (motivo principal, perfil de ganho muscular, sensação entre as refeições, riscos de saúde, almoço típico), selecionar "Outro" e deixar o texto em branco agora bloqueia o avanço, em vez de deixar passar em branco. Testei com um payload sem os textos (falhou como esperado) e com os textos preenchidos (passou).
41. **Quantidades dos alimentos** — o prompt do sistema passou a exigir uma quantidade em cada alimento listado (ex.: "150g de arroz integral") e a calcular o "Resumo do dia" a partir dessas quantidades, em vez de um total desligado dos alimentos.
42. **Botão "Enviar por email" parecia avariado** — investiguei e não é um bug: o servidor continua sem SMTP configurado (confirmei no `.env`, continua em branco), por isso falha sempre. Em vez de deixar clicar e só mostrar o erro depois, o botão agora fica desativado (com legenda a explicar o motivo) sempre que o backend reporta que o email não está configurado — nova rota `GET /email/status` para isso. **Continua a precisar que preenchas `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` no `.env` do backend** para funcionar de verdade; isso não é algo que eu consiga fazer por ti, precisa de uma conta de email real tua. (Entretanto configuraste — o botão já está ativo.)

## 2026-09-03 (continuação 4)

44. **Botão "Plano completo"** — depois de gerar a dieta, aparece um botão que leva diretamente à dieta que acabou de ser gerada no histórico, já expandida e com scroll automático até ela. Tecnicamente: o backend passou a devolver o id da dieta num header (`X-Plan-Id`, exposto via CORS) já no início do streaming; testei o header a chegar ao browser e o deep-link (`/historico?cliente=...&plano=...`) a expandir a dieta certa.
45. **"Apagar" bloqueado durante PDF/email** — enquanto o PDF está a ser gerado ou o email a ser enviado, o botão "Apagar" dessa dieta fica desativado, para não apagar a meio desses processos.
46. **Removido o rótulo "Concluído"** — já era o estado normal/esperado de todas as dietas, por isso deixou de aparecer; os estados excecionais ("Gerando...", "Erro") continuam a aparecer normalmente.
47. **Mensagem "Dieta editada com sucesso!"** — aparece depois de uma edição bem-sucedida (testei com uma edição real).
48. **Estilo dos botões do lembrete de contacto** — "Guardar" com sublinhado, "Cancelar" a vermelho, na aba de clientes.
49. **Texto da página inicial** — "Preencha seus dados para gerar uma dieta personalizada" → "Preencha os dados para gerar uma dieta".

Nada do que testei tocou nos dados reais (Ryan, Maria Joana) além de uma edição de teste pedida no Ryan ("adiciona uma maçã ao pequeno-almoço") para confirmar a tarefa 47 — fica registada no histórico de edições dele, dá para reverter/ajustar pelo mesmo campo se não for o que queres.

## 2026-09-03 (continuação 5)

51. **Filtro por intervalo de datas** — adicionado tanto no histórico de dietas (filtra pela data em que cada dieta foi gerada) como na aba de clientes (novo chip "Intervalo de datas" ao lado de Hoje/Este mês/Este ano/Todos, com os mesmos campos De/Até). Testei com uma data no futuro em ambas as páginas para confirmar que o filtro reduz a lista corretamente.

## 2026-09-03 (continuação 6)

53. **Email obrigatório no formulário** — deixou de ter "(opcional)"; agora bloqueia o "Continuar" no ecrã inicial se não for preenchido (antes só teria bloqueado no fim do questionário todo, que seria uma má surpresa). Testei: sem email não avança; com email válido, gera normalmente.
   - **Bónus encontrado a testar isto**: ao simular um pedido inválido diretamente contra o backend, descobri que qualquer erro de validação no `POST /plan` devolvia um 500 confuso ("Expected a string or Buffer") em vez do 400 com a mensagem clara — os headers de streaming estavam a ser definidos antes da validação correr. Corrigido (só são definidos depois de a validação passar); confirmei o 400 com a mensagem certa a funcionar, e o caminho normal (com email) continua a funcionar exatamente como antes.
