# Sonare

App em PT-BR onde o Artista cria Narrações (voz) e Imagens. Projeto de **estudo de infraestrutura AWS local com o Floci**, em três repositórios irmãos em `C:\dev`: `sonare-api` (este: API + infra), `sonare-ia` (worker), `sonare-web` (Next.js).

## Leia antes de trabalhar

- `CONTEXT.md`: o glossário. Use esses termos no código, nos testes e na tela.
- `docs/roteiro.md`: o que está pronto e o próximo passo. Comece por aqui ao retomar.
- `docs/escopo-v1.md`: as decisões de produto do `/grilling`.
- `docs/adr/`: as decisões de arquitetura e por quê. Consulte antes de mudar algo que uma ADR cobre.
- `README.md`: a rotina para subir tudo e o setup inicial.

## Como trabalhar com o Lucas

- Ele está **aprendendo infra**: explique cada comando novo, o que ele faz e o que esperar na saída.
- **Ele roda os comandos de infra e operação** (Terraform, `docker compose`, AWS CLI, apagar dados). Passe os comandos em sintaxe Git Bash, em ordem, dizendo o que ele deve mostrar de volta. Você escreve o código e roda testes; confirme antes de qualquer ação destrutiva ou que ele queira fazer à mão.
- Commits: normalmente ele faz. Quando pedir para você, faça **um repositório por vez** (em paralelo o diretório do shell se confunde). O e-mail pessoal já vem do `includeIf` do git em `C:\dev`.
- Decisões novas: use `/grilling` (perguntas numeradas, cada uma com recomendação). Decisão difícil de desfazer vira ADR (`/domain-modeling`).
- Código novo: `/tdd`. Combine os seams com ele antes do primeiro teste; vermelho antes de verde.

## Regras do projeto

- Serviços AWS: **só os da lista do Floci** (https://floci.io/aws/#services). APIs de terceiros (Cloudflare) são permitidas.
- Endereços e nomes vêm do SSM Parameter Store (publicados pelo `infra/base`) ou de variáveis de ambiente; o código funciona igual no Floci e na AWS real.
- Segredos só no Secrets Manager (e no `.env` local, fora do git). Nunca em código, logs ou chat.
- Testes de integração rodam **dentro do container** e usam recursos isolados (banco `sonare-testes`, filas e regras temporárias), para funcionar com a rotina ligada.

## Pegadinhas já descobertas

- **Git Bash:** caminhos que começam com `/` viram caminhos do Windows → prefixe `MSYS_NO_PATHCONV=1`. `node` é apelido de `winpty node` e quebra em pipes → use `node.exe`. JSON com acentos como argumento da AWS CLI ou do curl se corrompe → passe por arquivo (`file://`, `--data-binary @arquivo`).
- **Containers de dev:** depois de instalar uma dependência, `docker compose up --build -V` (sem o `-V`, o `node_modules` antigo do volume anônimo continua). O recarregamento é o `nodemon --legacy-watch`, porque o Docker no Windows não avisa mudanças de arquivo.
- **Floci:** o Mongo do DocumentDB (`floci-docdb-sonare-local-criacoes`) não religa sozinho (o serviço `religar-documentdb` do compose cuida disso) e o IP que o Floci informa fica velho (a API usa `DOCUMENTDB_HOST`). Mais diferenças na ADR 0002.
- **Processos em segundo plano:** parar uma tarefa em background não mata os `node.exe` filhos; confira e encerre os que sobrarem.
