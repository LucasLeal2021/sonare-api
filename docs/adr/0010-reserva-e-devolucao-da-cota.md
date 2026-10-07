# Reserva e Devolução da Cota diária

Ao aceitar o pedido de uma Música, a API faz a Reserva de uma unidade da Cota diária com uma escrita condicional no PostgreSQL (só reserva se ainda houver unidades). Se a Música falhar de vez (todas as Tentativas esgotadas e a mensagem na DLQ), a API faz a Devolução. Contar só as Músicas prontas permitiria pedir dezenas de Músicas de uma vez antes de a primeira terminar; contar também as que falharam puniria o Artista por erros nossos.

## Consequences

- Como Reserva (PostgreSQL), Música (MongoDB) e fila não compartilham uma transação, a Devolução é uma ação compensatória e precisa ser idempotente: processar o mesmo aviso de falha duas vezes não pode devolver duas unidades.
- Apagar uma Música não gera Devolução.
