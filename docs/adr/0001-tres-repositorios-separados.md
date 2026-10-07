# Três repositórios separados, sem monorepo

A Sonare é dividida em `sonare-web` (Next.js), `sonare-api` (Fastify) e `sonare-ia` (worker da Geração), cada um com git, dependências e deploy próprios. Os repositórios não compartilham código: o contrato entre web e API é um `openapi.yaml` publicado pelo `sonare-api` (o web gera os tipos a partir dele), e o contrato entre API e worker é feito só por infraestrutura — mensagem na fila, Áudio no S3 e evento de conclusão.

## Considered Options

- **Monorepo** (tipos compartilhados num pacote): rejeitado por escolha do autor do projeto; o objetivo é estudar serviços independentes.
- **Dois repositórios** (worker dentro da API): rejeitado porque a Geração pode levar minutos e roda num processo de longa duração com ciclo de deploy próprio.
