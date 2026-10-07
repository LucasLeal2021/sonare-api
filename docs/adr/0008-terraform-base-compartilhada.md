# Terraform com base compartilhada e state no S3

A infraestrutura é escrita em Terraform (escolhido em vez de CDK ou Pulumi por ser o padrão de mercado e oficialmente suportado pelo Floci). O que é compartilhado — VPC, RDS, DocumentDB, Cognito, SQS, buckets, segredos — vive em `sonare-api/infra/base` e publica seus identificadores no SSM Parameter Store; cada repositório tem um `infra/` só com a sua EC2 e lê de lá o que precisa, para que cada um faça deploy de forma independente. O state de cada stack fica num bucket S3 com lock nativo (`use_lockfile`), nunca em arquivo local nem no git.
