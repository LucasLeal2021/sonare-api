import { DescribeDBClustersCommand, DocDBClient } from "@aws-sdk/client-docdb";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import mongoose from "mongoose";
import type { Config } from "../config";

/**
 * Conecta no DocumentDB: credenciais do Secrets Manager e endereço do DescribeDBClusters.
 *
 * DOCUMENTDB_HOST (só no ambiente local) passa por cima do endereço informado: o Floci informa
 * o IP do container Mongo e não o atualiza quando o container reinicia com outro IP (ADR 0002).
 * Na rede Docker, o NOME do container resolve sempre para o IP certo. Na AWS real a variável
 * não existe e vale o endereço do DescribeDBClusters, que lá é um nome DNS estável.
 */
export async function conectarDocumentDB(config: Config) {
  const segredo = await new SecretsManagerClient({}).send(new GetSecretValueCommand({ SecretId: config.documentdbSegredo }));
  const { usuario, senha } = JSON.parse(segredo.SecretString!);

  const { DBClusters = [] } = await new DocDBClient({}).send(
    new DescribeDBClustersCommand({ DBClusterIdentifier: config.documentdbCluster }),
  );
  const { Endpoint, Port } = DBClusters[0] ?? {};
  const host = process.env.DOCUMENTDB_HOST ?? Endpoint;
  if (!host) throw new Error(`cluster ${config.documentdbCluster} sem endereço — ele está "available"?`);

  // Na AWS real o DocumentDB exige também tls=true, replicaSet=rs0 e retryWrites=false;
  // o Floci não implementa TLS (ADR 0002: diferenças registradas).
  // Os testes de integração usam outro banco (DOCUMENTDB_BANCO=sonare-testes) para não sujar a Biblioteca
  const banco = process.env.DOCUMENTDB_BANCO ?? "sonare";
  const url = `mongodb://${encodeURIComponent(usuario)}:${encodeURIComponent(senha)}@${host}:${Port}/${banco}?authSource=admin`;
  return mongoose.createConnection(url, { serverSelectionTimeoutMS: 5_000 }).asPromise();
}
