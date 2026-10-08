import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { processarAviso } from "./avisos";
import type { Config } from "./config";
import type { RepositorioDeCriacoes } from "./portas";

/** Lê os avisos do worker (fila de Criações concluídas) para sempre, apagando cada um depois de aplicado. */
export async function consumirAvisos(config: Config, deps: { repositorio: RepositorioDeCriacoes }) {
  const sqs = new SQSClient({});
  const fila = config.filaCriacoesConcluidasUrl;

  while (true) {
    try {
      const { Messages = [] } = await sqs.send(
        new ReceiveMessageCommand({ QueueUrl: fila, MaxNumberOfMessages: 10, WaitTimeSeconds: 20 }),
      );
      for (const m of Messages) {
        await processarAviso(m.Body ?? "", deps);
        log({ evento: "aviso aplicado", criacaoId: JSON.parse(m.Body ?? "{}").detail?.criacaoId });
        await sqs.send(new DeleteMessageCommand({ QueueUrl: fila, ReceiptHandle: m.ReceiptHandle }));
      }
    } catch (erro) {
      log({ evento: "erro ao consumir avisos", erro: (erro as Error).message });
      await new Promise((resolver) => setTimeout(resolver, 5_000));
    }
  }
}

// Logs em JSON, uma linha por evento, sempre com o criacaoId quando houver (Q23)
export function log(dados: Record<string, unknown>) {
  console.log(JSON.stringify({ hora: new Date().toISOString(), servico: "sonare-api", ...dados }));
}
