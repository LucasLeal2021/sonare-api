# Bucket onde o worker grava o Áudio das Narrações e o arquivo das Imagens.
# Nomes de bucket são globais na AWS real; o ID da conta no fim evita colisão.
resource "aws_s3_bucket" "criacoes" {
  bucket = "${local.prefixo}-criacoes-${data.aws_caller_identity.atual.account_id}"
}

# Nada neste bucket é público: o navegador acessa por URL pré-assinada (e depois via CloudFront)
resource "aws_s3_bucket_public_access_block" "criacoes" {
  bucket                  = aws_s3_bucket.criacoes.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
