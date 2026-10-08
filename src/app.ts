import Fastify from "fastify";
import { lerPedido } from "./pedidos";
import type {
  AssinadorDeArquivos,
  Criacao,
  FilaDeGeracoes,
  RemovedorDeArquivos,
  RepositorioDeCriacoes,
  TipoDeCriacao,
} from "./portas";

export type Dependencias = {
  repositorio: RepositorioDeCriacoes;
  fila: FilaDeGeracoes;
  assinador: AssinadorDeArquivos;
  arquivos: RemovedorDeArquivos;
  gerarId: () => string;
};

const POR_PAGINA = 20;

/** "Um farol solitário, numa falésia!" → "um-farol-solitario-numa-falesia" (até 6 palavras). */
function nomeDeArquivo(criacao: Criacao) {
  const base = criacao.tipo === "narracao" ? criacao.texto : criacao.descricao;
  const palavras = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tira os acentos
    .toLowerCase()
    .match(/[a-z0-9]+/g);
  return palavras?.slice(0, 6).join("-") || criacao.criacaoId;
}

export function construirApp(deps: Dependencias) {
  const app = Fastify();

  app.post("/criacoes", async (requisicao, resposta) => {
    const pedido = lerPedido(requisicao.body);
    if ("erro" in pedido) return resposta.code(400).send({ erro: pedido.erro });

    const criacaoId = deps.gerarId();
    await deps.repositorio.criar({ criacaoId, status: "na-fila", ...pedido });
    await deps.fila.publicar({ versao: 1, criacaoId, ...pedido });

    return resposta.code(201).send({ criacaoId, status: "na-fila" });
  });

  // A Biblioteca: da mais nova para a mais antiga, POR_PAGINA de cada vez (Q22), opcionalmente de um tipo só
  app.get("/criacoes", async (requisicao) => {
    const { depoisDe, tipo } = requisicao.query as { depoisDe?: string; tipo?: TipoDeCriacao };
    // Pede uma a mais só para saber se existe próxima página
    const encontradas = await deps.repositorio.listar({ limite: POR_PAGINA + 1, depoisDe, tipo });
    const pagina = encontradas.slice(0, POR_PAGINA);
    return {
      criacoes: await Promise.all(pagina.map(comLinks)),
      proximaPagina: encontradas.length > POR_PAGINA ? pagina.at(-1)!.criacaoId : undefined,
    };
  });

  app.get("/criacoes/:id", async (requisicao, resposta) => {
    const { id } = requisicao.params as { id: string };
    const criacao = await deps.repositorio.buscar(id);
    if (!criacao) return resposta.code(404).send({ erro: "Criação não encontrada." });
    return comLinks(criacao);
  });

  // Apagar é definitivo (Q19): o arquivo no bucket e o registro. Só depois que a Geração terminou,
  // porque o worker ainda pode estar trabalhando numa Criação na fila. Não gera Devolução da Cota.
  app.delete("/criacoes/:id", async (requisicao, resposta) => {
    const { id } = requisicao.params as { id: string };
    const criacao = await deps.repositorio.buscar(id);
    if (!criacao) return resposta.code(404).send({ erro: "Criação não encontrada." });
    if (criacao.status === "na-fila") return resposta.code(409).send({ erro: "Espere a Criação terminar para apagá-la." });

    // Primeiro o arquivo: se isso falhar, o registro continua e dá para tentar de novo
    const chave = criacao.tipo === "narracao" ? criacao.chaveAudio : criacao.chaveImagem;
    if (chave) await deps.arquivos.apagar(chave);
    await deps.repositorio.apagar(id);
    return resposta.code(204).send();
  });

  // Acrescenta os links temporários: um para ouvir o Áudio / ver a Imagem, outro para baixar o arquivo
  async function comLinks(criacao: Criacao) {
    const link = (chave: string, extensao: string) =>
      Promise.all([
        deps.assinador.urlParaBaixar(chave),
        deps.assinador.urlParaBaixar(chave, { baixarComo: `sonare-${nomeDeArquivo(criacao)}.${extensao}` }),
      ]);
    if (criacao.tipo === "narracao" && criacao.chaveAudio) {
      const [urlAudio, urlDownload] = await link(criacao.chaveAudio, "mp3");
      return { ...criacao, urlAudio, urlDownload };
    }
    if (criacao.tipo === "imagem" && criacao.chaveImagem) {
      const [urlImagem, urlDownload] = await link(criacao.chaveImagem, "jpg");
      return { ...criacao, urlImagem, urlDownload };
    }
    return criacao;
  }

  return app;
}
