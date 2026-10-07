output "bucket_criacoes" {
  value = aws_s3_bucket.criacoes.bucket
}

output "fila_geracoes_url" {
  value = aws_sqs_queue.geracoes.url
}

output "fila_geracoes_dlq_url" {
  value = aws_sqs_queue.geracoes_dlq.url
}
