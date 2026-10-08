import { describe, expect, it } from "vitest";
import { construirApp } from "../src/app";
import { processarAviso } from "../src/avisos";
import { criarFakes } from "./fakes";

async function preparar(quantas: number) {
  const fakes = criarFakes();
  const app = construirApp(fakes);
  for (let i = 1; i <= quantas; i++) {
    await app.inject({ method: "POST", url: "/criacoes", payload: { tipo: "narracao", texto: `Texto ${i}`, voz: "pf_dora" } });
  }
  const listar = async (url = "/criacoes") => (await app.inject({ method: "GET", url })).json();
  return { fakes, listar };
}

const ids = (pagina: { criacoes: { criacaoId: string }[] }) => pagina.criacoes.map((c) => c.criacaoId);

describe("GET /criacoes (Biblioteca)", () => {
  it("lista as Criações da mais nova para a mais antiga", async () => {
    const { listar } = await preparar(3);

    expect(ids(await listar())).toEqual(["c-3", "c-2", "c-1"]);
  });

  it("uma Criação pronta vem com a URL para ouvir o Áudio", async () => {
    const { fakes, listar } = await preparar(1);
    const aviso = { "detail-type": "CriacaoConcluida", detail: { criacaoId: "c-1", chaveAudio: "narracoes/c-1.mp3" } };
    await processarAviso(JSON.stringify(aviso), fakes);

    const [criacao] = (await listar()).criacoes;

    expect(criacao).toMatchObject({ status: "pronta", urlAudio: "https://audio.falso/narracoes/c-1.mp3" });
  });

  it("mostra 20 por página e indica onde continuar para carregar mais", async () => {
    const { listar } = await preparar(21);

    const primeira = await listar();
    const segunda = await listar(`/criacoes?depoisDe=${primeira.proximaPagina}`);

    expect(primeira.criacoes).toHaveLength(20);
    expect(ids(primeira)[0]).toBe("c-21");
    expect(ids(segunda)).toEqual(["c-1"]);
    expect(segunda.proximaPagina).toBeUndefined();
  });
});
