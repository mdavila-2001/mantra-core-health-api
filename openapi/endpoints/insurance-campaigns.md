<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `insurance-campaigns`

Referencia exhaustiva de 16 operación(es) del módulo `insurance-campaigns`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `insurance-campaigns`
- **Controladores:** No localizados
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /insurance-campaigns](#1-get-insurance-campaigns) — Listar las campañas de la aseguradora activa
2. [POST /insurance-campaigns](#2-post-insurance-campaigns) — Crear una campaña preventiva de la aseguradora
3. [GET /insurance-campaigns/{id}](#3-get-insurance-campaigns-id) — Consultar una campaña de la aseguradora activa
4. [PATCH /insurance-campaigns/{id}](#4-patch-insurance-campaigns-id) — Editar una campaña en borrador o pausada (422 si está activa o vencida)
5. [PATCH /insurance-campaigns/{id}/status](#5-patch-insurance-campaigns-id-status) — Activar, pausar o finalizar una campaña (transiciones cerradas)
6. [GET /insurance-campaigns/active](#6-get-insurance-campaigns-active) — Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`)
7. [GET /insurance-campaigns/my-benefits](#7-get-insurance-campaigns-my-benefits) — Campañas vigentes de mi aseguradora, para el afiliado autenticado
8. [GET /insurance-campaigns/patient/{patientProfileId}](#8-get-insurance-campaigns-patient-patientprofileid) — Campañas vigentes de la aseguradora del afiliado (sólo el titular)
9. [GET /insurance/campaigns](#9-get-insurance-campaigns) — Listar las campañas de la aseguradora activa
10. [POST /insurance/campaigns](#10-post-insurance-campaigns) — Crear una campaña preventiva de la aseguradora
11. [GET /insurance/campaigns/{id}](#11-get-insurance-campaigns-id) — Consultar una campaña de la aseguradora activa
12. [PATCH /insurance/campaigns/{id}](#12-patch-insurance-campaigns-id) — Editar una campaña en borrador o pausada (422 si está activa o vencida)
13. [PATCH /insurance/campaigns/{id}/status](#13-patch-insurance-campaigns-id-status) — Activar, pausar o finalizar una campaña (transiciones cerradas)
14. [GET /insurance/campaigns/active](#14-get-insurance-campaigns-active) — Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`)
15. [GET /insurance/campaigns/my-benefits](#15-get-insurance-campaigns-my-benefits) — Campañas vigentes de mi aseguradora, para el afiliado autenticado
16. [GET /insurance/campaigns/patient/{patientProfileId}](#16-get-insurance-campaigns-patient-patientprofileid) — Campañas vigentes de la aseguradora del afiliado (sólo el titular)

---

## 1. GET /insurance-campaigns

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Listar las campañas de la aseguradora activa
- **Operation ID:** `InsuranceCampaignsController_list[1]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Listar las campañas de la aseguradora activa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /insurance-campaigns` en `InsuranceCampaignsController_list[1]`. No se detectó una delegación adicional desde el controlador. No recibe body. No se encontró metadato estático adicional del controlador.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `type` | query | No | `string` | valores: `LABORATORY`, `PHARMACY`, `DIAGNOSTIC_IMAGING`, `VACCINATION` | Sin descripción específica en OpenAPI. | `LABORATORY` |
| `status` | query | No | `string` | valores: `DRAFT`, `ACTIVE`, `PAUSED`, `EXPIRED` | Sin descripción específica en OpenAPI. | `DRAFT` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `25` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-campaigns HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance-campaigns?type=LABORATORY&status=DRAFT&cursor=valor-ejemplo&limit=25 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-campaigns"
}
```

---

## 2. POST /insurance-campaigns

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Crear una campaña preventiva de la aseguradora
- **Operation ID:** `InsuranceCampaignsController_create[1]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Crear una campaña preventiva de la aseguradora. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /insurance-campaigns` en `InsuranceCampaignsController_create[1]`. No se detectó una delegación adicional desde el controlador. Valida el body como `CreateInsuranceCampaignDto` y consume `application/json`. No se encontró metadato estático adicional del controlador.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateInsuranceCampaignDto`; los campos opcionales se omiten.

```http
POST /insurance-campaigns HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | patrón runtime `/^[A-Z0-9][A-Z0-9-]{2,39}$/` | Único por aseguradora; mayúsculas, dígitos y guiones. | `CMP-CARDIO-2026` |
| `title` | Sí | `string` | longitud mínima 3; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Chequeo Preventivo Cardiovascular y Perfil Lipídico` |
| `description` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `campaignType` | Sí | `string` | valores: `LABORATORY`, `PHARMACY`, `DIAGNOSTIC_IMAGING`, `VACCINATION` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `targetConditionCode` | No | `string` | longitud máxima 16 | Código CIE-10 de la patología que se previene. Sólo descriptivo: no filtra afiliados (D4). | `I10` |
| `copayBonusPercentage` | Sí | `number` | mínimo 0; máximo 100 | Porcentaje del copago que la aseguradora bonifica. 100 = copago Bs. 0. | `100` |
| `validFrom` | Sí | `string` | formato `date`; patrón runtime `DATE_ONLY` | Sin descripción específica en el contrato OpenAPI. | `2026-09-25` |
| `validTo` | Sí | `string` | formato `date`; patrón runtime `DATE_ONLY` | Sin descripción específica en el contrato OpenAPI. | `2026-11-24` |
| `partners` | Sí | `array<InsuranceCampaignPartnerInputDto>` | mínimo 1 elemento(s); máximo 20 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"role":"SPONSOR","type":"IMPORTER","name":"Laboratorio Central AloVida","partnerTenantId":"00000000-0000-4000-8000-000000000001","networkProviderMembershipId":"00000000-0000-4000-8000-000000000001"}]` |
| `partners[].role` | Sí | `string` | valores: `SPONSOR`, `PROVIDER` | SPONSOR = importadora o fabricante que financia; PROVIDER = donde el afiliado se atiende | `SPONSOR` |
| `partners[].type` | Sí | `string` | valores: `IMPORTER`, `MANUFACTURER`, `LABORATORY`, `PHARMACY`, `MEDICAL_CENTER` | Sin descripción específica en el contrato OpenAPI. | `IMPORTER` |
| `partners[].name` | Sí | `string` | longitud mínima 2; longitud máxima 160 | Sin descripción específica en el contrato OpenAPI. | `Laboratorio Central AloVida` |
| `partners[].partnerTenantId` | No | `string` | formato `uuid` | Referencia blanda al tenant del aliado, si es un tenant del sistema. Sin FK física. | `00000000-0000-4000-8000-000000000001` |
| `partners[].networkProviderMembershipId` | No | `string` | formato `uuid` | Membresía de la red de prestadores de la aseguradora, si aplica. | `00000000-0000-4000-8000-000000000001` |
| `activate` | No | `boolean` | Sin restricción adicional declarada | Si es true, la campaña nace ACTIVE en vez de DRAFT. | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance-campaigns HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-campaigns"
}
```

---

## 3. GET /insurance-campaigns/{id}

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Consultar una campaña de la aseguradora activa
- **Operation ID:** `InsuranceCampaignsController_getById[1]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Consultar una campaña de la aseguradora activa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /insurance-campaigns/{id}` en `InsuranceCampaignsController_getById[1]`. No se detectó una delegación adicional desde el controlador. No recibe body. No se encontró metadato estático adicional del controlador.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-campaigns/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance-campaigns/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-campaigns/{id}"
}
```

---

## 4. PATCH /insurance-campaigns/{id}

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Editar una campaña en borrador o pausada (422 si está activa o vencida)
- **Operation ID:** `InsuranceCampaignsController_update[1]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Editar una campaña en borrador o pausada (422 si está activa o vencida). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /insurance-campaigns/{id}` en `InsuranceCampaignsController_update[1]`. No se detectó una delegación adicional desde el controlador. Valida el body como `UpdateInsuranceCampaignDto` y consume `application/json`. No se encontró metadato estático adicional del controlador.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateInsuranceCampaignDto`; los campos opcionales se omiten.

```http
PATCH /insurance-campaigns/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `title` | No | `string` | longitud mínima 3; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Chequeo Preventivo Cardiovascular y Perfil Lipídico` |
| `description` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `campaignType` | No | `string` | valores: `LABORATORY`, `PHARMACY`, `DIAGNOSTIC_IMAGING`, `VACCINATION` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `targetConditionCode` | No | `string` | longitud máxima 16 | Código CIE-10 de la patología que se previene. Sólo descriptivo: no filtra afiliados (D4). | `I10` |
| `copayBonusPercentage` | No | `number` | mínimo 0; máximo 100 | Sin descripción específica en el contrato OpenAPI. | `100` |
| `validFrom` | No | `string` | formato `date`; patrón runtime `DATE_ONLY` | Sin descripción específica en el contrato OpenAPI. | `2026-09-25` |
| `validTo` | No | `string` | formato `date`; patrón runtime `DATE_ONLY` | Sin descripción específica en el contrato OpenAPI. | `2026-11-24` |
| `partners` | No | `array<InsuranceCampaignPartnerInputDto>` | mínimo 1 elemento(s); máximo 20 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"role":"SPONSOR","type":"IMPORTER","name":"Laboratorio Central AloVida","partnerTenantId":"00000000-0000-4000-8000-000000000001","networkProviderMembershipId":"00000000-0000-4000-8000-000000000001"}]` |
| `partners[].role` | No | `string` | valores: `SPONSOR`, `PROVIDER` | SPONSOR = importadora o fabricante que financia; PROVIDER = donde el afiliado se atiende | `SPONSOR` |
| `partners[].type` | No | `string` | valores: `IMPORTER`, `MANUFACTURER`, `LABORATORY`, `PHARMACY`, `MEDICAL_CENTER` | Sin descripción específica en el contrato OpenAPI. | `IMPORTER` |
| `partners[].name` | No | `string` | longitud mínima 2; longitud máxima 160 | Sin descripción específica en el contrato OpenAPI. | `Laboratorio Central AloVida` |
| `partners[].partnerTenantId` | No | `string` | formato `uuid` | Referencia blanda al tenant del aliado, si es un tenant del sistema. Sin FK física. | `00000000-0000-4000-8000-000000000001` |
| `partners[].networkProviderMembershipId` | No | `string` | formato `uuid` | Membresía de la red de prestadores de la aseguradora, si aplica. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /insurance-campaigns/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-campaigns/{id}"
}
```

---

## 5. PATCH /insurance-campaigns/{id}/status

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Activar, pausar o finalizar una campaña (transiciones cerradas)
- **Operation ID:** `InsuranceCampaignsController_changeStatus[1]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Activar, pausar o finalizar una campaña (transiciones cerradas). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /insurance-campaigns/{id}/status` en `InsuranceCampaignsController_changeStatus[1]`. No se detectó una delegación adicional desde el controlador. Valida el body como `UpdateInsuranceCampaignStatusDto` y consume `application/json`. No se encontró metadato estático adicional del controlador.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateInsuranceCampaignStatusDto`; los campos opcionales se omiten.

```http
PATCH /insurance-campaigns/00000000-0000-4000-8000-000000000001/status HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "ACTIVE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `ACTIVE`, `PAUSED`, `EXPIRED` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /insurance-campaigns/00000000-0000-4000-8000-000000000001/status HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "ACTIVE"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-campaigns/{id}/status"
}
```

---

## 6. GET /insurance-campaigns/active

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`)
- **Operation ID:** `InsuranceCampaignsController_listActive[1]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /insurance-campaigns/active` en `InsuranceCampaignsController_listActive[1]`. No se detectó una delegación adicional desde el controlador. No recibe body. No se encontró metadato estático adicional del controlador.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `carrierId` | query | No | `string` | formato `uuid` | Acota a una aseguradora. Sin filtro, trae de todas. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-campaigns/active HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance-campaigns/active?carrierId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-campaigns/active"
}
```

---

## 7. GET /insurance-campaigns/my-benefits

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Campañas vigentes de mi aseguradora, para el afiliado autenticado
- **Operation ID:** `InsuranceCampaignsController_myBenefits[1]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Campañas vigentes de mi aseguradora, para el afiliado autenticado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /insurance-campaigns/my-benefits` en `InsuranceCampaignsController_myBenefits[1]`. No se detectó una delegación adicional desde el controlador. No recibe body. No se encontró metadato estático adicional del controlador.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-campaigns/my-benefits HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance-campaigns/my-benefits HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-campaigns/my-benefits"
}
```

---

## 8. GET /insurance-campaigns/patient/{patientProfileId}

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Campañas vigentes de la aseguradora del afiliado (sólo el titular)
- **Operation ID:** `InsuranceCampaignsController_listForPatient[1]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Campañas vigentes de la aseguradora del afiliado (sólo el titular). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /insurance-campaigns/patient/{patientProfileId}` en `InsuranceCampaignsController_listForPatient[1]`. No se detectó una delegación adicional desde el controlador. No recibe body. No se encontró metadato estático adicional del controlador.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-campaigns/patient/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance-campaigns/patient/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-campaigns/patient/{patientProfileId}"
}
```

---

## 9. GET /insurance/campaigns

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Listar las campañas de la aseguradora activa
- **Operation ID:** `InsuranceCampaignsController_list[0]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Listar las campañas de la aseguradora activa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /insurance/campaigns` en `InsuranceCampaignsController_list[0]`. No se detectó una delegación adicional desde el controlador. No recibe body. No se encontró metadato estático adicional del controlador.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `type` | query | No | `string` | valores: `LABORATORY`, `PHARMACY`, `DIAGNOSTIC_IMAGING`, `VACCINATION` | Sin descripción específica en OpenAPI. | `LABORATORY` |
| `status` | query | No | `string` | valores: `DRAFT`, `ACTIVE`, `PAUSED`, `EXPIRED` | Sin descripción específica en OpenAPI. | `DRAFT` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `25` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance/campaigns HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance/campaigns?type=LABORATORY&status=DRAFT&cursor=valor-ejemplo&limit=25 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance/campaigns"
}
```

---

## 10. POST /insurance/campaigns

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Crear una campaña preventiva de la aseguradora
- **Operation ID:** `InsuranceCampaignsController_create[0]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Crear una campaña preventiva de la aseguradora. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /insurance/campaigns` en `InsuranceCampaignsController_create[0]`. No se detectó una delegación adicional desde el controlador. Valida el body como `CreateInsuranceCampaignDto` y consume `application/json`. No se encontró metadato estático adicional del controlador.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateInsuranceCampaignDto`; los campos opcionales se omiten.

```http
POST /insurance/campaigns HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | patrón runtime `/^[A-Z0-9][A-Z0-9-]{2,39}$/` | Único por aseguradora; mayúsculas, dígitos y guiones. | `CMP-CARDIO-2026` |
| `title` | Sí | `string` | longitud mínima 3; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Chequeo Preventivo Cardiovascular y Perfil Lipídico` |
| `description` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `campaignType` | Sí | `string` | valores: `LABORATORY`, `PHARMACY`, `DIAGNOSTIC_IMAGING`, `VACCINATION` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `targetConditionCode` | No | `string` | longitud máxima 16 | Código CIE-10 de la patología que se previene. Sólo descriptivo: no filtra afiliados (D4). | `I10` |
| `copayBonusPercentage` | Sí | `number` | mínimo 0; máximo 100 | Porcentaje del copago que la aseguradora bonifica. 100 = copago Bs. 0. | `100` |
| `validFrom` | Sí | `string` | formato `date`; patrón runtime `DATE_ONLY` | Sin descripción específica en el contrato OpenAPI. | `2026-09-25` |
| `validTo` | Sí | `string` | formato `date`; patrón runtime `DATE_ONLY` | Sin descripción específica en el contrato OpenAPI. | `2026-11-24` |
| `partners` | Sí | `array<InsuranceCampaignPartnerInputDto>` | mínimo 1 elemento(s); máximo 20 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"role":"SPONSOR","type":"IMPORTER","name":"Laboratorio Central AloVida","partnerTenantId":"00000000-0000-4000-8000-000000000001","networkProviderMembershipId":"00000000-0000-4000-8000-000000000001"}]` |
| `partners[].role` | Sí | `string` | valores: `SPONSOR`, `PROVIDER` | SPONSOR = importadora o fabricante que financia; PROVIDER = donde el afiliado se atiende | `SPONSOR` |
| `partners[].type` | Sí | `string` | valores: `IMPORTER`, `MANUFACTURER`, `LABORATORY`, `PHARMACY`, `MEDICAL_CENTER` | Sin descripción específica en el contrato OpenAPI. | `IMPORTER` |
| `partners[].name` | Sí | `string` | longitud mínima 2; longitud máxima 160 | Sin descripción específica en el contrato OpenAPI. | `Laboratorio Central AloVida` |
| `partners[].partnerTenantId` | No | `string` | formato `uuid` | Referencia blanda al tenant del aliado, si es un tenant del sistema. Sin FK física. | `00000000-0000-4000-8000-000000000001` |
| `partners[].networkProviderMembershipId` | No | `string` | formato `uuid` | Membresía de la red de prestadores de la aseguradora, si aplica. | `00000000-0000-4000-8000-000000000001` |
| `activate` | No | `boolean` | Sin restricción adicional declarada | Si es true, la campaña nace ACTIVE en vez de DRAFT. | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance/campaigns HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance/campaigns"
}
```

---

## 11. GET /insurance/campaigns/{id}

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Consultar una campaña de la aseguradora activa
- **Operation ID:** `InsuranceCampaignsController_getById[0]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Consultar una campaña de la aseguradora activa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /insurance/campaigns/{id}` en `InsuranceCampaignsController_getById[0]`. No se detectó una delegación adicional desde el controlador. No recibe body. No se encontró metadato estático adicional del controlador.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance/campaigns/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance/campaigns/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance/campaigns/{id}"
}
```

---

## 12. PATCH /insurance/campaigns/{id}

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Editar una campaña en borrador o pausada (422 si está activa o vencida)
- **Operation ID:** `InsuranceCampaignsController_update[0]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Editar una campaña en borrador o pausada (422 si está activa o vencida). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /insurance/campaigns/{id}` en `InsuranceCampaignsController_update[0]`. No se detectó una delegación adicional desde el controlador. Valida el body como `UpdateInsuranceCampaignDto` y consume `application/json`. No se encontró metadato estático adicional del controlador.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateInsuranceCampaignDto`; los campos opcionales se omiten.

```http
PATCH /insurance/campaigns/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `title` | No | `string` | longitud mínima 3; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Chequeo Preventivo Cardiovascular y Perfil Lipídico` |
| `description` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `campaignType` | No | `string` | valores: `LABORATORY`, `PHARMACY`, `DIAGNOSTIC_IMAGING`, `VACCINATION` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `targetConditionCode` | No | `string` | longitud máxima 16 | Código CIE-10 de la patología que se previene. Sólo descriptivo: no filtra afiliados (D4). | `I10` |
| `copayBonusPercentage` | No | `number` | mínimo 0; máximo 100 | Sin descripción específica en el contrato OpenAPI. | `100` |
| `validFrom` | No | `string` | formato `date`; patrón runtime `DATE_ONLY` | Sin descripción específica en el contrato OpenAPI. | `2026-09-25` |
| `validTo` | No | `string` | formato `date`; patrón runtime `DATE_ONLY` | Sin descripción específica en el contrato OpenAPI. | `2026-11-24` |
| `partners` | No | `array<InsuranceCampaignPartnerInputDto>` | mínimo 1 elemento(s); máximo 20 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"role":"SPONSOR","type":"IMPORTER","name":"Laboratorio Central AloVida","partnerTenantId":"00000000-0000-4000-8000-000000000001","networkProviderMembershipId":"00000000-0000-4000-8000-000000000001"}]` |
| `partners[].role` | No | `string` | valores: `SPONSOR`, `PROVIDER` | SPONSOR = importadora o fabricante que financia; PROVIDER = donde el afiliado se atiende | `SPONSOR` |
| `partners[].type` | No | `string` | valores: `IMPORTER`, `MANUFACTURER`, `LABORATORY`, `PHARMACY`, `MEDICAL_CENTER` | Sin descripción específica en el contrato OpenAPI. | `IMPORTER` |
| `partners[].name` | No | `string` | longitud mínima 2; longitud máxima 160 | Sin descripción específica en el contrato OpenAPI. | `Laboratorio Central AloVida` |
| `partners[].partnerTenantId` | No | `string` | formato `uuid` | Referencia blanda al tenant del aliado, si es un tenant del sistema. Sin FK física. | `00000000-0000-4000-8000-000000000001` |
| `partners[].networkProviderMembershipId` | No | `string` | formato `uuid` | Membresía de la red de prestadores de la aseguradora, si aplica. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /insurance/campaigns/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance/campaigns/{id}"
}
```

---

## 13. PATCH /insurance/campaigns/{id}/status

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Activar, pausar o finalizar una campaña (transiciones cerradas)
- **Operation ID:** `InsuranceCampaignsController_changeStatus[0]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Activar, pausar o finalizar una campaña (transiciones cerradas). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /insurance/campaigns/{id}/status` en `InsuranceCampaignsController_changeStatus[0]`. No se detectó una delegación adicional desde el controlador. Valida el body como `UpdateInsuranceCampaignStatusDto` y consume `application/json`. No se encontró metadato estático adicional del controlador.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateInsuranceCampaignStatusDto`; los campos opcionales se omiten.

```http
PATCH /insurance/campaigns/00000000-0000-4000-8000-000000000001/status HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "ACTIVE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `ACTIVE`, `PAUSED`, `EXPIRED` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /insurance/campaigns/00000000-0000-4000-8000-000000000001/status HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "ACTIVE"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance/campaigns/{id}/status"
}
```

---

## 14. GET /insurance/campaigns/active

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`)
- **Operation ID:** `InsuranceCampaignsController_listActive[0]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /insurance/campaigns/active` en `InsuranceCampaignsController_listActive[0]`. No se detectó una delegación adicional desde el controlador. No recibe body. No se encontró metadato estático adicional del controlador.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `carrierId` | query | No | `string` | formato `uuid` | Acota a una aseguradora. Sin filtro, trae de todas. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance/campaigns/active HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance/campaigns/active?carrierId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance/campaigns/active"
}
```

---

## 15. GET /insurance/campaigns/my-benefits

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Campañas vigentes de mi aseguradora, para el afiliado autenticado
- **Operation ID:** `InsuranceCampaignsController_myBenefits[0]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Campañas vigentes de mi aseguradora, para el afiliado autenticado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /insurance/campaigns/my-benefits` en `InsuranceCampaignsController_myBenefits[0]`. No se detectó una delegación adicional desde el controlador. No recibe body. No se encontró metadato estático adicional del controlador.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance/campaigns/my-benefits HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance/campaigns/my-benefits HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance/campaigns/my-benefits"
}
```

---

## 16. GET /insurance/campaigns/patient/{patientProfileId}

- **Módulo:** `insurance-campaigns`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Campañas vigentes de la aseguradora del afiliado (sólo el titular)
- **Operation ID:** `InsuranceCampaignsController_listForPatient[0]`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Campañas vigentes de la aseguradora del afiliado (sólo el titular). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /insurance/campaigns/patient/{patientProfileId}` en `InsuranceCampaignsController_listForPatient[0]`. No se detectó una delegación adicional desde el controlador. No recibe body. No se encontró metadato estático adicional del controlador.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance/campaigns/patient/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance/campaigns/patient/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance/campaigns/patient/{patientProfileId}"
}
```

---

