variable "ambiente" {
  description = "Nome do ambiente: entra no nome e nas tags de todos os recursos"
  type        = string
  default     = "local"
}

variable "aws_profile" {
  description = "Perfil da AWS CLI. O perfil `floci` aponta para http://localhost:4566"
  type        = string
  default     = "floci"
}

variable "regiao" {
  type    = string
  default = "us-east-1"
}
