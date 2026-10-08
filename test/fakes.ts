// Versões falsas das fronteiras da API (DocumentDB e fila de Gerações), para os testes rápidos.
import type { Criacao, FilaDeGeracoes, MensagemDeGeracao, RepositorioDeCriacoes } from "../src/portas";

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

  return { repositorio, fila, gerarId };
}
