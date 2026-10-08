# Chave da Cloudflare Workers AI (Imagens, ADR 0011), usada pelo worker.
#
# O Terraform cria só o "cofre" VAZIO. O valor é colocado por fora, com a AWS CLI:
# assim a chave nunca aparece no código, no git nem no state do Terraform.
#   aws secretsmanager put-secret-value --secret-id sonare-local/cloudflare --secret-string '{"accountId":"...","token":"..."}'
resource "aws_secretsmanager_secret" "cloudflare" {
  name                    = "${local.prefixo}/cloudflare"
  recovery_window_in_days = 0 # ambiente local: apagar na hora, sem janela de recuperação
}

resource "aws_ssm_parameter" "cloudflare_segredo" {
  name  = "/sonare/${var.ambiente}/cloudflare/segredo"
  type  = "String"
  value = aws_secretsmanager_secret.cloudflare.name
}
