# Barramento próprio da Sonare: o worker publica aqui quando uma Criação termina.
resource "aws_cloudwatch_event_bus" "sonare" {
  name = local.prefixo
}

# Fila onde a API lê os avisos de conclusão (CriacaoConcluida / CriacaoFalhou)
resource "aws_sqs_queue" "criacoes_concluidas" {
  name                       = "${local.prefixo}-criacoes-concluidas"
  visibility_timeout_seconds = 30
  receive_wait_time_seconds  = 20
}

# Regra: todo evento vindo do worker ("sonare.ia") com um desses tipos...
resource "aws_cloudwatch_event_rule" "criacao_terminou" {
  name           = "${local.prefixo}-criacao-terminou"
  event_bus_name = aws_cloudwatch_event_bus.sonare.name
  event_pattern = jsonencode({
    source        = ["sonare.ia"]
    "detail-type" = ["CriacaoConcluida", "CriacaoFalhou"]
  })
}

# ...é entregue na fila da API
resource "aws_cloudwatch_event_target" "criacao_terminou_para_api" {
  rule           = aws_cloudwatch_event_rule.criacao_terminou.name
  event_bus_name = aws_cloudwatch_event_bus.sonare.name
  arn            = aws_sqs_queue.criacoes_concluidas.arn
}

# Na AWS real, a fila precisa AUTORIZAR o EventBridge a escrever nela —
# e só a partir desta regra (SourceArn). Sem isso, os eventos somem em silêncio.
resource "aws_sqs_queue_policy" "criacoes_concluidas" {
  queue_url = aws_sqs_queue.criacoes_concluidas.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "events.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.criacoes_concluidas.arn
      Condition = { ArnEquals = { "aws:SourceArn" = aws_cloudwatch_event_rule.criacao_terminou.arn } }
    }]
  })
}

resource "aws_ssm_parameter" "barramento_eventos" {
  name  = "/sonare/${var.ambiente}/eventbridge/barramento"
  type  = "String"
  value = aws_cloudwatch_event_bus.sonare.name
}

resource "aws_ssm_parameter" "fila_criacoes_concluidas_url" {
  name  = "/sonare/${var.ambiente}/sqs/criacoes-concluidas-url"
  type  = "String"
  value = aws_sqs_queue.criacoes_concluidas.url
}
