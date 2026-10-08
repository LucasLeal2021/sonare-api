// As mesmas regras que o worker confere (sonare-ia/src/processarMensagem.ts): a API recusa
// antes, com mensagem para o Artista; o worker confere de novo porque não confia na fila.
export const VOZES = { pf_dora: "dora", pm_alex: "alex", pm_santa: "santa" } as const;
const TEXTO_MAXIMO = 1000;

export type PedidoDeNarracao = { texto: string; voz: string };

export function lerPedidoDeNarracao(corpo: unknown): PedidoDeNarracao | { erro: string } {
  const { texto, voz } = (corpo ?? {}) as Record<string, unknown>;

  if (typeof texto !== "string" || !texto.trim()) return { erro: "Escreva o Texto da Narração." };
  if (texto.length > TEXTO_MAXIMO) return { erro: "O Texto pode ter no máximo 1.000 caracteres." };
  if (typeof voz !== "string" || !(voz in VOZES)) return { erro: "Escolha uma Voz válida: dora, alex ou santa." };

  return { texto, voz };
}
