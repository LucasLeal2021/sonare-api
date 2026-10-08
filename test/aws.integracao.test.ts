// Integração com o Floci: rodar dentro do container (npm run test:integracao).
import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { randomUUID } from "node:crypto";
import type { Connection } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { conectarDocumentDB } from "../src/aws/conexaoDocumentDB";
import { criarFilaSQS } from "../src/aws/filaSQS";
import { criarRepositorioMongo } from "../src/aws/repositorioMongo";
import { carregarConfig, type Config } from "../src/config";

let config: Config;
let conexao: Connection;
beforeAll(async () => {
  config = await carregarConfig();
  conexao = await conectarDocumentDB(config);
});
afterAll(() => conexao?.close());

describe("repositório de Criações no DocumentDB (Floci)", () => {
  it("uma Criação guardada pode ser buscada de volta, e o aviso de pronta fica registrado", async () => {
    const repositorio = criarRepositorioMongo(conexao);
    const criacaoId = `teste-${randomUUID()}`;

    await repositorio.criar({ criacaoId, tipo: "narracao", texto: "Olá!", voz: "pm_santa", status: "na-fila" });
    await repositorio.marcarPronta(criacaoId, `narracoes/${criacaoId}.mp3`);

    expect(await repositorio.buscar(criacaoId)).toEqual({
      criacaoId,
      tipo: "narracao",
      texto: "Olá!",
      voz: "pm_santa",
      status: "pronta",
      chaveAudio: `narracoes/${criacaoId}.mp3`,
      motivo: undefined,
    });
  });

  it("buscar uma Criação que não existe devolve null", async () => {
    expect(await criarRepositorioMongo(conexao).buscar("nao-existe")).toBeNull();
  });
});

describe("fila de Gerações (Floci)", () => {
  it("a mensagem publicada chega na fila que o worker lê", async () => {
    const criacaoId = `teste-${randomUUID()}`;
    const mensagem = { versao: 1 as const, criacaoId, tipo: "narracao" as const, texto: "Olá!", voz: "pf_dora" };

    await criarFilaSQS(config).publicar(mensagem);

    const sqs = new SQSClient({});
    for (let i = 0; i < 5; i++) {
      const { Messages = [] } = await sqs.send(
        new ReceiveMessageCommand({ QueueUrl: config.filaGeracoesUrl, MaxNumberOfMessages: 10, WaitTimeSeconds: 2 }),
      );
      const minha = Messages.find((m) => m.Body?.includes(criacaoId));
      if (!minha) continue;
      await sqs.send(new DeleteMessageCommand({ QueueUrl: config.filaGeracoesUrl, ReceiptHandle: minha.ReceiptHandle }));
      expect(JSON.parse(minha.Body!)).toEqual(mensagem);
      return;
    }
    throw new Error("a mensagem não chegou na fila de Gerações");
  });
});
