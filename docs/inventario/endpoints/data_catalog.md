<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `data_catalog`

- **Bloque:** —
- **Operaciones:** 50 (50 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 3 · MEDIO 8 · BAJO 39
- **Tablas distintas que tocan:** 20
- **Respuestas de error y detalle contractual:** `openapi/endpoints/data-catalog.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/admin/catalog/annotations/{id}/review` | Aprueba o rechaza la revisión vigente de una ficha | MEDIO | 5 | GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD |
| 2 | POST | `/admin/catalog/classification/run` | Corre la clasificación automática de sensibilidad sobre las columnas observadas | MEDIO | 7 | GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD |
| 3 | PUT | `/admin/catalog/columns/{id}/annotation` | Crea o edita la ficha de una columna (con versión esperada); guardar a mano saca la ficha de AUTO_DETECTED | MEDIO | 5 | GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD |
| 4 | GET | `/admin/catalog/columns/{id}/evidence` | Evidencia enlazada a una columna | BAJO | 2 | ...PORTAL_VIEW_ROLES |
| 5 | POST | `/admin/catalog/columns/{id}/evidence` | Enlaza evidencia a una columna | MEDIO | 2 | GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD |
| 6 | GET | `/admin/catalog/coverage` | Cobertura del catálogo por dimensión, calculada por el servidor | BAJO | 3 | ...PORTAL_VIEW_ROLES |
| 7 | GET | `/admin/catalog/fit` | Último resultado de la sonda de ajuste de la catalogación | BAJO | 1 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD |
| 8 | POST | `/admin/catalog/fit/run` | Pide una corrida de la sonda de ajuste (se ejecuta fuera de la petición) | ALTO | 7 | GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD |
| 9 | GET | `/admin/catalog/objects` | Objetos del catálogo, paginados por cursor | BAJO | 3 | ...PORTAL_VIEW_ROLES |
| 10 | GET | `/admin/catalog/objects/{id}` | Ficha técnica, observación, ficha curada, cobertura y gobierno de un objeto | BAJO | 5 | ...PORTAL_VIEW_ROLES |
| 11 | PUT | `/admin/catalog/objects/{id}/annotation` | Crea o edita la ficha de un objeto (con versión esperada) | MEDIO | 6 | GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD |
| 12 | GET | `/admin/catalog/objects/{id}/changes` | Cambios que los escaneos detectaron en un objeto | BAJO | 4 | ...PORTAL_VIEW_ROLES |
| 13 | GET | `/admin/catalog/objects/{id}/columns` | Columnas observadas de un objeto, con su ficha si la tienen | BAJO | 4 | ...PORTAL_VIEW_ROLES |
| 14 | GET | `/admin/catalog/objects/{id}/evidence` | Evidencia enlazada a un objeto | BAJO | 3 | ...PORTAL_VIEW_ROLES |
| 15 | POST | `/admin/catalog/objects/{id}/evidence` | Enlaza evidencia a un objeto | MEDIO | 3 | GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD |
| 16 | GET | `/admin/catalog/objects/{id}/history` | Revisiones y decisiones de la ficha de un objeto | BAJO | 5 | ...PORTAL_VIEW_ROLES |
| 17 | GET | `/admin/catalog/objects/{id}/impact` | Quién referencia a un objeto y a quién referencia, por claves foráneas observadas | BAJO | 4 | ...PORTAL_VIEW_ROLES |
| 18 | GET | `/admin/catalog/permission-drift` | Deriva de permisos: roles que las rutas exigen contra los que la API siembra | BAJO | 1 | ...PORTAL_VIEW_ROLES |
| 19 | GET | `/admin/catalog/pii/columns` | Columnas clasificadas como datos personales, con su sensibilidad y estado de revisión | BAJO | 5 | ...PORTAL_VIEW_ROLES |
| 20 | GET | `/admin/catalog/pii/reconciliation` | Conciliación de las columnas personales del catálogo con el registro declarado de gobierno | BAJO | 5 | ...PORTAL_VIEW_ROLES |
| 21 | GET | `/admin/catalog/pii/summary` | Datos personales: cuántas columnas son personales según el catálogo y qué declaró el registro de gobierno | BAJO | 5 | ...PORTAL_VIEW_ROLES |
| 22 | GET | `/admin/catalog/quality/issues` | Incidencias de calidad del catálogo (derivadas al leer), paginadas | BAJO | 3 | ...PORTAL_VIEW_ROLES |
| 23 | GET | `/admin/catalog/quality/rules` | Reglas de calidad del catálogo, con las incidencias abiertas de cada una | BAJO | 3 | ...PORTAL_VIEW_ROLES |
| 24 | GET | `/admin/catalog/scans` | Escaneos, del más reciente al más antiguo | BAJO | 1 | ...PORTAL_VIEW_ROLES |
| 25 | POST | `/admin/catalog/scans` | Pide un escaneo de la base primaria (se ejecuta fuera de la petición) | MEDIO | 15 | GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD |
| 26 | GET | `/admin/catalog/scans/{id}` | Un escaneo | BAJO | 1 | ...PORTAL_VIEW_ROLES |
| 27 | GET | `/admin/catalog/schemas` | Schemas observados, con cuántos objetos tienen ficha y cuántos están aprobados | BAJO | 2 | ...PORTAL_VIEW_ROLES |
| 28 | GET | `/admin/governance/jobs` | Trabajos de gobierno: escaneos del catálogo, clasificaciones y ejecuciones de retención | BAJO | 4 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD |
| 29 | GET | `/admin/governance/review-queue` | Cola de revisión: fichas de objeto y de columna en NEEDS_REVIEW, la más antigua primero | BAJO | 4 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD |
| 30 | GET | `/admin/portal/catalogo/deriva` | Deriva entre el DDL del modelo y las entidades del ORM | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 31 | GET | `/admin/portal/catalogo/tablas` | Listar las tablas del catálogo de datos | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 32 | GET | `/admin/portal/catalogo/tablas/{schema}/{tabla}` | Ver la ficha de una tabla | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 33 | GET | `/admin/portal/flujos` | Listar los procesos de negocio | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 34 | GET | `/admin/portal/flujos/{codigo}` | Ver un proceso con sus etapas y máquinas de estado | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 35 | GET | `/admin/portal/flujos/{codigo}/grafo` | Ver el grafo de un proceso | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 36 | GET | `/admin/portal/flujos/hallazgos` | Resumen de hallazgos del mapa | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 37 | GET | `/admin/portal/flujos/hallazgos/{id}` | Ver los casos de un hallazgo | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 38 | GET | `/admin/portal/flujos/mapa` | Mapa de operaciones con sus señales | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 39 | GET | `/admin/portal/glosario` | Buscar en el glosario | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 40 | GET | `/admin/portal/linaje` | Métricas del linaje de datos | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 41 | GET | `/admin/portal/linaje/aristas` | Aristas del linaje (lee, escribe, borra, referencia, pertenece) | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 42 | GET | `/admin/portal/linaje/nodos` | Nodos del linaje (operaciones, tablas, dominios) | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 43 | GET | `/admin/portal/linaje/tablas/{schema}/{tabla}` | Linaje de una tabla | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 44 | GET | `/admin/portal/operaciones` | Listar las operaciones HTTP del sistema | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 45 | GET | `/admin/portal/operaciones/{id}` | Ver la ficha de una operación | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 46 | GET | `/admin/portal/operaciones/{id}/arbol` | Ver el árbol de decisión de una operación | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 47 | GET | `/admin/portal/version` | Versión y tamaño del inventario publicado | BAJO | 0 | ...PORTAL_VIEW_ROLES |
| 48 | POST | `/internal/catalog/fit/run` | Corre la sonda de ajuste y espera su desenlace (worker) | ALTO | 7 | SYSTEM |
| 49 | POST | `/internal/catalog/inventory/import` | Importa el inventario de la API a las tablas de operaciones y procesos (worker) | ALTO | 15 | SYSTEM |
| 50 | POST | `/internal/catalog/scans/run-next` | Sonda: reclama y ejecuta el siguiente escaneo (worker) | MEDIO | 15 | SYSTEM |

---

## 1. POST /admin/catalog/annotations/{id}/review

- **Origen:** CONTRATO
- **Nombre:** Aprueba o rechaza la revisión vigente de una ficha
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.review` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:320`

### Qué es y para qué sirve (negocio)

Aprueba o rechaza la revisión vigente de una ficha. Caso de uso UC-67-27: Aprobar o rechazar la revisión vigente.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:85`)

### Cómo se atiende (sistema)

`POST /admin/catalog/annotations/{id}/review` la atiende `AdminCatalogController.review` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:320). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. Valida el cuerpo como `ReviewInputDto` (3 campos, 2 obligatorios). Delega en `CatalogGovernanceService.review`. Crea filas en data_catalog.catalog_review_decisions. Actualiza data_catalog.catalog_annotations. Lee data_catalog.catalog_annotation_revisions, data_catalog.catalog_annotations, data_catalog.catalog_evidence_items.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:320` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:320` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotation_revisions` | LEE | LEE | POR_SQL | AdminCatalogController.review → CatalogGovernanceService.review → CatalogRepository.revisionAuthor | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:575` |
| `data_catalog.catalog_annotations` | ESCRIBE | ACTUALIZA | POR_SQL | AdminCatalogController.review → CatalogGovernanceService.review → CatalogRepository.decide | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:870` |
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.review → CatalogGovernanceService.review → CatalogRepository.annotationById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:368` |
| `data_catalog.catalog_evidence_items` | LEE | LEE | POR_SQL | AdminCatalogController.review → CatalogGovernanceService.review → CatalogRepository.columnEvidenceCount | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:509` |
| `data_catalog.catalog_review_decisions` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.review → CatalogGovernanceService.review → CatalogRepository.decide | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:891` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReviewInputDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: APPROVED, REJECTED | `@IsIn(['APPROVED', 'REJECTED'])` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:313` |
| `expectedRevisionNo` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | Revisión que se revisó (`currentRevisionNo`); si hay una más reciente, 409 | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:322` |
| `comment` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Obligatorio, de al menos 10 caracteres, al rechazar | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:331` |

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

## 2. POST /admin/catalog/classification/run

- **Origen:** CONTRATO
- **Nombre:** Corre la clasificación automática de sensibilidad sobre las columnas observadas
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.runClassification` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:352`

### Qué es y para qué sirve (negocio)

Corre la clasificación automática de sensibilidad sobre las columnas observadas.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/catalog/classification/run` la atiende `AdminCatalogController.runClassification` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:352). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. Valida el cuerpo como `ClassificationRunDto` (1 campo, 0 obligatorios). Delega en `CatalogClassificationService.run`. Crea filas en data_catalog.catalog_annotation_revisions, data_catalog.catalog_annotations. Actualiza data_catalog.catalog_annotations. Lee data_catalog.catalog_annotations, data_catalog.catalog_change_events, data_catalog.catalog_columns, data_catalog.catalog_objects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:352` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:352` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotation_revisions` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.runClassification → CatalogClassificationService.run → CatalogClassificationService.runScope → CatalogClassificationService.classifyOne → CatalogClassificationService.create → CatalogRepository.insertRevision | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:830` |
| `data_catalog.catalog_annotations` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.runClassification → CatalogClassificationService.run → CatalogClassificationService.runScope → CatalogClassificationService.classifyOne → CatalogClassificationService.create → CatalogRepository.insertAnnotation | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:715` |
| `data_catalog.catalog_annotations` | ESCRIBE | ACTUALIZA | POR_SQL | AdminCatalogController.runClassification → CatalogClassificationService.run → CatalogClassificationService.runScope → CatalogClassificationService.classifyOne → CatalogClassificationService.raise → CatalogRepository.updateAnnotation | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:775` |
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.runClassification → CatalogClassificationService.run → CatalogClassificationService.runScope → CatalogRepository.annotationsOfColumns | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:395` |
| `data_catalog.catalog_change_events` | LEE | LEE | POR_SQL | AdminCatalogController.runClassification → CatalogClassificationService.run → CatalogClassificationService.runScope → CatalogRepository.columnsToClassify | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:417` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.runClassification → CatalogClassificationService.run → CatalogClassificationService.runScope → CatalogRepository.columnsToClassify | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:433` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.runClassification → CatalogClassificationService.run → CatalogClassificationService.runScope → CatalogRepository.columnsToClassify | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:433` |

### Cuerpo — DTO `ClassificationRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `schema` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Limita la corrida a un schema | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:340` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "schema": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ClassificationRunResultDto>` · DTO `ClassificationRunResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `examined` | `number` | Sí | — | — | Columnas observadas que se miraron | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:553` |
| `unclassified` | `number` | Sí | — | — | Columnas que ninguna regla reconoció: quedan sin clasificar | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:557` |
| `created` | `number` | Sí | — | — | Fichas nuevas | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:558` |
| `raised` | `number` | Sí | — | — | Fichas de la máquina subidas a un nivel más alto | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:562` |
| `sentToReview` | `number` | Sí | — | — | De las creadas o subidas, las que quedaron en NEEDS_REVIEW por duda | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:567` |
| `skippedManual` | `number` | Sí | — | — | No tocadas: las escribió una persona | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:569` |
| `skippedReviewed` | `number` | Sí | — | — | No tocadas: ya salieron de AUTO_DETECTED | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:571` |
| `skippedNotHigher` | `number` | Sí | — | — | No tocadas: la propuesta no era más alta (nunca baja) | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:575` |
| `conflicts` | `number` | Sí | — | — | No escritas: otra petición cambió la ficha antes | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:579` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:AdminCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. PUT /admin/catalog/columns/{id}/annotation

- **Origen:** CONTRATO
- **Nombre:** Crea o edita la ficha de una columna (con versión esperada); guardar a mano saca la ficha de AUTO_DETECTED
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.saveColumnAnnotation` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:290`

### Qué es y para qué sirve (negocio)

Crea o edita la ficha de una columna (con versión esperada); guardar a mano saca la ficha de AUTO_DETECTED.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PUT /admin/catalog/columns/{id}/annotation` la atiende `AdminCatalogController.saveColumnAnnotation` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:290). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. Valida el cuerpo como `AnnotationPatchDto` (23 campos, 1 obligatorio). Delega en `CatalogGovernanceService.saveColumnAnnotation`. Crea filas en data_catalog.catalog_annotation_revisions, data_catalog.catalog_annotations. Actualiza data_catalog.catalog_annotations. Lee data_catalog.catalog_annotations, data_catalog.catalog_columns.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:290` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotation_revisions` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.saveColumnAnnotation → CatalogGovernanceService.saveColumnAnnotation → CatalogGovernanceService.save → CatalogRepository.insertRevision | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:830` |
| `data_catalog.catalog_annotations` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.saveColumnAnnotation → CatalogGovernanceService.saveColumnAnnotation → CatalogGovernanceService.save → CatalogRepository.insertAnnotation | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:715` |
| `data_catalog.catalog_annotations` | ESCRIBE | ACTUALIZA | POR_SQL | AdminCatalogController.saveColumnAnnotation → CatalogGovernanceService.saveColumnAnnotation → CatalogGovernanceService.save → CatalogRepository.updateAnnotation | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:775` |
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.saveColumnAnnotation → CatalogGovernanceService.saveColumnAnnotation → CatalogGovernanceService.save → CatalogRepository.annotationById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:368` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.saveColumnAnnotation → CatalogGovernanceService.saveColumnAnnotation → CatalogRepository.columnById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:443` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AnnotationPatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expectedVersion` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | Versión de la ficha que se leyó (`version`); 0 para crearla. Si cambió, 409 | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:174` |
| `submit` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Enviarla a revisión: exige propósito, razón de existir y grano de fila (o declararlos como preguntas abiertas) | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:182` |
| `changeReason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:188` |
| `businessName` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:194` |
| `definition` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:199` |
| `purpose` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:204` |
| `existenceRationale` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:209` |
| `rowGrain` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:214` |
| `alternativesRationale` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:219` |
| `deletionImpact` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:224` |
| `businessOwner` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:229` |
| `dataSteward` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:234` |
| `technicalOwner` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:239` |
| `unit` | `object` | No | longitud máxima 100; admite null | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:244` |
| `valueDomain` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:249` |
| `nullSemantics` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:254` |
| `sensitivity` | `string` | No | valores: UNKNOWN, ANONYMIZED, PUBLIC, INTERNAL, PSEUDONYMIZED, PERSONAL, PHI_IDENTIFIER, PHI_SENSITIVE, PHI_SPECIAL, CREDENTIAL | `@IsOptional()` `@IsIn(SENSITIVITIES)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:259` |
| `consumers` | `array<string>` | No | longitud máxima 200; máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@IsString({ each: true })` `@MaxLength(200, { each: true })` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:267` |
| `openQuestions` | `array<OpenQuestionDto>` | No | máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => OpenQuestionDto)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:275` |
| `openQuestions[].field` | `string` | No | longitud máxima 60 | `@IsOptional()` `@IsString()` `@MaxLength(60)` | Campo de la ficha sobre el que es la pregunta | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:140` |
| `openQuestions[].question` | `string` | No | longitud mínima 3; longitud máxima 500 | `@IsString()` `@MinLength(3)` `@MaxLength(500)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:146` |
| `openQuestions[].owner` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:152` |
| `openQuestions[].dueDate` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Fecha ISO 8601 | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:157` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Columna del catálogo no encontrada |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: La ficha cambió desde que se leyó |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {422} |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:AdminCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /admin/catalog/columns/{id}/evidence

- **Origen:** CONTRATO
- **Nombre:** Evidencia enlazada a una columna
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.columnEvidence` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:199`

### Qué es y para qué sirve (negocio)

Evidencia enlazada a una columna.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/columns/{id}/evidence` la atiende `AdminCatalogController.columnEvidence` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:199). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogReadService.columnEvidence`. Lee data_catalog.catalog_columns, data_catalog.catalog_evidence_items.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:199` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:199` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.columnEvidence → CatalogReadService.columnEvidence → CatalogRepository.columnById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:443` |
| `data_catalog.catalog_evidence_items` | LEE | LEE | POR_SQL | AdminCatalogController.columnEvidence → CatalogReadService.columnEvidence → CatalogRepository.columnEvidence | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:488` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Columna del catálogo no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:AdminCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /admin/catalog/columns/{id}/evidence

- **Origen:** CONTRATO
- **Nombre:** Enlaza evidencia a una columna
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.addColumnEvidence` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:210`

### Qué es y para qué sirve (negocio)

Enlaza evidencia a una columna.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/catalog/columns/{id}/evidence` la atiende `AdminCatalogController.addColumnEvidence` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:210). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. Valida el cuerpo como `DataCatalogEvidenceInputDto` (4 campos, 2 obligatorios). Delega en `CatalogGovernanceService.addColumnEvidence`. Crea filas en data_catalog.catalog_evidence_items. Lee data_catalog.catalog_columns.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:210` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:210` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.addColumnEvidence → CatalogGovernanceService.addColumnEvidence → CatalogRepository.columnById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:443` |
| `data_catalog.catalog_evidence_items` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.addColumnEvidence → CatalogGovernanceService.addColumnEvidence → CatalogGovernanceService.guardarEvidencia → CatalogRepository.addEvidence | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:531` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Columna del catálogo no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:AdminCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /admin/catalog/coverage

- **Origen:** CONTRATO
- **Nombre:** Cobertura del catálogo por dimensión, calculada por el servidor
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.coverage` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:385`

### Qué es y para qué sirve (negocio)

Cobertura del catálogo por dimensión, calculada por el servidor. Caso de uso UC-67-28: Cobertura del catálogo por dimensión.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:86`)

### Cómo se atiende (sistema)

`GET /admin/catalog/coverage` la atiende `AdminCatalogController.coverage` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:385). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogReadService.coverage`. Lee data_catalog.catalog_annotations, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:385` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:385` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.coverage → CatalogReadService.coverage → CatalogRepository.coverageRows → CatalogRepository.annotationsOf | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:348` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.coverage → CatalogReadService.coverage → CatalogRepository.coverageRows | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:648` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.coverage → CatalogReadService.coverage → CatalogRepository.scans | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:922` |

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

## 7. GET /admin/catalog/fit

- **Origen:** CONTRATO
- **Nombre:** Último resultado de la sonda de ajuste de la catalogación
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogFitController.latest` — `src/modules/data_catalog/presentation/controllers/catalog-fit.controller.ts:48`

### Qué es y para qué sirve (negocio)

Último resultado de la sonda de ajuste de la catalogación.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/fit` la atiende `AdminCatalogFitController.latest` (src/modules/data_catalog/presentation/controllers/catalog-fit.controller.ts:48). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. Delega en `CatalogFitService.latest`. Lee data_catalog.catalog_fit_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD | `src/modules/data_catalog/presentation/controllers/catalog-fit.controller.ts:48` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/catalog-fit.controller.ts:48` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_fit_runs (vista u objeto no catalogado)` | LEE | LEE | POR_SQL | AdminCatalogFitController.latest → CatalogFitService.latest → FitRunsRepository.latestCompleted | `src/modules/data_catalog/application/fit/fit-runs.repository.ts:113` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CatalogFitDto>` · DTO `CatalogFitDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `modelVersion` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:194` |
| `state` | `string` | Sí | valores: SIN_RESULTADO, VIGENTE, ATRASADO | — | `ATRASADO`: se sirve, pero es más viejo que el umbral (S7) | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:199` |
| `noResultReason` | `string` | Sí | valores: NUNCA_EJECUTADA, EXPIRADO; admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:205` |
| `ageSeconds` | `number` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:206` |
| `running` | `FitRunViewDto` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:208` |
| `running.runId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `running.status` | `string` | Sí | valores: EN_CURSO, COMPLETADA, FALLIDA | — | — | sin fuente |
| `running.trigger` | `string` | Sí | valores: TICK, MANUAL | — | — | sin fuente |
| `running.requestedAt` | `string` | Sí | formato date-time | — | — | sin fuente |
| `running.finishedAt` | `string` | Sí | formato date-time; admite null | — | — | sin fuente |
| `running.durationMs` | `number` | Sí | admite null | — | — | sin fuente |
| `running.errorCode` | `string` | Sí | admite null | — | Clase del error si la corrida falló | sin fuente |
| `lastRun` | `FitRunViewDto` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:210` |
| `lastRun.runId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `lastRun.status` | `string` | Sí | valores: EN_CURSO, COMPLETADA, FALLIDA | — | — | sin fuente |
| `lastRun.trigger` | `string` | Sí | valores: TICK, MANUAL | — | — | sin fuente |
| `lastRun.requestedAt` | `string` | Sí | formato date-time | — | — | sin fuente |
| `lastRun.finishedAt` | `string` | Sí | formato date-time; admite null | — | — | sin fuente |
| `lastRun.durationMs` | `number` | Sí | admite null | — | — | sin fuente |
| `lastRun.errorCode` | `string` | Sí | admite null | — | Clase del error si la corrida falló | sin fuente |
| `lastFailure` | `FitRunViewDto` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:212` |
| `lastFailure.runId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `lastFailure.status` | `string` | Sí | valores: EN_CURSO, COMPLETADA, FALLIDA | — | — | sin fuente |
| `lastFailure.trigger` | `string` | Sí | valores: TICK, MANUAL | — | — | sin fuente |
| `lastFailure.requestedAt` | `string` | Sí | formato date-time | — | — | sin fuente |
| `lastFailure.finishedAt` | `string` | Sí | formato date-time; admite null | — | — | sin fuente |
| `lastFailure.durationMs` | `number` | Sí | admite null | — | — | sin fuente |
| `lastFailure.errorCode` | `string` | Sí | admite null | — | Clase del error si la corrida falló | sin fuente |
| `report` | `FitReportDto` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:214` |
| `report.modelVersion` | `string` | Sí | — | — | — | sin fuente |
| `report.evaluatedAt` | `string` | Sí | formato date-time | — | — | sin fuente |
| `report.verdict` | `string` | Sí | valores: AJUSTADA, CON_AVISOS, DESAJUSTADA, SIN_DATOS | — | — | sin fuente |
| `report.dimensions` | `array<FitDimensionScoreDto>` | Sí | — | — | — | sin fuente |
| `report.dimensions[].dimension` | `string` | Sí | valores: ROUTES, MODEL, COMPLETENESS, FRESHNESS, MUTABILITY, SENSITIVITY | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:57` |
| `report.dimensions[].status` | `string` | Sí | valores: MEDIDA, SIN_DATO, NO_DECLARADO, NO_APLICA | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:59` |
| `report.dimensions[].covered` | `number` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:60` |
| `report.dimensions[].denominator` | `number` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:61` |
| `report.dimensions[].ratio` | `number` | Sí | admite null | — | `covered / denominator`; `null` sin base. Nunca un 0 % ni un 100 % inventado | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:68` |
| `report.dimensions[].checksMeasured` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:69` |
| `report.dimensions[].checksUnmeasured` | `number` | Sí | — | — | Comprobaciones sin dato o sin dónde declararse | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:73` |
| `report.dimensions[].checksFailed` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:74` |
| `report.checks` | `array<FitCheckResultDto>` | Sí | — | — | — | sin fuente |
| `report.checks[].id` | `string` | Sí | — | — | Id estable: no se reutiliza ni se renombra | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:25` |
| `report.checks[].dimension` | `string` | Sí | valores: ROUTES, MODEL, COMPLETENESS, FRESHNESS, MUTABILITY, SENSITIVITY | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:26` |
| `report.checks[].title` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:27` |
| `report.checks[].severity` | `string` | Sí | valores: ALTA, MEDIA, BAJA, INFO | — | Severidad si FALLA | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:29` |
| `report.checks[].status` | `string` | Sí | valores: OK, FALLA, SIN_DATO, NO_DECLARADO, NO_APLICA | — | `SIN_DATO` y `NO_DECLARADO` no son `OK`: no se pudo comprobar o aún no hay dónde declararlo | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:35` |
| `report.checks[].covered` | `number` | Sí | admite null | — | Ítems que cumplen; `null` si no se midió (nunca 0) | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:41` |
| `report.checks[].denominator` | `number` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:42` |
| `report.checks[].summary` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:43` |
| `report.checks[].reason` | `string` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:44` |
| `report.checks[].remediation` | `string` | Sí | — | — | Cómo corregirlo | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:45` |
| `report.checks[].evidence` | `object` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:47` |
| `report.checks[].findings` | `array<FitFindingDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:48` |
| `report.checks[].findings[].subject` | `string` | Sí | — | — | Qué está desajustado: una ruta, una tabla, una columna | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:16` |
| `report.checks[].findings[].detail` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:17` |
| `report.checks[].findingsTotal` | `number` | Sí | — | — | Total real de hallazgos; `findings` se recorta | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:52` |
| `report.checks[].findingsTruncated` | `boolean` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:53` |
| `report.blindSpots` | `array<string>` | Sí | — | — | Ids de las comprobaciones que no pudieron medir | sin fuente |
| `report.fingerprints` | `FitFingerprintsDto` | Sí | — | — | — | sin fuente |
| `report.fingerprints.routesInCode` | `string` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:78` |
| `report.fingerprints.routesInInventory` | `string` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:79` |
| `report.fingerprints.routesImported` | `string` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:81` |
| `report.deployment` | `FitDeploymentDto` | Sí | — | — | — | sin fuente |
| `report.deployment.commit` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:85` |
| `report.deployment.builtAt` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:86` |
| `report.thresholds` | `FitThresholdsDto` | Sí | — | — | — | sin fuente |
| `report.thresholds.scanStaleAfterMs` | `number` | Sí | — | — | Un escaneo exitoso más viejo que esto se declara vencido | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:93` |
| `history` | `array<FitHistoryEntryDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:215` |
| `history[].runId` | `string` | Sí | formato uuid | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:138` |
| `history[].evaluatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:139` |
| `history[].trigger` | `string` | Sí | valores: TICK, MANUAL | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:140` |
| `history[].verdict` | `string` | Sí | valores: AJUSTADA, CON_AVISOS, DESAJUSTADA, SIN_DATOS | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:141` |
| `history[].dimensions` | `array<FitHistoryDimensionDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:143` |
| `history[].dimensions[].dimension` | `string` | Sí | valores: ROUTES, MODEL, COMPLETENESS, FRESHNESS, MUTABILITY, SENSITIVITY | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:130` |
| `history[].dimensions[].status` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:131` |
| `history[].dimensions[].covered` | `number` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:132` |
| `history[].dimensions[].denominator` | `number` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:133` |
| `history[].dimensions[].ratio` | `number` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:134` |
| `history[].failedChecks` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:144` |
| `history[].blindSpots` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:145` |
| `retention` | `FitRetentionDto` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:216` |
| `retention.kind` | `string` | Sí | valores: BASE_DE_DATOS, MEMORIA_DEL_PROCESO | — | `BASE_DE_DATOS`: leído de data_catalog.catalog_fit_runs. `MEMORIA_DEL_PROCESO`: sin repositorio o con la base caída (ver `fallbackReason`) | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:172` |
| `retention.fallbackReason` | `string` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:178` |
| `retention.storedForSeconds` | `number` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:180` |
| `retention.lastWrite` | `FitPersistenceStatusDto` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:182` |
| `retention.lastWrite.state` | `string` | Sí | valores: GUARDADA, CLAVE_REPETIDA, NO_GUARDADA, SIN_INTENTO | — | Desenlace de la última escritura en data_catalog.catalog_fit_runs intentada por este proceso | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:154` |
| `retention.lastWrite.runId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:156` |
| `retention.lastWrite.at` | `string` | Sí | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:157` |
| `retention.lastWrite.errorCode` | `string` | Sí | admite null | — | Clase del error, nunca el mensaje | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:163` |
| `retention.ttlSeconds` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:183` |
| `retention.historySize` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:184` |
| `retention.tickIntervalSeconds` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:185` |
| `retention.staleAfterSeconds` | `number` | Sí | — | — | Pasado esto el resultado se sirve como ATRASADO | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:189` |
| `retention.note` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:190` |

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

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:AdminCatalogFitController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /admin/catalog/fit/run

- **Origen:** CONTRATO
- **Nombre:** Pide una corrida de la sonda de ajuste (se ejecuta fuera de la petición)
- **Bloque:** —
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogFitController.run` — `src/modules/data_catalog/presentation/controllers/catalog-fit.controller.ts:60`

### Qué es y para qué sirve (negocio)

Pide una corrida de la sonda de ajuste (se ejecuta fuera de la petición).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/catalog/fit/run` la atiende `AdminCatalogFitController.run` (src/modules/data_catalog/presentation/controllers/catalog-fit.controller.ts:60). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. Delega en `CatalogFitService.request`. Crea filas en data_catalog.catalog_fit_runs. Borra de data_catalog.catalog_fit_runs. Lee data_catalog.catalog_annotations, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_operations, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD | `src/modules/data_catalog/presentation/controllers/catalog-fit.controller.ts:60` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/catalog-fit.controller.ts:60` |
| CABECERA | Idempotency-Key (obligatoria) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogFitController.run → CatalogFitService.request → CatalogFitService.execute → FitInputsCollector.collect → FitLiveRepository.liveObjects | `src/modules/data_catalog/application/fit/fit-live.repository.ts:57` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogFitController.run → CatalogFitService.request → CatalogFitService.execute → FitInputsCollector.collect → FitLiveRepository.liveObjects | `src/modules/data_catalog/application/fit/fit-live.repository.ts:57` |
| `data_catalog.catalog_fit_runs (vista u objeto no catalogado)` | BORRA | BORRA | POR_SQL | AdminCatalogFitController.run → CatalogFitService.request → CatalogFitService.execute → CatalogFitService.persist → FitRunsRepository.purgeBefore | `src/modules/data_catalog/application/fit/fit-runs.repository.ts:102` |
| `data_catalog.catalog_fit_runs (vista u objeto no catalogado)` | ESCRIBE | CREA | POR_SQL | AdminCatalogFitController.run → CatalogFitService.request → CatalogFitService.execute → CatalogFitService.persist → FitRunsRepository.save | `src/modules/data_catalog/application/fit/fit-runs.repository.ts:74` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogFitController.run → CatalogFitService.request → CatalogFitService.execute → FitInputsCollector.collect → FitLiveRepository.liveObjects | `src/modules/data_catalog/application/fit/fit-live.repository.ts:42` |
| `data_catalog.catalog_operations` | LEE | LEE | POR_SQL | AdminCatalogFitController.run → CatalogFitService.request → CatalogFitService.execute → FitInputsCollector.collect → FitLiveRepository.importedOperations | `src/modules/data_catalog/application/fit/fit-live.repository.ts:153` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogFitController.run → CatalogFitService.request → CatalogFitService.execute → FitInputsCollector.collect → FitLiveRepository.scanState | `src/modules/data_catalog/application/fit/fit-live.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `Idempotency-Key` | header | Sí | `string` | 8–128 caracteres; la misma clave devuelve la corrida ya aceptada. Con una corrida en vuelo también se devuelve esa, sin crear otra |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `FitRunAcceptedDto` · DTO `FitRunAcceptedDto` · HTTP `HttpStatus.ACCEPTED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `runId` | `string` | Sí | formato uuid | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:220` |
| `status` | `string` | Sí | valores: EN_CURSO, COMPLETADA, FALLIDA | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:221` |
| `created` | `boolean` | Sí | — | — | `false` si la petición repetía una `Idempotency-Key` ya aceptada o se unió a la corrida en vuelo | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:226` |
| `acceptedAt` | `string` | Sí | formato date-time | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:227` |
| `statusUrl` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:228` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 202 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:AdminCatalogFitController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /admin/catalog/objects

- **Origen:** CONTRATO
- **Nombre:** Objetos del catálogo, paginados por cursor
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.objects` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:137`

### Qué es y para qué sirve (negocio)

Objetos del catálogo, paginados por cursor. Caso de uso UC-67-18: Objetos observados, con filtros y cursor.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:76`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects` la atiende `AdminCatalogController.objects` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:137). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogReadService.objects`. Lee data_catalog.catalog_annotations, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:137` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:137` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.objects → CatalogReadService.objects → CatalogRepository.objects | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:304` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.objects → CatalogReadService.objects → CatalogRepository.objects | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:304` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.objects → CatalogReadService.objects → CatalogRepository.objects | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:304` |

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

## 10. GET /admin/catalog/objects/{id}

- **Origen:** CONTRATO
- **Nombre:** Ficha técnica, observación, ficha curada, cobertura y gobierno de un objeto
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.object` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:147`

### Qué es y para qué sirve (negocio)

Ficha técnica, observación, ficha curada, cobertura y gobierno de un objeto. Caso de uso UC-67-19: Ficha técnica, observación, ficha curada, cobertura.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:77`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}` la atiende `AdminCatalogController.object` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:147). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogReadService.objectDetail`. Lee data_catalog.catalog_annotations, data_catalog.catalog_evidence_items, data_catalog.catalog_objects, data_catalog.catalog_scan_runs, system_ops.entity_registry.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:147` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:147` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.object → CatalogReadService.objectDetail → CatalogRepository.annotationOfObject → CatalogRepository.annotationsOf | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:348` |
| `data_catalog.catalog_evidence_items` | LEE | LEE | POR_SQL | AdminCatalogController.object → CatalogReadService.objectDetail → CatalogRepository.evidenceCount | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:497` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.object → CatalogReadService.objectDetail → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:331` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.object → CatalogReadService.objectDetail → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:331` |
| `system_ops.entity_registry` | LEE | LEE | POR_SQL | AdminCatalogController.object → CatalogReadService.objectDetail → CatalogRepository.governance | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:688` |

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

## 11. PUT /admin/catalog/objects/{id}/annotation

- **Origen:** CONTRATO
- **Nombre:** Crea o edita la ficha de un objeto (con versión esperada)
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.saveAnnotation` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:262`

### Qué es y para qué sirve (negocio)

Crea o edita la ficha de un objeto (con versión esperada). Caso de uso UC-67-26: Crear o editar la ficha (con versión esperada).

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:84`)

### Cómo se atiende (sistema)

`PUT /admin/catalog/objects/{id}/annotation` la atiende `AdminCatalogController.saveAnnotation` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:262). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. Valida el cuerpo como `AnnotationPatchDto` (23 campos, 1 obligatorio). Delega en `CatalogGovernanceService.saveAnnotation`. Crea filas en data_catalog.catalog_annotation_revisions, data_catalog.catalog_annotations. Actualiza data_catalog.catalog_annotations. Lee data_catalog.catalog_annotations, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:262` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:262` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotation_revisions` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.saveAnnotation → CatalogGovernanceService.saveAnnotation → CatalogGovernanceService.save → CatalogRepository.insertRevision | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:830` |
| `data_catalog.catalog_annotations` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.saveAnnotation → CatalogGovernanceService.saveAnnotation → CatalogGovernanceService.save → CatalogRepository.insertAnnotation | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:715` |
| `data_catalog.catalog_annotations` | ESCRIBE | ACTUALIZA | POR_SQL | AdminCatalogController.saveAnnotation → CatalogGovernanceService.saveAnnotation → CatalogGovernanceService.save → CatalogRepository.updateAnnotation | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:775` |
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.saveAnnotation → CatalogGovernanceService.saveAnnotation → CatalogGovernanceService.save → CatalogRepository.annotationById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:368` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.saveAnnotation → CatalogGovernanceService.saveAnnotation → CatalogRepository.objectById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:331` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.saveAnnotation → CatalogGovernanceService.saveAnnotation → CatalogRepository.objectById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:331` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AnnotationPatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expectedVersion` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | Versión de la ficha que se leyó (`version`); 0 para crearla. Si cambió, 409 | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:174` |
| `submit` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Enviarla a revisión: exige propósito, razón de existir y grano de fila (o declararlos como preguntas abiertas) | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:182` |
| `changeReason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:188` |
| `businessName` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:194` |
| `definition` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:199` |
| `purpose` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:204` |
| `existenceRationale` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:209` |
| `rowGrain` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:214` |
| `alternativesRationale` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:219` |
| `deletionImpact` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:224` |
| `businessOwner` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:229` |
| `dataSteward` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:234` |
| `technicalOwner` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:239` |
| `unit` | `object` | No | longitud máxima 100; admite null | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:244` |
| `valueDomain` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:249` |
| `nullSemantics` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:254` |
| `sensitivity` | `string` | No | valores: UNKNOWN, ANONYMIZED, PUBLIC, INTERNAL, PSEUDONYMIZED, PERSONAL, PHI_IDENTIFIER, PHI_SENSITIVE, PHI_SPECIAL, CREDENTIAL | `@IsOptional()` `@IsIn(SENSITIVITIES)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:259` |
| `consumers` | `array<string>` | No | longitud máxima 200; máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@IsString({ each: true })` `@MaxLength(200, { each: true })` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:267` |
| `openQuestions` | `array<OpenQuestionDto>` | No | máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => OpenQuestionDto)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:275` |
| `openQuestions[].field` | `string` | No | longitud máxima 60 | `@IsOptional()` `@IsString()` `@MaxLength(60)` | Campo de la ficha sobre el que es la pregunta | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:140` |
| `openQuestions[].question` | `string` | No | longitud mínima 3; longitud máxima 500 | `@IsString()` `@MinLength(3)` `@MaxLength(500)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:146` |
| `openQuestions[].owner` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:152` |
| `openQuestions[].dueDate` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Fecha ISO 8601 | `src/modules/data_catalog/presentation/dto/catalog-request.dto.ts:157` |

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

## 12. GET /admin/catalog/objects/{id}/changes

- **Origen:** CONTRATO
- **Nombre:** Cambios que los escaneos detectaron en un objeto
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.changes` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:241`

### Qué es y para qué sirve (negocio)

Cambios que los escaneos detectaron en un objeto. Caso de uso UC-67-24: Cambios que los escaneos detectaron.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:82`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/changes` la atiende `AdminCatalogController.changes` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:241). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogReadService.changes`. Lee data_catalog.catalog_change_events, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:241` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:241` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_change_events` | LEE | LEE | POR_SQL | AdminCatalogController.changes → CatalogReadService.changes → CatalogRepository.changes | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:597` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.changes → CatalogReadService.changes → CatalogRepository.changes | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:597` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.changes → CatalogReadService.changes → CatalogRepository.changes | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:597` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.changes → CatalogReadService.changes → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:331` |

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

## 13. GET /admin/catalog/objects/{id}/columns

- **Origen:** CONTRATO
- **Nombre:** Columnas observadas de un objeto, con su ficha si la tienen
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.columns` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:159`

### Qué es y para qué sirve (negocio)

Columnas observadas de un objeto, con su ficha si la tienen. Caso de uso UC-67-20: Columnas observadas con su ficha.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:78`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/columns` la atiende `AdminCatalogController.columns` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:159). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogReadService.columns`. Lee data_catalog.catalog_annotations, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:159` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.columns → CatalogReadService.columns → CatalogRepository.columnAnnotations | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:467` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.columns → CatalogReadService.columns → CatalogRepository.columns | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:454` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.columns → CatalogReadService.columns → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:331` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.columns → CatalogReadService.columns → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:331` |

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

## 14. GET /admin/catalog/objects/{id}/evidence

- **Origen:** CONTRATO
- **Nombre:** Evidencia enlazada a un objeto
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.evidence` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:169`

### Qué es y para qué sirve (negocio)

Evidencia enlazada a un objeto. Caso de uso UC-67-21: Evidencia enlazada.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:79`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/evidence` la atiende `AdminCatalogController.evidence` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:169). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogReadService.evidence`. Lee data_catalog.catalog_evidence_items, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:169` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:169` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_evidence_items` | LEE | LEE | POR_SQL | AdminCatalogController.evidence → CatalogReadService.evidence → CatalogRepository.evidence | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:479` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.evidence → CatalogReadService.evidence → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:331` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.evidence → CatalogReadService.evidence → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:331` |

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

## 15. POST /admin/catalog/objects/{id}/evidence

- **Origen:** CONTRATO
- **Nombre:** Enlaza evidencia a un objeto
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.addEvidence` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:179`

### Qué es y para qué sirve (negocio)

Enlaza evidencia a un objeto. Caso de uso UC-67-22: Enlazar evidencia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:80`)

### Cómo se atiende (sistema)

`POST /admin/catalog/objects/{id}/evidence` la atiende `AdminCatalogController.addEvidence` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:179). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. Valida el cuerpo como `DataCatalogEvidenceInputDto` (4 campos, 2 obligatorios). Delega en `CatalogGovernanceService.addEvidence`. Crea filas en data_catalog.catalog_evidence_items. Lee data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:179` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:179` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_evidence_items` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.addEvidence → CatalogGovernanceService.addEvidence → CatalogGovernanceService.guardarEvidencia → CatalogRepository.addEvidence | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:531` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.addEvidence → CatalogGovernanceService.addEvidence → CatalogRepository.objectById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:331` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.addEvidence → CatalogGovernanceService.addEvidence → CatalogRepository.objectById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:331` |

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

## 16. GET /admin/catalog/objects/{id}/history

- **Origen:** CONTRATO
- **Nombre:** Revisiones y decisiones de la ficha de un objeto
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.history` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:231`

### Qué es y para qué sirve (negocio)

Revisiones y decisiones de la ficha de un objeto. Caso de uso UC-67-23: Revisiones y decisiones de la ficha.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:81`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/history` la atiende `AdminCatalogController.history` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:231). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogReadService.history`. Lee data_catalog.catalog_annotation_revisions, data_catalog.catalog_annotations, data_catalog.catalog_objects, data_catalog.catalog_review_decisions, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:231` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:231` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotation_revisions` | LEE | LEE | POR_SQL | AdminCatalogController.history → CatalogReadService.history → CatalogRepository.revisions | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:552` |
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.history → CatalogReadService.history → CatalogRepository.annotationOfObject → CatalogRepository.annotationsOf | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:348` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.history → CatalogReadService.history → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:331` |
| `data_catalog.catalog_review_decisions` | LEE | LEE | POR_SQL | AdminCatalogController.history → CatalogReadService.history → CatalogRepository.decisions | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:561` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.history → CatalogReadService.history → CatalogReadService.objeto → CatalogRepository.objectById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:331` |

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

## 17. GET /admin/catalog/objects/{id}/impact

- **Origen:** CONTRATO
- **Nombre:** Quién referencia a un objeto y a quién referencia, por claves foráneas observadas
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.impact` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:251`

### Qué es y para qué sirve (negocio)

Quién referencia a un objeto y a quién referencia, por claves foráneas observadas. Caso de uso UC-67-25: Análisis de impacto por claves foráneas observadas.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:83`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/impact` la atiende `AdminCatalogController.impact` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:251). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogReadService.impact`. Lee data_catalog.catalog_annotations, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:251` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.impact → CatalogReadService.impact → CatalogRepository.annotationsOf | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:348` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.impact → CatalogReadService.impact → CatalogRepository.foreignKeyGraph | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:621` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.impact → CatalogReadService.impact → CatalogRepository.foreignKeyGraph | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:621` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.impact → CatalogReadService.impact → CatalogRepository.objectsByIds | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:320` |

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

## 18. GET /admin/catalog/permission-drift

- **Origen:** CONTRATO
- **Nombre:** Deriva de permisos: roles que las rutas exigen contra los que la API siembra
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.permissionDrift` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:372`

### Qué es y para qué sirve (negocio)

Deriva de permisos: roles que las rutas exigen contra los que la API siembra.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/permission-drift` la atiende `AdminCatalogController.permissionDrift` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:372). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PermissionDriftService.report`. Lee authz.roles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:372` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:372` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | POR_SQL | AdminCatalogController.permissionDrift → PermissionDriftService.report → PermissionDriftService.databaseRoleCodes | `src/modules/data_catalog/application/permission-drift.service.ts:73` |

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

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:AdminCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. GET /admin/catalog/pii/columns

- **Origen:** CONTRATO
- **Nombre:** Columnas clasificadas como datos personales, con su sensibilidad y estado de revisión
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.piiColumns` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:408`

### Qué es y para qué sirve (negocio)

Columnas clasificadas como datos personales, con su sensibilidad y estado de revisión.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/pii/columns` la atiende `AdminCatalogController.piiColumns` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:408). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogInsightsService.piiColumns`. Lee data_catalog.catalog_annotations, data_catalog.catalog_columns, data_catalog.catalog_objects, system_ops.entity_registry, system_ops.field_registry.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:408` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:408` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.piiColumns → CatalogInsightsService.piiColumns → CatalogInsightsRepository.piiColumns | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:195` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.piiColumns → CatalogInsightsService.piiColumns → CatalogInsightsRepository.piiColumns | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:195` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.piiColumns → CatalogInsightsService.piiColumns → CatalogInsightsRepository.piiColumns | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:195` |
| `system_ops.entity_registry` | LEE | LEE | POR_SQL | AdminCatalogController.piiColumns → CatalogInsightsService.piiColumns → CatalogInsightsRepository.piiColumns | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:195` |
| `system_ops.field_registry` | LEE | LEE | POR_SQL | AdminCatalogController.piiColumns → CatalogInsightsService.piiColumns → CatalogInsightsRepository.piiColumns | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:195` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |
| `schema` | query | No | `string` | Schema de PostgreSQL |
| `minSensitivity` | query | No | `string` | Nivel mínimo de sensibilidad (escala de menos a más sensible). Por omisión `PERSONAL`; `PSEUDONYMIZED` incluye lo seudonimizado |
| `sensitivity` | query | No | `string` | Un nivel exacto (se combina con `minSensitivity`) |
| `reviewStatus` | query | No | `string` | — |
| `q` | query | No | `string` | Busca en `schema.objeto.columna`, sin mayúsculas |
| `sort` | query | No | `string` | `name`: schema, objeto, columna. `sensitivity`: de más a menos sensible, luego por nombre |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: {CURSOR_INVALIDO} |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:AdminCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. GET /admin/catalog/pii/reconciliation

- **Origen:** CONTRATO
- **Nombre:** Conciliación de las columnas personales del catálogo con el registro declarado de gobierno
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.piiReconciliation` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:421`

### Qué es y para qué sirve (negocio)

Conciliación de las columnas personales del catálogo con el registro declarado de gobierno.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/pii/reconciliation` la atiende `AdminCatalogController.piiReconciliation` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:421). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogInsightsService.piiReconciliation`. Lee data_catalog.catalog_annotations, data_catalog.catalog_columns, data_catalog.catalog_objects, system_ops.entity_registry, system_ops.field_registry.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:421` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:421` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.piiReconciliation → CatalogInsightsService.piiReconciliation → CatalogInsightsRepository.piiReconciliationTotals | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:383` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.piiReconciliation → CatalogInsightsService.piiReconciliation → CatalogInsightsRepository.piiReconciliationTotals | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:383` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.piiReconciliation → CatalogInsightsService.piiReconciliation → CatalogInsightsRepository.piiReconciliationTotals | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:383` |
| `system_ops.entity_registry` | LEE | LEE | POR_SQL | AdminCatalogController.piiReconciliation → CatalogInsightsService.piiReconciliation → CatalogInsightsRepository.piiReconciliation → CatalogInsightsRepository.reconciliationCte | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:281` |
| `system_ops.field_registry` | LEE | LEE | POR_SQL | AdminCatalogController.piiReconciliation → CatalogInsightsService.piiReconciliation → CatalogInsightsRepository.piiReconciliationTotals | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:383` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |
| `kind` | query | No | `string` | `MISSING_IN_REGISTRY`: personal aprobada sin declarar. `REGISTRY_DISAGREES`: declarada sin marca PII/PHI. `ORPHAN_IN_REGISTRY`: declarada pero no observada |
| `schema` | query | No | `string` | Schema de PostgreSQL |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: {CURSOR_INVALIDO} |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:AdminCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. GET /admin/catalog/pii/summary

- **Origen:** CONTRATO
- **Nombre:** Datos personales: cuántas columnas son personales según el catálogo y qué declaró el registro de gobierno
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.piiSummary` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:395`

### Qué es y para qué sirve (negocio)

Datos personales: cuántas columnas son personales según el catálogo y qué declaró el registro de gobierno.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/pii/summary` la atiende `AdminCatalogController.piiSummary` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:395). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogInsightsService.piiSummary`. Lee data_catalog.catalog_annotations, data_catalog.catalog_columns, data_catalog.catalog_objects, system_ops.entity_registry, system_ops.field_registry.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:395` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:395` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.piiSummary → CatalogInsightsService.piiSummary → CatalogInsightsRepository.piiBySensitivity | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:218` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.piiSummary → CatalogInsightsService.piiSummary → CatalogInsightsRepository.piiBySensitivity | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:218` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.piiSummary → CatalogInsightsService.piiSummary → CatalogInsightsRepository.piiBySensitivity | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:218` |
| `system_ops.entity_registry` | LEE | LEE | POR_SQL | AdminCatalogController.piiSummary → CatalogInsightsService.piiSummary → CatalogInsightsRepository.registryTotals | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:255` |
| `system_ops.field_registry` | LEE | LEE | POR_SQL | AdminCatalogController.piiSummary → CatalogInsightsService.piiSummary → CatalogInsightsRepository.registryTotals | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:255` |

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

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:AdminCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. GET /admin/catalog/quality/issues

- **Origen:** CONTRATO
- **Nombre:** Incidencias de calidad del catálogo (derivadas al leer), paginadas
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.qualityIssues` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:448`

### Qué es y para qué sirve (negocio)

Incidencias de calidad del catálogo (derivadas al leer), paginadas.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/quality/issues` la atiende `AdminCatalogController.qualityIssues` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:448). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogInsightsService.qualityIssues`. Lee data_catalog.catalog_annotations, data_catalog.catalog_columns, data_catalog.catalog_objects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:448` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:448` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.qualityIssues → CatalogInsightsService.qualityIssues → CatalogInsightsRepository.qualityIssues → CatalogInsightsRepository.issuesCte | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:399` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.qualityIssues → CatalogInsightsService.qualityIssues → CatalogInsightsRepository.qualityIssues → CatalogInsightsRepository.issuesCte | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:399` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.qualityIssues → CatalogInsightsService.qualityIssues → CatalogInsightsRepository.qualityIssues → CatalogInsightsRepository.issuesCte | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:399` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |
| `rule` | query | No | `string` | — |
| `severity` | query | No | `string` | — |
| `schema` | query | No | `string` | Schema de PostgreSQL |
| `q` | query | No | `string` | Busca en `schema.objeto.columna`, sin mayúsculas |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: {CURSOR_INVALIDO} |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:AdminCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. GET /admin/catalog/quality/rules

- **Origen:** CONTRATO
- **Nombre:** Reglas de calidad del catálogo, con las incidencias abiertas de cada una
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.qualityRules` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:437`

### Qué es y para qué sirve (negocio)

Reglas de calidad del catálogo, con las incidencias abiertas de cada una.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/quality/rules` la atiende `AdminCatalogController.qualityRules` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:437). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogInsightsService.qualityRules`. Lee data_catalog.catalog_annotations, data_catalog.catalog_columns, data_catalog.catalog_objects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:437` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:437` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.qualityRules → CatalogInsightsService.qualityRules → CatalogInsightsRepository.qualityCounts → CatalogInsightsRepository.issuesCte | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:399` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.qualityRules → CatalogInsightsService.qualityRules → CatalogInsightsRepository.qualityCounts → CatalogInsightsRepository.issuesCte | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:399` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.qualityRules → CatalogInsightsService.qualityRules → CatalogInsightsRepository.qualityCounts → CatalogInsightsRepository.issuesCte | `src/modules/data_catalog/infrastructure/repositories/catalog-insights.repository.ts:399` |

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

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:AdminCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. GET /admin/catalog/scans

- **Origen:** CONTRATO
- **Nombre:** Escaneos, del más reciente al más antiguo
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.listScans` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:461`

### Qué es y para qué sirve (negocio)

Escaneos, del más reciente al más antiguo. Caso de uso UC-67-29: Listar escaneos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:87`)

### Cómo se atiende (sistema)

`GET /admin/catalog/scans` la atiende `AdminCatalogController.listScans` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:461). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogReadService.scans`. Lee data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:461` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:461` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.listScans → CatalogReadService.scans → CatalogRepository.scans | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:922` |

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

## 25. POST /admin/catalog/scans

- **Origen:** CONTRATO
- **Nombre:** Pide un escaneo de la base primaria (se ejecuta fuera de la petición)
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.requestScan` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:479`

### Qué es y para qué sirve (negocio)

Pide un escaneo de la base primaria (se ejecuta fuera de la petición). Caso de uso UC-67-31: Pedir un escaneo de la base primaria (202, idempotente).

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:89`)

### Cómo se atiende (sistema)

`POST /admin/catalog/scans` la atiende `AdminCatalogController.requestScan` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:479). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. Delega en `CatalogScanService.request`. Crea filas en data_catalog.catalog_annotation_revisions, data_catalog.catalog_annotations, data_catalog.catalog_change_events, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs. Actualiza data_catalog.catalog_annotations, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs. Lee data_catalog.catalog_annotations, data_catalog.catalog_change_events, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:479` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:479` |
| CABECERA | Idempotency-Key (obligatoria) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotation_revisions` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogScanService.execute → CatalogScanService.classifyInBackground → CatalogClassificationService.classifyScan → CatalogClassificationService.runScope → CatalogClassificationService.classifyOne → CatalogClassificationService.create → CatalogRepository.insertRevision | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:830` |
| `data_catalog.catalog_annotations` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogScanService.execute → CatalogScanService.classifyInBackground → CatalogClassificationService.classifyScan → CatalogClassificationService.runScope → CatalogClassificationService.classifyOne → CatalogClassificationService.create → CatalogRepository.insertAnnotation | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:715` |
| `data_catalog.catalog_annotations` | ESCRIBE | ACTUALIZA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogScanService.execute → CatalogScanService.classifyInBackground → CatalogClassificationService.classifyScan → CatalogClassificationService.runScope → CatalogClassificationService.classifyOne → CatalogClassificationService.raise → CatalogRepository.updateAnnotation | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:775` |
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogScanService.execute → CatalogScanService.classifyInBackground → CatalogClassificationService.classifyScan → CatalogClassificationService.runScope → CatalogRepository.annotationsOfColumns | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:395` |
| `data_catalog.catalog_change_events` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogScanService.execute → CatalogRepository.applyScan | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:1342` |
| `data_catalog.catalog_change_events` | LEE | LEE | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogScanService.execute → CatalogScanService.classifyInBackground → CatalogClassificationService.classifyScan → CatalogClassificationService.runScope → CatalogRepository.columnsToClassify | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:417` |
| `data_catalog.catalog_columns` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogScanService.execute → CatalogRepository.applyScan | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:1269` |
| `data_catalog.catalog_columns` | ESCRIBE | ACTUALIZA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogScanService.execute → CatalogRepository.applyScan | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:1290` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogScanService.execute → CatalogRepository.knownObjects | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:1133` |
| `data_catalog.catalog_objects` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogScanService.execute → CatalogRepository.applyScan | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:1236` |
| `data_catalog.catalog_objects` | ESCRIBE | ACTUALIZA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogScanService.execute → CatalogRepository.applyScan | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:1257` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogScanService.start → CatalogScanService.run → CatalogScanService.execute → CatalogRepository.knownObjects | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:1120` |
| `data_catalog.catalog_scan_runs` | ESCRIBE | ACTUALIZA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogRepository.failAbandoned | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:966` |
| `data_catalog.catalog_scan_runs` | ESCRIBE | CREA | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogRepository.insertScan | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:991` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.requestScan → CatalogScanService.request → CatalogRepository.scanByIdempotency | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:943` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `Idempotency-Key` | header | Sí | `string` | 8–128 caracteres; la misma clave del mismo usuario devuelve el escaneo ya aceptado |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ScanAcceptedDto>` · DTO `ScanAcceptedDto` · HTTP `HttpStatus.ACCEPTED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `scanId` | `string` | Sí | formato uuid | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:438` |
| `status` | `string` | Sí | valores: QUEUED, RUNNING, SUCCEEDED, FAILED, CANCELLED | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:439` |
| `created` | `boolean` | Sí | — | — | `false` si la petición repetía una `Idempotency-Key` ya usada y se devolvió el escaneo de entonces | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:444` |
| `acceptedAt` | `string` | Sí | formato date-time | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:445` |
| `statusUrl` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:446` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 202 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya hay un escaneo en curso de esta fuente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ScanFenced |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `UC-67-31`

---

## 26. GET /admin/catalog/scans/{id}

- **Origen:** CONTRATO
- **Nombre:** Un escaneo
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.scan` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:471`

### Qué es y para qué sirve (negocio)

Un escaneo. Caso de uso UC-67-30: Un escaneo.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:88`)

### Cómo se atiende (sistema)

`GET /admin/catalog/scans/{id}` la atiende `AdminCatalogController.scan` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:471). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogReadService.scan`. Lee data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:471` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:471` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | AdminCatalogController.scan → CatalogReadService.scan → CatalogRepository.scanById | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:930` |

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

## 27. GET /admin/catalog/schemas

- **Origen:** CONTRATO
- **Nombre:** Schemas observados, con cuántos objetos tienen ficha y cuántos están aprobados
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminCatalogController.schemas` — `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:126`

### Qué es y para qué sirve (negocio)

Schemas observados, con cuántos objetos tienen ficha y cuántos están aprobados. Caso de uso UC-67-17: Schemas observados, con fichas y aprobaciones.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:75`)

### Cómo se atiende (sistema)

`GET /admin/catalog/schemas` la atiende `AdminCatalogController.schemas` (src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:126). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `CatalogReadService.schemas`. Lee data_catalog.catalog_annotations, data_catalog.catalog_objects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:126` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-catalog.controller.ts:126` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | AdminCatalogController.schemas → CatalogReadService.schemas → CatalogRepository.schemas | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:246` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | AdminCatalogController.schemas → CatalogReadService.schemas → CatalogRepository.schemas | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:246` |

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

## 28. GET /admin/governance/jobs

- **Origen:** CONTRATO
- **Nombre:** Trabajos de gobierno: escaneos del catálogo, clasificaciones y ejecuciones de retención
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GovernanceQueueController.jobs` — `src/modules/data_catalog/presentation/controllers/governance-queue.controller.ts:47`

### Qué es y para qué sirve (negocio)

Trabajos de gobierno: escaneos del catálogo, clasificaciones y ejecuciones de retención.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/governance/jobs` la atiende `GovernanceQueueController.jobs` (src/modules/data_catalog/presentation/controllers/governance-queue.controller.ts:47). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. Delega en `GovernanceQueueService.jobs`. Lee audit.audit_log, data_catalog.catalog_scan_runs, system_ops.retention_executions, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD | `src/modules/data_catalog/presentation/controllers/governance-queue.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | LEE | LEE | POR_SQL | GovernanceQueueController.jobs → GovernanceQueueService.jobs → GovernanceQueueRepository.jobs | `src/modules/data_catalog/infrastructure/repositories/governance-queue.repository.ts:164` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | GovernanceQueueController.jobs → GovernanceQueueService.jobs → GovernanceQueueRepository.jobs | `src/modules/data_catalog/infrastructure/repositories/governance-queue.repository.ts:164` |
| `system_ops.retention_executions` | LEE | LEE | POR_SQL | GovernanceQueueController.jobs → GovernanceQueueService.jobs → GovernanceQueueRepository.jobs | `src/modules/data_catalog/infrastructure/repositories/governance-queue.repository.ts:164` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | GovernanceQueueController.jobs → GovernanceQueueService.jobs → GovernanceQueueRepository.jobs | `src/modules/data_catalog/infrastructure/repositories/governance-queue.repository.ts:164` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |
| `type` | query | No | `string` | — |
| `status` | query | No | `string` | Estado normalizado: QUEUED, RUNNING, SUCCEEDED, FAILED o CANCELLED |
| `from` | query | No | `string` | Desde (ISO 8601, incluido). Sin rango, los últimos 30 días |
| `to` | query | No | `string` | Hasta (ISO 8601, excluido) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: «to» debe ser posterior a «from» |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:GovernanceQueueController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. GET /admin/governance/review-queue

- **Origen:** CONTRATO
- **Nombre:** Cola de revisión: fichas de objeto y de columna en NEEDS_REVIEW, la más antigua primero
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GovernanceQueueController.reviewQueue` — `src/modules/data_catalog/presentation/controllers/governance-queue.controller.ts:32`

### Qué es y para qué sirve (negocio)

Cola de revisión: fichas de objeto y de columna en NEEDS_REVIEW, la más antigua primero.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/governance/review-queue` la atiende `GovernanceQueueController.reviewQueue` (src/modules/data_catalog/presentation/controllers/governance-queue.controller.ts:32). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. Delega en `GovernanceQueueService.reviewQueue`. Lee data_catalog.catalog_annotation_revisions, data_catalog.catalog_annotations, data_catalog.catalog_columns, data_catalog.catalog_objects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD | `src/modules/data_catalog/presentation/controllers/governance-queue.controller.ts:32` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotation_revisions` | LEE | LEE | POR_SQL | GovernanceQueueController.reviewQueue → GovernanceQueueService.reviewQueue → GovernanceQueueRepository.reviewQueue | `src/modules/data_catalog/infrastructure/repositories/governance-queue.repository.ts:103` |
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | GovernanceQueueController.reviewQueue → GovernanceQueueService.reviewQueue → GovernanceQueueRepository.reviewQueue | `src/modules/data_catalog/infrastructure/repositories/governance-queue.repository.ts:103` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | GovernanceQueueController.reviewQueue → GovernanceQueueService.reviewQueue → GovernanceQueueRepository.reviewQueue | `src/modules/data_catalog/infrastructure/repositories/governance-queue.repository.ts:103` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | GovernanceQueueController.reviewQueue → GovernanceQueueService.reviewQueue → GovernanceQueueRepository.reviewQueue | `src/modules/data_catalog/infrastructure/repositories/governance-queue.repository.ts:103` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |
| `kind` | query | No | `string` | — |
| `schema` | query | No | `string` | Schema de PostgreSQL |

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

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:GovernanceQueueController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. GET /admin/portal/catalogo/deriva

- **Origen:** CONTRATO
- **Nombre:** Deriva entre el DDL del modelo y las entidades del ORM
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.deriva` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:179`

### Qué es y para qué sirve (negocio)

Deriva entre el DDL del modelo y las entidades del ORM. Caso de uso UC-67-13: Deriva entre modelo, ORM y base desplegada.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:71`)

### Cómo se atiende (sistema)

`GET /admin/portal/catalogo/deriva` la atiende `AdminPortalController.deriva` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:179). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.derivaDelCatalogo`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:179` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:179` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `DerivaCatalogoDto` · DTO `DerivaCatalogoDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `resumen` | `object` | Sí | — | — | Cifras del catálogo | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:450` |
| `deriva` | `object` | Sí | — | — | Entidades sin tabla, tablas sin entidad, columnas ausentes, nulabilidad, schemas sin catálogo de la API | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:457` |

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

## 31. GET /admin/portal/catalogo/tablas

- **Origen:** CONTRATO
- **Nombre:** Listar las tablas del catálogo de datos
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.listarTablas` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:163`

### Qué es y para qué sirve (negocio)

Listar las tablas del catálogo de datos. Caso de uso UC-67-11: Tablas del catálogo estático (modelo), paginadas.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:69`)

### Cómo se atiende (sistema)

`GET /admin/portal/catalogo/tablas` la atiende `AdminPortalController.listarTablas` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:163). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.listarTablas`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:163` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:163` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

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
| `items` | `array<TablaResumenDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:380` |
| `items[].id` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:368` |
| `items[].schema` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:369` |
| `items[].tabla` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:370` |
| `items[].dominio` | `string` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:371` |
| `items[].columnas` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:372` |
| `items[].indices` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:373` |
| `items[].operaciones` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:374` |
| `items[].orm` | `string` | Sí | valores: COINCIDE, DIVERGE, SIN_ENTIDAD | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:375` |
| `items[].appendOnly` | `boolean` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:376` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:381` |
| `limit` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:382` |
| `total` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:383` |

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

## 32. GET /admin/portal/catalogo/tablas/{schema}/{tabla}

- **Origen:** CONTRATO
- **Nombre:** Ver la ficha de una tabla
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.fichaDeTabla` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:170`

### Qué es y para qué sirve (negocio)

Ver la ficha de una tabla. Caso de uso UC-67-12: Ficha de una tabla: columnas, relaciones, índices.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:70`)

### Cómo se atiende (sistema)

`GET /admin/portal/catalogo/tablas/{schema}/{tabla}` la atiende `AdminPortalController.fichaDeTabla` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:170). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.fichaDeTabla`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:170` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:170` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

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
| `id` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:388` |
| `schema` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:389` |
| `tabla` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:390` |
| `dominio` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:391` |
| `diagrama` | `string` | Sí | — | — | Diagrama del modelo del que sale | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:393` |
| `ddl` | `string` | Sí | — | — | DDL del que sale | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:394` |
| `proposito` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:395` |
| `propositoEstado` | `string` | Sí | — | — | Estado de la revisión del propósito (hoy `DOMAIN_CURATED_DRAFT`) | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:400` |
| `propositoFuente` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:401` |
| `entidadOrm` | `object` | No | admite null | — | Clase de la entidad del ORM | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:406` |
| `gobierno` | `object` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:408` |
| `columnas` | `array<object>` | Sí | — | — | Columnas con rol estructural y descripción (con fuente o «sin dato») | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:415` |
| `relaciones` | `object` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:416` |
| `indices` | `array<object>` | Sí | — | — | Índices con su «para qué» | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:425` |
| `restricciones` | `array<object>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:430` |
| `operaciones` | `array<object>` | Sí | — | — | Operaciones HTTP que la tocan | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:436` |
| `deriva` | `object` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:437` |
| `revision` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:441` |

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

## 33. GET /admin/portal/flujos

- **Origen:** CONTRATO
- **Nombre:** Listar los procesos de negocio
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.listarProcesos` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:134`

### Qué es y para qué sirve (negocio)

Listar los procesos de negocio. Caso de uso UC-67-05: Listar procesos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:63`)

### Cómo se atiende (sistema)

`GET /admin/portal/flujos` la atiende `AdminPortalController.listarProcesos` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:134). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.listarProcesos`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:134` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:134` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

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
| `items` | `array<ProcesoResumenDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:249` |
| `items[].codigo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:235` |
| `items[].tipo` | `string` | Sí | valores: MODULO, CRITICO | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:236` |
| `items[].nombre` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:237` |
| `items[].modulo` | `string` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:238` |
| `items[].bloque` | `string` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:239` |
| `items[].agrupacion` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:240` |
| `items[].actores` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:241` |
| `items[].operaciones` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:242` |
| `items[].etapas` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:243` |
| `items[].maquinas` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:244` |
| `items[].revision` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:245` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:250` |
| `limit` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:251` |
| `total` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:252` |

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

## 34. GET /admin/portal/flujos/{codigo}

- **Origen:** CONTRATO
- **Nombre:** Ver un proceso con sus etapas y máquinas de estado
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.detalleDeProceso` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:141`

### Qué es y para qué sirve (negocio)

Ver un proceso con sus etapas y máquinas de estado. Caso de uso UC-67-09: Detalle de un proceso.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:67`)

### Cómo se atiende (sistema)

`GET /admin/portal/flujos/{codigo}` la atiende `AdminPortalController.detalleDeProceso` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:141). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.detalleDeProceso`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:141` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:141` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `codigo` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `ProcesoDetalleDto` · DTO `ProcesoDetalleDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `codigo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:235` |
| `tipo` | `string` | Sí | valores: MODULO, CRITICO | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:236` |
| `nombre` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:237` |
| `modulo` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:238` |
| `bloque` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:239` |
| `agrupacion` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:240` |
| `actores` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:241` |
| `operaciones` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:242` |
| `etapas` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:243` |
| `maquinas` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:244` |
| `revision` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:245` |
| `paraQueSirve` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:288` |
| `paraQueSirveFuente` | `object` | No | admite null | — | archivo:línea de donde sale «para qué sirve» | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:293` |
| `flujoGeneral` | `object` | No | admite null | — | Diagrama declarado en el README del módulo, tal cual | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:298` |
| `detalleDeEtapas` | `array<EtapaDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:299` |
| `detalleDeEtapas[].codigo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:256` |
| `detalleDeEtapas[].nombre` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:257` |
| `detalleDeEtapas[].fuente` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:258` |
| `detalleDeEtapas[].agrupacion` | `string` | No | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:259` |
| `detalleDeEtapas[].operaciones` | `array<object>` | Sí | — | — | Operaciones de la etapa con quién actúa y qué efectos tiene | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:265` |
| `maquinasDeEstado` | `array<MaquinaDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:300` |
| `maquinasDeEstado[].codigo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:269` |
| `maquinasDeEstado[].fuente` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:270` |
| `maquinasDeEstado[].estados` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:271` |
| `maquinasDeEstado[].transiciones` | `array<object>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:276` |
| `maquinasDeEstado[].iniciales` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:277` |
| `maquinasDeEstado[].terminales` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:278` |
| `maquinasDeEstado[].operaciones` | `array<object>` | Sí | — | — | Operaciones que la ejercen (POR_REFERENCIA) | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:284` |
| `fuentes` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:301` |

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

## 35. GET /admin/portal/flujos/{codigo}/grafo

- **Origen:** CONTRATO
- **Nombre:** Ver el grafo de un proceso
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.grafo` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:154`

### Qué es y para qué sirve (negocio)

Ver el grafo de un proceso. Caso de uso UC-67-10: Grafo de un proceso.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:68`)

### Cómo se atiende (sistema)

`GET /admin/portal/flujos/{codigo}/grafo` la atiende `AdminPortalController.grafo` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:154). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.grafoDeProceso`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:154` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:154` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `codigo` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `GrafoDto` · DTO `GrafoDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `proceso` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:305` |
| `nombre` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:306` |
| `roles` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:307` |
| `nodos` | `array<object>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:312` |
| `aristas` | `array<object>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:317` |

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

## 36. GET /admin/portal/flujos/hallazgos

- **Origen:** CONTRATO
- **Nombre:** Resumen de hallazgos del mapa
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.hallazgos` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:115`

### Qué es y para qué sirve (negocio)

Resumen de hallazgos del mapa. Caso de uso UC-67-07: Listar hallazgos del inventario de flujos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:65`)

### Cómo se atiende (sistema)

`GET /admin/portal/flujos/hallazgos` la atiende `AdminPortalController.hallazgos` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:115). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.hallazgos`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:115` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `HallazgoResumenDto[]` · DTO `HallazgoResumenDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:350` |
| `severidad` | `string` | Sí | valores: ALTA, MEDIA, BAJA, INFO | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:351` |
| `titulo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:352` |
| `queHacer` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:353` |
| `cuenta` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:354` |

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

## 37. GET /admin/portal/flujos/hallazgos/{id}

- **Origen:** CONTRATO
- **Nombre:** Ver los casos de un hallazgo
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.detalleDeHallazgo` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:122`

### Qué es y para qué sirve (negocio)

Ver los casos de un hallazgo. Caso de uso UC-67-08: Un hallazgo.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:66`)

### Cómo se atiende (sistema)

`GET /admin/portal/flujos/hallazgos/{id}` la atiende `AdminPortalController.detalleDeHallazgo` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:122). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.detalleDeHallazgo`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:122` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:122` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

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
| `id` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:350` |
| `severidad` | `string` | Sí | valores: ALTA, MEDIA, BAJA, INFO | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:351` |
| `titulo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:352` |
| `queHacer` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:353` |
| `cuenta` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:354` |
| `items` | `array<object>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:362` |
| `nextCursor` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:363` |
| `limit` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:364` |

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

## 38. GET /admin/portal/flujos/mapa

- **Origen:** CONTRATO
- **Nombre:** Mapa de operaciones con sus señales
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.mapa` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:108`

### Qué es y para qué sirve (negocio)

Mapa de operaciones con sus señales. Caso de uso UC-67-06: Mapa de procesos y hallazgos del recorrido.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:64`)

### Cómo se atiende (sistema)

`GET /admin/portal/flujos/mapa` la atiende `AdminPortalController.mapa` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:108). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.mapa`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:108` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:108` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

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
| `items` | `array<MapaFilaDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:343` |
| `items[].id` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:321` |
| `items[].metodo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:322` |
| `items[].ruta` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:323` |
| `items[].flujos` | `array<object>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:324` |
| `items[].flujos[].codigo` | `string` | Sí | — | — | — | sin fuente |
| `items[].flujos[].nombre` | `string` | Sí | — | — | — | sin fuente |
| `items[].flujos[].etapa` | `string` | Sí | — | — | — | sin fuente |
| `items[].modulo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:329` |
| `items[].riesgo` | `string` | Sí | valores: ALTO, MEDIO, BAJO | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:330` |
| `items[].autorizacion` | `string` | Sí | — | — | Pública, los roles o «Sesión sin roles» | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:332` |
| `items[].llamadaPor` | `array<string>` | No | admite null | — | `null` si no se pudo cruzar con el frontend | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:338` |
| `items[].senales` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:339` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:344` |
| `limit` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:345` |
| `total` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:346` |

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

## 39. GET /admin/portal/glosario

- **Origen:** CONTRATO
- **Nombre:** Buscar en el glosario
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.glosario` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:222`

### Qué es y para qué sirve (negocio)

Buscar en el glosario. Caso de uso UC-67-16: Glosario de dominio.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:74`)

### Cómo se atiende (sistema)

`GET /admin/portal/glosario` la atiende `AdminPortalController.glosario` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:222). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.glosario`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:222` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:222` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

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
| `items` | `array<GlosarioTerminoDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:533` |
| `items[].termino` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:526` |
| `items[].definicion` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:527` |
| `items[].fuente` | `string` | Sí | — | — | repo:archivo:línea | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:528` |
| `items[].tablasRelacionadas` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:529` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:534` |
| `limit` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:535` |
| `total` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:536` |

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

## 40. GET /admin/portal/linaje

- **Origen:** CONTRATO
- **Nombre:** Métricas del linaje de datos
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.linaje` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:188`

### Qué es y para qué sirve (negocio)

Métricas del linaje de datos. Caso de uso UC-67-14: Grafo de linaje endpoint → tabla.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:72`)

### Cómo se atiende (sistema)

`GET /admin/portal/linaje` la atiende `AdminPortalController.linaje` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:188). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.linaje`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:188` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:188` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `LinajeDto` · DTO `LinajeDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `metricas` | `object` | Sí | — | — | Dominios, rutas, tablas, aristas, operación→tabla, tabla→tabla; las tablas con datos personales son `SIN_FUENTE` | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:473` |
| `dominios` | `array<LinajeDominioDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:474` |
| `dominios[].id` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:461` |
| `dominios[].etiqueta` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:462` |
| `dominios[].tablas` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:463` |

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

## 41. GET /admin/portal/linaje/aristas

- **Origen:** CONTRATO
- **Nombre:** Aristas del linaje (lee, escribe, borra, referencia, pertenece)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.linajeAristas` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:203`

### Qué es y para qué sirve (negocio)

Aristas del linaje (lee, escribe, borra, referencia, pertenece).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/portal/linaje/aristas` la atiende `AdminPortalController.linajeAristas` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:203). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.linajeAristas`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:203` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:203` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |
| `tipo` | query | No | `string` | — |
| `de` | query | No | `string` | Id exacto del nodo de origen (`op:…`, `tabla:schema.tabla`) |
| `a` | query | No | `string` | Id exacto del nodo de destino |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `LinajeAristasPaginaDto` · DTO `LinajeAristasPaginaDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<LinajeAristaDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:502` |
| `items[].de` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:493` |
| `items[].a` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:494` |
| `items[].tipo` | `string` | Sí | valores: LEE, ESCRIBE, BORRA, REFERENCIA, PERTENECE | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:498` |
| `nextCursor` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:503` |
| `limit` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:504` |
| `total` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:505` |

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

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:AdminPortalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 42. GET /admin/portal/linaje/nodos

- **Origen:** CONTRATO
- **Nombre:** Nodos del linaje (operaciones, tablas, dominios)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.linajeNodos` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:195`

### Qué es y para qué sirve (negocio)

Nodos del linaje (operaciones, tablas, dominios).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/portal/linaje/nodos` la atiende `AdminPortalController.linajeNodos` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:195). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.linajeNodos`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:195` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:195` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |
| `tipo` | query | No | `string` | — |
| `q` | query | No | `string` | Busca (sin tildes ni mayúsculas) en el identificador y la etiqueta |
| `dominio` | query | No | `string` | Etiqueta exacta del dominio al que pertenece el nodo |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `LinajeNodosPaginaDto` · DTO `LinajeNodosPaginaDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<LinajeNodoDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:486` |
| `items[].id` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:478` |
| `items[].tipo` | `string` | Sí | valores: OPERACION, TABLA, DOMINIO | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:479` |
| `items[].etiqueta` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:480` |
| `items[].dominio` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:481` |
| `items[].riesgo` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:482` |
| `nextCursor` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:487` |
| `limit` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:488` |
| `total` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:489` |

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

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:AdminPortalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 43. GET /admin/portal/linaje/tablas/{schema}/{tabla}

- **Origen:** CONTRATO
- **Nombre:** Linaje de una tabla
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.linajeDeTabla` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:213`

### Qué es y para qué sirve (negocio)

Linaje de una tabla. Caso de uso UC-67-15: Linaje de una tabla.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:73`)

### Cómo se atiende (sistema)

`GET /admin/portal/linaje/tablas/{schema}/{tabla}` la atiende `AdminPortalController.linajeDeTabla` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:213). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.linajeDeTabla`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:213` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:213` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

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
| `id` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:509` |
| `operaciones` | `array<object>` | Sí | — | — | Operaciones que la leen o la escriben | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:515` |
| `referencia` | `array<string>` | Sí | — | — | Tablas a las que ésta referencia | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:520` |
| `referenciadaPor` | `array<string>` | Sí | — | — | Tablas que la referencian | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:522` |

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

## 44. GET /admin/portal/operaciones

- **Origen:** CONTRATO
- **Nombre:** Listar las operaciones HTTP del sistema
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.listarOperaciones` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:75`

### Qué es y para qué sirve (negocio)

Listar las operaciones HTTP del sistema. Caso de uso UC-67-02: Listar operaciones del sistema, con filtros.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:60`)

### Cómo se atiende (sistema)

`GET /admin/portal/operaciones` la atiende `AdminPortalController.listarOperaciones` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:75). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.listarOperaciones`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:75` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:75` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

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
| `items` | `array<OperacionResumenDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:57` |
| `items[].id` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:38` |
| `items[].metodo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:39` |
| `items[].ruta` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:40` |
| `items[].modulo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:41` |
| `items[].nombre` | `string` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:42` |
| `items[].origen` | `string` | Sí | valores: CONTRATO, CONTRATO_AUSENTE | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:43` |
| `items[].riesgo` | `string` | Sí | valores: ALTO, MEDIO, BAJO | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:44` |
| `items[].publica` | `boolean` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:45` |
| `items[].roles` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:46` |
| `items[].tablas` | `number` | Sí | — | — | Cantidad de tablas que toca | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:47` |
| `items[].flujos` | `array<FlujoRefDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:48` |
| `items[].flujos[].codigo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:21` |
| `items[].flujos[].nombre` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:22` |
| `items[].flujos[].etapa` | `string` | Sí | — | — | Etapa (caso de uso o controlador) dentro del proceso | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:26` |
| `items[].flujos[].agrupacion` | `string` | Sí | valores: CASO_DE_USO_README, AGRUPACION_POR_CONTROLADOR, CURADO_EN_DOCUMENTO | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:34` |
| `items[].senales` | `array<string>` | Sí | — | — | Señales del mapa (`SIN_PRUEBAS`, `ESCRIBE_SIN_ROLES`…) | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:53` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:58` |
| `limit` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:59` |
| `total` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:60` |

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

## 45. GET /admin/portal/operaciones/{id}

- **Origen:** CONTRATO
- **Nombre:** Ver la ficha de una operación
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.detalleDeOperacion` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:82`

### Qué es y para qué sirve (negocio)

Ver la ficha de una operación. Caso de uso UC-67-03: Ficha de una operación: tablas, DTO, requisitos, flujo.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:61`)

### Cómo se atiende (sistema)

`GET /admin/portal/operaciones/{id}` la atiende `AdminPortalController.detalleDeOperacion` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:82). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.detalleDeOperacion`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:82` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:82` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `OperacionDetalleDto` · DTO `OperacionDetalleDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:38` |
| `metodo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:39` |
| `ruta` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:40` |
| `modulo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:41` |
| `nombre` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:42` |
| `origen` | `string` | Sí | valores: CONTRATO, CONTRATO_AUSENTE | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:43` |
| `riesgo` | `string` | Sí | valores: ALTO, MEDIO, BAJO | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:44` |
| `publica` | `boolean` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:45` |
| `roles` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:46` |
| `tablas` | `number` | Sí | — | — | Cantidad de tablas que toca | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:47` |
| `flujos` | `array<FlujoRefDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:48` |
| `flujos[].codigo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:21` |
| `flujos[].nombre` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:22` |
| `flujos[].etapa` | `string` | Sí | — | — | Etapa (caso de uso o controlador) dentro del proceso | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:26` |
| `flujos[].agrupacion` | `string` | Sí | valores: CASO_DE_USO_README, AGRUPACION_POR_CONTROLADOR, CURADO_EN_DOCUMENTO | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:34` |
| `senales` | `array<string>` | Sí | — | — | Señales del mapa (`SIN_PRUEBAS`, `ESCRIBE_SIN_ROLES`…) | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:53` |
| `bloque` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:164` |
| `codigo` | `object` | No | admite null | — | archivo:línea del handler | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:169` |
| `negocio` | `ExplicacionNegocioDto` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:170` |
| `negocio.texto` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:130` |
| `negocio.estado` | `string` | Sí | — | — | `AUTO_DETECTADA` hasta que una persona la revise | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:134` |
| `negocio.fuentes` | `array<string>` | Sí | — | — | Fuentes con las que se compuso el texto | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:136` |
| `sistema` | `string` | Sí | — | — | Cómo la atiende el sistema (controlador, servicio, tablas) | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:174` |
| `razonesDeRiesgo` | `array<string>` | Sí | — | — | Por qué tiene ese nivel de riesgo | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:179` |
| `requerimientos` | `array<RequerimientoDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:181` |
| `requerimientos[].tipo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:90` |
| `requerimientos[].detalle` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:91` |
| `requerimientos[].fuente` | `string` | Sí | — | — | archivo:línea de donde se leyó | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:93` |
| `parametros` | `array<ParametroDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:182` |
| `parametros[].nombre` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:64` |
| `parametros[].en` | `string` | Sí | — | — | path, query, header o cookie | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:65` |
| `parametros[].obligatorio` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:66` |
| `parametros[].tipo` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:67` |
| `parametros[].descripcion` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:68` |
| `cuerpo` | `CuerpoDto` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:184` |
| `cuerpo.dto` | `object` | No | admite null | — | — | sin fuente |
| `cuerpo.contentType` | `object` | No | admite null | — | — | sin fuente |
| `cuerpo.obligatorio` | `object` | No | admite null | — | — | sin fuente |
| `cuerpo.campos` | `array<CampoDto>` | No | — | — | — | sin fuente |
| `cuerpo.campos[].campo` | `string` | No | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:72` |
| `cuerpo.campos[].tipo` | `string` | No | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:73` |
| `cuerpo.campos[].obligatorio` | `boolean` | No | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:74` |
| `cuerpo.campos[].restricciones` | `array<string>` | No | — | — | Restricciones leídas del DTO (formato, longitud, rango…) | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:79` |
| `cuerpo.campos[].descripcion` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:80` |
| `cuerpo.campos[].ejemplo` | `object` | No | — | — | Ejemplo sintético | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:81` |
| `cuerpo.campos[].fuente` | `object` | No | admite null | — | archivo:línea del campo | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:86` |
| `cuerpo.payloadMinimo` | `object` | No | — | — | Sólo los campos obligatorios, con valores de ejemplo sintéticos | sin fuente |
| `respuesta` | `RespuestaContratoDto` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:185` |
| `respuesta.tipoRetorno` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:152` |
| `respuesta.dto` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:153` |
| `respuesta.httpCode` | `object` | No | admite null | — | Código de éxito declarado con @HttpCode | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:158` |
| `respuesta.campos` | `array<CampoDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:159` |
| `respuesta.campos[].campo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:72` |
| `respuesta.campos[].tipo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:73` |
| `respuesta.campos[].obligatorio` | `boolean` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:74` |
| `respuesta.campos[].restricciones` | `array<string>` | Sí | — | — | Restricciones leídas del DTO (formato, longitud, rango…) | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:79` |
| `respuesta.campos[].descripcion` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:80` |
| `respuesta.campos[].ejemplo` | `object` | No | — | — | Ejemplo sintético | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:81` |
| `respuesta.campos[].fuente` | `object` | No | admite null | — | archivo:línea del campo | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:86` |
| `respuestasPosibles` | `array<RespuestaPosibleDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:187` |
| `respuestasPosibles[].estado` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:118` |
| `respuestasPosibles[].codigo` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:119` |
| `respuestasPosibles[].causas` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:120` |
| `datos` | `array<TablaOperacionDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:188` |
| `datos[].schema` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:97` |
| `datos[].tabla` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:98` |
| `datos[].operacion` | `string` | Sí | valores: LEE, ESCRIBE, BORRA | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:99` |
| `datos[].detalle` | `string` | Sí | — | — | CREA, ACTUALIZA, GUARDA, BORRA o LEE | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:101` |
| `datos[].confianza` | `string` | Sí | valores: DIRECTA, POR_TIPO, POR_REGISTRO, POR_SQL | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:103` |
| `datos[].via` | `array<string>` | Sí | — | — | Camino handler → servicio → repositorio | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:108` |
| `datos[].fuente` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:109` |
| `datos[].catalogada` | `boolean` | Sí | — | — | `false` si es una vista u objeto que no es una tabla del catálogo | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:114` |
| `eventos` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:189` |
| `trabajos` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:190` |
| `noResuelto` | `array<string>` | Sí | — | — | Llamadas cuyo destino depende de un dato en ejecución: no se siguieron | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:196` |
| `sinTablas` | `object` | No | admite null | — | Por qué no toca tablas, si está curado a mano | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:201` |
| `pruebas` | `array<PruebaDto>` | Sí | — | — | Pruebas que mencionan la operación (búsqueda textual, no cobertura) | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:207` |
| `pruebas[].tipo` | `string` | Sí | valores: CONTROLADOR, INTEGRACION | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:124` |
| `pruebas[].archivo` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:125` |
| `pruebas[].linea` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:126` |
| `revision` | `string` | Sí | — | — | `AUTO_DETECTADA` hasta que una persona la revise | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:211` |
| `datosPersonales` | `string` | Sí | — | — | Siempre `SIN_FUENTE` mientras no exista una clasificación de datos personales | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:216` |

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

## 46. GET /admin/portal/operaciones/{id}/arbol

- **Origen:** CONTRATO
- **Nombre:** Ver el árbol de decisión de una operación
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.arbol` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:96`

### Qué es y para qué sirve (negocio)

Ver el árbol de decisión de una operación. Caso de uso UC-67-04: Árbol de decisión de una operación.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:62`)

### Cómo se atiende (sistema)

`GET /admin/portal/operaciones/{id}/arbol` la atiende `AdminPortalController.arbol` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:96). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.arbolDeOperacion`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:96` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:96` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `ArbolDto` · DTO `ArbolDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:220` |
| `nodos` | `array<object>` | Sí | — | — | Nodos del árbol: ACCESO, SI, SEGUN, BUCLE, INTENTAR, TRANSACCION, LLAMADA, ERROR, EFECTO, EVENTO, TRABAJO, RESPUESTA | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:227` |
| `respuestas` | `array<RespuestaPosibleDto>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:229` |
| `respuestas[].estado` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:118` |
| `respuestas[].codigo` | `object` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:119` |
| `respuestas[].causas` | `array<string>` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:120` |
| `truncado` | `boolean` | Sí | — | — | `true` si el árbol se cortó por tope de nodos | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:231` |

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

## 47. GET /admin/portal/version

- **Origen:** CONTRATO
- **Nombre:** Versión y tamaño del inventario publicado
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminPortalController.version` — `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:68`

### Qué es y para qué sirve (negocio)

Versión y tamaño del inventario publicado. Caso de uso UC-67-01: Versión y huella del inventario servido.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/data_catalog/README.md:59`)

### Cómo se atiende (sistema)

`GET /admin/portal/version` la atiende `AdminPortalController.version` (src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:68). Exige sesión con alguno de los roles ...PORTAL_VIEW_ROLES. Delega en `PortalInventoryService.version`. No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...PORTAL_VIEW_ROLES | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:68` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/admin-portal.controller.ts:68` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Lee los JSON del inventario generado (`inventario/`), cargados en memoria por `InventoryRepository`; no consulta la base de datos.. _(manual, 2026-10-21; fuente: `src/modules/data_catalog/infrastructure/repositories/inventory.repository.ts:44`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `PortalVersionDto` · DTO `PortalVersionDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `hash` | `string` | Sí | — | — | Huella del inventario: cambia cuando cambia su contenido | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:8` |
| `operaciones` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:9` |
| `procesos` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:10` |
| `tablas` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:11` |
| `columnas` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:12` |
| `origen` | `string` | Sí | — | — | Directorio del que se leyó el inventario, relativo al proceso | `src/modules/data_catalog/presentation/dto/portal-response.dto.ts:17` |

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

## 48. POST /internal/catalog/fit/run

- **Origen:** CONTRATO
- **Nombre:** Corre la sonda de ajuste y espera su desenlace (worker)
- **Bloque:** —
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InternalCatalogFitController.run` — `src/modules/data_catalog/presentation/controllers/catalog-fit.controller.ts:109`

### Qué es y para qué sirve (negocio)

Corre la sonda de ajuste y espera su desenlace (worker).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /internal/catalog/fit/run` la atiende `InternalCatalogFitController.run` (src/modules/data_catalog/presentation/controllers/catalog-fit.controller.ts:109). Exige sesión con alguno de los roles SYSTEM. Delega en `CatalogFitService.requestAndWait`. Crea filas en data_catalog.catalog_fit_runs. Borra de data_catalog.catalog_fit_runs. Lee data_catalog.catalog_annotations, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_operations, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/data_catalog/presentation/controllers/catalog-fit.controller.ts:109` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/catalog-fit.controller.ts:109` |
| CABECERA | Idempotency-Key (opcional) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | InternalCatalogFitController.run → CatalogFitService.requestAndWait → CatalogFitService.request → CatalogFitService.execute → FitInputsCollector.collect → FitLiveRepository.liveObjects | `src/modules/data_catalog/application/fit/fit-live.repository.ts:57` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | InternalCatalogFitController.run → CatalogFitService.requestAndWait → CatalogFitService.request → CatalogFitService.execute → FitInputsCollector.collect → FitLiveRepository.liveObjects | `src/modules/data_catalog/application/fit/fit-live.repository.ts:57` |
| `data_catalog.catalog_fit_runs (vista u objeto no catalogado)` | BORRA | BORRA | POR_SQL | InternalCatalogFitController.run → CatalogFitService.requestAndWait → CatalogFitService.request → CatalogFitService.execute → CatalogFitService.persist → FitRunsRepository.purgeBefore | `src/modules/data_catalog/application/fit/fit-runs.repository.ts:102` |
| `data_catalog.catalog_fit_runs (vista u objeto no catalogado)` | ESCRIBE | CREA | POR_SQL | InternalCatalogFitController.run → CatalogFitService.requestAndWait → CatalogFitService.request → CatalogFitService.execute → CatalogFitService.persist → FitRunsRepository.save | `src/modules/data_catalog/application/fit/fit-runs.repository.ts:74` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | InternalCatalogFitController.run → CatalogFitService.requestAndWait → CatalogFitService.request → CatalogFitService.execute → FitInputsCollector.collect → FitLiveRepository.liveObjects | `src/modules/data_catalog/application/fit/fit-live.repository.ts:42` |
| `data_catalog.catalog_operations` | LEE | LEE | POR_SQL | InternalCatalogFitController.run → CatalogFitService.requestAndWait → CatalogFitService.request → CatalogFitService.execute → FitInputsCollector.collect → FitLiveRepository.importedOperations | `src/modules/data_catalog/application/fit/fit-live.repository.ts:153` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | InternalCatalogFitController.run → CatalogFitService.requestAndWait → CatalogFitService.request → CatalogFitService.execute → FitInputsCollector.collect → FitLiveRepository.scanState | `src/modules/data_catalog/application/fit/fit-live.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `Idempotency-Key` | header | No | `string` | Una clave por ventana de tick: un reintento dentro de la ventana no crea otra corrida |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<FitRunResultDto>` · DTO `FitRunResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `runId` | `string` | Sí | formato uuid | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:233` |
| `status` | `string` | Sí | valores: EN_CURSO, COMPLETADA, FALLIDA | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:234` |
| `created` | `boolean` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:235` |
| `verdict` | `string` | No | valores: AJUSTADA, CON_AVISOS, DESAJUSTADA, SIN_DATOS | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:236` |
| `failedChecks` | `number` | No | — | — | Comprobaciones que fallaron | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:238` |
| `blindSpots` | `number` | No | — | — | Comprobaciones que no pudieron medir | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:240` |
| `errorCode` | `string` | No | admite null | — | — | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:241` |
| `persisted` | `boolean` | No | — | — | Si el desenlace quedó en data_catalog.catalog_fit_runs | `src/modules/data_catalog/presentation/dto/catalog-fit.dto.ts:246` |

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

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:InternalCatalogFitController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 49. POST /internal/catalog/inventory/import

- **Origen:** CONTRATO
- **Nombre:** Importa el inventario de la API a las tablas de operaciones y procesos (worker)
- **Bloque:** —
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InternalCatalogInventoryController.importInventory` — `src/modules/data_catalog/presentation/controllers/internal-catalog.controller.ts:59`

### Qué es y para qué sirve (negocio)

Importa el inventario de la API a las tablas de operaciones y procesos (worker).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /internal/catalog/inventory/import` la atiende `InternalCatalogInventoryController.importInventory` (src/modules/data_catalog/presentation/controllers/internal-catalog.controller.ts:59). Exige sesión con alguno de los roles SYSTEM. Delega en `InventoryImportService.importInventory`. Crea filas en data_catalog.catalog_operation_impacts, data_catalog.catalog_operations, data_catalog.catalog_process_step_operations, data_catalog.catalog_process_steps, data_catalog.catalog_processes. Actualiza data_catalog.catalog_operations, data_catalog.catalog_processes. Borra de data_catalog.catalog_operation_impacts, data_catalog.catalog_process_step_operations, data_catalog.catalog_process_steps. Lee data_catalog.catalog_objects, data_catalog.catalog_operations, data_catalog.catalog_process_step_operations, data_catalog.catalog_process_steps, data_catalog.catalog_processes.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/data_catalog/presentation/controllers/internal-catalog.controller.ts:59` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/internal-catalog.controller.ts:59` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.known | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:76` |
| `data_catalog.catalog_operation_impacts` | BORRA | BORRA | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.deleteImpactsOf | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:229` |
| `data_catalog.catalog_operation_impacts` | ESCRIBE | CREA | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.insertImpacts | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:244` |
| `data_catalog.catalog_operations` | ESCRIBE | CREA | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.insertOperations | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:168` |
| `data_catalog.catalog_operations` | ESCRIBE | ACTUALIZA | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.updateOperations | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:190` |
| `data_catalog.catalog_operations` | LEE | LEE | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.known | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:70` |
| `data_catalog.catalog_process_step_operations` | BORRA | BORRA | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.deleteStepsOf | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:315` |
| `data_catalog.catalog_process_step_operations` | ESCRIBE | CREA | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.insertStepOperations | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:369` |
| `data_catalog.catalog_process_step_operations` | LEE | LEE | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.known | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:106` |
| `data_catalog.catalog_process_steps` | BORRA | BORRA | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.deleteStepsOf | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:322` |
| `data_catalog.catalog_process_steps` | ESCRIBE | CREA | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.insertSteps | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:338` |
| `data_catalog.catalog_process_steps` | LEE | LEE | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.known | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:102` |
| `data_catalog.catalog_processes` | ESCRIBE | CREA | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.insertProcesses | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:281` |
| `data_catalog.catalog_processes` | ESCRIBE | ACTUALIZA | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.updateProcesses | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:298` |
| `data_catalog.catalog_processes` | LEE | LEE | POR_SQL | InternalCatalogInventoryController.importInventory → InventoryImportService.importInventory → CatalogInventoryRepository.known | `src/modules/data_catalog/infrastructure/repositories/catalog-inventory.repository.ts:90` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<InventoryImportResultDto>` · DTO `InventoryImportResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `inventory` | `InventoryImportSourceDto` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:537` |
| `inventory.hash` | `string` | Sí | — | — | Huella del inventario (la misma de `GET /admin/portal/version`) | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:471` |
| `inventory.operaciones` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:472` |
| `inventory.procesos` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:473` |
| `operations` | `InventoryImportOperationsDto` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:539` |
| `operations.added` | `number` | Sí | — | — | Operaciones nuevas en la base | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:477` |
| `operations.changed` | `number` | Sí | — | — | Operaciones cuya huella técnica cambió | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:479` |
| `operations.reappeared` | `number` | Sí | — | — | Operaciones `NOT_OBSERVED` que volvieron a aparecer | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:483` |
| `operations.unchanged` | `number` | Sí | — | — | Operaciones que no cambiaron: no se tocó su fila | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:487` |
| `operations.notObserved` | `number` | Sí | — | — | Operaciones que dejaron de aparecer y pasaron a `NOT_OBSERVED` (no se borran) | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:492` |
| `impacts` | `InventoryImportImpactsDto` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:541` |
| `impacts.written` | `number` | Sí | — | — | Impactos escritos en esta corrida | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:497` |
| `impacts.skippedNotCataloged` | `number` | Sí | — | — | Tablas que el inventario no tiene catalogadas y la sonda tampoco observó (estado actual, no sólo esta corrida) | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:502` |
| `impacts.skippedUnresolved` | `number` | Sí | — | — | Tablas que el inventario da por catalogadas y la sonda aún no observó: correr un escaneo y volver a importar | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:507` |
| `processes` | `InventoryImportProcessesDto` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:543` |
| `processes.added` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:511` |
| `processes.changed` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:512` |
| `processes.unchanged` | `number` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:513` |
| `steps` | `InventoryImportStepsDto` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:545` |
| `steps.written` | `number` | Sí | — | — | Etapas escritas en esta corrida | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:518` |
| `stepOperations` | `InventoryImportStepOperationsDto` | Sí | — | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:547` |
| `stepOperations.written` | `number` | Sí | — | — | Enlaces etapa-operación escritos | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:523` |
| `stepOperations.skippedUnresolved` | `number` | Sí | — | — | Enlaces cuya operación no está en el inventario de endpoints | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:527` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta el directorio {relative}.; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`.; ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`… |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/data-catalog-inventory-import.int-spec.ts:58` |

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:InternalCatalogInventoryController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 50. POST /internal/catalog/scans/run-next

- **Origen:** CONTRATO
- **Nombre:** Sonda: reclama y ejecuta el siguiente escaneo (worker)
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InternalCatalogScansController.runNext` — `src/modules/data_catalog/presentation/controllers/internal-catalog.controller.ts:30`

### Qué es y para qué sirve (negocio)

Sonda: reclama y ejecuta el siguiente escaneo (worker).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /internal/catalog/scans/run-next` la atiende `InternalCatalogScansController.runNext` (src/modules/data_catalog/presentation/controllers/internal-catalog.controller.ts:30). Exige sesión con alguno de los roles SYSTEM. Delega en `CatalogScanService.runNext`. Crea filas en data_catalog.catalog_annotation_revisions, data_catalog.catalog_annotations, data_catalog.catalog_change_events, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs. Actualiza data_catalog.catalog_annotations, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs. Lee data_catalog.catalog_annotations, data_catalog.catalog_change_events, data_catalog.catalog_columns, data_catalog.catalog_objects, data_catalog.catalog_scan_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/data_catalog/presentation/controllers/internal-catalog.controller.ts:30` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/data_catalog/presentation/controllers/internal-catalog.controller.ts:30` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotation_revisions` | ESCRIBE | CREA | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogScanService.runClaimed → CatalogScanService.execute → CatalogScanService.classifyInBackground → CatalogClassificationService.classifyScan → CatalogClassificationService.runScope → CatalogClassificationService.classifyOne → CatalogClassificationService.create → CatalogRepository.insertRevision | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:830` |
| `data_catalog.catalog_annotations` | ESCRIBE | CREA | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogScanService.runClaimed → CatalogScanService.execute → CatalogScanService.classifyInBackground → CatalogClassificationService.classifyScan → CatalogClassificationService.runScope → CatalogClassificationService.classifyOne → CatalogClassificationService.create → CatalogRepository.insertAnnotation | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:715` |
| `data_catalog.catalog_annotations` | ESCRIBE | ACTUALIZA | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogScanService.runClaimed → CatalogScanService.execute → CatalogScanService.classifyInBackground → CatalogClassificationService.classifyScan → CatalogClassificationService.runScope → CatalogClassificationService.classifyOne → CatalogClassificationService.raise → CatalogRepository.updateAnnotation | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:775` |
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogScanService.runClaimed → CatalogScanService.execute → CatalogScanService.classifyInBackground → CatalogClassificationService.classifyScan → CatalogClassificationService.runScope → CatalogRepository.annotationsOfColumns | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:395` |
| `data_catalog.catalog_change_events` | ESCRIBE | CREA | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogScanService.runClaimed → CatalogScanService.execute → CatalogRepository.applyScan | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:1342` |
| `data_catalog.catalog_change_events` | LEE | LEE | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogScanService.runClaimed → CatalogScanService.execute → CatalogScanService.classifyInBackground → CatalogClassificationService.classifyScan → CatalogClassificationService.runScope → CatalogRepository.columnsToClassify | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:417` |
| `data_catalog.catalog_columns` | ESCRIBE | CREA | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogScanService.runClaimed → CatalogScanService.execute → CatalogRepository.applyScan | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:1269` |
| `data_catalog.catalog_columns` | ESCRIBE | ACTUALIZA | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogScanService.runClaimed → CatalogScanService.execute → CatalogRepository.applyScan | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:1290` |
| `data_catalog.catalog_columns` | LEE | LEE | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogScanService.runClaimed → CatalogScanService.execute → CatalogRepository.knownObjects | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:1133` |
| `data_catalog.catalog_objects` | ESCRIBE | CREA | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogScanService.runClaimed → CatalogScanService.execute → CatalogRepository.applyScan | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:1236` |
| `data_catalog.catalog_objects` | ESCRIBE | ACTUALIZA | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogScanService.runClaimed → CatalogScanService.execute → CatalogRepository.applyScan | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:1257` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogScanService.runClaimed → CatalogScanService.execute → CatalogRepository.knownObjects | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:1120` |
| `data_catalog.catalog_scan_runs` | ESCRIBE | ACTUALIZA | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogRepository.failAbandoned | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:966` |
| `data_catalog.catalog_scan_runs` | ESCRIBE | CREA | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogScanService.request → CatalogRepository.insertScan | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:991` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | InternalCatalogScansController.runNext → CatalogScanService.runNext → CatalogRepository.activeScan | `src/modules/data_catalog/infrastructure/repositories/catalog.repository.ts:952` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RunNextResultDto>` · DTO `RunNextResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `claimed` | `number` | Sí | valores: 0, 1 | — | 1 si este tick tomó un escaneo; 0 si no había nada que hacer | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:455` |
| `scanId` | `string` | No | formato uuid | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:456` |
| `status` | `string` | No | valores: QUEUED, RUNNING, SUCCEEDED, FAILED, CANCELLED | — | — | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:457` |
| `fenced` | `boolean` | No | — | — | `true` si el escaneo perdió su lease y no se pisó lo que otro proceso cerró | `src/modules/data_catalog/presentation/dto/catalog-response.dto.ts:462` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya hay un escaneo en curso de esta fuente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ScanFenced |

El árbol de decisión completo está en [flujos](../flujos/data_catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 67 — Catálogo de datos y portal administrativo — etapa `ctrl:InternalCatalogScansController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

