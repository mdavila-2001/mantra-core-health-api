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
3. Importador de evidencia desde la bóveda como `VAULT_NOTE` (nunca aprobada automáticamente).
4. Readiness: excepciones con owner/motivo/vencimiento; control de aislamiento cuando exista RLS efectivo.
5. QA: carga/estrés, journeys con extracción de variables, SSE de progreso, artefactos binarios.
6. Ingesta de telemetría: persistir duplicados/descartes para que la salud del pipeline los mida.
