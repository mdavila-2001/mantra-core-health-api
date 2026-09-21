# Portal administrativo — inventario del backend y brechas frente a ATLAS

Fecha: 2026-09-18 · Rama base: `dev` @ `98e7fb5a` · Fuente de inspiración: paquete
*Atlas_Admin_Portal_Prompts* (especificación, no implementación).

Este documento dice **qué hay** en `mantra-core-health-api` para cada pilar de ATLAS, **qué
falta** para que un portal lo pueda operar, y en qué incremento se cierra. Los endpoints listados
se extrajeron de los decoradores de los controladores (OBSERVED), no de documentación.

## Hallazgo transversal

Los módulos de plataforma **no tienen lectura**: `qa_lab`, `platform_ops`, `system_ops`,
`telemetry` y `reporting` exponen sólo `POST`/`PATCH`/`PUT` por caso de uso; `audit` tiene un
único `GET /audit/history/:entity/:id`. El modelo de datos para casi todo ATLAS ya existe (las
1159 tablas del modelo canónico); lo que falta es la **capa de consulta** con cursor, filtros
tipados y autorización, y en QA el **plano de ejecución**.

## Por pilar

| Pilar ATLAS | Lo que ya existe (OBSERVED) | Brecha | Incremento |
| --- | --- | --- | --- |
| **Catálogo** (B02) | `system_ops.entity_registry` / `field_registry` (registro de gobierno: retención, PII/PHI, owner_team). Bóveda con una nota por tabla, en texto de plantilla | Sin descubrimiento técnico, sin justificación/grano/owner curados, sin revisión ni evidencia, sin lectura | **1 — hecho** (módulo 67 `data_catalog`, ADR-0024) |
| **Webtracking** (B03) | `telemetry`: `POST activity-events`, `web-vitals`, `conversion-events`, `funnels`, `event-schemas`, `tracking-consents`(+`withdraw`), `tracking-purposes`, `disclosure-*`, `session-journeys/:id/close`. Tablas `tracking_sessions`, `frontend_page_views`, `user_activity_events`, `web_vitals`, `funnel_definitions/steps`, `activity_event_schema_definitions`. Reenvío opcional a GA4 server-side | Sin agregados ni consultas: métricas por ruta/tiempo, sesiones, embudos (denominador, ventana), errores/RUM con percentiles desde distribución, salud del pipeline (received/accepted/rejected/duplicate) | 2 |
| **QA Lab** (B04) | `qa_lab`: entornos, suites, casos, aserciones, corridas, defectos deduplicados, schedules (worker `qa_lab`), enlace a release | **El backend no ejecuta nada**: `POST /qa/runs/:runId/cases/:caseId/execute` guarda lo que el cliente dice que envió y recibió (`targetUrl`, `requestBodyJson`, `responseBodyJson`). Faltan runner server-side con allowlist de destinos y protección SSRF, aprobación persistida ligada a hash del plan, cancelación cooperativa, artefactos con autorización de descarga, y lectura | 3 |
| **Gobierno y operación** (B05) | `system_ops` (políticas, legal holds, backup/restore tests, frameworks, hallazgos, remediación), `platform_ops` (cambios con CAB, despliegues, incidentes, postmortems, SLO y error budget, readiness reviews, runbooks, ejercicios), `audit` (WORM, historial por entidad), `reporting` | Sin lectura para listados/detalle; sin readiness **explicable** (controles PASS/FAIL/UNKNOWN/N/A con evidencia y caducidad); sin jobs/alertas consultables | 4 |
| **Lineage e impacto** (B05) | `health_lineage_edges`, `lakehouse_lineage_edges`, calidad en `health_data_quality_*` y `lakehouse_quality_*` | Sin grafo consultable tabla → columna → endpoint → regla → suite; sin vínculos del catálogo a lineage | 5 (depende de 1 y 3) |

## Riesgos del diagnóstico ATLAS contrastados con este backend

| ATLAS | Aquí | Estado |
| --- | --- | --- |
| R01 runner en el navegador | El backend de QA sólo registra payloads reportados por el cliente | Confirmado — incremento 3 |
| R02 aprobación = texto de ticket | Módulo 46 sí persiste aprobaciones del CAB con segregación; QA no tiene aprobación | Parcial — incremento 3 |
| R05 columnas opcionales / contrato inestable | Catálogo nuevo con `is_nullable` obligatorio y procedencia | Cerrado en 1 |
| R10 "no hay columnas" vs filtro sin coincidencias | Lista vacía con `items: []` y filtros explícitos; el portal decide el mensaje | Cerrado en 1 (contrato) |
| R11 `isNullable` indefinido pintado como NOT NULL | Booleano obligatorio en `catalog_columns` | Cerrado en 1 |

## Lo que NO se afirma

- No se ejecutó el catálogo contra la base real de mantra (el stack local no estaba levantado);
  se midió con 1 200 tablas sintéticas. El primer escaneo real queda como verificación pendiente.
- No se verificó RLS ni la cuenta de catálogo dedicada (ver ADR-0023: la app conecta como
  superusuario). La introspección declara esa limitación en cada corrida.
