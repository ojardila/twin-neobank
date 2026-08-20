# Infra

Infrastructure as code for the neobank.

- [`terraform/`](./terraform) — DOKS cluster + DOCR registry + pull secret + DNS zone (DigitalOcean).

## Deploy order

1. **Provision** with Terraform:
   ```bash
   cd infra/terraform
   export TF_VAR_do_token="$(tr -d '\n' < ~/.tokens/digitalocean)"
   terraform init && terraform apply
   doctl kubernetes cluster kubeconfig save twin-neobank
   ```

2. **App** — publish a GitHub Release (`vX.Y.Z`); the `🚀 Release` pipeline
   (`.github/workflows/release.yml`) converges infra (standard ingress-nginx +
   cert-manager + DNS sync), then builds/pushes images to DOCR and runs
   `helm upgrade --install twin-neobank deploy/helm/twin-neobank`, then smoke-tests.

   Manual deploy (if needed):
   ```bash
   helm upgrade --install twin-neobank deploy/helm/twin-neobank \
     -n twin-neobank --set backend.image.tag=vX.Y.Z --set frontend.image.tag=vX.Y.Z --wait
   ```

3. **DNS** — the pipeline runs [`deploy/scripts/sync-dns.sh`](../deploy/scripts/sync-dns.sh),
   which points the domain's records at the ingress Load Balancer IP automatically.

## Teardown

```bash
helm uninstall twin-neobank -n twin-neobank
cd infra/terraform && terraform destroy   # frees cluster, registry and LB
```
