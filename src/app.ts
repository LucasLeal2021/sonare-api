import Fastify from "fastify";
import { lerPedidoDeNarracao } from "./pedidoDeNarracao";
import type { AssinadorDeAudio, Criacao, FilaDeGeracoes, RepositorioDeCriacoes } from "./portas";

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

  // A Biblioteca: da mais nova para a mais antiga, POR_PAGINA de cada vez (Q22)
  app.get("/criacoes", async (requisicao) => {
    const { depoisDe } = requisicao.query as { depoisDe?: string };
    // Pede uma a mais só para saber se existe próxima página
    const encontradas = await deps.repositorio.listar({ limite: POR_PAGINA + 1, depoisDe });
    const pagina = encontradas.slice(0, POR_PAGINA);
    return {
      criacoes: await Promise.all(pagina.map(comLinkDoAudio)),
      proximaPagina: encontradas.length > POR_PAGINA ? pagina.at(-1)!.criacaoId : undefined,
    };
  });

  app.get("/criacoes/:id", async (requisicao, resposta) => {
    const { id } = requisicao.params as { id: string };
    const criacao = await deps.repositorio.buscar(id);
    if (!criacao) return resposta.code(404).send({ erro: "Criação não encontrada." });
    return comLinkDoAudio(criacao);
  });

  async function comLinkDoAudio(criacao: Criacao) {
    if (!criacao.chaveAudio) return criacao;
    return { ...criacao, urlAudio: await deps.assinador.urlParaOuvir(criacao.chaveAudio) };
  }

  return app;
}

const POR_PAGINA = 20;
