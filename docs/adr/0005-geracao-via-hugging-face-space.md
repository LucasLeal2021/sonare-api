# Geração via Hugging Face Space, atrás de uma interface

A Geração precisa de voz cantada e de custo zero. Rodar um modelo com voz (ACE-Step, DiffRhythm, YuE) localmente é inviável sem GPU NVIDIA, e as APIs pagas estão fora do orçamento; por isso o worker chama o Space público do ACE-Step via `@gradio/client`, usando a cota gratuita de GPU do Hugging Face. O modelo fica atrás da interface `GeradorDeMusica`, com uma implementação falsa (`GeradorFake`, que devolve Áudios pré-gerados) usada no dia a dia e nos testes para não gastar cota.

## Consequences

- O Space pode sair do ar ou mudar de interface sem aviso; trocar de Space ou de modelo deve afetar só a implementação do `GeradorDeMusica`.
- Disponibilidade, tempo de Geração, qualidade em PT-BR e idioma do Prompt ainda serão validados no `/prototype`.
