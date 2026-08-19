# DNS in DigitalOcean. DO hosts the zone; register the domain at a registrar and
# point its nameservers to DO (ns1/ns2/ns3.digitalocean.com — see the `nameservers`
# output). Only created when var.domain is set.
#
# Two-step apply: first `terraform apply` (cluster + ingress installed by CI),
# then read the LB IP and re-apply with -var="lb_ip=<ip>" to publish the records.

resource "digitalocean_domain" "app" {
  count = var.domain != "" ? 1 : 0
  name  = var.domain
}

# Root -> Load Balancer.
resource "digitalocean_record" "root" {
  count  = var.domain != "" && var.lb_ip != "" ? 1 : 0
  domain = digitalocean_domain.app[0].id
  type   = "A"
  name   = "@"
  value  = var.lb_ip
  ttl    = 300
}

# Wildcard so any subdomain (www, api, etc.) resolves to the same LB/ingress.
resource "digitalocean_record" "wildcard" {
  count  = var.domain != "" && var.lb_ip != "" ? 1 : 0
  domain = digitalocean_domain.app[0].id
  type   = "A"
  name   = "*"
  value  = var.lb_ip
  ttl    = 300
}
