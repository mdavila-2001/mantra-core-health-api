<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `data_catalog`

- **Bloque:** —
- **Operaciones:** 31 (31 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 4 · BAJO 27
- **Tablas distintas que tocan:** 9
- **Respuestas de error y detalle contractual:** `openapi/endpoints/data-catalog.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/admin/catalog/annotations/{id}/review` | Aprueba o rechaza la revisión vigente de una ficha | MEDIO | 5 | GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN |
| 2 | GET | `/admin/catalog/coverage` | Cobertura del catálogo por dimensión, calculada por el servidor | BAJO | 3 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 3 | GET | `/admin/catalog/objects` | Objetos del catálogo, paginados por cursor | BAJO | 3 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 4 | GET | `/admin/catalog/objects/{id}` | Ficha técnica, observación, ficha curada, cobertura y gobierno de un objeto | BAJO | 5 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 5 | PUT | `/admin/catalog/objects/{id}/annotation` | Crea o edita la ficha de un objeto (con versión esperada) | MEDIO | 6 | GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN |
| 6 | GET | `/admin/catalog/objects/{id}/changes` | Cambios que los escaneos detectaron en un objeto | BAJO | 4 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 7 | GET | `/admin/catalog/objects/{id}/columns` | Columnas observadas de un objeto, con su ficha si la tienen | BAJO | 4 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 8 | GET | `/admin/catalog/objects/{id}/evidence` | Evidencia enlazada a un objeto | BAJO | 3 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 9 | POST | `/admin/catalog/objects/{id}/evidence` | Enlaza evidencia a un objeto | MEDIO | 3 | GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN |
| 10 | GET | `/admin/catalog/objects/{id}/history` | Revisiones y decisiones de la ficha de un objeto | BAJO | 5 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 11 | GET | `/admin/catalog/objects/{id}/impact` | Quién referencia a un objeto y a quién referencia, por claves foráneas observadas | BAJO | 4 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 12 | GET | `/admin/catalog/scans` | Escaneos, del más reciente al más antiguo | BAJO | 1 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 13 | POST | `/admin/catalog/scans` | Pide un escaneo de la base primaria (se ejecuta fuera de la petición) | MEDIO | 10 | GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN |
| 14 | GET | `/admin/catalog/scans/{id}` | Un escaneo | BAJO | 1 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 15 | GET | `/admin/catalog/schemas` | Schemas observados, con cuántos objetos tienen ficha y cuántos están aprobados | BAJO | 2 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 16 | GET | `/admin/portal/catalogo/deriva` | Deriva entre el DDL del modelo y las entidades del ORM | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 17 | GET | `/admin/portal/catalogo/tablas` | Listar las tablas del catálogo de datos | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 18 | GET | `/admin/portal/catalogo/tablas/{schema}/{tabla}` | Ver la ficha de una tabla | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 19 | GET | `/admin/portal/flujos` | Listar los procesos de negocio | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 20 | GET | `/admin/portal/flujos/{codigo}` | Ver un proceso con sus etapas y máquinas de estado | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 21 | GET | `/admin/portal/flujos/{codigo}/grafo` | Ver el grafo de un proceso | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 22 | GET | `/admin/portal/flujos/hallazgos` | Resumen de hallazgos del mapa | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 23 | GET | `/admin/portal/flujos/hallazgos/{id}` | Ver los casos de un hallazgo | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 24 | GET | `/admin/portal/flujos/mapa` | Mapa de operaciones con sus señales | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 25 | GET | `/admin/portal/glosario` | Buscar en el glosario | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 26 | GET | `/admin/portal/linaje` | Métricas del linaje de datos | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 27 | GET | `/admin/portal/linaje/tablas/{schema}/{tabla}` | Linaje de una tabla | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 28 | GET | `/admin/portal/operaciones` | Listar las operaciones HTTP del sistema | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 29 | GET | `/admin/portal/operaciones/{id}` | Ver la ficha de una operación | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 30 | GET | `/admin/portal/operaciones/{id}/arbol` | Ver el árbol de decisión de una operación | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |
| 31 | GET | `/admin/portal/version` | Versión y tamaño del inventario publicado | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO |

---

## 1. POST /admin/catalog/annotations/{id}/review

- **Origen:** CONTRATO
- **Nombre:** Aprueba o rechaza la revisión vigente de una ficha
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.review` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:201`

### Qué es y para qué sirve (negocio)

Aprueba o rechaza la revisión vigente de una ficha. Caso de uso UC-67-27: Aprobar o rechazar la revisión vigente.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:42`)

### Cómo se atiende (sistema)

`POST /admin/catalog/annotations/{id}/review` la atiende `AdminCatalogController.review` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:201). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN. Valida el cuerpo como `ReviewInputDto` (3 campos, 2 obligatorios). Delega en `CatalogGovernanceService.review`. Crea filas en data_catalog.catalog_review_decisions. Actualiza data_catalog.catalog_annotations. Lee data_catalog.catalog_annotation_revisions, data_catalog.catalog_annotations, data_catalog.catalog_evidence_items.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:201` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:201` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotation_revisions` | LEE | LEE | POR_SQL | AdminCatalogController.review → CatalogGovernanceService.review → CatalogRepository.revisionAuthor | `src/modules/data_catalog/repositories/catalog.repository.ts:448` |
| `data_catalog.catalog_annotations` | ESCRIBE | ACTUALIZA | POR_SQL | AdminCatalogController.review → CatalogGovernanceService.review → CatalogRepository.decide | `src/modules/data_catalog/repositories/catalog.repository.ts:727` |
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.review → CatalogGovernanceService.review → CatalogRepository.annotationById | `src/modules/data_catalog/repositories/catalog.repository.ts:341` |
| `data_catalog.catalog_evidence_items` | LEE | LEE | POR_SQL | AdminCatalogController.review → CatalogGovernanceService.review → CatalogRepository.evidenceCount | `src/modules/data_catalog/repositories/catalog.repository.ts:385` |
| `data_catalog.catalog_review_decisions` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.review → CatalogGovernanceService.review → CatalogRepository.decide | `src/modules/data_catalog/repositories/catalog.repository.ts:748` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReviewInputDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: APPROVED, REJECTED | `@IsIn(['APPROVED', 'REJECTED'])` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:307` |
| `expectedRevisionNo` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | Revisión que se revisó (`currentRevisionNo`); si hay una más reciente, 409 | `src/modules/data_catalog/dto/catalog-request.dto.ts:316` |
| `comment` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Obligatorio, de al menos 10 caracteres, al rechazar | `src/modules/data_catalog/dto/catalog-request.dto.ts:325` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "APPROVED",
  "expectedRevisionNo": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "APPROVED",
  "expectedRevisionNo": 1,
  "comment": "valor-ejemplo"
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ficha no encontrada |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: {message}; ConcurrencyConflictException: La ficha cambió mientras se revisaba |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {403}; DomainException: {422} |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-27`

---

## 2. GET /admin/catalog/coverage

- **Origen:** CONTRATO
- **Nombre:** Cobertura del catálogo por dimensión, calculada por el servidor
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.coverage` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:228`

### Qué es y para qué sirve (negocio)

Cobertura del catálogo por dimensión, calculada por el servidor. Caso de uso UC-67-28: Cobertura del catálogo por dimensión.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:43`)

### Cómo se atiende (sistema)

`GET /admin/catalog/coverage` la atiende `AdminCatalogController.coverage` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:228). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `CatalogReadService.coverage`. Lee data_catalog.catalog_annotations, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:228` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:228` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.coverage → CatalogReadService.coverage → CatalogRepository.coverageRows → CatalogRepository.annotationsOf | `src/modules/data_catalog/repositories/catalog.repository.ts:321` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.coverage → CatalogReadService.coverage → CatalogRepository.coverageRows | `src/modules/data_catalog/repositories/catalog.repository.ts:521` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.coverage → CatalogReadService.coverage → CatalogRepository.scans | `src/modules/data_catalog/repositories/catalog.repository.ts:779` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `schema` | query | No | `string` | Limita la cobertura a un schema |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-28`

---

## 3. GET /admin/catalog/objects

- **Origen:** CONTRATO
- **Nombre:** Objetos del catálogo, paginados por cursor
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.objects` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:90`

### Qué es y para qué sirve (negocio)

Objetos del catálogo, paginados por cursor. Caso de uso UC-67-18: Objetos observados, con filtros y cursor.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:33`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects` la atiende `AdminCatalogController.objects` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:90). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `CatalogReadService.objects`. Lee data_catalog.catalog_annotations, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:90` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:90` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.objects → CatalogReadService.objects → CatalogRepository.objects | `src/modules/data_catalog/repositories/catalog.repository.ts:277` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.objects → CatalogReadService.objects → CatalogRepository.objects | `src/modules/data_catalog/repositories/catalog.repository.ts:277` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.objects → CatalogReadService.objects → CatalogRepository.objects | `src/modules/data_catalog/repositories/catalog.repository.ts:277` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |
| `schema` | query | No | `string` | Schema de PostgreSQL |
| `kind` | query | No | `string` | — |
| `observationStatus` | query | No | `string` | — |
| `reviewStatus` | query | No | `string` | `NONE`: objetos sin ficha |
| `q` | query | No | `string` | Busca en `schema.objeto` y en el nombre de negocio |
| `missing` | query | No | `string` | Sólo los objetos a los que les falta ese dato de la ficha |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: El cursor de paginación no es válido |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-18`

---

## 4. GET /admin/catalog/objects/{id}

- **Origen:** CONTRATO
- **Nombre:** Ficha técnica, observación, ficha curada, cobertura y gobierno de un objeto
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.object` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:100`

### Qué es y para qué sirve (negocio)

Ficha técnica, observación, ficha curada, cobertura y gobierno de un objeto. Caso de uso UC-67-19: Ficha técnica, observación, ficha curada, cobertura.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:34`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}` la atiende `AdminCatalogController.object` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:100). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `CatalogReadService.objectDetail`. Lee data_catalog.catalog_annotations, data_catalog.catalog_evidence_items, data_catalog.catalog_objects, data_catalog.catalog_scan_runs, system_ops.entity_registry.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:100` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:100` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.object → CatalogReadService.objectDetail → CatalogRepository.annotationOfObject → CatalogRepository.annotationsOf | `src/modules/data_catalog/repositories/catalog.repository.ts:321` |
| `data_catalog.catalog_evidence_items` | LEE | LEE | POR_SQL | AdminCatalogController.object → CatalogReadService.objectDetail → CatalogRepository.evidenceCount | `src/modules/data_catalog/repositories/catalog.repository.ts:385` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.object → CatalogReadService.objectDetail → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/repositories/catalog.repository.ts:304` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.object → CatalogReadService.objectDetail → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/repositories/catalog.repository.ts:304` |
| `system_ops.entity_registry` | LEE | LEE | POR_SQL | AdminCatalogController.object → CatalogReadService.objectDetail → CatalogRepository.governance | `src/modules/data_catalog/repositories/catalog.repository.ts:561` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-19`

---

## 5. PUT /admin/catalog/objects/{id}/annotation

- **Origen:** CONTRATO
- **Nombre:** Crea o edita la ficha de un objeto (con versión esperada)
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.saveAnnotation` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:178`

### Qué es y para qué sirve (negocio)

Crea o edita la ficha de un objeto (con versión esperada). Caso de uso UC-67-26: Crear o editar la ficha (con versión esperada).

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:41`)

### Cómo se atiende (sistema)

`PUT /admin/catalog/objects/{id}/annotation` la atiende `AdminCatalogController.saveAnnotation` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:178). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN. Valida el cuerpo como `AnnotationPatchDto` (23 campos, 1 obligatorio). Delega en `CatalogGovernanceService.saveAnnotation`. Crea filas en data_catalog.catalog_annotation_revisions, data_catalog.catalog_annotations. Actualiza data_catalog.catalog_annotations. Lee data_catalog.catalog_annotations, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:178` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:178` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotation_revisions` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.saveAnnotation → CatalogGovernanceService.saveAnnotation → CatalogRepository.insertRevision | `src/modules/data_catalog/repositories/catalog.repository.ts:692` |
| `data_catalog.catalog_annotations` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.saveAnnotation → CatalogGovernanceService.saveAnnotation → CatalogRepository.insertAnnotation | `src/modules/data_catalog/repositories/catalog.repository.ts:585` |
| `data_catalog.catalog_annotations` | ESCRIBE | ACTUALIZA | POR_SQL | AdminCatalogController.saveAnnotation → CatalogGovernanceService.saveAnnotation → CatalogRepository.updateAnnotation | `src/modules/data_catalog/repositories/catalog.repository.ts:641` |
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.saveAnnotation → CatalogGovernanceService.saveAnnotation → CatalogRepository.annotationById | `src/modules/data_catalog/repositories/catalog.repository.ts:341` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.saveAnnotation → CatalogGovernanceService.saveAnnotation → CatalogRepository.objectById | `src/modules/data_catalog/repositories/catalog.repository.ts:304` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.saveAnnotation → CatalogGovernanceService.saveAnnotation → CatalogRepository.objectById | `src/modules/data_catalog/repositories/catalog.repository.ts:304` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AnnotationPatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expectedVersion` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | Versión de la ficha que se leyó (`version`); 0 para crearla. Si cambió, 409 | `src/modules/data_catalog/dto/catalog-request.dto.ts:168` |
| `submit` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Enviarla a revisión: exige propósito, razón de existir y grano de fila (o declararlos como preguntas abiertas) | `src/modules/data_catalog/dto/catalog-request.dto.ts:176` |
| `changeReason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:182` |
| `businessName` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:188` |
| `definition` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:193` |
| `purpose` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:198` |
| `existenceRationale` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:203` |
| `rowGrain` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:208` |
| `alternativesRationale` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:213` |
| `deletionImpact` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:218` |
| `businessOwner` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:223` |
| `dataSteward` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:228` |
| `technicalOwner` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:233` |
| `unit` | `object` | No | longitud máxima 100; admite null | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:238` |
| `valueDomain` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:243` |
| `nullSemantics` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:248` |
| `sensitivity` | `string` | No | valores: UNKNOWN, NONE, INTERNAL, PII, PHI, SECRET | `@IsOptional()` `@IsIn(SENSITIVITIES)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:253` |
| `consumers` | `array<string>` | No | longitud máxima 200; máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@IsString({ each: true })` `@MaxLength(200, { each: true })` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:261` |
| `openQuestions` | `array<OpenQuestionDto>` | No | máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => OpenQuestionDto)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:269` |
| `openQuestions[].field` | `string` | No | longitud máxima 60 | `@IsOptional()` `@IsString()` `@MaxLength(60)` | Campo de la ficha sobre el que es la pregunta | `src/modules/data_catalog/dto/catalog-request.dto.ts:134` |
| `openQuestions[].question` | `string` | No | longitud mínima 3; longitud máxima 500 | `@IsString()` `@MinLength(3)` `@MaxLength(500)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:140` |
| `openQuestions[].owner` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:146` |
| `openQuestions[].dueDate` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Fecha ISO 8601 | `src/modules/data_catalog/dto/catalog-request.dto.ts:151` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "expectedVersion": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "expectedVersion": 1,
  "submit": true,
  "changeReason": "Texto descriptivo de ejemplo",
  "businessName": {},
  "definition": {},
  "purpose": {},
  "existenceRationale": {},
  "rowGrain": {},
  "alternativesRationale": {},
  "deletionImpact": {},
  "businessOwner": {},
  "dataSteward": {},
  "technicalOwner": {},
  "unit": {},
  "valueDomain": {},
  "nullSemantics": {},
  "sensitivity": "UNKNOWN",
  "consumers": [
    "valor-ejemplo"
  ],
  "openQuestions": [
    {
      "field": "valor-ejemplo",
      "question": "valor-ejemplo",
      "owner": "valor-ejemplo",
      "dueDate": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: La ficha cambió desde que se leyó |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {422} |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-26`

---

## 6. GET /admin/catalog/objects/{id}/changes

- **Origen:** CONTRATO
- **Nombre:** Cambios que los escaneos detectaron en un objeto
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.changes` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:157`

### Qué es y para qué sirve (negocio)

Cambios que los escaneos detectaron en un objeto. Caso de uso UC-67-24: Cambios que los escaneos detectaron.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:39`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/changes` la atiende `AdminCatalogController.changes` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:157). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `CatalogReadService.changes`. Lee data_catalog.catalog_change_events, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:157` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:157` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_change_events` | LEE | LEE | POR_SQL | AdminCatalogController.changes → CatalogReadService.changes → CatalogRepository.changes | `src/modules/data_catalog/repositories/catalog.repository.ts:470` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.changes → CatalogReadService.changes → CatalogRepository.changes | `src/modules/data_catalog/repositories/catalog.repository.ts:470` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.changes → CatalogReadService.changes → CatalogRepository.changes | `src/modules/data_catalog/repositories/catalog.repository.ts:470` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.changes → CatalogReadService.changes → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/repositories/catalog.repository.ts:304` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-24`

---

## 7. GET /admin/catalog/objects/{id}/columns

- **Origen:** CONTRATO
- **Nombre:** Columnas observadas de un objeto, con su ficha si la tienen
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.columns` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:112`

### Qué es y para qué sirve (negocio)

Columnas observadas de un objeto, con su ficha si la tienen. Caso de uso UC-67-20: Columnas observadas con su ficha.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:35`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/columns` la atiende `AdminCatalogController.columns` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:112). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `CatalogReadService.columns`. Lee data_catalog.catalog_annotations, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:112` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:112` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.columns → CatalogReadService.columns → CatalogRepository.columnAnnotations | `src/modules/data_catalog/repositories/catalog.repository.ts:365` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.columns → CatalogReadService.columns → CatalogRepository.columns | `src/modules/data_catalog/repositories/catalog.repository.ts:352` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.columns → CatalogReadService.columns → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/repositories/catalog.repository.ts:304` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.columns → CatalogReadService.columns → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/repositories/catalog.repository.ts:304` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-20`

---

## 8. GET /admin/catalog/objects/{id}/evidence

- **Origen:** CONTRATO
- **Nombre:** Evidencia enlazada a un objeto
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.evidence` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:122`

### Qué es y para qué sirve (negocio)

Evidencia enlazada a un objeto. Caso de uso UC-67-21: Evidencia enlazada.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:36`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/evidence` la atiende `AdminCatalogController.evidence` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:122). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `CatalogReadService.evidence`. Lee data_catalog.catalog_evidence_items, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:122` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:122` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_evidence_items` | LEE | LEE | POR_SQL | AdminCatalogController.evidence → CatalogReadService.evidence → CatalogRepository.evidence | `src/modules/data_catalog/repositories/catalog.repository.ts:376` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.evidence → CatalogReadService.evidence → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/repositories/catalog.repository.ts:304` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.evidence → CatalogReadService.evidence → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/repositories/catalog.repository.ts:304` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-21`

---

## 9. POST /admin/catalog/objects/{id}/evidence

- **Origen:** CONTRATO
- **Nombre:** Enlaza evidencia a un objeto
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.addEvidence` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:132`

### Qué es y para qué sirve (negocio)

Enlaza evidencia a un objeto. Caso de uso UC-67-22: Enlazar evidencia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:37`)

### Cómo se atiende (sistema)

`POST /admin/catalog/objects/{id}/evidence` la atiende `AdminCatalogController.addEvidence` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:132). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN. Valida el cuerpo como `DataCatalogEvidenceInputDto` (4 campos, 2 obligatorios). Delega en `CatalogGovernanceService.addEvidence`. Crea filas en data_catalog.catalog_evidence_items. Lee data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:132` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:132` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_evidence_items` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.addEvidence → CatalogGovernanceService.addEvidence → CatalogRepository.addEvidence | `src/modules/data_catalog/repositories/catalog.repository.ts:405` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.addEvidence → CatalogGovernanceService.addEvidence → CatalogRepository.objectById | `src/modules/data_catalog/repositories/catalog.repository.ts:304` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.addEvidence → CatalogGovernanceService.addEvidence → CatalogRepository.objectById | `src/modules/data_catalog/repositories/catalog.repository.ts:304` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DataCatalogEvidenceInputDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `string` | Sí | valores: SCHEMA_COMMENT, VAULT_NOTE, MIGRATION, CODE_REFERENCE, OPENAPI, OWNER_STATEMENT, DOCUMENT | — | — | sin fuente |
| `reference` | `string` | Sí | longitud mínima 3; longitud máxima 2000 | — | Dónde está la evidencia: ruta, enlace, identificador | sin fuente |
| `excerpt` | `string` | No | longitud máxima 2000 | — | — | sin fuente |
| `sourceRevision` | `string` | No | longitud máxima 200 | — | Revisión del documento o commit de donde se tomó | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "kind": "SCHEMA_COMMENT",
  "reference": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "kind": "SCHEMA_COMMENT",
  "reference": "valor-ejemplo",
  "excerpt": "valor-ejemplo",
  "sourceRevision": "valor-ejemplo"
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.CREATED`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-22`

---

## 10. GET /admin/catalog/objects/{id}/history

- **Origen:** CONTRATO
- **Nombre:** Revisiones y decisiones de la ficha de un objeto
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.history` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:147`

### Qué es y para qué sirve (negocio)

Revisiones y decisiones de la ficha de un objeto. Caso de uso UC-67-23: Revisiones y decisiones de la ficha.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:38`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/history` la atiende `AdminCatalogController.history` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:147). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `CatalogReadService.history`. Lee data_catalog.catalog_annotation_revisions, data_catalog.catalog_annotations, data_catalog.catalog_objects, data_catalog.catalog_review_decisions, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:147` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:147` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotation_revisions` | LEE | LEE | POR_SQL | AdminCatalogController.history → CatalogReadService.history → CatalogRepository.revisions | `src/modules/data_catalog/repositories/catalog.repository.ts:425` |
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.history → CatalogReadService.history → CatalogRepository.annotationOfObject → CatalogRepository.annotationsOf | `src/modules/data_catalog/repositories/catalog.repository.ts:321` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.history → CatalogReadService.history → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/repositories/catalog.repository.ts:304` |
| `data_catalog.catalog_review_decisions` | LEE | LEE | POR_SQL | AdminCatalogController.history → CatalogReadService.history → CatalogRepository.decisions | `src/modules/data_catalog/repositories/catalog.repository.ts:434` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.history → CatalogReadService.history → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/repositories/catalog.repository.ts:304` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-23`

---

## 11. GET /admin/catalog/objects/{id}/impact

- **Origen:** CONTRATO
- **Nombre:** Quién referencia a un objeto y a quién referencia, por claves foráneas observadas
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.impact` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:167`

### Qué es y para qué sirve (negocio)

Quién referencia a un objeto y a quién referencia, por claves foráneas observadas. Caso de uso UC-67-25: Análisis de impacto por claves foráneas observadas.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:40`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/impact` la atiende `AdminCatalogController.impact` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:167). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `CatalogReadService.impact`. Lee data_catalog.catalog_annotations, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:167` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:167` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.impact → CatalogReadService.impact → CatalogRepository.annotationsOf | `src/modules/data_catalog/repositories/catalog.repository.ts:321` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.impact → CatalogReadService.impact → CatalogRepository.foreignKeyGraph | `src/modules/data_catalog/repositories/catalog.repository.ts:494` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.impact → CatalogReadService.impact → CatalogRepository.foreignKeyGraph | `src/modules/data_catalog/repositories/catalog.repository.ts:494` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.impact → CatalogReadService.impact → CatalogRepository.objectsByIds | `src/modules/data_catalog/repositories/catalog.repository.ts:293` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `direction` | query | No | `string` | `downstream`: quién referencia al objeto; `upstream`: a quién referencia |
| `depth` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-25`

---

## 12. GET /admin/catalog/scans

- **Origen:** CONTRATO
- **Nombre:** Escaneos, del más reciente al más antiguo
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.listScans` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:238`

### Qué es y para qué sirve (negocio)

Escaneos, del más reciente al más antiguo. Caso de uso UC-67-29: Listar escaneos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:44`)

### Cómo se atiende (sistema)

`GET /admin/catalog/scans` la atiende `AdminCatalogController.listScans` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:238). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `CatalogReadService.scans`. Lee data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:238` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:238` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.listScans → CatalogReadService.scans → CatalogRepository.scans | `src/modules/data_catalog/repositories/catalog.repository.ts:779` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-29`

---

## 13. POST /admin/catalog/scans

- **Origen:** CONTRATO
- **Nombre:** Pide un escaneo de la base primaria (se ejecuta fuera de la petición)
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.requestScan` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:256`

### Qué es y para qué sirve (negocio)

Pide un escaneo de la base primaria (se ejecuta fuera de la petición). Caso de uso UC-67-31: Pedir un escaneo de la base primaria (202, idempotente).

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:46`)

### Cómo se atiende (sistema)

`POST /admin/catalog/scans` la atiende `AdminCatalogController.requestScan` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:256). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN. Delega en `CatalogScanService.request`. Crea filas en data_catalog.catalog_change_events, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs. Actualiza data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs. Lee data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:256` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:256` |
| CABECERA | Idempotency-Key (obligatoria) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_change_events` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogRepository.applyScan | `src/modules/data_catalog/repositories/catalog.repository.ts:1174` |
| `data_catalog.catalog_columns` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogRepository.applyScan | `src/modules/data_catalog/repositories/catalog.repository.ts:1101` |
| `data_catalog.catalog_columns` | ESCRIBE | ACTUALIZA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogRepository.applyScan | `src/modules/data_catalog/repositories/catalog.repository.ts:1122` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogRepository.knownObjects | `src/modules/data_catalog/repositories/catalog.repository.ts:965` |
| `data_catalog.catalog_objects` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogRepository.applyScan | `src/modules/data_catalog/repositories/catalog.repository.ts:1068` |
| `data_catalog.catalog_objects` | ESCRIBE | ACTUALIZA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogRepository.applyScan | `src/modules/data_catalog/repositories/catalog.repository.ts:1089` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogRepository.knownObjects | `src/modules/data_catalog/repositories/catalog.repository.ts:952` |
| `data_catalog.catalog_scan_runs` | ESCRIBE | ACTUALIZA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogRepository.failAbandoned | `src/modules/data_catalog/repositories/catalog.repository.ts:823` |
| `data_catalog.catalog_scan_runs` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogRepository.insertScan | `src/modules/data_catalog/repositories/catalog.repository.ts:848` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogRepository.scanByIdempotency | `src/modules/data_catalog/repositories/catalog.repository.ts:800` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `Idempotency-Key` | header | Sí | `string` | 8–128 caracteres; la misma clave del mismo usuario devuelve el escaneo ya aceptado |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ScanAcceptedDto>` · DTO `ScanAcceptedDto` · HTTP `HttpStatus.ACCEPTED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `scanId` | `string` | Sí | formato uuid | — | — | `src/modules/data_catalog/dto/catalog-response.dto.ts:425` |
| `status` | `string` | Sí | valores: QUEUED, RUNNING, SUCCEEDED, FAILED, CANCELLED | — | — | `src/modules/data_catalog/dto/catalog-response.dto.ts:426` |
| `created` | `boolean` | Sí | — | — | `false` si la petición repetía una `Idempotency-Key` ya usada y se devolvió el escaneo de entonces | `src/modules/data_catalog/dto/catalog-response.dto.ts:431` |
| `acceptedAt` | `string` | Sí | formato date-time | — | — | `src/modules/data_catalog/dto/catalog-response.dto.ts:432` |
| `statusUrl` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/catalog-response.dto.ts:433` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 202 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya hay un escaneo en curso de esta fuente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-31`

---

## 14. GET /admin/catalog/scans/{id}

- **Origen:** CONTRATO
- **Nombre:** Un escaneo
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.scan` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:248`

### Qué es y para qué sirve (negocio)

Un escaneo. Caso de uso UC-67-30: Un escaneo.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:45`)

### Cómo se atiende (sistema)

`GET /admin/catalog/scans/{id}` la atiende `AdminCatalogController.scan` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:248). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `CatalogReadService.scan`. Lee data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:248` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:248` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.scan → CatalogReadService.scan → CatalogRepository.scanById | `src/modules/data_catalog/repositories/catalog.repository.ts:787` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Escaneo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-30`

---

## 15. GET /admin/catalog/schemas

- **Origen:** CONTRATO
- **Nombre:** Schemas observados, con cuántos objetos tienen ficha y cuántos están aprobados
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.schemas` — `src/modules/data_catalog/controllers/admin-catalog.controller.ts:79`

### Qué es y para qué sirve (negocio)

Schemas observados, con cuántos objetos tienen ficha y cuántos están aprobados. Caso de uso UC-67-17: Schemas observados, con fichas y aprobaciones.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:32`)

### Cómo se atiende (sistema)

`GET /admin/catalog/schemas` la atiende `AdminCatalogController.schemas` (src/modules/data_catalog/controllers/admin-catalog.controller.ts:79). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `CatalogReadService.schemas`. Lee data_catalog.catalog_annotations, data_catalog.catalog_objects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:79` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:79` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.schemas → CatalogReadService.schemas → CatalogRepository.schemas | `src/modules/data_catalog/repositories/catalog.repository.ts:219` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.schemas → CatalogReadService.schemas → CatalogRepository.schemas | `src/modules/data_catalog/repositories/catalog.repository.ts:219` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-17`

---

## 16. GET /admin/portal/catalogo/deriva

- **Origen:** CONTRATO
- **Nombre:** Deriva entre el DDL del modelo y las entidades del ORM
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.deriva` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:175`

### Qué es y para qué sirve (negocio)

Deriva entre el DDL del modelo y las entidades del ORM. Caso de uso UC-67-13: Deriva entre modelo, ORM y base desplegada.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:28`)

### Cómo se atiende (sistema)

`GET /admin/portal/catalogo/deriva` la atiende `AdminPortalController.deriva` (src/modules/data_catalog/controllers/admin-portal.controller.ts:175). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.derivaDelCatalogo`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:175` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:175` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `DerivaCatalogoDto` · DTO `DerivaCatalogoDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `resumen` | `object` | Sí | — | — | Cifras del catálogo | `src/modules/data_catalog/dto/portal-response.dto.ts:450` |
| `deriva` | `object` | Sí | — | — | Entidades sin tabla, tablas sin entidad, columnas ausentes, nulabilidad, schemas sin catálogo de la API | `src/modules/data_catalog/dto/portal-response.dto.ts:457` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-13`

---

## 17. GET /admin/portal/catalogo/tablas

- **Origen:** CONTRATO
- **Nombre:** Listar las tablas del catálogo de datos
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.listarTablas` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:159`

### Qué es y para qué sirve (negocio)

Listar las tablas del catálogo de datos. Caso de uso UC-67-11: Tablas del catálogo estático (modelo), paginadas.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:26`)

### Cómo se atiende (sistema)

`GET /admin/portal/catalogo/tablas` la atiende `AdminPortalController.listarTablas` (src/modules/data_catalog/controllers/admin-portal.controller.ts:159). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.listarTablas`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:159` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |
| `schema` | query | No | `string` | Schema de PostgreSQL |
| `q` | query | No | `string` | Busca en `schema.tabla` y propósito |
| `orm` | query | No | `string` | Estado frente al ORM |
| `appendOnly` | query | No | `boolean` | Sólo (o excluyendo) las tablas que un README declara append-only |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `TablasPaginaDto` · DTO `TablasPaginaDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<TablaResumenDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:380` |
| `items[].id` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:368` |
| `items[].schema` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:369` |
| `items[].tabla` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:370` |
| `items[].dominio` | `string` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:371` |
| `items[].columnas` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:372` |
| `items[].indices` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:373` |
| `items[].operaciones` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:374` |
| `items[].orm` | `string` | Sí | valores: COINCIDE, DIVERGE, SIN_ENTIDAD | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:375` |
| `items[].appendOnly` | `boolean` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:376` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:381` |
| `limit` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:382` |
| `total` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:383` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-11`

---

## 18. GET /admin/portal/catalogo/tablas/{schema}/{tabla}

- **Origen:** CONTRATO
- **Nombre:** Ver la ficha de una tabla
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.fichaDeTabla` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:166`

### Qué es y para qué sirve (negocio)

Ver la ficha de una tabla. Caso de uso UC-67-12: Ficha de una tabla: columnas, relaciones, índices.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:27`)

### Cómo se atiende (sistema)

`GET /admin/portal/catalogo/tablas/{schema}/{tabla}` la atiende `AdminPortalController.fichaDeTabla` (src/modules/data_catalog/controllers/admin-portal.controller.ts:166). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.fichaDeTabla`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:166` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:166` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `schema` | path | Sí | `string` | — |
| `tabla` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `TablaFichaDto` · DTO `TablaFichaDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:388` |
| `schema` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:389` |
| `tabla` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:390` |
| `dominio` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:391` |
| `diagrama` | `string` | Sí | — | — | Diagrama del modelo del que sale | `src/modules/data_catalog/dto/portal-response.dto.ts:393` |
| `ddl` | `string` | Sí | — | — | DDL del que sale | `src/modules/data_catalog/dto/portal-response.dto.ts:394` |
| `proposito` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:395` |
| `propositoEstado` | `string` | Sí | — | — | Estado de la revisión del propósito (hoy `DOMAIN_CURATED_DRAFT`) | `src/modules/data_catalog/dto/portal-response.dto.ts:400` |
| `propositoFuente` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:401` |
| `entidadOrm` | `object` | No | admite null | — | Clase de la entidad del ORM | `src/modules/data_catalog/dto/portal-response.dto.ts:406` |
| `gobierno` | `object` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:408` |
| `columnas` | `array<object>` | Sí | — | — | Columnas con rol estructural y descripción (con fuente o «sin dato») | `src/modules/data_catalog/dto/portal-response.dto.ts:415` |
| `relaciones` | `object` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:416` |
| `indices` | `array<object>` | Sí | — | — | Índices con su «para qué» | `src/modules/data_catalog/dto/portal-response.dto.ts:425` |
| `restricciones` | `array<object>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:430` |
| `operaciones` | `array<object>` | Sí | — | — | Operaciones HTTP que la tocan | `src/modules/data_catalog/dto/portal-response.dto.ts:436` |
| `deriva` | `object` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:437` |
| `revision` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:441` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Tabla no encontrada en el catálogo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-12`

---

## 19. GET /admin/portal/flujos

- **Origen:** CONTRATO
- **Nombre:** Listar los procesos de negocio
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.listarProcesos` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:130`

### Qué es y para qué sirve (negocio)

Listar los procesos de negocio. Caso de uso UC-67-05: Listar procesos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:20`)

### Cómo se atiende (sistema)

`GET /admin/portal/flujos` la atiende `AdminPortalController.listarProcesos` (src/modules/data_catalog/controllers/admin-portal.controller.ts:130). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.listarProcesos`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:130` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:130` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |
| `q` | query | No | `string` | — |
| `tipo` | query | No | `string` | — |
| `modulo` | query | No | `string` | Carpeta del módulo |
| `agrupacion` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `ProcesosPaginaDto` · DTO `ProcesosPaginaDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ProcesoResumenDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:249` |
| `items[].codigo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:235` |
| `items[].tipo` | `string` | Sí | valores: MODULO, CRITICO | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:236` |
| `items[].nombre` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:237` |
| `items[].modulo` | `string` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:238` |
| `items[].bloque` | `string` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:239` |
| `items[].agrupacion` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:240` |
| `items[].actores` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:241` |
| `items[].operaciones` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:242` |
| `items[].etapas` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:243` |
| `items[].maquinas` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:244` |
| `items[].revision` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:245` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:250` |
| `limit` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:251` |
| `total` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:252` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-05`

---

## 20. GET /admin/portal/flujos/{codigo}

- **Origen:** CONTRATO
- **Nombre:** Ver un proceso con sus etapas y máquinas de estado
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.detalleDeProceso` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:137`

### Qué es y para qué sirve (negocio)

Ver un proceso con sus etapas y máquinas de estado. Caso de uso UC-67-09: Detalle de un proceso.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:24`)

### Cómo se atiende (sistema)

`GET /admin/portal/flujos/{codigo}` la atiende `AdminPortalController.detalleDeProceso` (src/modules/data_catalog/controllers/admin-portal.controller.ts:137). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.detalleDeProceso`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:137` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:137` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `codigo` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `ProcesoDetalleDto` · DTO `ProcesoDetalleDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `codigo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:235` |
| `tipo` | `string` | Sí | valores: MODULO, CRITICO | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:236` |
| `nombre` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:237` |
| `modulo` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:238` |
| `bloque` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:239` |
| `agrupacion` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:240` |
| `actores` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:241` |
| `operaciones` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:242` |
| `etapas` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:243` |
| `maquinas` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:244` |
| `revision` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:245` |
| `paraQueSirve` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:288` |
| `paraQueSirveFuente` | `object` | No | admite null | — | archivo:línea de donde sale «para qué sirve» | `src/modules/data_catalog/dto/portal-response.dto.ts:293` |
| `flujoGeneral` | `object` | No | admite null | — | Diagrama declarado en el README del módulo, tal cual | `src/modules/data_catalog/dto/portal-response.dto.ts:298` |
| `detalleDeEtapas` | `array<EtapaDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:299` |
| `detalleDeEtapas[].codigo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:256` |
| `detalleDeEtapas[].nombre` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:257` |
| `detalleDeEtapas[].fuente` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:258` |
| `detalleDeEtapas[].agrupacion` | `string` | No | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:259` |
| `detalleDeEtapas[].operaciones` | `array<object>` | Sí | — | — | Operaciones de la etapa con quién actúa y qué efectos tiene | `src/modules/data_catalog/dto/portal-response.dto.ts:265` |
| `maquinasDeEstado` | `array<MaquinaDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:300` |
| `maquinasDeEstado[].codigo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:269` |
| `maquinasDeEstado[].fuente` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:270` |
| `maquinasDeEstado[].estados` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:271` |
| `maquinasDeEstado[].transiciones` | `array<object>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:276` |
| `maquinasDeEstado[].iniciales` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:277` |
| `maquinasDeEstado[].terminales` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:278` |
| `maquinasDeEstado[].operaciones` | `array<object>` | Sí | — | — | Operaciones que la ejercen (POR_REFERENCIA) | `src/modules/data_catalog/dto/portal-response.dto.ts:284` |
| `fuentes` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:301` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Proceso no encontrado en el inventario |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`.; ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`… |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-09`

---

## 21. GET /admin/portal/flujos/{codigo}/grafo

- **Origen:** CONTRATO
- **Nombre:** Ver el grafo de un proceso
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.grafo` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:150`

### Qué es y para qué sirve (negocio)

Ver el grafo de un proceso. Caso de uso UC-67-10: Grafo de un proceso.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:25`)

### Cómo se atiende (sistema)

`GET /admin/portal/flujos/{codigo}/grafo` la atiende `AdminPortalController.grafo` (src/modules/data_catalog/controllers/admin-portal.controller.ts:150). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.grafoDeProceso`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:150` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:150` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `codigo` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `GrafoDto` · DTO `GrafoDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `proceso` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:305` |
| `nombre` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:306` |
| `roles` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:307` |
| `nodos` | `array<object>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:312` |
| `aristas` | `array<object>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:317` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Proceso no encontrado en el inventario |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`.; ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`… |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-10`

---

## 22. GET /admin/portal/flujos/hallazgos

- **Origen:** CONTRATO
- **Nombre:** Resumen de hallazgos del mapa
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.hallazgos` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:111`

### Qué es y para qué sirve (negocio)

Resumen de hallazgos del mapa. Caso de uso UC-67-07: Listar hallazgos del inventario de flujos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:22`)

### Cómo se atiende (sistema)

`GET /admin/portal/flujos/hallazgos` la atiende `AdminPortalController.hallazgos` (src/modules/data_catalog/controllers/admin-portal.controller.ts:111). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.hallazgos`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:111` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:111` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `HallazgoResumenDto[]` · DTO `HallazgoResumenDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:350` |
| `severidad` | `string` | Sí | valores: ALTA, MEDIA, BAJA, INFO | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:351` |
| `titulo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:352` |
| `queHacer` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:353` |
| `cuenta` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:354` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-07`

---

## 23. GET /admin/portal/flujos/hallazgos/{id}

- **Origen:** CONTRATO
- **Nombre:** Ver los casos de un hallazgo
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.detalleDeHallazgo` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:118`

### Qué es y para qué sirve (negocio)

Ver los casos de un hallazgo. Caso de uso UC-67-08: Un hallazgo.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:23`)

### Cómo se atiende (sistema)

`GET /admin/portal/flujos/hallazgos/{id}` la atiende `AdminPortalController.detalleDeHallazgo` (src/modules/data_catalog/controllers/admin-portal.controller.ts:118). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.detalleDeHallazgo`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:118` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:118` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `HallazgoDetalleDto` · DTO `HallazgoDetalleDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:350` |
| `severidad` | `string` | Sí | valores: ALTA, MEDIA, BAJA, INFO | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:351` |
| `titulo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:352` |
| `queHacer` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:353` |
| `cuenta` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:354` |
| `items` | `array<object>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:362` |
| `nextCursor` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:363` |
| `limit` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:364` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Hallazgo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-08`

---

## 24. GET /admin/portal/flujos/mapa

- **Origen:** CONTRATO
- **Nombre:** Mapa de operaciones con sus señales
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.mapa` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:104`

### Qué es y para qué sirve (negocio)

Mapa de operaciones con sus señales. Caso de uso UC-67-06: Mapa de procesos y hallazgos del recorrido.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:21`)

### Cómo se atiende (sistema)

`GET /admin/portal/flujos/mapa` la atiende `AdminPortalController.mapa` (src/modules/data_catalog/controllers/admin-portal.controller.ts:104). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.mapa`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:104` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:104` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |
| `q` | query | No | `string` | Busca (sin tildes ni mayúsculas) en ruta, nombre y controlador |
| `modulo` | query | No | `string` | Carpeta del módulo, p. ej. `scheduling` |
| `riesgo` | query | No | `string` | — |
| `metodo` | query | No | `string` | — |
| `origen` | query | No | `string` | `CONTRATO_AUSENTE`: existe en el código y `openapi.json` no la publica |
| `senal` | query | No | `string` | Señal del mapa, p. ej. `ESCRIBE_SIN_ROLES` o `SIN_PRUEBAS` |
| `flujo` | query | No | `string` | Código del proceso al que pertenece, p. ej. `scheduling` o `critico:scheduling` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `MapaPaginaDto` · DTO `MapaPaginaDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MapaFilaDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:343` |
| `items[].id` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:321` |
| `items[].metodo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:322` |
| `items[].ruta` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:323` |
| `items[].flujos` | `array<object>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:324` |
| `items[].flujos[].codigo` | `string` | Sí | — | — | — | sin fuente |
| `items[].flujos[].nombre` | `string` | Sí | — | — | — | sin fuente |
| `items[].flujos[].etapa` | `string` | Sí | — | — | — | sin fuente |
| `items[].modulo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:329` |
| `items[].riesgo` | `string` | Sí | valores: ALTO, MEDIO, BAJO | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:330` |
| `items[].autorizacion` | `string` | Sí | — | — | Pública, los roles o «Sesión sin roles» | `src/modules/data_catalog/dto/portal-response.dto.ts:332` |
| `items[].llamadaPor` | `array<string>` | No | admite null | — | `null` si no se pudo cruzar con el frontend | `src/modules/data_catalog/dto/portal-response.dto.ts:338` |
| `items[].senales` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:339` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:344` |
| `limit` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:345` |
| `total` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:346` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-06`

---

## 25. GET /admin/portal/glosario

- **Origen:** CONTRATO
- **Nombre:** Buscar en el glosario
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.glosario` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:200`

### Qué es y para qué sirve (negocio)

Buscar en el glosario. Caso de uso UC-67-16: Glosario de dominio.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:31`)

### Cómo se atiende (sistema)

`GET /admin/portal/glosario` la atiende `AdminPortalController.glosario` (src/modules/data_catalog/controllers/admin-portal.controller.ts:200). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.glosario`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:200` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:200` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |
| `q` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `GlosarioPaginaDto` · DTO `GlosarioPaginaDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<GlosarioTerminoDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:502` |
| `items[].termino` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:495` |
| `items[].definicion` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:496` |
| `items[].fuente` | `string` | Sí | — | — | repo:archivo:línea | `src/modules/data_catalog/dto/portal-response.dto.ts:497` |
| `items[].tablasRelacionadas` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:498` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:503` |
| `limit` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:504` |
| `total` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:505` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-16`

---

## 26. GET /admin/portal/linaje

- **Origen:** CONTRATO
- **Nombre:** Métricas del linaje de datos
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.linaje` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:184`

### Qué es y para qué sirve (negocio)

Métricas del linaje de datos. Caso de uso UC-67-14: Grafo de linaje endpoint → tabla.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:29`)

### Cómo se atiende (sistema)

`GET /admin/portal/linaje` la atiende `AdminPortalController.linaje` (src/modules/data_catalog/controllers/admin-portal.controller.ts:184). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.linaje`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:184` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:184` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `LinajeDto` · DTO `LinajeDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `metricas` | `object` | Sí | — | — | Dominios, rutas, tablas, aristas, operación→tabla, tabla→tabla; las tablas con datos personales son `SIN_FUENTE` | `src/modules/data_catalog/dto/portal-response.dto.ts:473` |
| `dominios` | `array<LinajeDominioDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:474` |
| `dominios[].id` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:461` |
| `dominios[].etiqueta` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:462` |
| `dominios[].tablas` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:463` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-14`

---

## 27. GET /admin/portal/linaje/tablas/{schema}/{tabla}

- **Origen:** CONTRATO
- **Nombre:** Linaje de una tabla
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.linajeDeTabla` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:191`

### Qué es y para qué sirve (negocio)

Linaje de una tabla. Caso de uso UC-67-15: Linaje de una tabla.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:30`)

### Cómo se atiende (sistema)

`GET /admin/portal/linaje/tablas/{schema}/{tabla}` la atiende `AdminPortalController.linajeDeTabla` (src/modules/data_catalog/controllers/admin-portal.controller.ts:191). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.linajeDeTabla`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:191` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:191` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `schema` | path | Sí | `string` | — |
| `tabla` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `LinajeTablaDto` · DTO `LinajeTablaDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:478` |
| `operaciones` | `array<object>` | Sí | — | — | Operaciones que la leen o la escriben | `src/modules/data_catalog/dto/portal-response.dto.ts:484` |
| `referencia` | `array<string>` | Sí | — | — | Tablas a las que ésta referencia | `src/modules/data_catalog/dto/portal-response.dto.ts:489` |
| `referenciadaPor` | `array<string>` | Sí | — | — | Tablas que la referencian | `src/modules/data_catalog/dto/portal-response.dto.ts:491` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Tabla no encontrada en el linaje |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-15`

---

## 28. GET /admin/portal/operaciones

- **Origen:** CONTRATO
- **Nombre:** Listar las operaciones HTTP del sistema
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.listarOperaciones` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:71`

### Qué es y para qué sirve (negocio)

Listar las operaciones HTTP del sistema. Caso de uso UC-67-02: Listar operaciones del sistema, con filtros.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:17`)

### Cómo se atiende (sistema)

`GET /admin/portal/operaciones` la atiende `AdminPortalController.listarOperaciones` (src/modules/data_catalog/controllers/admin-portal.controller.ts:71). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.listarOperaciones`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:71` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:71` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |
| `q` | query | No | `string` | Busca (sin tildes ni mayúsculas) en ruta, nombre y controlador |
| `modulo` | query | No | `string` | Carpeta del módulo, p. ej. `scheduling` |
| `riesgo` | query | No | `string` | — |
| `metodo` | query | No | `string` | — |
| `origen` | query | No | `string` | `CONTRATO_AUSENTE`: existe en el código y `openapi.json` no la publica |
| `senal` | query | No | `string` | Señal del mapa, p. ej. `ESCRIBE_SIN_ROLES` o `SIN_PRUEBAS` |
| `flujo` | query | No | `string` | Código del proceso al que pertenece, p. ej. `scheduling` o `critico:scheduling` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `OperacionesPaginaDto` · DTO `OperacionesPaginaDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<OperacionResumenDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:57` |
| `items[].id` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:38` |
| `items[].metodo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:39` |
| `items[].ruta` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:40` |
| `items[].modulo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:41` |
| `items[].nombre` | `string` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:42` |
| `items[].origen` | `string` | Sí | valores: CONTRATO, CONTRATO_AUSENTE | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:43` |
| `items[].riesgo` | `string` | Sí | valores: ALTO, MEDIO, BAJO | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:44` |
| `items[].publica` | `boolean` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:45` |
| `items[].roles` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:46` |
| `items[].tablas` | `number` | Sí | — | — | Cantidad de tablas que toca | `src/modules/data_catalog/dto/portal-response.dto.ts:47` |
| `items[].flujos` | `array<FlujoRefDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:48` |
| `items[].flujos[].codigo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:21` |
| `items[].flujos[].nombre` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:22` |
| `items[].flujos[].etapa` | `string` | Sí | — | — | Etapa (caso de uso o controlador) dentro del proceso | `src/modules/data_catalog/dto/portal-response.dto.ts:26` |
| `items[].flujos[].agrupacion` | `string` | Sí | valores: CASO_DE_USO_README, AGRUPACION_POR_CONTROLADOR, CURADO_EN_DOCUMENTO | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:34` |
| `items[].senales` | `array<string>` | Sí | — | — | Señales del mapa (`SIN_PRUEBAS`, `ESCRIBE_SIN_ROLES`…) | `src/modules/data_catalog/dto/portal-response.dto.ts:53` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:58` |
| `limit` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:59` |
| `total` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:60` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`.; ServiceUnavailableException: El inventario del portal no está disponible: falta el directorio {relative}. |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-02`

---

## 29. GET /admin/portal/operaciones/{id}

- **Origen:** CONTRATO
- **Nombre:** Ver la ficha de una operación
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.detalleDeOperacion` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:78`

### Qué es y para qué sirve (negocio)

Ver la ficha de una operación. Caso de uso UC-67-03: Ficha de una operación: tablas, DTO, requisitos, flujo.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:18`)

### Cómo se atiende (sistema)

`GET /admin/portal/operaciones/{id}` la atiende `AdminPortalController.detalleDeOperacion` (src/modules/data_catalog/controllers/admin-portal.controller.ts:78). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.detalleDeOperacion`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:78` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:78` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `OperacionDetalleDto` · DTO `OperacionDetalleDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:38` |
| `metodo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:39` |
| `ruta` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:40` |
| `modulo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:41` |
| `nombre` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:42` |
| `origen` | `string` | Sí | valores: CONTRATO, CONTRATO_AUSENTE | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:43` |
| `riesgo` | `string` | Sí | valores: ALTO, MEDIO, BAJO | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:44` |
| `publica` | `boolean` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:45` |
| `roles` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:46` |
| `tablas` | `number` | Sí | — | — | Cantidad de tablas que toca | `src/modules/data_catalog/dto/portal-response.dto.ts:47` |
| `flujos` | `array<FlujoRefDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:48` |
| `flujos[].codigo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:21` |
| `flujos[].nombre` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:22` |
| `flujos[].etapa` | `string` | Sí | — | — | Etapa (caso de uso o controlador) dentro del proceso | `src/modules/data_catalog/dto/portal-response.dto.ts:26` |
| `flujos[].agrupacion` | `string` | Sí | valores: CASO_DE_USO_README, AGRUPACION_POR_CONTROLADOR, CURADO_EN_DOCUMENTO | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:34` |
| `senales` | `array<string>` | Sí | — | — | Señales del mapa (`SIN_PRUEBAS`, `ESCRIBE_SIN_ROLES`…) | `src/modules/data_catalog/dto/portal-response.dto.ts:53` |
| `bloque` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:164` |
| `codigo` | `object` | No | admite null | — | archivo:línea del handler | `src/modules/data_catalog/dto/portal-response.dto.ts:169` |
| `negocio` | `ExplicacionNegocioDto` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:170` |
| `negocio.texto` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:130` |
| `negocio.estado` | `string` | Sí | — | — | `AUTO_DETECTADA` hasta que una persona la revise | `src/modules/data_catalog/dto/portal-response.dto.ts:134` |
| `negocio.fuentes` | `array<string>` | Sí | — | — | Fuentes con las que se compuso el texto | `src/modules/data_catalog/dto/portal-response.dto.ts:136` |
| `sistema` | `string` | Sí | — | — | Cómo la atiende el sistema (controlador, servicio, tablas) | `src/modules/data_catalog/dto/portal-response.dto.ts:174` |
| `razonesDeRiesgo` | `array<string>` | Sí | — | — | Por qué tiene ese nivel de riesgo | `src/modules/data_catalog/dto/portal-response.dto.ts:179` |
| `requerimientos` | `array<RequerimientoDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:181` |
| `requerimientos[].tipo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:90` |
| `requerimientos[].detalle` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:91` |
| `requerimientos[].fuente` | `string` | Sí | — | — | archivo:línea de donde se leyó | `src/modules/data_catalog/dto/portal-response.dto.ts:93` |
| `parametros` | `array<ParametroDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:182` |
| `parametros[].nombre` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:64` |
| `parametros[].en` | `string` | Sí | — | — | path, query, header o cookie | `src/modules/data_catalog/dto/portal-response.dto.ts:65` |
| `parametros[].obligatorio` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:66` |
| `parametros[].tipo` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:67` |
| `parametros[].descripcion` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:68` |
| `cuerpo` | `CuerpoDto` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:184` |
| `cuerpo.dto` | `object` | No | admite null | — | — | sin fuente |
| `cuerpo.contentType` | `object` | No | admite null | — | — | sin fuente |
| `cuerpo.obligatorio` | `object` | No | admite null | — | — | sin fuente |
| `cuerpo.campos` | `array<CampoDto>` | No | — | — | — | sin fuente |
| `cuerpo.campos[].campo` | `string` | No | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:72` |
| `cuerpo.campos[].tipo` | `string` | No | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:73` |
| `cuerpo.campos[].obligatorio` | `boolean` | No | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:74` |
| `cuerpo.campos[].restricciones` | `array<string>` | No | — | — | Restricciones leídas del DTO (formato, longitud, rango…) | `src/modules/data_catalog/dto/portal-response.dto.ts:79` |
| `cuerpo.campos[].descripcion` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:80` |
| `cuerpo.campos[].ejemplo` | `object` | No | — | — | Ejemplo sintético | `src/modules/data_catalog/dto/portal-response.dto.ts:81` |
| `cuerpo.campos[].fuente` | `object` | No | admite null | — | archivo:línea del campo | `src/modules/data_catalog/dto/portal-response.dto.ts:86` |
| `cuerpo.payloadMinimo` | `object` | No | — | — | Sólo los campos obligatorios, con valores de ejemplo sintéticos | sin fuente |
| `respuesta` | `RespuestaContratoDto` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:185` |
| `respuesta.tipoRetorno` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:152` |
| `respuesta.dto` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:153` |
| `respuesta.httpCode` | `object` | No | admite null | — | Código de éxito declarado con @HttpCode | `src/modules/data_catalog/dto/portal-response.dto.ts:158` |
| `respuesta.campos` | `array<CampoDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:159` |
| `respuesta.campos[].campo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:72` |
| `respuesta.campos[].tipo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:73` |
| `respuesta.campos[].obligatorio` | `boolean` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:74` |
| `respuesta.campos[].restricciones` | `array<string>` | Sí | — | — | Restricciones leídas del DTO (formato, longitud, rango…) | `src/modules/data_catalog/dto/portal-response.dto.ts:79` |
| `respuesta.campos[].descripcion` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:80` |
| `respuesta.campos[].ejemplo` | `object` | No | — | — | Ejemplo sintético | `src/modules/data_catalog/dto/portal-response.dto.ts:81` |
| `respuesta.campos[].fuente` | `object` | No | admite null | — | archivo:línea del campo | `src/modules/data_catalog/dto/portal-response.dto.ts:86` |
| `respuestasPosibles` | `array<RespuestaPosibleDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:187` |
| `respuestasPosibles[].estado` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:118` |
| `respuestasPosibles[].codigo` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:119` |
| `respuestasPosibles[].causas` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:120` |
| `datos` | `array<TablaOperacionDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:188` |
| `datos[].schema` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:97` |
| `datos[].tabla` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:98` |
| `datos[].operacion` | `string` | Sí | valores: LEE, ESCRIBE, BORRA | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:99` |
| `datos[].detalle` | `string` | Sí | — | — | CREA, ACTUALIZA, GUARDA, BORRA o LEE | `src/modules/data_catalog/dto/portal-response.dto.ts:101` |
| `datos[].confianza` | `string` | Sí | valores: DIRECTA, POR_TIPO, POR_REGISTRO, POR_SQL | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:103` |
| `datos[].via` | `array<string>` | Sí | — | — | Camino handler → servicio → repositorio | `src/modules/data_catalog/dto/portal-response.dto.ts:108` |
| `datos[].fuente` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:109` |
| `datos[].catalogada` | `boolean` | Sí | — | — | `false` si es una vista u objeto que no es una tabla del catálogo | `src/modules/data_catalog/dto/portal-response.dto.ts:114` |
| `eventos` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:189` |
| `trabajos` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:190` |
| `noResuelto` | `array<string>` | Sí | — | — | Llamadas cuyo destino depende de un dato en ejecución: no se siguieron | `src/modules/data_catalog/dto/portal-response.dto.ts:196` |
| `sinTablas` | `object` | No | admite null | — | Por qué no toca tablas, si está curado a mano | `src/modules/data_catalog/dto/portal-response.dto.ts:201` |
| `pruebas` | `array<PruebaDto>` | Sí | — | — | Pruebas que mencionan la operación (búsqueda textual, no cobertura) | `src/modules/data_catalog/dto/portal-response.dto.ts:207` |
| `pruebas[].tipo` | `string` | Sí | valores: CONTROLADOR, INTEGRACION | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:124` |
| `pruebas[].archivo` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:125` |
| `pruebas[].linea` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:126` |
| `revision` | `string` | Sí | — | — | `AUTO_DETECTADA` hasta que una persona la revise | `src/modules/data_catalog/dto/portal-response.dto.ts:211` |
| `datosPersonales` | `string` | Sí | — | — | Siempre `SIN_FUENTE` mientras no exista una clasificación de datos personales | `src/modules/data_catalog/dto/portal-response.dto.ts:216` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Operación no encontrada en el inventario |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta el directorio {relative}.; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-03`

---

## 30. GET /admin/portal/operaciones/{id}/arbol

- **Origen:** CONTRATO
- **Nombre:** Ver el árbol de decisión de una operación
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.arbol` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:92`

### Qué es y para qué sirve (negocio)

Ver el árbol de decisión de una operación. Caso de uso UC-67-04: Árbol de decisión de una operación.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:19`)

### Cómo se atiende (sistema)

`GET /admin/portal/operaciones/{id}/arbol` la atiende `AdminPortalController.arbol` (src/modules/data_catalog/controllers/admin-portal.controller.ts:92). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.arbolDeOperacion`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:92` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:92` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `ArbolDto` · DTO `ArbolDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:220` |
| `nodos` | `array<object>` | Sí | — | — | Nodos del árbol: ACCESO, SI, SEGUN, BUCLE, INTENTAR, TRANSACCION, LLAMADA, ERROR, EFECTO, EVENTO, TRABAJO, RESPUESTA | `src/modules/data_catalog/dto/portal-response.dto.ts:227` |
| `respuestas` | `array<RespuestaPosibleDto>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:229` |
| `respuestas[].estado` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:118` |
| `respuestas[].codigo` | `object` | No | admite null | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:119` |
| `respuestas[].causas` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:120` |
| `truncado` | `boolean` | Sí | — | — | `true` si el árbol se cortó por tope de nodos | `src/modules/data_catalog/dto/portal-response.dto.ts:231` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Operación no encontrada en el inventario; NotFoundException: La operación no tiene árbol de decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta el directorio {relative}.; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-04`

---

## 31. GET /admin/portal/version

- **Origen:** CONTRATO
- **Nombre:** Versión y tamaño del inventario publicado
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.version` — `src/modules/data_catalog/controllers/admin-portal.controller.ts:64`

### Qué es y para qué sirve (negocio)

Versión y tamaño del inventario publicado. Caso de uso UC-67-01: Versión y huella del inventario servido.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:16`)

### Cómo se atiende (sistema)

`GET /admin/portal/version` la atiende `AdminPortalController.version` (src/modules/data_catalog/controllers/admin-portal.controller.ts:64). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO. Delega en `PortalInventoryService.version`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO | `src/modules/data_catalog/controllers/admin-portal.controller.ts:64` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/controllers/admin-portal.controller.ts:64` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/inventory/inventory.repository.ts:44`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `PortalVersionDto` · DTO `PortalVersionDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `hash` | `string` | Sí | — | — | Huella del inventario: cambia cuando cambia su contenido | `src/modules/data_catalog/dto/portal-response.dto.ts:8` |
| `operaciones` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:9` |
| `procesos` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:10` |
| `tablas` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:11` |
| `columnas` | `number` | Sí | — | — | — | `src/modules/data_catalog/dto/portal-response.dto.ts:12` |
| `origen` | `string` | Sí | — | — | Directorio del que se leyó el inventario, relativo al proceso | `src/modules/data_catalog/dto/portal-response.dto.ts:17` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-01`

---

