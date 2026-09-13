# Deploying twin-neobank

Two targets share this chart. `values.yaml` is the DigitalOcean deployment;
`values-cluster.yaml` overrides it for the self-hosted Talos cluster.

| | DigitalOcean | Talos cluster |
|:--|:--|:--|
| Registry | `registry.digitalocean.com` | `harbor.int.engp.io` (tailnet only) |
| Deploy | `helm upgrade` from CI | ArgoCD watching the manifests repo |
| TLS | cert-manager in-cluster | terminated by Cloudflare at its edge |
| Cluster credentials in CI | yes, a kubeconfig secret | none |

## Why CI no longer deploys

The old pipeline saved a kubeconfig into the runner and ran `helm upgrade`. That
means a leaked GitHub secret is cluster admin. Now CI only builds and pushes
images; ArgoCD pulls from git and applies. GitHub never holds a credential that
can reach the cluster.

## Why CI joins the tailnet

Harbor has no public address on purpose - a registry holding private images is
not something to expose. The runner joins the tailnet for the length of a build
using `tailscale/github-action`, pushes, and the node disappears when the job
ends.

That needs, once:

- A Tailscale OAuth client with **Devices → Core (write)** and **Auth Keys
  (write)**, tagged `tag:ci`.
- `tag:ci` declared in the tailnet ACL:

  ```json
  "tagOwners": {
    "tag:ci": []
  }
  ```

- Four repository secrets: `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`,
  `HARBOR_ROBOT_NAME`, `HARBOR_ROBOT_SECRET`.

The Harbor robot is scoped to push and pull inside the `twin-neobank` project
only - it cannot read any other project or change Harbor's configuration.
