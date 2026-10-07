# API e worker em EC2, Lambda só para o gatilho do Cognito

A API (Fastify) e o worker da Geração rodam em EC2, não em Lambda. A API em processo contínuo mantém um único pool de conexões com o PostgreSQL (Lambdas concorrentes abrem conexões demais), roda as migrations no próprio deploy e acessa os bancos na rede privada sem a armadilha de Lambda-em-VPC perder acesso ao SQS sem NAT. O worker precisa de EC2 porque uma Geração via Hugging Face Space pode passar do limite de 15 minutos da Lambda. Lambda continua no projeto onde é a escolha natural: o gatilho *Post Confirmation* do Cognito, que cria o Artista no PostgreSQL.

## Consequences

- Sem API Gateway: a validação do token do Cognito é feita em código (`aws-jwt-verify`) e o throttling por `@fastify/rate-limit`.
- É também a arquitetura que o autor usa no trabalho (Node + Sequelize em servidor), o que é intencional: o foco de estudo é automatizar o deploy dela.
