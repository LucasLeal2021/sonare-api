import { describe, expect, it } from "vitest";
import { construirApp } from "../src/app";
import { processarAviso } from "../src/avisos";
import { criarFakes } from "./fakes";

async function preparar() {
  const fakes = criarFakes();
  const app = construirApp(fakes);
  await app.inject({ method: "POST", url: "/criacoes", payload: { tipo: "imagem", descricao: "um farol" } });
  const avisar = (tipo: string, detail: object) =>
    processarAviso(JSON.stringify({ "detail-type": tipo, detail: { criacaoId: "c-1", ...detail } }), fakes);
  const apagar = () => app.inject({ method: "DELETE", url: "/criacoes/c-1" });
  const consultar = () => app.inject({ method: "GET", url: "/criacoes/c-1" });
  return { fakes, avisar, apagar, consultar };
}

describe("DELETE /criacoes/:id", () => {
  it("apagar uma Criação pronta remove o arquivo do bucket e ela some da Biblioteca", async () => {
    const { fakes, avisar, apagar, consultar } = await preparar();
    await avisar("CriacaoConcluida", { chaveImagem: "imagens/c-1.jpg", prompt: "a lighthouse" });

    const resposta = await apagar();

    expect(resposta.statusCode).toBe(204);
    expect(fakes.arquivos.apagados).toEqual(["imagens/c-1.jpg"]);
    expect((await consultar()).statusCode).toBe(404);
  });

  it("apagar uma Criação que falhou não mexe no bucket (não há arquivo)", async () => {
    const { fakes, avisar, apagar, consultar } = await preparar();
    await avisar("CriacaoFalhou", { motivo: "Cloudflare respondeu 429" });

    expect((await apagar()).statusCode).toBe(204);
    expect(fakes.arquivos.apagados).toEqual([]);
    expect((await consultar()).statusCode).toBe(404);
  });

  it("uma Criação ainda na fila não pode ser apagada", async () => {
    const { apagar, consultar } = await preparar();

    const resposta = await apagar();

    expect(resposta.statusCode).toBe(409);
    expect(resposta.json()).toEqual({ erro: "Espere a Criação terminar para apagá-la." });
    expect((await consultar()).statusCode).toBe(200);
  });

  it("apagar uma Criação que não existe responde 404", async () => {
    const { apagar, avisar } = await preparar();
    await avisar("CriacaoFalhou", { motivo: "x" });
    await apagar();

    expect((await apagar()).statusCode).toBe(404);
  });
});
