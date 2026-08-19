# DNS in DigitalOcean. DO hosts the zone; register the domain at a registrar and
# point its nameservers to DO (ns1/ns2/ns3.digitalocean.com — see the
# `nameservers` output). Only the zone is managed here.
#
# The A records (@ and *) are NOT managed by Terraform on purpose: their value is
# the ingress Load Balancer IP, which is created by Kubernetes (not Terraform) and
# can change if the LB is recreated. The CI pipeline reads the live LB IP after
# ingress-nginx is up and upserts the records via doctl (see .github/workflows).
resource "digitalocean_domain" "app" {
  count = var.domain != "" ? 1 : 0
  name  = var.domain
}
