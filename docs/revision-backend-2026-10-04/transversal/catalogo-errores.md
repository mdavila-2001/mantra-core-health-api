# Revisión transversal — catálogo de errores

Fecha: 2026-10-05. Rama: `pablo/revision-backend-2026-10-04`. Base observada: el worktree indicado para esta auditoría. Alcance: contrato HTTP de `DomainException`/`ErrorCode`/`reason`, filtro global, catálogos y rutas de falla en `src/`. **Revisión documental; no se modificó el runtime.**

## 1. Alcance y cobertura real

Se leyeron íntegros `src/common/errors/domain.exception.ts`, `error-codes.ts`, `src/common/filters/all-exceptions.filter.ts` y sus dos specs; se verificó el registro del filtro en `src/app.module.ts:254`. Se buscaron archivos `*error-reasons.ts`, referencias a `system-error-reasons`, lanzamientos directos de `Error` y excepciones HTTP en los **3.945 archivos `.ts` no spec** de `src/`, que contienen **70 directorios de módulo**. Se siguieron manualmente rutas representativas de `insurance`, `qa_execution`, `common`, `forms` y la capa de tenant. El barrido de texto halló **71** lanzamientos directos `new Error(...)` y **176** lanzamientos de excepciones importadas directamente de `@nestjs/common`; son **candidatos**, no 247 defectos confirmados: incluyen configuración, workers, invariantes internos y rutas interceptadas. El conteo se hizo sobre código no spec, con `throw new`, y no incluye `Promise.reject`, lanzamientos indirectos, errores de librerías, alias de importación ni todas las ramas de cada endpoint. Los 70 módulos se inventariaron por presencia de archivos de catálogo, pero **no** se inspeccionaron de extremo a extremo los servicios de cada uno; no se afirma un inventario semántico completo de cada ruta HTTP/job.

No se ejecutó la suite completa, no se probó una base real ni se verificó la salida de logs de producción. Los **dos specs dirigidos** del filtro pasaron con el script del proyecto: 2 suites y 32 tests, salida 0. Una invocación directa de `corepack yarn jest` sin el flag de VM Modules falló al cargar MikroORM; no es el comando de prueba del proyecto y no se cuenta como rojo de la suite. El plan externo solicitado ya existe en disco (`PLAN-REVISION-BACKEND-ALOVIDA-para-codex.md`); la instrucción de esta unidad restringe la escritura a este archivo, por lo que éste hace también de reporte de la auditoría y no se crean los `PLAN.md`/`REPORTE.md` adicionales pedidos por el `AGENTS.md` general del worktree. Esta divergencia documental deberá resolverse en la integración global.

## 2. Resumen ejecutivo

| Severidad | Hallazgos confirmados | Lente |
|---|---:|---|
| Alta | 3 (`ERR-01`, `ERR-02`, `ERR-03`) | Contrato, rutas HTTP, registro de errores |
| Media | 2 (`ERR-04`, `ERR-05`) | Código/status, error interno de dominio |
| Crítica / baja | 0 / 0 | No hay evidencia suficiente para elevar un caso a pérdida de datos confirmada |

El cuerpo que construye el filtro tiene `code`, `message`, `details`, `correlationId`, `timestamp` y `path`, pero **no un campo `reason` obligatorio** (`src/common/filters/all-exceptions.filter.ts:46-72,164-171`). `DomainException` admite `details?` y serializa `{ code, message, details }` (`src/common/errors/domain.exception.ts:22-29`); sus subclases fijan status y code, no reason. El filtro sí evita la fuga de detalles a respuestas 5xx no autorizadas y traduce varias excepciones del ORM/driver; esa protección existente se conserva en cualquier corrección.

## 3. Mapa del contrato y del inventario

| Superficie | Estado observado |
|---|---|
| HTTP global | `APP_FILTER` registra `AllExceptionsFilter` (`src/app.module.ts:254`). Se aplica a controladores Nest; **no** convierte por sí mismo fallas de workers ni de arranque. |
| Excepción de dominio | `DomainException(status, code, message, details?)`; subclases: 401/`UNAUTHENTICATED`, 403/`IDENTITY_VERIFICATION_REQUIRED`, 404/`NOT_FOUND`, 409/`CONFLICT` y `CONCURRENCY_CONFLICT`, 422/`PRECONDITION_FAILED` (`src/common/errors/domain.exception.ts:32-145`). |
| Códigos | 18 valores en `ErrorCode`, desde `VALIDATION_FAILED` hasta `INTERNAL` (`src/common/errors/error-codes.ts:6-69`). `reason` no figura en ese enum y debe tener catálogo separado. |
| Nest genérico | Si es `HttpException`, el filtro conserva status y deriva `code` por status si no está en el cuerpo; copia `details` si existe (`src/common/filters/all-exceptions.filter.ts:270-283,404-429`). No comprueba `reason`. |
| MikroORM | Optimistic lock → 409/`CONCURRENCY_CONFLICT`; unique → 409/`CONFLICT`; FK → 422/`PRECONDITION_FAILED`; NOT NULL/CHECK → 400/`VALIDATION_FAILED`; deadlock → 409/`CONCURRENCY_CONFLICT`; connection → 503/`DEPENDENCY_UNAVAILABLE` (`src/common/filters/all-exceptions.filter.ts:285-315,457-517`). Ninguna traducción añade `reason`. |
| PostgreSQL crudo | SQLSTATE `23503`, `23505`, `23P01`, `23502`, `23514`, `22P02`, `40001`, `40P01`, `55P03`, `57014`, `53300`, `53200`, `57P03` están mapeados (`src/common/filters/all-exceptions.filter.ts:559-640`). Los demás van a 500/`INTERNAL`; no se presume que sean todos errores de negocio. |
| Middleware HTTP | Error con status 4xx se mapea por status, con mensaje fijo; error 5xx no tipado se opaca como 500/`INTERNAL` (`src/common/filters/all-exceptions.filter.ts:325-345,369-390`). |
| Catálogos | Búsqueda de `src/**/*error-reasons.ts` y de `system-error-reasons` en `.ts`: **0 archivos, 0 referencias** en esta rama. Hay razones locales, por ejemplo `TENANT_REQUIRED`, `ALREADY_DECIDED`, `URL_EXPIRED` y `SELF_APPROVAL`; no equivalen a un catálogo común verificado. |

**Clasificación modular de candidatos `throw new` directos.** El número es de lanzamientos importados de Nest, no de endpoints defectuosos. Módulos con más candidatos: `common` (28, agrega `src/common` y `src/modules/common`), `iam` (22), `insurance` (22), `scheduling` (15), `chart` (11), `time_series` (10), `community` (9), `clinical` (8), `pharmacy` (7), `profiles` (7), `forms` (6). Con 1–4: `accounting`, `automation`, `clinical_ext`, `diagnostics`, `directory`, `document_store`, `object_storage`, `pharmacy_inventory`, `public`, `redis_runtime`, `search_platform`, `surveys`, `system_context`, `terminology`, `workflow`. Las demás carpetas no dieron un lanzamiento importado directamente de Nest con este patrón; **sí pueden contener** `DomainException` sin reason, errores indirectos o fallas de driver. En los 70 directorios no hay un archivo `<modulo>.error-reasons.ts`.

Rutas confirmadas para la matriz: `POST /insurance/campaigns` y alias (`src/modules/insurance/controllers/insurance-campaigns.controller.ts:55-67`), `PATCH /insurance/campaigns/:id/status` (`:146-157`), `GET /insurance/campaigns/:id` (`:135-144`) y `POST /admin/qa/plans/:planId/approvals` (`src/modules/qa_execution/controllers/qa-execution.controller.ts:54,129-140`; se muestra la ruta del controlador, sujeta a prefijo global de API). **No se construyó una lista de todos los endpoints de `src/`**: excede la cobertura manual de esta unidad transversal.

## 4. Hallazgos verificados y refutación adversarial

### ERR-01 · Alta · Contrato transversal y 70 módulos: no se exige razón catalogada

**Evidencia:** `src/common/errors/domain.exception.ts:22-29`: `public readonly details?: Record<string, unknown>` y `super({ code, message, details }, status)`. `src/common/filters/all-exceptions.filter.ts:164-171` crea `body` sin `reason`; `:270-283` retorna `details` opcionales sin validar `details.reason`. Búsqueda literal de `*error-reasons.ts` y `system-error-reasons`: 0. Un `new ResourceNotFoundException('Campaña no encontrada', { id })` en `src/modules/insurance/services/insurance-campaigns.service.ts:463-468` llega como **404 / `NOT_FOUND` / reason ausente**. Impacto: el cliente sólo puede distinguir ese subcaso por mensaje o contexto; la política solicitada de `reason` estable no se cumple. Escenario: GET de campaña propia inexistente.

**Intento de refutación:** se inspeccionó el filtro global, no sólo la clase; no sintetiza reason. Sí existen reasons locales en `details` (p. ej., `src/modules/forms/services/form-instance-origin.validator.ts:50-73`), pero son optativos y no invalidan el caso sin reason. No se declara que **todas** las respuestas carezcan de reason.

**Plan (M):** (1) definir `system-error-reasons.ts` y catálogo por módulo con identificadores de razón estables, sin poner IDs ni datos de salud en el valor; (2) exigir `reason` tipado en las fábricas/constructores de errores de negocio, con migración gradual de call sites; (3) normalizar `details.reason` para compatibilidad o publicar un campo de primer nivel versionado, manteniendo un solo valor canónico; (4) añadir aserciones de status + code + reason a specs de filtro y controladores; (5) documentar la transición de contrato para consumidores. No asignar un reason genérico para ocultar subcasos distintos.

### ERR-02 · Alta · `insurance`, `iam`, `scheduling`, `common` y otros: rechazos Nest sin razón de negocio

**Evidencia:** `src/modules/insurance/services/insurance-campaigns.service.ts:193-196` lanza `new BadRequestException('validTo debe ser igual o posterior a validFrom')`; `:505-508` lanza `new ForbiddenException('La cuenta no tiene un perfil de paciente asociado')`. `src/common/auth/roles.guard.ts:83-85` lanza `new ForbiddenException('Rol insuficiente para la operación')`. El filtro deriva, respectivamente, **400 / `VALIDATION_FAILED` / reason ausente** y **403 / `FORBIDDEN` / reason ausente** (`src/common/filters/all-exceptions.filter.ts:270-283,404-417`). El barrido estático identificó 176 lanzamientos directos de excepciones importadas de Nest en código no spec; son candidatos para migración, no 176 hallazgos independientes.

**Intento de refutación:** el filtro global **sí** da `code` y status correctos en esos ejemplos, por lo que no se reporta 500 ni pérdida de `ErrorCode`. `@Roles`/guards no añaden reason después de la excepción. Algunos usos explícitos de Nest sí incluyen `{ details: { reason } }` (p. ej. `src/common/tenant/tenant-resolution.ts:49-59`), por lo que la regla afecta rutas concretas y debe migrarse caso por caso.

**Plan (L):** (1) registrar cada caso HTTP candidato con ruta, tipo de import, rama y valor de status/code existente; (2) priorizar guards y endpoints de alto tráfico; (3) sustituir excepciones Nest de negocio por la subclase `DomainException` adecuada con reason catalogado, sin cambiar el status preexistente salvo corrección justificada; (4) usar razones `INSURANCE_CAMPAIGN_DATE_RANGE_INVALID`, `INSURANCE_PATIENT_PROFILE_REQUIRED`, `AUTH_ROLE_INSUFFICIENT` para los tres ejemplos, sujetas a revisión de nomenclatura; (5) mantener un adaptador para rechazos de infraestructura de Nest y ValidationPipe con reason de sistema; (6) añadir pruebas dirigidas antes de migrar el siguiente grupo.

### ERR-03 · Alta · Filtro global: `detail` y excepción completa pueden entrar al log

**Evidencia:** `src/common/filters/all-exceptions.filter.ts:552-557` copia `causa.detail` a `internals`; `:197-212` registra `integrity: internals` en `logger.warn`; `:180-190` registra `{ err: exception }` completo para 5xx. `:695-709` reconoce expresamente que `detail` de PostgreSQL puede incluir el valor de la clave que falló. Impacto: una restricción sobre un valor clínico o identificador personal puede persistirlo en logs aunque la respuesta HTTP lo omita. Escenario: SQLSTATE `23505` con `detail` de clave duplicada; la respuesta queda 409/`CONFLICT`/reason ausente, pero el log recibe `detail`.

**Intento de refutación:** `:191-195` limpia el cuerpo 5xx y `:303`, `:575-579` no exponen `internals` en el JSON; el spec `src/common/filters/all-exceptions.database.spec.ts:168-193` verifica que la restricción queda sólo en el log. Esto **limita** el problema al registro, no lo elimina. No se constató PHI real en un log de producción; la severidad alta expresa una ruta capaz de registrar datos sensibles, no una filtración histórica comprobada.

**Plan (M):** (1) eliminar `detail` y cualquier valor de clave de `constraintInternals`/`integrityViolation`; (2) definir una lista permitida de metadatos de diagnóstico sin datos de fila y examinar también la serialización `{ err: exception }` para 5xx; (3) conservar `correlationId`, status, `code` y reason seguro; (4) probar con una marca sintética de dato sensible en `detail`, `message` y `cause`, afirmando ausencia en `warn`/`error` y en JSON; (5) revisar política de retención de logs ya existentes fuera de este cambio de código. La prueba actual de que `integrity` incluye campos internos debe reemplazarse por una aserción de redacción **sin borrar la prueba**.

### ERR-04 · Media · `common/files`: 410 usa código asociado a 422 y reason local

**Evidencia:** `src/modules/common/services/files.service.ts:702-710` lanza `new GoneException({ code: ErrorCode.PRECONDITION_FAILED, message: 'La URL de descarga venció', details: { reason: 'URL_EXPIRED' } })`. El filtro preserva el status 410 y el code dado (`src/common/filters/all-exceptions.filter.ts:270-280`), mientras la subclase `PreconditionFailedException` define 422/`PRECONDITION_FAILED` (`src/common/errors/domain.exception.ts:106-123`). Resultado actual exacto: **410 / `PRECONDITION_FAILED` / `URL_EXPIRED`**. Impacto: un cliente que trata el code como equivalente a precondición 422 puede clasificar incorrectamente una URL vencida.

**Intento de refutación:** el reason local sí distingue el caso y el código conserva compatibilidad; el comentario del propio servicio (`:703-706`) reconoce que falta un código para 410. No se afirma que la descarga esté rota. El desajuste es contractual, no de disponibilidad.

**Plan (S):** (1) introducir `ErrorCode.RESOURCE_GONE` o nombre acordado para 410 y `FILES_DOWNLOAD_URL_EXPIRED` como reason catalogado; (2) cambiar sólo esta rama y comunicar el cambio de code a consumidores; (3) añadir prueba exacta 410/`RESOURCE_GONE`/`FILES_DOWNLOAD_URL_EXPIRED`; (4) buscar otros 410 y documentar compatibilidad. Si la API debe conservar `PRECONDITION_FAILED`, documentar explícitamente la excepción al mapeo status/code en vez de afirmar uniformidad.

### ERR-05 · Media · `insurance`: inconsistencia de catálogo persistido termina en 500 opaco

**Evidencia:** `src/modules/insurance/services/insurance-campaigns.service.ts:148-157` hace `throw new Error(\`Concepto de ${what} desconocido: ${conceptId}\`)` cuando falta una clave de conversión. La función se llama al transformar filas en `toResponse` (`:773-791`), que usa `GET /insurance/campaigns/:id` (`:457-468`, controlador `:135-144`) y otras lecturas. Una fila con `campaign_type_concept_id` o `status_concept_id` sin correspondencia causa **500 / `INTERNAL` / reason ausente** por `src/common/filters/all-exceptions.filter.ts:340-345`. El mensaje interno no llega al cliente, pero el error queda sin razón diagnóstica estable.

**Intento de refutación:** las constantes de catálogo y validaciones pueden evitar el caso en escrituras normales; no se encontró evidencia de filas corruptas existentes. La ruta es real **si** entra una fila con concepto no mapeado, por deriva de datos, importación o migración. No corresponde cambiarla a 4xx: el cliente no puede corregir un concepto persistido ajeno a su request. El código `Error` no filtra el `conceptId` al cliente gracias al filtro; el log 5xx requiere la redacción de `ERR-03`.

**Plan (M):** (1) tipar un error interno de integridad de catálogo con reason seguro `INSURANCE_CAMPAIGN_CONCEPT_UNMAPPED`, sin `conceptId` ni descripción de paciente en la respuesta; (2) añadir al filtro una política explícita para publicar sólo el reason interno permitido conservando **500 / `INTERNAL`** y mensaje genérico; (3) validar en lectura/migración la correspondencia de conceptos y añadir alarma agregada sin valores clínicos; (4) probar la fila sintética sin mapeo y la fila correcta; (5) no convertir el caso en `422` de entrada del usuario.

## 5. Pruebas por hallazgo — cuatro puntos

Los archivos propuestos son nuevos; **ninguna de estas pruebas fue ejecutada**. En las filas de “falla catalogada”, `reason` es el valor **objetivo**, y se distingue del valor actual donde difiere. Para no presentar cambios de código como existentes, las demás filas también dicen qué se comprobaría tras implementar el plan.

| Hallazgo | Punto | Nivel / spec propuesto | Preparación y entrada exacta | Resultado esperado tras corrección |
|---|---|---|---|---|
| ERR-01 | Correcto | e2e `test/e2e/error-contract.e2e-spec.ts` | Crear campaña sintética y `GET /insurance/campaigns/{id}` con tenant autorizado | 200 y objeto propio, sin cuerpo de error |
| ERR-01 | Límite | unit `src/common/errors/domain.exception.spec.ts` | Construir `ResourceNotFoundException` con razón válida del catálogo de insurance | Constructor acepta exactamente la razón; no acepta cadena fuera del catálogo |
| ERR-01 | Error | unit, mismo spec | Intentar construir 404 sin reason | Compilación o fábrica rechaza la omisión; no sale respuesta 404 sin razón |
| ERR-01 | Falla catalogada | e2e `test/e2e/error-contract.e2e-spec.ts` | `GET /insurance/campaigns/{uuid-inexistente}` en tenant autorizado | **404 / `NOT_FOUND` / `INSURANCE_CAMPAIGN_NOT_FOUND`** |
| ERR-02 | Correcto | integración `src/modules/insurance/services/insurance-campaigns.service.spec.ts` | `create` con `validFrom=2026-10-05`, `validTo=2026-10-05` y actor administrador | Alta válida (201 en POST), sin razón de error |
| ERR-02 | Límite | integración, mismo spec | `create` con `validTo` igual a `validFrom` | No se rechaza por orden de fechas |
| ERR-02 | Error | unit `src/common/auth/roles.guard.spec.ts` | Usuario sin rol requerido en ruta protegida | Rechazo 403; no filtra roles internos ni datos de tenant |
| ERR-02 | Falla catalogada | e2e `test/e2e/error-contract.e2e-spec.ts` | `POST /insurance/campaigns`, `validFrom=2026-10-06`, `validTo=2026-10-05`, tenant autorizado | **400 / `VALIDATION_FAILED` / `INSURANCE_CAMPAIGN_DATE_RANGE_INVALID`** |
| ERR-03 | Correcto | unit `src/common/filters/all-exceptions.database.spec.ts` | Error de dominio seguro con `correlationId=test-1` | Status/code/reason preservados; logs sólo metadatos permitidos |
| ERR-03 | Límite | unit, mismo spec | SQLSTATE `23505`, `detail` ausente | **409 / `CONFLICT`**, no intenta serializar `detail` |
| ERR-03 | Error | unit, mismo spec | SQLSTATE `23505`, `detail='dato-sintetico-secreto'`, `cause` con igual marca | La marca no aparece en `warn`, `error` ni JSON |
| ERR-03 | Falla catalogada | unit, mismo spec | SQLSTATE `23505` de recurso con mapeo de negocio seguro | **409 / `CONFLICT` / `SYSTEM_UNIQUE_CONSTRAINT`** (o razón específica del módulo si conoce la restricción) |
| ERR-04 | Correcto | integración `src/modules/common/services/files.service.spec.ts` | URL firmada con expiración futura, archivo sintético autorizado | Descarga permitida; no devuelve error |
| ERR-04 | Límite | unit, mismo spec | `expiry == Date.now()` con reloj fijado | Política inclusiva definida y probada; sin ambigüedad de milisegundo |
| ERR-04 | Error | unit, mismo spec | Firma sintética inválida con expiración futura | **403 / `FORBIDDEN` / `FILES_DOWNLOAD_SIGNATURE_INVALID`** tras catalogar rama existente |
| ERR-04 | Falla catalogada | e2e `test/e2e/files-download.e2e-spec.ts` | URL de firma válida con `expiry=2026-10-04T00:00:00Z`; reloj `2026-10-05T00:00:00Z` | **410 / `RESOURCE_GONE` / `FILES_DOWNLOAD_URL_EXPIRED`** |
| ERR-05 | Correcto | unit `src/modules/insurance/services/insurance-campaigns.service.spec.ts` | `toResponse` con `campaign_type_concept_id` presente en `TYPE_BY_CONCEPT` | DTO correcto, sin error |
| ERR-05 | Límite | unit, mismo spec | `status_concept_id` de estado permitido pero vigencia vencida | `effectiveStatus=EXPIRED`; no lanza error de catálogo |
| ERR-05 | Error | unit, mismo spec | Fila sintética con `campaign_type_concept_id='concepto-sintetico-no-mapeado'` | Se registra incidencia sin incluir valor del concepto en respuesta ni log público |
| ERR-05 | Falla catalogada | e2e `test/e2e/insurance-campaign-errors.e2e-spec.ts` | `GET /insurance/campaigns/{id}` sobre fixture persistida con concepto no mapeado | **500 / `INTERNAL` / `INSURANCE_CAMPAIGN_CONCEPT_UNMAPPED`**, mensaje genérico |

## 6. Matriz de pruebas de la unidad completa

Esta unidad transversal no es un endpoint: se prueba el **normalizador** como método relevante y las cuatro rutas HTTP trazadas. Para el resto de endpoints y jobs de `src/` queda pendiente una matriz por módulo/worker; ésta no afirma cobertura total.

| Método/ruta relevante | Correcto | Límite | Error | Falla catalogada exacta |
|---|---|---|---|---|
| `AllExceptionsFilter.catch`: DomainException | 200 no entra al filtro | 404 con details mínimos | 404 sin reason debe ser rechazado por fábrica | 404 / `NOT_FOUND` / `INSURANCE_CAMPAIGN_NOT_FOUND` |
| `AllExceptionsFilter.catch`: ORM/driver | Error tipado FK | Causa SQLSTATE anidada a 4 niveles | SQLSTATE desconocido | 422 / `PRECONDITION_FAILED` / `SYSTEM_FOREIGN_KEY_MISSING`; desconocido: 500 / `INTERNAL` / `SYSTEM_UNEXPECTED` |
| `AllExceptionsFilter.catch`: HTTP middleware | JSON válido | cuerpo exactamente 1 MB | cuerpo mayor a 1 MB | 413 / `PAYLOAD_TOO_LARGE` / `SYSTEM_BODY_TOO_LARGE`; JSON mal formado: 400 / `VALIDATION_FAILED` / `SYSTEM_JSON_INVALID` |
| `POST /insurance/campaigns` (y alias) | fechas válidas | fechas iguales | fechas invertidas | 400 / `VALIDATION_FAILED` / `INSURANCE_CAMPAIGN_DATE_RANGE_INVALID` |
| `PATCH /insurance/campaigns/:id/status` (y alias) | transición válida | repetir estado actual | transición prohibida | 422 / `PRECONDITION_FAILED` / `INSURANCE_CAMPAIGN_TRANSITION_INVALID` |
| `GET /insurance/campaigns/:id` (y alias) | campaña propia | UUID válido ausente | concepto persistido no mapeado | 404 / `NOT_FOUND` / `INSURANCE_CAMPAIGN_NOT_FOUND`; inconsistencia: 500 / `INTERNAL` / `INSURANCE_CAMPAIGN_CONCEPT_UNMAPPED` |
| `POST /admin/qa/plans/:planId/approvals` | aprobación ajena autorizada | plan ya aprobado | hash viejo | 403 / `FORBIDDEN` / `QA_PLAN_SELF_APPROVAL`; hash viejo: 409 / `CONFLICT` / `QA_PLAN_HASH_STALE` |
| Descarga firmada de `common/files` | firma vigente | instante exacto de vencimiento | firma incorrecta | 410 / `RESOURCE_GONE` / `FILES_DOWNLOAD_URL_EXPIRED` |

El método `catch` de un filtro sólo se ejercita con excepción; “Correcto” allí significa una **excepción catalogada correctamente normalizada**, no una respuesta 2xx fabricada por el filtro. Las filas de 500 requieren un reason de lista permitida que no haga visible `message`, `details` ni el `Error` original.

## 7. Catálogo de razones a crear y auditoría de huérfanos

| Catálogo propuesto | Reason exacto | Status / code | Cuándo |
|---|---|---|---|
| Sistema | `SYSTEM_UNEXPECTED` | 500 / `INTERNAL` | Error no clasificado, sin datos de causa publicados |
| Sistema | `SYSTEM_UNIQUE_CONSTRAINT` | 409 / `CONFLICT` | `23505` sin mapeo específico seguro |
| Sistema | `SYSTEM_FOREIGN_KEY_MISSING` | 422 / `PRECONDITION_FAILED` | `23503` sin mapeo de dominio |
| Sistema | `SYSTEM_BODY_TOO_LARGE` | 413 / `PAYLOAD_TOO_LARGE` | middleware de cuerpo excesivo |
| Sistema | `SYSTEM_JSON_INVALID` | 400 / `VALIDATION_FAILED` | JSON mal formado |
| Auth | `AUTH_ROLE_INSUFFICIENT` | 403 / `FORBIDDEN` | guard de roles |
| Insurance | `INSURANCE_CAMPAIGN_NOT_FOUND` | 404 / `NOT_FOUND` | campaña propia ausente |
| Insurance | `INSURANCE_CAMPAIGN_DATE_RANGE_INVALID` | 400 / `VALIDATION_FAILED` | `validTo < validFrom` |
| Insurance | `INSURANCE_PATIENT_PROFILE_REQUIRED` | 403 / `FORBIDDEN` | `myBenefits` sin perfil de paciente |
| Insurance | `INSURANCE_CAMPAIGN_TRANSITION_INVALID` | 422 / `PRECONDITION_FAILED` | transición de estado imposible |
| Insurance | `INSURANCE_CAMPAIGN_CONCEPT_UNMAPPED` | 500 / `INTERNAL` | concepto persistido sin mapeo, razón segura permitida |
| Files | `FILES_DOWNLOAD_SIGNATURE_INVALID` | 403 / `FORBIDDEN` | firma de URL incorrecta |
| Files | `FILES_DOWNLOAD_URL_EXPIRED` | 410 / `RESOURCE_GONE` (código nuevo) | URL de descarga vencida |
| QA execution | `QA_PLAN_SELF_APPROVAL` | 403 / `FORBIDDEN` | solicitante intenta aprobar su plan |
| QA execution | `QA_PLAN_HASH_STALE` | 409 / `CONFLICT` | hash revisado distinto al vigente |

**Reasons locales existentes:** `TENANT_REQUIRED`/`TENANT_AMBIGUOUS` (`src/common/tenant/tenant-resolution.ts:49-59`), `ALREADY_DECIDED` (`src/modules/insurance/services/insurer-received-claims.service.ts:283-287`), `URL_EXPIRED` (`src/modules/common/services/files.service.ts:702-710`) y `SELF_APPROVAL` anidado en `violations` (`src/modules/qa_execution/services/qa-execution.service.ts:432-445`). Se usan en código, así que **no son huérfanos demostrados**. `TENANT_REQUIRED` aparece también en `src/common/tenant/tenant-context.ts:46`; puede ser una reutilización deliberada del mismo concepto, no se reporta como duplicado erróneo. Como **no existe un catálogo canónico** en esta rama, no puede calcularse honestamente “usados sin existir”, “definidos sin uso” ni duplicados semánticos para los 70 módulos. La corrección debe crear un manifiesto de razones y un chequeo estático que compare definiciones, referencias y unicidad por namespace, con revisión humana de sinónimos.

## 8. Olas de ejecución y esfuerzo

| Ola | Hallazgo | Esfuerzo | Dependencia y comprobación de salida |
|---|---|---|---|
| 0 | `ERR-03` | M | Redactar valores de driver/log; prueba con marca sintética ausente de todas las salidas. No espera al catálogo. |
| 1 | `ERR-01` | M | Definir forma versionada del reason y catálogos iniciales; tests de contrato de filtro. Es base para `ERR-02`, `ERR-04`, `ERR-05`. |
| 2 | `ERR-02` | L | Migrar guards y módulos por grupos; mantener conteo de candidatos, confirmar rutas individualmente y fijar 4 pruebas por endpoint. |
| 2 | `ERR-04` | S | Añadir `RESOURCE_GONE` y migrar `URL_EXPIRED` con aviso de compatibilidad. |
| 2 | `ERR-05` | M | Error tipado seguro, validación de mapeos persistidos y prueba de 500 catalogado. |
| 3 | Auditoría de cobertura | L | Expandir inventario a lanzamientos indirectos, jobs, dependencias y 70 módulos; verificar definiciones usadas/no usadas y estados HTTP en e2e. |

## 9. Trabajo pendiente de integrar y estado de verificación

El plan recibido informa que el commit **`fa74b78c`**, aún fuera de `origin/dev` al prepararse ese plan, introduce `reason` por módulo en 16 módulos (`accounting`, `scheduling`, `payments`, `clinical`, `billing`, `insurance`, `iam`, `authz`, `promotions`, `platform_ops`, `ads`, `automation`, `procedures_perioperative`, `community`, `profiles`, `pharma_lab`) y cambios en `domain.exception`/`all-exceptions.filter`. **No está en este worktree**: antes de corregir esos módulos hay que comparar dicho commit con la base actual y revalidar cada hallazgo, sin atribuirle comportamientos no observados. No se consultó el árbol ajeno ni se modificaron archivos fuente.

Estado de evidencia: lectura de código, barrido estático y specs dirigidos; **no hay ejecución de API, persistencia ni suite completa**. Comando correcto: `corepack yarn test --runInBand --silent src/common/filters/all-exceptions.filter.spec.ts src/common/filters/all-exceptions.database.spec.ts`; resultado fresco: **2 suites pasaron, 32 tests pasaron, salida 0**. La invocación directa de `jest` sin el wrapper de `package.json` no carga el ESM de MikroORM; no representa el estado de esos specs bajo el comando del proyecto. Los conteos anteriores describen el barrido, no cobertura dinámica. Este documento es una propuesta de corrección y de pruebas; ninguna razón nueva ni `ErrorCode.RESOURCE_GONE` existe todavía en el runtime auditado.
