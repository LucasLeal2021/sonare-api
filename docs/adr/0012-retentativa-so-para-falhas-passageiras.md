# Retentativa só para falhas passageiras

Uma Geração que falha é tentada de novo até três vezes (fila SQS com `maxReceiveCount = 3`) e, se não resolver, vai para a DLQ, que dispara o alarme. Isso só faz sentido para falhas **passageiras**. Quando o provedor recusa o pedido em si — o caso real que levou a esta decisão foi o FLUX recusar a Descrição "uma mulher nua" com `400: Input prompt contains NSFW content` —, repetir dá sempre o mesmo resultado: o Artista esperava ~6 minutos para ver "não deu certo" e o alarme da DLQ disparava por algo que não é defeito do sistema.

Por isso o worker distingue os dois casos. Um gerador lança `FalhaDefinitiva` (com uma mensagem escrita para o Artista) quando sabe que insistir não adianta; aí o worker publica `CriacaoFalhou` com `definitiva: true` **já na primeira Tentativa** e apaga a mensagem da fila, sem passar pela DLQ. A API guarda a Criação como `falhou` + `recusada`, e a tela mostra o motivo em vez do aviso genérico.

## Consequences

- Hoje só a Cloudflare tem recusas definitivas: `400` (filtro de conteúdo, com mensagem própria, ou outra recusa do pedido). `429`, `5xx` e `401/403` (chave errada) continuam passageiros: os dois últimos são problemas do sistema e **devem** chegar à DLQ e ao alarme.
- Mensagens inválidas na fila continuam indo para a DLQ: elas indicam um defeito de quem publicou, e a DLQ guarda o rastro.
- Quando a Cota diária existir, uma recusa definitiva também gera Devolução (ADR 0010), porque a Criação terminou como `falhou`.
