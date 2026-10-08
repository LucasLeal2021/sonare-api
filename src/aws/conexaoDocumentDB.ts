import { DescribeDBClustersCommand, DocDBClient } from "@aws-sdk/client-docdb";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import mongoose from "mongoose";
import type { Config } from "../config";

/**
 * Conecta no DocumentDB: credenciais do Secrets Manager e endereço do DescribeDBClusters
 * (no Floci o endereço é o IP do container e pode mudar; nunca o guardamos).
 */
export async function conectarDocumentDB(config: Config) {
  const segredo = await new SecretsManagerClient({}).send(new GetSecretValueCommand({ SecretId: config.documentdbSegredo }));
  const { usuario, senha } = JSON.parse(segredo.SecretString!);

  const { DBClusters = [] } = await new DocDBClient({}).send(
    new DescribeDBClustersCommand({ DBClusterIdentifier: config.documentdbCluster }),
  );
  const { Endpoint, Port } = DBClusters[0] ?? {};
  if (!Endpoint) throw new Error(`cluster ${config.documentdbCluster} sem endereço — ele está "available"?`);

  // Na AWS real o DocumentDB exige também tls=true, replicaSet=rs0 e retryWrites=false;
  // o Floci não implementa TLS (ADR 0002: diferenças registradas).
  const url = `mongodb://${encodeURIComponent(usuario)}:${encodeURIComponent(senha)}@${Endpoint}:${Port}/sonare?authSource=admin`;
  return mongoose.createConnection(url).asPromise();
}
