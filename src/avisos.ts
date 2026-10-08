import type { RepositorioDeCriacoes } from "./portas";

/**
 * Trata um aviso do worker que chegou na fila de Criações concluídas.
 * O corpo é o envelope do EventBridge: o tipo vem em `detail-type` e os dados em `detail`.
 * Aplicar o mesmo aviso duas vezes dá o mesmo resultado (a SQS pode entregar em dobro).
 */
export async function processarAviso(corpo: string, deps: { repositorio: RepositorioDeCriacoes }) {
  const evento = JSON.parse(corpo);
  const { criacaoId, chaveAudio, motivo } = evento.detail ?? {};

  switch (evento["detail-type"]) {
    case "CriacaoConcluida":
      return deps.repositorio.marcarPronta(criacaoId, chaveAudio);
    case "CriacaoFalhou":
      return deps.repositorio.marcarFalhou(criacaoId, motivo);
  }
}
