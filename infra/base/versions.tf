terraform {
  # 1.10+ é necessário para o lock do state direto no S3 (use_lockfile)
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Os valores do backend vêm de um arquivo por ambiente:
  #   terraform init -backend-config=backend-local.hcl
  backend "s3" {}
}
