# Sonare

Aplicação em PT-BR onde o Artista cria Músicas com voz cantada a partir de um Estilo e de uma Letra. Este glossário vale para os três repositórios (`sonare-web`, `sonare-api`, `sonare-ia`).

## Pessoas

**Artista**:
A pessoa que usa a Sonare para criar Músicas.
_Evite_: usuário, cliente, visitante

**Conta**:
O e-mail e a senha com que o Artista se identifica na Sonare.
_Evite_: login, perfil

## Criação

**Música**:
O que o Artista pede ao clicar em "Gerar": um Estilo, uma Letra opcional, um Título e um Status.
_Evite_: geração, faixa, canção, track

**Estilo**:
O texto livre em que o Artista descreve como a Música deve soar ("samba triste, voz masculina").
_Evite_: prompt, descrição, gênero

**Letra**:
O texto que será cantado na Música.
_Evite_: verso, texto

**Música instrumental**:
Uma Música sem Letra.
_Evite_: beat, música sem voz

**Título**:
O nome da Música, digitado pelo Artista ou derivado da primeira linha da Letra (ou do Estilo, numa Música instrumental).
_Evite_: nome

**Status**:
A situação de uma Música: _na fila_, _gerando_, _pronta_ ou _falhou_.
_Evite_: estado, fase

**Áudio**:
O arquivo sonoro de uma Música pronta.
_Evite_: faixa, arquivo, mp3, wav

**Biblioteca**:
O conjunto das Músicas de um Artista.
_Evite_: histórico, feed, playlist

## Geração

**Geração**:
O processo que produz o Áudio de uma Música.
_Evite_: usar "geração" como nome da Música

**Tentativa**:
Uma execução da Geração; uma Música tem no máximo três.
_Evite_: retry, execução

**Prompt**:
O texto que a Geração monta a partir do Estilo e da Letra e envia ao modelo de IA.
_Evite_: confundir com Estilo

## Cota e créditos

**Cota diária**:
A quantidade de Músicas que um Artista pode pedir de graça por dia, renovada à meia-noite no horário de Brasília.
_Evite_: limite, limite diário, créditos grátis

**Reserva**:
Uma unidade da Cota diária ocupada por uma Música desde o pedido até ela ficar pronta ou falhar.
_Evite_: bloqueio, débito

**Devolução**:
O retorno de uma unidade da Cota diária ao Artista quando a Música dela falha.
_Evite_: estorno, reembolso

**Crédito**:
Uma unidade comprada que dá direito a pedir uma Música e que não renova nem expira à meia-noite.
_Evite_: cota, saldo

**Estorno**:
A devolução de dinheiro de um pagamento ao Artista.
_Evite_: devolução
