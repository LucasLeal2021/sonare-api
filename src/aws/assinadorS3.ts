import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Config } from "../config";
import type { AssinadorDeArquivos, RemovedorDeArquivos } from "../portas";

/** Apaga Áudios e Imagens do bucket. Este fala com o S3 pelo endereço interno (floci:4566), não o público. */
export function criarRemovedorS3(config: Config): RemovedorDeArquivos {
  const s3 = new S3Client({ forcePathStyle: Boolean(process.env.AWS_ENDPOINT_URL) });
  return {
    async apagar(chave) {
      await s3.send(new DeleteObjectCommand({ Bucket: config.bucketCriacoes, Key: chave }));
    },
  };
}

const VALIDADE_SEGUNDOS = 60 * 60; // o link vale 1 hora

/**
 * Assina links para o NAVEGADOR baixar Áudios e Imagens do bucket privado.
 * `endpointPublico` é o endereço que o navegador enxerga: no Floci, http://localhost:4566
 * (dentro do Docker ele é "floci:4566", que o navegador não conhece). Na AWS real fica
 * vazio e o SDK usa o endereço normal do S3 — e depois o CloudFront assume esse papel.
 */
export function criarAssinadorS3(config: Config, endpointPublico = process.env.S3_ENDPOINT_PUBLICO): AssinadorDeArquivos {
  // Assinar não faz nenhuma chamada de rede: o endereço só entra no cálculo da assinatura
  const s3 = new S3Client(endpointPublico ? { endpoint: endpointPublico, forcePathStyle: true } : {});

  return {
    urlParaBaixar(chave, opcoes) {
      const comando = new GetObjectCommand({
        Bucket: config.bucketCriacoes,
        Key: chave,
        // O S3 responde com este cabeçalho em vez do original: o navegador salva o arquivo
        // em vez de abri-lo (o atributo `download` do <a> não vale para links de outro endereço)
        ResponseContentDisposition: opcoes?.baixarComo ? `attachment; filename="${opcoes.baixarComo}"` : undefined,
      });
      return getSignedUrl(s3, comando, { expiresIn: VALIDADE_SEGUNDOS });
    },
  };
}
