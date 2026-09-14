#!/usr/bin/env bash

set -euo pipefail

: "${APP_URL:?Set APP_URL to the protected application origin}"

url="${APP_URL%/}/"
headers="$(mktemp)"

trap 'rm -f "$headers"' EXIT

status="$(
  curl \
    --fail \
    --silent \
    --show-error \
    --retry 5 \
    --retry-delay 2 \
    --max-time 30 \
    --dump-header "$headers" \
    --output /dev/null \
    --write-out "%{http_code}" \
    "$url"
)"

location="$(
  awk 'tolower($1) == "location:" { print $2 }' "$headers" |
    tr -d "\r" |
    tail -n 1
)"

case "$status" in
  3??)
    ;;
  *)
    echo "::error::Expected the Cloudflare Access authentication redirect; received HTTP $status"
    exit 1
    ;;
esac

case "$location" in
  https://*.cloudflareaccess.com/cdn-cgi/access/login* | /cdn-cgi/access/login*)
    ;;
  *)
    echo "::error::Received a redirect that was not a Cloudflare Access authentication redirect"
    exit 1
    ;;
esac

echo "Access gate reachable (HTTP $status)."
echo "Manually test staging through Google before production approval."