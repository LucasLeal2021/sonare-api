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
    await repositorio.marcarPronta(criacaoId, { chaveAudio: `narracoes/${criacaoId}.mp3` });

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

  it("uma Imagem guardada volta com a Descrição, o Prompt e o local do arquivo, e o filtro por tipo a encontra", async () => {
    const repositorio = criarRepositorioMongo(conexao);
    const criacaoId = `teste-${randomUUID()}`;

    await repositorio.criar({ criacaoId, tipo: "imagem", descricao: "um farol", status: "na-fila" });
    await repositorio.marcarPronta(criacaoId, { chaveImagem: `imagens/${criacaoId}.jpg`, prompt: "a lighthouse" });

    expect(await repositorio.buscar(criacaoId)).toEqual({
      criacaoId,
      tipo: "imagem",
      descricao: "um farol",
      status: "pronta",
      chaveImagem: `imagens/${criacaoId}.jpg`,
      prompt: "a lighthouse",
      motivo: undefined,
    });
    const [maisNovaImagem] = await repositorio.listar({ limite: 1, tipo: "imagem" });
    expect(maisNovaImagem.criacaoId).toBe(criacaoId);
  });

  it("uma recusa definitiva fica guardada como recusa, com o motivo", async () => {
    const repositorio = criarRepositorioMongo(conexao);
    const criacaoId = `teste-${randomUUID()}`;
    await repositorio.criar({ criacaoId, tipo: "imagem", descricao: "algo proibido", status: "na-fila" });

    await repositorio.marcarFalhou(criacaoId, "recusada pelo filtro", { definitiva: true });

    expect(await repositorio.buscar(criacaoId)).toMatchObject({ status: "falhou", motivo: "recusada pelo filtro", recusada: true });
  });

  it("uma Criação apagada não é mais encontrada", async () => {
    const repositorio = criarRepositorioMongo(conexao);
    const criacaoId = `teste-${randomUUID()}`;
    await repositorio.criar({ criacaoId, tipo: "imagem", descricao: "um farol", status: "falhou" });

    await repositorio.apagar(criacaoId);

    expect(await repositorio.buscar(criacaoId)).toBeNull();
  });

  it("buscar uma Criação que não existe devolve null", async () => {
    expect(await criarRepositorioMongo(conexao).buscar("nao-existe")).toBeNull();
  });

  it("lista da mais nova para a mais antiga, uma página por vez", async () => {
    const repositorio = criarRepositorioMongo(conexao);
    const [a, b, c] = ["a", "b", "c"].map((letra) => `teste-${letra}-${randomUUID()}`);
    for (const criacaoId of [a, b, c]) {
      await repositorio.criar({ criacaoId, tipo: "narracao", texto: "Olá!", voz: "pf_dora", status: "na-fila" });
      await new Promise((r) => setTimeout(r, 5)); // horários de criação diferentes
    }

    const primeira = await repositorio.listar({ limite: 2 });
    const segunda = await repositorio.listar({ limite: 1, depoisDe: primeira[1].criacaoId });

    expect(primeira.map((x) => x.criacaoId)).toEqual([c, b]);
    expect(segunda.map((x) => x.criacaoId)).toEqual([a]);
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
