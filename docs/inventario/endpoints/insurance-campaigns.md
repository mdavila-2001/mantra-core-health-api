<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `insurance-campaigns`

- **Bloque:** —
- **Operaciones:** 16 (16 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 16
- **Tablas distintas que tocan:** 0
- **Respuestas de error y detalle contractual:** `openapi/endpoints/insurance-campaigns.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/insurance-campaigns` | Listar las campañas de la aseguradora activa | BAJO | 0 | sesión (sin roles) |
| 2 | POST | `/insurance-campaigns` | Crear una campaña preventiva de la aseguradora | BAJO | 0 | sesión (sin roles) |
| 3 | GET | `/insurance-campaigns/{id}` | Consultar una campaña de la aseguradora activa | BAJO | 0 | sesión (sin roles) |
| 4 | PATCH | `/insurance-campaigns/{id}` | Editar una campaña en borrador o pausada (422 si está activa o vencida) | BAJO | 0 | sesión (sin roles) |
| 5 | PATCH | `/insurance-campaigns/{id}/status` | Activar, pausar o finalizar una campaña (transiciones cerradas) | BAJO | 0 | sesión (sin roles) |
| 6 | GET | `/insurance-campaigns/active` | Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`) | BAJO | 0 | sesión (sin roles) |
| 7 | GET | `/insurance-campaigns/my-benefits` | Campañas vigentes de mi aseguradora, para el afiliado autenticado | BAJO | 0 | sesión (sin roles) |
| 8 | GET | `/insurance-campaigns/patient/{patientProfileId}` | Campañas vigentes de la aseguradora del afiliado (sólo el titular) | BAJO | 0 | sesión (sin roles) |
| 9 | GET | `/insurance/campaigns` | Listar las campañas de la aseguradora activa | BAJO | 0 | sesión (sin roles) |
| 10 | POST | `/insurance/campaigns` | Crear una campaña preventiva de la aseguradora | BAJO | 0 | sesión (sin roles) |
| 11 | GET | `/insurance/campaigns/{id}` | Consultar una campaña de la aseguradora activa | BAJO | 0 | sesión (sin roles) |
| 12 | PATCH | `/insurance/campaigns/{id}` | Editar una campaña en borrador o pausada (422 si está activa o vencida) | BAJO | 0 | sesión (sin roles) |
| 13 | PATCH | `/insurance/campaigns/{id}/status` | Activar, pausar o finalizar una campaña (transiciones cerradas) | BAJO | 0 | sesión (sin roles) |
| 14 | GET | `/insurance/campaigns/active` | Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`) | BAJO | 0 | sesión (sin roles) |
| 15 | GET | `/insurance/campaigns/my-benefits` | Campañas vigentes de mi aseguradora, para el afiliado autenticado | BAJO | 0 | sesión (sin roles) |
| 16 | GET | `/insurance/campaigns/patient/{patientProfileId}` | Campañas vigentes de la aseguradora del afiliado (sólo el titular) | BAJO | 0 | sesión (sin roles) |

---

## 1. GET /insurance-campaigns

- **Origen:** CONTRATO
- **Nombre:** Listar las campañas de la aseguradora activa
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Listar las campañas de la aseguradora activa.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /insurance-campaigns`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `type` | query | No | `string` | — |
| `status` | query | No | `string` | — |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /insurance-campaigns

- **Origen:** CONTRATO
- **Nombre:** Crear una campaña preventiva de la aseguradora
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Crear una campaña preventiva de la aseguradora.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /insurance-campaigns`: handler no localizado en el código. Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateInsuranceCampaignDto` (15 campos, 10 obligatorios). No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo — DTO `CreateInsuranceCampaignDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | patrón runtime /^[A-Z0-9][A-Z0-9-]{2,39}$/ | `@Matches(/^[A-Z0-9][A-Z0-9-]{2,39}$/, { message: 'El código debe tener de 3 a 40 caracteres: mayúsculas, dígitos y guiones', })` | Único por aseguradora; mayúsculas, dígitos y guiones. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:118` |
| `title` | `string` | Sí | longitud mínima 3; longitud máxima 200 | `@IsString()` `@Length(3, 200)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:125` |
| `description` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:131` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | `@IsIn(CAMPAIGN_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:135` |
| `targetConditionCode` | `string` | No | longitud máxima 16 | `@IsOptional()` `@IsString()` `@MaxLength(16)` | Código CIE-10 de la patología que se previene. Sólo descriptivo: no filtra afiliados (D4). | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:145` |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | `@IsNumber({ maxDecimalPlaces: 2 })` `@Min(0)` `@Max(100)` | Porcentaje del copago que la aseguradora bonifica. 100 = copago Bs. 0. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:158` |
| `validFrom` | `string` | Sí | formato date; patrón runtime DATE_ONLY | `@Matches(DATE_ONLY, { message: 'validFrom debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:163` |
| `validTo` | `string` | Sí | formato date; patrón runtime DATE_ONLY | `@Matches(DATE_ONLY, { message: 'validTo debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:168` |
| `partners` | `array<InsuranceCampaignPartnerInputDto>` | Sí | mínimo 1 elemento(s); máximo 20 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => InsuranceCampaignPartnerInputDto)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:176` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | `@IsIn(CAMPAIGN_PARTNER_ROLES)` | SPONSOR = importadora o fabricante que financia; PROVIDER = donde el afiliado se atiende | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:78` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | `@IsIn(CAMPAIGN_PARTNER_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:82` |
| `partners[].name` | `string` | Sí | longitud mínima 2; longitud máxima 160 | `@IsString()` `@Length(2, 160)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:87` |
| `partners[].partnerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Referencia blanda al tenant del aliado, si es un tenant del sistema. Sin FK física. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:96` |
| `partners[].networkProviderMembershipId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Membresía de la red de prestadores de la aseguradora, si aplica. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:105` |
| `activate` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si es true, la campaña nace ACTIVE en vez de DRAFT. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:184` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CMP-CARDIO-2026",
  "title": "Chequeo Preventivo Cardiovascular y Perfil Lipídico",
  "campaignType": "LABORATORY",
  "copayBonusPercentage": 100,
  "validFrom": "2026-09-25",
  "validTo": "2026-11-24",
  "partners": [
    {
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Laboratorio Central AloVida"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CMP-CARDIO-2026",
  "title": "Chequeo Preventivo Cardiovascular y Perfil Lipídico",
  "description": "Texto descriptivo de ejemplo",
  "campaignType": "LABORATORY",
  "targetConditionCode": "I10",
  "copayBonusPercentage": 100,
  "validFrom": "2026-09-25",
  "validTo": "2026-11-24",
  "partners": [
    {
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Laboratorio Central AloVida",
      "partnerTenantId": "00000000-0000-4000-8000-000000000001",
      "networkProviderMembershipId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "activate": false
}
```

</details>

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /insurance-campaigns/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar una campaña de la aseguradora activa
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Consultar una campaña de la aseguradora activa.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /insurance-campaigns/{id}`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. PATCH /insurance-campaigns/{id}

- **Origen:** CONTRATO
- **Nombre:** Editar una campaña en borrador o pausada (422 si está activa o vencida)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Editar una campaña en borrador o pausada (422 si está activa o vencida).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PATCH /insurance-campaigns/{id}`: handler no localizado en el código. Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateInsuranceCampaignDto` (13 campos, 0 obligatorios). No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateInsuranceCampaignDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `title` | `string` | No | longitud mínima 3; longitud máxima 200 | `@IsOptional()` `@IsString()` `@Length(3, 200)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:206` |
| `description` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:212` |
| `campaignType` | `string` | No | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | `@IsOptional()` `@IsIn(CAMPAIGN_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:217` |
| `targetConditionCode` | `string` | No | longitud máxima 16 | `@IsOptional()` `@IsString()` `@MaxLength(16)` | Código CIE-10 de la patología que se previene. Sólo descriptivo: no filtra afiliados (D4). | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:227` |
| `copayBonusPercentage` | `number` | No | mínimo 0; máximo 100 | `@IsOptional()` `@IsNumber({ maxDecimalPlaces: 2 })` `@Min(0)` `@Max(100)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:239` |
| `validFrom` | `string` | No | formato date; patrón runtime DATE_ONLY | `@IsOptional()` `@Matches(DATE_ONLY, { message: 'validFrom debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:245` |
| `validTo` | `string` | No | formato date; patrón runtime DATE_ONLY | `@IsOptional()` `@Matches(DATE_ONLY, { message: 'validTo debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:251` |
| `partners` | `array<InsuranceCampaignPartnerInputDto>` | No | mínimo 1 elemento(s); máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => InsuranceCampaignPartnerInputDto)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:260` |
| `partners[].role` | `string` | No | valores: SPONSOR, PROVIDER | `@IsIn(CAMPAIGN_PARTNER_ROLES)` | SPONSOR = importadora o fabricante que financia; PROVIDER = donde el afiliado se atiende | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:78` |
| `partners[].type` | `string` | No | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | `@IsIn(CAMPAIGN_PARTNER_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:82` |
| `partners[].name` | `string` | No | longitud mínima 2; longitud máxima 160 | `@IsString()` `@Length(2, 160)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:87` |
| `partners[].partnerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Referencia blanda al tenant del aliado, si es un tenant del sistema. Sin FK física. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:96` |
| `partners[].networkProviderMembershipId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Membresía de la red de prestadores de la aseguradora, si aplica. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:105` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "title": "Chequeo Preventivo Cardiovascular y Perfil Lipídico",
  "description": "Texto descriptivo de ejemplo",
  "campaignType": "LABORATORY",
  "targetConditionCode": "I10",
  "copayBonusPercentage": 100,
  "validFrom": "2026-09-25",
  "validTo": "2026-11-24",
  "partners": [
    {
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Laboratorio Central AloVida",
      "partnerTenantId": "00000000-0000-4000-8000-000000000001",
      "networkProviderMembershipId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. PATCH /insurance-campaigns/{id}/status

- **Origen:** CONTRATO
- **Nombre:** Activar, pausar o finalizar una campaña (transiciones cerradas)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Activar, pausar o finalizar una campaña (transiciones cerradas).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PATCH /insurance-campaigns/{id}/status`: handler no localizado en el código. Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateInsuranceCampaignStatusDto` (1 campo, 1 obligatorio). No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateInsuranceCampaignStatusDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: ACTIVE, PAUSED, EXPIRED | `@IsIn(CAMPAIGN_TARGET_STATUSES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:191` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "status": "ACTIVE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "ACTIVE"
}
```

</details>

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /insurance-campaigns/active

- **Origen:** CONTRATO
- **Nombre:** Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /insurance-campaigns/active`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `carrierId` | query | No | `string` | Acota a una aseguradora. Sin filtro, trae de todas. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /insurance-campaigns/my-benefits

- **Origen:** CONTRATO
- **Nombre:** Campañas vigentes de mi aseguradora, para el afiliado autenticado
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Campañas vigentes de mi aseguradora, para el afiliado autenticado.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /insurance-campaigns/my-benefits`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /insurance-campaigns/patient/{patientProfileId}

- **Origen:** CONTRATO
- **Nombre:** Campañas vigentes de la aseguradora del afiliado (sólo el titular)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Campañas vigentes de la aseguradora del afiliado (sólo el titular).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /insurance-campaigns/patient/{patientProfileId}`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /insurance/campaigns

- **Origen:** CONTRATO
- **Nombre:** Listar las campañas de la aseguradora activa
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Listar las campañas de la aseguradora activa.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /insurance/campaigns`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `type` | query | No | `string` | — |
| `status` | query | No | `string` | — |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:209` |

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /insurance/campaigns

- **Origen:** CONTRATO
- **Nombre:** Crear una campaña preventiva de la aseguradora
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Crear una campaña preventiva de la aseguradora.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /insurance/campaigns`: handler no localizado en el código. Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateInsuranceCampaignDto` (15 campos, 10 obligatorios). No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo — DTO `CreateInsuranceCampaignDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | patrón runtime /^[A-Z0-9][A-Z0-9-]{2,39}$/ | `@Matches(/^[A-Z0-9][A-Z0-9-]{2,39}$/, { message: 'El código debe tener de 3 a 40 caracteres: mayúsculas, dígitos y guiones', })` | Único por aseguradora; mayúsculas, dígitos y guiones. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:118` |
| `title` | `string` | Sí | longitud mínima 3; longitud máxima 200 | `@IsString()` `@Length(3, 200)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:125` |
| `description` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:131` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | `@IsIn(CAMPAIGN_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:135` |
| `targetConditionCode` | `string` | No | longitud máxima 16 | `@IsOptional()` `@IsString()` `@MaxLength(16)` | Código CIE-10 de la patología que se previene. Sólo descriptivo: no filtra afiliados (D4). | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:145` |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | `@IsNumber({ maxDecimalPlaces: 2 })` `@Min(0)` `@Max(100)` | Porcentaje del copago que la aseguradora bonifica. 100 = copago Bs. 0. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:158` |
| `validFrom` | `string` | Sí | formato date; patrón runtime DATE_ONLY | `@Matches(DATE_ONLY, { message: 'validFrom debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:163` |
| `validTo` | `string` | Sí | formato date; patrón runtime DATE_ONLY | `@Matches(DATE_ONLY, { message: 'validTo debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:168` |
| `partners` | `array<InsuranceCampaignPartnerInputDto>` | Sí | mínimo 1 elemento(s); máximo 20 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => InsuranceCampaignPartnerInputDto)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:176` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | `@IsIn(CAMPAIGN_PARTNER_ROLES)` | SPONSOR = importadora o fabricante que financia; PROVIDER = donde el afiliado se atiende | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:78` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | `@IsIn(CAMPAIGN_PARTNER_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:82` |
| `partners[].name` | `string` | Sí | longitud mínima 2; longitud máxima 160 | `@IsString()` `@Length(2, 160)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:87` |
| `partners[].partnerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Referencia blanda al tenant del aliado, si es un tenant del sistema. Sin FK física. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:96` |
| `partners[].networkProviderMembershipId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Membresía de la red de prestadores de la aseguradora, si aplica. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:105` |
| `activate` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si es true, la campaña nace ACTIVE en vez de DRAFT. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:184` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CMP-CARDIO-2026",
  "title": "Chequeo Preventivo Cardiovascular y Perfil Lipídico",
  "campaignType": "LABORATORY",
  "copayBonusPercentage": 100,
  "validFrom": "2026-09-25",
  "validTo": "2026-11-24",
  "partners": [
    {
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Laboratorio Central AloVida"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CMP-CARDIO-2026",
  "title": "Chequeo Preventivo Cardiovascular y Perfil Lipídico",
  "description": "Texto descriptivo de ejemplo",
  "campaignType": "LABORATORY",
  "targetConditionCode": "I10",
  "copayBonusPercentage": 100,
  "validFrom": "2026-09-25",
  "validTo": "2026-11-24",
  "partners": [
    {
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Laboratorio Central AloVida",
      "partnerTenantId": "00000000-0000-4000-8000-000000000001",
      "networkProviderMembershipId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "activate": false
}
```

</details>

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:178` |

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. GET /insurance/campaigns/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar una campaña de la aseguradora activa
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Consultar una campaña de la aseguradora activa.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /insurance/campaigns/{id}`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:198` |

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. PATCH /insurance/campaigns/{id}

- **Origen:** CONTRATO
- **Nombre:** Editar una campaña en borrador o pausada (422 si está activa o vencida)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Editar una campaña en borrador o pausada (422 si está activa o vencida).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PATCH /insurance/campaigns/{id}`: handler no localizado en el código. Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateInsuranceCampaignDto` (13 campos, 0 obligatorios). No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateInsuranceCampaignDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `title` | `string` | No | longitud mínima 3; longitud máxima 200 | `@IsOptional()` `@IsString()` `@Length(3, 200)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:206` |
| `description` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:212` |
| `campaignType` | `string` | No | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | `@IsOptional()` `@IsIn(CAMPAIGN_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:217` |
| `targetConditionCode` | `string` | No | longitud máxima 16 | `@IsOptional()` `@IsString()` `@MaxLength(16)` | Código CIE-10 de la patología que se previene. Sólo descriptivo: no filtra afiliados (D4). | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:227` |
| `copayBonusPercentage` | `number` | No | mínimo 0; máximo 100 | `@IsOptional()` `@IsNumber({ maxDecimalPlaces: 2 })` `@Min(0)` `@Max(100)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:239` |
| `validFrom` | `string` | No | formato date; patrón runtime DATE_ONLY | `@IsOptional()` `@Matches(DATE_ONLY, { message: 'validFrom debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:245` |
| `validTo` | `string` | No | formato date; patrón runtime DATE_ONLY | `@IsOptional()` `@Matches(DATE_ONLY, { message: 'validTo debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:251` |
| `partners` | `array<InsuranceCampaignPartnerInputDto>` | No | mínimo 1 elemento(s); máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => InsuranceCampaignPartnerInputDto)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:260` |
| `partners[].role` | `string` | No | valores: SPONSOR, PROVIDER | `@IsIn(CAMPAIGN_PARTNER_ROLES)` | SPONSOR = importadora o fabricante que financia; PROVIDER = donde el afiliado se atiende | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:78` |
| `partners[].type` | `string` | No | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | `@IsIn(CAMPAIGN_PARTNER_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:82` |
| `partners[].name` | `string` | No | longitud mínima 2; longitud máxima 160 | `@IsString()` `@Length(2, 160)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:87` |
| `partners[].partnerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Referencia blanda al tenant del aliado, si es un tenant del sistema. Sin FK física. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:96` |
| `partners[].networkProviderMembershipId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Membresía de la red de prestadores de la aseguradora, si aplica. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:105` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "title": "Chequeo Preventivo Cardiovascular y Perfil Lipídico",
  "description": "Texto descriptivo de ejemplo",
  "campaignType": "LABORATORY",
  "targetConditionCode": "I10",
  "copayBonusPercentage": 100,
  "validFrom": "2026-09-25",
  "validTo": "2026-11-24",
  "partners": [
    {
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Laboratorio Central AloVida",
      "partnerTenantId": "00000000-0000-4000-8000-000000000001",
      "networkProviderMembershipId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:318` |

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. PATCH /insurance/campaigns/{id}/status

- **Origen:** CONTRATO
- **Nombre:** Activar, pausar o finalizar una campaña (transiciones cerradas)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Activar, pausar o finalizar una campaña (transiciones cerradas).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PATCH /insurance/campaigns/{id}/status`: handler no localizado en el código. Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateInsuranceCampaignStatusDto` (1 campo, 1 obligatorio). No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateInsuranceCampaignStatusDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: ACTIVE, PAUSED, EXPIRED | `@IsIn(CAMPAIGN_TARGET_STATUSES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:191` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "status": "ACTIVE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "ACTIVE"
}
```

</details>

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:232` |

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. GET /insurance/campaigns/active

- **Origen:** CONTRATO
- **Nombre:** Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /insurance/campaigns/active`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `carrierId` | query | No | `string` | Acota a una aseguradora. Sin filtro, trae de todas. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:332` |

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. GET /insurance/campaigns/my-benefits

- **Origen:** CONTRATO
- **Nombre:** Campañas vigentes de mi aseguradora, para el afiliado autenticado
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Campañas vigentes de mi aseguradora, para el afiliado autenticado.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /insurance/campaigns/my-benefits`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. GET /insurance/campaigns/patient/{patientProfileId}

- **Origen:** CONTRATO
- **Nombre:** Campañas vigentes de la aseguradora del afiliado (sólo el titular)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Campañas vigentes de la aseguradora del afiliado (sólo el titular).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /insurance/campaigns/patient/{patientProfileId}`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/insurance-campaigns.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- insurance-campaigns — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

