// Integração com o Floci: rodar dentro do container (npm run test:integracao).
import { CreateQueueCommand, DeleteQueueCommand, ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
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
  // Uma fila só deste teste: na fila real, o worker (se estiver ligado) pegaria a mensagem primeiro
  const sqs = new SQSClient({});
  let filaDoTeste: string;
  beforeAll(async () => {
    const { QueueUrl } = await sqs.send(new CreateQueueCommand({ QueueName: `sonare-teste-${randomUUID()}` }));
    filaDoTeste = QueueUrl!;
  });
  afterAll(() => sqs.send(new DeleteQueueCommand({ QueueUrl: filaDoTeste })));

  it("a mensagem publicada chega na fila no formato que o worker espera", async () => {
    const mensagem = { versao: 1 as const, criacaoId: "c-1", tipo: "narracao" as const, texto: "Olá!", voz: "pf_dora" };

    await criarFilaSQS({ ...config, filaGeracoesUrl: filaDoTeste }).publicar(mensagem);

    const { Messages = [] } = await sqs.send(new ReceiveMessageCommand({ QueueUrl: filaDoTeste, WaitTimeSeconds: 5 }));
    expect(Messages.map((m) => JSON.parse(m.Body!))).toEqual([mensagem]);
  });
});
