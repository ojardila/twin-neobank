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
  description = "Kubernetes version prefix to select the latest matching patch (e.g. 1.34.)."
  type        = string
  default     = "1.34."
}

variable "node_size" {
  description = "Droplet size slug for worker nodes."
  type        = string
  default     = "s-1vcpu-2gb"
}

variable "node_count" {
  description = "Number of worker nodes."
  type        = number
  default     = 1
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

variable "registry_region" {
  description = "DOCR region. DOCR is not available in every region (e.g. NOT nyc1); use nyc3/sfo3/ams3/fra1/sgp1/blr1/syd1."
  type        = string
  default     = "nyc3"
}

variable "domain" {
  description = "Domain to host DNS for in DigitalOcean (e.g. argt.space). Empty = skip DNS. DO manages DNS only; register the domain at a registrar and point its nameservers to DO."
  type        = string
  default     = "argt.space"
}

# The ingress Load Balancer IP is managed dynamically by CI (deploy/scripts/sync-dns.sh),
# not Terraform, because the LB is created by Kubernetes and its IP can change.
