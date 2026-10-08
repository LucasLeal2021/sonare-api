// Versões falsas das fronteiras da API (DocumentDB, fila de Gerações, S3), para os testes rápidos.
import type {
  AssinadorDeArquivos,
  Criacao,
  FilaDeGeracoes,
  MensagemDeGeracao,
  RemovedorDeArquivos,
  RepositorioDeCriacoes,
} from "../src/portas";

export function criarFakes() {
  const criacoes = new Map<string, Criacao>();
  const publicadas: MensagemDeGeracao[] = [];
  const apagados: string[] = [];

  const repositorio: RepositorioDeCriacoes = {
    async criar(criacao) {
      criacoes.set(criacao.criacaoId, { ...criacao });
    },
    async apagar(criacaoId) {
      criacoes.delete(criacaoId);
    },
    async buscar(criacaoId) {
      return criacoes.get(criacaoId) ?? null;
    },
    async listar({ limite, depoisDe, tipo }) {
      const maisNovasPrimeiro = [...criacoes.values()].reverse().filter((c) => !tipo || c.tipo === tipo); // o Map guarda na ordem de criação
      const inicio = depoisDe ? maisNovasPrimeiro.findIndex((c) => c.criacaoId === depoisDe) + 1 : 0;
      return maisNovasPrimeiro.slice(inicio, inicio + limite);
    },
    async marcarPronta(criacaoId, resultado) {
      const c = criacoes.get(criacaoId);
      if (c) criacoes.set(criacaoId, { ...c, status: "pronta", ...resultado } as Criacao);
    },
    async marcarFalhou(criacaoId, motivo, opcoes) {
      const c = criacoes.get(criacaoId);
      if (c) criacoes.set(criacaoId, { ...c, status: "falhou", motivo, ...(opcoes?.definitiva ? { recusada: true } : {}) });
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

  const assinador: AssinadorDeArquivos = {
    async urlParaBaixar(chave, opcoes) {
      return `https://arquivo.falso/${chave}${opcoes?.baixarComo ? `?baixarComo=${opcoes.baixarComo}` : ""}`;
    },
  };

  const arquivos: RemovedorDeArquivos & { apagados: string[] } = {
    async apagar(chave) {
      apagados.push(chave);
    },
    apagados,
  };

  return { repositorio, fila, gerarId, assinador, arquivos };
}
