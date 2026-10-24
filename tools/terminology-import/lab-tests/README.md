# Catálogo de análisis médicos (importador)

Carga a `terminology.*` todas las prestaciones diagnósticas que publican fuentes oficiales:
laboratorio, imagenología, anatomía patológica, genética y molecular, y pruebas funcionales.
También carga los ejes con que se describen: tipo de muestra, aditivo del tubo, método de
recolección, condición de la muestra, sección del servicio y unidades UCUM. Usa sólo
tablas existentes del módulo 03 y no escribe DDL (ADR-0021). Fuentes y licencias en
[`SOURCES.md`](SOURCES.md); pasadas de búsqueda y cobertura en
[`docs/seed-research/lab-tests.md`](../../../docs/seed-research/lab-tests.md).

```sh
node tools/terminology-import/lab-tests/fetch-lab-tests-sources.mjs   # baja las fuentes npm (≈255 MB, fuera de git)
node tools/terminology-import/lab-tests/build-lab-tests.mjs           # NDJSON + cobertura, sin red (≈10 s)
#   con LOINC descargado a mano:  … build-lab-tests.mjs --loinc-release 2.81 [--es-variant <ID>]
node tools/terminology-import/lab-tests/pack-lab-tests-data.mjs      # copia los NDJSON comprimidos a data/ (versionado)
node tools/terminology-import/lab-tests/load-lab-tests.mjs            # dry-run: plan y conteos, sin base
node tools/terminology-import/lab-tests/load-lab-tests.mjs --apply    # carga real (.env DB_*; la API debe haber arrancado una vez)
node --test "tools/terminology-import/test/*.test.mjs"                # incluye lab-tests.test.mjs
```

**`data/` está versionado** (1,4 MB): los NDJSON normalizados en gzip (partidos por debajo de 45 MB
si hiciera falta), sus `.meta.json`, el reporte de cobertura, el manifiesto de fuentes (spec npm,
SHA-256, integridad) y `checksums.json`. Si no hay build local, `load-lab-tests.mjs` carga desde
`data/` y verifica el SHA-256. Así el corpus se carga sin volver a descargar las fuentes crudas
(≈255 MB), que no se versionan: se reproducen con `fetch-lab-tests-sources.mjs`.

En Node 22, `build-lab-tests.mjs` usa `node:sqlite` (ICD-10-PCS) y avisa que es experimental.
El cargador arma el plan completo en memoria y lo inserta en **una sola transacción**: con LOINC
(≈100 000 términos × decenas de propiedades) conviene `NODE_OPTIONS=--max-old-space-size=8192`.
Si Node no ve el proxy, `NODE_USE_ENV_PROXY=1` (no hace falta para `npm pack`).

## Qué escribe en cada tabla

| Tabla | Contenido |
|---|---|
| `terminology_sources`, `code_systems`, `code_system_versions` | Una fila por fuente y por code system. LOINC reusa las claves de `import-loinc.mjs` (`md5('mantra:loinc:…')`): enriquece el mismo concepto, no lo duplica. |
| `catalog_concepts` | Un concepto por código. `display` es el nombre oficial (FONASA, con sólo la caja normalizada por `displayCase`); `selectable = false` para códigos deprecados, obsoletos o dados de baja. |
| `concept_properties` | Los 6 ejes LOINC con los mismos `property_code` que `import-loinc.mjs` (`component`, `property`, `time_aspct`, `system`, `scale_typ`, `method_typ`) más `class`, `loinc_*` (unidades UCUM de ejemplo, paneles, partes LP, Playbook…), `lab_catalog_category`, `lab_catalog_domain(_rule)`, precios de referencia (`reference_price`, CLP o BRL) y la procedencia completa. |
| `concept_designations` | Castellano oficial: variante lingüística de LOINC (cuando se aporte) y los nombres de FONASA y PAMI. Ninguna traducción propia. |
| `concept_relationships` | Miembro *part-of* panel, con orden (LOINC PanelsAndForms) y *is-a* (jerarquías HL7). |
| `value_sets` / `value_set_versions` / `value_set_members` | Versión `1`, membresía acumulativa: `lab-catalog-domain-<dominio>` (5), `lab-catalog-<fuente>`, `lab-catalog-<fuente>-cat-<categoría>`, `lab-catalog-loinc-class-<clase>`, paneles, pedibles, Universal Lab Orders, Top 2000, tablas HL7 y UCUM. Se leen con los endpoints públicos `GET /terminology/value-sets?code=…` y `GET /terminology/value-sets/:id/$expand?includeProperties=true`. |
| `catalog_import_batches` | Un lote por code system y corrida (auditoría: crece en cada corrida). |

`concept_maps` queda vacío a propósito: ninguna fuente alcanzable publica una equivalencia
entre sistemas, y no se inventa ninguna.

## Reglas

- **Nada se redacta ni se infiere.** Lo que la fuente no trae no se escribe: no hay propiedad nula disfrazada.
  Ninguna fuente cargada publica **rangos de referencia**, así que no hay ninguno.
- **Dominio = navegación.** Sale de la estructura oficial de cada fuente (CLASS/CLASSTYPE de LOINC,
  subgrupos de SIGTAP, secciones de ICD-10-PCS, prefijos de arancel revisados uno por uno). Lo que una
  regla no clasifica con certeza queda sin dominio o fuera, y se reporta con su tamaño.
- **Idempotente.** Ids deterministas y `ON CONFLICT DO NOTHING`: la segunda corrida inserta 0 filas de
  catálogo. No actualiza filas existentes. Como los ids no dependen de la versión, un código que ya
  estaba conserva su fila y sus propiedades, y una versión posterior de la fuente sólo agrega códigos
  nuevos. Corregir valores de una versión anterior es una migración de datos aparte.
