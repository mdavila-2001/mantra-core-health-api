#!/usr/bin/env bash
# Descarga las fuentes crudas de la ampliación internacional en los commits
# congelados, verifica su sha256 y regenera las instantáneas.
#
#   bash tools/clinical-forms/fetch-sources.sh /tmp/fuentes-fichas
#
# Los crudos no se versionan: las instantáneas normalizadas
# (openehr/ckm-snapshot.json, who-dak/dak-snapshot.json) sí. Requiere git,
# sha256sum, node y python3 con openpyxl.
set -euo pipefail

DEST="${1:?uso: fetch-sources.sh <directorio de descarga>}"
AQUI="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$DEST"

# repo · commit · carpeta local
FUENTES=(
  "https://github.com/openEHR/CKM-mirror c3fdc43dcf0eb7ef0cfe60f548fcdebc24c70094 ckm-mirror"
  "https://github.com/WorldHealthOrganization/smart-dak-pnc 1c490e45ac68bad3c8a024001cbc1f039de68a80 smart-dak-pnc"
  "https://github.com/WorldHealthOrganization/smart-hiv b1e7735f1e50cc6e4d126ce6063793def9ae3a12 smart-hiv"
  "https://github.com/WorldHealthOrganization/smart-fp b69bbecd8c71c4e5a3438d9413a58331f4aa0a7f smart-fp"
  "https://github.com/WorldHealthOrganization/smart-anc 301a6b8b904361315ca38b28ee9fbd133f9d0e94 smart-anc"
  "https://github.com/WorldHealthOrganization/smart-immunizations bd7fa726706efc92d972d0dcebba9505f386b078 smart-immunizations"
)

for f in "${FUENTES[@]}"; do
  read -r url commit dir <<<"$f"
  if [[ ! -d "$DEST/$dir/.git" ]]; then
    git init -q "$DEST/$dir"
    git -C "$DEST/$dir" remote add origin "$url"
  fi
  # Sólo el commit congelado, sin historia ni objetos LFS.
  GIT_LFS_SKIP_SMUDGE=1 git -C "$DEST/$dir" fetch -q --depth 1 origin "$commit"
  GIT_LFS_SKIP_SMUDGE=1 git -C "$DEST/$dir" checkout -q --detach FETCH_HEAD
  echo ">>> $dir @ ${commit:0:7}"
done

(cd "$DEST" && grep -v '^#' "$AQUI/sources.sha256" | sha256sum -c --quiet)
echo ">>> sha256 verificados"

node "$AQUI/openehr/extract-ckm.mjs" "$DEST/ckm-mirror"
python3 -I "$AQUI/who-dak/extract-dak.py" "$DEST"
node "$AQUI/build-forms.mjs" --check
