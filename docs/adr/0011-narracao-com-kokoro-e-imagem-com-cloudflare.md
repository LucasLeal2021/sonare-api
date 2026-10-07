# Narração com Kokoro local e Imagem com Cloudflare Workers AI

A Sonare gera dois tipos de Criação, ambos de graça e com folga diária. A Narração usa o Kokoro-82M (`kokoro-onnx`) rodando **dentro da EC2 do worker**, na CPU, sem chave nem limite externo, com as vozes PT-BR `pf_dora` (padrão, a única feminina), `pm_alex` e `pm_santa`; o `ffmpeg` converte o WAV em MP3. A Imagem usa o FLUX.1 schnell da Cloudflare Workers AI, cuja cota gratuita de 10.000 neurons por dia (renovada à 00:00 UTC) cobre centenas de imagens 1024×1024; como o modelo entende inglês muito melhor, o worker traduz a Descrição com o `m2m100` da própria Cloudflare para montar o Prompt.

## Considered Options

- **Piper** (TTS local, ~4× mais rápido que o Kokoro): rejeitado no protótipo — as quatro vozes PT-BR são masculinas e soam com sotaque americano, por serem derivadas de uma voz em inglês.
- **Vozes da Cloudflare** (MeloTTS, Aura): não falam português.
- **Azure / Google TTS** (qualidade superior): cota mensal e cadastro com cartão; ficam como alternativa se a qualidade do Kokoro deixar de bastar.
- **Descrição em português direto no FLUX**: o modelo ignorou partes da Descrição ("falésia", "aquarela").

## Consequences

- O Kokoro gera ~2,3× mais rápido que o tempo real (1.000 caracteres ≈ 25 s); com o worker processando uma Geração por vez, Narrações longas formam fila.
- O Kokoro roda em Python, e o worker é TypeScript: a forma de integração entre os dois ainda precisa ser decidida.
- A cota da Cloudflare é **compartilhada por todos os Artistas**; por isso a Cota diária é separada por tipo (Imagem tem cota menor que Narração).
- A ADR 0002 restringe os **serviços AWS** aos que o Floci emula; a Cloudflare é um provedor externo chamado pela internet, e a chave dela fica no Secrets Manager.
- Cada gerador fica atrás de uma interface (`GeradorDeNarracao`, `GeradorDeImagem`) com implementação falsa para testes.
