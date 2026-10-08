// Integração: links pré-assinados de verdade, no S3 do Floci.
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { criarAssinadorS3, criarRemovedorS3 } from "../src/aws/assinadorS3";
import { carregarConfig } from "../src/config";

describe("assinador de arquivos (S3 no Floci)", () => {
  it("gera um link temporário no endereço que o NAVEGADOR enxerga (localhost, não floci)", async () => {
    const config = await carregarConfig();

    const url = new URL(await criarAssinadorS3(config, "http://localhost:4566").urlParaBaixar("narracoes/c-1.mp3"));

    expect(url.origin).toBe("http://localhost:4566");
    expect(url.pathname).toBe(`/${config.bucketCriacoes}/narracoes/c-1.mp3`);
    expect(url.searchParams.get("X-Amz-Expires")).toBe("3600");
    expect(url.searchParams.get("X-Amz-Signature")).toBeTruthy();
  });

  it("o link com baixarComo faz o S3 responder 'attachment', com o nome do arquivo", async () => {
    const config = await carregarConfig();
    const chave = `testes/${randomUUID()}.jpg`;
    await new S3Client({ forcePathStyle: true }).send(
      new PutObjectCommand({ Bucket: config.bucketCriacoes, Key: chave, Body: "jpg falso", ContentType: "image/jpeg" }),
    );

    // Assinado para "floci:4566" só para este teste conseguir baixar de dentro da rede Docker
    const url = await criarAssinadorS3(config, "http://floci:4566").urlParaBaixar(chave, { baixarComo: "sonare-um-farol.jpg" });
    const resposta = await fetch(url);

    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("content-disposition")).toBe('attachment; filename="sonare-um-farol.jpg"');
  });

  it("um arquivo apagado some do bucket", async () => {
    const config = await carregarConfig();
    const s3 = new S3Client({ forcePathStyle: true });
    const chave = `testes/${randomUUID()}.jpg`;
    await s3.send(new PutObjectCommand({ Bucket: config.bucketCriacoes, Key: chave, Body: "jpg falso" }));

    await criarRemovedorS3(config).apagar(chave);

    await expect(s3.send(new HeadObjectCommand({ Bucket: config.bucketCriacoes, Key: chave }))).rejects.toThrow();
  });
});
