<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `polyglot_storage`

- **Bloque:** Datos y NoSQL (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)
- **Operaciones:** 15 (15 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 15 · BAJO 0
- **Tablas distintas que tocan:** 20
- **Respuestas de error y detalle contractual:** `openapi/endpoints/polyglot-storage.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/finops/storage-cost-snapshots` | Consolidar la instantánea de costes del periodo | MEDIO | 4 | SYSTEM, FINOPS_ANALYST, PLATFORM_ADMIN |
| 2 | POST | `/governance/collections` | Definir una colección física y su esquema versionado | MEDIO | 6 | GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 3 | POST | `/governance/consistency-policies` | Definir una política de consistencia | MEDIO | 2 | GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 4 | POST | `/governance/datasets` | Definir un dataset gobernado con su versión inicial | MEDIO | 4 | GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 5 | POST | `/governance/datasets/{id}/data-access-policies` | Definir la política de acceso al dato del dataset | MEDIO | 3 | GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 6 | POST | `/governance/datasets/{id}/versions` | Publicar una versión nueva del dataset | MEDIO | 5 | GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 7 | POST | `/governance/encryption-profiles` | Definir un perfil de cifrado con su política de rotación | MEDIO | 4 | SECURITY_ADMIN, PLATFORM_ADMIN |
| 8 | POST | `/governance/placements/{id}/failover` | Forzar el failover de una colocación | MEDIO | 4 | PLATFORM_ADMIN |
| 9 | POST | `/governance/placements/approve` | Aprobar una colocación respetando residencia y clasificación | MEDIO | 9 | GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 10 | POST | `/governance/policies` | Definir políticas de residencia, replicación y retención | MEDIO | 6 | GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 11 | POST | `/governance/storage-backends` | Registrar un backend con sus regiones y capacidades | MEDIO | 4 | PLATFORM_ADMIN |
| 12 | POST | `/governance/tenants/{tenantId}/storage-bindings` | Vincular el tenant a su colocación | MEDIO | 4 | GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 13 | POST | `/ops/integrity-policies` | Definir la política de integridad del dataset | MEDIO | 4 | GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 14 | POST | `/ops/integrity/{datasetId}/verify` | Verificar que la proyección cuadra con la fuente canónica | MEDIO | 3 | SYSTEM, PLATFORM_ADMIN |
| 15 | POST | `/ops/store-health-checks` | Registrar una comprobación de salud de la región | MEDIO | 7 | SYSTEM, PLATFORM_ADMIN |

---

## 1. POST /finops/storage-cost-snapshots

- **Origen:** CONTRATO
- **Nombre:** Consolidar la instantánea de costes del periodo
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageFinOpsController.consolidateCostSnapshot` — `src/modules/polyglot_storage/controllers/storage-finops.controller.ts:24`

### Qué es y para qué sirve (negocio)

Consolidar la instantánea de costes del periodo. Caso de uso UC-54-12: Consolidar costes por tenant/dataset. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:23`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /finops/storage-cost-snapshots` la atiende `StorageFinOpsController.consolidateCostSnapshot` (src/modules/polyglot_storage/controllers/storage-finops.controller.ts:24). Exige sesión con alguno de los roles SYSTEM, FINOPS_ANALYST, PLATFORM_ADMIN. Valida el cuerpo como `ConsolidateCostSnapshotDto` (11 campos, 9 obligatorios). Delega en `StorageOperationsService.consolidateCostSnapshot`. Crea filas en polyglot_storage.storage_cost_snapshots. Actualiza polyglot_storage.storage_cost_snapshots. Lee polyglot_storage.storage_backend_regions, polyglot_storage.storage_cost_snapshots.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, FINOPS_ANALYST, PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-finops.controller.ts:24` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.storage_backend_regions` | LEE | LEE | DIRECTA | StorageFinOpsController.consolidateCostSnapshot → StorageOperationsService.consolidateCostSnapshot → StorageBackendsRepository.findRegionById | `src/modules/polyglot_storage/repositories/storage-backends.repository.ts:207` |
| `polyglot_storage.storage_cost_snapshots` | ESCRIBE | ACTUALIZA | POR_TIPO | StorageFinOpsController.consolidateCostSnapshot → StorageOperationsService.consolidateCostSnapshot | `src/modules/polyglot_storage/services/storage-operations.service.ts:243` |
| `polyglot_storage.storage_cost_snapshots` | ESCRIBE | CREA | DIRECTA | StorageFinOpsController.consolidateCostSnapshot → StorageOperationsService.consolidateCostSnapshot → PlacementsRepository.createCostSnapshot | `src/modules/polyglot_storage/repositories/placements.repository.ts:288` |
| `polyglot_storage.storage_cost_snapshots` | LEE | LEE | DIRECTA | StorageFinOpsController.consolidateCostSnapshot → StorageOperationsService.consolidateCostSnapshot → PlacementsRepository.findCostSnapshotForUpdate | `src/modules/polyglot_storage/repositories/placements.repository.ts:322` |

### Cuerpo — DTO `ConsolidateCostSnapshotDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `storageBackendRegionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1510` |
| `periodStart` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1517` |
| `periodEnd` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1524` |
| `storageBytes` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Bytes almacenados; cadena por ser bigint | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1531` |
| `readUnits` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Unidades de lectura; cadena por ser bigint | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1538` |
| `writeUnits` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Unidades de escritura; cadena por ser bigint | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1545` |
| `egressBytes` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Bytes de salida; cadena por ser bigint | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1552` |
| `estimatedCost` | `string` | Sí | — | `@IsNumberString()` | Coste estimado, como cadena decimal | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1559` |
| `currencyCode` | `string` | Sí | longitud máxima 10 | `@IsString()` `@MaxLength(10)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1567` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1575` |
| `datasetDefinitionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1583` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "storageBackendRegionId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "periodEnd": "2026-07-31T12:00:00.000Z",
  "storageBytes": "valor-ejemplo",
  "readUnits": "valor-ejemplo",
  "writeUnits": "valor-ejemplo",
  "egressBytes": "valor-ejemplo",
  "estimatedCost": "valor-ejemplo",
  "currencyCode": "BOB"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "storageBackendRegionId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "periodEnd": "2026-07-31T12:00:00.000Z",
  "storageBytes": "valor-ejemplo",
  "readUnits": "valor-ejemplo",
  "writeUnits": "valor-ejemplo",
  "egressBytes": "valor-ejemplo",
  "estimatedCost": "valor-ejemplo",
  "currencyCode": "BOB",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<CostSnapshotResponseDto>` · DTO `CostSnapshotResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1594` |
| `estimatedCost` | `string` | Sí | — | — | Valor de estimated cost mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1600` |
| `updated` | `boolean` | Sí | — | — | true si el periodo ya estaba consolidado y se actualizó | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1608` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Región no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El periodo está invertido; PreconditionFailedException: El periodo todavía no ha cerrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-finops.controller.spec.ts:36` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-12`

---

## 2. POST /governance/collections

- **Origen:** CONTRATO
- **Nombre:** Definir una colección física y su esquema versionado
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageGovernanceController.defineCollection` — `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:105`

### Qué es y para qué sirve (negocio)

Definir una colección física y su esquema versionado. Caso de uso UC-54-04: Definir colección y su esquema versionado. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /governance/collections` la atiende `StorageGovernanceController.defineCollection` (src/modules/polyglot_storage/controllers/storage-governance.controller.ts:105). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `DefineCollectionDto` (13 campos, 6 obligatorios). Delega en `StorageGovernanceService.defineCollection`. Crea filas en polyglot_storage.collection_definitions, polyglot_storage.collection_schema_versions. Lee polyglot_storage.collection_definitions, polyglot_storage.dataset_definitions, polyglot_storage.dataset_versions, polyglot_storage.storage_backends.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:105` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.collection_definitions` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.defineCollection → StorageGovernanceService.defineCollection → DatasetsRepository.createCollection | `src/modules/polyglot_storage/repositories/datasets.repository.ts:304` |
| `polyglot_storage.collection_definitions` | LEE | LEE | DIRECTA | StorageGovernanceController.defineCollection → StorageGovernanceService.defineCollection → DatasetsRepository.findCollectionByName | `src/modules/polyglot_storage/repositories/datasets.repository.ts:350` |
| `polyglot_storage.collection_schema_versions` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.defineCollection → StorageGovernanceService.defineCollection → DatasetsRepository.createSchemaVersion | `src/modules/polyglot_storage/repositories/datasets.repository.ts:397` |
| `polyglot_storage.dataset_definitions` | LEE | LEE | DIRECTA | StorageGovernanceController.defineCollection → StorageGovernanceService.defineCollection → DatasetsRepository.findDatasetById | `src/modules/polyglot_storage/repositories/datasets.repository.ts:123` |
| `polyglot_storage.dataset_versions` | LEE | LEE | DIRECTA | StorageGovernanceController.defineCollection → StorageGovernanceService.defineCollection → DatasetsRepository.findDatasetVersionById | `src/modules/polyglot_storage/repositories/datasets.repository.ts:222` |
| `polyglot_storage.storage_backends` | LEE | LEE | DIRECTA | StorageGovernanceController.defineCollection → StorageGovernanceService.defineCollection → StorageBackendsRepository.findBackendById | `src/modules/polyglot_storage/repositories/storage-backends.repository.ts:120` |

### Cuerpo — DTO `DefineCollectionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `storageBackendId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:492` |
| `datasetDefinitionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:499` |
| `logicalName` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre lógico, único dentro del backend | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:510` |
| `datasetVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión del dataset que materializa | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:520` |
| `schemaVersion` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:528` |
| `validationMode` | `string` | Sí | valores: STRICT, LENIENT | `@IsIn(VALIDATION_MODES)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:535` |
| `physicalNamePattern` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:544` |
| `partitioningStrategy` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:553` |
| `tenantIsolationMode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:562` |
| `routingKeyExpression` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:571` |
| `shardKeyExpression` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:580` |
| `schemaDocumentJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Documento del esquema de la colección | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:588` |
| `migrationStrategy` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:597` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "storageBackendId": "00000000-0000-4000-8000-000000000001",
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001",
  "logicalName": "Nombre de ejemplo",
  "datasetVersionId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "validationMode": "STRICT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "storageBackendId": "00000000-0000-4000-8000-000000000001",
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001",
  "logicalName": "Nombre de ejemplo",
  "datasetVersionId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "validationMode": "STRICT",
  "physicalNamePattern": "Nombre de ejemplo",
  "partitioningStrategy": "valor-ejemplo",
  "tenantIsolationMode": "valor-ejemplo",
  "routingKeyExpression": "valor-ejemplo",
  "shardKeyExpression": "valor-ejemplo",
  "schemaDocumentJson": {},
  "migrationStrategy": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CollectionResponseDto>` · DTO `CollectionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:608` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | sin fuente |
| `dimension` | `number` | Sí | — | — | Valor de dimension mantenido por la instancia. | sin fuente |
| `distanceMetric` | `string` | Sí | — | — | Valor de distance metric mantenido por la instancia. | sin fuente |
| `lifecycleState` | `string` | Sí | — | — | Valor de lifecycle state mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:620` |
| `bindingId` | `string` | Sí | formato uuid | — | Vínculo del tenant creado con la colección | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Dataset no encontrado; ResourceNotFoundException: Backend no encontrado; ResourceNotFoundException: Versión del dataset no encontrada |
| 409 | `CONFLICT` | ConflictException: El backend ya tiene una colección con ese nombre |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El dataset no está activo; PreconditionFailedException: La versión pertenece a otro dataset |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-governance.controller.spec.ts:87` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-04`

---

## 3. POST /governance/consistency-policies

- **Origen:** CONTRATO
- **Nombre:** Definir una política de consistencia
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageGovernanceController.defineConsistencyPolicy` — `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:135`

### Qué es y para qué sirve (negocio)

Definir una política de consistencia. Caso de uso UC-54-06: Política de consistencia del store. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /governance/consistency-policies` la atiende `StorageGovernanceController.defineConsistencyPolicy` (src/modules/polyglot_storage/controllers/storage-governance.controller.ts:135). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `DefineConsistencyPolicyDto` (6 campos, 3 obligatorios). Delega en `StorageGovernanceService.defineConsistencyPolicy`. Crea filas en polyglot_storage.consistency_policies. Lee polyglot_storage.consistency_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:135` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.consistency_policies` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.defineConsistencyPolicy → StorageGovernanceService.defineConsistencyPolicy → StoragePoliciesRepository.createConsistencyPolicy | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:64` |
| `polyglot_storage.consistency_policies` | LEE | LEE | DIRECTA | StorageGovernanceController.defineConsistencyPolicy → StorageGovernanceService.defineConsistencyPolicy → StoragePoliciesRepository.findConsistencyPolicyByCode | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:104` |

### Cuerpo — DTO `DefineConsistencyPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:743` |
| `readConsistency` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:751` |
| `writeConsistency` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:759` |
| `conflictResolution` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:768` |
| `staleReadToleranceSeconds` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Debe ser 0 si se exige leer lo propio recién escrito | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:781` |
| `requiresReadYourWrites` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:789` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "readConsistency": "valor-ejemplo",
  "writeConsistency": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "readConsistency": "valor-ejemplo",
  "writeConsistency": "valor-ejemplo",
  "conflictResolution": "valor-ejemplo",
  "staleReadToleranceSeconds": 0,
  "requiresReadYourWrites": false
}
```

</details>

### Respuesta — `Promise<PolicyResponseDto>` · DTO `PolicyResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:800` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:806` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:812` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una política de consistencia con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Exigir leer lo propio recién escrito obliga a tolerancia cero de lectura rancia |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-governance.controller.spec.ts:107` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-06`

---

## 4. POST /governance/datasets

- **Origen:** CONTRATO
- **Nombre:** Definir un dataset gobernado con su versión inicial
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageGovernanceController.defineDataset` — `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:76`

### Qué es y para qué sirve (negocio)

Definir un dataset gobernado con su versión inicial. Caso de uso UC-54-02: Definir dataset + versión inicial. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /governance/datasets` la atiende `StorageGovernanceController.defineDataset` (src/modules/polyglot_storage/controllers/storage-governance.controller.ts:76). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `DefineDatasetDto` (8 campos, 6 obligatorios). Delega en `DatasetGovernanceService.defineDataset`. Crea filas en polyglot_storage.dataset_definitions, polyglot_storage.dataset_versions. Lee polyglot_storage.data_classifications, polyglot_storage.dataset_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:76` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.data_classifications` | LEE | LEE | DIRECTA | StorageGovernanceController.defineDataset → DatasetGovernanceService.defineDataset → DatasetsRepository.findClassificationById | `src/modules/polyglot_storage/repositories/datasets.repository.ts:33` |
| `polyglot_storage.dataset_definitions` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.defineDataset → DatasetGovernanceService.defineDataset → DatasetsRepository.createDataset | `src/modules/polyglot_storage/repositories/datasets.repository.ts:92` |
| `polyglot_storage.dataset_definitions` | LEE | LEE | DIRECTA | StorageGovernanceController.defineDataset → DatasetGovernanceService.defineDataset → DatasetsRepository.findDatasetByCode | `src/modules/polyglot_storage/repositories/datasets.repository.ts:149` |
| `polyglot_storage.dataset_versions` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.defineDataset → DatasetGovernanceService.defineDataset → DatasetsRepository.createDatasetVersion | `src/modules/polyglot_storage/repositories/datasets.repository.ts:194` |

### Cuerpo — DTO `DefineDatasetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código único del dataset | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:302` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:310` |
| `owningModuleCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Módulo dueño del dato | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:318` |
| `dataClassificationId` | `string` | Sí | formato uuid | `@IsUUID()` | Clasificación que gobierna su tratamiento | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:328` |
| `sourceOfTruth` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Dónde vive la verdad del dato | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:336` |
| `schemaFingerprint` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Huella del esquema inicial | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:344` |
| `canonicalEntityType` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:353` |
| `schemaDocumentFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Documento del esquema | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:361` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "owningModuleCode": "CODIGO_EJEMPLO",
  "dataClassificationId": "00000000-0000-4000-8000-000000000001",
  "sourceOfTruth": "valor-ejemplo",
  "schemaFingerprint": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "owningModuleCode": "CODIGO_EJEMPLO",
  "dataClassificationId": "00000000-0000-4000-8000-000000000001",
  "sourceOfTruth": "valor-ejemplo",
  "schemaFingerprint": "valor-ejemplo",
  "canonicalEntityType": "valor-ejemplo",
  "schemaDocumentFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DatasetResponseDto>` · DTO `DatasetResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:372` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:378` |
| `lifecycleState` | `string` | Sí | — | — | Valor de lifecycle state mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:384` |
| `initialVersionId` | `string` | Sí | formato uuid | — | Versión 1.0.0, creada en la misma transacción | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:393` |
| `initialVersion` | `string` | Sí | — | — | Valor de initial version mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:399` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Clasificación de datos no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe un dataset con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-governance.controller.spec.ts:64` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-02`

---

## 5. POST /governance/datasets/{id}/data-access-policies

- **Origen:** CONTRATO
- **Nombre:** Definir la política de acceso al dato del dataset
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageGovernanceController.defineAccessPolicy` — `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:150`

### Qué es y para qué sirve (negocio)

Definir la política de acceso al dato del dataset. Caso de uso UC-54-07: Política de acceso al dato. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /governance/datasets/{id}/data-access-policies` la atiende `StorageGovernanceController.defineAccessPolicy` (src/modules/polyglot_storage/controllers/storage-governance.controller.ts:150). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `DefineAccessPolicyDto` (5 campos, 2 obligatorios). Delega en `DatasetGovernanceService.defineAccessPolicy`. Crea filas en polyglot_storage.data_access_policies. Lee polyglot_storage.data_access_policies, polyglot_storage.dataset_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:150` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:150` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.data_access_policies` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.defineAccessPolicy → DatasetGovernanceService.defineAccessPolicy → DatasetsRepository.createAccessPolicy | `src/modules/polyglot_storage/repositories/datasets.repository.ts:477` |
| `polyglot_storage.data_access_policies` | LEE | LEE | DIRECTA | StorageGovernanceController.defineAccessPolicy → DatasetGovernanceService.defineAccessPolicy → DatasetsRepository.findAccessPolicy | `src/modules/polyglot_storage/repositories/datasets.repository.ts:501` |
| `polyglot_storage.dataset_definitions` | LEE | LEE | DIRECTA | StorageGovernanceController.defineAccessPolicy → DatasetGovernanceService.defineAccessPolicy → DatasetsRepository.findDatasetById | `src/modules/polyglot_storage/repositories/datasets.repository.ts:123` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DefineAccessPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `purposeOfUseCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Propósito de uso al que aplica | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:830` |
| `principalType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Tipo de principal al que aplica | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:841` |
| `fieldPolicyJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Qué campos se ven y cuáles no | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:849` |
| `rowFilterExpression` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Filtro de filas visibles | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:861` |
| `maskingProfileCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:870` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "purposeOfUseCode": "CODIGO_EJEMPLO",
  "principalType": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "purposeOfUseCode": "CODIGO_EJEMPLO",
  "principalType": "valor-ejemplo",
  "fieldPolicyJson": {},
  "rowFilterExpression": "valor-ejemplo",
  "maskingProfileCode": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<AccessPolicyResponseDto>` · DTO `AccessPolicyResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:881` |
| `datasetDefinitionId` | `string` | Sí | formato uuid | — | Identificador asociado a dataset definition. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:887` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:893` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Dataset no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe una política para ese propósito y tipo de principal |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El dataset no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-governance.controller.spec.ts:119` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-07`

---

## 6. POST /governance/datasets/{id}/versions

- **Origen:** CONTRATO
- **Nombre:** Publicar una versión nueva del dataset
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageGovernanceController.publishDatasetVersion` — `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:89`

### Qué es y para qué sirve (negocio)

Publicar una versión nueva del dataset. Caso de uso UC-54-03: Publicar versión con huella de esquema. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /governance/datasets/{id}/versions` la atiende `StorageGovernanceController.publishDatasetVersion` (src/modules/polyglot_storage/controllers/storage-governance.controller.ts:89). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `PublishDatasetVersionDto` (4 campos, 3 obligatorios). Delega en `DatasetGovernanceService.publishDatasetVersion`. Crea filas en polyglot_storage.dataset_versions. Actualiza polyglot_storage.dataset_definitions, polyglot_storage.dataset_versions. Lee polyglot_storage.dataset_definitions, polyglot_storage.dataset_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:89` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:89` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.dataset_definitions` | ESCRIBE | ACTUALIZA | POR_TIPO | StorageGovernanceController.publishDatasetVersion → DatasetGovernanceService.publishDatasetVersion | `src/modules/polyglot_storage/services/dataset-governance.service.ts:199` |
| `polyglot_storage.dataset_definitions` | LEE | LEE | DIRECTA | StorageGovernanceController.publishDatasetVersion → DatasetGovernanceService.publishDatasetVersion → DatasetsRepository.findDatasetForUpdate | `src/modules/polyglot_storage/repositories/datasets.repository.ts:131` |
| `polyglot_storage.dataset_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | StorageGovernanceController.publishDatasetVersion → DatasetGovernanceService.publishDatasetVersion | `src/modules/polyglot_storage/services/dataset-governance.service.ts:185` |
| `polyglot_storage.dataset_versions` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.publishDatasetVersion → DatasetGovernanceService.publishDatasetVersion → DatasetsRepository.createDatasetVersion | `src/modules/polyglot_storage/repositories/datasets.repository.ts:194` |
| `polyglot_storage.dataset_versions` | LEE | LEE | DIRECTA | StorageGovernanceController.publishDatasetVersion → DatasetGovernanceService.publishDatasetVersion → DatasetsRepository.findDatasetVersion | `src/modules/polyglot_storage/repositories/datasets.repository.ts:238` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishDatasetVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `version` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | Versión semántica nueva | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:414` |
| `schemaFingerprint` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Huella recalculada del esquema | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:425` |
| `compatibilityMode` | `string` | Sí | valores: NONE, BACKWARD, FORWARD, FULL | `@IsIn(COMPATIBILITY_MODES)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:432` |
| `schemaDocumentFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:440` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "version": "valor-ejemplo",
  "schemaFingerprint": "valor-ejemplo",
  "compatibilityMode": "NONE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "version": "valor-ejemplo",
  "schemaFingerprint": "valor-ejemplo",
  "compatibilityMode": "NONE",
  "schemaDocumentFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DatasetVersionResponseDto>` · DTO `DatasetVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:451` |
| `version` | `string` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:457` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:463` |
| `datasetLifecycleState` | `string` | Sí | — | — | Ciclo de vida en el que queda el dataset | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:469` |
| `supersededVersionId` | `string` | No | formato uuid | — | Versión que queda superseded | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:478` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Dataset no encontrado |
| 409 | `CONFLICT` | ConflictException: El dataset ya tiene esa versión |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una versión que sucede a otra debe declarar su compatibilidad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-governance.controller.spec.ts:74` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-03`

---

## 7. POST /governance/encryption-profiles

- **Origen:** CONTRATO
- **Nombre:** Definir un perfil de cifrado con su política de rotación
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageGovernanceController.defineEncryptionProfile` — `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:180`

### Qué es y para qué sirve (negocio)

Definir un perfil de cifrado con su política de rotación. Caso de uso UC-54-09: Perfil de cifrado con rotación. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /governance/encryption-profiles` la atiende `StorageGovernanceController.defineEncryptionProfile` (src/modules/polyglot_storage/controllers/storage-governance.controller.ts:180). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `DefineEncryptionProfileDto` (13 campos, 4 obligatorios). Delega en `StorageGovernanceService.defineEncryptionProfile`. Crea filas en polyglot_storage.encryption_profiles, polyglot_storage.key_rotation_policies. Lee polyglot_storage.encryption_profiles, polyglot_storage.key_rotation_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:180` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.encryption_profiles` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.defineEncryptionProfile → StorageGovernanceService.defineEncryptionProfile → StoragePoliciesRepository.createEncryptionProfile | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:464` |
| `polyglot_storage.encryption_profiles` | LEE | LEE | DIRECTA | StorageGovernanceController.defineEncryptionProfile → StorageGovernanceService.defineEncryptionProfile → StoragePoliciesRepository.findEncryptionProfileByCode | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:508` |
| `polyglot_storage.key_rotation_policies` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.defineEncryptionProfile → StorageGovernanceService.defineEncryptionProfile → StoragePoliciesRepository.createRotationPolicy | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:388` |
| `polyglot_storage.key_rotation_policies` | LEE | LEE | DIRECTA | StorageGovernanceController.defineEncryptionProfile → StorageGovernanceService.defineEncryptionProfile → StoragePoliciesRepository.findRotationPolicyByCode | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:413` |

### Cuerpo — DTO `DefineEncryptionProfileDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1046` |
| `algorithm` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1054` |
| `keyManagementProvider` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1062` |
| `keyReference` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | Referencia en el KMS. Nunca la clave. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1073` |
| `envelopeEncryption` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1081` |
| `fieldLevelEncryption` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Obligatorio si el dataset ligado contiene datos de paciente | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1092` |
| `deterministicFieldsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Campos con cifrado determinista para poder buscarlos | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1102` |
| `rotationPolicy` | `RotationPolicyDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => RotationPolicyDto)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1111` |
| `rotationPolicy.code` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:998` |
| `rotationPolicy.rotationIntervalDays` | `number` | No | mínimo 1 | `@IsInt()` `@Min(1)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1006` |
| `rotationPolicy.overlapDays` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Días que conviven las dos claves | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1019` |
| `rotationPolicy.reencryptExistingData` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1027` |
| `rotationPolicy.emergencyRotationEnabled` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1035` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "algorithm": "valor-ejemplo",
  "keyManagementProvider": "valor-ejemplo",
  "keyReference": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "algorithm": "valor-ejemplo",
  "keyManagementProvider": "valor-ejemplo",
  "keyReference": "valor-ejemplo",
  "envelopeEncryption": true,
  "fieldLevelEncryption": false,
  "deterministicFieldsJson": {},
  "rotationPolicy": {
    "code": "CODIGO_EJEMPLO",
    "rotationIntervalDays": 1,
    "overlapDays": 0,
    "reencryptExistingData": false,
    "emergencyRotationEnabled": false
  }
}
```

</details>

### Respuesta — `Promise<EncryptionProfileResponseDto>` · DTO `EncryptionProfileResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1122` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1128` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1134` |
| `rotationPolicyId` | `string` | No | formato uuid | — | Política de rotación creada o reutilizada | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1143` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un perfil de cifrado con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-governance.controller.spec.ts:139` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-09`

---

## 8. POST /governance/placements/{id}/failover

- **Origen:** CONTRATO
- **Nombre:** Forzar el failover de una colocación
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageGovernanceController.failoverPlacement` — `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:209`

### Qué es y para qué sirve (negocio)

Forzar el failover de una colocación. Caso de uso UC-54-11: Salud y failover. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /governance/placements/{id}/failover` la atiende `StorageGovernanceController.failoverPlacement` (src/modules/polyglot_storage/controllers/storage-governance.controller.ts:209). Exige sesión con alguno de los roles PLATFORM_ADMIN. Valida el cuerpo como `FailoverPlacementDto` (1 campo, 1 obligatorio). Delega en `StorageOperationsService.failoverPlacement`. Actualiza polyglot_storage.dataset_placements, polyglot_storage.tenant_storage_bindings. Lee polyglot_storage.dataset_placements, polyglot_storage.tenant_storage_bindings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:209` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:209` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.dataset_placements` | ESCRIBE | ACTUALIZA | POR_TIPO | StorageGovernanceController.failoverPlacement → StorageOperationsService.failoverPlacement | `src/modules/polyglot_storage/services/storage-operations.service.ts:176` |
| `polyglot_storage.dataset_placements` | LEE | LEE | DIRECTA | StorageGovernanceController.failoverPlacement → StorageOperationsService.failoverPlacement → PlacementsRepository.findPlacementForUpdate | `src/modules/polyglot_storage/repositories/placements.repository.ts:111` |
| `polyglot_storage.tenant_storage_bindings` | ESCRIBE | ACTUALIZA | POR_TIPO | StorageGovernanceController.failoverPlacement → StorageOperationsService.failoverPlacement → StorageOperationsService.swapBindings | `src/modules/polyglot_storage/services/storage-operations.service.ts:423` |
| `polyglot_storage.tenant_storage_bindings` | LEE | LEE | DIRECTA | StorageGovernanceController.failoverPlacement → StorageOperationsService.failoverPlacement → StorageOperationsService.swapBindings → PlacementsRepository.findBindingsByPrimaryForUpdate | `src/modules/polyglot_storage/repositories/placements.repository.ts:223` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `FailoverPlacementDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | — | `@IsString()` | Por qué se fuerza el failover | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1473` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<FailoverResponseDto>` · DTO `FailoverResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `placementId` | `string` | Sí | formato uuid | — | Identificador asociado a placement. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1484` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1490` |
| `swappedBindings` | `number` | Sí | — | — | Vínculos cuyo primario se movió | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1496` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Colocación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La colocación no está sirviendo tráfico |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-governance.controller.spec.ts:163` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-11`

---

## 9. POST /governance/placements/approve

- **Origen:** CONTRATO
- **Nombre:** Aprobar una colocación respetando residencia y clasificación
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageGovernanceController.approvePlacement` — `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:120`

### Qué es y para qué sirve (negocio)

Aprobar una colocación respetando residencia y clasificación. Caso de uso UC-54-05: Aprobar colocación respetando residencia. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /governance/placements/approve` la atiende `StorageGovernanceController.approvePlacement` (src/modules/polyglot_storage/controllers/storage-governance.controller.ts:120). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `ApprovePlacementDto` (8 campos, 5 obligatorios). Delega en `DatasetGovernanceService.approvePlacement`. Crea filas en polyglot_storage.dataset_placements. Lee polyglot_storage.collection_definitions, polyglot_storage.data_classifications, polyglot_storage.dataset_definitions, polyglot_storage.dataset_placements, polyglot_storage.dataset_versions, polyglot_storage.encryption_profiles, polyglot_storage.residency_policies, polyglot_storage.storage_backend_regions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:120` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.collection_definitions` | LEE | LEE | DIRECTA | StorageGovernanceController.approvePlacement → DatasetGovernanceService.approvePlacement → DatasetsRepository.findCollectionById | `src/modules/polyglot_storage/repositories/datasets.repository.ts:341` |
| `polyglot_storage.data_classifications` | LEE | LEE | DIRECTA | StorageGovernanceController.approvePlacement → DatasetGovernanceService.approvePlacement → DatasetsRepository.findClassificationById | `src/modules/polyglot_storage/repositories/datasets.repository.ts:33` |
| `polyglot_storage.dataset_definitions` | LEE | LEE | DIRECTA | StorageGovernanceController.approvePlacement → DatasetGovernanceService.approvePlacement → DatasetsRepository.findDatasetById | `src/modules/polyglot_storage/repositories/datasets.repository.ts:123` |
| `polyglot_storage.dataset_placements` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.approvePlacement → DatasetGovernanceService.approvePlacement → PlacementsRepository.createPlacement | `src/modules/polyglot_storage/repositories/placements.repository.ts:68` |
| `polyglot_storage.dataset_placements` | LEE | LEE | DIRECTA | StorageGovernanceController.approvePlacement → DatasetGovernanceService.approvePlacement → PlacementsRepository.findPlacement | `src/modules/polyglot_storage/repositories/placements.repository.ts:125` |
| `polyglot_storage.dataset_versions` | LEE | LEE | DIRECTA | StorageGovernanceController.approvePlacement → DatasetGovernanceService.approvePlacement → DatasetsRepository.findDatasetVersionById | `src/modules/polyglot_storage/repositories/datasets.repository.ts:222` |
| `polyglot_storage.encryption_profiles` | LEE | LEE | DIRECTA | StorageGovernanceController.approvePlacement → DatasetGovernanceService.approvePlacement → StoragePoliciesRepository.findEncryptionProfileById | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:494` |
| `polyglot_storage.residency_policies` | LEE | LEE | DIRECTA | StorageGovernanceController.approvePlacement → DatasetGovernanceService.approvePlacement → StoragePoliciesRepository.findResidencyPolicyById | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:177` |
| `polyglot_storage.storage_backend_regions` | LEE | LEE | DIRECTA | StorageGovernanceController.approvePlacement → DatasetGovernanceService.approvePlacement → StorageBackendsRepository.findRegionById | `src/modules/polyglot_storage/repositories/storage-backends.repository.ts:207` |

### Cuerpo — DTO `ApprovePlacementDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `datasetVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:640` |
| `storageBackendRegionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:647` |
| `collectionDefinitionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:654` |
| `residencyPolicyId` | `string` | Sí | formato uuid | `@IsUUID()` | Política de residencia a satisfacer | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:664` |
| `encryptionProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil de cifrado a aplicar | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:671` |
| `replicationPolicyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:679` |
| `consistencyPolicyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:687` |
| `placementRole` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | Papel de la colocación | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:699` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "datasetVersionId": "00000000-0000-4000-8000-000000000001",
  "storageBackendRegionId": "00000000-0000-4000-8000-000000000001",
  "collectionDefinitionId": "00000000-0000-4000-8000-000000000001",
  "residencyPolicyId": "00000000-0000-4000-8000-000000000001",
  "encryptionProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "datasetVersionId": "00000000-0000-4000-8000-000000000001",
  "storageBackendRegionId": "00000000-0000-4000-8000-000000000001",
  "collectionDefinitionId": "00000000-0000-4000-8000-000000000001",
  "residencyPolicyId": "00000000-0000-4000-8000-000000000001",
  "encryptionProfileId": "00000000-0000-4000-8000-000000000001",
  "replicationPolicyId": "00000000-0000-4000-8000-000000000001",
  "consistencyPolicyId": "00000000-0000-4000-8000-000000000001",
  "placementRole": "PRIMARY"
}
```

</details>

### Respuesta — `Promise<PlacementResponseDto>` · DTO `PlacementResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:710` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:716` |
| `placementRole` | `string` | Sí | — | — | Valor de placement role mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:722` |
| `duplicate` | `boolean` | Sí | — | — | true si la colocación ya estaba aprobada | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:728` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión del dataset no encontrada; ResourceNotFoundException: Colección no encontrada; ResourceNotFoundException: Región no encontrada; ResourceNotFoundException: Política de residencia no encontrada; ResourceNotFoundException: Perfil de cifrado no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión del dataset no está activa; PreconditionFailedException: La política de residencia prohíbe ese país; PreconditionFailedException: El país de la región no está entre los permitidos por la residencia; PreconditionFailedException: La región no está entre las permitidas por la residencia; PreconditionFailedException: Un dataset con datos de paciente exige cifrado a nivel de campo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-governance.controller.spec.ts:97` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-05`

---

## 10. POST /governance/policies

- **Origen:** CONTRATO
- **Nombre:** Definir políticas de residencia, replicación y retención
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageGovernanceController.defineStoragePolicies` — `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:194`

### Qué es y para qué sirve (negocio)

Definir políticas de residencia, replicación y retención. Caso de uso UC-54-10: Residencia, replicación y retención. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /governance/policies` la atiende `StorageGovernanceController.defineStoragePolicies` (src/modules/polyglot_storage/controllers/storage-governance.controller.ts:194). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `DefineStoragePoliciesDto` (21 campos, 0 obligatorios). Delega en `StorageGovernanceService.defineStoragePolicies`. Crea filas en polyglot_storage.replication_policies, polyglot_storage.residency_policies, polyglot_storage.retention_policies. Lee polyglot_storage.replication_policies, polyglot_storage.residency_policies, polyglot_storage.retention_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:194` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.replication_policies` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.defineStoragePolicies → StorageGovernanceService.defineStoragePolicies → StoragePoliciesRepository.createReplicationPolicy | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:236` |
| `polyglot_storage.replication_policies` | LEE | LEE | DIRECTA | StorageGovernanceController.defineStoragePolicies → StorageGovernanceService.defineStoragePolicies → StoragePoliciesRepository.findReplicationPolicyByCode | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:276` |
| `polyglot_storage.residency_policies` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.defineStoragePolicies → StorageGovernanceService.defineStoragePolicies → StoragePoliciesRepository.createResidencyPolicy | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:149` |
| `polyglot_storage.residency_policies` | LEE | LEE | DIRECTA | StorageGovernanceController.defineStoragePolicies → StorageGovernanceService.defineStoragePolicies → StoragePoliciesRepository.findResidencyPolicyByCode | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:191` |
| `polyglot_storage.retention_policies` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.defineStoragePolicies → StorageGovernanceService.defineStoragePolicies → StoragePoliciesRepository.createRetentionPolicy | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:321` |
| `polyglot_storage.retention_policies` | LEE | LEE | DIRECTA | StorageGovernanceController.defineStoragePolicies → StorageGovernanceService.defineStoragePolicies → StoragePoliciesRepository.findRetentionPolicyByCode | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:347` |

### Cuerpo — DTO `DefineStoragePoliciesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `residency` | `ResidencyPolicyDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => ResidencyPolicyDto)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1337` |
| `residency.code` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1160` |
| `residency.allowedCountryCodes` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | Países donde sí puede residir | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1172` |
| `residency.forbiddenCountryCodes` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | Países donde no puede residir | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1184` |
| `residency.allowedRegionCodes` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1193` |
| `residency.requiresInCountryBackup` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1201` |
| `residency.crossBorderTransferBasis` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Base legal de la transferencia internacional | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1213` |
| `replication` | `ReplicationPolicyDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => ReplicationPolicyDto)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1346` |
| `replication.code` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1226` |
| `replication.replicaCount` | `number` | No | mínimo 1 | `@IsInt()` `@Min(1)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1234` |
| `replication.replicationMode` | `string` | No | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1242` |
| `replication.failoverMode` | `string` | No | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | Modo de reacción ante una región caída | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1253` |
| `replication.crossRegionEnabled` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1261` |
| `replication.maxReplicationLagSeconds` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1270` |
| `retention` | `RetentionPolicyDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => RetentionPolicyDto)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1355` |
| `retention.code` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1283` |
| `retention.retentionDays` | `number` | No | mínimo 0 | `@IsInt()` `@Min(0)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1291` |
| `retention.deletionMode` | `string` | No | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1299` |
| `retention.archiveAfterDays` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1308` |
| `retention.legalHoldOverridesDeletion` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1316` |
| `retention.jurisdictionCode` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1325` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "residency": {
    "code": "CODIGO_EJEMPLO",
    "allowedCountryCodes": [
      "BO"
    ],
    "forbiddenCountryCodes": [
      "BO"
    ],
    "allowedRegionCodes": [
      "CODIGO_EJEMPLO"
    ],
    "requiresInCountryBackup": false,
    "crossBorderTransferBasis": "valor-ejemplo"
  },
  "replication": {
    "code": "CODIGO_EJEMPLO",
    "replicaCount": 1,
    "replicationMode": "valor-ejemplo",
    "failoverMode": "valor-ejemplo",
    "crossRegionEnabled": false,
    "maxReplicationLagSeconds": 1
  },
  "retention": {
    "code": "CODIGO_EJEMPLO",
    "retentionDays": 1,
    "deletionMode": "valor-ejemplo",
    "archiveAfterDays": 1,
    "legalHoldOverridesDeletion": true,
    "jurisdictionCode": "CODIGO_EJEMPLO"
  }
}
```

</details>

### Respuesta — `Promise<StoragePoliciesResponseDto>` · DTO `StoragePoliciesResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `residencyPolicyId` | `string` | No | formato uuid | — | Identificador asociado a residency policy. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1366` |
| `replicationPolicyId` | `string` | No | formato uuid | — | Identificador asociado a replication policy. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1372` |
| `retentionPolicyId` | `string` | No | formato uuid | — | Identificador asociado a retention policy. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1378` |
| `created` | `number` | Sí | — | — | Políticas creadas en esta llamada | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1384` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una política de residencia con ese código; ConflictException: Ya existe una política de replicación con ese código; ConflictException: Ya existe una política de retención con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay que declarar al menos una política; PreconditionFailedException: Prohibir la réplica entre regiones exige declarar los países permitidos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-governance.controller.spec.ts:151` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-10`

---

## 11. POST /governance/storage-backends

- **Origen:** CONTRATO
- **Nombre:** Registrar un backend con sus regiones y capacidades
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageGovernanceController.registerBackend` — `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:61`

### Qué es y para qué sirve (negocio)

Registrar un backend con sus regiones y capacidades. Caso de uso UC-54-01: Registrar backend con regiones y capacidades. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:12`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /governance/storage-backends` la atiende `StorageGovernanceController.registerBackend` (src/modules/polyglot_storage/controllers/storage-governance.controller.ts:61). Exige sesión con alguno de los roles PLATFORM_ADMIN. Valida el cuerpo como `RegisterBackendDto` (22 campos, 7 obligatorios). Delega en `StorageGovernanceService.registerBackend`. Crea filas en polyglot_storage.storage_backend_regions, polyglot_storage.storage_backends, polyglot_storage.storage_capabilities. Lee polyglot_storage.storage_backends.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.storage_backend_regions` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.registerBackend → StorageGovernanceService.registerBackend → StorageBackendsRepository.createRegion | `src/modules/polyglot_storage/repositories/storage-backends.repository.ts:179` |
| `polyglot_storage.storage_backends` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.registerBackend → StorageGovernanceService.registerBackend → StorageBackendsRepository.createBackend | `src/modules/polyglot_storage/repositories/storage-backends.repository.ts:85` |
| `polyglot_storage.storage_backends` | LEE | LEE | DIRECTA | StorageGovernanceController.registerBackend → StorageGovernanceService.registerBackend → StorageBackendsRepository.findBackendByCode | `src/modules/polyglot_storage/repositories/storage-backends.repository.ts:134` |
| `polyglot_storage.storage_capabilities` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.registerBackend → StorageGovernanceService.registerBackend → StorageBackendsRepository.createCapability | `src/modules/polyglot_storage/repositories/storage-backends.repository.ts:260` |

### Cuerpo — DTO `RegisterBackendDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código único del backend | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:139` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:147` |
| `backendType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Naturaleza del motor | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:155` |
| `providerCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:163` |
| `controlPlaneEndpoint` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:171` |
| `regions` | `array<BackendRegionDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => BackendRegionDto)` | Un backend sin región no puede alojar nada | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:184` |
| `regions[].regionCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:60` |
| `regions[].countryCode` | `string` | Sí | longitud máxima 10 | `@IsString()` `@MaxLength(10)` | País donde reside físicamente el dato | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:71` |
| `regions[].jurisdictionCode` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:80` |
| `regions[].endpointUri` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:88` |
| `regions[].isPrimary` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Sólo una región puede serlo | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:99` |
| `capabilities` | `array<BackendCapabilityDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => BackendCapabilityDto)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:194` |
| `capabilities[].capabilityCode` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:112` |
| `capabilities[].capabilityVersion` | `string` | No | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:120` |
| `capabilities[].configurationJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:128` |
| `supportsTransactions` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:202` |
| `supportsTtl` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:210` |
| `supportsEncryption` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:218` |
| `supportsVersioning` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:226` |
| `supportsWorm` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:234` |
| `supportsVectorSearch` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:242` |
| `supportsFullText` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:250` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "backendType": "valor-ejemplo",
  "providerCode": "CODIGO_EJEMPLO",
  "regions": [
    {
      "regionCode": "CODIGO_EJEMPLO",
      "countryCode": "BO"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "backendType": "valor-ejemplo",
  "providerCode": "CODIGO_EJEMPLO",
  "controlPlaneEndpoint": "valor-ejemplo",
  "regions": [
    {
      "regionCode": "CODIGO_EJEMPLO",
      "countryCode": "BO",
      "jurisdictionCode": "CODIGO_EJEMPLO",
      "endpointUri": "valor-ejemplo",
      "isPrimary": false
    }
  ],
  "capabilities": [
    {
      "capabilityCode": "CODIGO_EJEMPLO",
      "capabilityVersion": "valor-ejemplo",
      "configurationJson": {}
    }
  ],
  "supportsTransactions": false,
  "supportsTtl": false,
  "supportsEncryption": false,
  "supportsVersioning": false,
  "supportsWorm": false,
  "supportsVectorSearch": false,
  "supportsFullText": false
}
```

</details>

### Respuesta — `Promise<BackendResponseDto>` · DTO `BackendResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:261` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:267` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:273` |
| `regionIds` | `array<string>` | Sí | formato uuid | — | Valor de region ids mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:279` |
| `capabilityCount` | `number` | Sí | — | — | Capacidades registradas, todas pendientes de verificar | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:287` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un backend con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo una región puede ser la primaria; PreconditionFailedException: {message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-governance.controller.spec.ts:54` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-01`

---

## 12. POST /governance/tenants/{tenantId}/storage-bindings

- **Origen:** CONTRATO
- **Nombre:** Vincular el tenant a su colocación
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageGovernanceController.bindTenantStorage` — `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:164`

### Qué es y para qué sirve (negocio)

Vincular el tenant a su colocación. Caso de uso UC-54-08: Vincular tenant a colocación. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /governance/tenants/{tenantId}/storage-bindings` la atiende `StorageGovernanceController.bindTenantStorage` (src/modules/polyglot_storage/controllers/storage-governance.controller.ts:164). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `BindTenantStorageDto` (5 campos, 2 obligatorios). Delega en `DatasetGovernanceService.bindTenantStorage`. Crea filas en polyglot_storage.tenant_storage_bindings. Actualiza polyglot_storage.dataset_placements. Lee polyglot_storage.dataset_placements, polyglot_storage.tenant_storage_bindings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:164` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/polyglot_storage/controllers/storage-governance.controller.ts:164` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.dataset_placements` | ESCRIBE | ACTUALIZA | POR_TIPO | StorageGovernanceController.bindTenantStorage → DatasetGovernanceService.bindTenantStorage | `src/modules/polyglot_storage/services/dataset-governance.service.ts:501` |
| `polyglot_storage.dataset_placements` | LEE | LEE | DIRECTA | StorageGovernanceController.bindTenantStorage → DatasetGovernanceService.bindTenantStorage → PlacementsRepository.findPlacementForUpdate | `src/modules/polyglot_storage/repositories/placements.repository.ts:111` |
| `polyglot_storage.tenant_storage_bindings` | ESCRIBE | CREA | DIRECTA | StorageGovernanceController.bindTenantStorage → DatasetGovernanceService.bindTenantStorage → PlacementsRepository.createBinding | `src/modules/polyglot_storage/repositories/placements.repository.ts:187` |
| `polyglot_storage.tenant_storage_bindings` | LEE | LEE | DIRECTA | StorageGovernanceController.bindTenantStorage → DatasetGovernanceService.bindTenantStorage → PlacementsRepository.findBinding | `src/modules/polyglot_storage/repositories/placements.repository.ts:215` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo — DTO `BindTenantStorageDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `datasetDefinitionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:907` |
| `primaryPlacementId` | `string` | Sí | formato uuid | `@IsUUID()` | Colocación primaria, ya aprobada | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:917` |
| `secondaryPlacementId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Colocación de respaldo para el failover | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:928` |
| `tenantPartitionKey` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Clave de partición del tenant | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:940` |
| `tenantEncryptionKeyRef` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Referencia de la clave del tenant en el KMS | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:952` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001",
  "primaryPlacementId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001",
  "primaryPlacementId": "00000000-0000-4000-8000-000000000001",
  "secondaryPlacementId": "00000000-0000-4000-8000-000000000001",
  "tenantPartitionKey": "valor-ejemplo",
  "tenantEncryptionKeyRef": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<TenantBindingResponseDto>` · DTO `TenantBindingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:963` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:969` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:975` |
| `primaryPlacementState` | `string` | Sí | — | — | Estado en el que queda la colocación primaria | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:981` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Colocación primaria no encontrada; ResourceNotFoundException: Colocación secundaria no encontrada |
| 409 | `CONFLICT` | ConflictException: El tenant ya está vinculado a ese dataset |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La colocación primaria no está aprobada; PreconditionFailedException: La colocación secundaria no puede ser la misma que la primaria |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-governance.controller.spec.ts:129` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-08`

---

## 13. POST /ops/integrity-policies

- **Origen:** CONTRATO
- **Nombre:** Definir la política de integridad del dataset
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageOperationsController.defineIntegrityPolicy` — `src/modules/polyglot_storage/controllers/storage-operations.controller.ts:53`

### Qué es y para qué sirve (negocio)

Definir la política de integridad del dataset. Caso de uso UC-54-13: Integridad y cuarentena. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:24`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ops/integrity-policies` la atiende `StorageOperationsController.defineIntegrityPolicy` (src/modules/polyglot_storage/controllers/storage-operations.controller.ts:53). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `DefineIntegrityPolicyDto` (6 campos, 4 obligatorios). Delega en `StorageOperationsService.defineIntegrityPolicy`. Crea filas en polyglot_storage.storage_integrity_policies. Actualiza polyglot_storage.storage_integrity_policies. Lee polyglot_storage.dataset_definitions, polyglot_storage.storage_integrity_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-operations.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.dataset_definitions` | LEE | LEE | DIRECTA | StorageOperationsController.defineIntegrityPolicy → StorageOperationsService.defineIntegrityPolicy → DatasetsRepository.findDatasetById | `src/modules/polyglot_storage/repositories/datasets.repository.ts:123` |
| `polyglot_storage.storage_integrity_policies` | ESCRIBE | ACTUALIZA | POR_TIPO | StorageOperationsController.defineIntegrityPolicy → StorageOperationsService.defineIntegrityPolicy | `src/modules/polyglot_storage/services/storage-operations.service.ts:307` |
| `polyglot_storage.storage_integrity_policies` | ESCRIBE | CREA | DIRECTA | StorageOperationsController.defineIntegrityPolicy → StorageOperationsService.defineIntegrityPolicy → PlacementsRepository.createIntegrityPolicy | `src/modules/polyglot_storage/repositories/placements.repository.ts:377` |
| `polyglot_storage.storage_integrity_policies` | LEE | LEE | DIRECTA | StorageOperationsController.defineIntegrityPolicy → StorageOperationsService.defineIntegrityPolicy → PlacementsRepository.findIntegrityPolicyForUpdate | `src/modules/polyglot_storage/repositories/placements.repository.ts:397` |

### Cuerpo — DTO `DefineIntegrityPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `datasetDefinitionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1622` |
| `hashAlgorithm` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1630` |
| `verificationIntervalHours` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | Cada cuánto se verifica | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1638` |
| `samplePercentage` | `string` | Sí | — | `@IsNumberString()` | Porcentaje de la muestra, como cadena decimal | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1645` |
| `compareWithCanonicalSource` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1653` |
| `quarantineOnMismatch` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Cuarentenar la proyección si el hash no cuadra | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1664` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001",
  "hashAlgorithm": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "verificationIntervalHours": 1,
  "samplePercentage": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001",
  "hashAlgorithm": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "verificationIntervalHours": 1,
  "samplePercentage": "valor-ejemplo",
  "compareWithCanonicalSource": true,
  "quarantineOnMismatch": true
}
```

</details>

### Respuesta — `Promise<IntegrityPolicyResponseDto>` · DTO `IntegrityPolicyResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1675` |
| `datasetDefinitionId` | `string` | Sí | formato uuid | — | Identificador asociado a dataset definition. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1681` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1687` |
| `updated` | `boolean` | Sí | — | — | true si la política ya existía y se actualizó | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1693` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Dataset no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El porcentaje de muestra debe estar entre 0 y 100 |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-operations.controller.spec.ts:47` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-13`

---

## 14. POST /ops/integrity/{datasetId}/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar que la proyección cuadra con la fuente canónica
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageOperationsController.verifyIntegrity` — `src/modules/polyglot_storage/controllers/storage-operations.controller.ts:67`

### Qué es y para qué sirve (negocio)

Verificar que la proyección cuadra con la fuente canónica. Caso de uso UC-54-13: Integridad y cuarentena. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:24`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ops/integrity/{datasetId}/verify` la atiende `StorageOperationsController.verifyIntegrity` (src/modules/polyglot_storage/controllers/storage-operations.controller.ts:67). Exige sesión con alguno de los roles SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `PolyglotStorageVerifyIntegrityDto` (3 campos, 3 obligatorios). Delega en `StorageOperationsService.verifyIntegrity`. Actualiza polyglot_storage.dataset_placements. Lee polyglot_storage.dataset_placements, polyglot_storage.storage_integrity_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-operations.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: datasetId | `src/modules/polyglot_storage/controllers/storage-operations.controller.ts:67` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.dataset_placements` | ESCRIBE | ACTUALIZA | POR_TIPO | StorageOperationsController.verifyIntegrity → StorageOperationsService.verifyIntegrity | `src/modules/polyglot_storage/services/storage-operations.service.ts:382` |
| `polyglot_storage.dataset_placements` | LEE | LEE | DIRECTA | StorageOperationsController.verifyIntegrity → StorageOperationsService.verifyIntegrity → PlacementsRepository.findPlacementForUpdate | `src/modules/polyglot_storage/repositories/placements.repository.ts:111` |
| `polyglot_storage.storage_integrity_policies` | LEE | LEE | DIRECTA | StorageOperationsController.verifyIntegrity → StorageOperationsService.verifyIntegrity → PlacementsRepository.findIntegrityPolicy | `src/modules/polyglot_storage/repositories/placements.repository.ts:415` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `datasetId` | path | Sí | `string` | — |

### Cuerpo — DTO `PolyglotStorageVerifyIntegrityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `placementId` | `string` | Sí | formato uuid | `@IsUUID()` | Colocación cuya proyección se verifica | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1707` |
| `canonicalHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash de la fuente canónica | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1715` |
| `projectionHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash calculado sobre la proyección | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1726` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "placementId": "00000000-0000-4000-8000-000000000001",
  "canonicalHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "projectionHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "placementId": "00000000-0000-4000-8000-000000000001",
  "canonicalHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "projectionHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

</details>

### Respuesta — `Promise<VerifyIntegrityResponseDto>` · DTO `VerifyIntegrityResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `placementId` | `string` | Sí | formato uuid | — | Identificador asociado a placement. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1737` |
| `matched` | `boolean` | Sí | — | — | true si los dos hashes coinciden | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1743` |
| `placementState` | `string` | Sí | — | — | Estado en el que queda la colocación | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1749` |
| `quarantined` | `boolean` | Sí | — | — | true si la política ordenó cuarentenarla | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1755` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El dataset no tiene política de integridad; ResourceNotFoundException: Colocación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-operations.controller.spec.ts:57` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-13`

---

## 15. POST /ops/store-health-checks

- **Origen:** CONTRATO
- **Nombre:** Registrar una comprobación de salud de la región
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StorageOperationsController.recordHealthCheck` — `src/modules/polyglot_storage/controllers/storage-operations.controller.ts:38`

### Qué es y para qué sirve (negocio)

Registrar una comprobación de salud de la región. Caso de uso UC-54-11: Salud y failover. Dentro del módulo (descripción del modelo, en inglés): «Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/polyglot_storage/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_54_polyglot_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ops/store-health-checks` la atiende `StorageOperationsController.recordHealthCheck` (src/modules/polyglot_storage/controllers/storage-operations.controller.ts:38). Exige sesión con alguno de los roles SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `RecordHealthCheckDto` (5 campos, 3 obligatorios). Delega en `StorageOperationsService.recordHealthCheck`. Crea filas en polyglot_storage.store_health_checks. Actualiza polyglot_storage.dataset_placements, polyglot_storage.tenant_storage_bindings. Lee polyglot_storage.dataset_placements, polyglot_storage.replication_policies, polyglot_storage.storage_backend_regions, polyglot_storage.tenant_storage_bindings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PLATFORM_ADMIN | `src/modules/polyglot_storage/controllers/storage-operations.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `polyglot_storage.dataset_placements` | ESCRIBE | ACTUALIZA | POR_TIPO | StorageOperationsController.recordHealthCheck → StorageOperationsService.recordHealthCheck | `src/modules/polyglot_storage/services/storage-operations.service.ts:126` |
| `polyglot_storage.dataset_placements` | LEE | LEE | DIRECTA | StorageOperationsController.recordHealthCheck → StorageOperationsService.recordHealthCheck → PlacementsRepository.findPlacementsByRegionForUpdate | `src/modules/polyglot_storage/repositories/placements.repository.ts:138` |
| `polyglot_storage.replication_policies` | LEE | LEE | DIRECTA | StorageOperationsController.recordHealthCheck → StorageOperationsService.recordHealthCheck → StoragePoliciesRepository.findReplicationPolicyById | `src/modules/polyglot_storage/repositories/storage-policies.repository.ts:262` |
| `polyglot_storage.storage_backend_regions` | LEE | LEE | DIRECTA | StorageOperationsController.recordHealthCheck → StorageOperationsService.recordHealthCheck → StorageBackendsRepository.findRegionForUpdate | `src/modules/polyglot_storage/repositories/storage-backends.repository.ts:342` |
| `polyglot_storage.store_health_checks` | ESCRIBE | CREA | DIRECTA | StorageOperationsController.recordHealthCheck → StorageOperationsService.recordHealthCheck → StorageBackendsRepository.createHealthCheck | `src/modules/polyglot_storage/repositories/storage-backends.repository.ts:323` |
| `polyglot_storage.tenant_storage_bindings` | ESCRIBE | ACTUALIZA | POR_TIPO | StorageOperationsController.recordHealthCheck → StorageOperationsService.recordHealthCheck → StorageOperationsService.swapBindings | `src/modules/polyglot_storage/services/storage-operations.service.ts:423` |
| `polyglot_storage.tenant_storage_bindings` | LEE | LEE | DIRECTA | StorageOperationsController.recordHealthCheck → StorageOperationsService.recordHealthCheck → StorageOperationsService.swapBindings → PlacementsRepository.findBindingsByPrimaryForUpdate | `src/modules/polyglot_storage/repositories/placements.repository.ts:223` |

### Cuerpo — DTO `RecordHealthCheckDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `storageBackendRegionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1398` |
| `checkType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1406` |
| `status` | `string` | Sí | valores: HEALTHY, DEGRADED, UNHEALTHY | `@IsIn(HEALTH_STATUSES)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1413` |
| `latencyMs` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1422` |
| `detailsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1430` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "storageBackendRegionId": "00000000-0000-4000-8000-000000000001",
  "checkType": "valor-ejemplo",
  "status": "HEALTHY"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "storageBackendRegionId": "00000000-0000-4000-8000-000000000001",
  "checkType": "valor-ejemplo",
  "status": "HEALTHY",
  "latencyMs": 1,
  "detailsJson": {}
}
```

</details>

### Respuesta — `Promise<HealthCheckResponseDto>` · DTO `HealthCheckResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1441` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1447` |
| `degradedPlacements` | `number` | Sí | — | — | Colocaciones que quedaron degradadas por esta comprobación | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1455` |
| `swappedBindings` | `number` | Sí | — | — | Vínculos de tenant cuyo primario se movió al secundario | `src/modules/polyglot_storage/dto/polyglot-storage.dto.ts:1463` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Región no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/polyglot_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/polyglot_storage/controllers/storage-operations.controller.spec.ts:37` |

### Flujos

- Módulo 54 — Almacenamiento Políglota (gobierno de colocación) — etapa `UC-54-11`

---

