# Narração com Piper local e Imagem com Cloudflare Workers AI

A Sonare gera dois tipos de Criação, ambos de graça e com folga diária. A Narração usa o Piper (TTS open source, vozes PT-BR `cadu`, `edresson`, `faber`, `jeff`) rodando **dentro da EC2 do worker**, na CPU, sem chave nem limite externo; o `ffmpeg` converte o WAV em MP3. A Imagem usa o FLUX.1 schnell da Cloudflare Workers AI, cuja cota gratuita de 10.000 neurons por dia (renovada à 00:00 UTC) cobre centenas de imagens 1024×1024. Os modelos de voz da Cloudflare não foram usados porque não falam português.

## Consequences

- A cota da Cloudflare é **compartilhada por todos os Artistas**; por isso a Cota diária é separada por tipo (Imagem tem cota menor que Narração).
- A ADR 0002 restringe os **serviços AWS** aos que o Floci emula; a Cloudflare é um provedor externo chamado pela internet, como seria qualquer API de terceiros, e a chave dela fica no Secrets Manager.
- Cada gerador fica atrás de uma interface (`GeradorDeNarracao`, `GeradorDeImagem`) com implementação falsa para testes.
- Vozes, velocidade do Piper na CPU e qualidade das Imagens com Descrição em PT ainda serão validadas no `/prototype`; possivelmente todas as vozes PT-BR são masculinas (limitação aceita na v1).
