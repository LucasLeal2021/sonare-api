import { randomUUID } from "node:crypto";
import { construirApp } from "./app";
import { criarAssinadorS3, criarRemovedorS3 } from "./aws/assinadorS3";
import { conectarDocumentDB } from "./aws/conexaoDocumentDB";
import { criarFilaSQS } from "./aws/filaSQS";
import { criarRepositorioMongo } from "./aws/repositorioMongo";
import { carregarConfig } from "./config";
import { consumirAvisos, log } from "./consumidorDeAvisos";

const config = await carregarConfig();
const repositorio = criarRepositorioMongo(await conectarComInsistencia());
const app = construirApp({
  repositorio,
  fila: criarFilaSQS(config),
  assinador: criarAssinadorS3(config),
  arquivos: criarRemovedorS3(config),
  gerarId: randomUUID,
});

const porta = Number(process.env.PORTA ?? 3333);
await app.listen({ host: "0.0.0.0", port: porta });
log({ evento: "api iniciada", porta });

void consumirAvisos(config, { repositorio });

// Se o banco não responde ao iniciar (ex.: o Mongo do Floci não voltou depois de reiniciar o
// Docker), espera e tenta de novo em vez de derrubar a API sem avisar ninguém.
async function conectarComInsistencia() {
  while (true) {
    try {
      return await conectarDocumentDB(config);
    } catch (erro) {
      log({ evento: "aguardando DocumentDB", erro: (erro as Error).message });
      await new Promise((resolver) => setTimeout(resolver, 5_000));
    }
  }
}
