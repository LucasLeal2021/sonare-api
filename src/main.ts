import { randomUUID } from "node:crypto";
import { construirApp } from "./app";
import { conectarDocumentDB } from "./aws/conexaoDocumentDB";
import { criarFilaSQS } from "./aws/filaSQS";
import { criarRepositorioMongo } from "./aws/repositorioMongo";
import { carregarConfig } from "./config";
import { consumirAvisos, log } from "./consumidorDeAvisos";

const config = await carregarConfig();
const repositorio = criarRepositorioMongo(await conectarDocumentDB(config));
const app = construirApp({ repositorio, fila: criarFilaSQS(config), gerarId: randomUUID });

const porta = Number(process.env.PORTA ?? 3333);
await app.listen({ host: "0.0.0.0", port: porta });
log({ evento: "api iniciada", porta });

void consumirAvisos(config, { repositorio });
