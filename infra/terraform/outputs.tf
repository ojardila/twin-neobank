output "cluster_id" {
  description = "DOKS cluster id."
  value       = digitalocean_kubernetes_cluster.twin.id
}

output "cluster_name" {
  description = "DOKS cluster name (for doctl kubeconfig save)."
  value       = digitalocean_kubernetes_cluster.twin.name
}

output "cluster_endpoint" {
  description = "Kubernetes API endpoint."
  value       = digitalocean_kubernetes_cluster.twin.endpoint
}

output "registry_endpoint" {
  description = "DOCR endpoint — image prefix is registry.digitalocean.com/<name>."
  value       = digitalocean_container_registry.twin.endpoint
}

output "registry_server_url" {
  description = "DOCR server URL for docker login."
  value       = digitalocean_container_registry.twin.server_url
}

output "backend_image" {
  description = "Full backend image repo path."
  value       = "${digitalocean_container_registry.twin.endpoint}/twin-neobank-backend"
}

output "frontend_image" {
  description = "Full frontend image repo path."
  value       = "${digitalocean_container_registry.twin.endpoint}/twin-neobank-frontend"
}

output "nameservers" {
  description = "Set these as the domain's nameservers at your registrar (only when var.domain is set)."
  value       = var.domain != "" ? ["ns1.digitalocean.com", "ns2.digitalocean.com", "ns3.digitalocean.com"] : []
}
