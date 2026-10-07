# DLQ: para onde vão as mensagens que falharam em todas as Tentativas
resource "aws_sqs_queue" "geracoes_dlq" {
  name                      = "${local.prefixo}-geracoes-dlq"
  message_retention_seconds = 1209600 # 14 dias para investigar o que deu errado
}

# Fila de Gerações: a API publica, o worker consome
resource "aws_sqs_queue" "geracoes" {
  name = "${local.prefixo}-geracoes"

  # Tempo que a mensagem fica "invisível" enquanto o worker trabalha nela.
  # Precisa ser maior que a Geração mais longa (~25 s para 1.000 caracteres) com folga.
  visibility_timeout_seconds = 120

  # Long polling: o worker espera até 20 s por mensagem em vez de perguntar sem parar
  receive_wait_time_seconds = 20

  # Depois de 3 recebimentos sem sucesso, a mensagem vai para a DLQ (3 Tentativas)
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.geracoes_dlq.arn
    maxReceiveCount     = 3
  })
}
