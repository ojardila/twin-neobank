terraform {
  required_version = ">= 1.6.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.40"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.31"
    }
  }

  # Remote state in DigitalOcean Spaces (S3-compatible).
  # Credentials come from env: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
  # (the DO Spaces key). CI injects them from GitHub secrets.
  backend "s3" {
    endpoints                   = { s3 = "https://nyc3.digitaloceanspaces.com" }
    bucket                      = "twin-neobank-tfstate-ojardila"
    key                         = "prod/terraform.tfstate"
    region                      = "us-east-1" # ignored by Spaces but required
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
  }
}

provider "digitalocean" {
  token = var.do_token
}
