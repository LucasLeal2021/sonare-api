# Floci como AWS local, limitado aos serviços que ele emula

Todo o ambiente roda localmente no Floci (https://floci.io), e só usamos serviços AWS presentes na lista oficial em https://floci.io/aws/#services. Nada de endpoint fixo no código: tudo vem de configuração por ambiente (`local` aponta para `http://localhost:4566`), para que a mesma infraestrutura possa um dia ir para a AWS real.

## Consequences

- CloudFront, Route 53 e ACM são apenas plano de controle no Floci: o Terraform deles é escrito e aplicado, mas cache, DNS e HTTPS de verdade só existem na AWS real.
- "Estar na lista" não garante comportamento idêntico à AWS (ex.: se security groups realmente bloqueiam tráfego). Diferenças descobertas devem ser registradas em ADRs.

## Diferenças já descobertas

- **DocumentDB sem TLS nem IAM:** o Floci não implementa conexões TLS nem login via IAM; a connection string local não usa `tls=true`.
- **O Mongo do DocumentDB não religa sozinho:** o Floci cria um container `floci-docdb-<cluster>` fora do nosso `docker-compose`; quando o Docker reinicia, ele fica parado até `docker start floci-docdb-sonare-local-criacoes`, mesmo com o cluster ainda informado como `available`.
- **O endereço informado pelo DocumentDB fica velho:** `DescribeDBClusters` devolve o IP do container na criação e não o atualiza quando o container volta com outro IP. Localmente a API usa `DOCUMENTDB_HOST` (o nome do container, que o Docker resolve sempre) no lugar desse endereço.
- **URLs de fila com o host `floci`:** as URLs do SQS usam o `FLOCI_HOSTNAME` (`floci:4566`), que só existe dentro da rede Docker; por isso worker e API rodam em containers na `sonare-net`, e links que o navegador usa são assinados para `localhost:4566` (`S3_ENDPOINT_PUBLICO`).
