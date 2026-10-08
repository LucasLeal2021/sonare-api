# Escopo da v1

Decisões de produto tomadas no `/grilling` (outubro de 2026). Os termos seguem o `CONTEXT.md`; as decisões de arquitetura estão em `docs/adr/`. O que já está pronto e o que falta está em `docs/roteiro.md`.

## Produto

- **Objetivo do projeto:** estudar infraestrutura AWS localmente com o Floci, construindo uma aplicação real. O autor usa no trabalho Node + Sequelize + migrations, EC2, CloudFront, Route 53, S3, RDS, DocumentDB e CloudWatch, sem deploy automatizado — é isso que se quer praticar.
- **O que a Sonare faz:** o Artista cria **Narrações** (Texto falado por uma Voz) e **Imagens** (a partir de uma Descrição). Começou como música com voz cantada; mudou para voz + imagem quando o protótipo mostrou que música grátis não era viável (ADR 0005 → ADR 0011).
- **Identidade visual:** minimalismo "o silêncio que precede o som". Off-white `#F9F9F6` (papel), grafite `#1A1A1A`, azul névoa `#D2E0E6` como único destaque. Logo `sonare.` em fonte geométrica fina com espaçamento largo; o ponto pulsa em ondas enquanto algo é gerado. Títulos em serifada (Instrument Serif), interface em Inter, logo em Jost Light. Tudo em PT-BR.

## Tela

- Dois cartões lado a lado: **Narração** (Texto até 1.000 caracteres + Voz) e **Imagem** (Descrição até 500 caracteres, 1024×1024).
- Vozes: `pf_dora` (padrão, a única feminina), `pm_alex`, `pm_santa`.
- **Biblioteca** ("Minhas Criações") embaixo, em grade: da mais nova para a mais antiga, 20 por página com "carregar mais", filtro tudo · vozes · imagens. Sem login, mostra todas as Criações.
- Cada Criação: pulsa enquanto está na fila; pronta → player ou miniatura (clicar amplia e mostra o Prompt usado); Baixar; Apagar com confirmação.
- Status atualizado por polling a cada ~3 s. Responsiva.
- **Título:** automático (primeira linha do Texto ou da Descrição). Previsto: o Artista poder digitar um título (até 80 caracteres, repetidos permitidos) e renomear.

## Conta (ainda não feito)

- Login obrigatório para gerar: e-mail + senha via Cognito, com cadastro, confirmação por código, login, logout **e recuperação de senha**.
- Só e-mail + senha no cadastro; senha com no mínimo 8 caracteres, letras e números (password policy no Terraform).
- Telas próprias no estilo da Sonare. O servidor do Next (BFF) fala com o Cognito e guarda os tokens em cookie `httpOnly`; mensagens do Cognito traduzidas para PT-BR.
- Ao confirmar o cadastro, um gatilho Lambda (Post Confirmation) cria o Artista no PostgreSQL.

## Cota diária (ainda não feito)

- Por tipo: **20 Narrações + 10 Imagens por dia** por Artista, renovadas à meia-noite (horário de Brasília).
- Reserva ao aceitar o pedido; Devolução se a Criação falhar de vez (inclusive recusa definitiva). Apagar não devolve (ADR 0010).
- A tela mostra quanto resta ("3 de 10 hoje") e desabilita o Gerar ao chegar a zero.
- Proteção extra: rate limit na API e o worker processa uma Geração por vez (a fila amortece picos).

## Regras de Geração e falhas

- Até 3 Tentativas pela SQS; depois, DLQ + alarme no CloudWatch + Criação `falhou`.
- Recusas definitivas do provedor (ex.: filtro de conteúdo) falham na hora, sem DLQ, e a tela mostra o motivo (ADR 0012).
- Criações que falharam somem sozinhas depois de 7 dias (índice TTL do Mongo) — ainda não feito.
- Apagar é definitivo (arquivo no S3 + registro), só para Criações prontas ou que falharam.

## Fora da v1 (v2+)

Pagamentos (cartão via token do provedor, nunca dados de cartão — ADR 0009 — e Pix, em modo de teste, com webhooks), Créditos comprados (decidir se a Cota ou o Crédito é consumido primeiro), Texto gerado por IA (Bedrock), WebSocket no lugar do polling, cancelar uma Geração em andamento, métricas e painel no CloudWatch, Auto Scaling / ECS, publicar na AWS real.
