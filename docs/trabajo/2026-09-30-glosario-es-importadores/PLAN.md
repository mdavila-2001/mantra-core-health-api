# PLAN — Importadores del glosario en castellano (2026-09-30)

Rama `justin/glosario-es-importadores` (desde `origin/dev` a3a42fc1). Alcance: sólo
`tools/terminology-import/` (+ su `test/`, un script en `package.json` y este directorio).
No se toca `src/`, el esquema ni el repo del front. El stack Docker **no** se levanta
(CLAUDE.md, 2026-09-10): la etapa *load* se escribe y se prueba sin base; su corrida real
queda para quien lo autorice.

## Supuestos / ambigüedades registradas
- A1. Los términos importados se siembran `TERM_ACTIVE` (el glosario oculta los demás) con
  `reviewStatus = external-source` como propiedad: son catálogos oficiales verbatim, no texto
  redactado. Confirmar con el propietario.
- A2. La categoría se deriva de la estructura oficial de cada fuente (capítulo CIE-10-ES,
  sección ICD-10-PCS, grupo MedlinePlus); nunca por juicio clínico caso a caso.
- A3. Las secciones de ficha técnica de CIMA son de un producto de referencia por VTM
  (criterio determinista documentado en el README), con cita al nº de registro.
- A4. `00_README.md` del front no se edita (prohibido tocar el front): el esquema vive en
  `glossary-data-build/SCHEMA.md` y en el README de los importadores.

## H1 — Corpus ES normalizado con procedencia (CA: NDJSON + shards con conteos reales)
| ID | Microtarea | CA / DoD (comando) |
|---|---|---|
| H1.S1.M1 | Librería común (HTTP con reintentos, caché, NDJSON) | `node --test tools/terminology-import/test` verde |
| H1.S1.M2 | `import-cie10es.mjs` (diagnósticos + procedimientos + CIE-O-3.2) | NDJSON con conteo = filas del Excel oficial |
| H1.S1.M3 | `import-cima.mjs` (VTM + productos + fotos + ATC + ficha 4.1–5.1) | NDJSON; conteo VTM y secciones en `.meta.json` |
| H1.S1.M4 | `import-medlineplus-es.mjs` (temas XML + guías de laboratorio) | NDJSON; conteo = temas `language="Spanish"` |
| H1.S1.M5 | `import-wikidata-images.mjs` (P18 + atribución Commons) | NDJSON de imágenes con licencia y autor |
| H1.S1.M6 | `build-glossary-shards.mjs` | `shards/index.json` + páginas de 500 + search-index |
| H1.S2.M1 | `load-glossary-es.mjs` (terminology.* + value sets del glosario) | `--dry-run` genera SQL sin base; corrida real: BLOQUEADA (stack apagado) |
| H1.S2.M2 | `import-loinc-es.mjs` para el archivo de variante lingüística (requiere cuenta) | test con fixture de cabecera |
| H1.S3.M1 | Tests unitarios de parseo con fixtures reales pequeños | `node --test` verde |
| H1.S3.M2 | README de importadores + REPORTE.md | archivos presentes |
