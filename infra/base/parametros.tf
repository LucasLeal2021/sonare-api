# A base publica seus identificadores no SSM Parameter Store para os outros
# repositórios lerem, sem nada fixo no código (ADR 0008).
resource "aws_ssm_parameter" "bucket_criacoes" {
  name  = "/sonare/${var.ambiente}/s3/bucket-criacoes"
  type  = "String"
  value = aws_s3_bucket.criacoes.bucket
}

resource "aws_ssm_parameter" "fila_geracoes_url" {
  name  = "/sonare/${var.ambiente}/sqs/geracoes-url"
  type  = "String"
  value = aws_sqs_queue.geracoes.url
}

resource "aws_ssm_parameter" "fila_geracoes_dlq_url" {
  name  = "/sonare/${var.ambiente}/sqs/geracoes-dlq-url"
  type  = "String"
  value = aws_sqs_queue.geracoes_dlq.url
}
