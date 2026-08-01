<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `ads`

Referencia exhaustiva de 18 operación(es) del módulo `ads`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `ads`
- **Controladores:** `AdsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /ads/ad-accounts/{id}/campaigns/launch](#1-post-ads-ad-accounts-id-campaigns-launch) — Lanzar una campaña con sus conjuntos, creativos y anuncios
2. [POST /ads/ad-accounts/{id}/experiments](#2-post-ads-ad-accounts-id-experiments) — Crear un experimento A/B y arrancar sus variantes
3. [POST /ads/ad-accounts/{id}/invoices/issue](#3-post-ads-ad-accounts-id-invoices-issue) — Emitir la factura de anuncios del periodo
4. [POST /ads/ad-accounts/{id}/targeting](#4-post-ads-ad-accounts-id-targeting) — Guardar una segmentación y, si se pide, su audiencia
5. [POST /ads/ad-sets/{id}/budget-schedules](#5-post-ads-ad-sets-id-budget-schedules) — Programar un tramo de presupuesto o puja
6. [POST /ads/ad-sets/{id}/identity](#6-post-ads-ad-sets-id-identity) — Asignar la identidad con la que se publica el conjunto
7. [POST /ads/ads/{id}/review-events](#7-post-ads-ads-id-review-events) — Registrar el resultado de la revisión del anuncio
8. [POST /ads/automated-rules/{id}/evaluate](#8-post-ads-automated-rules-id-evaluate) — Aplicar la acción de una regla automatizada
9. [POST /ads/business-managers/{bmId}/ad-accounts](#9-post-ads-business-managers-bmid-ad-accounts) — Provisionar una cuenta publicitaria
10. [POST /ads/business-managers/{bmId}/partners](#10-post-ads-business-managers-bmid-partners) — Vincular un socio y compartir el alcance de assets
11. [POST /ads/catalogs/{id}/feeds/{feedId}/run](#11-post-ads-catalogs-id-feeds-feedid-run) — Sincronizar el catálogo de productos con el feed
12. [POST /ads/datasets/{id}/events](#12-post-ads-datasets-id-events) — Enviar una conversión server-side
13. [POST /ads/event-data-policies](#13-post-ads-event-data-policies) — Publicar la política de datos de evento con sus reglas de campo
14. [POST /ads/ingest/insights](#14-post-ads-ingest-insights) — Ingerir entrega e insights y consolidar el gasto
15. [POST /ads/lead-forms/{id}/submissions](#15-post-ads-lead-forms-id-submissions) — Recibir un lead del formulario y encolar su entrega al CRM
16. [POST /ads/offline-conversion-sets/upload](#16-post-ads-offline-conversion-sets-upload) — Subir conversiones offline con reporte de coincidencia
17. [POST /ads/platform-connections](#17-post-ads-platform-connections) — Conectar la plataforma externa e importar identidades
18. [POST /ads/policy-violations/{id}/appeals](#18-post-ads-policy-violations-id-appeals) — Apelar una infracción de política

---

## 1. POST /ads/ad-accounts/{id}/campaigns/launch

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Lanzar una campaña con sus conjuntos, creativos y anuncios
- **Operation ID:** `AdsController_launchCampaign`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.launchCampaign](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

Todo nace pausado y el anuncio en revisión.


### Descripción del sistema

NestJS resuelve `POST /ads/ad-accounts/{id}/campaigns/launch` en `AdsController_launchCampaign`. El controlador delega en `AdsCampaignsService.launchCampaign`. Valida el body como `LaunchCampaignDto` y consume `application/json`. El tipo de retorno estático es `Promise<LaunchCampaignResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LaunchCampaignDto`; los campos opcionales se omiten.

```http
POST /ads/ad-accounts/00000000-0000-4000-8000-000000000001/campaigns/launch HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "objective": "AWARENESS",
  "buyingType": "AUCTION",
  "adSets": [
    {
      "name": "Nombre de ejemplo",
      "optimizationGoal": "LINK_CLICKS",
      "billingEvent": "IMPRESSIONS",
      "creative": {
        "name": "Nombre de ejemplo",
        "format": "SINGLE_IMAGE"
      },
      "adName": "Nombre de ejemplo"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AD_OPS`, `ADS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `objective` | Sí | `string` | valores: `AWARENESS`, `TRAFFIC`, `CONVERSIONS`, `LEADS` | Sin descripción específica en el contrato OpenAPI. | `AWARENESS` |
| `buyingType` | Sí | `string` | valores: `AUCTION`, `RESERVED` | Sin descripción específica en el contrato OpenAPI. | `AUCTION` |
| `bidStrategy` | No | `string` | valores: `LOWEST_COST`, `COST_CAP`, `BID_CAP` | Sin descripción específica en el contrato OpenAPI. | `LOWEST_COST` |
| `dailyBudget` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lifetimeBudget` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spendCap` | No | `string` | Sin restricción adicional declarada | Tope de gasto de la campaña | `valor-ejemplo` |
| `startAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `stopAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `adSets` | Sí | `array<LaunchAdSetDto>` | mínimo 1 elemento(s) | Conjuntos de anuncios, al menos uno | `[{"name":"Nombre de ejemplo","optimizationGoal":"LINK_CLICKS","billingEvent":"IMPRESSIONS","bidAmount":"valor-ejemplo","dailyBudget":"valor-ejemplo","lifetimeBudget":"valor-ejemplo","targetingSpecId":"00000000-0000-4000-8000-000000000001","placements":[{"platform":"META","position":"FEED"}],"creative":{"name":"Nombre de ejemplo","format":"SINGLE_IMAGE","body":"valor-ejemplo","linkUrl":"valor-ejemplo","objectStoryJson":{},"primaryMediaFileId":"00000000-0000-4000-8000-000000000001","assets":[{"assetType":"IMAGE","fileId":"00000000-0000-4000-8000-000000000001","hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","width":1,"height":1}]},"adName":"Nombre de ejemplo"}]` |
| `adSets[].name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `adSets[].optimizationGoal` | Sí | `string` | valores: `LINK_CLICKS`, `IMPRESSIONS`, `CONVERSIONS` | Sin descripción específica en el contrato OpenAPI. | `LINK_CLICKS` |
| `adSets[].billingEvent` | Sí | `string` | valores: `IMPRESSIONS`, `CLICKS` | Sin descripción específica en el contrato OpenAPI. | `IMPRESSIONS` |
| `adSets[].bidAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `adSets[].dailyBudget` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `adSets[].lifetimeBudget` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `adSets[].targetingSpecId` | No | `string` | formato `uuid` | Segmentación ya guardada | `00000000-0000-4000-8000-000000000001` |
| `adSets[].placements` | No | `array<PlacementDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"platform":"META","position":"FEED"}]` |
| `adSets[].placements[].platform` | No | `string` | valores: `META`, `GOOGLE`, `TIKTOK` | Sin descripción específica en el contrato OpenAPI. | `META` |
| `adSets[].placements[].position` | No | `string` | valores: `FEED`, `STORY`, `REELS` | Sin descripción específica en el contrato OpenAPI. | `FEED` |
| `adSets[].creative` | Sí | `LaunchCreativeDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","format":"SINGLE_IMAGE","body":"valor-ejemplo","linkUrl":"valor-ejemplo","objectStoryJson":{},"primaryMediaFileId":"00000000-0000-4000-8000-000000000001","assets":[{"assetType":"IMAGE","fileId":"00000000-0000-4000-8000-000000000001","hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","width":1,"height":1}]}` |
| `adSets[].creative.name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `adSets[].creative.format` | Sí | `string` | valores: `SINGLE_IMAGE`, `VIDEO`, `CAROUSEL` | Sin descripción específica en el contrato OpenAPI. | `SINGLE_IMAGE` |
| `adSets[].creative.body` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `adSets[].creative.linkUrl` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `adSets[].creative.objectStoryJson` | No | `object` | Sin restricción adicional declarada | Historia del creativo tal como la publica la plataforma | `{}` |
| `adSets[].creative.primaryMediaFileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `adSets[].creative.assets` | No | `array<CreativeAssetDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"assetType":"IMAGE","fileId":"00000000-0000-4000-8000-000000000001","hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","width":1,"height":1}]` |
| `adSets[].creative.assets[].assetType` | No | `string` | valores: `IMAGE`, `VIDEO` | Sin descripción específica en el contrato OpenAPI. | `IMAGE` |
| `adSets[].creative.assets[].fileId` | No | `string` | formato `uuid` | Archivo en `common.files` | `00000000-0000-4000-8000-000000000001` |
| `adSets[].creative.assets[].hash` | No | `string` | longitud máxima 128 | Hash del archivo, para deduplicar | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `adSets[].creative.assets[].width` | No | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `adSets[].creative.assets[].height` | No | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `adSets[].adName` | Sí | `string` | longitud máxima 200 | Nombre del anuncio | `Nombre de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/ad-accounts/00000000-0000-4000-8000-000000000001/campaigns/launch HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "objective": "AWARENESS",
  "buyingType": "AUCTION",
  "bidStrategy": "LOWEST_COST",
  "dailyBudget": "valor-ejemplo",
  "lifetimeBudget": "valor-ejemplo",
  "spendCap": "valor-ejemplo",
  "startAt": "2026-07-31T12:00:00.000Z",
  "stopAt": "2026-07-31T12:00:00.000Z",
  "adSets": [
    {
      "name": "Nombre de ejemplo",
      "optimizationGoal": "LINK_CLICKS",
      "billingEvent": "IMPRESSIONS",
      "bidAmount": "valor-ejemplo",
      "dailyBudget": "valor-ejemplo",
      "lifetimeBudget": "valor-ejemplo",
      "targetingSpecId": "00000000-0000-4000-8000-000000000001",
      "placements": [
        {
          "platform": "META",
          "position": "FEED"
        }
      ],
      "creative": {
        "name": "Nombre de ejemplo",
        "format": "SINGLE_IMAGE",
        "body": "valor-ejemplo",
        "linkUrl": "valor-ejemplo",
        "objectStoryJson": {},
        "primaryMediaFileId": "00000000-0000-4000-8000-000000000001",
        "assets": [
          {
            "assetType": "IMAGE",
            "fileId": "00000000-0000-4000-8000-000000000001",
            "hash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "width": 1,
            "height": 1
          }
        ]
      },
      "adName": "Nombre de ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<LaunchCampaignResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LaunchCampaignResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LaunchCampaignResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LaunchCampaignResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LaunchCampaignResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LaunchCampaignResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LaunchCampaignResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LaunchCampaignResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LaunchCampaignResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LaunchCampaignResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LaunchCampaignResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "campaignId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "adSetIds": [
    "valor-ejemplo"
  ],
  "adIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `campaignId` | Sí | `string` | formato `uuid` | Identificador asociado a campaign. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | La campaña nace pausada | `00000000-0000-4000-8000-000000000001` |
| `adSetIds` | Sí | `array<string>` | formato `uuid` | Valor de ad set ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `adIds` | Sí | `array<string>` | formato `uuid` | Valor de ad ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AD_OPS, ADS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cuenta publicitaria no encontrada | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 404 | `NOT_FOUND` | Segmentación no encontrada | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La campaña debe terminar después de empezar | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 422 | `PRECONDITION_FAILED` | La campaña o sus conjuntos necesitan presupuesto | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta publicitaria no está activa | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta agotó su tope de gasto | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/ad-accounts/{id}/campaigns/launch"
}
```

---

## 2. POST /ads/ad-accounts/{id}/experiments

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Crear un experimento A/B y arrancar sus variantes
- **Operation ID:** `AdsController_createExperiment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.createExperiment](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

El reparto debe sumar 100 y llevar exactamente un control.


### Descripción del sistema

NestJS resuelve `POST /ads/ad-accounts/{id}/experiments` en `AdsController_createExperiment`. El controlador delega en `AdsOptimizationService.createExperiment`. Valida el body como `CreateExperimentDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExperimentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateExperimentDto`; los campos opcionales se omiten.

```http
POST /ads/ad-accounts/00000000-0000-4000-8000-000000000001/experiments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "experimentType": "AB_SPLIT",
  "objectiveMetric": "CPA",
  "variants": [
    {
      "name": "Nombre de ejemplo",
      "variantRefType": "CAMPAIGN",
      "variantRefId": "00000000-0000-4000-8000-000000000001",
      "trafficSplitPercent": "valor-ejemplo",
      "isControl": true
    },
    {
      "name": "Nombre de ejemplo",
      "variantRefType": "CAMPAIGN",
      "variantRefId": "00000000-0000-4000-8000-000000000001",
      "trafficSplitPercent": "valor-ejemplo",
      "isControl": true
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AD_OPS`, `ADS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `experimentType` | Sí | `string` | valores: `AB_SPLIT`, `CBO` | Sin descripción específica en el contrato OpenAPI. | `AB_SPLIT` |
| `objectiveMetric` | Sí | `string` | valores: `CPA`, `ROAS`, `CTR` | Sin descripción específica en el contrato OpenAPI. | `CPA` |
| `hypothesis` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `holdoutPercent` | No | `string` | Sin restricción adicional declarada | Porcentaje reservado como grupo de control ciego | `valor-ejemplo` |
| `startAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `endAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `variants` | Sí | `array<ExperimentVariantDto>` | mínimo 2 elemento(s) | Al menos dos variantes | `[{"name":"Nombre de ejemplo","variantRefType":"CAMPAIGN","variantRefId":"00000000-0000-4000-8000-000000000001","trafficSplitPercent":"valor-ejemplo","isControl":true},{"name":"Nombre de ejemplo","variantRefType":"CAMPAIGN","variantRefId":"00000000-0000-4000-8000-000000000001","trafficSplitPercent":"valor-ejemplo","isControl":true}]` |
| `variants[].name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `variants[].variantRefType` | Sí | `string` | valores: `CAMPAIGN`, `AD_SET` | Sin descripción específica en el contrato OpenAPI. | `CAMPAIGN` |
| `variants[].variantRefId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `variants[].trafficSplitPercent` | Sí | `string` | Sin restricción adicional declarada | Porcentaje de tráfico; la suma de las variantes debe dar 100 | `valor-ejemplo` |
| `variants[].isControl` | Sí | `boolean` | Sin restricción adicional declarada | Exactamente una variante es el control | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/ad-accounts/00000000-0000-4000-8000-000000000001/experiments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "experimentType": "AB_SPLIT",
  "objectiveMetric": "CPA",
  "hypothesis": "valor-ejemplo",
  "holdoutPercent": "valor-ejemplo",
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z",
  "variants": [
    {
      "name": "Nombre de ejemplo",
      "variantRefType": "CAMPAIGN",
      "variantRefId": "00000000-0000-4000-8000-000000000001",
      "trafficSplitPercent": "valor-ejemplo",
      "isControl": true
    },
    {
      "name": "Nombre de ejemplo",
      "variantRefType": "CAMPAIGN",
      "variantRefId": "00000000-0000-4000-8000-000000000001",
      "trafficSplitPercent": "valor-ejemplo",
      "isControl": true
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ExperimentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExperimentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExperimentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExperimentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExperimentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExperimentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExperimentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExperimentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExperimentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExperimentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExperimentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "variantIds": [
    "valor-ejemplo"
  ],
  "entitiesActivated": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `variantIds` | Sí | `array<string>` | formato `uuid` | Valor de variant ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `entitiesActivated` | Sí | `number` | Sin restricción adicional declarada | Entidades que pasaron de pausadas a activas | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AD_OPS, ADS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cuenta publicitaria no encontrada | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 404 | `NOT_FOUND` | Campaña de la variante no encontrada | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 404 | `NOT_FOUND` | Conjunto de la variante no encontrado | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El reparto de tráfico debe sumar 100 | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 422 | `PRECONDITION_FAILED` | El experimento necesita exactamente un control | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/ad-accounts/{id}/experiments"
}
```

---

## 3. POST /ads/ad-accounts/{id}/invoices/issue

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Emitir la factura de anuncios del periodo
- **Operation ID:** `AdsController_issueInvoice`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.issueInvoice](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

El total se deriva de las líneas, agregando el consumo por campaña.


### Descripción del sistema

NestJS resuelve `POST /ads/ad-accounts/{id}/invoices/issue` en `AdsController_issueInvoice`. El controlador delega en `AdsOptimizationService.issueInvoice`. Valida el body como `IssueAdInvoiceDto` y consume `application/json`. El tipo de retorno estático es `Promise<AdInvoiceResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IssueAdInvoiceDto`; los campos opcionales se omiten.

```http
POST /ads/ad-accounts/00000000-0000-4000-8000-000000000001/invoices/issue HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "invoiceNumber": "valor-ejemplo",
  "periodStart": "2026-07-31",
  "periodEnd": "2026-07-31"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `FINANCE`, `ADS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `invoiceNumber` | Sí | `string` | longitud máxima 100 | Número de factura, único | `valor-ejemplo` |
| `periodStart` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `periodEnd` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `taxPercentage` | No | `string` | Sin restricción adicional declarada | Porcentaje de impuesto sobre el subtotal | `0` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/ad-accounts/00000000-0000-4000-8000-000000000001/invoices/issue HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "invoiceNumber": "valor-ejemplo",
  "periodStart": "2026-07-31",
  "periodEnd": "2026-07-31",
  "taxPercentage": "0",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AdInvoiceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AdInvoiceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AdInvoiceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AdInvoiceResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AdInvoiceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AdInvoiceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AdInvoiceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AdInvoiceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AdInvoiceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AdInvoiceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AdInvoiceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "invoiceNumber": "valor-ejemplo",
  "subtotal": "valor-ejemplo",
  "taxTotal": "valor-ejemplo",
  "total": "valor-ejemplo",
  "lines": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `invoiceNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de invoice number mantenido por la instancia. | `valor-ejemplo` |
| `subtotal` | Sí | `string` | Sin restricción adicional declarada | Suma de las líneas | `valor-ejemplo` |
| `taxTotal` | Sí | `string` | Sin restricción adicional declarada | Valor de tax total mantenido por la instancia. | `valor-ejemplo` |
| `total` | Sí | `string` | Sin restricción adicional declarada | Valor de total mantenido por la instancia. | `valor-ejemplo` |
| `lines` | Sí | `number` | Sin restricción adicional declarada | Líneas emitidas, una por campaña con gasto | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: FINANCE, ADS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cuenta publicitaria no encontrada | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 409 | `CONFLICT` | Ya existe una factura con ese número | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 409 | `CONFLICT` | El periodo ya está facturado | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El periodo debe terminar después de empezar | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay consumo registrado en el periodo | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/ad-accounts/{id}/invoices/issue"
}
```

---

## 4. POST /ads/ad-accounts/{id}/targeting

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Guardar una segmentación y, si se pide, su audiencia
- **Operation ID:** `AdsController_createTargeting`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.createTargeting](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

Las audiencias van hasheadas o pseudonimizadas; nunca datos de salud.


### Descripción del sistema

NestJS resuelve `POST /ads/ad-accounts/{id}/targeting` en `AdsController_createTargeting`. El controlador delega en `AdsCampaignsService.createTargeting`. Valida el body como `CreateTargetingDto` y consume `application/json`. El tipo de retorno estático es `Promise<TargetingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTargetingDto`; los campos opcionales se omiten.

```http
POST /ads/ad-accounts/00000000-0000-4000-8000-000000000001/targeting HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AD_OPS`, `ADS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `geoLocationsJson` | No | `object` | Sin restricción adicional declarada | Zonas geográficas incluidas | `{}` |
| `excludedGeoLocationsJson` | No | `object` | Sin restricción adicional declarada | Zonas geográficas excluidas | `{}` |
| `ageMin` | No | `number` | mínimo 13; máximo 120 | Sin descripción específica en el contrato OpenAPI. | `13` |
| `ageMax` | No | `number` | mínimo 13; máximo 120 | Sin descripción específica en el contrato OpenAPI. | `13` |
| `interestsJson` | No | `object` | Sin restricción adicional declarada | Intereses; nunca condiciones de salud | `{}` |
| `customAudienceIdsJson` | No | `object` | Sin restricción adicional declarada | Audiencias personalizadas incluidas | `{}` |
| `customAudience` | No | `CreateCustomAudienceDto` | Sin restricción adicional declarada | Audiencia personalizada a crear junto con la segmentación | `{"name":"Nombre de ejemplo","source":"PIXEL","ruleJson":{},"dataSourcePixelId":"00000000-0000-4000-8000-000000000001","lookalikeRatioPercent":"valor-ejemplo","lookalikeCountryConceptId":"00000000-0000-4000-8000-000000000001"}` |
| `customAudience.name` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `customAudience.source` | No | `string` | valores: `PIXEL`, `CUSTOMER_LIST`, `ENGAGEMENT` | Sin descripción específica en el contrato OpenAPI. | `PIXEL` |
| `customAudience.ruleJson` | No | `object` | Sin restricción adicional declarada | Regla que define la audiencia | `{}` |
| `customAudience.dataSourcePixelId` | No | `string` | formato `uuid` | Pixel del que se alimenta | `00000000-0000-4000-8000-000000000001` |
| `customAudience.lookalikeRatioPercent` | No | `string` | Sin restricción adicional declarada | Porcentaje de similitud para derivar una audiencia lookalike | `valor-ejemplo` |
| `customAudience.lookalikeCountryConceptId` | No | `string` | formato `uuid` | País de la lookalike | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/ad-accounts/00000000-0000-4000-8000-000000000001/targeting HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "geoLocationsJson": {},
  "excludedGeoLocationsJson": {},
  "ageMin": 13,
  "ageMax": 13,
  "interestsJson": {},
  "customAudienceIdsJson": {},
  "customAudience": {
    "name": "Nombre de ejemplo",
    "source": "PIXEL",
    "ruleJson": {},
    "dataSourcePixelId": "00000000-0000-4000-8000-000000000001",
    "lookalikeRatioPercent": "valor-ejemplo",
    "lookalikeCountryConceptId": "00000000-0000-4000-8000-000000000001"
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TargetingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TargetingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TargetingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TargetingResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TargetingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TargetingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TargetingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TargetingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TargetingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TargetingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TargetingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "targetingSpecId": "00000000-0000-4000-8000-000000000001",
  "customAudienceId": "00000000-0000-4000-8000-000000000001",
  "lookalikeSpecId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `targetingSpecId` | Sí | `string` | formato `uuid` | Identificador asociado a targeting spec. | `00000000-0000-4000-8000-000000000001` |
| `customAudienceId` | No | `string` | formato `uuid` | Identificador asociado a custom audience. | `00000000-0000-4000-8000-000000000001` |
| `lookalikeSpecId` | No | `string` | formato `uuid` | Identificador asociado a lookalike spec. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AD_OPS, ADS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cuenta publicitaria no encontrada | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El rango de edad está invertido | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 422 | `PRECONDITION_FAILED` | Una lookalike necesita país | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/ad-accounts/{id}/targeting"
}
```

---

## 5. POST /ads/ad-sets/{id}/budget-schedules

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Programar un tramo de presupuesto o puja
- **Operation ID:** `AdsController_createBudgetSchedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.createBudgetSchedule](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

Cambiar presupuesto o puja reinicia la fase de aprendizaje del conjunto.


### Descripción del sistema

NestJS resuelve `POST /ads/ad-sets/{id}/budget-schedules` en `AdsController_createBudgetSchedule`. El controlador delega en `AdsCampaignsService.createBudgetSchedule`. Valida el body como `CreateBudgetScheduleDto` y consume `application/json`. El tipo de retorno estático es `Promise<BudgetScheduleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateBudgetScheduleDto`; los campos opcionales se omiten.

```http
POST /ads/ad-sets/00000000-0000-4000-8000-000000000001/budget-schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "budgetType": "DAILY",
  "amount": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AD_OPS`, `ADS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `budgetType` | Sí | `string` | valores: `DAILY`, `LIFETIME` | Sin descripción específica en el contrato OpenAPI. | `DAILY` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Importe del tramo | `valor-ejemplo` |
| `currencyConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Sin fin, el tramo queda abierto | `2026-07-31T12:00:00.000Z` |
| `bidAmount` | No | `string` | Sin restricción adicional declarada | Nueva puja a aplicar junto con el presupuesto | `valor-ejemplo` |
| `clickWindowDays` | No | `number` | mínimo 1; máximo 90 | Ventana de atribución por click, en días | `1` |
| `viewWindowDays` | No | `number` | mínimo 1; máximo 90 | Ventana de atribución por impresión, en días | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/ad-sets/00000000-0000-4000-8000-000000000001/budget-schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "budgetType": "DAILY",
  "amount": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "bidAmount": "valor-ejemplo",
  "clickWindowDays": 1,
  "viewWindowDays": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BudgetScheduleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BudgetScheduleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BudgetScheduleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BudgetScheduleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BudgetScheduleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BudgetScheduleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BudgetScheduleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BudgetScheduleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BudgetScheduleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BudgetScheduleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BudgetScheduleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "adSetId": "00000000-0000-4000-8000-000000000001",
  "amount": "valor-ejemplo",
  "learningReset": true,
  "learningSnapshotId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `adSetId` | Sí | `string` | formato `uuid` | Identificador asociado a ad set. | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Valor de amount mantenido por la instancia. | `valor-ejemplo` |
| `learningReset` | Sí | `boolean` | Sin restricción adicional declarada | true si el cambio reinició la fase de aprendizaje del conjunto | `true` |
| `learningSnapshotId` | No | `string` | formato `uuid` | Identificador asociado a learning snapshot. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AD_OPS, ADS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Conjunto de anuncios no encontrado | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 404 | `NOT_FOUND` | Campaña del conjunto no encontrada | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 409 | `CONFLICT` | El tramo se solapa con otro vigente | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El tramo debe terminar después de empezar | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 422 | `PRECONDITION_FAILED` | El presupuesto del tramo excede el tope de gasto de la cuenta | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/ad-sets/{id}/budget-schedules"
}
```

---

## 6. POST /ads/ad-sets/{id}/identity

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Asignar la identidad con la que se publica el conjunto
- **Operation ID:** `AdsController_assignIdentity`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.assignIdentity](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

Sólo hay una identidad vigente por rol; la anterior se cierra.


### Descripción del sistema

NestJS resuelve `POST /ads/ad-sets/{id}/identity` en `AdsController_assignIdentity`. El controlador delega en `AdsCampaignsService.assignIdentity`. Valida el body como `AssignIdentityDto` y consume `application/json`. El tipo de retorno estático es `Promise<AssignIdentityResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AssignIdentityDto`; los campos opcionales se omiten.

```http
POST /ads/ad-sets/00000000-0000-4000-8000-000000000001/identity HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "adIdentityAssetId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AD_OPS`, `ADS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `adIdentityAssetId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `role` | No | `string` | valores: `PRIMARY`, `SECONDARY` | Sin descripción específica en el contrato OpenAPI. | `PRIMARY` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/ad-sets/00000000-0000-4000-8000-000000000001/identity HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "adIdentityAssetId": "00000000-0000-4000-8000-000000000001",
  "role": "PRIMARY"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AssignIdentityResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AssignIdentityResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AssignIdentityResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AssignIdentityResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AssignIdentityResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AssignIdentityResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AssignIdentityResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AssignIdentityResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AssignIdentityResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AssignIdentityResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AssignIdentityResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "assignmentId": "00000000-0000-4000-8000-000000000001",
  "adSetId": "00000000-0000-4000-8000-000000000001",
  "supersededAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `assignmentId` | Sí | `string` | formato `uuid` | Identificador asociado a assignment. | `00000000-0000-4000-8000-000000000001` |
| `adSetId` | Sí | `string` | formato `uuid` | Identificador asociado a ad set. | `00000000-0000-4000-8000-000000000001` |
| `supersededAssignmentId` | No | `string` | formato `uuid` | Asignación anterior cerrada, si la había | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AD_OPS, ADS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Conjunto de anuncios no encontrado | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 404 | `NOT_FOUND` | Identidad no encontrada | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La identidad no está activa | Excepción explícita en src/modules/ads/services/ads-campaigns.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/ad-sets/{id}/identity"
}
```

---

## 7. POST /ads/ads/{id}/review-events

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Registrar el resultado de la revisión del anuncio
- **Operation ID:** `AdsController_recordReviewEvent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.recordReviewEvent](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

Idempotente por el identificador externo de la revisión.


### Descripción del sistema

NestJS resuelve `POST /ads/ads/{id}/review-events` en `AdsController_recordReviewEvent`. El controlador delega en `AdsOptimizationService.recordReviewEvent`. Valida el body como `RecordReviewEventDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReviewEventResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordReviewEventDto`; los campos opcionales se omiten.

```http
POST /ads/ads/00000000-0000-4000-8000-000000000001/review-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reviewEventType": "INITIAL",
  "reviewStatus": "PENDING"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `POLICY_REVIEWER`, `SYSTEM`, `ADS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reviewEventType` | Sí | `string` | valores: `INITIAL`, `RE_REVIEW`, `APPEAL_DECISION` | Sin descripción específica en el contrato OpenAPI. | `INITIAL` |
| `reviewStatus` | Sí | `string` | valores: `PENDING`, `APPROVED`, `DISAPPROVED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `externalReviewId` | No | `string` | longitud máxima 200 | Identificador de la revisión en la plataforma; hace idempotente el webhook | `00000000-0000-4000-8000-000000000001` |
| `reasonsJson` | No | `object` | Sin restricción adicional declarada | Motivos que devuelve la plataforma | `{}` |
| `sourcePayloadHash` | No | `string` | longitud máxima 128 | Hash del payload recibido, para trazabilidad | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `policyCode` | No | `string` | longitud máxima 100 | Código de la política incumplida | `CODIGO_EJEMPLO` |
| `policyCategory` | No | `string` | valores: `HEALTH`, `MISLEADING`, `PROHIBITED` | Sin descripción específica en el contrato OpenAPI. | `HEALTH` |
| `severity` | No | `string` | valores: `LOW`, `MEDIUM`, `HIGH` | Sin descripción específica en el contrato OpenAPI. | `LOW` |
| `explanation` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/ads/00000000-0000-4000-8000-000000000001/review-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reviewEventType": "INITIAL",
  "reviewStatus": "PENDING",
  "externalReviewId": "00000000-0000-4000-8000-000000000001",
  "reasonsJson": {},
  "sourcePayloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "policyCode": "CODIGO_EJEMPLO",
  "policyCategory": "HEALTH",
  "severity": "LOW",
  "explanation": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReviewEventResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReviewEventResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReviewEventResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReviewEventResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReviewEventResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReviewEventResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReviewEventResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReviewEventResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReviewEventResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReviewEventResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReviewEventResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reviewEventId": "00000000-0000-4000-8000-000000000001",
  "violationId": "00000000-0000-4000-8000-000000000001",
  "effectiveStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reviewEventId` | Sí | `string` | formato `uuid` | Identificador asociado a review event. | `00000000-0000-4000-8000-000000000001` |
| `violationId` | No | `string` | formato `uuid` | Infracción abierta, si el anuncio se rechazó | `00000000-0000-4000-8000-000000000001` |
| `effectiveStatusConceptId` | Sí | `string` | formato `uuid` | Estado efectivo en el que queda el anuncio | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si el evento ya se había recibido | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: POLICY_REVIEWER, SYSTEM, ADS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Anuncio no encontrado | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un rechazo necesita código, categoría y severidad de la política | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/ads/{id}/review-events"
}
```

---

## 8. POST /ads/automated-rules/{id}/evaluate

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Aplicar la acción de una regla automatizada
- **Operation ID:** `AdsController_evaluateRule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.evaluateRule](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

La ejecución se registra siempre, aunque no cambie ninguna entidad.


### Descripción del sistema

NestJS resuelve `POST /ads/automated-rules/{id}/evaluate` en `AdsController_evaluateRule`. El controlador delega en `AdsOptimizationService.evaluateRule`. Valida el body como `AdsEvaluateRuleDto` y consume `application/json`. El tipo de retorno estático es `Promise<EvaluateRuleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AdsEvaluateRuleDto`; los campos opcionales se omiten.

```http
POST /ads/automated-rules/00000000-0000-4000-8000-000000000001/evaluate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "matchedEntityIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `ADS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `matchedEntityIds` | Sí | `array<string>` | Sin restricción adicional declarada | Entidades que el evaluador determinó que cumplen la condición | `["00000000-0000-4000-8000-000000000001"]` |
| `newDailyBudget` | No | `string` | Sin restricción adicional declarada | Nuevo presupuesto diario cuando la acción es ajustar presupuesto | `valor-ejemplo` |
| `newBidAmount` | No | `string` | Sin restricción adicional declarada | Nueva puja cuando la acción es ajustar puja | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/automated-rules/00000000-0000-4000-8000-000000000001/evaluate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "matchedEntityIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "newDailyBudget": "valor-ejemplo",
  "newBidAmount": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EvaluateRuleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "graphRuleDefinitionId": "00000000-0000-4000-8000-000000000001",
  "severity": "valor-ejemplo",
  "hitsOpened": 1,
  "duplicatesSkipped": 1,
  "hitIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `graphRuleDefinitionId` | Sí | `string` | formato `uuid` | Identificador asociado a graph rule definition. | `00000000-0000-4000-8000-000000000001` |
| `severity` | Sí | `string` | Sin restricción adicional declarada | Valor de severity mantenido por la instancia. | `valor-ejemplo` |
| `hitsOpened` | Sí | `number` | Sin restricción adicional declarada | Hallazgos nuevos abiertos | `1` |
| `duplicatesSkipped` | Sí | `number` | Sin restricción adicional declarada | Coincidencias descartadas por tener ya un hallazgo vivo | `1` |
| `hitIds` | Sí | `array<string>` | formato `uuid` | Valor de hit ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, ADS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Regla automatizada no encontrada | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La regla no está habilitada | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/automated-rules/{id}/evaluate"
}
```

---

## 9. POST /ads/business-managers/{bmId}/ad-accounts

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Provisionar una cuenta publicitaria
- **Operation ID:** `AdsController_provisionAdAccount`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.provisionAdAccount](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

El propietario queda con rol de administrador de la cuenta.


### Descripción del sistema

NestJS resuelve `POST /ads/business-managers/{bmId}/ad-accounts` en `AdsController_provisionAdAccount`. El controlador delega en `AdsAccountsService.provisionAdAccount`. Valida el body como `ProvisionAdAccountDto` y consume `application/json`. El tipo de retorno estático es `Promise<AdAccountResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `bmId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ProvisionAdAccountDto`; los campos opcionales se omiten.

```http
POST /ads/business-managers/00000000-0000-4000-8000-000000000001/ad-accounts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "externalAccountRef": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "fundingPaymentMethodId": "00000000-0000-4000-8000-000000000001",
  "ownerUserId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ADS_ADMIN`, `BUSINESS_ADMIN`.
- Deben ser UUID válidos: `bmId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Business manager a crear si no existe | `00000000-0000-4000-8000-000000000001` |
| `businessManagerName` | No | `string` | longitud máxima 200 | Nombre del business manager cuando hay que crearlo | `Nombre de ejemplo` |
| `externalBusinessRef` | No | `string` | longitud máxima 200 | Referencia externa del business manager | `valor-ejemplo` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `externalAccountRef` | Sí | `string` | longitud máxima 200 | Referencia de la cuenta en la plataforma, única | `valor-ejemplo` |
| `currencyConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `timeZone` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `spendCapAmount` | No | `string` | Sin restricción adicional declarada | Tope de gasto de la cuenta | `valor-ejemplo` |
| `fundingPaymentMethodId` | Sí | `string` | formato `uuid` | Método de pago que financia la cuenta | `00000000-0000-4000-8000-000000000001` |
| `ownerUserId` | Sí | `string` | formato `uuid` | Propietario de la cuenta | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/business-managers/00000000-0000-4000-8000-000000000001/ad-accounts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "businessManagerName": "Nombre de ejemplo",
  "externalBusinessRef": "valor-ejemplo",
  "name": "Nombre de ejemplo",
  "externalAccountRef": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "timeZone": "America/La_Paz",
  "spendCapAmount": "valor-ejemplo",
  "fundingPaymentMethodId": "00000000-0000-4000-8000-000000000001",
  "ownerUserId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AdAccountResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AdAccountResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AdAccountResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AdAccountResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AdAccountResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AdAccountResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AdAccountResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AdAccountResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AdAccountResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AdAccountResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AdAccountResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "businessManagerId": "00000000-0000-4000-8000-000000000001",
  "externalAccountRef": "valor-ejemplo",
  "accountStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "ownerRoleId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `businessManagerId` | Sí | `string` | formato `uuid` | Identificador asociado a business manager. | `00000000-0000-4000-8000-000000000001` |
| `externalAccountRef` | Sí | `string` | Sin restricción adicional declarada | Valor de external account ref mantenido por la instancia. | `valor-ejemplo` |
| `accountStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a account status concept. | `00000000-0000-4000-8000-000000000001` |
| `ownerRoleId` | Sí | `string` | formato `uuid` | Rol de administrador creado para el propietario | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ADS_ADMIN, BUSINESS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Business manager no encontrado | Excepción explícita en src/modules/ads/services/ads-accounts.service.ts |
| 409 | `CONFLICT` | Ya existe una cuenta con esa referencia externa | Excepción explícita en src/modules/ads/services/ads-accounts.service.ts |
| 409 | `CONFLICT` | Ya existe un business manager con esa referencia | Excepción explícita en src/modules/ads/services/ads-accounts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sin business manager hay que aportar nombre y referencia externa para crearlo | Excepción explícita en src/modules/ads/services/ads-accounts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/business-managers/{bmId}/ad-accounts"
}
```

---

## 10. POST /ads/business-managers/{bmId}/partners

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Vincular un socio y compartir el alcance de assets
- **Operation ID:** `AdsController_linkPartner`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.linkPartner](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

La vigencia anterior con ese socio se cierra en la misma transacción.


### Descripción del sistema

NestJS resuelve `POST /ads/business-managers/{bmId}/partners` en `AdsController_linkPartner`. El controlador delega en `AdsAccountsService.linkPartner`. Valida el body como `LinkPartnerDto` y consume `application/json`. El tipo de retorno estático es `Promise<PartnerLinkResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `bmId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LinkPartnerDto`; los campos opcionales se omiten.

```http
POST /ads/business-managers/00000000-0000-4000-8000-000000000001/partners HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "partnerName": "Nombre de ejemplo",
  "externalPartnerRef": "valor-ejemplo",
  "partnerType": "AGENCY",
  "relationshipType": "MANAGE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ADS_ADMIN`, `BUSINESS_ADMIN`.
- Deben ser UUID válidos: `bmId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `partnerName` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `externalPartnerRef` | Sí | `string` | longitud máxima 200 | Referencia del socio en la plataforma | `valor-ejemplo` |
| `partnerType` | Sí | `string` | valores: `AGENCY`, `VENDOR` | Sin descripción específica en el contrato OpenAPI. | `AGENCY` |
| `relationshipType` | Sí | `string` | valores: `MANAGE`, `SHARE` | Sin descripción específica en el contrato OpenAPI. | `MANAGE` |
| `permissionsJson` | No | `object` | Sin restricción adicional declarada | Permisos concedidos | `{}` |
| `sharedAssetScopeJson` | No | `object` | Sin restricción adicional declarada | Alcance de los assets compartidos | `{}` |
| `delegatedAdAccountId` | No | `string` | formato `uuid` | Cuenta a la que dar acceso delegado al socio | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/business-managers/00000000-0000-4000-8000-000000000001/partners HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "partnerName": "Nombre de ejemplo",
  "externalPartnerRef": "valor-ejemplo",
  "partnerType": "AGENCY",
  "relationshipType": "MANAGE",
  "permissionsJson": {},
  "sharedAssetScopeJson": {},
  "delegatedAdAccountId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PartnerLinkResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PartnerLinkResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PartnerLinkResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PartnerLinkResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PartnerLinkResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PartnerLinkResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PartnerLinkResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PartnerLinkResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PartnerLinkResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PartnerLinkResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PartnerLinkResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "partnerId": "00000000-0000-4000-8000-000000000001",
  "relationshipId": "00000000-0000-4000-8000-000000000001",
  "delegatedAccessId": "00000000-0000-4000-8000-000000000001",
  "partnerExisted": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `partnerId` | Sí | `string` | formato `uuid` | Identificador asociado a partner. | `00000000-0000-4000-8000-000000000001` |
| `relationshipId` | Sí | `string` | formato `uuid` | Identificador asociado a relationship. | `00000000-0000-4000-8000-000000000001` |
| `delegatedAccessId` | No | `string` | formato `uuid` | Acceso delegado creado, si se pidió | `00000000-0000-4000-8000-000000000001` |
| `partnerExisted` | Sí | `boolean` | Sin restricción adicional declarada | true si el socio ya existía y se reutilizó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ADS_ADMIN, BUSINESS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Business manager no encontrado | Excepción explícita en src/modules/ads/services/ads-accounts.service.ts |
| 404 | `NOT_FOUND` | Cuenta publicitaria no encontrada | Excepción explícita en src/modules/ads/services/ads-accounts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El socio no está activo | Excepción explícita en src/modules/ads/services/ads-accounts.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no pertenece a este business manager | Excepción explícita en src/modules/ads/services/ads-accounts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/business-managers/{bmId}/partners"
}
```

---

## 11. POST /ads/catalogs/{id}/feeds/{feedId}/run

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Sincronizar el catálogo de productos con el feed
- **Operation ID:** `AdsController_runFeed`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.runFeed](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

Upsert idempotente por identificador del comercio; sin datos de salud.


### Descripción del sistema

NestJS resuelve `POST /ads/catalogs/{id}/feeds/{feedId}/run` en `AdsController_runFeed`. El controlador delega en `AdsDataService.runFeed`. Valida el body como `RunFeedDto` y consume `application/json`. El tipo de retorno estático es `Promise<FeedRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `feedId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunFeedDto`; los campos opcionales se omiten.

```http
POST /ads/catalogs/00000000-0000-4000-8000-000000000001/feeds/00000000-0000-4000-8000-000000000001/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "items": [
    {
      "retailerProductId": "00000000-0000-4000-8000-000000000001",
      "title": "valor-ejemplo",
      "availability": "IN_STOCK"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `ADS_ADMIN`.
- Deben ser UUID válidos: `id`, `feedId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<FeedItemDto>` | Sin restricción adicional declarada | Ítems leídos del feed | `[{"retailerProductId":"00000000-0000-4000-8000-000000000001","title":"valor-ejemplo","description":"Texto descriptivo de ejemplo","availability":"IN_STOCK","condition":"NEW","price":"valor-ejemplo","brand":"valor-ejemplo","imageUrl":"valor-ejemplo","linkUrl":"valor-ejemplo","inventoryCount":1}]` |
| `items[].retailerProductId` | Sí | `string` | longitud máxima 200 | Identificador del producto en el comercio | `00000000-0000-4000-8000-000000000001` |
| `items[].title` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `items[].availability` | Sí | `string` | valores: `IN_STOCK`, `OUT_OF_STOCK` | Sin descripción específica en el contrato OpenAPI. | `IN_STOCK` |
| `items[].condition` | No | `string` | valores: `NEW`, `REFURBISHED` | Sin descripción específica en el contrato OpenAPI. | `NEW` |
| `items[].price` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].brand` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].imageUrl` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].linkUrl` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].inventoryCount` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/catalogs/00000000-0000-4000-8000-000000000001/feeds/00000000-0000-4000-8000-000000000001/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "items": [
    {
      "retailerProductId": "00000000-0000-4000-8000-000000000001",
      "title": "valor-ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "availability": "IN_STOCK",
      "condition": "NEW",
      "price": "valor-ejemplo",
      "brand": "valor-ejemplo",
      "imageUrl": "valor-ejemplo",
      "linkUrl": "valor-ejemplo",
      "inventoryCount": 1
    }
  ],
  "currencyConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<FeedRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FeedRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FeedRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FeedRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FeedRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FeedRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FeedRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FeedRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FeedRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FeedRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FeedRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "feedRunLogId": "00000000-0000-4000-8000-000000000001",
  "itemsRead": 1,
  "itemsCreated": 1,
  "itemsUpdated": 1,
  "setMembershipsAdded": 1,
  "catalogItemCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `feedRunLogId` | Sí | `string` | formato `uuid` | Identificador asociado a feed run log. | `00000000-0000-4000-8000-000000000001` |
| `itemsRead` | Sí | `number` | Sin restricción adicional declarada | Valor de items read mantenido por la instancia. | `1` |
| `itemsCreated` | Sí | `number` | Sin restricción adicional declarada | Productos creados | `1` |
| `itemsUpdated` | Sí | `number` | Sin restricción adicional declarada | Productos actualizados | `1` |
| `setMembershipsAdded` | Sí | `number` | Sin restricción adicional declarada | Miembros añadidos a conjuntos dinámicos | `1` |
| `catalogItemCount` | Sí | `number` | Sin restricción adicional declarada | Total de productos del catálogo tras la corrida | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, ADS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Catálogo no encontrado | Excepción explícita en src/modules/ads/services/ads-data.service.ts |
| 404 | `NOT_FOUND` | Feed no encontrado | Excepción explícita en src/modules/ads/services/ads-data.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El feed pertenece a otro catálogo | Excepción explícita en src/modules/ads/services/ads-data.service.ts |
| 422 | `PRECONDITION_FAILED` | El feed no está activo | Excepción explícita en src/modules/ads/services/ads-data.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/catalogs/{id}/feeds/{feedId}/run"
}
```

---

## 12. POST /ads/datasets/{id}/events

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Enviar una conversión server-side
- **Operation ID:** `AdsController_sendConversion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.sendConversion](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

Deduplica contra el evento del navegador y aplica la política de datos.


### Descripción del sistema

NestJS resuelve `POST /ads/datasets/{id}/events` en `AdsController_sendConversion`. El controlador delega en `AdsDataService.sendConversion`. Valida el body como `SendConversionDto` y consume `application/json`. El tipo de retorno estático es `Promise<SendConversionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SendConversionDto`; los campos opcionales se omiten.

```http
POST /ads/datasets/00000000-0000-4000-8000-000000000001/events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "eventName": "Nombre de ejemplo",
  "eventId": "00000000-0000-4000-8000-000000000001",
  "eventTime": "2026-07-31T12:00:00.000Z",
  "actionSource": "WEBSITE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `ADS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `eventName` | Sí | `string` | longitud máxima 100 | Nombre del evento | `Nombre de ejemplo` |
| `eventId` | Sí | `string` | longitud máxima 200 | Identificador del evento; con él se deduplica navegador contra servidor | `00000000-0000-4000-8000-000000000001` |
| `eventTime` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `actionSource` | Sí | `string` | valores: `WEBSITE`, `APP`, `SERVER`, `OFFLINE` | Sin descripción específica en el contrato OpenAPI. | `WEBSITE` |
| `eventSourceUrl` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `consentDirectiveId` | No | `string` | formato `uuid` | Directiva de consentimiento aplicable | `00000000-0000-4000-8000-000000000001` |
| `paymentTransactionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `userData` | No | `ConversionUserDataDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"externalUserIdHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","clickId":"00000000-0000-4000-8000-000000000001","browserId":"00000000-0000-4000-8000-000000000001","clientIpAddress":"valor-ejemplo","clientUserAgent":"valor-ejemplo"}` |
| `userData.externalUserIdHash` | No | `string` | longitud máxima 128 | Identificador de usuario ya hasheado (SHA-256) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `userData.clickId` | No | `string` | longitud máxima 200 | Identificador del click de la plataforma | `00000000-0000-4000-8000-000000000001` |
| `userData.browserId` | No | `string` | longitud máxima 200 | Identificador del navegador | `00000000-0000-4000-8000-000000000001` |
| `userData.clientIpAddress` | No | `string` | longitud máxima 100 | IP del cliente; se persiste cifrada | `valor-ejemplo` |
| `userData.clientUserAgent` | No | `string` | longitud máxima 500 | User-agent del cliente; se persiste cifrado | `valor-ejemplo` |
| `customData` | No | `ConversionCustomDataDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"currencyCode":"BOB","valueAmount":"valor-ejemplo","contentIdsJson":{},"numItems":1,"orderId":"00000000-0000-4000-8000-000000000001"}` |
| `customData.currencyCode` | No | `string` | longitud máxima 3 | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `customData.valueAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `customData.contentIdsJson` | No | `object` | Sin restricción adicional declarada | Productos implicados | `{}` |
| `customData.numItems` | No | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `customData.orderId` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `platformConnectionId` | No | `string` | formato `uuid` | Conexión a la que encolar la entrega del evento | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/datasets/00000000-0000-4000-8000-000000000001/events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "eventName": "Nombre de ejemplo",
  "eventId": "00000000-0000-4000-8000-000000000001",
  "eventTime": "2026-07-31T12:00:00.000Z",
  "actionSource": "WEBSITE",
  "eventSourceUrl": "valor-ejemplo",
  "consentDirectiveId": "00000000-0000-4000-8000-000000000001",
  "paymentTransactionId": "00000000-0000-4000-8000-000000000001",
  "userData": {
    "externalUserIdHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "clickId": "00000000-0000-4000-8000-000000000001",
    "browserId": "00000000-0000-4000-8000-000000000001",
    "clientIpAddress": "valor-ejemplo",
    "clientUserAgent": "valor-ejemplo"
  },
  "customData": {
    "currencyCode": "BOB",
    "valueAmount": "valor-ejemplo",
    "contentIdsJson": {},
    "numItems": 1,
    "orderId": "00000000-0000-4000-8000-000000000001"
  },
  "platformConnectionId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SendConversionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SendConversionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SendConversionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SendConversionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SendConversionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SendConversionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SendConversionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SendConversionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SendConversionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SendConversionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SendConversionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "eventId": "00000000-0000-4000-8000-000000000001",
  "processingStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true,
  "blocked": true,
  "transformedFields": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `eventId` | No | `string` | formato `uuid` | Ausente si el evento era duplicado | `00000000-0000-4000-8000-000000000001` |
| `processingStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a processing status concept. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si el evento ya se había recibido | `true` |
| `blocked` | Sí | `boolean` | Sin restricción adicional declarada | true si la política de datos bloqueó el evento | `true` |
| `transformedFields` | Sí | `array<string>` | Sin restricción adicional declarada | Campos que la política obligó a hashear o quitar | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, ADS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Dataset de conversión no encontrado | Excepción explícita en src/modules/ads/services/ads-data.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El dataset de conversión no está activo | Excepción explícita en src/modules/ads/services/ads-data.service.ts |
| 422 | `PRECONDITION_FAILED` | La política exige consentimiento y el evento no lo aporta | Excepción explícita en src/modules/ads/services/ads-data.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/datasets/{id}/events"
}
```

---

## 13. POST /ads/event-data-policies

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Publicar la política de datos de evento con sus reglas de campo
- **Operation ID:** `AdsController_createEventPolicy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.createEventPolicy](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

Es el cortafuegos que impide que un dato de salud salga a la plataforma.


### Descripción del sistema

NestJS resuelve `POST /ads/event-data-policies` en `AdsController_createEventPolicy`. El controlador delega en `AdsDataService.createEventPolicy`. Valida el body como `CreateEventPolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<EventPolicyResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateEventPolicyDto`; los campos opcionales se omiten.

```http
POST /ads/event-data-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "jurisdiction": "BO",
  "purposeOfUse": "MARKETING",
  "defaultAction": "ALLOW",
  "fieldRules": [
    {
      "eventNamePattern": "Nombre de ejemplo",
      "fieldPath": "valor-ejemplo",
      "action": "ALLOW"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_PRIVACY_OFFICER`, `ADS_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código de la política, único por tenant | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `jurisdiction` | Sí | `string` | valores: `BO`, `EU`, `US` | Sin descripción específica en el contrato OpenAPI. | `BO` |
| `purposeOfUse` | Sí | `string` | valores: `MARKETING`, `ANALYTICS` | Sin descripción específica en el contrato OpenAPI. | `MARKETING` |
| `requiresConsent` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `defaultAction` | Sí | `string` | valores: `ALLOW`, `BLOCK` | Qué hacer con un campo que ninguna regla contempla | `ALLOW` |
| `prohibitedDataClassesJson` | No | `object` | Sin restricción adicional declarada | Clases de dato prohibidas (p. ej. datos de salud) | `{}` |
| `fieldRules` | Sí | `array<FieldRuleDto>` | mínimo 1 elemento(s) | Reglas de campo, al menos una | `[{"eventNamePattern":"Nombre de ejemplo","fieldPath":"valor-ejemplo","action":"ALLOW","transformation":"SHA256","rationale":"valor-ejemplo"}]` |
| `fieldRules[].eventNamePattern` | Sí | `string` | longitud máxima 200 | Patrón del nombre del evento | `Nombre de ejemplo` |
| `fieldRules[].fieldPath` | Sí | `string` | longitud máxima 200 | Ruta del campo dentro del evento | `valor-ejemplo` |
| `fieldRules[].action` | Sí | `string` | valores: `ALLOW`, `BLOCK`, `HASH`, `DROP` | Sin descripción específica en el contrato OpenAPI. | `ALLOW` |
| `fieldRules[].transformation` | No | `string` | valores: `SHA256`, `TRUNCATE` | Sin descripción específica en el contrato OpenAPI. | `SHA256` |
| `fieldRules[].rationale` | No | `string` | Sin restricción adicional declarada | Por qué existe la regla | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/event-data-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "jurisdiction": "BO",
  "purposeOfUse": "MARKETING",
  "requiresConsent": true,
  "defaultAction": "ALLOW",
  "prohibitedDataClassesJson": {},
  "fieldRules": [
    {
      "eventNamePattern": "Nombre de ejemplo",
      "fieldPath": "valor-ejemplo",
      "action": "ALLOW",
      "transformation": "SHA256",
      "rationale": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EventPolicyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EventPolicyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EventPolicyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EventPolicyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EventPolicyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EventPolicyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EventPolicyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EventPolicyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EventPolicyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EventPolicyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "fieldRuleIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `fieldRuleIds` | Sí | `array<string>` | formato `uuid` | Valor de field rule ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_PRIVACY_OFFICER, ADS_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una política con ese código | Excepción explícita en src/modules/ads/services/ads-data.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una regla HASH necesita transformación | Excepción explícita en src/modules/ads/services/ads-data.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/event-data-policies"
}
```

---

## 14. POST /ads/ingest/insights

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Ingerir entrega e insights y consolidar el gasto
- **Operation ID:** `AdsController_ingestInsights`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.ingestInsights](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

El rollup diario se reescribe; el gasto de la cuenta sube sólo con el delta.


### Descripción del sistema

NestJS resuelve `POST /ads/ingest/insights` en `AdsController_ingestInsights`. El controlador delega en `AdsDataService.ingestInsights`. Valida el body como `IngestInsightsDto` y consume `application/json`. El tipo de retorno estático es `Promise<IngestInsightsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IngestInsightsDto`; los campos opcionales se omiten.

```http
POST /ads/ingest/insights HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "adAccountId": "00000000-0000-4000-8000-000000000001",
  "platformConnectionId": "00000000-0000-4000-8000-000000000001",
  "dateStart": "2026-07-31",
  "dateEnd": "2026-07-31",
  "rows": [
    {
      "entityType": "ACCOUNT",
      "entityRefId": "00000000-0000-4000-8000-000000000001",
      "externalObjectId": "00000000-0000-4000-8000-000000000001",
      "statDate": "2026-07-31"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `adAccountId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `platformConnectionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `dateStart` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `dateEnd` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `rows` | Sí | `array<InsightRowDto>` | mínimo 1 elemento(s) | Filas de métricas del lote | `[{"entityType":"ACCOUNT","entityRefId":"00000000-0000-4000-8000-000000000001","externalObjectId":"00000000-0000-4000-8000-000000000001","statDate":"2026-07-31","impressions":"valor-ejemplo","clicks":"valor-ejemplo","spend":"valor-ejemplo","conversions":"valor-ejemplo","conversionValue":"valor-ejemplo"}]` |
| `rows[].entityType` | Sí | `string` | valores: `ACCOUNT`, `CAMPAIGN`, `AD_SET`, `AD` | Sin descripción específica en el contrato OpenAPI. | `ACCOUNT` |
| `rows[].entityRefId` | Sí | `string` | formato `uuid` | Entidad local a la que corresponde la fila | `00000000-0000-4000-8000-000000000001` |
| `rows[].externalObjectId` | Sí | `string` | longitud máxima 200 | Identificador del objeto en la plataforma | `00000000-0000-4000-8000-000000000001` |
| `rows[].statDate` | Sí | `string` | formato `date` | Día de la métrica | `2026-07-31` |
| `rows[].impressions` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rows[].clicks` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rows[].spend` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rows[].conversions` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rows[].conversionValue` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Moneda de los importes | `00000000-0000-4000-8000-000000000001` |
| `recordBillingEvent` | No | `boolean` | Sin restricción adicional declarada | Registrar el gasto también como evento de facturación | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/ingest/insights HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "adAccountId": "00000000-0000-4000-8000-000000000001",
  "platformConnectionId": "00000000-0000-4000-8000-000000000001",
  "dateStart": "2026-07-31",
  "dateEnd": "2026-07-31",
  "rows": [
    {
      "entityType": "ACCOUNT",
      "entityRefId": "00000000-0000-4000-8000-000000000001",
      "externalObjectId": "00000000-0000-4000-8000-000000000001",
      "statDate": "2026-07-31",
      "impressions": "valor-ejemplo",
      "clicks": "valor-ejemplo",
      "spend": "valor-ejemplo",
      "conversions": "valor-ejemplo",
      "conversionValue": "valor-ejemplo"
    }
  ],
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "recordBillingEvent": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IngestInsightsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IngestInsightsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IngestInsightsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IngestInsightsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IngestInsightsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IngestInsightsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IngestInsightsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IngestInsightsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IngestInsightsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IngestInsightsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "insightQueryRunId": "00000000-0000-4000-8000-000000000001",
  "factRows": 1,
  "rollupsCreated": 1,
  "rollupsUpdated": 1,
  "amountSpent": "valor-ejemplo",
  "spendCapReached": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `insightQueryRunId` | Sí | `string` | formato `uuid` | Identificador asociado a insight query run. | `00000000-0000-4000-8000-000000000001` |
| `factRows` | Sí | `number` | Sin restricción adicional declarada | Filas de hecho insertadas | `1` |
| `rollupsCreated` | Sí | `number` | Sin restricción adicional declarada | Rollups diarios creados | `1` |
| `rollupsUpdated` | Sí | `number` | Sin restricción adicional declarada | Rollups diarios reescritos | `1` |
| `amountSpent` | Sí | `string` | Sin restricción adicional declarada | Gasto acumulado de la cuenta tras el lote | `valor-ejemplo` |
| `spendCapReached` | Sí | `boolean` | Sin restricción adicional declarada | true si el gasto alcanzó el tope de la cuenta | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Conexión de plataforma no encontrada | Excepción explícita en src/modules/ads/services/ads-data.service.ts |
| 404 | `NOT_FOUND` | Cuenta publicitaria no encontrada | Excepción explícita en src/modules/ads/services/ads-data.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La conexión de plataforma no está activa | Excepción explícita en src/modules/ads/services/ads-data.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/ingest/insights"
}
```

---

## 15. POST /ads/lead-forms/{id}/submissions

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Recibir un lead del formulario y encolar su entrega al CRM
- **Operation ID:** `AdsController_submitLead`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.submitLead](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

Idempotente por el identificador externo; las respuestas se cifran.


### Descripción del sistema

NestJS resuelve `POST /ads/lead-forms/{id}/submissions` en `AdsController_submitLead`. El controlador delega en `AdsOptimizationService.submitLead`. Valida el body como `SubmitLeadDto` y consume `application/json`. El tipo de retorno estático es `Promise<LeadSubmissionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SubmitLeadDto`; los campos opcionales se omiten.

```http
POST /ads/lead-forms/00000000-0000-4000-8000-000000000001/submissions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "externalLeadId": "00000000-0000-4000-8000-000000000001",
  "answers": [
    {
      "questionKey": "valor-ejemplo"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `AD_OPS`, `ADS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `externalLeadId` | Sí | `string` | longitud máxima 200 | Identificador del lead en la plataforma; hace idempotente el webhook | `00000000-0000-4000-8000-000000000001` |
| `adId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `adSetId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `campaignId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `consentDirectiveId` | No | `string` | formato `uuid` | Consentimiento capturado con el lead | `00000000-0000-4000-8000-000000000001` |
| `rawPayloadHash` | No | `string` | longitud máxima 128 | Hash del payload recibido | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `sourceIp` | No | `string` | longitud máxima 100 | IP de origen; se guarda hasheada | `valor-ejemplo` |
| `answers` | Sí | `array<LeadAnswerDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"questionKey":"valor-ejemplo","answer":"valor-ejemplo"}]` |
| `answers[].questionKey` | Sí | `string` | longitud máxima 100 | Clave de la pregunta del formulario | `valor-ejemplo` |
| `answers[].answer` | No | `string` | Sin restricción adicional declarada | Respuesta; se persiste cifrada | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/lead-forms/00000000-0000-4000-8000-000000000001/submissions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "externalLeadId": "00000000-0000-4000-8000-000000000001",
  "adId": "00000000-0000-4000-8000-000000000001",
  "adSetId": "00000000-0000-4000-8000-000000000001",
  "campaignId": "00000000-0000-4000-8000-000000000001",
  "consentDirectiveId": "00000000-0000-4000-8000-000000000001",
  "rawPayloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "sourceIp": "valor-ejemplo",
  "answers": [
    {
      "questionKey": "valor-ejemplo",
      "answer": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<LeadSubmissionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LeadSubmissionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LeadSubmissionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LeadSubmissionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LeadSubmissionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LeadSubmissionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LeadSubmissionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LeadSubmissionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LeadSubmissionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LeadSubmissionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LeadSubmissionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "processingStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "answersStored": 1,
  "answersIgnored": 1,
  "duplicate": true,
  "deliveryEventId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `processingStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a processing status concept. | `00000000-0000-4000-8000-000000000001` |
| `answersStored` | Sí | `number` | Sin restricción adicional declarada | Respuestas registradas | `1` |
| `answersIgnored` | Sí | `number` | Sin restricción adicional declarada | Respuestas descartadas por no corresponder a ninguna pregunta | `1` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si el lead ya se había recibido | `true` |
| `deliveryEventId` | No | `string` | formato `uuid` | Intento de entrega al CRM | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, AD_OPS, ADS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Formulario de leads no encontrado | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El formulario no está activo | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 422 | `PRECONDITION_FAILED` | Faltan respuestas obligatorias del formulario | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/lead-forms/{id}/submissions"
}
```

---

## 16. POST /ads/offline-conversion-sets/upload

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Subir conversiones offline con reporte de coincidencia
- **Operation ID:** `AdsController_uploadOfflineConversions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.uploadOfflineConversions](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

Sólo se aceptan claves de coincidencia ya hasheadas.


### Descripción del sistema

NestJS resuelve `POST /ads/offline-conversion-sets/upload` en `AdsController_uploadOfflineConversions`. El controlador delega en `AdsDataService.uploadOfflineConversions`. Valida el body como `UploadOfflineConversionsDto` y consume `application/json`. El tipo de retorno estático es `Promise<OfflineUploadResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UploadOfflineConversionsDto`; los campos opcionales se omiten.

```http
POST /ads/offline-conversion-sets/upload HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "adAccountId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "uploadSource": "FILE",
  "events": [
    {
      "eventName": "Nombre de ejemplo",
      "matchKeysHashJson": {}
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AD_OPS`, `ADS_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `adAccountId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `uploadSource` | Sí | `string` | valores: `FILE`, `API` | Sin descripción específica en el contrato OpenAPI. | `FILE` |
| `fileId` | No | `string` | formato `uuid` | Archivo en `common.files` | `00000000-0000-4000-8000-000000000001` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `events` | Sí | `array<OfflineEventDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"eventName":"Nombre de ejemplo","eventTime":"2026-07-31T12:00:00.000Z","matchKeysHashJson":{},"valueAmount":"valor-ejemplo","orderRef":"valor-ejemplo","attributedCampaignRefId":"00000000-0000-4000-8000-000000000001"}]` |
| `events[].eventName` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `events[].eventTime` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `events[].matchKeysHashJson` | Sí | `object` | Sin restricción adicional declarada | Claves de coincidencia YA hasheadas; nunca datos en claro | `{}` |
| `events[].valueAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `events[].orderRef` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `events[].attributedCampaignRefId` | No | `string` | formato `uuid` | Campaña a la que se atribuye; su presencia marca el evento como emparejado | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/offline-conversion-sets/upload HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "adAccountId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "uploadSource": "FILE",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "events": [
    {
      "eventName": "Nombre de ejemplo",
      "eventTime": "2026-07-31T12:00:00.000Z",
      "matchKeysHashJson": {},
      "valueAmount": "valor-ejemplo",
      "orderRef": "valor-ejemplo",
      "attributedCampaignRefId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<OfflineUploadResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OfflineUploadResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OfflineUploadResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OfflineUploadResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OfflineUploadResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OfflineUploadResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OfflineUploadResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OfflineUploadResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OfflineUploadResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OfflineUploadResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "offlineConversionSetId": "00000000-0000-4000-8000-000000000001",
  "totalEvents": 1,
  "matchedEvents": 1,
  "matchRate": "valor-ejemplo",
  "attributedValue": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `offlineConversionSetId` | Sí | `string` | formato `uuid` | Identificador asociado a offline conversion set. | `00000000-0000-4000-8000-000000000001` |
| `totalEvents` | Sí | `number` | Sin restricción adicional declarada | Valor de total events mantenido por la instancia. | `1` |
| `matchedEvents` | Sí | `number` | Sin restricción adicional declarada | Valor de matched events mantenido por la instancia. | `1` |
| `matchRate` | Sí | `string` | Sin restricción adicional declarada | Proporción de eventos emparejados | `valor-ejemplo` |
| `attributedValue` | Sí | `string` | Sin restricción adicional declarada | Valor atribuido a los eventos emparejados | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AD_OPS, ADS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cuenta publicitaria no encontrada | Excepción explícita en src/modules/ads/services/ads-data.service.ts |
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
  "path": "/ads/offline-conversion-sets/upload"
}
```

---

## 17. POST /ads/platform-connections

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Conectar la plataforma externa e importar identidades
- **Operation ID:** `AdsController_connectPlatform`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.connectPlatform](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

El token vive en el vault; aquí sólo viaja el id de la credencial.


### Descripción del sistema

NestJS resuelve `POST /ads/platform-connections` en `AdsController_connectPlatform`. El controlador delega en `AdsAccountsService.connectPlatform`. Valida el body como `ConnectPlatformDto` y consume `application/json`. El tipo de retorno estático es `Promise<PlatformConnectionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ConnectPlatformDto`; los campos opcionales se omiten.

```http
POST /ads/platform-connections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "businessManagerId": "00000000-0000-4000-8000-000000000001",
  "platform": "META",
  "connectionName": "Nombre de ejemplo",
  "credentialId": "00000000-0000-4000-8000-000000000001",
  "externalAdAccountId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ADS_ADMIN`, `BUSINESS_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `businessManagerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `adAccountId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `platform` | Sí | `string` | valores: `META`, `GOOGLE`, `TIKTOK` | Sin descripción específica en el contrato OpenAPI. | `META` |
| `connectionName` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `credentialId` | Sí | `string` | formato `uuid` | Credencial guardada en el vault; el token nunca viaja en el cuerpo | `00000000-0000-4000-8000-000000000001` |
| `apiVersion` | No | `string` | longitud máxima 20 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `externalBusinessId` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `externalAdAccountId` | Sí | `string` | longitud máxima 200 | Cuenta publicitaria en la plataforma | `00000000-0000-4000-8000-000000000001` |
| `identities` | No | `array<IdentityAssetDto>` | Sin restricción adicional declarada | Identidades a importar | `[{"identityType":"PAGE","externalIdentityId":"00000000-0000-4000-8000-000000000001","displayName":"Nombre de ejemplo","username":"Nombre de ejemplo","profileUrl":"valor-ejemplo"}]` |
| `identities[].identityType` | No | `string` | valores: `PAGE`, `INSTAGRAM` | Sin descripción específica en el contrato OpenAPI. | `PAGE` |
| `identities[].externalIdentityId` | No | `string` | longitud máxima 200 | Identificador de la identidad en la plataforma | `00000000-0000-4000-8000-000000000001` |
| `identities[].displayName` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `identities[].username` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `identities[].profileUrl` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `checkpointValue` | No | `string` | Sin restricción adicional declarada | Cursor de sincronización devuelto por la plataforma | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/platform-connections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "businessManagerId": "00000000-0000-4000-8000-000000000001",
  "adAccountId": "00000000-0000-4000-8000-000000000001",
  "platform": "META",
  "connectionName": "Nombre de ejemplo",
  "credentialId": "00000000-0000-4000-8000-000000000001",
  "apiVersion": "valor-ejemplo",
  "externalBusinessId": "00000000-0000-4000-8000-000000000001",
  "externalAdAccountId": "00000000-0000-4000-8000-000000000001",
  "identities": [
    {
      "identityType": "PAGE",
      "externalIdentityId": "00000000-0000-4000-8000-000000000001",
      "displayName": "Nombre de ejemplo",
      "username": "Nombre de ejemplo",
      "profileUrl": "valor-ejemplo"
    }
  ],
  "checkpointValue": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PlatformConnectionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PlatformConnectionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PlatformConnectionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PlatformConnectionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PlatformConnectionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PlatformConnectionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PlatformConnectionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PlatformConnectionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PlatformConnectionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PlatformConnectionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "identitiesImported": 1,
  "identitiesUpdated": 1,
  "syncRunId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `identitiesImported` | Sí | `number` | Sin restricción adicional declarada | Identidades importadas por primera vez | `1` |
| `identitiesUpdated` | Sí | `number` | Sin restricción adicional declarada | Identidades que ya existían y se actualizaron | `1` |
| `syncRunId` | Sí | `string` | formato `uuid` | Registro de la sincronización | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ADS_ADMIN, BUSINESS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Business manager no encontrado | Excepción explícita en src/modules/ads/services/ads-accounts.service.ts |
| 409 | `CONFLICT` | Esa cuenta de la plataforma ya está conectada | Excepción explícita en src/modules/ads/services/ads-accounts.service.ts |
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
  "path": "/ads/platform-connections"
}
```

---

## 18. POST /ads/policy-violations/{id}/appeals

- **Módulo:** `ads`
- **Etiqueta OpenAPI:** `ads`
- **Nombre:** Apelar una infracción de política
- **Operation ID:** `AdsController_submitAppeal`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdsController.submitAppeal](../../src/modules/ads/controllers/ads.controller.ts)

### Descripción de negocio

Apelar una infracción de política. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /ads/policy-violations/{id}/appeals` en `AdsController_submitAppeal`. El controlador delega en `AdsOptimizationService.submitAppeal`. Valida el body como `SubmitAppealDto` y consume `application/json`. El tipo de retorno estático es `Promise<AppealResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SubmitAppealDto`; los campos opcionales se omiten.

```http
POST /ads/policy-violations/00000000-0000-4000-8000-000000000001/appeals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "appealReason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `POLICY_REVIEWER`, `AD_OPS`, `ADS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `appealReason` | Sí | `string` | Sin restricción adicional declarada | Argumento de la apelación | `Texto descriptivo de ejemplo` |
| `evidenceFileId` | No | `string` | formato `uuid` | Evidencia adjunta en `common.files` | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ads/policy-violations/00000000-0000-4000-8000-000000000001/appeals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "appealReason": "Texto descriptivo de ejemplo",
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AppealResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AppealResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AppealResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AppealResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AppealResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AppealResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AppealResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AppealResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AppealResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AppealResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AppealResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "adPolicyViolationId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `adPolicyViolationId` | Sí | `string` | formato `uuid` | Identificador asociado a ad policy violation. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: POLICY_REVIEWER, AD_OPS, ADS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Infracción no encontrada | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 409 | `CONFLICT` | La infracción ya tiene una apelación | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La infracción ya no está abierta | Excepción explícita en src/modules/ads/services/ads-optimization.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ads/policy-violations/{id}/appeals"
}
```

---

