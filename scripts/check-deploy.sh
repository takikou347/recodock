#!/usr/bin/env bash
# デプロイ後のスモークチェック(develop-docs docs/recodock/04_implementation/06_deploy-checklist.md 1 章)。
#   scripts/check-deploy.sh <base-url> <expected-supabase-project-ref>
# Cloudflare Access で保護された Preview は CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET を環境変数で渡す。
set -euo pipefail

base="${1:?usage: check-deploy.sh <base-url> <supabase-project-ref>}"
ref="${2:?usage: check-deploy.sh <base-url> <supabase-project-ref>}"
base="${base%/}"

curl_opts=(-s --max-time 30)
if [[ -n "${CF_ACCESS_CLIENT_ID:-}" && -n "${CF_ACCESS_CLIENT_SECRET:-}" ]]; then
  curl_opts+=(-H "CF-Access-Client-Id: ${CF_ACCESS_CLIENT_ID}" -H "CF-Access-Client-Secret: ${CF_ACCESS_CLIENT_SECRET}")
fi

failures=0
pass() { printf '  ok   %s\n' "$1"; }
fail() { printf '  NG   %s\n' "$1"; failures=$((failures + 1)); }

status_of() { curl "${curl_opts[@]}" -o /dev/null -w '%{http_code}' "$1"; }

echo "check-deploy: ${base} (expect Supabase ref: ${ref})"

# A-1 主要パスが 200
for path in / /login /money/accounts; do
  code="$(status_of "${base}${path}")"
  if [[ "$code" == "200" ]]; then pass "A-1 ${path} -> ${code}"; else fail "A-1 ${path} -> ${code}"; fi
done

# A-2 深いパスが index.html(SPA フォールバック)
if curl "${curl_opts[@]}" "${base}/money/accounts" | grep -q '<div id="root">'; then
  pass "A-2 /money/accounts serves index.html"
else
  fail "A-2 /money/accounts does not serve index.html"
fi

# A-3 http -> https
if [[ "$base" == https://* ]]; then
  http_base="http://${base#https://}"
  redirect="$(curl "${curl_opts[@]}" -o /dev/null -w '%{http_code} %{redirect_url}' "${http_base}/")"
  if [[ "$redirect" == 301* && "$redirect" == *"https://"* ]]; then pass "A-3 http -> https (${redirect})"; else fail "A-3 http redirect: ${redirect}"; fi
fi

# A-4 favicon
favicon_type="$(curl "${curl_opts[@]}" -o /dev/null -w '%{http_code} %{content_type}' "${base}/favicon.svg")"
if [[ "$favicon_type" == 200*svg* ]]; then pass "A-4 favicon.svg (${favicon_type})"; else fail "A-4 favicon.svg: ${favicon_type}"; fi

# A-5 〜 A-7 バンドルに環境変数が焼き込まれているか
index_html="$(curl "${curl_opts[@]}" "${base}/")"
bundle_path="$(printf '%s' "$index_html" | grep -o '/assets/index-[A-Za-z0-9_-]*\.js' | head -1 || true)"
if [[ -z "$bundle_path" ]]; then
  fail "A-5 bundle path not found in index.html"
else
  bundle="$(curl "${curl_opts[@]}" "${base}${bundle_path}")"
  echo "  bundle ${bundle_path} ($(printf '%s' "$bundle" | wc -c | tr -d ' ') bytes)"
  ref_count="$(printf '%s' "$bundle" | grep -o "$ref" | wc -l | tr -d ' ')"
  other_refs="$(printf '%s' "$bundle" | grep -o 'https://[a-z]\{20\}\.supabase\.co' | sort -u | grep -v "$ref" || true)"
  if [[ "$ref_count" -ge 1 ]]; then pass "A-5 Supabase ref ${ref} found (${ref_count})"; else fail "A-5 Supabase ref ${ref} not found (env missing at build time?)"; fi
  if printf '%s' "$bundle" | grep -q 'url:void 0\|anonKey:void 0'; then fail "A-6 url/anonKey is undefined in bundle"; else pass "A-6 url/anonKey are set"; fi
  if [[ -z "$other_refs" ]]; then pass "A-7 no other Supabase project in bundle"; else fail "A-7 unexpected Supabase URL in bundle: ${other_refs}"; fi
fi

echo
if [[ "$failures" -eq 0 ]]; then
  echo "RESULT: PASS"
else
  echo "RESULT: FAIL (${failures})"
  exit 1
fi
