variable "do_token" {
  description = "DigitalOcean API token. Prefer TF_VAR_do_token env var over tfvars."
  type        = string
  sensitive   = true
}

variable "region" {
  description = "DigitalOcean region slug."
  type        = string
  default     = "nyc1"
}

variable "cluster_name" {
  description = "DOKS cluster name."
  type        = string
  default     = "twin-neobank"
}

variable "k8s_version_prefix" {
  description = "Kubernetes version prefix to select the latest matching patch (e.g. 1.31.)."
  type        = string
  default     = "1.31."
}

variable "node_size" {
  description = "Droplet size slug for worker nodes."
  type        = string
  default     = "s-2vcpu-2gb"
}

variable "node_count" {
  description = "Number of worker nodes."
  type        = number
  default     = 2
}

variable "registry_name" {
  description = "DOCR registry name. Must be globally unique across all DigitalOcean."
  type        = string
  default     = "twin-neobank-ojardila"
}

variable "registry_tier" {
  description = "DOCR subscription tier (starter=1 repo/free, basic=$5/mo, professional)."
  type        = string
  default     = "basic"
}
