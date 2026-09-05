# Dependencias entre módulos

> Deriva de `docs/reports/graphify-audit.md` (Fase 1). Fuente: `graphify-out/graph.json`
> (contraste dominio-a-dominio, excluyendo núcleo `common`/`orm`) y `tools/alovida/coverage-report.mjs`
> (analizador de aislamiento de dominios).

## 1. Modelo de dependencias

El backend es un monolito modular de **57 módulos de dominio** (`src/modules/*`) más un núcleo
compartido (`src/common`, `src/orm`). La regla de aislamiento vigente (verificada por
`yarn alovida:guardrails` y `tools/alovida/coverage-report.mjs`) es: **un módulo no importa
repositorios ni entidades de otro dominio directamente**; el acceso cruzado debe pasar por un
servicio expuesto del dominio propietario, o por eventos de dominio vía `messaging`.

## 2. Núcleo compartido — dependido por todos

| Componente | Rol | Consumido por |
|---|---|---|
| `src/common/auth/current-user.decorator.ts` (`CurrentUser`) | Extrae identidad autenticada del request | Prácticamente los 191 controllers (941 aristas en el grafo) |
| `src/common/persistence/audit-fields.ts` (`createdBy()`, `touch()`) | Campos de auditoría estándar (creador, `updatedAt`/optimistic locking) | Las 1184 entidades |
| `src/modules/authz/entities/roles.entity.ts` (`Roles`) | Entidad central de RBAC | Todo el flujo de autorización (705 aristas) |
| `src/common/errors/domain.exception.ts` | Modelo de errores de dominio (`ResourceNotFoundException`, `PreconditionFailedException`, `ConflictException`) | Los 57 módulos — es el candidato natural al componente de error reutilizable de OpenAPI (Fase 3) |
| `src/common/constants/concepts.ts` (`CONCEPTS`) | Catálogo de constantes clínicas compartidas | Módulos clínicos y de terminología |
| `src/orm/catalog/*` | Catálogo de índices/foreign keys autogenerado (`orm:catalog`) | Auditoría de esquema (`orm:audit`) |

**Guards e interceptors — inventario completo (son los únicos existentes en todo el sistema):**

| Archivo | Alcance |
|---|---|
| `src/common/auth/jwt-auth.guard.ts` | Autenticación JWT global |
| `src/common/auth/roles.guard.ts` | Autorización por rol (RBAC) global |
| `src/modules/document_store/controllers/collection-name.guard.ts` | Único guard específico de un módulo (valida nombre de colección Mongo) |
| `src/common/tenant/tenant-context.interceptor.ts` | Único interceptor del sistema — fija el tenant activo para la request/transacción |

## 3. `authz` como hub de autorización transversal

`authz` es el segundo componente más acoplado del sistema (después de `common`): aparece en 71 de
los 97 pares de dependencia cruzada dominio-a-dominio detectados por el grafo. Los mayores
consumidores son:

| Dominio | Aristas hacia/desde `authz` |
|---|---:|
| `system_ops` | 24 |
| `procedures_perioperative` | 23 |
| `accounting` | 20 |
| `scheduling` | 20 |
| `ads` | 18 |
| `erp` | 17 |
| `automation`, `crm`, `diagnostic_units`, `insurance` | 16 |

**Lectura:** cada dominio consulta `authz` para decisiones de acceso (PDP — Policy Decision
Point); no hay evidencia en el grafo de que `authz` dependa de lógica de negocio de otros
dominios (relación unidireccional consumidor → PDP), lo cual es el diseño correcto para un punto
de decisión de autorización centralizado.

## 4. `messaging` como bus de eventos entre dominios operativos

Segundo patrón de acoplamiento transversal legítimo, vía el outbox propio
(`OutboxService.publishDomainEvent`, `src/modules/messaging/services/outbox.service.ts`):

| Dominio | Aristas hacia/desde `messaging` |
|---|---:|
| `automation` | 16 |
| `vector_rag` | 16 |
| `lakehouse` | 13 |
| `graph_intelligence` | 12 |
| `time_series` | 12 |
| `cross_store_consistency` | 10 |
| `workflow` | 9 |

Consumo real de eventos, en detalle: `docs/architecture/integration-map.md`.

## 5. Excepción conocida — acoplamiento fuera de patrón

**`billing → practice`** (`src/modules/billing/repositories/practices-lookup.repository.ts`):
importa una entidad del dominio `practice` directamente desde un repositorio de `billing`,
violando la regla de aislamiento. Es el **único** caso detectado por
`tools/alovida/coverage-report.mjs` (`DIRECT_CROSS_DOMAIN_ACCESS: 1`).

- **Clasificación:** `HIGH` (arquitectural).
- **Estado:** conocido, no remediado en esta iteración documental — requiere diseñar un puerto de
  lectura (servicio expuesto por `practice`, o proyección de solo lectura) para que `billing` deje
  de leer la tabla ajena directamente.
- **Seguimiento:** `docs/governance/traceability-matrix.md`, fila `ARCH-001`; acción trasladada a
  `ESTADO-Y-PENDIENTES.md`.

## 6. Ausencia de ciclos de imports

Ni el analizador de graphify (`## Import Cycles` → "None detected.") ni `tools/alovida/guardrails.mjs`
reportan dependencias circulares entre módulos. No se requiere acción.

## 7. Volumen por módulo (top 10, núcleo excluido)

| Módulo | Nodos en grafo | Módulo | Nodos en grafo |
|---|---:|---|---:|
| `ads` | 539 | `authz` | 374 |
| `audit` | 456 | `clinical` | 374 |
| `procedures_perioperative` | 429 | `accounting` | 373 |
| `community` | 410 | `payments` | 346 |
| `platform_ops` | 398 | `health_data` | 345 |

El volumen de nodos no implica criticidad de negocio por sí solo; se usa como señal de prioridad
de documentación (Fase 9) junto con el número de endpoints por módulo (Fase 2).
