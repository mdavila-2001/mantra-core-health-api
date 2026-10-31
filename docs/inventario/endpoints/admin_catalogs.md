<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `admin_catalogs`

- **Bloque:** —
- **Operaciones:** 7 (0 en el contrato, 7 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 1 · BAJO 6
- **Tablas distintas que tocan:** 3
- **Respuestas de error y detalle contractual:** `openapi/endpoints/admin-catalogs.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/catalogs/services` | — | BAJO | 2 | SECURITY_ADMIN |
| 2 | POST | `/admin/catalogs/services` | — | MEDIO | 3 | SECURITY_ADMIN |
| 3 | GET | `/admin/catalogs/services/{id}` | — | BAJO | 2 | SECURITY_ADMIN |
| 4 | PATCH | `/admin/catalogs/services/{id}` | — | BAJO | 2 | SECURITY_ADMIN |
| 5 | POST | `/admin/catalogs/services/{id}/deactivate` | — | BAJO | 2 | SECURITY_ADMIN |
| 6 | POST | `/admin/catalogs/services/{id}/reactivate` | — | BAJO | 2 | SECURITY_ADMIN |
| 7 | GET | `/admin/catalogs/services/scopes` | — | BAJO | 2 | SECURITY_ADMIN |

---

## 1. GET /admin/catalogs/services

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminServiceCatalogController.list` — `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:55`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`GET /admin/catalogs/services` la atiende `AdminServiceCatalogController.list` (src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:55). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AdminServiceCatalogService.list`. Lee billing.service_catalog, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:55` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | AdminServiceCatalogController.list → AdminServiceCatalogService.list | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:174` |
| `practice.practices` | LEE | LEE | DIRECTA | AdminServiceCatalogController.list → AdminServiceCatalogService.list → AdminServiceCatalogService.activePractices | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:380` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `AdminServiceListQueryDto` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AdminServicePageDto>` · DTO `AdminServicePageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<AdminServiceItemDto>` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:221` |
| `items[].id` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:202` |
| `items[].practiceId` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:203` |
| `items[].practiceTypeConceptId` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:204` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:205` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:206` |
| `items[].descriptionText` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:207` |
| `items[].termsText` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:208` |
| `items[].serviceConceptId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:209` |
| `items[].defaultPrice` | `string` | Sí | — | — | Decimal exacto como texto (`"100.00"`). | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:211` |
| `items[].currencyConceptId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:212` |
| `items[].currencyCode` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:213` |
| `items[].isActive` | `boolean` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:214` |
| `items[].rowVersion` | `number` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:215` |
| `items[].updatedAt` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:216` |
| `items[].updatedByUserId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:217` |
| `count` | `number` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:222` |
| `limit` | `number` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:223` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:224` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {PRACTICE_NOT_FOUND.message}; ResourceNotFoundException: Cursor no válido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/admin_catalogs.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `admin_catalogs` — Editor de catálogos globales — etapa `ctrl:AdminServiceCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /admin/catalogs/services

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminServiceCatalogController.create` — `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:72`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`POST /admin/catalogs/services` la atiende `AdminServiceCatalogController.create` (src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:72). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AdminCreateServiceDto` (8 campos, 4 obligatorios). Delega en `AdminServiceCatalogService.create`. Crea filas en billing.service_catalog. Lee billing.service_catalog, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:72` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | ESCRIBE | CREA | DIRECTA | AdminServiceCatalogController.create → AdminServiceCatalogService.create → AdminServiceCatalogService.createInPractice | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:255` |
| `billing.service_catalog` | LEE | LEE | DIRECTA | AdminServiceCatalogController.create → AdminServiceCatalogService.create → AdminServiceCatalogService.createInPractice | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:237` |
| `practice.practices` | LEE | LEE | DIRECTA | AdminServiceCatalogController.create → AdminServiceCatalogService.create → AdminServiceCatalogService.createInPractice | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:230` |

### Cuerpo — DTO `AdminCreateServiceDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:91` |
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 120 | `@Transform(trimmed)` `@IsString()` `@IsNotEmpty()` `@MaxLength(120)` | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:98` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@Transform(trimmed)` `@IsString()` `@IsNotEmpty()` `@MaxLength(200)` | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:105` |
| `defaultPrice` | `string` | Sí | patrón runtime PRICE_PATTERN | `@Transform(raw)` `@IsString()` `@Matches(PRICE_PATTERN, { message: PRICE_MESSAGE })` | Decimal exacto como texto | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:111` |
| `descriptionText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@Transform(trimmed)` `@IsString()` `@MaxLength(2000)` | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:118` |
| `serviceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:123` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Por omisión, BOB | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:128` |
| `isActive` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:133` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "defaultPrice": 100
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "defaultPrice": 100,
  "descriptionText": "Texto descriptivo de ejemplo",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "isActive": true
}
```

</details>

### Respuesta — `Promise<AdminServiceItemDto>` · DTO `AdminServiceItemDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:202` |
| `practiceId` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:203` |
| `practiceTypeConceptId` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:204` |
| `code` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:205` |
| `name` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:206` |
| `descriptionText` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:207` |
| `termsText` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:208` |
| `serviceConceptId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:209` |
| `defaultPrice` | `string` | Sí | — | — | Decimal exacto como texto (`"100.00"`). | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:211` |
| `currencyConceptId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:212` |
| `currencyCode` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:213` |
| `isActive` | `boolean` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:214` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:215` |
| `updatedAt` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:216` |
| `updatedByUserId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:217` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un servicio con ese código en la práctica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La moneda no está admitida para el catálogo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/admin_catalogs.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `admin_catalogs` — Editor de catálogos globales — etapa `ctrl:AdminServiceCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /admin/catalogs/services/{id}

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminServiceCatalogController.get` — `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:64`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`GET /admin/catalogs/services/{id}` la atiende `AdminServiceCatalogController.get` (src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:64). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AdminServiceCatalogService.get`. Lee billing.service_catalog, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:64` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | AdminServiceCatalogController.get → AdminServiceCatalogService.get → AdminServiceCatalogService.loadInTenant | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:392` |
| `practice.practices` | LEE | LEE | DIRECTA | AdminServiceCatalogController.get → AdminServiceCatalogService.get → AdminServiceCatalogService.loadInTenant | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:394` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AdminServiceItemDto>` · DTO `AdminServiceItemDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:202` |
| `practiceId` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:203` |
| `practiceTypeConceptId` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:204` |
| `code` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:205` |
| `name` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:206` |
| `descriptionText` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:207` |
| `termsText` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:208` |
| `serviceConceptId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:209` |
| `defaultPrice` | `string` | Sí | — | — | Decimal exacto como texto (`"100.00"`). | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:211` |
| `currencyConceptId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:212` |
| `currencyCode` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:213` |
| `isActive` | `boolean` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:214` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:215` |
| `updatedAt` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:216` |
| `updatedByUserId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:217` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/admin_catalogs.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `admin_catalogs` — Editor de catálogos globales — etapa `ctrl:AdminServiceCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. PATCH /admin/catalogs/services/{id}

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminServiceCatalogController.update` — `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:93`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`PATCH /admin/catalogs/services/{id}` la atiende `AdminServiceCatalogController.update` (src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:93). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AdminUpdateServiceDto` (7 campos, 1 obligatorio). Delega en `AdminServiceCatalogService.update`. Lee billing.service_catalog, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:93` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | AdminServiceCatalogController.update → AdminServiceCatalogService.update → AdminServiceCatalogService.mutate → AdminServiceCatalogService.loadInTenant | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:392` |
| `practice.practices` | LEE | LEE | DIRECTA | AdminServiceCatalogController.update → AdminServiceCatalogService.update → AdminServiceCatalogService.mutate → AdminServiceCatalogService.loadInTenant | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:394` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AdminUpdateServiceDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expectedRowVersion` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | Versión que la persona leyó | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:141` |
| `name` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@Transform(trimmed)` `@IsString()` `@IsNotEmpty()` `@MaxLength(200)` | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:149` |
| `descriptionText` | `string` | No | longitud máxima 2000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | `null` o vacío limpia el texto | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:159` |
| `termsText` | `string` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | `null` o vacío limpia el texto | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:169` |
| `serviceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:174` |
| `defaultPrice` | `string` | No | patrón runtime PRICE_PATTERN | `@IsOptional()` `@Transform(raw)` `@IsString()` `@Matches(PRICE_PATTERN, { message: PRICE_MESSAGE })` | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:181` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sólo viaja junto con `defaultPrice` | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:189` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "expectedRowVersion": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "expectedRowVersion": 1,
  "name": "Nombre de ejemplo",
  "descriptionText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": 120.5,
  "currencyConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<AdminServiceItemDto>` · DTO `AdminServiceItemDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:202` |
| `practiceId` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:203` |
| `practiceTypeConceptId` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:204` |
| `code` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:205` |
| `name` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:206` |
| `descriptionText` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:207` |
| `termsText` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:208` |
| `serviceConceptId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:209` |
| `defaultPrice` | `string` | Sí | — | — | Decimal exacto como texto (`"100.00"`). | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:211` |
| `currencyConceptId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:212` |
| `currencyCode` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:213` |
| `isActive` | `boolean` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:214` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:215` |
| `updatedAt` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:216` |
| `updatedByUserId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:217` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La edición no trae ningún campo para cambiar; PreconditionFailedException: La moneda no está admitida para el catálogo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/admin_catalogs.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `admin_catalogs` — Editor de catálogos globales — etapa `ctrl:AdminServiceCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /admin/catalogs/services/{id}/deactivate

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminServiceCatalogController.deactivate` — `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:112`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`POST /admin/catalogs/services/{id}/deactivate` la atiende `AdminServiceCatalogController.deactivate` (src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:112). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AdminServiceToggleDto` (1 campo, 1 obligatorio). Delega en `AdminServiceCatalogService.setActive`. Lee billing.service_catalog, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:112` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | AdminServiceCatalogController.deactivate → AdminServiceCatalogService.setActive → AdminServiceCatalogService.mutate → AdminServiceCatalogService.loadInTenant | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:392` |
| `practice.practices` | LEE | LEE | DIRECTA | AdminServiceCatalogController.deactivate → AdminServiceCatalogService.setActive → AdminServiceCatalogService.mutate → AdminServiceCatalogService.loadInTenant | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:394` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AdminServiceToggleDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expectedRowVersion` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:197` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "expectedRowVersion": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "expectedRowVersion": 1
}
```

</details>

### Respuesta — `Promise<AdminServiceItemDto>` · DTO `AdminServiceItemDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:202` |
| `practiceId` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:203` |
| `practiceTypeConceptId` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:204` |
| `code` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:205` |
| `name` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:206` |
| `descriptionText` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:207` |
| `termsText` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:208` |
| `serviceConceptId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:209` |
| `defaultPrice` | `string` | Sí | — | — | Decimal exacto como texto (`"100.00"`). | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:211` |
| `currencyConceptId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:212` |
| `currencyCode` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:213` |
| `isActive` | `boolean` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:214` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:215` |
| `updatedAt` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:216` |
| `updatedByUserId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:217` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/admin_catalogs.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `admin_catalogs` — Editor de catálogos globales — etapa `ctrl:AdminServiceCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /admin/catalogs/services/{id}/reactivate

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminServiceCatalogController.reactivate` — `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:128`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`POST /admin/catalogs/services/{id}/reactivate` la atiende `AdminServiceCatalogController.reactivate` (src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:128). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AdminServiceToggleDto` (1 campo, 1 obligatorio). Delega en `AdminServiceCatalogService.setActive`. Lee billing.service_catalog, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:128` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:128` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | AdminServiceCatalogController.reactivate → AdminServiceCatalogService.setActive → AdminServiceCatalogService.mutate → AdminServiceCatalogService.loadInTenant | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:392` |
| `practice.practices` | LEE | LEE | DIRECTA | AdminServiceCatalogController.reactivate → AdminServiceCatalogService.setActive → AdminServiceCatalogService.mutate → AdminServiceCatalogService.loadInTenant | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:394` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AdminServiceToggleDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expectedRowVersion` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:197` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "expectedRowVersion": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "expectedRowVersion": 1
}
```

</details>

### Respuesta — `Promise<AdminServiceItemDto>` · DTO `AdminServiceItemDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:202` |
| `practiceId` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:203` |
| `practiceTypeConceptId` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:204` |
| `code` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:205` |
| `name` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:206` |
| `descriptionText` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:207` |
| `termsText` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:208` |
| `serviceConceptId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:209` |
| `defaultPrice` | `string` | Sí | — | — | Decimal exacto como texto (`"100.00"`). | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:211` |
| `currencyConceptId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:212` |
| `currencyCode` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:213` |
| `isActive` | `boolean` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:214` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:215` |
| `updatedAt` | `string` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:216` |
| `updatedByUserId` | `string` | Sí | admite null | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:217` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/admin_catalogs.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `admin_catalogs` — Editor de catálogos globales — etapa `ctrl:AdminServiceCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /admin/catalogs/services/scopes

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminServiceCatalogController.scopes` — `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:46`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`GET /admin/catalogs/services/scopes` la atiende `AdminServiceCatalogController.scopes` (src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:46). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AdminServiceCatalogService.scopes`. Lee practice.practices, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/admin_catalogs/controllers/admin-service-catalog.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practices` | LEE | LEE | DIRECTA | AdminServiceCatalogController.scopes → AdminServiceCatalogService.scopes → AdminServiceCatalogService.activePractices | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:380` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | AdminServiceCatalogController.scopes → AdminServiceCatalogService.scopes | `src/modules/admin_catalogs/services/admin-service-catalog.service.ts:101` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AdminServiceScopesDto>` · DTO `AdminServiceScopesDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `types` | `array<object>` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:228` |
| `types[].conceptId` | `string` | Sí | — | — | — | sin fuente |
| `types[].code` | `string` | Sí | — | — | — | sin fuente |
| `types[].display` | `string` | Sí | — | — | — | sin fuente |
| `practices` | `array<object>` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:229` |
| `practices[].id` | `string` | Sí | — | — | — | sin fuente |
| `practices[].name` | `string` | Sí | — | — | — | sin fuente |
| `practices[].typeConceptId` | `string` | Sí | — | — | — | sin fuente |
| `currencies` | `array<object>` | Sí | — | — | — | `src/modules/admin_catalogs/dto/admin-service-catalog.dto.ts:230` |
| `currencies[].conceptId` | `string` | Sí | — | — | — | sin fuente |
| `currencies[].code` | `string` | Sí | — | — | — | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/admin_catalogs.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `admin_catalogs` — Editor de catálogos globales — etapa `ctrl:AdminServiceCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

