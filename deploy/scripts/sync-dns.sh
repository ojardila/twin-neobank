#!/usr/bin/env bash
# Point a domain's root and wildcard A records at the live ingress Load Balancer.
# The LB is created by Kubernetes (not Terraform) and its IP can change, so CI
# reconciles DNS here. Requires: kubectl (cluster configured) + doctl (authed).
#
# Usage: sync-dns.sh <domain>
set -euo pipefail

DOMAIN="${1:?usage: sync-dns.sh <domain>}"

# Wait for the LB to publish an external IP.
LB_IP=""
for _ in $(seq 1 24); do
  LB_IP="$(kubectl -n ingress-nginx get svc ingress-nginx-controller \
    -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)"
  [ -n "$LB_IP" ] && break
  echo "waiting for Load Balancer IP..."
  sleep 10
done

if [ -z "$LB_IP" ]; then
  echo "ERROR: Load Balancer has no external IP yet" >&2
  exit 1
fi
echo "Load Balancer IP: $LB_IP"

# Upsert the @ and * A records to the LB IP.
for NAME in "@" "*"; do
  RID="$(doctl compute domain records list "$DOMAIN" --no-header \
    --format ID,Type,Name | awk -v n="$NAME" '$2=="A" && $3==n {print $1; exit}')"
  if [ -n "$RID" ]; then
    doctl compute domain records update "$DOMAIN" --record-id "$RID" \
      --record-data "$LB_IP" --record-ttl 300 >/dev/null
    echo "updated A $NAME -> $LB_IP"
  else
    doctl compute domain records create "$DOMAIN" --record-type A \
      --record-name "$NAME" --record-data "$LB_IP" --record-ttl 300 >/dev/null
    echo "created A $NAME -> $LB_IP"
  fi
done
echo "DNS synced for $DOMAIN"
