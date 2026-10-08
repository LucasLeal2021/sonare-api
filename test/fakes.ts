// Versões falsas das fronteiras da API (DocumentDB e fila de Gerações), para os testes rápidos.
import type { AssinadorDeAudio, Criacao, FilaDeGeracoes, MensagemDeGeracao, RepositorioDeCriacoes } from "../src/portas";

export function criarFakes() {
  const criacoes = new Map<string, Criacao>();
  const publicadas: MensagemDeGeracao[] = [];

  const repositorio: RepositorioDeCriacoes = {
    async criar(criacao) {
      criacoes.set(criacao.criacaoId, { ...criacao });
    },
    async buscar(criacaoId) {
      return criacoes.get(criacaoId) ?? null;
    },
    async listar({ limite, depoisDe }) {
      const maisNovasPrimeiro = [...criacoes.values()].reverse(); // o Map guarda na ordem de criação
      const inicio = depoisDe ? maisNovasPrimeiro.findIndex((c) => c.criacaoId === depoisDe) + 1 : 0;
      return maisNovasPrimeiro.slice(inicio, inicio + limite);
    },
    async marcarPronta(criacaoId, chaveAudio) {
      const c = criacoes.get(criacaoId);
      if (c) criacoes.set(criacaoId, { ...c, status: "pronta", chaveAudio });
    },
    async marcarFalhou(criacaoId, motivo) {
      const c = criacoes.get(criacaoId);
      if (c) criacoes.set(criacaoId, { ...c, status: "falhou", motivo });
    },
  };

  const fila: FilaDeGeracoes & { publicadas: MensagemDeGeracao[] } = {
    async publicar(mensagem) {
      publicadas.push(mensagem);
    },
    publicadas,
  };

  let proximo = 0;
  const gerarId = () => `c-${++proximo}`;

  const assinador: AssinadorDeAudio = {
    async urlParaOuvir(chaveAudio) {
      return `https://audio.falso/${chaveAudio}`;
    },
  };

  return { repositorio, fila, gerarId, assinador };
}
