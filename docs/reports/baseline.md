# Línea base del repositorio

> Fase 0 del Plan Maestro de Documentación. Fotografía reproducible del estado real del
> backend antes de construir documentación definitiva. Fecha: **2026-07-29**.
> Commit evaluado: `15c132d3348cb9f668f8fd3eb1b156169d2ea130` (rama
> `redesa/auditoria-correccion-integral`).

## 1. Identificación del sistema

| Aspecto | Valor real observado | Evidencia |
|---|---|---|
| Framework | NestJS 11 (`@nestjs/core@^11.0.1`, `@nestjs/cli@^11.0.0`) | `package.json` |
| Lenguaje | TypeScript, `target: ES2023`, `module: nodenext`, `strict: true` | `tsconfig.json` |
| Gestor de paquetes | Yarn 1.22.22 (classic), lockfile `yarn.lock` | `package.json`, entorno |
| Runtime | Node.js v24.18.0 | entorno de ejecución |
| ORM | MikroORM 7 (`@mikro-orm/core`, `@mikro-orm/postgresql`, `@mikro-orm/nestjs`) | `package.json` |
| Motor de datos principal | PostgreSQL (vía `DB_HOST`/`POSTGRES_*`) | `docker-compose.yml`, `.env.example` |
| Motores de datos secundarios | MongoDB 7 (`mongodb` driver, `document_store`), Redis (`ioredis`, `redis_runtime`), OpenSearch (`OPENSEARCH_NODE`), MinIO/S3 (`@aws-sdk/client-s3`, `object_storage`) | `docker-compose.yml`, `src/modules/{document_store,redis_runtime,search_platform,object_storage}` |
| Colas / procesamiento asíncrono | Sin broker de mensajería externo (no Kafka/RabbitMQ/NATS/BullMQ). Patrón outbox propio sobre Postgres (`OutboxService.publishDomainEvent`) consumido por **20 procesos worker** HTTP independientes | `src/modules/messaging/services/outbox.service.ts`, `src/worker-*.ts`, `docker-compose.yml` |
| Autenticación | JWT propio (`@nestjs/jwt`), `TokenService`, roles vía `authz` (RBAC + PDP clínico aditivo) | `src/common/auth`, `src/modules/authz` |
| Infraestructura / despliegue | Docker Compose multiservicio (api + 20 workers + postgres + mongodb + redis + opensearch + minio) | `docker-compose.yml`, `Dockerfile` |
| Documentación de API existente | `@nestjs/swagger@^11.4.6` montado en `/docs`, **solo fuera de `NODE_ENV=production`**; sin `redocly.yaml`, sin Scalar, sin `openapi/openapi.yaml` versionado | `src/main.ts` |
| Módulos de dominio | **57** módulos bajo `src/modules/*` | `ls src/modules`, confirmado por `tools/redesa/coverage-report.mjs` |
| Controllers / endpoints declarados | **191 controllers**, **850 endpoints** (estático, `tools/redesa/coverage-report.mjs`) | ver §4 |
| Entidades mapeadas | **1184** tablas/entidades | ver §4 |
| Herramientas de pruebas | Jest (unitarias e integración, configs separadas `test/jest-integration.json`, `test/jest-smoke.json`, `test/jest-e2e.json`), Testcontainers para Postgres real en integración | `package.json`, `test/` |
| Analizador propio de reglas de negocio | `tools/redesa/guardrails.mjs` y `tools/redesa/coverage-report.mjs` (REDESA: gobierno de dominios, huérfanos, cross-domain access) | `tools/redesa/` |
| Catálogo ORM propio | `tools/catalog/generate-catalog.mjs`, `tools/catalog/audit-fidelity.mjs` contra `graphify-out/fidelity-audit.json` | `tools/catalog/` |

No existen previamente: OpenAPI versionado en `openapi/`, `redocly.yaml`, integración Scalar, portal MkDocs, `structurizr/workspace.dsl`, ADRs, AsyncAPI, catálogo de datos, modelo de amenazas formal o runbooks. Este plan los crea desde cero sobre este sistema real.

## 2. Comandos ejecutados y resultado

| Comando | Resultado | Detalle |
|---|---|---|
| `yarn build` (`nest build`) | ✅ Éxito | Compila en 14.81s sin errores. |
| `yarn lint` (`eslint ... --fix`) | ❌ Falla (exit 1) | **28117 problemas** (22495 errores, 5622 warnings) tras autofix. Ver §3 — es deuda preexistente, no introducida por esta iniciativa documental. |
| `yarn test` (unitarias, Jest) | ⏳ Ver actualización — comando de larga duración, resultado se añade cuando termina la ejecución en curso. | — |
| `yarn audit` (dependencias) | ⚠️ 16 vulnerabilidades **high**, 0 critical/moderate/low, sobre 1073 dependencias totales | Ver §3.3 |
| `node tools/redesa/coverage-report.mjs` | ✅ Éxito | 1184 entidades, 850 endpoints/191 controllers, 57 módulos, 0 `ORPHAN_TABLE`, 0 `ORPHAN_ENDPOINT`, **1** `DIRECT_CROSS_DOMAIN_ACCESS` (ver §3.4) |
| Generación OpenAPI actual | ⚠️ Existe (`SwaggerModule` en `/docs`), pero **no versionada como contrato** (`openapi/openapi.yaml` no existe) y **deshabilitada en producción** | `src/main.ts:76-84` |

## 3. Hallazgos de línea base — bloqueos y riesgos

### 3.1 Lint: 22495 errores, concentrados en reglas de seguridad de tipos

Desglose por regla (top):

| Regla | Ocurrencias |
|---|---:|
| `@typescript-eslint/no-unsafe-argument` | 5622 |
| `@typescript-eslint/no-unsafe-member-access` | 5617 |
| `@typescript-eslint/no-unsafe-assignment` | 5476 |
| `@typescript-eslint/no-unsafe-call` | 5329 |
| `@typescript-eslint/no-explicit-any` | 5121 |
| `@typescript-eslint/require-await` | 416 |
| `@typescript-eslint/no-unsafe-return` | 411 |
| `@typescript-eslint/no-unused-vars` | 94 |
| `@typescript-eslint/no-base-to-string` | 20 |
| `@typescript-eslint/no-unsafe-enum-comparison` | 7 |

**Clasificación:** `HIGH` (no bloqueante para documentación, sí para "listo para producción" con reglas estrictas de lint activas en CI).

**Causa:** la configuración de ESLint (`eslint.config.mjs`) exige tipado estricto (`no-unsafe-*`, `no-explicit-any`) en todo `src/`, `test/` y `apps/`, pero un volumen significativo de código —predominantemente en specs de integración/smoke y algunos servicios— usa `any` implícito o resultados no tipados de MikroORM/HTTP.

**Impacto:** `yarn lint` no puede usarse como gate de CI en su forma actual sin fallar sistemáticamente; cualquier pipeline de CI/CD documental (Fase 15 de este plan) que incluya lint como paso debe registrarlo como **known-failing** hasta que se remedie aparte.

**Decisión de alcance:** corregir ~22500 errores de tipado en 57 módulos está fuera del alcance de una iniciativa de documentación y representa un cambio de código masivo y riesgoso que requiere su propio plan de remediación. **Se registra como deuda bloqueante para "lint en CI estricto"**, no se corrige aquí. El pipeline de CI/CD documental (Fase 15/16) se diseña para no depender de que `yarn lint` pase.

### 3.2 Build

Sin hallazgos. `nest build` compila limpio sobre TypeScript estricto (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`).

### 3.3 Auditoría de dependencias — 16 altas

Todas las 16 advertencias `high` provienen de la misma causa raíz: `brace-expansion@<=5.0.7` (CVE-2026-14257, GHSA-mh99-v99m-4gvg), transitiva de `minimatch`/`glob`, alcanzada únicamente a través de **dependencias de desarrollo** (`eslint`, `jest`, `@testcontainers/postgresql`). No hay ruta de alcance en dependencias de producción (`dependencies` en `package.json`).

**Impacto real:** bajo — el vector de explotación requiere pasar entrada de atacante a `expand()`/patrones glob de `minimatch`, algo que no ocurre en el runtime de producción (herramientas de build/test, no código servido). **Riesgo residual aceptado para el propósito de este informe**; se documenta en `docs/security/dependency-security.md` (Fase 12) con recomendación de actualizar `brace-expansion` a `>=5.0.8` en el próximo mantenimiento de dependencias.

### 3.4 REDESA guardrails — 1 acceso cross-domain directo

`src/modules/billing/repositories/practices-lookup.repository.ts` importa una entidad del dominio `practice` directamente, violando la regla de aislamiento de dominios (cada módulo debe leer otros dominios vía servicio/puerto, no repositorio ajeno).

**Clasificación:** `HIGH` (arquitectural, no de seguridad de datos).
**Registro:** se documenta como excepción conocida en `docs/governance/traceability-matrix.md` y en `docs/architecture/module-dependencies.md` (Fase 1); no se corrige en esta fase porque corregirlo requiere diseño de un puerto de lectura entre `billing` y `practice` fuera del alcance documental — se traslada como acción a `ESTADO-Y-PENDIENTES.md`.

### 3.5 Endpoints y contrato

850 endpoints en 191 controllers **no tienen** contrato OpenAPI versionado ni gobierno automático (Redocly). El `SwaggerModule` actual genera el documento en caliente desde decoradores parciales (no confirmado que todos los controllers usen `@ApiTags`/`@ApiOperation`; se audita en Fase 2). Esto es la brecha central que las Fases 5-7 de este plan cierran.

## 4. Riesgos iniciales identificados (entrada a Fase 2 — análisis de brechas)

1. **Sin contrato OpenAPI versionado** → bloquea Scalar, Redocly, pruebas de contrato, CI documental. `BLOCKER`.
2. **Lint estricto no pasa** → no puede ser gate de CI documental sin quedar permanentemente rojo. `HIGH`, gestionado por exclusión explícita.
3. **1 violación de aislamiento de dominio** (billing → practice) → debe aparecer en el modelo de amenazas y en la matriz de trazabilidad como riesgo arquitectónico conocido. `HIGH`.
4. **20 workers sin documentación operativa** (arranque, apagado ordenado, reintentos, colas que consumen) → bloquea Fase 11 (AsyncAPI/eventos) y Fase 13 (runbooks). `CRITICAL`.
5. **Swagger deshabilitado en producción** sin alternativa (Scalar protegido) documentada → bloquea Fase 4 (Scalar) hasta decidir estrategia de exposición. `HIGH`.
6. **16 vulnerabilidades de dependencias** (todas dev-only, mismo CVE) → bajo riesgo real, se documenta y no bloquea. `MEDIUM`.
7. **Ningún ADR existente** pese a decisiones arquitectónicas grandes ya tomadas (MikroORM, RLS, PDP clínico aditivo, outbox propio, JWT propio) → se reconstruyen retroactivamente en Fase 10. `HIGH`.

Documentación previa relevante conservada como registro histórico: ver
[hito de los primeros 30 endpoints](endpoints-first-30-2026-07-milestone.md) — superado por el
contrato OpenAPI completo (Fase 5), conservado por trazabilidad.

## 5. Resultado de pruebas unitarias

```
Test Suites: 369 passed, 369 total
Tests:       3724 passed, 3724 total
Snapshots:   0 total
Time:        473.418 s
```

✅ **100% verde** — 369 suites / 3724 tests unitarios pasan sin fallos sobre el commit evaluado.

**Hallazgo menor:** Jest reporta *"A worker process has failed to exit gracefully and has been force exited... Active timers can also cause this"*. No afecta el resultado (exit 0) pero indica un handle no liberado (temporizador, conexión) en algún test o en el código bajo prueba. Clasificación `MEDIUM`; se registra en `docs/testing/unit-tests.md` (Fase 14) como deuda a investigar con `--detectOpenHandles`, no bloquea esta iniciativa.

No se ejecutaron en esta fase `yarn test:integration` ni `yarn test:e2e` (requieren Postgres real vía Testcontainers/Docker); su resultado se registra en `docs/testing/integration-tests.md` cuando se ejecuten en Fase 14, dado que no son necesarias para bloquear el arranque de la documentación.
