import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import type { Config } from "../config";
import type { FilaDeGeracoes } from "../portas";

export function criarFilaSQS(config: Config): FilaDeGeracoes {
  const sqs = new SQSClient({});
  return {
    async publicar(mensagem) {
      await sqs.send(new SendMessageCommand({ QueueUrl: config.filaGeracoesUrl, MessageBody: JSON.stringify(mensagem) }));
    },
  };
}
