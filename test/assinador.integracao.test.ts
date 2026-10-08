// Integração: a URL é assinada para o endereço que o NAVEGADOR enxerga (S3_ENDPOINT_PUBLICO),
// não para o "floci:4566" que só existe dentro da rede Docker.
import { describe, expect, it } from "vitest";
import { criarAssinadorS3 } from "../src/aws/assinadorS3";
import { carregarConfig } from "../src/config";

describe("assinador de Áudio (S3 no Floci)", () => {
  it("gera um link temporário, no endereço público, para o Áudio pedido", async () => {
    const config = await carregarConfig();

    const url = new URL(await criarAssinadorS3(config, "http://localhost:4566").urlParaOuvir("narracoes/c-1.mp3"));

    expect(url.origin).toBe("http://localhost:4566");
    expect(url.pathname).toBe(`/${config.bucketCriacoes}/narracoes/c-1.mp3`);
    expect(url.searchParams.get("X-Amz-Expires")).toBe("3600");
    expect(url.searchParams.get("X-Amz-Signature")).toBeTruthy();
  });
});
