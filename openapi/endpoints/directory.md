<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `directory`

Referencia exhaustiva de 19 operación(es) del módulo `directory`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `directory-admin-tenants`, `directory-tenants`
- **Controladores:** `AdminTenantsController`, `TenantsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /admin/tenants](#1-get-admin-tenants) — Listado paginado de organizaciones
2. [POST /admin/tenants](#2-post-admin-tenants) — Aprovisionar un tenant raíz con su membership owner
3. [PUT /admin/tenants/{tenantId}/public-profile](#3-put-admin-tenants-tenantid-public-profile) — Completar la ficha pública de una organización verificada
4. [POST /admin/tenants/{tenantId}/suspend](#4-post-admin-tenants-tenantid-suspend) — Suspender un tenant con cascada de revocación
5. [POST /admin/tenants/{tenantId}/verification](#5-post-admin-tenants-tenantid-verification) — Verificar y activar un tenant
6. [GET /tenants/{tenantId}](#6-get-tenants-tenantid) — Ficha de una organización
7. [PATCH /tenants/{tenantId}](#7-patch-tenants-tenantid) — Editar los datos de la propia organización
8. [GET /tenants/{tenantId}/branches](#8-get-tenants-tenantid-branches) — Sucursales de la organización
9. [POST /tenants/{tenantId}/branches](#9-post-tenants-tenantid-branches) — Crear una branch / sede física con geolocalización
10. [GET /tenants/{tenantId}/child-tenants](#10-get-tenants-tenantid-child-tenants) — Sub-organizaciones de una organización
11. [POST /tenants/{tenantId}/child-tenants](#11-post-tenants-tenantid-child-tenants) — Crear una organización hija / sub-tenant
12. [GET /tenants/{tenantId}/memberships](#12-get-tenants-tenantid-memberships) — Plantilla de la organización
13. [POST /tenants/{tenantId}/memberships](#13-post-tenants-tenantid-memberships) — Incorporar un usuario al tenant (membership)
14. [GET /tenants/{tenantId}/memberships/{membershipId}/branch-assignments](#14-get-tenants-tenantid-memberships-membershipid-branch-assignments) — Sucursales asignadas a una membresía
15. [POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments](#15-post-tenants-tenantid-memberships-membershipid-branch-assignments) — Asignar la membresía a una branch
16. [POST /tenants/{tenantId}/memberships/{membershipId}/offboard](#16-post-tenants-tenantid-memberships-membershipid-offboard) — Revocar / offboarding de un miembro
17. [PATCH /tenants/{tenantId}/memberships/{membershipId}/role](#17-patch-tenants-tenantid-memberships-membershipid-role) — Cambiar rol / scope de la membresía
18. [POST /tenants/{tenantId}/memberships/{membershipId}/transfer](#18-post-tenants-tenantid-memberships-membershipid-transfer) — Transferir la membresía entre branches
19. [GET /tenants/me](#19-get-tenants-me) — Las organizaciones del actor, con su rol en cada una

---

## 1. GET /admin/tenants

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-admin-tenants`
- **Nombre:** Listado paginado de organizaciones
- **Operation ID:** `AdminTenantsController_searchTenants`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminTenantsController.searchTenants](../../src/modules/directory/controllers/admin-tenants.controller.ts)

### Descripción de negocio

Listado paginado de organizaciones. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-04-01 (cara de lectura): listado de organizaciones de la plataforma. Va antes que las rutas con parámetro para que ninguna capture un segmento fijo.

### Descripción del sistema

NestJS resuelve `GET /admin/tenants` en `AdminTenantsController_searchTenants`. El controlador delega en `DirectoryReadService.searchTenants`. No recibe body. El tipo de retorno estático es `Promise<SearchTenantsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en el código, la razón social o el nombre comercial | `valor-ejemplo` |
| `status` | query | No | `string` | Sin restricción adicional declarada | Concepto de estado al que acotar | `ok` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope de resultados (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/tenants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPERADMIN`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/tenants?q=valor-ejemplo&status=ok&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SearchTenantsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SearchTenantsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SearchTenantsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SearchTenantsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SearchTenantsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SearchTenantsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SearchTenantsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "legalName": "Nombre de ejemplo",
      "tradeName": "Nombre de ejemplo",
      "tenantTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "parentTenantId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<TenantListItemDto>` | Sin restricción adicional declarada | Organizaciones de esta página, ordenadas por código. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","legalName":"Nombre de ejemplo","tradeName":"Nombre de ejemplo","tenantTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","verificationStatusConceptId":"00000000-0000-4000-8000-000000000001","parentTenantId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la organización. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código único de la organización. | `CODIGO_EJEMPLO` |
| `items[].legalName` | Sí | `string` | Sin restricción adicional declarada | Razón social. | `Nombre de ejemplo` |
| `items[].tradeName` | No | `string` | Sin restricción adicional declarada | Nombre comercial, si lo tiene. | `Nombre de ejemplo` |
| `items[].tenantTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de organización. | `00000000-0000-4000-8000-000000000001` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Estado de la organización. | `00000000-0000-4000-8000-000000000001` |
| `items[].verificationStatusConceptId` | Sí | `string` | formato `uuid` | Estado de verificación de la documentación. | `00000000-0000-4000-8000-000000000001` |
| `items[].parentTenantId` | No | `string` | formato `uuid`; admite null | Organización madre, si es una sub-organización. | `00000000-0000-4000-8000-000000000001` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Alta de la organización. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor opaco de continuación, o `null` si ésta es la última página. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPERADMIN, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/tenants"
}
```

---

## 2. POST /admin/tenants

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-admin-tenants`
- **Nombre:** Aprovisionar un tenant raíz con su membership owner
- **Operation ID:** `AdminTenantsController_provision`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminTenantsController.provision](../../src/modules/directory/controllers/admin-tenants.controller.ts)

### Descripción de negocio

Aprovisionar un tenant raíz con su membership owner. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/tenants` en `AdminTenantsController_provision`. El controlador delega en `DirectoryTenantsService.provision`. Valida el body como `CreateTenantDto` y consume `application/json`. El tipo de retorno estático es `Promise<TenantResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTenantDto`; los campos opcionales se omiten.

```http
POST /admin/tenants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "ownerUserId": "00000000-0000-4000-8000-000000000001",
  "tenantType": "PROVIDER"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPERADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único global del tenant | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | longitud mínima 1; longitud máxima 300 | Razón social / nombre legal | `Nombre de ejemplo` |
| `ownerUserId` | Sí | `string` | formato `uuid` | Usuario que será owner inicial del tenant | `00000000-0000-4000-8000-000000000001` |
| `tradeName` | No | `string` | longitud máxima 300 | Nombre comercial | `Nombre de ejemplo` |
| `tenantType` | Sí | `string` | valores: `PROVIDER`, `PAYER`, `BROKER`, `UNIVERSITY`, `PHARMACY`, `HOSPITAL`, `MEDICAL_OFFICE`, `NURSING`, `HEALTH_OTHER`, `HEALTH_BUSINESS`, `DIAGNOSTIC_CENTER` | Tipo de organización. Obligatorio: cada tipo exige sus propios datos (PAYER el bloque `payer`, BROKER el bloque `broker`; el resto —PROVIDER, UNIVERSITY, PHARMACY, HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER, HEALTH_BUSINESS, DIAGNOSTIC_CENTER— país y jurisdicción). Esta puerta administrativa no acepta todavía el bloque `diagnosticUnit` de DIAGNOSTIC_CENTER: la unidad diagnóstica se materializa con sus valores por defecto. | `PROVIDER` |
| `tenantTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de tenant. Escotilla para tipos fuera del catálogo interno; si viene `tenantType`, este campo se ignora. | `00000000-0000-4000-8000-000000000001` |
| `legalEntityType` | No | `string` | valores: `UNIPERSONAL`, `SRL`, `LTDA`, `SA`, `SOCIEDAD_COLECTIVA`, `COMANDITA_SIMPLE`, `COMANDITA_ACCIONES`, `SUCURSAL_EXTRANJERA`, `BR_LTDA`, `BR_SA`, `BR_MEI`, `BR_EI`, `BR_SLU`, `BR_FILIAL_EST`, `US_LLC`, `US_CORP`, `US_SOLE_PROP`, `US_LLP`, `US_BRANCH`, `AR_SAS`, `MX_S_RL` | Tipo societario del diccionario internacional (BO/BR/US/AR/MX). Si viene, se ignora `legalEntityTypeConceptId`. | `SRL` |
| `legalEntityTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de entidad legal | `00000000-0000-4000-8000-000000000001` |
| `dataResidencyRegionConceptId` | No | `string` | formato `uuid` | Concept id de la región de residencia de datos | `00000000-0000-4000-8000-000000000001` |
| `timeZone` | No | `string` | longitud máxima 100 | Zona horaria IANA | `America/La_Paz` |
| `payer` | No | `PayerProfileDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"carrierCode":"CODIGO_EJEMPLO","sigla":"BUPA","address":"valor-ejemplo","regulatorIdentifier":"valor-ejemplo","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001"}` |
| `payer.carrierCode` | No | `string` | longitud mínima 1; longitud máxima 60 | Código de la aseguradora | `CODIGO_EJEMPLO` |
| `payer.sigla` | No | `string` | longitud mínima 1; longitud máxima 20 | Sigla de la aseguradora | `BUPA` |
| `payer.address` | No | `string` | longitud mínima 1; longitud máxima 300 | Dirección de la aseguradora | `valor-ejemplo` |
| `payer.regulatorIdentifier` | No | `string` | longitud mínima 1; longitud máxima 100 | Identificador ante el regulador de seguros | `valor-ejemplo` |
| `payer.jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `broker` | No | `BrokerProfileDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","brokerCode":"CODIGO_EJEMPLO","legalName":"Nombre de ejemplo","licenseNumber":"valor-ejemplo","jurisdiction":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"verification":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"independent":true,"currentCarrierCount":1,"createdAt":"2026-07-31T12:00:00.000Z","agreements":[{"id":"00000000-0000-4000-8000-000000000001","insuranceCarrierId":"00000000-0000-4000-8000-000000000001","carrierLegalName":"Nombre de ejemplo","agreementCode":"CODIGO_EJEMPLO","commissionModel":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"current":true,"contractFileId":"00000000-0000-4000-8000-000000000001"}],"publicProfileId":"00000000-0000-4000-8000-000000000001"}` |
| `broker.id` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `broker.brokerCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `broker.legalName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `broker.licenseNumber` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `broker.jurisdiction` | No | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `broker.jurisdiction.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `broker.jurisdiction.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `broker.status` | No | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `broker.status.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `broker.status.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `broker.verification` | No | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `broker.verification.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `broker.verification.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `broker.independent` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `broker.currentCarrierCount` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `broker.createdAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `broker.agreements` | No | `array<BrokerAgreementDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","insuranceCarrierId":"00000000-0000-4000-8000-000000000001","carrierLegalName":"Nombre de ejemplo","agreementCode":"CODIGO_EJEMPLO","commissionModel":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"current":true,"contractFileId":"00000000-0000-4000-8000-000000000001"}]` |
| `broker.agreements[].id` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `broker.agreements[].insuranceCarrierId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `broker.agreements[].carrierLegalName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `broker.agreements[].agreementCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `broker.agreements[].commissionModel` | No | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `broker.agreements[].commissionModel.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `broker.agreements[].commissionModel.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `broker.agreements[].effectiveFrom` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `broker.agreements[].effectiveTo` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `broker.agreements[].status` | No | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `broker.agreements[].status.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `broker.agreements[].status.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `broker.agreements[].current` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `broker.agreements[].contractFileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `broker.publicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `countryConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/tenants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "ownerUserId": "00000000-0000-4000-8000-000000000001",
  "tradeName": "Nombre de ejemplo",
  "tenantType": "PROVIDER",
  "tenantTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "legalEntityType": "SRL",
  "legalEntityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "dataResidencyRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "timeZone": "America/La_Paz",
  "payer": {
    "carrierCode": "CODIGO_EJEMPLO",
    "sigla": "BUPA",
    "address": "valor-ejemplo",
    "regulatorIdentifier": "valor-ejemplo",
    "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
  },
  "broker": {
    "id": "00000000-0000-4000-8000-000000000001",
    "brokerCode": "CODIGO_EJEMPLO",
    "legalName": "Nombre de ejemplo",
    "licenseNumber": "valor-ejemplo",
    "jurisdiction": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    },
    "status": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    },
    "verification": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    },
    "independent": true,
    "currentCarrierCount": 1,
    "createdAt": "2026-07-31T12:00:00.000Z",
    "agreements": [
      {
        "id": "00000000-0000-4000-8000-000000000001",
        "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
        "carrierLegalName": "Nombre de ejemplo",
        "agreementCode": "CODIGO_EJEMPLO",
        "commissionModel": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        },
        "effectiveFrom": "valor-ejemplo",
        "effectiveTo": "valor-ejemplo",
        "status": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        },
        "current": true,
        "contractFileId": "00000000-0000-4000-8000-000000000001"
      }
    ],
    "publicProfileId": "00000000-0000-4000-8000-000000000001"
  },
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TenantResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TenantResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "parentTenantId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | Sin restricción adicional declarada | Valor de legal name mantenido por la instancia. | `Nombre de ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del tenant | `00000000-0000-4000-8000-000000000001` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id del estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `parentTenantId` | No | `string` | formato `uuid` | Tenant padre si es sub-tenant | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPERADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El código de tenant ya existe | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo PAYER exige el bloque `payer` | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo BROKER exige el bloque `broker` | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo ${tenantType} exige país y jurisdicción | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El tipo societario pertenece al derecho de ${entry!.countryIso} y no coincide con el país declarado | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El bloque `payer` sólo corresponde a un tenant de tipo PAYER | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El bloque `broker` sólo corresponde a un tenant de tipo BROKER | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El bloque `diagnosticUnit` sólo corresponde a un tenant de tipo ' +           'DIAGNOSTIC_CENTER | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El tipo de unidad diagnóstica declarado no es válido | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Alguna modalidad declarada no pertenece al catálogo de modalidades diagnósticas | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Los conceptos declarados no existen en el catálogo de terminología | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/tenants"
}
```

---

## 3. PUT /admin/tenants/{tenantId}/public-profile

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-admin-tenants`
- **Nombre:** Completar la ficha pública de una organización verificada
- **Operation ID:** `AdminTenantsController_updatePublicProfile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminTenantsController.updatePublicProfile](../../src/modules/directory/controllers/admin-tenants.controller.ts)

### Descripción de negocio

Completar la ficha pública de una organización verificada. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Llena la vitrina pública de la organización. `PUT` y no `PATCH` porque es idempotente y la pantalla que la edita no necesita saber si ya había algo escrito; los campos omitidos se conservan, que es la misma regla que `PUT /community/profiles/me`.

### Descripción del sistema

NestJS resuelve `PUT /admin/tenants/{tenantId}/public-profile` en `AdminTenantsController_updatePublicProfile`. El controlador delega en `DirectoryTenantsService.updatePublicProfile`. Valida el body como `UpdateTenantPublicProfileDto` y consume `application/json`. El tipo de retorno estático es `Promise<TenantResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateTenantPublicProfileDto`; los campos opcionales se omiten.

```http
PUT /admin/tenants/00000000-0000-4000-8000-000000000001/public-profile HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPERADMIN`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `tenantId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `displayName` | No | `string` | longitud máxima 200 | Nombre visible en el directorio público | `Nombre de ejemplo` |
| `headline` | No | `string` | longitud máxima 200 | Titular corto: qué es el centro en una línea | `valor-ejemplo` |
| `biography` | No | `string` | longitud máxima 5000 | Presentación pública del centro | `valor-ejemplo` |
| `avatarFileId` | No | `string` | formato `uuid` | Archivo del logo, ya subido | `00000000-0000-4000-8000-000000000001` |
| `coverFileId` | No | `string` | formato `uuid` | Archivo de la portada, ya subido | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /admin/tenants/00000000-0000-4000-8000-000000000001/public-profile HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "displayName": "Nombre de ejemplo",
  "headline": "valor-ejemplo",
  "biography": "valor-ejemplo",
  "avatarFileId": "00000000-0000-4000-8000-000000000001",
  "coverFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TenantResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "parentTenantId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | Sin restricción adicional declarada | Valor de legal name mantenido por la instancia. | `Nombre de ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del tenant | `00000000-0000-4000-8000-000000000001` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id del estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `parentTenantId` | No | `string` | formato `uuid` | Tenant padre si es sub-tenant | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPERADMIN, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Tenant no encontrado | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 404 | `NOT_FOUND` | Esta organización todavía no tiene vitrina pública: se proyecta al verificarla | Excepción explícita en src/modules/community/services/public-profile-projection.service.ts |
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
  "path": "/admin/tenants/{tenantId}/public-profile"
}
```

---

## 4. POST /admin/tenants/{tenantId}/suspend

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-admin-tenants`
- **Nombre:** Suspender un tenant con cascada de revocación
- **Operation ID:** `AdminTenantsController_suspend`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminTenantsController.suspend](../../src/modules/directory/controllers/admin-tenants.controller.ts)

### Descripción de negocio

Suspender un tenant con cascada de revocación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/tenants/{tenantId}/suspend` en `AdminTenantsController_suspend`. El controlador delega en `DirectoryTenantsService.suspend`. Valida el body como `SuspendTenantDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SuspendTenantDto`; los campos opcionales se omiten.

```http
POST /admin/tenants/00000000-0000-4000-8000-000000000001/suspend HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPERADMIN`.
- Deben ser UUID válidos: `tenantId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | longitud mínima 1; longitud máxima 500 | Motivo de la suspensión (queda en auditoría) | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/tenants/00000000-0000-4000-8000-000000000001/suspend HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPERADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Tenant no encontrado | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El tenant no está activo | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/tenants/{tenantId}/suspend"
}
```

---

## 5. POST /admin/tenants/{tenantId}/verification

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-admin-tenants`
- **Nombre:** Verificar y activar un tenant
- **Operation ID:** `AdminTenantsController_verify`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminTenantsController.verify](../../src/modules/directory/controllers/admin-tenants.controller.ts)

### Descripción de negocio

Verificar y activar un tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/tenants/{tenantId}/verification` en `AdminTenantsController_verify`. El controlador delega en `DirectoryTenantsService.verify`. Valida el body como `VerifyTenantDto` y consume `application/json`. El tipo de retorno estático es `Promise<TenantResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VerifyTenantDto`; los campos opcionales se omiten.

```http
POST /admin/tenants/00000000-0000-4000-8000-000000000001/verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `tenantId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `countryConceptId` | No | `string` | formato `uuid` | Concept id del país confirmado | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Concept id de la jurisdicción confirmada | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/tenants/00000000-0000-4000-8000-000000000001/verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TenantResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "parentTenantId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | Sin restricción adicional declarada | Valor de legal name mantenido por la instancia. | `Nombre de ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del tenant | `00000000-0000-4000-8000-000000000001` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id del estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `parentTenantId` | No | `string` | formato `uuid` | Tenant padre si es sub-tenant | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Tenant no encontrado | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El tenant no está pendiente de verificación | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/tenants/{tenantId}/verification"
}
```

---

## 6. GET /tenants/{tenantId}

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Ficha de una organización
- **Operation ID:** `TenantsController_getTenant`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.getTenant](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Ficha de una organización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /tenants/{tenantId}` en `TenantsController_getTenant`. El controlador delega en `DirectoryReadService.getTenantById`. No recibe body. El tipo de retorno estático es `Promise<TenantDetailResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /tenants/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /tenants/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TenantDetailResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<TenantDetailResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<TenantDetailResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<TenantDetailResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<TenantDetailResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<TenantDetailResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<TenantDetailResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TenantDetailResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "legalEntityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "dataResidencyRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "timeZone": "America/La_Paz",
  "updatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `legalEntityTypeConceptId` | Sí | `string` | formato `uuid` | Forma jurídica. | `00000000-0000-4000-8000-000000000001` |
| `countryConceptId` | No | `string` | formato `uuid` | País de constitución. | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Jurisdicción bajo la que opera. | `00000000-0000-4000-8000-000000000001` |
| `dataResidencyRegionConceptId` | No | `string` | formato `uuid` | Región donde residen sus datos. | `00000000-0000-4000-8000-000000000001` |
| `currencyConceptId` | No | `string` | formato `uuid` | Moneda con la que opera. | `00000000-0000-4000-8000-000000000001` |
| `timeZone` | No | `string` | Sin restricción adicional declarada | Zona horaria de la organización. | `America/La_Paz` |
| `updatedAt` | Sí | `string` | formato `date-time` | Última modificación del registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Organización no encontrada | Excepción explícita en src/modules/directory/services/directory-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}"
}
```

---

## 7. PATCH /tenants/{tenantId}

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Editar los datos de la propia organización
- **Operation ID:** `TenantsController_updateTenant`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.updateTenant](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Editar los datos de la propia organización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: TP-1: la organización corrige sus propios datos. Sólo owner o admin **de esa** organización (o la plataforma): un `staff` la ve y no la edita.

### Descripción del sistema

NestJS resuelve `PATCH /tenants/{tenantId}` en `TenantsController_updateTenant`. El controlador delega en `DirectoryTenantsService.updateTenant`. Valida el body como `UpdateTenantDto` y consume `application/json`. El tipo de retorno estático es `Promise<TenantResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateTenantDto`; los campos opcionales se omiten.

```http
PATCH /tenants/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `legalName` | No | `string` | longitud mínima 1; longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `tradeName` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `timeZone` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `payer` | No | `UpdatePayerProfileDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"sigla":"BUPA","address":"valor-ejemplo","regulatorIdentifier":"valor-ejemplo"}` |
| `payer.sigla` | No | `string` | longitud máxima 20 | Sin descripción específica en el contrato OpenAPI. | `BUPA` |
| `payer.address` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `payer.regulatorIdentifier` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /tenants/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "legalName": "Nombre de ejemplo",
  "tradeName": "Nombre de ejemplo",
  "timeZone": "America/La_Paz",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "payer": {
    "sigla": "BUPA",
    "address": "valor-ejemplo",
    "regulatorIdentifier": "valor-ejemplo"
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TenantResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "parentTenantId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | Sin restricción adicional declarada | Valor de legal name mantenido por la instancia. | `Nombre de ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del tenant | `00000000-0000-4000-8000-000000000001` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id del estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `parentTenantId` | No | `string` | formato `uuid` | Tenant padre si es sub-tenant | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Organización no encontrada | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
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
  "path": "/tenants/{tenantId}"
}
```

---

## 8. GET /tenants/{tenantId}/branches

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Sucursales de la organización
- **Operation ID:** `TenantsController_listBranches`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.listBranches](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Sucursales de la organización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-04-02 (cara de lectura).

### Descripción del sistema

NestJS resuelve `GET /tenants/{tenantId}/branches` en `TenantsController_listBranches`. El controlador delega en `DirectoryReadService.listBranches`. No recibe body. El tipo de retorno estático es `Promise<ListBranchesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /tenants/00000000-0000-4000-8000-000000000001/branches HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /tenants/00000000-0000-4000-8000-000000000001/branches HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListBranchesResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListBranchesResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListBranchesResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListBranchesResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ListBranchesResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListBranchesResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListBranchesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListBranchesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "branchTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "timeZone": "America/La_Paz",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<BranchListItemDto>` | Sin restricción adicional declarada | Sucursales, ordenadas por código. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","branchTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","timeZone":"America/La_Paz","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la sucursal. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código de la sucursal dentro de la organización. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sucursal. | `Nombre de ejemplo` |
| `items[].branchTypeConceptId` | No | `string` | formato `uuid` | Tipo de sucursal. | `00000000-0000-4000-8000-000000000001` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Estado de la sucursal. | `00000000-0000-4000-8000-000000000001` |
| `items[].timeZone` | No | `string` | Sin restricción adicional declarada | Zona horaria de la sucursal. | `America/La_Paz` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Alta de la sucursal. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas sucursales trae la respuesta. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Organización no encontrada | Excepción explícita en src/modules/directory/services/directory-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/branches"
}
```

---

## 9. POST /tenants/{tenantId}/branches

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Crear una branch / sede física con geolocalización
- **Operation ID:** `TenantsController_createBranch`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.createBranch](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Crear una branch / sede física con geolocalización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/branches` en `TenantsController_createBranch`. El controlador delega en `DirectoryBranchesService.create`. Valida el body como `CreateBranchDto` y consume `application/json`. El tipo de retorno estático es `Promise<BranchResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateBranchDto`; los campos opcionales se omiten.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/branches HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código de la sede, único dentro del tenant | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 300 | Nombre de la sede | `Nombre de ejemplo` |
| `branchType` | No | `string` | valores: `CLINIC`, `OFFICE` | Tipo de sede | `CLINIC` |
| `timeZone` | No | `string` | longitud máxima 100 | Zona horaria IANA | `America/La_Paz` |
| `latitude` | No | `number` | mínimo -90; máximo 90 | Latitud geográfica | `-12.0464` |
| `longitude` | No | `number` | mínimo -180; máximo 180 | Longitud geográfica | `-77.0428` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/branches HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "branchType": "CLINIC",
  "timeZone": "America/La_Paz",
  "latitude": -12.0464,
  "longitude": -77.0428
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BranchResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BranchResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado de la branch | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Tenant no encontrado | Excepción explícita en src/modules/directory/services/directory-branches.service.ts |
| 409 | `CONFLICT` | Ya existe una branch con ese código en el tenant | Excepción explícita en src/modules/directory/services/directory-branches.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El tenant no está activo | Excepción explícita en src/modules/directory/services/directory-branches.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/branches"
}
```

---

## 10. GET /tenants/{tenantId}/child-tenants

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Sub-organizaciones de una organización
- **Operation ID:** `TenantsController_listChildTenants`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.listChildTenants](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Sub-organizaciones de una organización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-04-03 (cara de lectura).

### Descripción del sistema

NestJS resuelve `GET /tenants/{tenantId}/child-tenants` en `TenantsController_listChildTenants`. El controlador delega en `DirectoryReadService.listChildTenants`. No recibe body. El tipo de retorno estático es `Promise<SearchTenantsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /tenants/00000000-0000-4000-8000-000000000001/child-tenants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /tenants/00000000-0000-4000-8000-000000000001/child-tenants?cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SearchTenantsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SearchTenantsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SearchTenantsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SearchTenantsResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<SearchTenantsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SearchTenantsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SearchTenantsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SearchTenantsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "legalName": "Nombre de ejemplo",
      "tradeName": "Nombre de ejemplo",
      "tenantTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "parentTenantId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<TenantListItemDto>` | Sin restricción adicional declarada | Organizaciones de esta página, ordenadas por código. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","legalName":"Nombre de ejemplo","tradeName":"Nombre de ejemplo","tenantTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","verificationStatusConceptId":"00000000-0000-4000-8000-000000000001","parentTenantId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la organización. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código único de la organización. | `CODIGO_EJEMPLO` |
| `items[].legalName` | Sí | `string` | Sin restricción adicional declarada | Razón social. | `Nombre de ejemplo` |
| `items[].tradeName` | No | `string` | Sin restricción adicional declarada | Nombre comercial, si lo tiene. | `Nombre de ejemplo` |
| `items[].tenantTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de organización. | `00000000-0000-4000-8000-000000000001` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Estado de la organización. | `00000000-0000-4000-8000-000000000001` |
| `items[].verificationStatusConceptId` | Sí | `string` | formato `uuid` | Estado de verificación de la documentación. | `00000000-0000-4000-8000-000000000001` |
| `items[].parentTenantId` | No | `string` | formato `uuid`; admite null | Organización madre, si es una sub-organización. | `00000000-0000-4000-8000-000000000001` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Alta de la organización. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor opaco de continuación, o `null` si ésta es la última página. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Organización no encontrada | Excepción explícita en src/modules/directory/services/directory-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/child-tenants"
}
```

---

## 11. POST /tenants/{tenantId}/child-tenants

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Crear una organización hija / sub-tenant
- **Operation ID:** `TenantsController_createChild`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.createChild](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Crear una organización hija / sub-tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/child-tenants` en `TenantsController_createChild`. El controlador delega en `DirectoryTenantsService.createChild`. Valida el body como `CreateChildTenantDto` y consume `application/json`. El tipo de retorno estático es `Promise<TenantResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateChildTenantDto`; los campos opcionales se omiten.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/child-tenants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "adminUserId": "00000000-0000-4000-8000-000000000001",
  "tenantType": "PROVIDER"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `tenantId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único global del sub-tenant | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | longitud mínima 1; longitud máxima 300 | Razón social / nombre legal del sub-tenant | `Nombre de ejemplo` |
| `adminUserId` | Sí | `string` | formato `uuid` | Usuario administrador inicial del sub-tenant | `00000000-0000-4000-8000-000000000001` |
| `tenantType` | Sí | `string` | valores: `PROVIDER`, `PAYER`, `BROKER`, `UNIVERSITY`, `PHARMACY`, `HOSPITAL`, `MEDICAL_OFFICE`, `NURSING`, `HEALTH_OTHER`, `HEALTH_BUSINESS`, `DIAGNOSTIC_CENTER` | Tipo de organización. Obligatorio: cada tipo exige sus propios datos (PAYER el bloque `payer`, BROKER el bloque `broker`; el resto —PROVIDER, UNIVERSITY, PHARMACY, HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER, HEALTH_BUSINESS, DIAGNOSTIC_CENTER— país y jurisdicción). Esta puerta administrativa no acepta todavía el bloque `diagnosticUnit` de DIAGNOSTIC_CENTER: la unidad diagnóstica se materializa con sus valores por defecto. | `PROVIDER` |
| `tenantTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de tenant. Si viene `tenantType`, se ignora. | `00000000-0000-4000-8000-000000000001` |
| `legalEntityType` | No | `string` | valores: `UNIPERSONAL`, `SRL`, `LTDA`, `SA`, `SOCIEDAD_COLECTIVA`, `COMANDITA_SIMPLE`, `COMANDITA_ACCIONES`, `SUCURSAL_EXTRANJERA`, `BR_LTDA`, `BR_SA`, `BR_MEI`, `BR_EI`, `BR_SLU`, `BR_FILIAL_EST`, `US_LLC`, `US_CORP`, `US_SOLE_PROP`, `US_LLP`, `US_BRANCH`, `AR_SAS`, `MX_S_RL` | Tipo societario del diccionario internacional (BO/BR/US/AR/MX). Si viene, se ignora `legalEntityTypeConceptId`. | `SRL` |
| `legalEntityTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de entidad legal | `00000000-0000-4000-8000-000000000001` |
| `dataResidencyRegionConceptId` | No | `string` | formato `uuid` | Región de residencia de datos (por defecto hereda la del padre) | `00000000-0000-4000-8000-000000000001` |
| `payer` | No | `PayerProfileDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"carrierCode":"CODIGO_EJEMPLO","sigla":"BUPA","address":"valor-ejemplo","regulatorIdentifier":"valor-ejemplo","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001"}` |
| `payer.carrierCode` | No | `string` | longitud mínima 1; longitud máxima 60 | Código de la aseguradora | `CODIGO_EJEMPLO` |
| `payer.sigla` | No | `string` | longitud mínima 1; longitud máxima 20 | Sigla de la aseguradora | `BUPA` |
| `payer.address` | No | `string` | longitud mínima 1; longitud máxima 300 | Dirección de la aseguradora | `valor-ejemplo` |
| `payer.regulatorIdentifier` | No | `string` | longitud mínima 1; longitud máxima 100 | Identificador ante el regulador de seguros | `valor-ejemplo` |
| `payer.jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `broker` | No | `BrokerProfileDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","brokerCode":"CODIGO_EJEMPLO","legalName":"Nombre de ejemplo","licenseNumber":"valor-ejemplo","jurisdiction":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"verification":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"independent":true,"currentCarrierCount":1,"createdAt":"2026-07-31T12:00:00.000Z","agreements":[{"id":"00000000-0000-4000-8000-000000000001","insuranceCarrierId":"00000000-0000-4000-8000-000000000001","carrierLegalName":"Nombre de ejemplo","agreementCode":"CODIGO_EJEMPLO","commissionModel":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"current":true,"contractFileId":"00000000-0000-4000-8000-000000000001"}],"publicProfileId":"00000000-0000-4000-8000-000000000001"}` |
| `broker.id` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `broker.brokerCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `broker.legalName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `broker.licenseNumber` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `broker.jurisdiction` | No | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `broker.jurisdiction.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `broker.jurisdiction.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `broker.status` | No | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `broker.status.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `broker.status.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `broker.verification` | No | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `broker.verification.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `broker.verification.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `broker.independent` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `broker.currentCarrierCount` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `broker.createdAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `broker.agreements` | No | `array<BrokerAgreementDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","insuranceCarrierId":"00000000-0000-4000-8000-000000000001","carrierLegalName":"Nombre de ejemplo","agreementCode":"CODIGO_EJEMPLO","commissionModel":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"current":true,"contractFileId":"00000000-0000-4000-8000-000000000001"}]` |
| `broker.agreements[].id` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `broker.agreements[].insuranceCarrierId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `broker.agreements[].carrierLegalName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `broker.agreements[].agreementCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `broker.agreements[].commissionModel` | No | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `broker.agreements[].commissionModel.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `broker.agreements[].commissionModel.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `broker.agreements[].effectiveFrom` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `broker.agreements[].effectiveTo` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `broker.agreements[].status` | No | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `broker.agreements[].status.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `broker.agreements[].status.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `broker.agreements[].current` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `broker.agreements[].contractFileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `broker.publicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `countryConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/child-tenants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "adminUserId": "00000000-0000-4000-8000-000000000001",
  "tenantType": "PROVIDER",
  "tenantTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "legalEntityType": "SRL",
  "legalEntityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "dataResidencyRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "payer": {
    "carrierCode": "CODIGO_EJEMPLO",
    "sigla": "BUPA",
    "address": "valor-ejemplo",
    "regulatorIdentifier": "valor-ejemplo",
    "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
  },
  "broker": {
    "id": "00000000-0000-4000-8000-000000000001",
    "brokerCode": "CODIGO_EJEMPLO",
    "legalName": "Nombre de ejemplo",
    "licenseNumber": "valor-ejemplo",
    "jurisdiction": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    },
    "status": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    },
    "verification": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    },
    "independent": true,
    "currentCarrierCount": 1,
    "createdAt": "2026-07-31T12:00:00.000Z",
    "agreements": [
      {
        "id": "00000000-0000-4000-8000-000000000001",
        "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
        "carrierLegalName": "Nombre de ejemplo",
        "agreementCode": "CODIGO_EJEMPLO",
        "commissionModel": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        },
        "effectiveFrom": "valor-ejemplo",
        "effectiveTo": "valor-ejemplo",
        "status": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        },
        "current": true,
        "contractFileId": "00000000-0000-4000-8000-000000000001"
      }
    ],
    "publicProfileId": "00000000-0000-4000-8000-000000000001"
  },
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TenantResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TenantResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "parentTenantId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | Sin restricción adicional declarada | Valor de legal name mantenido por la instancia. | `Nombre de ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del tenant | `00000000-0000-4000-8000-000000000001` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id del estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `parentTenantId` | No | `string` | formato `uuid` | Tenant padre si es sub-tenant | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Tenant padre no encontrado | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 409 | `CONFLICT` | El código de tenant ya existe | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El tenant padre no está activo | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo PAYER exige el bloque `payer` | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo BROKER exige el bloque `broker` | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo ${tenantType} exige país y jurisdicción | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El tipo societario pertenece al derecho de ${entry!.countryIso} y no coincide con el país declarado | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El bloque `payer` sólo corresponde a un tenant de tipo PAYER | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El bloque `broker` sólo corresponde a un tenant de tipo BROKER | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El bloque `diagnosticUnit` sólo corresponde a un tenant de tipo ' +           'DIAGNOSTIC_CENTER | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El tipo de unidad diagnóstica declarado no es válido | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Alguna modalidad declarada no pertenece al catálogo de modalidades diagnósticas | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Los conceptos declarados no existen en el catálogo de terminología | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/child-tenants"
}
```

---

## 12. GET /tenants/{tenantId}/memberships

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Plantilla de la organización
- **Operation ID:** `TenantsController_listMemberships`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.listMemberships](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Plantilla de la organización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-04-04 (cara de lectura).

### Descripción del sistema

NestJS resuelve `GET /tenants/{tenantId}/memberships` en `TenantsController_listMemberships`. El controlador delega en `DirectoryReadService.listMemberships`. No recibe body. El tipo de retorno estático es `Promise<SearchMembershipsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | query | No | `string` | Sin restricción adicional declarada | Concepto de estado al que acotar | `ok` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /tenants/00000000-0000-4000-8000-000000000001/memberships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /tenants/00000000-0000-4000-8000-000000000001/memberships?status=ok&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SearchMembershipsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SearchMembershipsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SearchMembershipsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SearchMembershipsResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<SearchMembershipsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SearchMembershipsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SearchMembershipsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SearchMembershipsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "userId": "00000000-0000-4000-8000-000000000001",
      "tenantRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "accessScopeConceptId": "00000000-0000-4000-8000-000000000001",
      "primaryBranchId": "00000000-0000-4000-8000-000000000001",
      "startDate": "2026-07-31T12:00:00.000Z",
      "endDate": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<MembershipListItemDto>` | Sin restricción adicional declarada | Membresías de esta página, de la más antigua a la más reciente. | `[{"id":"00000000-0000-4000-8000-000000000001","userId":"00000000-0000-4000-8000-000000000001","tenantRoleConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","accessScopeConceptId":"00000000-0000-4000-8000-000000000001","primaryBranchId":"00000000-0000-4000-8000-000000000001","startDate":"2026-07-31T12:00:00.000Z","endDate":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la membresía. | `00000000-0000-4000-8000-000000000001` |
| `items[].userId` | Sí | `string` | formato `uuid` | Usuario que la ostenta. | `00000000-0000-4000-8000-000000000001` |
| `items[].tenantRoleConceptId` | Sí | `string` | formato `uuid` | Rol de negocio en la organización. | `00000000-0000-4000-8000-000000000001` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Estado de la membresía. | `00000000-0000-4000-8000-000000000001` |
| `items[].accessScopeConceptId` | No | `string` | formato `uuid` | Alcance de acceso concedido. | `00000000-0000-4000-8000-000000000001` |
| `items[].primaryBranchId` | No | `string` | formato `uuid`; admite null | Sucursal principal, si la tiene. | `00000000-0000-4000-8000-000000000001` |
| `items[].startDate` | No | `string` | formato `date-time`; admite null | Inicio de la relación. | `2026-07-31T12:00:00.000Z` |
| `items[].endDate` | No | `string` | formato `date-time`; admite null | Fin de la relación, si terminó. | `2026-07-31T12:00:00.000Z` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Alta de la membresía. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor opaco de continuación, o `null` si ésta es la última página. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Organización no encontrada | Excepción explícita en src/modules/directory/services/directory-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/memberships"
}
```

---

## 13. POST /tenants/{tenantId}/memberships

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Incorporar un usuario al tenant (membership)
- **Operation ID:** `TenantsController_invite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.invite](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Incorporar un usuario al tenant (membership). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/memberships` en `TenantsController_invite`. El controlador delega en `DirectoryMembershipsService.invite`. Valida el body como `DirectoryCreateMembershipDto` y consume `application/json`. El tipo de retorno estático es `Promise<MembershipResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DirectoryCreateMembershipDto`; los campos opcionales se omiten.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `userId` | Sí | `string` | formato `uuid` | Usuario a incorporar al tenant | `00000000-0000-4000-8000-000000000001` |
| `role` | No | `string` | valores: `OWNER`, `ADMIN`, `STAFF` | Rol dentro del tenant | `OWNER` |
| `accessScope` | No | `string` | valores: `ALL_TENANT`, `BRANCH` | Scope de acceso | `ALL_TENANT` |
| `primaryBranchId` | No | `string` | formato `uuid` | Branch primaria opcional | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001",
  "role": "OWNER",
  "accessScope": "ALL_TENANT",
  "primaryBranchId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MembershipResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MembershipResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "currentTierId": "00000000-0000-4000-8000-000000000001",
  "pointsBalance": "valor-ejemplo",
  "lifetimePoints": "valor-ejemplo",
  "alreadyEnrolled": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `currentTierId` | No | `string` | formato `uuid` | Identificador asociado a current tier. | `00000000-0000-4000-8000-000000000001` |
| `pointsBalance` | Sí | `string` | Sin restricción adicional declarada | Saldo de puntos | `valor-ejemplo` |
| `lifetimePoints` | Sí | `string` | Sin restricción adicional declarada | Puntos acumulados de por vida | `valor-ejemplo` |
| `alreadyEnrolled` | Sí | `boolean` | Sin restricción adicional declarada | true si ya estaba inscrito: la inscripción es idempotente | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 403 | `FORBIDDEN` | Sólo un OWNER de la organización o la plataforma pueden cambiar quién la posee | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 409 | `CONFLICT` | El usuario ya tiene una membresía activa en el tenant | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
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
  "path": "/tenants/{tenantId}/memberships"
}
```

---

## 14. GET /tenants/{tenantId}/memberships/{membershipId}/branch-assignments

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Sucursales asignadas a una membresía
- **Operation ID:** `TenantsController_listBranchAssignments`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.listBranchAssignments](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Sucursales asignadas a una membresía. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-04-05 (cara de lectura).

### Descripción del sistema

NestJS resuelve `GET /tenants/{tenantId}/memberships/{membershipId}/branch-assignments` en `TenantsController_listBranchAssignments`. El controlador delega en `DirectoryReadService.listBranchAssignments`. No recibe body. El tipo de retorno estático es `Promise<ListBranchAssignmentsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `membershipId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/branch-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`, `membershipId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/branch-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListBranchAssignmentsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListBranchAssignmentsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListBranchAssignmentsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListBranchAssignmentsResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ListBranchAssignmentsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListBranchAssignmentsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListBranchAssignmentsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListBranchAssignmentsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "branchId": "00000000-0000-4000-8000-000000000001",
      "localRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<BranchAssignmentListItemDto>` | Sin restricción adicional declarada | Asignaciones, de la más reciente a la más antigua. | `[{"id":"00000000-0000-4000-8000-000000000001","branchId":"00000000-0000-4000-8000-000000000001","localRoleConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la asignación. | `00000000-0000-4000-8000-000000000001` |
| `items[].branchId` | Sí | `string` | formato `uuid` | Sucursal asignada. | `00000000-0000-4000-8000-000000000001` |
| `items[].localRoleConceptId` | No | `string` | formato `uuid` | Rol local en esa sucursal. | `00000000-0000-4000-8000-000000000001` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Estado de la asignación. | `00000000-0000-4000-8000-000000000001` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Alta de la asignación. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas asignaciones trae la respuesta. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/directory/services/directory-read.service.ts |
| 404 | `NOT_FOUND` | Organización no encontrada | Excepción explícita en src/modules/directory/services/directory-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/memberships/{membershipId}/branch-assignments"
}
```

---

## 15. POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Asignar la membresía a una branch
- **Operation ID:** `TenantsController_assignBranch`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.assignBranch](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Asignar la membresía a una branch. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments` en `TenantsController_assignBranch`. El controlador delega en `DirectoryMembershipsService.assignBranch`. Valida el body como `BranchAssignmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<BranchMembershipResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `membershipId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BranchAssignmentDto`; los campos opcionales se omiten.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/branch-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "branchId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`, `membershipId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `branchId` | Sí | `string` | formato `uuid` | Branch a la que se asigna la membresía | `00000000-0000-4000-8000-000000000001` |
| `localRoleConceptId` | No | `string` | formato `uuid` | Concept id del rol local en la branch | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/branch-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "branchId": "00000000-0000-4000-8000-000000000001",
  "localRoleConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BranchMembershipResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantMembershipId": "00000000-0000-4000-8000-000000000001",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "localRole": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `tenantMembershipId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant membership. | `00000000-0000-4000-8000-000000000001` |
| `branchId` | Sí | `string` | formato `uuid` | Identificador asociado a branch. | `00000000-0000-4000-8000-000000000001` |
| `localRole` | No | `string` | formato `uuid` | Concept id del rol local | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 404 | `NOT_FOUND` | Branch no encontrada | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 409 | `CONFLICT` | La membresía ya está asignada a esa branch | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La membresía no está activa | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 422 | `PRECONDITION_FAILED` | La branch no pertenece al tenant | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/memberships/{membershipId}/branch-assignments"
}
```

---

## 16. POST /tenants/{tenantId}/memberships/{membershipId}/offboard

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Revocar / offboarding de un miembro
- **Operation ID:** `TenantsController_offboard`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.offboard](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Revocar / offboarding de un miembro. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/memberships/{membershipId}/offboard` en `TenantsController_offboard`. El controlador delega en `DirectoryMembershipsService.offboard`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `membershipId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/offboard HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`, `membershipId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/offboard HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 403 | `FORBIDDEN` | Sólo un OWNER de la organización o la plataforma pueden cambiar quién la posee | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 422 | `PRECONDITION_FAILED` | La membresía no está activa | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 422 | `PRECONDITION_FAILED` | No se puede quitar al último OWNER de la organización: designe otro OWNER primero | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/memberships/{membershipId}/offboard"
}
```

---

## 17. PATCH /tenants/{tenantId}/memberships/{membershipId}/role

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Cambiar rol / scope de la membresía
- **Operation ID:** `TenantsController_changeRole`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.changeRole](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Cambiar rol / scope de la membresía. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /tenants/{tenantId}/memberships/{membershipId}/role` en `TenantsController_changeRole`. El controlador delega en `DirectoryMembershipsService.changeRole`. Valida el body como `ChangeMembershipRoleDto` y consume `application/json`. El tipo de retorno estático es `Promise<MembershipResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `membershipId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ChangeMembershipRoleDto`; los campos opcionales se omiten.

```http
PATCH /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/role HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`, `membershipId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `role` | No | `string` | valores: `OWNER`, `ADMIN`, `STAFF` | Nuevo rol de tenant | `OWNER` |
| `accessScope` | No | `string` | valores: `ALL_TENANT`, `BRANCH` | Nuevo scope de acceso | `ALL_TENANT` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/role HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "role": "OWNER",
  "accessScope": "ALL_TENANT"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MembershipResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "currentTierId": "00000000-0000-4000-8000-000000000001",
  "pointsBalance": "valor-ejemplo",
  "lifetimePoints": "valor-ejemplo",
  "alreadyEnrolled": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `currentTierId` | No | `string` | formato `uuid` | Identificador asociado a current tier. | `00000000-0000-4000-8000-000000000001` |
| `pointsBalance` | Sí | `string` | Sin restricción adicional declarada | Saldo de puntos | `valor-ejemplo` |
| `lifetimePoints` | Sí | `string` | Sin restricción adicional declarada | Puntos acumulados de por vida | `valor-ejemplo` |
| `alreadyEnrolled` | Sí | `boolean` | Sin restricción adicional declarada | true si ya estaba inscrito: la inscripción es idempotente | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 403 | `FORBIDDEN` | Sólo un OWNER de la organización o la plataforma pueden cambiar quién la posee | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Debe indicar un nuevo rol o scope | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 422 | `PRECONDITION_FAILED` | La membresía no está activa | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 422 | `PRECONDITION_FAILED` | No se puede quitar al último OWNER de la organización: designe otro OWNER primero | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/memberships/{membershipId}/role"
}
```

---

## 18. POST /tenants/{tenantId}/memberships/{membershipId}/transfer

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Transferir la membresía entre branches
- **Operation ID:** `TenantsController_transfer`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.transfer](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Transferir la membresía entre branches. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/memberships/{membershipId}/transfer` en `TenantsController_transfer`. El controlador delega en `DirectoryMembershipsService.transfer`. Valida el body como `TransferMembershipDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `membershipId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `TransferMembershipDto`; los campos opcionales se omiten.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/transfer HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fromBranchId": "00000000-0000-4000-8000-000000000001",
  "toBranchId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`, `membershipId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fromBranchId` | Sí | `string` | formato `uuid` | Branch de origen (se cierra su asignación) | `00000000-0000-4000-8000-000000000001` |
| `toBranchId` | Sí | `string` | formato `uuid` | Branch de destino (nueva asignación activa) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/transfer HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fromBranchId": "00000000-0000-4000-8000-000000000001",
  "toBranchId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | No hay asignación activa en la branch de origen | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 404 | `NOT_FOUND` | Branch no encontrada | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La membresía no está activa | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 422 | `PRECONDITION_FAILED` | La branch no pertenece al tenant | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/memberships/{membershipId}/transfer"
}
```

---

## 19. GET /tenants/me

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Las organizaciones del actor, con su rol en cada una
- **Operation ID:** `TenantsController_listMyTenants`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.listMyTenants](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Con esto el panel de la organización puede abrirse sin que la pantalla conozca de antemano el identificador de la organización.

Contexto declarado en el controlador: TP-1: las organizaciones del actor. Va declarada **antes** que `:tenantId`: Nest resuelve por orden y el parámetro capturaría `me` —y `ParseUUIDPipe` lo rechazaría con un 400 que no explica nada—. Sin `@Roles`: lo único que puede devolver es lo del propio actor, porque el sujeto sale de la sesión y no hay parámetro que apunte a otro. Una lista vacía es una respuesta legítima —quien no pertenece a ninguna organización no tiene panel—, no un 403.

### Descripción del sistema

NestJS resuelve `GET /tenants/me` en `TenantsController_listMyTenants`. El controlador delega en `DirectoryReadService.listMyTenants`. No recibe body. El tipo de retorno estático es `Promise<MyOrganizationsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /tenants/me HTTP/1.1
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
GET /tenants/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MyOrganizationsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<MyOrganizationsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MyOrganizationsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MyOrganizationsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MyOrganizationsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MyOrganizationsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MyOrganizationsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "myRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "canAdminister": true,
      "isVerified": true,
      "payer": {
        "carrierCode": "CODIGO_EJEMPLO",
        "regulatorIdentifier": "valor-ejemplo",
        "sigla": "valor-ejemplo",
        "address": "valor-ejemplo"
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<MyOrganizationDto>` | Sin restricción adicional declarada | Sus organizaciones, de la más recientemente creada a la más antigua. | `[{"myRoleConceptId":"00000000-0000-4000-8000-000000000001","canAdminister":true,"isVerified":true,"payer":{"carrierCode":"CODIGO_EJEMPLO","regulatorIdentifier":"valor-ejemplo","sigla":"valor-ejemplo","address":"valor-ejemplo"}}]` |
| `items[].myRoleConceptId` | Sí | `string` | formato `uuid` | Concepto del rol de la membresía activa (owner/admin/staff) | `00000000-0000-4000-8000-000000000001` |
| `items[].canAdminister` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero para owner y admin de la organización | `true` |
| `items[].isVerified` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero cuando la plataforma verificó la organización | `true` |
| `items[].payer` | No | `PayerOrganizationProfileDto` | Sin restricción adicional declarada | Datos propios de la aseguradora. Presente sólo si el tenant es `PAYER`. | `{"carrierCode":"CODIGO_EJEMPLO","regulatorIdentifier":"valor-ejemplo","sigla":"valor-ejemplo","address":"valor-ejemplo"}` |
| `items[].payer.carrierCode` | No | `string` | Sin restricción adicional declarada | Código de la aseguradora | `CODIGO_EJEMPLO` |
| `items[].payer.regulatorIdentifier` | No | `string` | Sin restricción adicional declarada | Identificador ante el regulador de seguros | `valor-ejemplo` |
| `items[].payer.sigla` | No | `string` | Sin restricción adicional declarada | Sigla de la aseguradora | `valor-ejemplo` |
| `items[].payer.address` | No | `string` | Sin restricción adicional declarada | Dirección de la aseguradora | `valor-ejemplo` |

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
  "path": "/tenants/me"
}
```

---

