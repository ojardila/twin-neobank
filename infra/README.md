# Infra

Infraestructura como código para el neobanco.

- [`terraform/`](./terraform) — DOKS cluster + DOCR registry + pull secret (DigitalOcean).

## Orden de despliegue

1. **Provisionar** con Terraform:
   ```bash
   cd infra/terraform
   export TF_VAR_do_token="$(tr -d '\n' < ~/.tokens/digitalocean)"
   terraform init && terraform apply
   doctl kubernetes cluster kubeconfig save twin-neobank
   ```

2. **Ingress controller** (una vez por cluster) — provisiona un Load Balancer de DO:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/do/deploy.yaml
   ```

3. **App** — el pipeline de GitHub Actions (`.github/workflows/cd.yml`) hace build/push
   a DOCR y `kubectl apply -k deploy/k8s/overlays/prod` en cada push a `main`.
   También podés hacerlo a mano:
   ```bash
   kubectl apply -k deploy/k8s/overlays/prod
   ```

4. **DNS** — apuntá `twin-neobank.example.com` (en `deploy/k8s/base/ingress.yaml`) a la IP
   del Load Balancer:
   ```bash
   kubectl -n ingress-nginx get svc ingress-nginx-controller
   ```

## Teardown

```bash
kubectl delete -k deploy/k8s/overlays/prod
cd infra/terraform && terraform destroy   # libera cluster, registry y LB
```
