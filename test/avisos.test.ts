import { describe, expect, it } from "vitest";
import { construirApp } from "../src/app";
import { processarAviso } from "../src/avisos";
import { criarFakes } from "./fakes";

// Como o EventBridge entrega na fila: o que o worker publicou vem dentro de `detail`
const aviso = (tipo: string, detail: object) => JSON.stringify({ source: "sonare.ia", "detail-type": tipo, detail });

async function criacaoNaFila() {
  const fakes = criarFakes();
  const app = construirApp(fakes);
  await app.inject({ method: "POST", url: "/criacoes", payload: { tipo: "narracao", texto: "Olá!", voz: "pf_dora" } });
  const consultar = async () => (await app.inject({ method: "GET", url: "/criacoes/c-1" })).json();
  return { fakes, consultar };
}

describe("avisos do worker", () => {
  it("CriacaoConcluida deixa a Criação pronta, com o local do Áudio", async () => {
    const { fakes, consultar } = await criacaoNaFila();

    await processarAviso(aviso("CriacaoConcluida", { criacaoId: "c-1", chaveAudio: "narracoes/c-1.mp3" }), fakes);

    expect(await consultar()).toMatchObject({ status: "pronta", chaveAudio: "narracoes/c-1.mp3" });
  });

  it("uma Criação pronta traz uma URL para ouvir o Áudio", async () => {
    const { fakes, consultar } = await criacaoNaFila();

    await processarAviso(aviso("CriacaoConcluida", { criacaoId: "c-1", chaveAudio: "narracoes/c-1.mp3" }), fakes);

    expect(await consultar()).toMatchObject({ urlAudio: "https://arquivo.falso/narracoes/c-1.mp3" });
  });

  it("CriacaoConcluida de uma Imagem a deixa pronta, com o Prompt usado e uma URL para ver a Imagem", async () => {
    const fakes = criarFakes();
    const app = construirApp(fakes);
    await app.inject({ method: "POST", url: "/criacoes", payload: { tipo: "imagem", descricao: "um farol" } });

    await processarAviso(
      aviso("CriacaoConcluida", { criacaoId: "c-1", chaveImagem: "imagens/c-1.jpg", prompt: "a lighthouse" }),
      fakes,
    );

    expect((await app.inject({ method: "GET", url: "/criacoes/c-1" })).json()).toMatchObject({
      tipo: "imagem",
      status: "pronta",
      prompt: "a lighthouse",
      urlImagem: "https://arquivo.falso/imagens/c-1.jpg",
    });
  });

  it("uma Narração pronta traz também um link para baixar, com um nome de arquivo amigável", async () => {
    const { fakes, consultar } = await criacaoNaFila();

    await processarAviso(aviso("CriacaoConcluida", { criacaoId: "c-1", chaveAudio: "narracoes/c-1.mp3" }), fakes);

    expect(await consultar()).toMatchObject({ urlDownload: "https://arquivo.falso/narracoes/c-1.mp3?baixarComo=sonare-ola.mp3" });
  });

  it("uma Imagem pronta traz o link para baixar, com o nome tirado da Descrição (sem acentos)", async () => {
    const fakes = criarFakes();
    const app = construirApp(fakes);
    await app.inject({ method: "POST", url: "/criacoes", payload: { tipo: "imagem", descricao: "Um farol solitário, numa falésia!" } });

    await processarAviso(aviso("CriacaoConcluida", { criacaoId: "c-1", chaveImagem: "imagens/c-1.jpg", prompt: "x" }), fakes);

    expect((await app.inject({ method: "GET", url: "/criacoes/c-1" })).json()).toMatchObject({
      urlDownload: "https://arquivo.falso/imagens/c-1.jpg?baixarComo=sonare-um-farol-solitario-numa-falesia.jpg",
    });
  });

  it("CriacaoFalhou definitiva (recusa do provedor) fica marcada como recusa, com o motivo para o Artista", async () => {
    const { fakes, consultar } = await criacaoNaFila();
    const motivo = "A Cloudflare recusou esta Descrição pelo filtro de conteúdo. Tente descrever de outro jeito.";

    await processarAviso(aviso("CriacaoFalhou", { criacaoId: "c-1", motivo, definitiva: true }), fakes);

    expect(await consultar()).toMatchObject({ status: "falhou", motivo, recusada: true });
  });

  it("CriacaoFalhou deixa a Criação falhou, com o motivo", async () => {
    const { fakes, consultar } = await criacaoNaFila();

    await processarAviso(aviso("CriacaoFalhou", { criacaoId: "c-1", motivo: "Kokoro falhou: sem memória" }), fakes);

    expect(await consultar()).toMatchObject({ status: "falhou", motivo: "Kokoro falhou: sem memória" });
  });

  it("o mesmo aviso entregue duas vezes não muda o resultado", async () => {
    const { fakes, consultar } = await criacaoNaFila();
    const concluida = aviso("CriacaoConcluida", { criacaoId: "c-1", chaveAudio: "narracoes/c-1.mp3" });

    await processarAviso(concluida, fakes);
    await processarAviso(concluida, fakes);

    expect(await consultar()).toMatchObject({ status: "pronta", chaveAudio: "narracoes/c-1.mp3" });
  });
});
