#!/usr/bin/env bash
# Bulk-translates boilerplate Spanish phrases in README.md files to English.
# Run from repo root. Safe to re-run (idempotent for already-translated phrases).

set -euo pipefail

FILES=$(find . -name "README.md" \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/dist/*")

echo "Found $(echo "$FILES" | wc -l | tr -d ' ') README files to process..."

# ---------- boilerplate header / section titles ----------
translate_boilerplate() {
  local f="$1"
  sed -i '' \
    -e 's/## Contenido$/## Contents/g' \
    -e 's/### Subcarpetas$/### Subdirectories/g' \
    -e 's/### Archivos$/### Files/g' \
    -e 's/## Criterios de mantenimiento$/## Maintenance guidelines/g' \
    -e 's/## Criterios de Mantenimiento$/## Maintenance guidelines/g' \
    -e 's/## Reglas de negocio$/## Business rules/g' \
    -e 's/## Permisos$/## Permissions/g' \
    -e 's/## Concurrencia$/## Concurrency/g' \
    -e 's/## Pruebas$/## Tests/g' \
    -e 's/## Límites de la estructura$/## Structural boundaries/g' \
    -e 's/## Ejecución y límite operativo$/## Execution \& operational limits/g' \
    -e 's/## Logs$/## Logs/g' \
    "$f"
}

# ---------- boilerplate body phrases ----------
translate_body() {
  local f="$1"
  # Section intro
  sed -i '' \
    -e 's/Agrupa los componentes relacionados con \(.*\) y mantiene cohesionada esta responsabilidad del sistema\./Groups \1-related components and keeps this system responsibility cohesive./g' \
    -e 's/Agrupa los componentes relacionados con \(.*\)\./Groups \1-related components./g' \
    "$f"

  # Table cell values
  sed -i '' \
    -e 's/| Implementación o recurso de soporte de esta carpeta\./| Support implementation or resource for this folder./g' \
    -e 's/| Composición de dependencias del módulo NestJS\./| NestJS module dependency composition./g' \
    -e 's/| Casos de uso y reglas de negocio\./| Use cases and business rules./g' \
    -e 's/| Punto de exportación pública de la carpeta\./| Public export barrel for this folder./g' \
    -e 's/| Adaptador de transporte (controlador HTTP)\./| Transport adapter (HTTP controller)./g' \
    -e 's/| Contratos de entrada y salida, validación y documentación de la API\./| API input\/output contracts, validation, and documentation./g' \
    -e 's/| Traducción centralizada de errores a respuestas de transporte\./| Centralised error-to-transport-response mapping./g' \
    -e 's/| Repositorio: adaptador de persistencia\./| Repository: persistence adapter./g' \
    -e 's/| Entidad de dominio \/ ORM\./| Domain \/ ORM entity./g' \
    "$f"

  # Maintenance guidelines block
  sed -i '' \
    -e 's/^- Mantener las reglas de negocio fuera de los adaptadores de transporte\.$/- Keep business rules outside transport adapters./g' \
    -e 's/^- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes\.$/- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc./g' \
    -e 's/^- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente\.$/- Update this index when a component is added, removed, or its responsibility changes./g' \
    "$f"
}

for f in $FILES; do
  translate_boilerplate "$f"
  translate_body "$f"
done

echo "Done. Review git diff to spot any remaining Spanish."
