provider "aws" {
  region  = var.regiao
  profile = var.aws_profile # o endpoint do Floci vem do próprio perfil (endpoint_url)

  # O Floci não tem as APIs que o provider usa para validar a conta
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  s3_use_path_style           = true # localhost:4566/bucket em vez de bucket.localhost

  # Toda resource criada por aqui ganha estas tags automaticamente
  default_tags {
    tags = {
      Projeto       = "sonare"
      Ambiente      = var.ambiente
      GerenciadoPor = "terraform"
    }
  }
}

data "aws_caller_identity" "atual" {}

locals {
  prefixo = "sonare-${var.ambiente}"
}
