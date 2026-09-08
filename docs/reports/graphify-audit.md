# Auditoría Graphify

> Fase 1 del Plan Maestro de Documentación. Primera fuente de descubrimiento arquitectónico,
> previa a cualquier documentación definitiva, tal como exige el mandato de ejecución.

## 1. Fecha y versión analizada

- Grafo construido a partir del commit `15c132d3348cb9f668f8fd3eb1b156169d2ea130` (`built_at_commit` en `graph.json`).
- Fecha de generación del reporte: 2026-07-29 (`graphify-out/GRAPH_REPORT.md`, cabecera).
- Rama actual: `alovida/auditoria-correccion-integral`, commit vigente `15c132d3` → **el grafo está actualizado con el HEAD analizado en esta auditoría** (`git rev-parse HEAD` coincide con `built_at_commit`).

## 2. Archivos Graphify consultados

| Archivo | Tamaño | Uso en esta auditoría |
|---|---|---|
| `graphify-out/graph.json` | 32.4 MB | Fuente cruda: 26473 nodos, 48115 aristas. Consultado programáticamente (no leído completo) para calcular distribuciones, huérfanos y acoplamiento entre módulos. |
| `graphify-out/GRAPH_REPORT.md` | 313 KB | God Nodes, Surprising Connections, Import Cycles, comunidades y cohesión. |
| `graphify-out/manifest.json` | 681 KB | No requerido para esta auditoría (control de incrementalidad de `--update`). |
| `graphify-out/.graphify_labels.json` | 50 KB | Nombres de comunidades usados en `community_name` de cada nodo. |
| `graphify-out/fidelity-audit.json` | 8.3 KB | Reservado para Fase 10 (catálogo de datos); contrasta entidades ORM contra el grafo. |
| `graphify-out/cost.json` | — | Trazabilidad de costo de extracción, sin relevancia documental. |

No existen carpetas fechadas adicionales relevantes más allá de `2026-07-29/` (la última ejecución completa); las anteriores (`2026-07-25`, `2026-07-27`, `2026-07-28`) son snapshots históricos de ejecuciones previas del pipeline, no se contrastan aquí.

## 3. Resumen ejecutivo

El grafo cubre **3866 archivos / ~1.73M palabras** del repositorio completo (código, documentación, configuración). Es 100% extracción estructural AST (`_origin: ast` en el 100% de los nodos) — **no hay extracción semántica LLM** porque el corpus es predominantemente código; esto es coherente con el comportamiento documentado del pipeline (código no requiere clave de API).

Confianza de las aristas: **95% EXTRACTED, 5% INFERRED, 0% AMBIGUOUS** (2169 aristas inferidas, confianza promedio 0.8). No hay ciclos de imports detectados por el analizador de graphify. El sistema es una API NestJS monolítica modular de **57 dominios de negocio** bajo `src/modules/`, con un núcleo compartido (`src/common`, `src/orm`) de alta centralidad.

## 4. Inventario cuantitativo

### 4.1 Nodos por tipo de archivo (`file_type`)

| Tipo | Nodos |
|---|---:|
| `code` | 23798 |
| `document` (Markdown) | 2573 |
| `concept` (referencias externas: RFCs, paquetes npm) | 99 |
| `rationale` (comentarios TODO / justificaciones extraídas) | 3 |
| **Total** | **26473** |

### 4.2 Componentes arquitectónicos por convención de nombre (sobre 3778 archivos fuente distintos referenciados en el grafo)

| Rol arquitectónico | Archivos |
|---|---:|
| Entidades (`*.entity.ts`) | 1184 |
| DTOs (`*.dto.ts`) | 365 |
| Specs unitarios (`*.spec.ts`) | 365 |
| Repositorios (`*.repository.ts`) | 335 |
| READMEs de módulo/tooling (`README.md`) | 402 |
| Servicios (`*.service.ts`) | 256 |
| Controllers (`*.controller.ts`) | 191 |
| Módulos NestJS (`*.module.ts`) | 65 |
| Specs smoke (`*.smoke.ts`) | 24 |
| Specs de integración (`*.int-spec.ts`) | 14 |
| Specs e2e (`*.e2e-spec.ts`) | 1 |
| Guards (`*.guard.ts`) | **3** |
| Interceptores (`*.interceptor.ts`) | **1** |
| Estrategias de auth (`*.strategy.ts`) | 1 |
| Middlewares dedicados | **0** |
| Seeds (`*seed*`) | 6 |

**Observación:** solo 3 guards (`roles.guard.ts`, `jwt-auth.guard.ts`, `collection-name.guard.ts`) y 1 interceptor (`tenant-context.interceptor.ts`) cubren los 191 controllers y 850 endpoints — es decir, la autorización/tenancy se aplica de forma **centralizada y reutilizada**, no por módulo. Esto coincide con `god nodes` (`CurrentUser`, `Roles`) de máxima centralidad (ver §7). No hay middlewares Express dedicados: el pipeline de seguridad vive en guards/interceptors/pipes de Nest, consistente con `app.use(helmet())` en `main.ts`.

**Migraciones:** no existen migraciones gestionadas por MikroORM (`orm:gen` genera entidades, no migraciones versionadas); el DDL vive en SQL plano bajo `database/SQL/99_migrations`, fuera del árbol `src/`, y por eso no aparece en el grafo de código. Se documenta la brecha en `docs/data/migrations.md` (Fase 10).

### 4.3 Relaciones (aristas) por tipo

| Relación | Aristas | Confianza |
|---|---:|---|
| `references` | 17560 | mayoritariamente EXTRACTED |
| `contains` | 9261 | EXTRACTED (jerarquía archivo→símbolo) |
| `calls` | 5454 | EXTRACTED |
| `method` | 4578 | EXTRACTED |
| `imports` | 3638 | EXTRACTED |
| `re_exports` | 3347 | EXTRACTED (barrels `index.ts`) |
| `indirect_call` | 2169 | **100% INFERRED** |
| `imports_from` | 2061 | EXTRACTED |
| `extends` | 21 | EXTRACTED |
| `inherits` | 18 | EXTRACTED |
| `cites` | 3 | — |
| `rationale_for` | 3 | — |
| `defines` | 2 | — |
| **Total** | **48115** | |

Las 2169 aristas `indirect_call` (INFERRED) son la única categoría no determinística; su confianza promedio (0.8) y su naturaleza (llamadas resueltas por nombre, no por tipo estático) son razonables para TypeScript con decoradores e inyección de dependencias, donde el análisis estático puro no resuelve el grafo de invocación completo.

## 5. Módulos y componentes críticos (por volumen de nodos)

Los módulos con mayor huella en el grafo, excluyendo el núcleo compartido:

| Módulo | Nodos | Módulo | Nodos |
|---|---:|---|---:|
| `ads` | 539 | `pharmacy_inventory` | 300 |
| `audit` | 456 | `billing` | 297 |
| `orm` (núcleo) | 444 | `erp` | 294 |
| `procedures_perioperative` | 429 | `lakehouse` | 292 |
| `community` | 410 | `insurance` | 291 |
| `platform_ops` | 398 | `promotions` | 287 |
| `authz` | 374 | `graph_intelligence` | 284 |
| `clinical` | 374 | `messaging` | 274 |
| `accounting` | 373 | `object_storage` | 271 |
| `payments` | 346 | `education` | 268 |

El núcleo compartido (`src/common`) tiene 213 nodos propios pero es el nodo de mayor **centralidad de intermediación** del sistema (ver god nodes), no de volumen: prácticamente todos los módulos dependen de él.

## 6. Dependencias circulares

**Ninguna detectada** por el analizador de graphify (`## Import Cycles` → "None detected." en `GRAPH_REPORT.md`). Coincide con el hallazgo del analizador propio ALOVIDA (`tools/alovida/coverage-report.mjs`), que tampoco reporta ciclos entre dominios.

## 7. Componentes con mayor centralidad (God Nodes)

| # | Nodo | Aristas | Naturaleza |
|---|---|---:|---|
| 1 | `CurrentUser` (`src/common/auth/current-user.decorator.ts`) | 941 | Decorador de extracción de identidad — usado en prácticamente todos los endpoints autenticados. |
| 2 | `createdBy()` (`src/common/persistence/audit-fields.ts`) | 738 | Campo de auditoría compartido por las 1184 entidades. |
| 3 | `Roles` (`src/modules/authz/entities/roles.entity.ts`) | 705 | Entidad central de RBAC, referenciada desde autorización en todos los módulos. |
| 4 | `touch()` (`src/common/persistence/audit-fields.ts`) | 484 | Actualización de timestamp compartida (`updatedAt`/optimistic locking). |
| 5 | `ResourceNotFoundException` (`src/common/errors/domain.exception.ts`) | 386 | Excepción de dominio compartida — indicador de que el modelo de error es consistente (ver Fase 3, componente OpenAPI). |
| 6 | `PreconditionFailedException` | 353 | Excepción de dominio compartida (concurrencia optimista / row_version). |
| 7 | `ConflictException` | 288 | Excepción de dominio compartida (idempotencia, duplicados). |
| 8 | `CONCEPTS` (`src/common/constants/concepts.ts`) | 223 | Catálogo de constantes de dominio clínico. |
| 9 | `IndexTuple` (`src/orm/catalog/catalog.types.ts`) | 74 | Tipo del catálogo ORM autogenerado. |
| 10 | `ForeignKeyTuple` | 68 | Tipo del catálogo ORM autogenerado. |

**Lectura arquitectónica:** los god nodes son, en su totalidad, **abstracciones deliberadas de la capa `common`** (auth, persistencia, errores), no acoplamiento accidental. Esto valida el patrón de capas descrito en memoria de sesiones previas ("patrón de capas + auth a seguir") y confirma que `src/common` es la superficie que cualquier ADR de "estrategia de errores" o "auditoría" (Fase 10) debe documentar primero, por ser la de mayor impacto de cambio.

## 8. Componentes huérfanos

El grafo reporta **89 nodos con grado 0** (sin ninguna arista entrante ni saliente). Al inspeccionarlos, **no son componentes de negocio huérfanos**: son mayoritariamente identificadores de decoradores de `@nestjs/common`/`class-validator` (`Roles`, `CurrentUser`, `Query`, `Get`, `Patch`, `IsIn`, `IsArray`, etc.) capturados como nodos AST individuales en puntos donde la herramienta no pudo resolver una arista de "uso" distinta a la ya contabilizada en el nodo canónico del mismo nombre — es decir, **duplicados de identificador, no huérfanos reales**. Un caso aislado con nombre propio de negocio: `TRAVERSAL_NODE_LIMIT` (`src/modules/graph_intelligence/dto/graph-intelligence.dto.ts`), una constante de límite que sí parece sin consumidores directos en el grafo (posible candidato a revisión, no una alerta crítica).

**Contraste con el analizador ALOVIDA propio:** `tools/alovida/coverage-report.mjs` reporta **0** `ORPHAN_TABLE` y **0** `ORPHAN_ENDPOINT` sobre las 1184 entidades y 850 endpoints — el analizador de dominio, más preciso para este propósito que la heurística de grado-0 de graphify, confirma que no hay entidades ni endpoints huérfanos reales.

## 9. Flujos principales (por relación entre módulos)

Excluyendo el núcleo compartido (`common`, `orm`), las relaciones cruzadas dominio-a-dominio muestran dos patrones claros:

1. **`authz` como hub de autorización transversal** — aparece en 71 de los 97 pares cruzados de dominio-a-dominio detectados, con la mayor concentración hacia `system_ops` (24), `procedures_perioperative` (23), `scheduling` (20) y `accounting` (20). Es el patrón esperado de un PDP (Policy Decision Point) centralizado: cada dominio consulta `authz` para decisiones de acceso, no al revés.
2. **`messaging` como bus de eventos entre dominios operativos** — coupling con `automation` (16), `vector_rag` (16), `lakehouse` (13), `graph_intelligence` (12), `time_series` (12), `cross_store_consistency` (10), `workflow` (9). Confirma el patrón outbox descrito en `ESTADO-Y-PENDIENTES.md` ("Worker HTTP autenticado para relay, dispatch, colas y notificaciones de mensajería").

**Único acceso cruzado fuera de estos dos patrones esperados:** `billing ↔ practice` (vía `practices-lookup.repository.ts`), ya señalado en la línea base (`docs/reports/baseline.md` §3.4) como violación de aislamiento de dominio pendiente de remediar con un puerto de lectura.

## 10. Diferencias entre grafo y código

| Elemento | Grafo | Código real | Diferencia |
|---|---|---|---|
| Endpoints | No cuenta rutas HTTP explícitamente (cuenta símbolos, no decoradores de ruta agregados) | 850 (via `tools/alovida/coverage-report.mjs`, que sí parsea decoradores HTTP) | El analizador ALOVIDA es la fuente de verdad para conteo de endpoints; graphify es la fuente de verdad para topología de dependencias. Se usan de forma complementaria en el resto del plan. |
| Migraciones | 0 nodos (DDL vive fuera de `src/`, en `database/SQL/99_migrations`) | Existen migraciones SQL reales | Brecha de cobertura del grafo, no del sistema — se documenta explícitamente para que Fase 10 (catálogo de datos) no asuma ausencia de control de esquema. |
| Workers | Los 17 `src/worker-*.ts` sí aparecen como archivos código pero sin relación `imports`/`calls` agregada visible en los god nodes (volumen bajo por archivo, son entrypoints delgados) | 20 procesos worker reales, orquestados en `docker-compose.yml` | Confirmado por inspección directa de `src/worker-*.ts` y `docker-compose.yml`, no solo por el grafo — ver `docs/architecture/integration-map.md`. |

## 11. Riesgos documentales

- El grafo no captura **rutas HTTP** ni **catálogo de eventos** con granularidad suficiente para servir como única fuente para OpenAPI/AsyncAPI (Fases 5 y 11) — se combina con lectura directa de controllers/DTOs y con `tools/alovida/coverage-report.mjs`.
- 1731 comunidades detectadas es un nivel de granularidad **casi a nivel de archivo** (cohesión baja, 0.03–0.33 en las primeras), no de dominio de negocio; para arquitectura (Fase 8, C4) se usa la agrupación real por `src/modules/<dominio>` (57 módulos), no las comunidades de graphify directamente.

## 12. Riesgos arquitectónicos

1. Autorización y tenancy centralizadas en 3 guards + 1 interceptor: alto impacto ante un cambio o bug en cualquiera de los cuatro (ver `docs/security/threat-model.md`, Fase 12).
2. Único punto de acceso cross-domain fuera de patrón (`billing → practice`): ver §9 y `docs/architecture/module-dependencies.md`.
3. Cero migraciones versionadas por ORM (DDL SQL plano fuera de control de MikroORM): riesgo operativo para reproducibilidad de esquema entre entornos, documentado en `docs/data/migrations.md` (Fase 10).

## 13. Acciones ejecutadas en esta fase

- Se generaron `docs/architecture/module-dependencies.md`, `docs/architecture/integration-map.md` y `docs/governance/traceability-matrix.md` a partir de estos hallazgos.
- No se detectó ninguna brecha que requiera regenerar el grafo (`built_at_commit` coincide con `HEAD`); no fue necesario ejecutar `/graphify --update`.

## 14. Evidencias

- `graphify-out/graph.json` (consultas programáticas registradas en esta sesión).
- `graphify-out/GRAPH_REPORT.md` líneas 1–70 (Corpus Check, Summary, Community Hubs) y 1746–1810 (God Nodes, Surprising Connections, Import Cycles, primeras comunidades).
- `tools/alovida/coverage-report.mjs` (salida: 1184 entidades, 850 endpoints/191 controllers, 57 módulos, 0 huérfanos, 1 cross-domain).
- `docker-compose.yml`, `src/worker-*.ts` (inventario de workers, contrastado manualmente contra el grafo).
