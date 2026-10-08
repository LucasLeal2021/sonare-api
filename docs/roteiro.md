# Roteiro

Onde o projeto está e o que vem a seguir. Atualize ao terminar cada etapa. Escopo completo em `docs/escopo-v1.md`.

## Pronto (outubro de 2026)

- **Infra base no Floci** (`infra/base`, Terraform, state no S3 com lock): bucket de Criações, fila de Gerações + DLQ, EventBridge (barramento, regra e fila de avisos para a API), DocumentDB, segredos (DocumentDB e Cloudflare), parâmetros no SSM.
- **Worker** (`sonare-ia`): Narração com Kokoro + ffmpeg, Imagem com Cloudflare (tradução m2m100 + FLUX), 3 Tentativas, falhas definitivas, avisos no EventBridge.
- **API** (`sonare-api`): criar, consultar, listar (paginado e por tipo), apagar; links pré-assinados para ver e baixar; consumidor de avisos.
- **Web** (`sonare-web`): cartões de Narração e Imagem, Biblioteca com filtro, ampliar, baixar, apagar, BFF.
- Testes: unitários + integração contra o Floci real (isolados: banco `sonare-testes`, filas e regras temporárias).

## Próximo, em ordem sugerida

1. **Limpeza:** os testes de integração do worker deixam arquivos no bucket (`testes/`, `narracoes/e2e-*`); fazê-los apagar o que criam.
2. **Pequenos do escopo:** TTL de 7 dias para Criações que falharam; título digitado e renomear; Status "gerando" (o worker publica `CriacaoIniciada`).
3. **Alarme da DLQ** no CloudWatch (Terraform) e logs revisados.
4. **Conta com Cognito:** User Pool no Terraform, telas, BFF com cookie, autorizar a API (validar o JWT com `aws-jwt-verify`), gatilho Post Confirmation, Biblioteca por Artista.
5. **Cota diária com RDS PostgreSQL** (Sequelize + migrations): Artistas, Reserva/Devolução, rate limit.
6. **Deploy em EC2 no Floci** (ADRs 0003, 0006, 0007, 0008): VPC e security groups, pacote no S3 + `npm run deploy`, instância imutável, UserData (migrations antes de subir a API), SSM Run Command, segredos pela instance role; cada repositório com seu `infra/`.
7. **Borda:** CloudFront, Route 53 e ACM no Terraform (no Floci são só configuração).
8. **CI:** GitHub Actions rodando os testes com o Floci dentro do runner.

## Fatos ainda não verificados no Floci

- Cognito: como obter localmente o código de confirmação por e-mail; se o JWKS para o `aws-jwt-verify` funciona.
- EC2: como o UserData roda e se há `systemd` (a instância é um container).
- Se security groups realmente bloqueiam tráfego.

Diferenças já descobertas estão na ADR 0002.
