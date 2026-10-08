# sonare-api

API da Sonare (Fastify + DocumentDB) e a infraestrutura compartilhada (Terraform no Floci). Faz par com o [`sonare-ia`](https://github.com/LucasLeal2021/sonare-ia) (worker) e o [`sonare-web`](https://github.com/LucasLeal2021/sonare-web) (tela). Os três ficam lado a lado em `C:\dev`.

## Rotina do dia a dia (3 terminais, Git Bash)

| Terminal | Pasta | Comando | O que sobe |
|---|---|---|---|
| 1 | `/c/dev/sonare-api` | `docker compose up` | Floci (a "AWS local"), o Mongo do DocumentDB e a API (`localhost:3333`) |
| 2 | `/c/dev/sonare-ia` | `docker compose up` | O worker (voz e imagem) |
| 3 | `/c/dev/sonare-web` | `npm run dev` | A tela (`localhost:3000`, abre o navegador) |

Para parar: **Ctrl + C** em cada terminal. Os dados (Criações, arquivos, filas) ficam salvos em `.floci-data`.

Instalou uma dependência na API ou no worker? Suba com `docker compose up --build -V`.

## Setup na primeira vez

Pré-requisitos: Docker Desktop, Node 22, Git, AWS CLI v2 e Terraform 1.10+.

```bash
# 1. Perfil da AWS CLI apontando para o Floci
aws configure set aws_access_key_id test --profile floci
aws configure set aws_secret_access_key test --profile floci
aws configure set region us-east-1 --profile floci
aws configure set endpoint_url http://localhost:4566 --profile floci

# 2. Floci no ar e o bucket do state do Terraform (o "ovo e a galinha")
docker compose up -d floci
aws s3 mb s3://sonare-terraform-state --profile floci

# 3. A infraestrutura
cd infra/base
terraform init -backend-config=backend-local.hcl
terraform apply

# 4. A chave da Cloudflare (Imagens) no cofre, lida do .env do sonare-ia
cd /c/dev/sonare-ia
CF_CONTA=$(grep '^CLOUDFLARE_ACCOUNT_ID=' .env | cut -d= -f2- | tr -d '\r')
CF_TOKEN=$(grep '^CLOUDFLARE_API_TOKEN=' .env | cut -d= -f2- | tr -d '\r')
aws secretsmanager put-secret-value --profile floci --secret-id sonare-local/cloudflare --secret-string "{\"accountId\":\"$CF_CONTA\",\"token\":\"$CF_TOKEN\"}"
```

## Testes

```bash
npm test                                            # rápidos, no Windows
docker compose run --rm api npm run test:integracao # contra o Floci (banco sonare-testes)
```

## Ver o banco por dentro

```bash
SENHA=$(MSYS_NO_PATHCONV=1 aws secretsmanager get-secret-value --profile floci --secret-id sonare-local/documentdb --query SecretString --output text | node.exe -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).senha))")
MSYS_NO_PATHCONV=1 docker exec -it floci-docdb-sonare-local-criacoes mongosh -u sonare -p "$SENHA" --authenticationDatabase admin sonare
```

## Documentação

`CONTEXT.md` (glossário), `docs/escopo-v1.md` (decisões de produto), `docs/roteiro.md` (o que falta), `docs/adr/` (decisões de arquitetura).
