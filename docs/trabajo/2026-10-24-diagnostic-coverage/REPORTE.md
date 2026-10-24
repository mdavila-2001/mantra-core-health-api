# Reporte — Buscador de centros por cobertura de estudios

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `itzan/diagnostic-coverage-dev`
- Peldaño de evidencia alcanzado: `VERIFIED`. Faltan el PR y la entrega a `test` para `REGRESSION_VERIFIED`.
- Avance: 16 / 16 microtareas HECHO (100 %). PR a `dev`: #841.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1–M2 | `studyConceptIds` (uuids separados por coma, sin repetidos, de 1 a 50); `lat`/`lng` en rango WGS84 | `corepack yarn test src/modules/diagnostic_units/dto` | verde |
| H1.S1.M3 | `lat` sin `lng` → 400 | spec del servicio + `evidencia/origen-a-medias.json` | `400 VALIDATION_FAILED` |
| H1.S2.M1 | `findOfferedConcepts`: ofertas activas por `study_concept_id`, agrupadas por centro | `corepack yarn test src/modules/diagnostic_units/repositories` | verde |
| H1.S3.M1 | `straightLineKm` y `coordinateOf` en `src/common/geo/` | `corepack yarn test src/common/geo` | 5/5 |
| H1.S3.M2–M5 | Sede principal, faltantes, orden, página, vacío sin consultas | `corepack yarn test src/modules/diagnostic_units/services/diagnostic-units-search` | 21/21 (9 nuevos) |
| H1.S4.M1 | El controller deriva a cobertura solo con `studyConceptIds` | `corepack yarn test src/modules/diagnostic_units/controllers` | verde |
| H1.S4.M2 | `openapi/`, endpoints, módulos, catálogo de datos y Postman regenerados | `yarn docs:openapi:generate`, `docs:endpoints:generate`, `docs:modules:sync`, `docs:data:sync`, `postman:generate` | exit 0 en los cinco |
| H1.S4.M3 | Sin cambios incompatibles | `node tools/openapi/check-breaking.mjs --base <openapi.json de dev> --head openapi/openapi.json --exceptions tools/openapi/breaking-changes-exceptions.json` | `Sin cambios incompatibles no aprobados en el contrato OpenAPI.` |
| H2.S1.M1 | Cobertura real contra la base: completos, faltantes, orden por distancia | `GET /diagnostic-units/search?studyConceptIds=…&kind=IMAGING&lat=…&lng=…` | `evidencia/cobertura-*.json` |
| H2.S1.M2 | El buscador sin el parámetro no cambió de forma | `GET /diagnostic-units/search?kind=IMAGING` | `evidencia/sin-cobertura.json`, sin campos de cobertura |
| H3.S1.M1 | Suite unitaria completa | `corepack yarn test --silent` | `Tests: 1 skipped, 11119 passed, 11120 total` |

## A medias

ninguna

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H3.S1.M2 | HECHO | PR #841 a `dev`, mergeable |
| — | TODO | La misma entrega a `test` (`itzan/diagnostic-coverage-test`): el código de `diagnostic_units/`, `pharmacy_inventory/` y `common/http/` es idéntico entre `dev` y `test` |

## Evidencia

Specs dirigidos y gates:

```
$ corepack yarn test src/modules/diagnostic_units src/common/geo
Test Suites: 14 passed, 14 total
Tests:       117 passed, 117 total

$ corepack yarn typecheck   → exit 0
$ corepack yarn eslint <archivos tocados>   → exit 0

$ corepack yarn test --silent
Test Suites: 1 skipped, 899 passed, 899 of 900 total
Tests:       1 skipped, 11119 passed, 11120 total

$ node tools/openapi/generate-openapi.mjs
OpenAPI generado: 1389 paths, 1525 operaciones, 1419 esquemas.

$ node tools/openapi/check-breaking.mjs --base <dev> --head openapi/openapi.json --exceptions …
Sin cambios incompatibles no aprobados en el contrato OpenAPI.
```

Respuestas reales del buscador (datos de diagnóstico sembrados; dos centros de imagen que ofrecen
Ecografía abdominal y Radiografía de tórax):

```
# Los dos estudios, origen en Santa Cruz (evidencia/cobertura-completa.json)
total 2
Centro de Imagenología Equipetrol  complete=true  missing=[]  distanceKm=1
Centro Diagnóstico Cochabamba      complete=true  missing=[]  distanceKm=318.3

# Los dos más un concepto que nadie ofrece (evidencia/cobertura-con-faltante.json)
Centro de Imagenología Equipetrol  complete=false missing=[00000000-0000-4000-8000-000000000019] distanceKm=1
Centro Diagnóstico Cochabamba      complete=false missing=[00000000-0000-4000-8000-000000000019] distanceKm=318.3

# Origen en Cochabamba: el orden se invierte (evidencia/cobertura-origen-cochabamba.json)
Centro Diagnóstico Cochabamba      distanceKm=0.1
Centro de Imagenología Equipetrol  distanceKm=317.4

# Solo el concepto que nadie ofrece (evidencia/cobertura-sin-oferta.json)
{"total":0,"items":[]}

# lat sin lng (evidencia/origen-a-medias.json)
400 {"code":"VALIDATION_FAILED","message":"lat y lng van juntos: mande ambos para ordenar por distancia, o ninguno"}
```

`addressText`, `latitude` y `longitude` salen de la sede con rol principal de cada centro, por
ejemplo `Av. Beni 320, Equipetrol Norte, Santa Cruz de la Sierra, SCZ-EQP-320`, `-17.778`, `-63.19`.

## No cubierto

- **Un centro con varias sedes en la base real.** Los dos centros sembrados tienen una sede principal
  cada uno, así que la regla «la principal gana sobre la primera sede activa» solo está probada por el
  spec del servicio.
- **Volumen.** Con dos centros no se mide cuánto cuesta proyectar en memoria muchos centros que
  ofrecen uno de los estudios.
- **El front contra esta API.** La pestaña de imagenología de `dev`/`test` se conecta en un PR del
  front después de este.

## Desvíos del plan

- **La respuesta no es un `oneOf`.** El plan preveía documentar dos formas de respuesta. El chequeo
  de cambios incompatibles leyó el `oneOf` como si se hubieran quitado `items`, `total`, `limit` y
  `offset` (4 rupturas). Se cambió a campos **opcionales** en la misma tarjeta del buscador
  (`complete`, `missingStudyConceptIds`, `distanceKm`, `addressText`, `latitude`, `longitude`),
  documentados como «solo con `studyConceptIds`». El contrato solo crece y el chequeo pasa sin
  excepciones. Los tipos completos (`DiagnosticUnitCoverageItem`, `DiagnosticUnitCoveragePage`)
  quedan como tipos de TypeScript para el servicio.
- **La función de distancia se llama `straightLineKm` y no `haversineKm`**, para no confundirla con
  las tres copias locales que ya existen.
- **`findOfferedConcepts` tiene un spec propio.** El repositorio no tenía specs.
- **Commit aparte con el índice de endpoints de `scheduling`.** Al regenerar sobre `dev` actualizado
  (`27b5bdf5`) cambiaron `openapi/ENDPOINTS.md`, `openapi/endpoints/README.md` y
  `openapi/endpoints/scheduling.md`. `dev` trae cambios de `scheduling` en el controller y el DTO sin
  esos índices regenerados. Sin ellos, el paso «artefactos generados al día» del workflow de
  documentación fallaría en este PR por algo ajeno. No se tocó código de `scheduling`.

## Riesgos residuales

- La proyección corre sobre todos los centros que ofrecen al menos uno de los estudios pedidos, antes
  de cortar la página. Hoy son pocos; si crece el directorio, conviene medirlo.
- La sede principal se elige por el rol `SITE_ROLE_PRIMARY` y, si falta, por la primera sede activa.
  Un centro sin dirección cargada sale con `distanceKm`, `addressText`, `latitude` y `longitude` en
  `null`, al final de su grupo.

## Decisiones y ambigüedades

1. **Estudio por concepto.** La búsqueda va por `study_concept_id` porque `study_code` es el código
   propio de cada centro. Supuesto registrado en el plan; a confirmar con el equipo de diagnóstico.
2. **Sede principal.** Rol `SITE_ROLE_PRIMARY`; si no hay, la primera sede activa por `createdAt`.
3. **Orden y página en memoria**, igual que la disponibilidad de farmacia.
4. **Los demás filtros siguen aplicando con cobertura.** `kind`, `q`, `tenantId`, `studyCode`,
   `insurerTenantId`, las prestaciones, `maxAmount` y `minRating`.

### Hallazgo ajeno (no tocado)

`GET /diagnostic-units/{id}/administration` responde 500 con los dos centros de imagen sembrados:
`Cannot read properties of null (reading 'getUTCFullYear')`. Una fecha nula se formatea sin control
en la ficha administrativa. Este cambio no toca ese servicio.
