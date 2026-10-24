# Plan — Buscador de centros por cobertura de estudios

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` · Predecesor: ninguno en la API. El
  front que consume esta búsqueda está en `mantra-core-health` #1186 (`mockup`); en `dev` (#1188) y
  `test` (#1189) la pestaña de imagenología espera esta pieza.
- Rama: `itzan/diagnostic-coverage-dev` desde `dev` (`e6670d87`). Después, la misma entrega a `test`
  en `itzan/diagnostic-coverage-test`.
- Resultado observable: el paciente, en «Dónde conseguir lo de mi receta → Centros de imagenología»,
  ve los centros que tienen **todos** sus estudios pendientes primero, del más cercano al más lejano,
  y en los demás qué le falta. Del lado de la API: `GET /diagnostic-units/search?studyConceptIds=…`
  devuelve por centro `complete`, `missingStudyConceptIds`, `distanceKm`, `addressText`, `latitude` y
  `longitude`.
- Kill-test: `GET /diagnostic-units/search?studyConceptIds=<uuid>` responde 400 por parámetro no
  permitido, o un ítem sin `complete`.

## Alcance

- IN:
  - `src/modules/diagnostic_units/dto/catalog.dto.ts`: parámetros y DTOs nuevos.
  - `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts`: un método.
  - `src/modules/diagnostic_units/services/diagnostic-units-search.service.ts`: modo cobertura.
  - `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts`: ruteo del modo y
    respuesta documentada.
  - `src/common/geo/`: distancia en línea recta, nuevo.
  - Los specs de esos archivos.
  - Los artefactos que el gate de docs regenera: `openapi/`, `docs/modules`, `docs/data`,
    `docs/postman`.
  - Este plan, su reporte y `evidencia/`.
- OUT:
  - El esquema, el DDL y los seeds: la pieza no necesita columnas nuevas.
  - Las tres copias de `haversineKm` que ya existen (farmacia, comunidad, marketplace): no se
    consolidan acá.
  - El buscador sin `studyConceptIds`: responde igual que hoy.
  - `@TenantAgnostic()`, sin `@Roles`: queda como está. Es un directorio público a propósito.
  - El front: va en su propio repo.
- Ambigüedades registradas:
  1. **Estudio por concepto y no por código.** `diagnostic_study_offerings.study_code` es el código
     propio de cada centro (`entities/diagnostic_study_offerings.entity.ts:34-35`). La orden del
     paciente trae el concepto, igual que `study_concept_id` (`:40-41`). Supuesto: se busca por
     `study_concept_id`. Es lo que el front ya manda. Confirmar con el equipo de diagnóstico.
  2. **Sede principal.** No hay un flag: está el rol `DUNIT.SITE_ROLE_PRIMARY`
     (`diagnostic_units.concepts.ts:46-49`). Supuesto: la sede activa con ese rol; si no hay
     ninguna, la primera sede activa por `createdAt`, que es el orden de `findActiveSites`.
  3. **Orden y página en memoria.** La distancia sale de dos saltos (sede → `practice_sites` →
     `addresses`) y no se puede ordenar en SQL sin tocar el esquema. Supuesto: se traen todos los
     centros que ofrecen al menos uno de los estudios pedidos y pasan los filtros, se ordenan y se
     corta la página. Es lo mismo que hace la disponibilidad de farmacia
     (`read-pharmacy-inventory.use-case.ts:283-287`).
  4. **Otros filtros con cobertura.** Supuesto: `q`, `tenantId`, `kind`, `studyCode`,
     `insurerTenantId`, las prestaciones, `maxAmount` y `minRating` siguen aplicando igual. Solo
     cambia el orden y se agregan los campos.

## H1 — El buscador responde por cobertura

**CA:** Dado un paciente con estudios pedidos, cuando se busca con `studyConceptIds`, entonces cada
centro dice si los tiene todos, cuáles le faltan y a qué distancia está, y los completos salen
primero.

**DoD:** `corepack yarn test src/modules/diagnostic_units src/common/geo` en verde,
`corepack yarn typecheck` exit 0 y `corepack yarn lint` exit 0.

**Estado:** HECHO

### H1.S1 — Contrato de entrada

**CA:** Dado un pedido con parámetros mal formados, cuando llega al buscador, entonces responde 400
y no consulta nada.

**DoD:** spec del DTO y del controller.

**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | `studyConceptIds`: uuids separados por coma, sin repetidos, de 1 a 50 | `a,b,a` → `[a,b]`; `x` → error de validación | `corepack yarn test src/modules/diagnostic_units/dto` → verde | HECHO |
| H1.S1.M2 | `lat`/`lng`: números en rango WGS84 | `lat=91` → error; `lat=-17.7` válido | idem | HECHO |
| H1.S1.M3 | `lat` sin `lng` (o al revés) → 400 con mensaje | pedido con uno solo → `BadRequestException` | `corepack yarn test src/modules/diagnostic_units/services` → verde | HECHO |

### H1.S2 — Datos

**CA:** Dado un conjunto de conceptos, cuando se consulta el catálogo, entonces se obtiene qué
conceptos de ese conjunto ofrece cada centro, solo con ofertas activas.

**DoD:** spec del repositorio.

**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S2.M1 | `findOfferedConcepts(em, conceptIds)` → mapa centro → conceptos ofrecidos | filtra `study_concept_id $in` y `OFFERING_ACTIVE`; lista vacía → sin consulta | `corepack yarn test src/modules/diagnostic_units/repositories` → verde | HECHO |

### H1.S3 — Cálculo

**CA:** Dado el origen y los centros, cuando se arma la respuesta, entonces la distancia es en línea
recta desde la sede principal, los faltantes se cuentan contra lo pedido y el orden es: completos →
distancia (sin distancia al final) → nombre.

**DoD:** spec del servicio.

**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S3.M1 | `straightLineKm` en `src/common/geo/` (otro nombre que las tres copias locales, para no confundirlas) | La Paz–Santa Cruz ≈ 552 km con un decimal; el mismo punto da 0 | `corepack yarn test src/common/geo` → verde | HECHO |
| H1.S3.M2 | Sede principal → dirección → `addressText`, `latitude`, `longitude` | rol primario gana sobre la primera sede; sin dirección → `null` | spec del servicio → verde | HECHO |
| H1.S3.M3 | `complete` y `missingStudyConceptIds` contra lo pedido | centro con 1 de 2 → `complete=false`, falta el otro | idem | HECHO |
| H1.S3.M4 | Orden y página | completo lejos antes que incompleto cerca; sin origen → `distanceKm=null` y orden por nombre; `offset`/`limit` cortan después de ordenar | idem | HECHO |
| H1.S3.M5 | Centros que no ofrecen ninguno → fuera; ninguno → página vacía sin más consultas | `total=0`, sin llamar a `searchVisible` | idem | HECHO |

### H1.S4 — Ruteo y contrato publicado

**CA:** Dado el buscador, cuando no llega `studyConceptIds`, entonces la respuesta es idéntica a la
de hoy; cuando llega, entonces usa el modo cobertura y el contrato publicado lo documenta.

**DoD:** spec del controller y los artefactos regenerados.

**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S4.M1 | El controller deriva a cobertura solo con `studyConceptIds` | sin el parámetro → `search`; con él → `searchCoverage` | `corepack yarn test src/modules/diagnostic_units/controllers` → verde | HECHO |
| H1.S4.M2 | Regenerar `openapi/`, endpoints, módulos, catálogo de datos y Postman | `git diff --exit-code` del gate de docs limpio después de regenerar y commitear | `yarn docs:openapi:generate && yarn docs:endpoints:generate && yarn docs:modules:sync && yarn docs:data:sync && yarn postman:generate` exit 0 | HECHO |
| H1.S4.M3 | Sin cambios incompatibles en el contrato | parámetros y campos nuevos, solo aditivos | `corepack yarn docs:openapi:check-breaking` exit 0 | HECHO |

## H2 — Verificado contra la base

**CA:** Dado el stack con datos de diagnóstico, cuando se pide con dos conceptos y un origen,
entonces la respuesta real tiene completos primero, ordenados por distancia, y faltantes correctos;
sin `studyConceptIds`, la respuesta no cambió.

**DoD:** `curl` contra la API corriendo, salida en `evidencia/`.

**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Dos conceptos ofrecidos por centros distintos, con origen | orden y faltantes coinciden con lo que dice la base | `curl …/diagnostic-units/search?studyConceptIds=a,b&lat=…&lng=…` → `evidencia/cobertura.json` | HECHO |
| H2.S1.M2 | El buscador de siempre, sin el parámetro | misma respuesta que en `dev` | `curl …/diagnostic-units/search?kind=IMAGING` → `evidencia/sin-cobertura.json` | HECHO |

## H3 — Regresión y entrega

**CA:** Dado el cambio, cuando corre la suite y los gates, entonces no aparecen rojos nuevos frente a
`dev`.

**DoD:** suite unitaria completa, contrastando cualquier rojo contra `dev` sin el cambio, más el PR.

**Estado:** EN CURSO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Suite unitaria completa | sin rojos propios | `corepack yarn test` → resumen en `evidencia/` | HECHO |
| H3.S1.M2 | PR a `dev` con este plan y su reporte | PR abierto y mergeable | `gh pr view <n> --json mergeable` | TODO |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| La API y su base no están levantadas | H2 queda sin verificar | `BLOQUEADO` en el reporte; H1 queda cubierto por unitarias |
| Muchos centros ofrecen uno de los estudios | Proyectar todos en memoria cuesta | El universo ya viene acotado por concepto, tipo y filtros; se registra el tamaño observado en H2 |
| El generador de Postman pide `python3` | M2 de H1.S4 no corre en esta máquina | Se corre con el intérprete disponible y se deja dicho |
