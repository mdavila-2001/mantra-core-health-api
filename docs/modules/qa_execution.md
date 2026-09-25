<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/qa_execution/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `qa_execution`

**Fuente:** [`src/modules/qa_execution/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/qa_execution/README.md)
· 1 controllers · 1 services · 0 repositories · 4 entidades · 1 DTO

---

# Módulo 68 — Plano de ejecución de QA en el servidor

El laboratorio (módulo 36) define suites, casos y aserciones y guarda la evidencia; este módulo
decide **qué se llama, contra qué destino, con qué límites y con qué aprobación**, y lo ejecuta
desde el worker `qa_lab`. El navegador pide, aprueba y observa; no ejecuta. Decisiones en
[ADR-0025](../../../docs/adr/ADR-0025-qa-runner-en-servidor.md).

## Endpoints

| Método y ruta | Rol | Descripción |
| --- | --- | --- |
| `GET /admin/qa/targets` | lectura QA | Destinos por entorno (nombre de la variable del secreto, nunca su valor) |
| `PUT /admin/qa/environments/:id/target` | `QA_ADMIN`, `SECURITY_ADMIN` | Registrar el destino: esquema, host, puerto, prefijos, red privada, mutaciones, topes |
| `POST /admin/qa/plans/preflight` | `QA_ADMIN`, `QA_ENGINEER` | Dry-run: pasos, URLs, límites recortados, hash, si requiere aprobación. No llama a nada |
| `POST /admin/qa/plans` | `QA_ADMIN`, `QA_ENGINEER` | 202; queda `QUEUED` o `PENDING_APPROVAL`. `Idempotency-Key` opcional |
| `POST /admin/qa/plans/:id/approvals` | `QA_ADMIN`, `RELEASE_MANAGER`, `SECURITY_ADMIN` | Aprueba/rechaza **el hash vigente**, con vencimiento; quien pidió no aprueba |
| `POST /admin/qa/plans/:id/cancel` | `QA_ADMIN`, `QA_ENGINEER` | Cancela ya si está en espera; en marcha lo confirma el runner entre casos |
| `GET /admin/qa/plans` · `plans/:id` | lectura QA | Plan con pasos, límites, aprobaciones y bitácora ordenada |
| `POST /internal/qa/plans/run-next` | `SYSTEM` | Lo llama el worker `qa_lab` cada 5 s |

La lectura del laboratorio (`GET /admin/qa/environments|suites|suites/:id|runs|runs/:id|defects`)
vive en el módulo 36 (`QaLabReadController`).

## Estados del plan

```
PENDING_APPROVAL ──approve──> QUEUED ──worker──> RUNNING ──> PASSED | FAILED | TIMED_OUT
        │   └──reject──> REJECTED                  │         CANCELLED | INFRA_ERROR
        └──cancel──> CANCELLED                     └── aprobación vencida ⇒ PENDING_APPROVAL
```

`INFRA_ERROR` no es un defecto del producto: destino bloqueado por la guarda, error de
transporte, `PLAN_DRIFT`, `SECRET_MISSING` o `WORKER_LOST` (un plan interrumpido no se reintenta
para no duplicar mutaciones).

## Tablas (schema `qa_execution`)

`execution_targets`, `execution_plans` (job + evidencia de lo aprobado), `plan_approvals`
(append-only), `plan_events` (bitácora, sin cuerpos ni secretos).

## Pruebas

Dominio (`domain/*.spec.ts`: guarda SSRF con IPv4/IPv6/mapeadas/encoding, plan, aprobación),
cliente HTTP contra un servidor local real, autorización por handler, y
`test/integration/qa-execution.int-spec.ts` de extremo a extremo.

