output "bucket_criacoes" {
  value = aws_s3_bucket.criacoes.bucket
}

output "fila_geracoes_url" {
  value = aws_sqs_queue.geracoes.url
}

output "fila_geracoes_dlq_url" {
  value = aws_sqs_queue.geracoes_dlq.url
}

output "barramento_eventos" {
  value = aws_cloudwatch_event_bus.sonare.name
}

output "fila_criacoes_concluidas_url" {
  value = aws_sqs_queue.criacoes_concluidas.url
}
