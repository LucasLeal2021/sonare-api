---
status: superseded by ADR-0011
---

# Geração via Hugging Face Space, atrás de uma interface

A Geração precisava de música com voz cantada e de custo zero. Rodar um modelo com voz (ACE-Step, DiffRhythm, YuE) localmente é inviável sem GPU NVIDIA, e as APIs pagas estão fora do orçamento; por isso o worker chamaria o Space público do ACE-Step, usando a cota gratuita de GPU (ZeroGPU) do Hugging Face, atrás da interface `GeradorDeMusica` com um `GeradorFake` para o dia a dia.

## Por que foi substituída

O protótipo (branch `prototipo/ace-step` do `sonare-ia`) mostrou que a cota gratuita de ZeroGPU cobre cerca de **uma** Geração por dia (cada pedido reserva 60 s de GPU), e que chamadas de fora do site eram recusadas sem mensagem de erro. Música com voz cantada de graça não sustenta nem a Cota diária de um único Artista, então o produto mudou para Narrações e Imagens (ADR 0011).
