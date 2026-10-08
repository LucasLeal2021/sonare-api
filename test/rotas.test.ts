import { describe, expect, it } from "vitest";
import { construirApp } from "../src/app";
import { criarFakes } from "./fakes";

const narracao = { tipo: "narracao", texto: "Olá! Eu sou uma voz da Sonare.", voz: "pf_dora" };

function preparar() {
  const fakes = criarFakes();
  return { fakes, app: construirApp(fakes) };
}

describe("POST /criacoes", () => {
  it("uma Narração válida é aceita na fila e a mensagem certa vai para o worker", async () => {
    const { app, fakes } = preparar();

    const resposta = await app.inject({ method: "POST", url: "/criacoes", payload: narracao });

    expect(resposta.statusCode).toBe(201);
    expect(resposta.json()).toEqual({ criacaoId: "c-1", status: "na-fila" });
    expect(fakes.fila.publicadas).toEqual([
      { versao: 1, criacaoId: "c-1", tipo: "narracao", texto: narracao.texto, voz: "pf_dora" },
    ]);
  });

  it.each([
    ["sem Texto", { ...narracao, texto: "   " }, "Escreva o Texto da Narração."],
    ["Texto longo demais", { ...narracao, texto: "a".repeat(1001) }, "O Texto pode ter no máximo 1.000 caracteres."],
    ["Voz desconhecida", { ...narracao, voz: "pm_joao" }, "Escolha uma Voz válida: dora, alex ou santa."],
  ])("um pedido inválido (%s) é recusado com uma mensagem em português e nada vai para a fila", async (_caso, corpo, erro) => {
    const { app, fakes } = preparar();

    const resposta = await app.inject({ method: "POST", url: "/criacoes", payload: corpo });

    expect(resposta.statusCode).toBe(400);
    expect(resposta.json()).toEqual({ erro });
    expect(fakes.fila.publicadas).toEqual([]);
  });
});

describe("GET /criacoes/:id", () => {
  it("uma Criação recém-pedida aparece na fila", async () => {
    const { app } = preparar();
    await app.inject({ method: "POST", url: "/criacoes", payload: narracao });

    const resposta = await app.inject({ method: "GET", url: "/criacoes/c-1" });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({ criacaoId: "c-1", tipo: "narracao", texto: narracao.texto, voz: "pf_dora", status: "na-fila" });
  });

  it("uma Criação que não existe responde 404", async () => {
    const { app } = preparar();

    const resposta = await app.inject({ method: "GET", url: "/criacoes/nao-existe" });

    expect(resposta.statusCode).toBe(404);
    expect(resposta.json()).toEqual({ erro: "Criação não encontrada." });
  });
});
