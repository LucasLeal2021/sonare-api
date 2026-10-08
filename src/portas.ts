// As fronteiras da API com o mundo de fora. Cada uma tem uma implementação real
// (DocumentDB, SQS) e uma falsa para os testes rápidos.

export type Status = "na-fila" | "pronta" | "falhou";

export type Criacao = {
  criacaoId: string;
  tipo: "narracao";
  texto: string;
  voz: string;
  status: Status;
  chaveAudio?: string;
  motivo?: string;
};

export interface RepositorioDeCriacoes {
  criar(criacao: Criacao): Promise<void>;
  buscar(criacaoId: string): Promise<Criacao | null>;
  marcarPronta(criacaoId: string, chaveAudio: string): Promise<void>;
  marcarFalhou(criacaoId: string, motivo: string): Promise<void>;
}

/** A mensagem que o worker (sonare-ia) espera na fila de Gerações. */
export type MensagemDeGeracao = { versao: 1; criacaoId: string; tipo: "narracao"; texto: string; voz: string };

export interface FilaDeGeracoes {
  publicar(mensagem: MensagemDeGeracao): Promise<void>;
}
