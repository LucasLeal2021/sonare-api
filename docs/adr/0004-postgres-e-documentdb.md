# PostgreSQL para Artistas e Cota, DocumentDB para Criações

Artistas, Cota diária, Créditos e pagamentos ficam no RDS PostgreSQL (Sequelize + migrations), onde transações e consistência forte importam. As Criações e tudo o que a Geração produz (parâmetros e respostas dos modelos de IA, que mudam de formato por tipo de Criação e por modelo) ficam no DocumentDB (MongoDB, via Mongoose). Só o `sonare-api` escreve nos dois bancos; o worker nunca acessa banco, apenas publica eventos.

## Consequences

- Pedir uma Criação toca os dois bancos (Reserva no PostgreSQL, Criação no MongoDB) sem transação entre eles — ver ADR 0010.
- A expiração das Criações que falharam usa o índice TTL nativo do MongoDB.
