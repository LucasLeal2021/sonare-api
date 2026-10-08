// As fronteiras da API com o mundo de fora. Cada uma tem uma implementação real
// (DocumentDB, SQS, S3) e uma falsa para os testes rápidos.

export type Status = "na-fila" | "pronta" | "falhou";
export type TipoDeCriacao = "narracao" | "imagem";

/** `recusada`: a falha foi uma recusa definitiva do provedor (ex.: filtro de conteúdo), e o `motivo` é para o Artista ler. */
type Comum = { criacaoId: string; status: Status; motivo?: string; recusada?: boolean };

export type Criacao =
  | (Comum & { tipo: "narracao"; texto: string; voz: string; chaveAudio?: string })
  | (Comum & { tipo: "imagem"; descricao: string; chaveImagem?: string; prompt?: string });

/** O que o worker devolveu quando a Criação ficou pronta. */
export type ResultadoDaGeracao = { chaveAudio: string } | { chaveImagem: string; prompt: string };

export interface RepositorioDeCriacoes {
  criar(criacao: Criacao): Promise<void>;
  buscar(criacaoId: string): Promise<Criacao | null>;
  /** Da mais nova para a mais antiga; `depoisDe` é o criacaoId do último item da página anterior. */
  listar(opcoes: { limite: number; depoisDe?: string; tipo?: TipoDeCriacao }): Promise<Criacao[]>;
  marcarPronta(criacaoId: string, resultado: ResultadoDaGeracao): Promise<void>;
  marcarFalhou(criacaoId: string, motivo: string, opcoes?: { definitiva?: boolean }): Promise<void>;
  apagar(criacaoId: string): Promise<void>;
}

export interface RemovedorDeArquivos {
  /** Apaga um arquivo (Áudio ou Imagem) do bucket. Apagar o que já não existe não é erro. */
  apagar(chave: string): Promise<void>;
}

/** A mensagem que o worker (sonare-ia) espera na fila de Gerações. */
export type MensagemDeGeracao =
  | { versao: 1; criacaoId: string; tipo: "narracao"; texto: string; voz: string }
  | { versao: 1; criacaoId: string; tipo: "imagem"; descricao: string };

export interface FilaDeGeracoes {
  publicar(mensagem: MensagemDeGeracao): Promise<void>;
}

export interface AssinadorDeArquivos {
  /**
   * Um link temporário para o navegador pegar um arquivo (Áudio ou Imagem) direto do bucket privado.
   * Com `baixarComo`, o navegador salva o arquivo com esse nome em vez de abri-lo.
   */
  urlParaBaixar(chave: string, opcoes?: { baixarComo?: string }): Promise<string>;
}
