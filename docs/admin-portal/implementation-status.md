# Portal administrativo — estado de implementación (backend)

Archivo de continuidad: al retomar, leer esto, revisar `git diff` y seguir la **siguiente acción**.
Brechas y plan por pilar en [inventario-y-brechas.md](inventario-y-brechas.md).

## Estado

| Campo | Valor |
| --- | --- |
| Rama | `feat/admin-portal-catalog` (desde `dev` @ `98e7fb5a`), sin commit |
| Backend | Incrementos 1–5 implementados y verificados localmente; **no desplegado**, sin PR |
| Frontend | En curso en `mantra-core-health` (ver su `docs/admin-portal/`) |

## Incrementos

| # | Pilar ATLAS | Entregable | Rutas | ADR |
| --- | --- | --- | --- | --- |
| 1 | Catálogo | Módulo 67 `data_catalog`: escaneo durable de `pg_catalog`, fichas con revisión y evidencia, cobertura explicada | `/admin/catalog/*`, `/internal/catalog/scans/run-next` | 0024 |
| 2 | Webtracking | Lectura en `telemetry`: resumen, series, web vitals por distribución, embudos por sesión, salud del pipeline, timeline sin valores | `/admin/analytics/*` | — |
| 3 | QA Lab | Módulo 68 `qa_execution`: runner en servidor con guarda SSRF, plan con hash, aprobación, worker; **evaluación real de aserciones** en `qa_lab`; lectura del laboratorio | `/admin/qa/*`, `/internal/qa/plans/run-next` | 0025 |
| 4 | Gobierno y operación | `ops_console` (sin tablas): incidentes, despliegues, cambios, SLO, backups y **readiness explicable** | `/admin/ops/*` | — |
| 5 | Impacto | Grafo estructural por FK observadas con profundidad, tope, truncamiento y alcance declarados | `/admin/catalog/objects/:id/impact` | — |
| 6 | Observabilidad | Medición HTTP en proceso (`src/observability/http-sli`) sobre `time_series.service_sli_series`, índice de rutas y lectura de tráfico y usuarios activos; **sin PHI** (plantilla de ruta, nunca la URL) | `GET /admin/ops/traffic`, `/admin/ops/traffic/endpoints` | 0027 |
| 7 | Catálogo (bóveda) | Origen `IMPORTED_VAULT` en las fichas (nunca nacen aprobadas), importador `yarn catalog:import-vault`, explicación por schema desde `SALUD/Módulos` (`yarn catalog:schemas`) | `PUT …/annotation` (`origin`), `GET /admin/catalog/schemas` (`description`) | 0024 |
| 8 | Flujos | Catálogo de flujos como artefactos JSON (`qa_lab/flows/catalog`), validador, seed opt-in `SEED_QA_FLOWS` a suites `FLOW-<id>` y lectura con contrato `DECLARED/MISSING` y veredicto por rama | `GET /admin/qa/flows`, `/admin/qa/flows/:flowId` | — |

## Verificación (2026-09-18)

| Gate | Resultado |
| --- | --- |
| Integración contra PostgreSQL 17 real (DDL canónico + patches 4.2.19/4.2.20) | **PASS 45/45** (catálogo 21, analítica 9, QA runner 10, operación 5) |
| Unitarias de las áreas tocadas (`data_catalog`, `telemetry`, `qa_lab`, `qa_execution`, `ops_console`, `system_ops`, `platform_ops`, `common`, `orm`, `worker`) | PASS 1284; 1 rojo **preexistente** (`terminology-designations.es.spec.ts`, falla igual sin estos cambios) |
| Volumen del catálogo (1 200 tablas × 17 columnas) | primer escaneo 10,0 s; re-escaneo 4,7 s |
| `tsc --noEmit` | PASS en lo nuevo; 5 errores preexistentes (`pdfkit`/`qrcode` no instalados) |
| `eslint` de lo nuevo | PASS |
| `alovida:guardrails` | 0 hallazgos nuevos |
| Suite unitaria completa | **NOT_RUN** — se cortó por falta de memoria del equipo |
| Arranque de `AppModule` / Docker con los módulos nuevos | **NOT_RUN** (argon2 bloqueado en el host; stack no levantado) |
| Primer escaneo contra la base real de mantra | **NOT_RUN** |

Bugs encontrados por la integración real: arrays JS expandidos por el driver, orden padre→hijo
sin `@ManyToOne`, coma flotante en percentiles, entorno cacheado en una regla de seguridad.
Hallazgos preexistentes corregidos: `verdictFor` no evaluaba (toda aserción "pasaba") y una
corrida sin casos ejecutados cerraba PASSED.

## Pendientes

1. Levantar el stack con los módulos nuevos (`docker compose build api && docker compose up -d --force-recreate postgres-init api worker-data_catalog worker-qa_lab`) y lanzar el primer escaneo real.
2. Declarar los `.puml` de los módulos 67 y 68 (salida del desvío de ADR-0021).
3. ~~Importador de evidencia desde la bóveda como `VAULT_NOTE` (nunca aprobada automáticamente).~~ **Hecho el 2026-10-17** (incremento 7): se importan como borrador `IMPORTED_VAULT`; el texto de la bóveda es casi todo plantilla y se marca como tal. Falta quien redacte la explicación real de cada tabla.
4. Readiness: excepciones con owner/motivo/vencimiento; control de aislamiento cuando exista RLS efectivo.
5. QA: carga/estrés, **journeys con extracción de variables** (hoy 39 de las 66 ramas de los flujos no tienen caso por esto), SSE de progreso, artefactos binarios.
6. Ingesta de telemetría: persistir duplicados/descartes para que la salud del pipeline los mida.

## Superadministración (2026-10-17)

Incrementos 6–8 y el detalle de lo verificado y de lo que no, en
[`docs/trabajo/2026-10-17-superadmin/REPORTE.md`](../trabajo/2026-10-17-superadmin/REPORTE.md). Resumen honesto: se
verificó contra una API real y un PostgreSQL 16 descartable (no Docker, no Timescale); la suite completa **no** se corrió;
la columna «Rama» y «sin commit» de arriba son del estado de septiembre. Quedan: seed por endpoint y
`GET /admin/qa/endpoints-coverage` (segunda entrega) y ejecutar un plan sobre `FLOW-<id>` contra la propia API
(hoy sólo se probó contra un destino que hace de la API).
