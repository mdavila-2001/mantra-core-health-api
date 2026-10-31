<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `ui_visibility`

- **Bloque:** —
- **Operaciones:** 9 (0 en el contrato, 9 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 9
- **Tablas distintas que tocan:** 8
- **Respuestas de error y detalle contractual:** `openapi/endpoints/ui-visibility.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/ui-visibility/elements` | — | BAJO | 2 | SECURITY_ADMIN |
| 2 | POST | `/admin/ui-visibility/elements` | — | BAJO | 2 | SECURITY_ADMIN |
| 3 | POST | `/admin/ui-visibility/elements/sync` | — | BAJO | 0 | SECURITY_ADMIN |
| 4 | GET | `/admin/ui-visibility/preview` | — | BAJO | 6 | SECURITY_ADMIN |
| 5 | GET | `/admin/ui-visibility/rules` | — | BAJO | 5 | SECURITY_ADMIN |
| 6 | POST | `/admin/ui-visibility/rules` | — | BAJO | 4 | SECURITY_ADMIN |
| 7 | PATCH | `/admin/ui-visibility/rules/{id}` | — | BAJO | 4 | SECURITY_ADMIN |
| 8 | POST | `/admin/ui-visibility/rules/{id}/end` | — | BAJO | 4 | SECURITY_ADMIN |
| 9 | GET | `/me/ui-visibility` | — | BAJO | 1 | sesión (sin roles) |

---

## 1. GET /admin/ui-visibility/elements

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminUiVisibilityController.elements` — `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:53`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`GET /admin/ui-visibility/elements` la atiende `AdminUiVisibilityController.elements` (src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:53). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `UiVisibilityAdminService.listElements`. Lee authz.ui_visibility_elements, authz.ui_visibility_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.ui_visibility_elements` | LEE | LEE | DIRECTA | AdminUiVisibilityController.elements → UiVisibilityAdminService.listElements → MikroOrmUiVisibilityStore.listElements | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:169` |
| `authz.ui_visibility_rules` | LEE | LEE | DIRECTA | AdminUiVisibilityController.elements → UiVisibilityAdminService.listElements → UiVisibilityAdminService.toElementViews → MikroOrmUiVisibilityStore.countActiveRules | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:265` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `ElementsQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/ui_visibility.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `ui_visibility` — Visibilidad de la interfaz — etapa `ctrl:AdminUiVisibilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /admin/ui-visibility/elements

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminUiVisibilityController.createElement` — `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:61`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`POST /admin/ui-visibility/elements` la atiende `AdminUiVisibilityController.createElement` (src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:61). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateElementDto` (7 campos, 4 obligatorios). Delega en `UiVisibilityAdminService.createElement`. Lee authz.ui_visibility_elements, authz.ui_visibility_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.ui_visibility_elements` | LEE | LEE | DIRECTA | AdminUiVisibilityController.createElement → UiVisibilityAdminService.createElement → UiVisibilityAdminService.toElementViews → MikroOrmUiVisibilityStore.findElementsByIds | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:190` |
| `authz.ui_visibility_rules` | LEE | LEE | DIRECTA | AdminUiVisibilityController.createElement → UiVisibilityAdminService.createElement → UiVisibilityAdminService.toElementViews → MikroOrmUiVisibilityStore.countActiveRules | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:265` |

### Cuerpo — DTO `CreateElementDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `key` | `string` | Sí | longitud máxima UI_ELEMENT_KEY_MAX; patrón runtime UI_ELEMENT_KEY_PATTERN | `@Transform(trimmed)` `@IsString()` `@MaxLength(UI_ELEMENT_KEY_MAX)` `@Matches(UI_ELEMENT_KEY_PATTERN, { message: KEY_MESSAGE })` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:172` |
| `kind` | `object` | Sí | — | `@IsIn(UI_ELEMENT_KINDS)` | Tipo TypeScript no expandido: (typeof UI_ELEMENT_KINDS)[number] | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:176` |
| `moduleCode` | `string` | Sí | longitud mínima 1; longitud máxima UI_MODULE_CODE_MAX | `@Transform(trimmed)` `@IsString()` `@MinLength(1)` `@MaxLength(UI_MODULE_CODE_MAX)` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:183` |
| `parentKey` | `string` | No | longitud máxima UI_ELEMENT_KEY_MAX; patrón runtime UI_ELEMENT_KEY_PATTERN; admite null | `@IsOptional()` `@Transform(trimmed)` `@IsString()` `@MaxLength(UI_ELEMENT_KEY_MAX)` `@Matches(UI_ELEMENT_KEY_PATTERN, { message: KEY_MESSAGE })` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:191` |
| `label` | `string` | Sí | longitud mínima 1; longitud máxima UI_LABEL_MAX | `@Transform(trimmed)` `@IsString()` `@MinLength(1)` `@MaxLength(UI_LABEL_MAX)` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:198` |
| `description` | `string` | No | longitud máxima UI_DESCRIPTION_MAX; admite null | `@IsOptional()` `@Transform(trimmed)` `@IsString()` `@MaxLength(UI_DESCRIPTION_MAX)` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:205` |
| `defaultVisible` | `boolean` | No | — | `@IsOptional()` `@Transform(raw)` `@IsBoolean()` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:211` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "key": "pharmacy.orders.export-button",
  "kind": {},
  "moduleCode": "CODIGO_EJEMPLO",
  "label": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "key": "pharmacy.orders.export-button",
  "kind": {},
  "moduleCode": "CODIGO_EJEMPLO",
  "parentKey": "valor-ejemplo",
  "label": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "defaultVisible": true
}
```

</details>

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ui_visibility.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `ui_visibility` — Visibilidad de la interfaz — etapa `ctrl:AdminUiVisibilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /admin/ui-visibility/elements/sync

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminUiVisibilityController.syncElements` — `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:75`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`POST /admin/ui-visibility/elements/sync` la atiende `AdminUiVisibilityController.syncElements` (src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:75). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `SyncElementsDto` (8 campos, 6 obligatorios). Delega en `UiVisibilityAdminService.syncElements`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo — DTO `SyncElementsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `elements` | `array<UiElementDraftDto>` | Sí | máximo UI_SYNC_MAX_ELEMENTS elemento(s) | `@IsArray()` `@ArrayMaxSize(UI_SYNC_MAX_ELEMENTS)` `@ValidateNested({ each: true })` `@Type(() => UiElementDraftDto)` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:220` |
| `elements[].key` | `string` | Sí | longitud máxima UI_ELEMENT_KEY_MAX; patrón runtime UI_ELEMENT_KEY_PATTERN | `@Transform(trimmed)` `@IsString()` `@MaxLength(UI_ELEMENT_KEY_MAX)` `@Matches(UI_ELEMENT_KEY_PATTERN, { message: KEY_MESSAGE })` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:121` |
| `elements[].kind` | `object` | Sí | — | `@IsIn(UI_ELEMENT_KINDS)` | Tipo TypeScript no expandido: (typeof UI_ELEMENT_KINDS)[number] | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:125` |
| `elements[].moduleCode` | `string` | Sí | longitud mínima 1; longitud máxima UI_MODULE_CODE_MAX | `@Transform(trimmed)` `@IsString()` `@MinLength(1)` `@MaxLength(UI_MODULE_CODE_MAX)` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:132` |
| `elements[].parentKey` | `string` | No | longitud máxima UI_ELEMENT_KEY_MAX; patrón runtime UI_ELEMENT_KEY_PATTERN; admite null | `@IsOptional()` `@Transform(trimmed)` `@IsString()` `@MaxLength(UI_ELEMENT_KEY_MAX)` `@Matches(UI_ELEMENT_KEY_PATTERN, { message: KEY_MESSAGE })` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:140` |
| `elements[].label` | `string` | Sí | longitud mínima 1; longitud máxima UI_LABEL_MAX | `@Transform(trimmed)` `@IsString()` `@MinLength(1)` `@MaxLength(UI_LABEL_MAX)` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:147` |
| `elements[].description` | `string` | No | longitud máxima UI_DESCRIPTION_MAX; admite null | `@IsOptional()` `@Transform(trimmed)` `@IsString()` `@MaxLength(UI_DESCRIPTION_MAX)` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:154` |
| `elements[].defaultVisible` | `boolean` | Sí | — | `@Transform(raw)` `@IsBoolean()` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:159` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "elements": [
    {
      "key": "pharmacy.orders.export-button",
      "kind": {},
      "moduleCode": "CODIGO_EJEMPLO",
      "label": "valor-ejemplo",
      "defaultVisible": true
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "elements": [
    {
      "key": "pharmacy.orders.export-button",
      "kind": {},
      "moduleCode": "CODIGO_EJEMPLO",
      "parentKey": "valor-ejemplo",
      "label": "valor-ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "defaultVisible": true
    }
  ]
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ui_visibility.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `ui_visibility` — Visibilidad de la interfaz — etapa `ctrl:AdminUiVisibilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /admin/ui-visibility/preview

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminUiVisibilityController.preview` — `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:153`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`GET /admin/ui-visibility/preview` la atiende `AdminUiVisibilityController.preview` (src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:153). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `UiVisibilityAdminService.preview`. Lee authz.roles, authz.user_role_assignments, directory.tenant_memberships, directory.tenants, iam.user_global_roles, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:153` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | AdminUiVisibilityController.preview → UiVisibilityAdminService.preview → MikroOrmUiVisibilityStore.roleNames | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:432` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | AdminUiVisibilityController.preview → UiVisibilityAdminService.preview → MikroOrmUiVisibilityStore.effectiveRoleCodes → AuthzEffectiveRolesService.scopedAssignmentsForUser → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | AdminUiVisibilityController.preview → UiVisibilityAdminService.preview → MikroOrmUiVisibilityStore.userInTenant | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:442` |
| `directory.tenants` | LEE | LEE | DIRECTA | AdminUiVisibilityController.preview → UiVisibilityAdminService.preview → MikroOrmUiVisibilityStore.orgTypeOfTenant | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:453` |
| `iam.user_global_roles` | LEE | LEE | DIRECTA | AdminUiVisibilityController.preview → UiVisibilityAdminService.preview → MikroOrmUiVisibilityStore.effectiveRoleCodes | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:465` |
| `iam.users` | LEE | LEE | DIRECTA | AdminUiVisibilityController.preview → UiVisibilityAdminService.preview → MikroOrmUiVisibilityStore.userLabels | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:414` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `PreviewQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/ui_visibility.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `ui_visibility` — Visibilidad de la interfaz — etapa `ctrl:AdminUiVisibilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /admin/ui-visibility/rules

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminUiVisibilityController.rules` — `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:90`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`GET /admin/ui-visibility/rules` la atiende `AdminUiVisibilityController.rules` (src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:90). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `UiVisibilityAdminService.listRules`. Lee authz.roles, authz.ui_visibility_elements, authz.ui_visibility_rules, directory.tenants, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | AdminUiVisibilityController.rules → UiVisibilityAdminService.listRules → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.roleNames | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:432` |
| `authz.ui_visibility_elements` | LEE | LEE | DIRECTA | AdminUiVisibilityController.rules → UiVisibilityAdminService.listRules → MikroOrmUiVisibilityStore.findElementsByKeys | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:182` |
| `authz.ui_visibility_rules` | LEE | LEE | DIRECTA | AdminUiVisibilityController.rules → UiVisibilityAdminService.listRules → MikroOrmUiVisibilityStore.listRules | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:299` |
| `directory.tenants` | LEE | LEE | DIRECTA | AdminUiVisibilityController.rules → UiVisibilityAdminService.listRules → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.tenantLabels | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:424` |
| `iam.users` | LEE | LEE | DIRECTA | AdminUiVisibilityController.rules → UiVisibilityAdminService.listRules → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.userLabels | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:414` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `RulesQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/ui_visibility.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `ui_visibility` — Visibilidad de la interfaz — etapa `ctrl:AdminUiVisibilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /admin/ui-visibility/rules

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminUiVisibilityController.createRule` — `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:96`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`POST /admin/ui-visibility/rules` la atiende `AdminUiVisibilityController.createRule` (src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:96). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateRuleDto` (7 campos, 4 obligatorios). Delega en `UiVisibilityAdminService.createRule`. Lee authz.roles, authz.ui_visibility_elements, directory.tenants, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:96` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | AdminUiVisibilityController.createRule → UiVisibilityAdminService.createRule → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.roleNames | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:432` |
| `authz.ui_visibility_elements` | LEE | LEE | DIRECTA | AdminUiVisibilityController.createRule → UiVisibilityAdminService.createRule → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.findElementsByIds | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:190` |
| `directory.tenants` | LEE | LEE | DIRECTA | AdminUiVisibilityController.createRule → UiVisibilityAdminService.createRule → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.tenantLabels | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:424` |
| `iam.users` | LEE | LEE | DIRECTA | AdminUiVisibilityController.createRule → UiVisibilityAdminService.createRule → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.userLabels | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:414` |

### Cuerpo — DTO `CreateRuleDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `elementKey` | `string` | Sí | longitud máxima UI_ELEMENT_KEY_MAX | `@Transform(trimmed)` `@IsString()` `@MaxLength(UI_ELEMENT_KEY_MAX)` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:258` |
| `effect` | `object` | Sí | — | `@IsIn(UI_RULE_EFFECTS)` | Tipo TypeScript no expandido: (typeof UI_RULE_EFFECTS)[number] | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:262` |
| `subjectType` | `object` | Sí | — | `@IsIn(UI_RULE_SUBJECT_TYPES)` | Tipo TypeScript no expandido: (typeof UI_RULE_SUBJECT_TYPES)[number] | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:266` |
| `subjectId` | `string` | No | longitud máxima UI_SUBJECT_ID_MAX; admite null | `@IsOptional()` `@Transform(trimmed)` `@IsString()` `@MaxLength(UI_SUBJECT_ID_MAX)` | USER: id de usuario · TENANT: id de organización · ROLE: código de rol · ORG_TYPE: código del tipo de organización · ALL: null | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:278` |
| `validFrom` | `string` | No | formato date-time; admite null | `@IsOptional()` `@IsISO8601({ strict: true })` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:283` |
| `validTo` | `string` | No | formato date-time; admite null | `@IsOptional()` `@IsISO8601({ strict: true })` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:288` |
| `reason` | `string` | Sí | longitud mínima UI_REASON_MIN; longitud máxima UI_REASON_MAX | `@Transform(trimmed)` `@IsString()` `@MinLength(UI_REASON_MIN)` `@MaxLength(UI_REASON_MAX)` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:295` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "elementKey": "valor-ejemplo",
  "effect": {},
  "subjectType": {},
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "elementKey": "valor-ejemplo",
  "effect": {},
  "subjectType": {},
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ui_visibility.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `ui_visibility` — Visibilidad de la interfaz — etapa `ctrl:AdminUiVisibilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. PATCH /admin/ui-visibility/rules/{id}

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminUiVisibilityController.updateRule` — `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:110`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`PATCH /admin/ui-visibility/rules/{id}` la atiende `AdminUiVisibilityController.updateRule` (src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:110). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpdateRuleDto` (4 campos, 0 obligatorios). Delega en `UiVisibilityAdminService.updateRule`. Lee authz.roles, authz.ui_visibility_elements, directory.tenants, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:110` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | AdminUiVisibilityController.updateRule → UiVisibilityAdminService.updateRule → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.roleNames | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:432` |
| `authz.ui_visibility_elements` | LEE | LEE | DIRECTA | AdminUiVisibilityController.updateRule → UiVisibilityAdminService.updateRule → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.findElementsByIds | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:190` |
| `directory.tenants` | LEE | LEE | DIRECTA | AdminUiVisibilityController.updateRule → UiVisibilityAdminService.updateRule → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.tenantLabels | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:424` |
| `iam.users` | LEE | LEE | DIRECTA | AdminUiVisibilityController.updateRule → UiVisibilityAdminService.updateRule → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.userLabels | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:414` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | path | Sí | `UuidParamDto` | — |
| `—` | header | sin dato | `Record<string, unknown>` | — |

### Cuerpo — DTO `UpdateRuleDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `effect` | `object` | No | — | `@IsOptional()` `@IsIn(UI_RULE_EFFECTS)` | Tipo TypeScript no expandido: (typeof UI_RULE_EFFECTS)[number] | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:302` |
| `validFrom` | `string` | No | formato date-time; admite null | `@IsOptional()` `@IsISO8601({ strict: true })` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:307` |
| `validTo` | `string` | No | formato date-time; admite null | `@IsOptional()` `@IsISO8601({ strict: true })` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:312` |
| `reason` | `string` | No | longitud mínima UI_REASON_MIN; longitud máxima UI_REASON_MAX | `@IsOptional()` `@Transform(trimmed)` `@IsString()` `@MinLength(UI_REASON_MIN)` `@MaxLength(UI_REASON_MAX)` | — | `src/modules/ui_visibility/dto/ui-visibility.dto.ts:320` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "effect": {},
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ui_visibility.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `ui_visibility` — Visibilidad de la interfaz — etapa `ctrl:AdminUiVisibilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /admin/ui-visibility/rules/{id}/end

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminUiVisibilityController.endRule` — `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:139`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`POST /admin/ui-visibility/rules/{id}/end` la atiende `AdminUiVisibilityController.endRule` (src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:139). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `UiVisibilityAdminService.endRule`. Lee authz.roles, authz.ui_visibility_elements, directory.tenants, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts:139` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | AdminUiVisibilityController.endRule → UiVisibilityAdminService.endRule → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.roleNames | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:432` |
| `authz.ui_visibility_elements` | LEE | LEE | DIRECTA | AdminUiVisibilityController.endRule → UiVisibilityAdminService.endRule → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.findElementsByIds | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:190` |
| `directory.tenants` | LEE | LEE | DIRECTA | AdminUiVisibilityController.endRule → UiVisibilityAdminService.endRule → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.tenantLabels | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:424` |
| `iam.users` | LEE | LEE | DIRECTA | AdminUiVisibilityController.endRule → UiVisibilityAdminService.endRule → UiVisibilityAdminService.toRuleViews → MikroOrmUiVisibilityStore.userLabels | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:414` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | path | Sí | `UuidParamDto` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ui_visibility.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `ui_visibility` — Visibilidad de la interfaz — etapa `ctrl:AdminUiVisibilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /me/ui-visibility

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MeUiVisibilityController.mine` — `src/modules/ui_visibility/controllers/me-ui-visibility.controller.ts:23`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`GET /me/ui-visibility` la atiende `MeUiVisibilityController.mine` (src/modules/ui_visibility/controllers/me-ui-visibility.controller.ts:23). Exige sesión; el controlador no declara roles. Delega en `UiVisibilityMeService.resolveMine`. Lee directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/ui_visibility/controllers/me-ui-visibility.controller.ts:23` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/ui_visibility/controllers/me-ui-visibility.controller.ts:23` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenants` | LEE | LEE | DIRECTA | MeUiVisibilityController.mine → UiVisibilityMeService.resolveMine → MikroOrmUiVisibilityStore.orgTypeOfTenant | `src/modules/ui_visibility/repositories/mikro-orm-ui-visibility.store.ts:453` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `x-tenant-id` | header | sin dato | `string` | — |

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

El árbol de decisión completo está en [flujos](../flujos/ui_visibility.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `ui_visibility` — Visibilidad de la interfaz — etapa `ctrl:MeUiVisibilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

