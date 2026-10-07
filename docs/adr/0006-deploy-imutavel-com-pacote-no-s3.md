# Deploy imutável com pacote no S3 e migrations no UserData

Cada deploy compila e testa o código uma vez, envia um pacote versionado pelo commit para um bucket de artefatos e faz o Terraform recriar a EC2, cujo UserData baixa o pacote, roda `sequelize db:migrate` (só na API) e inicia o processo. Rejeitamos `git clone` + build no boot porque o que roda deixaria de ser exatamente o que foi testado, e rejeitamos atualizar máquinas via SSH para que nenhuma instância acumule estado manual.

## Consequences

- Migrations no UserData só são seguras porque existe **uma** instância da API. Ao passar para mais de uma (ex.: Auto Scaling), elas devem virar um passo separado do pipeline (ex.: SSM Run Command) antes da troca das instâncias.
- Recriar a instância causa uma breve indisponibilidade a cada deploy, aceita na v1.
