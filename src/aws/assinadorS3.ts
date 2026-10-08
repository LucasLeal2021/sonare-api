import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Config } from "../config";
import type { AssinadorDeAudio } from "../portas";

const VALIDADE_SEGUNDOS = 60 * 60; // o link vale 1 hora

/**
 * Assina links para o NAVEGADOR baixar o Áudio do bucket privado.
 * `endpointPublico` é o endereço que o navegador enxerga: no Floci, http://localhost:4566
 * (dentro do Docker ele é "floci:4566", que o navegador não conhece). Na AWS real fica
 * vazio e o SDK usa o endereço normal do S3 — e depois o CloudFront assume esse papel.
 */
export function criarAssinadorS3(config: Config, endpointPublico = process.env.S3_ENDPOINT_PUBLICO): AssinadorDeAudio {
  // Assinar não faz nenhuma chamada de rede: o endereço só entra no cálculo da assinatura
  const s3 = new S3Client(endpointPublico ? { endpoint: endpointPublico, forcePathStyle: true } : {});

  return {
    urlParaOuvir(chaveAudio) {
      return getSignedUrl(s3, new GetObjectCommand({ Bucket: config.bucketCriacoes, Key: chaveAudio }), {
        expiresIn: VALIDADE_SEGUNDOS,
      });
    },
  };
}
