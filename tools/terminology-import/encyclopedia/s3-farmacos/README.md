# F9 · corte S3 — artículos de fármacos (carril 41)

Canalización que ensambla el artículo enciclopédico de los 2 833 términos de farmacología del
glosario **solo con texto literal** de la ficha técnica oficial de CIMA (AEMPS) y datos CC0 de
Wikidata. Especificación: `tareas/TAREA-41-red-de-conocimiento-y-auditoria-clinica.md` §12.
Evidencia y veredicto: `docs/progress/evidence/lane-41/F9/s3-farmacos/` (raíz del workspace).

**No carga nada a ninguna base ni escribe en el VPS.** Todo lo que genera cae en la carpeta de
evidencia (fuera de git): `cache/` (descargas), `out/articles.ndjson`, `out/rejected.ndjson`.

## Reglas duras (con su prueba)

| Regla | Dónde se hace cumplir | Prueba |
|---|---|---|
| La sección 4.2 (posología) no se pide, no se lee de la caché y no se guarda | `lib/sections.mjs` (lista blanca por igualdad exacta; único paso para URLs y rutas de caché) | `test/sections-and-posology.test.mjs` |
| Cero dosis en cualquier cadena de prosa | `lib/dose-guard.mjs` (por oración) + `validateArticle` (última barrera) | `test/dose-guard.test.mjs`, `audit-output.mjs` |
| Texto literal, sin traducir ni reescribir | `lib/blocks.mjs` solo quita etiquetas y normaliza espacios | `isLiteralOf` en las pruebas |
| Sección sin los seis campos de procedencia no se publica | `validateArticle` | `test/article.test.mjs` |
| Imágenes: solo hosts de la CSP y licencias admitidas | `lib/images.mjs` | `test/images.test.mjs`, `audit-output.mjs` |
| 1 petición por segundo, reintento con retroceso, caché | `lib/polite-client.mjs` | `test/polite-client.test.mjs` |

## Orden de ejecución

```bash
# desde la raíz del repo de la API (o su worktree)
node tools/terminology-import/encyclopedia/s3-farmacos/fetch-cima.mjs --plan   # cuenta pedidos, no baja nada
node tools/terminology-import/encyclopedia/s3-farmacos/fetch-cima.mjs          # ~4 600 pedidos ≈ 80 min, reanudable
node tools/terminology-import/encyclopedia/s3-farmacos/fetch-revision-dates.mjs # fecha de la ficha cuando la API no la trae
node tools/terminology-import/encyclopedia/s3-farmacos/fetch-wikidata.mjs      # 14 pedidos
node tools/terminology-import/encyclopedia/s3-farmacos/build-articles.mjs      # articles.ndjson + rejected.ndjson
node tools/terminology-import/encyclopedia/s3-farmacos/audit-output.mjs        # auditoría independiente de la salida
node tools/terminology-import/encyclopedia/s3-farmacos/coverage.mjs            # cobertura medida
node tools/terminology-import/encyclopedia/s3-farmacos/check-images.mjs --scope sample:200
node tools/terminology-import/encyclopedia/s3-farmacos/samples.mjs --pick --verify
node --test "tools/terminology-import/encyclopedia/s3-farmacos/test/*.test.mjs"
```

`S3_EVIDENCE_DIR`, `GLOSSARY_NDJSON_DIR` y `SEED_PHARMACOLOGY_DIR` redefinen las rutas (ver `lib/paths.mjs`).

## Decisiones que conviene conocer

- **Una sección = las oraciones de la ficha menos las que la guardia de dosis retira.** Lo retirado
  se anota en `rejected.ndjson` solo como huella y conteo (el texto no se copia: puede ser una dosis)
  y la sección lleva `omittedSentences`.
- **Producto de referencia por principio activo:** el mismo criterio de `import-cima.mjs`
  (comercializado primero, luego nº de registro más bajo, entre los de ficha segmentada).
- **Sin nombres comerciales en la salida:** los nombres de CIMA llevan la concentración
  («… 500 mg …»); la fuente se identifica por **nº de registro** y enlace.
- **Fecha de la ficha** (`sourceVersion`): la del listado de CIMA en hora de Madrid; si la API no la
  trae, la que la propia ficha escribe en su sección 10; si no hay ninguna, la sección no se publica.
- Campos que este corte **agrega** al contrato de §12.3 (opcionales, el consumidor puede ignorarlos):
  `nregistro`, `omittedSentences`, `sourceVersionOrigin` en las secciones; `licenseStatus`,
  `licenseFamily` en las imágenes; `items` en `presentations` y `pharmacologic_class`.
