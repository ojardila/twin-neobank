# Pick the latest patch for the requested Kubernetes minor version.
data "digitalocean_kubernetes_versions" "current" {
  version_prefix = var.k8s_version_prefix
}

# DOKS cluster + a single autoscaling-capable node pool.
resource "digitalocean_kubernetes_cluster" "twin" {
  name         = var.cluster_name
  region       = var.region
  version      = data.digitalocean_kubernetes_versions.current.latest_version
  auto_upgrade = true

  maintenance_policy {
    start_time = "04:00"
    day        = "sunday"
  }

  node_pool {
    name       = "worker"
    size       = var.node_size
    node_count = var.node_count

    labels = {
      part-of = "twin-neobank"
    }
  }

  tags = ["twin-neobank"]
}

# Container Registry for the backend/frontend images.
resource "digitalocean_container_registry" "twin" {
  name                   = var.registry_name
  subscription_tier_slug = var.registry_tier
  region                 = var.registry_region
}

# Wire the registry into the cluster so pods can pull without a manual secret.
# Creates a dockerconfigjson pull secret and links it to the default SA in the
# target namespace via the kubernetes provider below.
resource "digitalocean_container_registry_docker_credentials" "twin" {
  registry_name = digitalocean_container_registry.twin.name
}

provider "kubernetes" {
  host  = digitalocean_kubernetes_cluster.twin.endpoint
  token = digitalocean_kubernetes_cluster.twin.kube_config[0].token
  cluster_ca_certificate = base64decode(
    digitalocean_kubernetes_cluster.twin.kube_config[0].cluster_ca_certificate
  )
}

resource "kubernetes_namespace" "twin" {
  metadata {
    name = "twin-neobank"
  }
}

resource "kubernetes_secret" "docr_pull" {
  metadata {
    name      = "docr-pull"
    namespace = kubernetes_namespace.twin.metadata[0].name
  }
  type = "kubernetes.io/dockerconfigjson"
  data = {
    ".dockerconfigjson" = digitalocean_container_registry_docker_credentials.twin.docker_credentials
  }
}

# Attach the pull secret to the namespace default service account so every pod
# can pull private images without per-deployment imagePullSecrets.
resource "kubernetes_default_service_account" "twin" {
  metadata {
    namespace = kubernetes_namespace.twin.metadata[0].name
  }
  image_pull_secret {
    name = kubernetes_secret.docr_pull.metadata[0].name
  }
}
