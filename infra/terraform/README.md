# Infra — DigitalOcean (Terraform)

Provisiona la infraestructura del neobanco en DigitalOcean:

- **DOKS** — cluster de Kubernetes (`twin-neobank`, node pool de `node_count` nodos).
- **DOCR** — Container Registry para las imágenes `twin-neobank-backend` / `twin-neobank-frontend`.
- **Pull secret** — integra el registry con el namespace `twin-neobank` (la default SA puede pullear imágenes privadas sin config manual).

## Uso

```bash
cd infra/terraform

# 1. Token de DO (no lo pongas en tfvars; usá env)
export TF_VAR_do_token="$(tr -d '\n' < ~/.tokens/digitalocean)"

# 2. Init + plan
terraform init
terraform plan

# 3. Crear la infra (ESTO GENERA COSTO en DO)
terraform apply

# 4. Conectar kubectl al cluster nuevo
doctl kubernetes cluster kubeconfig save "$(terraform output -raw cluster_name)"

# 5. Ver el prefijo de imágenes para el registry
terraform output registry_endpoint
```

## Costo aproximado (referencia)

| Recurso | Config default | ~USD/mes |
|---|---|---|
| DOKS worker nodes | 2 × `s-2vcpu-2gb` | ~$36 |
| Load Balancer (ingress) | 1 (lo crea ingress-nginx) | ~$12 |
| Container Registry | tier `basic` | $5 |
| Control plane DOKS | gratis (HA opcional pago) | $0 |

> Para bajar costo mientras probás: `node_count = 1` y `node_size = "s-1vcpu-2gb"`.
> Podés destruir todo con `terraform destroy` cuando termines.

## Después del apply

1. `terraform destroy` para no seguir pagando cuando ya no lo necesites.
2. El pull secret y namespace quedan creados; el pipeline de CD solo hace build/push/rollout.
3. Falta el **ingress controller**: instalar ingress-nginx (ver `infra/README.md`).
