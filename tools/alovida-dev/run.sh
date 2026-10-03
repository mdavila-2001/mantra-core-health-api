#!/usr/bin/env bash
set -euo pipefail
jobs_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
workspace_dir="${ALOVIDA_DEV_ROOT:-$(cd -- "$jobs_dir/../../.." && pwd)}"
if [ "$#" -eq 0 ]; then
  echo 'Uso: run.sh python /jobs/<fase>.py [argumentos]' >&2
  exit 2
fi
mkdir -p "$workspace_dir/runtime/imagenes-demo" "$workspace_dir/runtime/demo-access"
chmod 700 "$workspace_dir/runtime/demo-access"
exec docker run --rm --network alovida-dev \
  --mount "type=bind,src=$workspace_dir/modelo,dst=/workspace/modelo,readonly" \
  --mount "type=bind,src=$workspace_dir/runtime/model-seed.env,dst=/workspace/mantra-core-health-api/.env,readonly" \
  --mount "type=bind,src=$workspace_dir/runtime/imagenes-demo,dst=/tmp/imagenes-alovida" \
  --mount "type=bind,src=$workspace_dir/runtime/demo-access,dst=/output" \
  --mount "type=bind,src=$jobs_dir,dst=/jobs,readonly" \
  alovida-dev-seed:local "$@"
