# Onde o Terraform guarda o state no ambiente local (Floci).
# O bucket precisa existir ANTES do `terraform init` (veja o README).
bucket       = "sonare-terraform-state"
key          = "base/terraform.tfstate"
region       = "us-east-1"
profile      = "floci"
use_lockfile = true

# Floci em vez da AWS real
endpoints                   = { s3 = "http://localhost:4566" }
use_path_style              = true
skip_credentials_validation = true
skip_requesting_account_id  = true
skip_metadata_api_check     = true
skip_region_validation      = true
