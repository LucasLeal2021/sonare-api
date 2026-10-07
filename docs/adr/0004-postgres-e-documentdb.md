# PostgreSQL para Artistas e Cota, DocumentDB para Músicas

Artistas, Cota diária, Créditos e pagamentos ficam no RDS PostgreSQL (Sequelize + migrations), onde transações e consistência forte importam. As Músicas e tudo o que a Geração produz (parâmetros e respostas do modelo de IA, que mudam de formato por modelo) ficam no DocumentDB (MongoDB, via Mongoose). Só o `sonare-api` escreve nos dois bancos; o worker nunca acessa banco, apenas publica eventos.

## Consequences

- Pedir uma Música toca os dois bancos (Reserva no PostgreSQL, Música no MongoDB) sem transação entre eles — ver ADR 0010.
- A expiração das Músicas que falharam usa o índice TTL nativo do MongoDB.
