import Fastify from "fastify";
import { lerPedidoDeNarracao } from "./pedidoDeNarracao";
import type { AssinadorDeAudio, FilaDeGeracoes, RepositorioDeCriacoes } from "./portas";

export type Dependencias = {
  repositorio: RepositorioDeCriacoes;
  fila: FilaDeGeracoes;
  assinador: AssinadorDeAudio;
  gerarId: () => string;
};

export function construirApp(deps: Dependencias) {
  const app = Fastify();

  app.post("/criacoes", async (requisicao, resposta) => {
    const pedido = lerPedidoDeNarracao(requisicao.body);
    if ("erro" in pedido) return resposta.code(400).send({ erro: pedido.erro });

    const { texto, voz } = pedido;
    const criacaoId = deps.gerarId();

    await deps.repositorio.criar({ criacaoId, tipo: "narracao", texto, voz, status: "na-fila" });
    await deps.fila.publicar({ versao: 1, criacaoId, tipo: "narracao", texto, voz });

    return resposta.code(201).send({ criacaoId, status: "na-fila" });
  });

  app.get("/criacoes/:id", async (requisicao, resposta) => {
    const { id } = requisicao.params as { id: string };
    const criacao = await deps.repositorio.buscar(id);
    if (!criacao) return resposta.code(404).send({ erro: "Criação não encontrada." });
    if (!criacao.chaveAudio) return criacao;
    return { ...criacao, urlAudio: await deps.assinador.urlParaOuvir(criacao.chaveAudio) };
  });

  return app;
}
