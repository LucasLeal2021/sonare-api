# DocumentDB (MongoDB) onde a API guarda as Criações (ADR 0004).
# No Floci, cada cluster vira um container `mongo` na rede sonare-net.

# A senha é gerada pelo Terraform e NUNCA aparece no código.
# Sem caracteres especiais para não precisar escapar na connection string.
resource "random_password" "documentdb" {
  length  = 32
  special = false
}

resource "aws_docdb_cluster" "criacoes" {
  cluster_identifier  = "${local.prefixo}-criacoes"
  engine              = "docdb"
  engine_version      = "5.0.0"
  master_username     = "sonare"
  master_password     = random_password.documentdb.result
  skip_final_snapshot = true # ambiente local: ao destruir, não guardar cópia
  apply_immediately   = true

  # Na AWS real também entram aqui a sub-rede privada e o security group (ADR 0007),
  # quando a VPC for criada.
}

resource "aws_docdb_cluster_instance" "criacoes" {
  identifier         = "${local.prefixo}-criacoes-1"
  cluster_identifier = aws_docdb_cluster.criacoes.id
  instance_class     = "db.t3.medium"
}

# Só as credenciais vão no segredo. O endereço NÃO: no Floci ele é o IP do container
# e pode mudar quando o Docker reinicia; a API o descobre com DescribeDBClusters ao iniciar.
resource "aws_secretsmanager_secret" "documentdb" {
  name                    = "${local.prefixo}/documentdb"
  recovery_window_in_days = 0 # ambiente local: apagar na hora, sem janela de recuperação
}

resource "aws_secretsmanager_secret_version" "documentdb" {
  secret_id = aws_secretsmanager_secret.documentdb.id
  secret_string = jsonencode({
    usuario = aws_docdb_cluster.criacoes.master_username
    senha   = random_password.documentdb.result
  })
}

# A API descobre pelo SSM ONDE está o segredo e QUAL é o cluster;
# o conteúdo do segredo, só pelo Secrets Manager; o endereço, pelo DescribeDBClusters.
resource "aws_ssm_parameter" "documentdb_segredo" {
  name  = "/sonare/${var.ambiente}/documentdb/segredo"
  type  = "String"
  value = aws_secretsmanager_secret.documentdb.name
}

resource "aws_ssm_parameter" "documentdb_cluster" {
  name  = "/sonare/${var.ambiente}/documentdb/cluster"
  type  = "String"
  value = aws_docdb_cluster.criacoes.cluster_identifier
}
