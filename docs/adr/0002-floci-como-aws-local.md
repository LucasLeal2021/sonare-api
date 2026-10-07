# Floci como AWS local, limitado aos serviços que ele emula

Todo o ambiente roda localmente no Floci (https://floci.io), e só usamos serviços AWS presentes na lista oficial em https://floci.io/aws/#services. Nada de endpoint fixo no código: tudo vem de configuração por ambiente (`local` aponta para `http://localhost:4566`), para que a mesma infraestrutura possa um dia ir para a AWS real.

## Consequences

- CloudFront, Route 53 e ACM são apenas plano de controle no Floci: o Terraform deles é escrito e aplicado, mas cache, DNS e HTTPS de verdade só existem na AWS real.
- "Estar na lista" não garante comportamento idêntico à AWS (ex.: se security groups realmente bloqueiam tráfego). Diferenças descobertas devem ser registradas em ADRs.
