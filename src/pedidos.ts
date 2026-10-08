// As mesmas regras que o worker confere (sonare-ia/src/processarMensagem.ts): a API recusa
// antes, com mensagem para o Artista; o worker confere de novo porque não confia na fila.
export const VOZES = { pf_dora: "dora", pm_alex: "alex", pm_santa: "santa" } as const;
const TEXTO_MAXIMO = 1000;
const DESCRICAO_MAXIMA = 500;

export type Pedido = { tipo: "narracao"; texto: string; voz: string } | { tipo: "imagem"; descricao: string };

export function lerPedido(corpo: unknown): Pedido | { erro: string } {
  const { tipo, texto, voz, descricao } = (corpo ?? {}) as Record<string, unknown>;

  if (tipo === "narracao") {
    if (typeof texto !== "string" || !texto.trim()) return { erro: "Escreva o Texto da Narração." };
    if (texto.length > TEXTO_MAXIMO) return { erro: "O Texto pode ter no máximo 1.000 caracteres." };
    if (typeof voz !== "string" || !(voz in VOZES)) return { erro: "Escolha uma Voz válida: dora, alex ou santa." };
    return { tipo, texto, voz };
  }

  if (tipo === "imagem") {
    if (typeof descricao !== "string" || !descricao.trim()) return { erro: "Descreva a Imagem que você quer." };
    if (descricao.length > DESCRICAO_MAXIMA) return { erro: "A Descrição pode ter no máximo 500 caracteres." };
    return { tipo, descricao };
  }

  return { erro: "Escolha o tipo de Criação: narração ou imagem." };
}
