<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `ads`

- **Bloque:** Marketing y Crecimiento (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)
- **Operaciones:** 18 (18 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 18 · BAJO 0
- **Tablas distintas que tocan:** 58
- **Respuestas de error y detalle contractual:** `openapi/endpoints/ads.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/ads/ad-accounts/{id}/campaigns/launch` | Lanzar una campaña con sus conjuntos, creativos y anuncios | MEDIO | 8 | AD_OPS, ADS_ADMIN |
| 2 | POST | `/ads/ad-accounts/{id}/experiments` | Crear un experimento A/B y arrancar sus variantes | MEDIO | 8 | AD_OPS, ADS_ADMIN |
| 3 | POST | `/ads/ad-accounts/{id}/invoices/issue` | Emitir la factura de anuncios del periodo | MEDIO | 6 | FINANCE, ADS_ADMIN |
| 4 | POST | `/ads/ad-accounts/{id}/targeting` | Guardar una segmentación y, si se pide, su audiencia | MEDIO | 4 | AD_OPS, ADS_ADMIN |
| 5 | POST | `/ads/ad-sets/{id}/budget-schedules` | Programar un tramo de presupuesto o puja | MEDIO | 10 | AD_OPS, ADS_ADMIN |
| 6 | POST | `/ads/ad-sets/{id}/identity` | Asignar la identidad con la que se publica el conjunto | MEDIO | 5 | AD_OPS, ADS_ADMIN |
| 7 | POST | `/ads/ads/{id}/review-events` | Registrar el resultado de la revisión del anuncio | MEDIO | 10 | POLICY_REVIEWER, SYSTEM, ADS_ADMIN |
| 8 | POST | `/ads/automated-rules/{id}/evaluate` | Aplicar la acción de una regla automatizada | MEDIO | 7 | SYSTEM, ADS_ADMIN |
| 9 | POST | `/ads/business-managers/{bmId}/ad-accounts` | Provisionar una cuenta publicitaria | MEDIO | 5 | ADS_ADMIN, BUSINESS_ADMIN |
| 10 | POST | `/ads/business-managers/{bmId}/partners` | Vincular un socio y compartir el alcance de assets | MEDIO | 8 | ADS_ADMIN, BUSINESS_ADMIN |
| 11 | POST | `/ads/catalogs/{id}/feeds/{feedId}/run` | Sincronizar el catálogo de productos con el feed | MEDIO | 12 | SYSTEM, ADS_ADMIN |
| 12 | POST | `/ads/datasets/{id}/events` | Enviar una conversión server-side | MEDIO | 11 | SYSTEM, ADS_ADMIN |
| 13 | POST | `/ads/event-data-policies` | Publicar la política de datos de evento con sus reglas de campo | MEDIO | 3 | DATA_PRIVACY_OFFICER, ADS_ADMIN |
| 14 | POST | `/ads/ingest/insights` | Ingerir entrega e insights y consolidar el gasto | MEDIO | 11 | SYSTEM |
| 15 | POST | `/ads/lead-forms/{id}/submissions` | Recibir un lead del formulario y encolar su entrega al CRM | MEDIO | 7 | SYSTEM, AD_OPS, ADS_ADMIN |
| 16 | POST | `/ads/offline-conversion-sets/upload` | Subir conversiones offline con reporte de coincidencia | MEDIO | 4 | AD_OPS, ADS_ADMIN |
| 17 | POST | `/ads/platform-connections` | Conectar la plataforma externa e importar identidades | MEDIO | 11 | ADS_ADMIN, BUSINESS_ADMIN |
| 18 | POST | `/ads/policy-violations/{id}/appeals` | Apelar una infracción de política | MEDIO | 3 | POLICY_REVIEWER, AD_OPS, ADS_ADMIN |

---

## 1. POST /ads/ad-accounts/{id}/campaigns/launch

- **Origen:** CONTRATO
- **Nombre:** Lanzar una campaña con sus conjuntos, creativos y anuncios
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.launchCampaign` — `src/modules/ads/controllers/ads.controller.ts:147`

### Qué es y para qué sirve (negocio)

Lanzar una campaña con sus conjuntos, creativos y anuncios. Caso de uso UC-43-04: Lanzar campaña completa. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/ad-accounts/{id}/campaigns/launch` la atiende `AdsController.launchCampaign` (src/modules/ads/controllers/ads.controller.ts:147). Exige sesión con alguno de los roles AD_OPS, ADS_ADMIN. Valida el cuerpo como `LaunchCampaignDto` (34 campos, 11 obligatorios). Delega en `AdsCampaignsService.launchCampaign`. Crea filas en ads.ad_creatives, ads.ad_placements, ads.ad_sets, ads.ads, ads.campaigns, ads.creative_assets. Lee ads.ad_accounts, ads.targeting_specs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AD_OPS, ADS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:147` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/ads/controllers/ads.controller.ts:147` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_accounts` | LEE | LEE | DIRECTA | AdsController.launchCampaign → AdsCampaignsService.launchCampaign → AdsAccountsRepository.findAdAccountById | `src/modules/ads/repositories/ads-accounts.repository.ts:364` |
| `ads.ad_creatives` | ESCRIBE | CREA | DIRECTA | AdsController.launchCampaign → AdsCampaignsService.launchCampaign → AdsCampaignsRepository.createCreative | `src/modules/ads/repositories/ads-campaigns.repository.ts:469` |
| `ads.ad_placements` | ESCRIBE | CREA | DIRECTA | AdsController.launchCampaign → AdsCampaignsService.launchCampaign → AdsCampaignsRepository.createPlacement | `src/modules/ads/repositories/ads-campaigns.repository.ts:447` |
| `ads.ad_sets` | ESCRIBE | CREA | DIRECTA | AdsController.launchCampaign → AdsCampaignsService.launchCampaign → AdsCampaignsRepository.createAdSet | `src/modules/ads/repositories/ads-campaigns.repository.ts:357` |
| `ads.ads` | ESCRIBE | CREA | DIRECTA | AdsController.launchCampaign → AdsCampaignsService.launchCampaign → AdsCampaignsRepository.createAd | `src/modules/ads/repositories/ads-campaigns.repository.ts:602` |
| `ads.campaigns` | ESCRIBE | CREA | DIRECTA | AdsController.launchCampaign → AdsCampaignsService.launchCampaign → AdsCampaignsRepository.createCampaign | `src/modules/ads/repositories/ads-campaigns.repository.ts:299` |
| `ads.creative_assets` | ESCRIBE | CREA | DIRECTA | AdsController.launchCampaign → AdsCampaignsService.launchCampaign → AdsCampaignsRepository.createCreativeAsset | `src/modules/ads/repositories/ads-campaigns.repository.ts:540` |
| `ads.targeting_specs` | LEE | LEE | DIRECTA | AdsController.launchCampaign → AdsCampaignsService.launchCampaign → AdsCampaignsRepository.findTargetingSpecById | `src/modules/ads/repositories/ads-campaigns.repository.ts:685` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `LaunchCampaignDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:726` |
| `objective` | `string` | Sí | valores: AWARENESS, TRAFFIC, CONVERSIONS, LEADS | `@IsIn(AD_OBJECTIVES)` | — | `src/modules/ads/dto/ads.dto.ts:733` |
| `buyingType` | `string` | Sí | valores: AUCTION, RESERVED | `@IsIn(['AUCTION', 'RESERVED'])` | — | `src/modules/ads/dto/ads.dto.ts:740` |
| `bidStrategy` | `string` | No | valores: LOWEST_COST, COST_CAP, BID_CAP | `@IsOptional()` `@IsIn(BID_STRATEGIES)` | — | `src/modules/ads/dto/ads.dto.ts:748` |
| `dailyBudget` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/ads/dto/ads.dto.ts:756` |
| `lifetimeBudget` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/ads/dto/ads.dto.ts:764` |
| `spendCap` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Tope de gasto de la campaña | `src/modules/ads/dto/ads.dto.ts:772` |
| `startAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/ads/dto/ads.dto.ts:780` |
| `stopAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/ads/dto/ads.dto.ts:788` |
| `adSets` | `array<LaunchAdSetDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => LaunchAdSetDto)` | Conjuntos de anuncios, al menos uno | `src/modules/ads/dto/ads.dto.ts:801` |
| `adSets[].name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:640` |
| `adSets[].optimizationGoal` | `string` | Sí | valores: LINK_CLICKS, IMPRESSIONS, CONVERSIONS | `@IsIn(OPTIMIZATION_GOALS)` | — | `src/modules/ads/dto/ads.dto.ts:647` |
| `adSets[].billingEvent` | `string` | Sí | valores: IMPRESSIONS, CLICKS | `@IsIn(AD_BILLING_EVENTS)` | — | `src/modules/ads/dto/ads.dto.ts:654` |
| `adSets[].bidAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/ads/dto/ads.dto.ts:662` |
| `adSets[].dailyBudget` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/ads/dto/ads.dto.ts:670` |
| `adSets[].lifetimeBudget` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/ads/dto/ads.dto.ts:678` |
| `adSets[].targetingSpecId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Segmentación ya guardada | `src/modules/ads/dto/ads.dto.ts:689` |
| `adSets[].placements` | `array<PlacementDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => PlacementDto)` | — | `src/modules/ads/dto/ads.dto.ts:699` |
| `adSets[].placements[].platform` | `string` | No | valores: META, GOOGLE, TIKTOK | `@IsIn(AD_PLATFORMS)` | — | `src/modules/ads/dto/ads.dto.ts:506` |
| `adSets[].placements[].position` | `string` | No | valores: FEED, STORY, REELS | `@IsIn(PLACEMENT_POSITIONS)` | — | `src/modules/ads/dto/ads.dto.ts:513` |
| `adSets[].creative` | `LaunchCreativeDto` | Sí | — | `@ValidateNested()` `@Type(() => LaunchCreativeDto)` | — | `src/modules/ads/dto/ads.dto.ts:707` |
| `adSets[].creative.name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:576` |
| `adSets[].creative.format` | `string` | Sí | valores: SINGLE_IMAGE, VIDEO, CAROUSEL | `@IsIn(CREATIVE_FORMATS)` | — | `src/modules/ads/dto/ads.dto.ts:583` |
| `adSets[].creative.body` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/ads/dto/ads.dto.ts:591` |
| `adSets[].creative.linkUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/ads/dto/ads.dto.ts:599` |
| `adSets[].creative.objectStoryJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Historia del creativo tal como la publica la plataforma | `src/modules/ads/dto/ads.dto.ts:609` |
| `adSets[].creative.primaryMediaFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:617` |
| `adSets[].creative.assets` | `array<CreativeAssetDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => CreativeAssetDto)` | — | `src/modules/ads/dto/ads.dto.ts:627` |
| `adSets[].creative.assets[].assetType` | `string` | No | valores: IMAGE, VIDEO | `@IsIn(['IMAGE', 'VIDEO'])` | — | `src/modules/ads/dto/ads.dto.ts:525` |
| `adSets[].creative.assets[].fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo en `common.files` | `src/modules/ads/dto/ads.dto.ts:536` |
| `adSets[].creative.assets[].hash` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Hash del archivo, para deduplicar | `src/modules/ads/dto/ads.dto.ts:545` |
| `adSets[].creative.assets[].width` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | — | `src/modules/ads/dto/ads.dto.ts:554` |
| `adSets[].creative.assets[].height` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | — | `src/modules/ads/dto/ads.dto.ts:563` |
| `adSets[].adName` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre del anuncio | `src/modules/ads/dto/ads.dto.ts:715` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<LaunchCampaignResponseDto>` · DTO `LaunchCampaignResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `campaignId` | `string` | Sí | formato uuid | — | Identificador asociado a campaign. | `src/modules/ads/dto/ads.dto.ts:812` |
| `statusConceptId` | `string` | Sí | formato uuid | — | La campaña nace pausada | `src/modules/ads/dto/ads.dto.ts:818` |
| `adSetIds` | `array<string>` | Sí | formato uuid | — | Valor de ad set ids mantenido por la instancia. | `src/modules/ads/dto/ads.dto.ts:824` |
| `adIds` | `array<string>` | Sí | formato uuid | — | Valor de ad ids mantenido por la instancia. | `src/modules/ads/dto/ads.dto.ts:830` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cuenta publicitaria no encontrada; ResourceNotFoundException: Segmentación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La campaña debe terminar después de empezar; PreconditionFailedException: La campaña o sus conjuntos necesitan presupuesto; PreconditionFailedException: La cuenta publicitaria no está activa; PreconditionFailedException: La cuenta agotó su tope de gasto |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:102` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-04`

---

## 2. POST /ads/ad-accounts/{id}/experiments

- **Origen:** CONTRATO
- **Nombre:** Crear un experimento A/B y arrancar sus variantes
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.createExperiment` — `src/modules/ads/controllers/ads.controller.ts:295`

### Qué es y para qué sirve (negocio)

Crear un experimento A/B y arrancar sus variantes. Caso de uso UC-43-10: Experimento A/B. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/ad-accounts/{id}/experiments` la atiende `AdsController.createExperiment` (src/modules/ads/controllers/ads.controller.ts:295). Exige sesión con alguno de los roles AD_OPS, ADS_ADMIN. Valida el cuerpo como `CreateExperimentDto` (13 campos, 9 obligatorios). Delega en `AdsOptimizationService.createExperiment`. Crea filas en ads.ad_experiments, ads.experiment_variants. Actualiza ads.ad_experiments, ads.ad_sets, ads.campaigns. Lee ads.ad_accounts, ads.ad_sets, ads.campaigns.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AD_OPS, ADS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:295` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/ads/controllers/ads.controller.ts:295` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_accounts` | LEE | LEE | DIRECTA | AdsController.createExperiment → AdsOptimizationService.createExperiment → AdsAccountsRepository.findAdAccountById | `src/modules/ads/repositories/ads-accounts.repository.ts:364` |
| `ads.ad_experiments` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.createExperiment → AdsOptimizationService.createExperiment | `src/modules/ads/services/ads-optimization.service.ts:239` |
| `ads.ad_experiments` | ESCRIBE | CREA | DIRECTA | AdsController.createExperiment → AdsOptimizationService.createExperiment → AdsOptimizationRepository.createExperiment | `src/modules/ads/repositories/ads-optimization.repository.ts:179` |
| `ads.ad_sets` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.createExperiment → AdsOptimizationService.createExperiment | `src/modules/ads/services/ads-optimization.service.ts:221` |
| `ads.ad_sets` | LEE | LEE | DIRECTA | AdsController.createExperiment → AdsOptimizationService.createExperiment → AdsCampaignsRepository.findAdSetForUpdate | `src/modules/ads/repositories/ads-campaigns.repository.ts:396` |
| `ads.campaigns` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.createExperiment → AdsOptimizationService.createExperiment | `src/modules/ads/services/ads-optimization.service.ts:202` |
| `ads.campaigns` | LEE | LEE | DIRECTA | AdsController.createExperiment → AdsOptimizationService.createExperiment → AdsCampaignsRepository.findCampaignForUpdate | `src/modules/ads/repositories/ads-campaigns.repository.ts:342` |
| `ads.experiment_variants` | ESCRIBE | CREA | DIRECTA | AdsController.createExperiment → AdsOptimizationService.createExperiment → AdsOptimizationRepository.createVariant | `src/modules/ads/repositories/ads-optimization.repository.ts:255` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateExperimentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:1889` |
| `experimentType` | `string` | Sí | valores: AB_SPLIT, CBO | `@IsIn(['AB_SPLIT', 'CBO'])` | — | `src/modules/ads/dto/ads.dto.ts:1896` |
| `objectiveMetric` | `string` | Sí | valores: CPA, ROAS, CTR | `@IsIn(OBJECTIVE_METRICS)` | — | `src/modules/ads/dto/ads.dto.ts:1903` |
| `hypothesis` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/ads/dto/ads.dto.ts:1911` |
| `holdoutPercent` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Porcentaje reservado como grupo de control ciego | `src/modules/ads/dto/ads.dto.ts:1921` |
| `startAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/ads/dto/ads.dto.ts:1929` |
| `endAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/ads/dto/ads.dto.ts:1937` |
| `variants` | `array<ExperimentVariantDto>` | Sí | mínimo 2 elemento(s) | `@IsArray()` `@ArrayMinSize(2)` `@ValidateNested({ each: true })` `@Type(() => ExperimentVariantDto)` | Al menos dos variantes | `src/modules/ads/dto/ads.dto.ts:1950` |
| `variants[].name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:1848` |
| `variants[].variantRefType` | `string` | Sí | valores: CAMPAIGN, AD_SET | `@IsIn(['CAMPAIGN', 'AD_SET'])` | — | `src/modules/ads/dto/ads.dto.ts:1855` |
| `variants[].variantRefId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:1862` |
| `variants[].trafficSplitPercent` | `string` | Sí | — | `@IsNumberString()` | Porcentaje de tráfico; la suma de las variantes debe dar 100 | `src/modules/ads/dto/ads.dto.ts:1871` |
| `variants[].isControl` | `boolean` | Sí | — | `@IsBoolean()` | Exactamente una variante es el control | `src/modules/ads/dto/ads.dto.ts:1878` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ExperimentResponseDto>` · DTO `ExperimentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/ads/dto/ads.dto.ts:1961` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/ads/dto/ads.dto.ts:1967` |
| `variantIds` | `array<string>` | Sí | formato uuid | — | Valor de variant ids mantenido por la instancia. | `src/modules/ads/dto/ads.dto.ts:1973` |
| `entitiesActivated` | `number` | Sí | — | — | Entidades que pasaron de pausadas a activas | `src/modules/ads/dto/ads.dto.ts:1979` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cuenta publicitaria no encontrada; ResourceNotFoundException: Campaña de la variante no encontrada; ResourceNotFoundException: Conjunto de la variante no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El reparto de tráfico debe sumar 100; PreconditionFailedException: El experimento necesita exactamente un control |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:189` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-10`

---

## 3. POST /ads/ad-accounts/{id}/invoices/issue

- **Origen:** CONTRATO
- **Nombre:** Emitir la factura de anuncios del periodo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.issueInvoice` — `src/modules/ads/controllers/ads.controller.ts:400`

### Qué es y para qué sirve (negocio)

Emitir la factura de anuncios del periodo. Caso de uso UC-43-14: Emitir factura de anuncios. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:62`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/ad-accounts/{id}/invoices/issue` la atiende `AdsController.issueInvoice` (src/modules/ads/controllers/ads.controller.ts:400). Exige sesión con alguno de los roles FINANCE, ADS_ADMIN. Valida el cuerpo como `IssueAdInvoiceDto` (5 campos, 3 obligatorios). Delega en `AdsOptimizationService.issueInvoice`. Crea filas en ads.ad_billing_events, ads.ad_invoice_lines, ads.ad_invoices. Lee ads.ad_accounts, ads.ad_invoices, ads.insights_daily.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: FINANCE, ADS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:400` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/ads/controllers/ads.controller.ts:400` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_accounts` | LEE | LEE | DIRECTA | AdsController.issueInvoice → AdsOptimizationService.issueInvoice → AdsAccountsRepository.findAdAccountForUpdate | `src/modules/ads/repositories/ads-accounts.repository.ts:372` |
| `ads.ad_billing_events` | ESCRIBE | CREA | DIRECTA | AdsController.issueInvoice → AdsOptimizationService.issueInvoice → AdsDataRepository.createBillingEvent | `src/modules/ads/repositories/ads-data.repository.ts:626` |
| `ads.ad_invoice_lines` | ESCRIBE | CREA | DIRECTA | AdsController.issueInvoice → AdsOptimizationService.issueInvoice → AdsOptimizationRepository.createInvoiceLine | `src/modules/ads/repositories/ads-optimization.repository.ts:666` |
| `ads.ad_invoices` | ESCRIBE | CREA | DIRECTA | AdsController.issueInvoice → AdsOptimizationService.issueInvoice → AdsOptimizationRepository.createInvoice | `src/modules/ads/repositories/ads-optimization.repository.ts:583` |
| `ads.ad_invoices` | LEE | LEE | DIRECTA | AdsController.issueInvoice → AdsOptimizationService.issueInvoice → AdsOptimizationRepository.findInvoiceByNumber | `src/modules/ads/repositories/ads-optimization.repository.ts:613` |
| `ads.insights_daily` | LEE | LEE | DIRECTA | AdsController.issueInvoice → AdsOptimizationService.issueInvoice → AdsDataRepository.findInsightsInPeriod | `src/modules/ads/repositories/ads-data.repository.ts:665` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `IssueAdInvoiceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `invoiceNumber` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Número de factura, único | `src/modules/ads/dto/ads.dto.ts:2393` |
| `periodStart` | `string` | Sí | formato date | `@IsISO8601()` | — | `src/modules/ads/dto/ads.dto.ts:2400` |
| `periodEnd` | `string` | Sí | formato date | `@IsISO8601()` | — | `src/modules/ads/dto/ads.dto.ts:2407` |
| `taxPercentage` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Porcentaje de impuesto sobre el subtotal | `src/modules/ads/dto/ads.dto.ts:2418` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:2426` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "invoiceNumber": "valor-ejemplo",
  "periodStart": "2026-07-31",
  "periodEnd": "2026-07-31"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "invoiceNumber": "valor-ejemplo",
  "periodStart": "2026-07-31",
  "periodEnd": "2026-07-31",
  "taxPercentage": "0",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<AdInvoiceResponseDto>` · DTO `AdInvoiceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/ads/dto/ads.dto.ts:2437` |
| `invoiceNumber` | `string` | Sí | — | — | Valor de invoice number mantenido por la instancia. | `src/modules/ads/dto/ads.dto.ts:2443` |
| `subtotal` | `string` | Sí | — | — | Suma de las líneas | `src/modules/ads/dto/ads.dto.ts:2449` |
| `taxTotal` | `string` | Sí | — | — | Valor de tax total mantenido por la instancia. | `src/modules/ads/dto/ads.dto.ts:2455` |
| `total` | `string` | Sí | — | — | Valor de total mantenido por la instancia. | `src/modules/ads/dto/ads.dto.ts:2461` |
| `lines` | `number` | Sí | — | — | Líneas emitidas, una por campaña con gasto | `src/modules/ads/dto/ads.dto.ts:2467` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/ads/dto/ads.dto.ts:2473` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cuenta publicitaria no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una factura con ese número; ConflictException: El periodo ya está facturado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El periodo debe terminar después de empezar; PreconditionFailedException: No hay consumo registrado en el periodo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:243` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-14`

---

## 4. POST /ads/ad-accounts/{id}/targeting

- **Origen:** CONTRATO
- **Nombre:** Guardar una segmentación y, si se pide, su audiencia
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.createTargeting` — `src/modules/ads/controllers/ads.controller.ts:168`

### Qué es y para qué sirve (negocio)

Guardar una segmentación y, si se pide, su audiencia. Caso de uso UC-43-05: Segmentación e identidad. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/ad-accounts/{id}/targeting` la atiende `AdsController.createTargeting` (src/modules/ads/controllers/ads.controller.ts:168). Exige sesión con alguno de los roles AD_OPS, ADS_ADMIN. Valida el cuerpo como `CreateTargetingDto` (14 campos, 0 obligatorios). Delega en `AdsCampaignsService.createTargeting`. Crea filas en ads.custom_audiences, ads.lookalike_specs, ads.targeting_specs. Lee ads.ad_accounts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AD_OPS, ADS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:168` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/ads/controllers/ads.controller.ts:168` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_accounts` | LEE | LEE | DIRECTA | AdsController.createTargeting → AdsCampaignsService.createTargeting → AdsAccountsRepository.findAdAccountById | `src/modules/ads/repositories/ads-accounts.repository.ts:364` |
| `ads.custom_audiences` | ESCRIBE | CREA | DIRECTA | AdsController.createTargeting → AdsCampaignsService.createTargeting → AdsCampaignsRepository.createCustomAudience | `src/modules/ads/repositories/ads-campaigns.repository.ts:732` |
| `ads.lookalike_specs` | ESCRIBE | CREA | DIRECTA | AdsController.createTargeting → AdsCampaignsService.createTargeting → AdsCampaignsRepository.createLookalikeSpec | `src/modules/ads/repositories/ads-campaigns.repository.ts:846` |
| `ads.targeting_specs` | ESCRIBE | CREA | DIRECTA | AdsController.createTargeting → AdsCampaignsService.createTargeting → AdsCampaignsRepository.createTargetingSpec | `src/modules/ads/repositories/ads-campaigns.repository.ts:653` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateTargetingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:913` |
| `geoLocationsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Zonas geográficas incluidas | `src/modules/ads/dto/ads.dto.ts:921` |
| `excludedGeoLocationsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Zonas geográficas excluidas | `src/modules/ads/dto/ads.dto.ts:929` |
| `ageMin` | `number` | No | mínimo 13; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(13)` `@Max(120)` | — | `src/modules/ads/dto/ads.dto.ts:939` |
| `ageMax` | `number` | No | mínimo 13; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(13)` `@Max(120)` | — | `src/modules/ads/dto/ads.dto.ts:949` |
| `interestsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Intereses; nunca condiciones de salud | `src/modules/ads/dto/ads.dto.ts:957` |
| `customAudienceIdsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Audiencias personalizadas incluidas | `src/modules/ads/dto/ads.dto.ts:965` |
| `customAudience` | `CreateCustomAudienceDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => CreateCustomAudienceDto)` | Audiencia personalizada a crear junto con la segmentación | `src/modules/ads/dto/ads.dto.ts:976` |
| `customAudience.name` | `string` | No | longitud máxima 200 | — | — | sin fuente |
| `customAudience.source` | `string` | No | valores: PIXEL, CUSTOMER_LIST, ENGAGEMENT | — | — | sin fuente |
| `customAudience.ruleJson` | `object` | No | — | — | Regla que define la audiencia | sin fuente |
| `customAudience.dataSourcePixelId` | `string` | No | formato uuid | — | Pixel del que se alimenta | sin fuente |
| `customAudience.lookalikeRatioPercent` | `string` | No | — | — | Porcentaje de similitud para derivar una audiencia lookalike | sin fuente |
| `customAudience.lookalikeCountryConceptId` | `string` | No | formato uuid | — | País de la lookalike | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<TargetingResponseDto>` · DTO `TargetingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetingSpecId` | `string` | Sí | formato uuid | — | Identificador asociado a targeting spec. | `src/modules/ads/dto/ads.dto.ts:987` |
| `customAudienceId` | `string` | No | formato uuid | — | Identificador asociado a custom audience. | `src/modules/ads/dto/ads.dto.ts:993` |
| `lookalikeSpecId` | `string` | No | formato uuid | — | Identificador asociado a lookalike spec. | `src/modules/ads/dto/ads.dto.ts:999` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cuenta publicitaria no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El rango de edad está invertido; PreconditionFailedException: Una lookalike necesita país |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:120` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-05`

---

## 5. POST /ads/ad-sets/{id}/budget-schedules

- **Origen:** CONTRATO
- **Nombre:** Programar un tramo de presupuesto o puja
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.createBudgetSchedule` — `src/modules/ads/controllers/ads.controller.ts:444`

### Qué es y para qué sirve (negocio)

Programar un tramo de presupuesto o puja. Caso de uso UC-43-16: Programar presupuesto y puja. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:64`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/ad-sets/{id}/budget-schedules` la atiende `AdsController.createBudgetSchedule` (src/modules/ads/controllers/ads.controller.ts:444). Exige sesión con alguno de los roles AD_OPS, ADS_ADMIN. Valida el cuerpo como `CreateBudgetScheduleDto` (8 campos, 4 obligatorios). Delega en `AdsCampaignsService.createBudgetSchedule`. Crea filas en ads.adset_learning_snapshots, ads.attribution_settings, ads.budget_schedules. Actualiza ads.ad_sets, ads.attribution_settings. Lee ads.ad_accounts, ads.ad_sets, ads.attribution_settings, ads.budget_schedules, ads.campaigns.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AD_OPS, ADS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:444` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/ads/controllers/ads.controller.ts:444` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_accounts` | LEE | LEE | DIRECTA | AdsController.createBudgetSchedule → AdsCampaignsService.createBudgetSchedule → AdsAccountsRepository.findAdAccountById | `src/modules/ads/repositories/ads-accounts.repository.ts:364` |
| `ads.ad_sets` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.createBudgetSchedule → AdsCampaignsService.createBudgetSchedule | `src/modules/ads/services/ads-campaigns.service.ts:582` |
| `ads.ad_sets` | LEE | LEE | DIRECTA | AdsController.createBudgetSchedule → AdsCampaignsService.createBudgetSchedule → AdsCampaignsRepository.findAdSetForUpdate | `src/modules/ads/repositories/ads-campaigns.repository.ts:396` |
| `ads.adset_learning_snapshots` | ESCRIBE | CREA | DIRECTA | AdsController.createBudgetSchedule → AdsCampaignsService.createBudgetSchedule → AdsCampaignsRepository.createLearningSnapshot | `src/modules/ads/repositories/ads-campaigns.repository.ts:1005` |
| `ads.attribution_settings` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.createBudgetSchedule → AdsCampaignsService.createBudgetSchedule → AdsCampaignsRepository.upsertAttributionSettings | `src/modules/ads/repositories/ads-campaigns.repository.ts:946` |
| `ads.attribution_settings` | ESCRIBE | CREA | DIRECTA | AdsController.createBudgetSchedule → AdsCampaignsService.createBudgetSchedule → AdsCampaignsRepository.upsertAttributionSettings | `src/modules/ads/repositories/ads-campaigns.repository.ts:951` |
| `ads.attribution_settings` | LEE | LEE | DIRECTA | AdsController.createBudgetSchedule → AdsCampaignsService.createBudgetSchedule → AdsCampaignsRepository.findDefaultAttributionSettings | `src/modules/ads/repositories/ads-campaigns.repository.ts:976` |
| `ads.budget_schedules` | ESCRIBE | CREA | DIRECTA | AdsController.createBudgetSchedule → AdsCampaignsService.createBudgetSchedule → AdsCampaignsRepository.createBudgetSchedule | `src/modules/ads/repositories/ads-campaigns.repository.ts:873` |
| `ads.budget_schedules` | LEE | LEE | DIRECTA | AdsController.createBudgetSchedule → AdsCampaignsService.createBudgetSchedule → AdsCampaignsRepository.findActiveSchedules | `src/modules/ads/repositories/ads-campaigns.repository.ts:900` |
| `ads.campaigns` | LEE | LEE | DIRECTA | AdsController.createBudgetSchedule → AdsCampaignsService.createBudgetSchedule → AdsCampaignsRepository.findCampaignById | `src/modules/ads/repositories/ads-campaigns.repository.ts:328` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateBudgetScheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `budgetType` | `string` | Sí | valores: DAILY, LIFETIME | `@IsIn(['DAILY', 'LIFETIME'])` | — | `src/modules/ads/dto/ads.dto.ts:2646` |
| `amount` | `string` | Sí | — | `@IsNumberString()` | Importe del tramo | `src/modules/ads/dto/ads.dto.ts:2653` |
| `currencyConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:2660` |
| `validFrom` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/ads/dto/ads.dto.ts:2667` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Sin fin, el tramo queda abierto | `src/modules/ads/dto/ads.dto.ts:2678` |
| `bidAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Nueva puja a aplicar junto con el presupuesto | `src/modules/ads/dto/ads.dto.ts:2688` |
| `clickWindowDays` | `number` | No | mínimo 1; máximo 90 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(90)` | Ventana de atribución por click, en días | `src/modules/ads/dto/ads.dto.ts:2700` |
| `viewWindowDays` | `number` | No | mínimo 1; máximo 90 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(90)` | Ventana de atribución por impresión, en días | `src/modules/ads/dto/ads.dto.ts:2712` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "budgetType": "DAILY",
  "amount": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<BudgetScheduleResponseDto>` · DTO `BudgetScheduleResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/ads/dto/ads.dto.ts:2723` |
| `adSetId` | `string` | Sí | formato uuid | — | Identificador asociado a ad set. | `src/modules/ads/dto/ads.dto.ts:2729` |
| `amount` | `string` | Sí | — | — | Valor de amount mantenido por la instancia. | `src/modules/ads/dto/ads.dto.ts:2735` |
| `learningReset` | `boolean` | Sí | — | — | true si el cambio reinició la fase de aprendizaje del conjunto | `src/modules/ads/dto/ads.dto.ts:2744` |
| `learningSnapshotId` | `string` | No | formato uuid | — | Identificador asociado a learning snapshot. | `src/modules/ads/dto/ads.dto.ts:2750` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conjunto de anuncios no encontrado; ResourceNotFoundException: Campaña del conjunto no encontrada |
| 409 | `CONFLICT` | ConflictException: El tramo se solapa con otro vigente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El tramo debe terminar después de empezar; PreconditionFailedException: El presupuesto del tramo excede el tope de gasto de la cuenta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:271` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-16`

---

## 6. POST /ads/ad-sets/{id}/identity

- **Origen:** CONTRATO
- **Nombre:** Asignar la identidad con la que se publica el conjunto
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.assignIdentity` — `src/modules/ads/controllers/ads.controller.ts:190`

### Qué es y para qué sirve (negocio)

Asignar la identidad con la que se publica el conjunto. Caso de uso UC-43-05: Segmentación e identidad. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/ad-sets/{id}/identity` la atiende `AdsController.assignIdentity` (src/modules/ads/controllers/ads.controller.ts:190). Exige sesión con alguno de los roles AD_OPS, ADS_ADMIN. Valida el cuerpo como `AssignIdentityDto` (2 campos, 1 obligatorio). Delega en `AdsCampaignsService.assignIdentity`. Crea filas en ads.ad_identity_asset_assignments. Actualiza ads.ad_identity_asset_assignments. Lee ads.ad_identity_asset_assignments, ads.ad_identity_assets, ads.ad_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AD_OPS, ADS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:190` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/ads/controllers/ads.controller.ts:190` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_identity_asset_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.assignIdentity → AdsCampaignsService.assignIdentity | `src/modules/ads/services/ads-campaigns.service.ts:454` |
| `ads.ad_identity_asset_assignments` | ESCRIBE | CREA | DIRECTA | AdsController.assignIdentity → AdsCampaignsService.assignIdentity → AdsAccountsRepository.createIdentityAssignment | `src/modules/ads/repositories/ads-accounts.repository.ts:717` |
| `ads.ad_identity_asset_assignments` | LEE | LEE | DIRECTA | AdsController.assignIdentity → AdsCampaignsService.assignIdentity → AdsAccountsRepository.findActiveAssignmentForUpdate | `src/modules/ads/repositories/ads-accounts.repository.ts:741` |
| `ads.ad_identity_assets` | LEE | LEE | DIRECTA | AdsController.assignIdentity → AdsCampaignsService.assignIdentity → AdsAccountsRepository.findIdentityAssetById | `src/modules/ads/repositories/ads-accounts.repository.ts:682` |
| `ads.ad_sets` | LEE | LEE | DIRECTA | AdsController.assignIdentity → AdsCampaignsService.assignIdentity → AdsCampaignsRepository.findAdSetById | `src/modules/ads/repositories/ads-campaigns.repository.ts:385` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AssignIdentityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `adIdentityAssetId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:1009` |
| `role` | `string` | No | valores: PRIMARY, SECONDARY | `@IsOptional()` `@IsIn(['PRIMARY', 'SECONDARY'])` | — | `src/modules/ads/dto/ads.dto.ts:1017` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "adIdentityAssetId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "adIdentityAssetId": "00000000-0000-4000-8000-000000000001",
  "role": "PRIMARY"
}
```

</details>

### Respuesta — `Promise<AssignIdentityResponseDto>` · DTO `AssignIdentityResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `assignmentId` | `string` | Sí | formato uuid | — | Identificador asociado a assignment. | `src/modules/ads/dto/ads.dto.ts:1028` |
| `adSetId` | `string` | Sí | formato uuid | — | Identificador asociado a ad set. | `src/modules/ads/dto/ads.dto.ts:1034` |
| `supersededAssignmentId` | `string` | No | formato uuid | — | Asignación anterior cerrada, si la había | `src/modules/ads/dto/ads.dto.ts:1043` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conjunto de anuncios no encontrado; ResourceNotFoundException: Identidad no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La identidad no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:121` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-05`

---

## 7. POST /ads/ads/{id}/review-events

- **Origen:** CONTRATO
- **Nombre:** Registrar el resultado de la revisión del anuncio
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.recordReviewEvent` — `src/modules/ads/controllers/ads.controller.ts:338`

### Qué es y para qué sirve (negocio)

Registrar el resultado de la revisión del anuncio. Caso de uso UC-43-12: Moderación y apelación. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/ads/{id}/review-events` la atiende `AdsController.recordReviewEvent` (src/modules/ads/controllers/ads.controller.ts:338). Exige sesión con alguno de los roles POLICY_REVIEWER, SYSTEM, ADS_ADMIN. Valida el cuerpo como `RecordReviewEventDto` (9 campos, 2 obligatorios). Delega en `AdsOptimizationService.recordReviewEvent`. Crea filas en ads.ad_policy_violations, ads.ad_review_events, ads.delivery_status_snapshots. Actualiza ads.ad_policy_violations, ads.ads. Lee ads.ad_policy_violations, ads.ad_review_events, ads.ad_sets, ads.ads, ads.campaigns.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: POLICY_REVIEWER, SYSTEM, ADS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:338` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/ads/controllers/ads.controller.ts:338` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_policy_violations` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.recordReviewEvent → AdsOptimizationService.recordReviewEvent | `src/modules/ads/services/ads-optimization.service.ts:415` |
| `ads.ad_policy_violations` | ESCRIBE | CREA | DIRECTA | AdsController.recordReviewEvent → AdsOptimizationService.recordReviewEvent → AdsOptimizationRepository.createViolation | `src/modules/ads/repositories/ads-optimization.repository.ts:461` |
| `ads.ad_policy_violations` | LEE | LEE | DIRECTA | AdsController.recordReviewEvent → AdsOptimizationService.recordReviewEvent → AdsOptimizationRepository.findOpenViolations | `src/modules/ads/repositories/ads-optimization.repository.ts:502` |
| `ads.ad_review_events` | ESCRIBE | CREA | DIRECTA | AdsController.recordReviewEvent → AdsOptimizationService.recordReviewEvent → AdsOptimizationRepository.createReviewEvent | `src/modules/ads/repositories/ads-optimization.repository.ts:393` |
| `ads.ad_review_events` | LEE | LEE | DIRECTA | AdsController.recordReviewEvent → AdsOptimizationService.recordReviewEvent → AdsOptimizationRepository.findReviewEventByExternalId | `src/modules/ads/repositories/ads-optimization.repository.ts:414` |
| `ads.ad_sets` | LEE | LEE | DIRECTA | AdsController.recordReviewEvent → AdsOptimizationService.recordReviewEvent → AdsCampaignsRepository.findAdSetById | `src/modules/ads/repositories/ads-campaigns.repository.ts:385` |
| `ads.ads` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.recordReviewEvent → AdsOptimizationService.recordReviewEvent | `src/modules/ads/services/ads-optimization.service.ts:422` |
| `ads.ads` | LEE | LEE | DIRECTA | AdsController.recordReviewEvent → AdsOptimizationService.recordReviewEvent → AdsCampaignsRepository.findAdById | `src/modules/ads/repositories/ads-campaigns.repository.ts:626` |
| `ads.campaigns` | LEE | LEE | DIRECTA | AdsController.recordReviewEvent → AdsOptimizationService.recordReviewEvent → AdsCampaignsRepository.findCampaignById | `src/modules/ads/repositories/ads-campaigns.repository.ts:328` |
| `ads.delivery_status_snapshots` | ESCRIBE | CREA | DIRECTA | AdsController.recordReviewEvent → AdsOptimizationService.recordReviewEvent → AdsDataRepository.createDeliverySnapshot | `src/modules/ads/repositories/ads-data.repository.ts:565` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordReviewEventDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reviewEventType` | `string` | Sí | valores: INITIAL, RE_REVIEW, APPEAL_DECISION | `@IsIn(['INITIAL', 'RE_REVIEW', 'APPEAL_DECISION'])` | — | `src/modules/ads/dto/ads.dto.ts:2068` |
| `reviewStatus` | `string` | Sí | valores: PENDING, APPROVED, DISAPPROVED | `@IsIn(['PENDING', 'APPROVED', 'DISAPPROVED'])` | — | `src/modules/ads/dto/ads.dto.ts:2075` |
| `externalReviewId` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Identificador de la revisión en la plataforma; hace idempotente el webhook | `src/modules/ads/dto/ads.dto.ts:2088` |
| `reasonsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Motivos que devuelve la plataforma | `src/modules/ads/dto/ads.dto.ts:2096` |
| `sourcePayloadHash` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Hash del payload recibido, para trazabilidad | `src/modules/ads/dto/ads.dto.ts:2107` |
| `policyCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código de la política incumplida | `src/modules/ads/dto/ads.dto.ts:2119` |
| `policyCategory` | `string` | No | valores: HEALTH, MISLEADING, PROHIBITED | `@IsOptional()` `@IsIn(POLICY_CATEGORIES)` | — | `src/modules/ads/dto/ads.dto.ts:2127` |
| `severity` | `string` | No | valores: LOW, MEDIUM, HIGH | `@IsOptional()` `@IsIn(['LOW', 'MEDIUM', 'HIGH'])` | — | `src/modules/ads/dto/ads.dto.ts:2135` |
| `explanation` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/ads/dto/ads.dto.ts:2143` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reviewEventType": "INITIAL",
  "reviewStatus": "PENDING"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ReviewEventResponseDto>` · DTO `ReviewEventResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reviewEventId` | `string` | Sí | formato uuid | — | Identificador asociado a review event. | `src/modules/ads/dto/ads.dto.ts:2154` |
| `violationId` | `string` | No | formato uuid | — | Infracción abierta, si el anuncio se rechazó | `src/modules/ads/dto/ads.dto.ts:2163` |
| `effectiveStatusConceptId` | `string` | Sí | formato uuid | — | Estado efectivo en el que queda el anuncio | `src/modules/ads/dto/ads.dto.ts:2172` |
| `duplicate` | `boolean` | Sí | — | — | true si el evento ya se había recibido | `src/modules/ads/dto/ads.dto.ts:2178` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Anuncio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un rechazo necesita código, categoría y severidad de la política |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:213` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-12`

---

## 8. POST /ads/automated-rules/{id}/evaluate

- **Origen:** CONTRATO
- **Nombre:** Aplicar la acción de una regla automatizada
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.evaluateRule` — `src/modules/ads/controllers/ads.controller.ts:316`

### Qué es y para qué sirve (negocio)

Aplicar la acción de una regla automatizada. Caso de uso UC-43-11: Aplicar regla automatizada. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/automated-rules/{id}/evaluate` la atiende `AdsController.evaluateRule` (src/modules/ads/controllers/ads.controller.ts:316). Exige sesión con alguno de los roles SYSTEM, ADS_ADMIN. Valida el cuerpo como `AdsEvaluateRuleDto` (3 campos, 1 obligatorio). Delega en `AdsOptimizationService.evaluateRule`. Crea filas en ads.rule_executions. Actualiza ads.ad_sets, ads.automated_rules, ads.campaigns. Lee ads.ad_sets, ads.automated_rules, ads.campaigns.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, ADS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:316` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/ads/controllers/ads.controller.ts:316` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_sets` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.evaluateRule → AdsOptimizationService.evaluateRule → AdsOptimizationService.applyRuleAction | `src/modules/ads/services/ads-optimization.service.ts:876` |
| `ads.ad_sets` | LEE | LEE | DIRECTA | AdsController.evaluateRule → AdsOptimizationService.evaluateRule → AdsOptimizationService.applyRuleAction → AdsCampaignsRepository.findAdSetForUpdate | `src/modules/ads/repositories/ads-campaigns.repository.ts:396` |
| `ads.automated_rules` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.evaluateRule → AdsOptimizationService.evaluateRule | `src/modules/ads/services/ads-optimization.service.ts:315` |
| `ads.automated_rules` | LEE | LEE | DIRECTA | AdsController.evaluateRule → AdsOptimizationService.evaluateRule → AdsOptimizationRepository.findRuleForUpdate | `src/modules/ads/repositories/ads-optimization.repository.ts:297` |
| `ads.campaigns` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.evaluateRule → AdsOptimizationService.evaluateRule → AdsOptimizationService.applyRuleAction | `src/modules/ads/services/ads-optimization.service.ts:857` |
| `ads.campaigns` | LEE | LEE | DIRECTA | AdsController.evaluateRule → AdsOptimizationService.evaluateRule → AdsOptimizationService.applyRuleAction → AdsCampaignsRepository.findCampaignForUpdate | `src/modules/ads/repositories/ads-campaigns.repository.ts:342` |
| `ads.rule_executions` | ESCRIBE | CREA | DIRECTA | AdsController.evaluateRule → AdsOptimizationService.evaluateRule → AdsOptimizationRepository.createRuleExecution | `src/modules/ads/repositories/ads-optimization.repository.ts:338` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AdsEvaluateRuleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `matchedEntityIds` | `array<string>` | Sí | formato uuid | `@IsArray()` `@IsUUID(undefined, { each: true })` | Entidades que el evaluador determinó que cumplen la condición | `src/modules/ads/dto/ads.dto.ts:2000` |
| `newDailyBudget` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Nuevo presupuesto diario cuando la acción es ajustar presupuesto | `src/modules/ads/dto/ads.dto.ts:2011` |
| `newBidAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Nueva puja cuando la acción es ajustar puja | `src/modules/ads/dto/ads.dto.ts:2021` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "matchedEntityIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "matchedEntityIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "newDailyBudget": "valor-ejemplo",
  "newBidAmount": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<EvaluateRuleResponseDto>` · DTO `EvaluateRuleResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `graphRuleDefinitionId` | `string` | Sí | formato uuid | — | Identificador asociado a graph rule definition. | sin fuente |
| `severity` | `string` | Sí | — | — | Valor de severity mantenido por la instancia. | sin fuente |
| `hitsOpened` | `number` | Sí | — | — | Hallazgos nuevos abiertos | sin fuente |
| `duplicatesSkipped` | `number` | Sí | — | — | Coincidencias descartadas por tener ya un hallazgo vivo | sin fuente |
| `hitIds` | `array<string>` | Sí | formato uuid | — | Valor de hit ids mantenido por la instancia. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Regla automatizada no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La regla no está habilitada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:190` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-11`

---

## 9. POST /ads/business-managers/{bmId}/ad-accounts

- **Origen:** CONTRATO
- **Nombre:** Provisionar una cuenta publicitaria
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.provisionAdAccount` — `src/modules/ads/controllers/ads.controller.ts:83`

### Qué es y para qué sirve (negocio)

Provisionar una cuenta publicitaria. Caso de uso UC-43-01: Provisionar cuenta publicitaria. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/business-managers/{bmId}/ad-accounts` la atiende `AdsController.provisionAdAccount` (src/modules/ads/controllers/ads.controller.ts:83). Exige sesión con alguno de los roles ADS_ADMIN, BUSINESS_ADMIN. Valida el cuerpo como `ProvisionAdAccountDto` (10 campos, 5 obligatorios). Delega en `AdsAccountsService.provisionAdAccount`. Crea filas en ads.ad_account_users, ads.ad_accounts, ads.business_managers. Lee ads.ad_accounts, ads.business_managers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ADS_ADMIN, BUSINESS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: bmId | `src/modules/ads/controllers/ads.controller.ts:83` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_account_users` | ESCRIBE | CREA | DIRECTA | AdsController.provisionAdAccount → AdsAccountsService.provisionAdAccount → AdsAccountsRepository.createAccountUser | `src/modules/ads/repositories/ads-accounts.repository.ts:404` |
| `ads.ad_accounts` | ESCRIBE | CREA | DIRECTA | AdsController.provisionAdAccount → AdsAccountsService.provisionAdAccount → AdsAccountsRepository.createAdAccount | `src/modules/ads/repositories/ads-accounts.repository.ts:337` |
| `ads.ad_accounts` | LEE | LEE | DIRECTA | AdsController.provisionAdAccount → AdsAccountsService.provisionAdAccount → AdsAccountsRepository.findAdAccountByRef | `src/modules/ads/repositories/ads-accounts.repository.ts:390` |
| `ads.business_managers` | ESCRIBE | CREA | DIRECTA | AdsController.provisionAdAccount → AdsAccountsService.provisionAdAccount → AdsAccountsRepository.createBusinessManager | `src/modules/ads/repositories/ads-accounts.repository.ts:285` |
| `ads.business_managers` | LEE | LEE | DIRECTA | AdsController.provisionAdAccount → AdsAccountsService.provisionAdAccount → AdsAccountsRepository.findBusinessManagerById | `src/modules/ads/repositories/ads-accounts.repository.ts:312` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `bmId` | path | Sí | `string` | — |

### Cuerpo — DTO `ProvisionAdAccountDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Business manager a crear si no existe | `src/modules/ads/dto/ads.dto.ts:44` |
| `businessManagerName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Nombre del business manager cuando hay que crearlo | `src/modules/ads/dto/ads.dto.ts:55` |
| `externalBusinessRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia externa del business manager | `src/modules/ads/dto/ads.dto.ts:66` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:74` |
| `externalAccountRef` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Referencia de la cuenta en la plataforma, única | `src/modules/ads/dto/ads.dto.ts:85` |
| `currencyConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:92` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/ads/dto/ads.dto.ts:101` |
| `spendCapAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Tope de gasto de la cuenta | `src/modules/ads/dto/ads.dto.ts:109` |
| `fundingPaymentMethodId` | `string` | Sí | formato uuid | `@IsUUID()` | Método de pago que financia la cuenta | `src/modules/ads/dto/ads.dto.ts:119` |
| `ownerUserId` | `string` | Sí | formato uuid | `@IsUUID()` | Propietario de la cuenta | `src/modules/ads/dto/ads.dto.ts:126` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo",
  "externalAccountRef": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "fundingPaymentMethodId": "00000000-0000-4000-8000-000000000001",
  "ownerUserId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<AdAccountResponseDto>` · DTO `AdAccountResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/ads/dto/ads.dto.ts:137` |
| `businessManagerId` | `string` | Sí | formato uuid | — | Identificador asociado a business manager. | `src/modules/ads/dto/ads.dto.ts:143` |
| `externalAccountRef` | `string` | Sí | — | — | Valor de external account ref mantenido por la instancia. | `src/modules/ads/dto/ads.dto.ts:149` |
| `accountStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a account status concept. | `src/modules/ads/dto/ads.dto.ts:155` |
| `ownerRoleId` | `string` | Sí | formato uuid | — | Rol de administrador creado para el propietario | `src/modules/ads/dto/ads.dto.ts:164` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Business manager no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe una cuenta con esa referencia externa; ConflictException: Ya existe un business manager con esa referencia |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sin business manager hay que aportar nombre y referencia externa para crearlo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:68` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-01`

---

## 10. POST /ads/business-managers/{bmId}/partners

- **Origen:** CONTRATO
- **Nombre:** Vincular un socio y compartir el alcance de assets
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.linkPartner` — `src/modules/ads/controllers/ads.controller.ts:104`

### Qué es y para qué sirve (negocio)

Vincular un socio y compartir el alcance de assets. Caso de uso UC-43-02: Vincular socio y compartir assets. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/business-managers/{bmId}/partners` la atiende `AdsController.linkPartner` (src/modules/ads/controllers/ads.controller.ts:104). Exige sesión con alguno de los roles ADS_ADMIN, BUSINESS_ADMIN. Valida el cuerpo como `LinkPartnerDto` (7 campos, 4 obligatorios). Delega en `AdsAccountsService.linkPartner`. Crea filas en ads.ad_account_users, ads.ad_partners, ads.partner_relationships. Actualiza ads.partner_relationships. Lee ads.ad_accounts, ads.ad_partners, ads.business_managers, ads.partner_relationships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ADS_ADMIN, BUSINESS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: bmId | `src/modules/ads/controllers/ads.controller.ts:104` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_account_users` | ESCRIBE | CREA | DIRECTA | AdsController.linkPartner → AdsAccountsService.linkPartner → AdsAccountsRepository.createAccountUser | `src/modules/ads/repositories/ads-accounts.repository.ts:404` |
| `ads.ad_accounts` | LEE | LEE | DIRECTA | AdsController.linkPartner → AdsAccountsService.linkPartner → AdsAccountsRepository.findAdAccountById | `src/modules/ads/repositories/ads-accounts.repository.ts:364` |
| `ads.ad_partners` | ESCRIBE | CREA | DIRECTA | AdsController.linkPartner → AdsAccountsService.linkPartner → AdsAccountsRepository.createPartner | `src/modules/ads/repositories/ads-accounts.repository.ts:461` |
| `ads.ad_partners` | LEE | LEE | DIRECTA | AdsController.linkPartner → AdsAccountsService.linkPartner → AdsAccountsRepository.findPartnerByRef | `src/modules/ads/repositories/ads-accounts.repository.ts:487` |
| `ads.business_managers` | LEE | LEE | DIRECTA | AdsController.linkPartner → AdsAccountsService.linkPartner → AdsAccountsRepository.findBusinessManagerById | `src/modules/ads/repositories/ads-accounts.repository.ts:312` |
| `ads.partner_relationships` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.linkPartner → AdsAccountsService.linkPartner | `src/modules/ads/services/ads-accounts.service.ts:245` |
| `ads.partner_relationships` | ESCRIBE | CREA | DIRECTA | AdsController.linkPartner → AdsAccountsService.linkPartner → AdsAccountsRepository.createPartnerRelationship | `src/modules/ads/repositories/ads-accounts.repository.ts:512` |
| `ads.partner_relationships` | LEE | LEE | DIRECTA | AdsController.linkPartner → AdsAccountsService.linkPartner → AdsAccountsRepository.findActiveRelationshipForUpdate | `src/modules/ads/repositories/ads-accounts.repository.ts:539` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `bmId` | path | Sí | `string` | — |

### Cuerpo — DTO `LinkPartnerDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `partnerName` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:185` |
| `externalPartnerRef` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Referencia del socio en la plataforma | `src/modules/ads/dto/ads.dto.ts:196` |
| `partnerType` | `string` | Sí | valores: AGENCY, VENDOR | `@IsIn(['AGENCY', 'VENDOR'])` | — | `src/modules/ads/dto/ads.dto.ts:203` |
| `relationshipType` | `string` | Sí | valores: MANAGE, SHARE | `@IsIn(['MANAGE', 'SHARE'])` | — | `src/modules/ads/dto/ads.dto.ts:210` |
| `permissionsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Permisos concedidos | `src/modules/ads/dto/ads.dto.ts:218` |
| `sharedAssetScopeJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Alcance de los assets compartidos | `src/modules/ads/dto/ads.dto.ts:226` |
| `delegatedAdAccountId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cuenta a la que dar acceso delegado al socio | `src/modules/ads/dto/ads.dto.ts:237` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "partnerName": "Nombre de ejemplo",
  "externalPartnerRef": "valor-ejemplo",
  "partnerType": "AGENCY",
  "relationshipType": "MANAGE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<PartnerLinkResponseDto>` · DTO `PartnerLinkResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `partnerId` | `string` | Sí | formato uuid | — | Identificador asociado a partner. | `src/modules/ads/dto/ads.dto.ts:248` |
| `relationshipId` | `string` | Sí | formato uuid | — | Identificador asociado a relationship. | `src/modules/ads/dto/ads.dto.ts:254` |
| `delegatedAccessId` | `string` | No | formato uuid | — | Acceso delegado creado, si se pidió | `src/modules/ads/dto/ads.dto.ts:263` |
| `partnerExisted` | `boolean` | Sí | — | — | true si el socio ya existía y se reutilizó | `src/modules/ads/dto/ads.dto.ts:269` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Business manager no encontrado; ResourceNotFoundException: Cuenta publicitaria no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El socio no está activo; PreconditionFailedException: La cuenta no pertenece a este business manager |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:82` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-02`

---

## 11. POST /ads/catalogs/{id}/feeds/{feedId}/run

- **Origen:** CONTRATO
- **Nombre:** Sincronizar el catálogo de productos con el feed
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.runFeed` — `src/modules/ads/controllers/ads.controller.ts:377`

### Qué es y para qué sirve (negocio)

Sincronizar el catálogo de productos con el feed. Caso de uso UC-43-13: Sincronizar catálogo. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:61`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/catalogs/{id}/feeds/{feedId}/run` la atiende `AdsController.runFeed` (src/modules/ads/controllers/ads.controller.ts:377). Exige sesión con alguno de los roles SYSTEM, ADS_ADMIN. Valida el cuerpo como `RunFeedDto` (12 campos, 4 obligatorios). Delega en `AdsDataService.runFeed`. Crea filas en ads.catalog_products, ads.feed_run_logs, ads.product_set_members. Actualiza ads.catalog_feeds, ads.catalog_products, ads.product_catalogs, ads.product_sets. Lee ads.catalog_feeds, ads.catalog_products, ads.product_catalogs, ads.product_set_members, ads.product_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, ADS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:377` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, feedId | `src/modules/ads/controllers/ads.controller.ts:377` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.catalog_feeds` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.runFeed → AdsDataService.runFeed | `src/modules/ads/services/ads-data.service.ts:807` |
| `ads.catalog_feeds` | LEE | LEE | DIRECTA | AdsController.runFeed → AdsDataService.runFeed → AdsDataRepository.findFeedForUpdate | `src/modules/ads/repositories/ads-data.repository.ts:1184` |
| `ads.catalog_products` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.runFeed → AdsDataService.runFeed | `src/modules/ads/services/ads-data.service.ts:748` |
| `ads.catalog_products` | ESCRIBE | CREA | DIRECTA | AdsController.runFeed → AdsDataService.runFeed → AdsDataRepository.createProduct | `src/modules/ads/repositories/ads-data.repository.ts:1275` |
| `ads.catalog_products` | LEE | LEE | DIRECTA | AdsController.runFeed → AdsDataService.runFeed → AdsDataRepository.findProductByRetailerId | `src/modules/ads/repositories/ads-data.repository.ts:1204` |
| `ads.feed_run_logs` | ESCRIBE | CREA | DIRECTA | AdsController.runFeed → AdsDataService.runFeed → AdsDataRepository.createFeedRunLog | `src/modules/ads/repositories/ads-data.repository.ts:1429` |
| `ads.product_catalogs` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.runFeed → AdsDataService.runFeed | `src/modules/ads/services/ads-data.service.ts:804` |
| `ads.product_catalogs` | LEE | LEE | DIRECTA | AdsController.runFeed → AdsDataService.runFeed → AdsDataRepository.findCatalogForUpdate | `src/modules/ads/repositories/ads-data.repository.ts:1172` |
| `ads.product_set_members` | ESCRIBE | CREA | DIRECTA | AdsController.runFeed → AdsDataService.runFeed → AdsDataRepository.createSetMember | `src/modules/ads/repositories/ads-data.repository.ts:1362` |
| `ads.product_set_members` | LEE | LEE | DIRECTA | AdsController.runFeed → AdsDataService.runFeed → AdsDataRepository.findSetMember | `src/modules/ads/repositories/ads-data.repository.ts:1335` |
| `ads.product_sets` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.runFeed → AdsDataService.runFeed | `src/modules/ads/services/ads-data.service.ts:799` |
| `ads.product_sets` | LEE | LEE | DIRECTA | AdsController.runFeed → AdsDataService.runFeed → AdsDataRepository.findDynamicSets | `src/modules/ads/repositories/ads-data.repository.ts:1319` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `feedId` | path | Sí | `string` | — |

### Cuerpo — DTO `RunFeedDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<FeedItemDto>` | Sí | — | `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => FeedItemDto)` | Ítems leídos del feed | `src/modules/ads/dto/ads.dto.ts:2327` |
| `items[].retailerProductId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Identificador del producto en el comercio | `src/modules/ads/dto/ads.dto.ts:2242` |
| `items[].title` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/ads/dto/ads.dto.ts:2250` |
| `items[].description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/ads/dto/ads.dto.ts:2258` |
| `items[].availability` | `string` | Sí | valores: IN_STOCK, OUT_OF_STOCK | `@IsIn(['IN_STOCK', 'OUT_OF_STOCK'])` | — | `src/modules/ads/dto/ads.dto.ts:2265` |
| `items[].condition` | `string` | No | valores: NEW, REFURBISHED | `@IsOptional()` `@IsIn(['NEW', 'REFURBISHED'])` | — | `src/modules/ads/dto/ads.dto.ts:2273` |
| `items[].price` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/ads/dto/ads.dto.ts:2281` |
| `items[].brand` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:2290` |
| `items[].imageUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/ads/dto/ads.dto.ts:2298` |
| `items[].linkUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/ads/dto/ads.dto.ts:2306` |
| `items[].inventoryCount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/ads/dto/ads.dto.ts:2315` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:2335` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<FeedRunResponseDto>` · DTO `FeedRunResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `feedRunLogId` | `string` | Sí | formato uuid | — | Identificador asociado a feed run log. | `src/modules/ads/dto/ads.dto.ts:2346` |
| `itemsRead` | `number` | Sí | — | — | Valor de items read mantenido por la instancia. | `src/modules/ads/dto/ads.dto.ts:2352` |
| `itemsCreated` | `number` | Sí | — | — | Productos creados | `src/modules/ads/dto/ads.dto.ts:2358` |
| `itemsUpdated` | `number` | Sí | — | — | Productos actualizados | `src/modules/ads/dto/ads.dto.ts:2364` |
| `setMembershipsAdded` | `number` | Sí | — | — | Miembros añadidos a conjuntos dinámicos | `src/modules/ads/dto/ads.dto.ts:2370` |
| `catalogItemCount` | `number` | Sí | — | — | Total de productos del catálogo tras la corrida | `src/modules/ads/dto/ads.dto.ts:2378` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Catálogo no encontrado; ResourceNotFoundException: Feed no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El feed pertenece a otro catálogo; PreconditionFailedException: El feed no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:233` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-13`

---

## 12. POST /ads/datasets/{id}/events

- **Origen:** CONTRATO
- **Nombre:** Enviar una conversión server-side
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.sendConversion` — `src/modules/ads/controllers/ads.controller.ts:253`

### Qué es y para qué sirve (negocio)

Enviar una conversión server-side. Caso de uso UC-43-08: Conversión server-side con dedup. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/datasets/{id}/events` la atiende `AdsController.sendConversion` (src/modules/ads/controllers/ads.controller.ts:253). Exige sesión con alguno de los roles SYSTEM, ADS_ADMIN. Valida el cuerpo como `SendConversionDto` (21 campos, 5 obligatorios). Delega en `AdsDataService.sendConversion`. Crea filas en ads.blocked_ad_events, ads.conversion_event_custom_data, ads.conversion_event_deduplication, ads.conversion_event_delivery_attempts, ads.conversion_event_user_data, ads.server_conversion_events. Actualiza ads.conversion_event_deduplication. Lee ads.ad_event_data_policies, ads.ad_event_field_rules, ads.conversion_datasets, ads.conversion_event_deduplication.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, ADS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:253` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/ads/controllers/ads.controller.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_event_data_policies` | LEE | LEE | DIRECTA | AdsController.sendConversion → AdsDataService.sendConversion → AdsDataRepository.findActiveEventPolicy | `src/modules/ads/repositories/ads-data.repository.ts:291` |
| `ads.ad_event_field_rules` | LEE | LEE | DIRECTA | AdsController.sendConversion → AdsDataService.sendConversion → AdsDataRepository.findFieldRules | `src/modules/ads/repositories/ads-data.repository.ts:337` |
| `ads.blocked_ad_events` | ESCRIBE | CREA | DIRECTA | AdsController.sendConversion → AdsDataService.sendConversion → AdsDataRepository.createBlockedEvent | `src/modules/ads/repositories/ads-data.repository.ts:932` |
| `ads.conversion_datasets` | LEE | LEE | DIRECTA | AdsController.sendConversion → AdsDataService.sendConversion → AdsDataRepository.findDatasetById | `src/modules/ads/repositories/ads-data.repository.ts:685` |
| `ads.conversion_event_custom_data` | ESCRIBE | CREA | DIRECTA | AdsController.sendConversion → AdsDataService.sendConversion → AdsDataRepository.createEventCustomData | `src/modules/ads/repositories/ads-data.repository.ts:875` |
| `ads.conversion_event_deduplication` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.sendConversion → AdsDataService.sendConversion | `src/modules/ads/services/ads-data.service.ts:423` |
| `ads.conversion_event_deduplication` | ESCRIBE | CREA | DIRECTA | AdsController.sendConversion → AdsDataService.sendConversion → AdsDataRepository.createDedup | `src/modules/ads/repositories/ads-data.repository.ts:737` |
| `ads.conversion_event_deduplication` | LEE | LEE | DIRECTA | AdsController.sendConversion → AdsDataService.sendConversion → AdsDataRepository.findDedupForUpdate | `src/modules/ads/repositories/ads-data.repository.ts:698` |
| `ads.conversion_event_delivery_attempts` | ESCRIBE | CREA | DIRECTA | AdsController.sendConversion → AdsDataService.sendConversion → AdsDataRepository.createDeliveryAttempt | `src/modules/ads/repositories/ads-data.repository.ts:985` |
| `ads.conversion_event_user_data` | ESCRIBE | CREA | DIRECTA | AdsController.sendConversion → AdsDataService.sendConversion → AdsDataRepository.createEventUserData | `src/modules/ads/repositories/ads-data.repository.ts:816` |
| `ads.server_conversion_events` | ESCRIBE | CREA | DIRECTA | AdsController.sendConversion → AdsDataService.sendConversion → AdsDataRepository.createServerEvent | `src/modules/ads/repositories/ads-data.repository.ts:765` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SendConversionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:1536` |
| `eventName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Nombre del evento | `src/modules/ads/dto/ads.dto.ts:1544` |
| `eventId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Identificador del evento; con él se deduplica navegador contra servidor | `src/modules/ads/dto/ads.dto.ts:1556` |
| `eventTime` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/ads/dto/ads.dto.ts:1563` |
| `actionSource` | `string` | Sí | valores: WEBSITE, APP, SERVER, OFFLINE | `@IsIn(ACTION_SOURCES)` | — | `src/modules/ads/dto/ads.dto.ts:1570` |
| `eventSourceUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/ads/dto/ads.dto.ts:1578` |
| `consentDirectiveId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Directiva de consentimiento aplicable | `src/modules/ads/dto/ads.dto.ts:1589` |
| `paymentTransactionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:1597` |
| `userData` | `ConversionUserDataDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => ConversionUserDataDto)` | — | `src/modules/ads/dto/ads.dto.ts:1606` |
| `userData.externalUserIdHash` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Identificador de usuario ya hasheado (SHA-256) | `src/modules/ads/dto/ads.dto.ts:1438` |
| `userData.clickId` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Identificador del click de la plataforma | `src/modules/ads/dto/ads.dto.ts:1449` |
| `userData.browserId` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Identificador del navegador | `src/modules/ads/dto/ads.dto.ts:1458` |
| `userData.clientIpAddress` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | IP del cliente; se persiste cifrada | `src/modules/ads/dto/ads.dto.ts:1467` |
| `userData.clientUserAgent` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | User-agent del cliente; se persiste cifrado | `src/modules/ads/dto/ads.dto.ts:1478` |
| `customData` | `ConversionCustomDataDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => ConversionCustomDataDto)` | — | `src/modules/ads/dto/ads.dto.ts:1615` |
| `customData.currencyCode` | `string` | No | longitud máxima 3 | `@IsOptional()` `@IsString()` `@MaxLength(3)` | — | `src/modules/ads/dto/ads.dto.ts:1492` |
| `customData.valueAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/ads/dto/ads.dto.ts:1500` |
| `customData.contentIdsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Productos implicados | `src/modules/ads/dto/ads.dto.ts:1508` |
| `customData.numItems` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | — | `src/modules/ads/dto/ads.dto.ts:1517` |
| `customData.orderId` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:1526` |
| `platformConnectionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Conexión a la que encolar la entrega del evento | `src/modules/ads/dto/ads.dto.ts:1626` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "eventName": "Nombre de ejemplo",
  "eventId": "00000000-0000-4000-8000-000000000001",
  "eventTime": "2026-07-31T12:00:00.000Z",
  "actionSource": "WEBSITE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<SendConversionResponseDto>` · DTO `SendConversionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `eventId` | `string` | No | formato uuid | — | Ausente si el evento era duplicado | `src/modules/ads/dto/ads.dto.ts:1640` |
| `processingStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a processing status concept. | `src/modules/ads/dto/ads.dto.ts:1646` |
| `duplicate` | `boolean` | Sí | — | — | true si el evento ya se había recibido | `src/modules/ads/dto/ads.dto.ts:1652` |
| `blocked` | `boolean` | Sí | — | — | true si la política de datos bloqueó el evento | `src/modules/ads/dto/ads.dto.ts:1660` |
| `transformedFields` | `array<string>` | Sí | — | — | Campos que la política obligó a hashear o quitar | `src/modules/ads/dto/ads.dto.ts:1669` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Dataset de conversión no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El dataset de conversión no está activo; PreconditionFailedException: La política exige consentimiento y el evento no lo aporta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:160` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-08`

---

## 13. POST /ads/event-data-policies

- **Origen:** CONTRATO
- **Nombre:** Publicar la política de datos de evento con sus reglas de campo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.createEventPolicy` — `src/modules/ads/controllers/ads.controller.ts:212`

### Qué es y para qué sirve (negocio)

Publicar la política de datos de evento con sus reglas de campo. Caso de uso UC-43-06: Política de datos y reglas de campo. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/event-data-policies` la atiende `AdsController.createEventPolicy` (src/modules/ads/controllers/ads.controller.ts:212). Exige sesión con alguno de los roles DATA_PRIVACY_OFFICER, ADS_ADMIN. Valida el cuerpo como `CreateEventPolicyDto` (14 campos, 10 obligatorios). Delega en `AdsDataService.createEventPolicy`. Crea filas en ads.ad_event_data_policies, ads.ad_event_field_rules. Lee ads.ad_event_data_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_PRIVACY_OFFICER, ADS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:212` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_event_data_policies` | ESCRIBE | CREA | DIRECTA | AdsController.createEventPolicy → AdsDataService.createEventPolicy → AdsDataRepository.createEventPolicy | `src/modules/ads/repositories/ads-data.repository.ts:237` |
| `ads.ad_event_data_policies` | LEE | LEE | DIRECTA | AdsController.createEventPolicy → AdsDataService.createEventPolicy → AdsDataRepository.findEventPolicyByCode | `src/modules/ads/repositories/ads-data.repository.ts:282` |
| `ads.ad_event_field_rules` | ESCRIBE | CREA | DIRECTA | AdsController.createEventPolicy → AdsDataService.createEventPolicy → AdsDataRepository.createFieldRule | `src/modules/ads/repositories/ads-data.repository.ts:308` |

### Cuerpo — DTO `CreateEventPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:1114` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código de la política, único por tenant | `src/modules/ads/dto/ads.dto.ts:1125` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:1133` |
| `jurisdiction` | `string` | Sí | valores: BO, EU, US | `@IsIn(['BO', 'EU', 'US'])` | — | `src/modules/ads/dto/ads.dto.ts:1140` |
| `purposeOfUse` | `string` | Sí | valores: MARKETING, ANALYTICS | `@IsIn(['MARKETING', 'ANALYTICS'])` | — | `src/modules/ads/dto/ads.dto.ts:1147` |
| `requiresConsent` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/ads/dto/ads.dto.ts:1155` |
| `defaultAction` | `string` | Sí | valores: ALLOW, BLOCK | `@IsIn(['ALLOW', 'BLOCK'])` | Qué hacer con un campo que ninguna regla contempla | `src/modules/ads/dto/ads.dto.ts:1165` |
| `prohibitedDataClassesJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Clases de dato prohibidas (p. ej. datos de salud) | `src/modules/ads/dto/ads.dto.ts:1175` |
| `fieldRules` | `array<FieldRuleDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => FieldRuleDto)` | Reglas de campo, al menos una | `src/modules/ads/dto/ads.dto.ts:1188` |
| `fieldRules[].eventNamePattern` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Patrón del nombre del evento | `src/modules/ads/dto/ads.dto.ts:1070` |
| `fieldRules[].fieldPath` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Ruta del campo dentro del evento | `src/modules/ads/dto/ads.dto.ts:1081` |
| `fieldRules[].action` | `string` | Sí | valores: ALLOW, BLOCK, HASH, DROP | `@IsIn(FIELD_ACTIONS)` | — | `src/modules/ads/dto/ads.dto.ts:1088` |
| `fieldRules[].transformation` | `string` | No | valores: SHA256, TRUNCATE | `@IsOptional()` `@IsIn(['SHA256', 'TRUNCATE'])` | — | `src/modules/ads/dto/ads.dto.ts:1096` |
| `fieldRules[].rationale` | `string` | No | — | `@IsOptional()` `@IsString()` | Por qué existe la regla | `src/modules/ads/dto/ads.dto.ts:1104` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<EventPolicyResponseDto>` · DTO `EventPolicyResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/ads/dto/ads.dto.ts:1199` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/ads/dto/ads.dto.ts:1205` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/ads/dto/ads.dto.ts:1211` |
| `fieldRuleIds` | `array<string>` | Sí | formato uuid | — | Valor de field rule ids mantenido por la instancia. | `src/modules/ads/dto/ads.dto.ts:1217` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una política con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una regla HASH necesita transformación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:140` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-06`

---

## 14. POST /ads/ingest/insights

- **Origen:** CONTRATO
- **Nombre:** Ingerir entrega e insights y consolidar el gasto
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.ingestInsights` — `src/modules/ads/controllers/ads.controller.ts:233`

### Qué es y para qué sirve (negocio)

Ingerir entrega e insights y consolidar el gasto. Caso de uso UC-43-07: Ingerir entrega y consolidar gasto. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/ingest/insights` la atiende `AdsController.ingestInsights` (src/modules/ads/controllers/ads.controller.ts:233). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `IngestInsightsDto` (17 campos, 10 obligatorios). Delega en `AdsDataService.ingestInsights`. Crea filas en ads.ad_billing_events, ads.delivery_status_snapshots, ads.insight_fact_rows, ads.insight_query_runs, ads.insights_daily. Actualiza ads.ad_accounts, ads.insight_query_runs, ads.insights_daily. Lee ads.ad_accounts, ads.ad_platform_connections, ads.insights_daily.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/ads/controllers/ads.controller.ts:233` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_accounts` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.ingestInsights → AdsDataService.ingestInsights | `src/modules/ads/services/ads-data.service.ts:348` |
| `ads.ad_accounts` | LEE | LEE | DIRECTA | AdsController.ingestInsights → AdsDataService.ingestInsights → AdsAccountsRepository.findAdAccountForUpdate | `src/modules/ads/repositories/ads-accounts.repository.ts:372` |
| `ads.ad_billing_events` | ESCRIBE | CREA | DIRECTA | AdsController.ingestInsights → AdsDataService.ingestInsights → AdsDataRepository.createBillingEvent | `src/modules/ads/repositories/ads-data.repository.ts:626` |
| `ads.ad_platform_connections` | LEE | LEE | DIRECTA | AdsController.ingestInsights → AdsDataService.ingestInsights → AdsAccountsRepository.findConnectionById | `src/modules/ads/repositories/ads-accounts.repository.ts:594` |
| `ads.delivery_status_snapshots` | ESCRIBE | CREA | DIRECTA | AdsController.ingestInsights → AdsDataService.ingestInsights → AdsDataRepository.createDeliverySnapshot | `src/modules/ads/repositories/ads-data.repository.ts:565` |
| `ads.insight_fact_rows` | ESCRIBE | CREA | DIRECTA | AdsController.ingestInsights → AdsDataService.ingestInsights → AdsDataRepository.createFactRow | `src/modules/ads/repositories/ads-data.repository.ts:460` |
| `ads.insight_query_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.ingestInsights → AdsDataService.ingestInsights | `src/modules/ads/services/ads-data.service.ts:351` |
| `ads.insight_query_runs` | ESCRIBE | CREA | DIRECTA | AdsController.ingestInsights → AdsDataService.ingestInsights → AdsDataRepository.createInsightRun | `src/modules/ads/repositories/ads-data.repository.ts:393` |
| `ads.insights_daily` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.ingestInsights → AdsDataService.ingestInsights | `src/modules/ads/services/ads-data.service.ts:298` |
| `ads.insights_daily` | ESCRIBE | CREA | DIRECTA | AdsController.ingestInsights → AdsDataService.ingestInsights → AdsDataRepository.createInsightsDaily | `src/modules/ads/repositories/ads-data.repository.ts:505` |
| `ads.insights_daily` | LEE | LEE | DIRECTA | AdsController.ingestInsights → AdsDataService.ingestInsights → AdsDataRepository.findInsightsDaily | `src/modules/ads/repositories/ads-data.repository.ts:486` |

### Cuerpo — DTO `IngestInsightsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:1311` |
| `adAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:1318` |
| `platformConnectionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:1325` |
| `dateStart` | `string` | Sí | formato date | `@IsISO8601()` | — | `src/modules/ads/dto/ads.dto.ts:1332` |
| `dateEnd` | `string` | Sí | formato date | `@IsISO8601()` | — | `src/modules/ads/dto/ads.dto.ts:1339` |
| `rows` | `array<InsightRowDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => InsightRowDto)` | Filas de métricas del lote | `src/modules/ads/dto/ads.dto.ts:1352` |
| `rows[].entityType` | `string` | Sí | valores: ACCOUNT, CAMPAIGN, AD_SET, AD | `@IsIn(AD_ENTITY_TYPES)` | — | `src/modules/ads/dto/ads.dto.ts:1233` |
| `rows[].entityRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Entidad local a la que corresponde la fila | `src/modules/ads/dto/ads.dto.ts:1243` |
| `rows[].externalObjectId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Identificador del objeto en la plataforma | `src/modules/ads/dto/ads.dto.ts:1254` |
| `rows[].statDate` | `string` | Sí | formato date | `@IsISO8601()` | Día de la métrica | `src/modules/ads/dto/ads.dto.ts:1261` |
| `rows[].impressions` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/ads/dto/ads.dto.ts:1269` |
| `rows[].clicks` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/ads/dto/ads.dto.ts:1277` |
| `rows[].spend` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/ads/dto/ads.dto.ts:1285` |
| `rows[].conversions` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/ads/dto/ads.dto.ts:1293` |
| `rows[].conversionValue` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/ads/dto/ads.dto.ts:1301` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Moneda de los importes | `src/modules/ads/dto/ads.dto.ts:1363` |
| `recordBillingEvent` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Registrar el gasto también como evento de facturación | `src/modules/ads/dto/ads.dto.ts:1373` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<IngestInsightsResponseDto>` · DTO `IngestInsightsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insightQueryRunId` | `string` | Sí | formato uuid | — | Identificador asociado a insight query run. | `src/modules/ads/dto/ads.dto.ts:1384` |
| `factRows` | `number` | Sí | — | — | Filas de hecho insertadas | `src/modules/ads/dto/ads.dto.ts:1390` |
| `rollupsCreated` | `number` | Sí | — | — | Rollups diarios creados | `src/modules/ads/dto/ads.dto.ts:1396` |
| `rollupsUpdated` | `number` | Sí | — | — | Rollups diarios reescritos | `src/modules/ads/dto/ads.dto.ts:1402` |
| `amountSpent` | `string` | Sí | — | — | Gasto acumulado de la cuenta tras el lote | `src/modules/ads/dto/ads.dto.ts:1408` |
| `spendCapReached` | `boolean` | Sí | — | — | true si el gasto alcanzó el tope de la cuenta | `src/modules/ads/dto/ads.dto.ts:1414` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conexión de plataforma no encontrada; ResourceNotFoundException: Cuenta publicitaria no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La conexión de plataforma no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:150` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-07`

---

## 15. POST /ads/lead-forms/{id}/submissions

- **Origen:** CONTRATO
- **Nombre:** Recibir un lead del formulario y encolar su entrega al CRM
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.submitLead` — `src/modules/ads/controllers/ads.controller.ts:422`

### Qué es y para qué sirve (negocio)

Recibir un lead del formulario y encolar su entrega al CRM. Caso de uso UC-43-15: Recibir lead y entregar a CRM. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:63`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/lead-forms/{id}/submissions` la atiende `AdsController.submitLead` (src/modules/ads/controllers/ads.controller.ts:422). Exige sesión con alguno de los roles SYSTEM, AD_OPS, ADS_ADMIN. Valida el cuerpo como `SubmitLeadDto` (11 campos, 4 obligatorios). Delega en `AdsOptimizationService.submitLead`. Crea filas en ads.lead_answers, ads.lead_delivery_events, ads.lead_submissions. Lee ads.lead_delivery_events, ads.lead_form_questions, ads.lead_forms, ads.lead_submissions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, AD_OPS, ADS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:422` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/ads/controllers/ads.controller.ts:422` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.lead_answers` | ESCRIBE | CREA | DIRECTA | AdsController.submitLead → AdsOptimizationService.submitLead → AdsOptimizationRepository.createAnswer | `src/modules/ads/repositories/ads-optimization.repository.ts:774` |
| `ads.lead_delivery_events` | ESCRIBE | CREA | DIRECTA | AdsController.submitLead → AdsOptimizationService.submitLead → AdsOptimizationRepository.createDeliveryEvent | `src/modules/ads/repositories/ads-optimization.repository.ts:827` |
| `ads.lead_delivery_events` | LEE | LEE | DIRECTA | AdsController.submitLead → AdsOptimizationService.submitLead → AdsOptimizationRepository.countDeliveryAttempts | `src/modules/ads/repositories/ads-optimization.repository.ts:855` |
| `ads.lead_form_questions` | LEE | LEE | DIRECTA | AdsController.submitLead → AdsOptimizationService.submitLead → AdsOptimizationRepository.findQuestionsByForm | `src/modules/ads/repositories/ads-optimization.repository.ts:705` |
| `ads.lead_forms` | LEE | LEE | DIRECTA | AdsController.submitLead → AdsOptimizationService.submitLead → AdsOptimizationRepository.findLeadFormById | `src/modules/ads/repositories/ads-optimization.repository.ts:691` |
| `ads.lead_submissions` | ESCRIBE | CREA | DIRECTA | AdsController.submitLead → AdsOptimizationService.submitLead → AdsOptimizationRepository.createSubmission | `src/modules/ads/repositories/ads-optimization.repository.ts:723` |
| `ads.lead_submissions` | LEE | LEE | DIRECTA | AdsController.submitLead → AdsOptimizationService.submitLead → AdsOptimizationRepository.findSubmissionByExternalId | `src/modules/ads/repositories/ads-optimization.repository.ts:749` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SubmitLeadDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:2511` |
| `externalLeadId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Identificador del lead en la plataforma; hace idempotente el webhook | `src/modules/ads/dto/ads.dto.ts:2523` |
| `adId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:2531` |
| `adSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:2539` |
| `campaignId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:2547` |
| `consentDirectiveId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Consentimiento capturado con el lead | `src/modules/ads/dto/ads.dto.ts:2558` |
| `rawPayloadHash` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Hash del payload recibido | `src/modules/ads/dto/ads.dto.ts:2567` |
| `sourceIp` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | IP de origen; se guarda hasheada | `src/modules/ads/dto/ads.dto.ts:2576` |
| `answers` | `array<LeadAnswerDto>` | Sí | — | `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => LeadAnswerDto)` | — | `src/modules/ads/dto/ads.dto.ts:2585` |
| `answers[].questionKey` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Clave de la pregunta del formulario | `src/modules/ads/dto/ads.dto.ts:2493` |
| `answers[].answer` | `string` | No | — | `@IsOptional()` `@IsString()` | Respuesta; se persiste cifrada | `src/modules/ads/dto/ads.dto.ts:2501` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<LeadSubmissionResponseDto>` · DTO `LeadSubmissionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/ads/dto/ads.dto.ts:2596` |
| `processingStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a processing status concept. | `src/modules/ads/dto/ads.dto.ts:2602` |
| `answersStored` | `number` | Sí | — | — | Respuestas registradas | `src/modules/ads/dto/ads.dto.ts:2608` |
| `answersIgnored` | `number` | Sí | — | — | Respuestas descartadas por no corresponder a ninguna pregunta | `src/modules/ads/dto/ads.dto.ts:2617` |
| `duplicate` | `boolean` | Sí | — | — | true si el lead ya se había recibido | `src/modules/ads/dto/ads.dto.ts:2623` |
| `deliveryEventId` | `string` | No | formato uuid | — | Intento de entrega al CRM | `src/modules/ads/dto/ads.dto.ts:2632` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Formulario de leads no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El formulario no está activo; PreconditionFailedException: Faltan respuestas obligatorias del formulario |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:257` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-15`

---

## 16. POST /ads/offline-conversion-sets/upload

- **Origen:** CONTRATO
- **Nombre:** Subir conversiones offline con reporte de coincidencia
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.uploadOfflineConversions` — `src/modules/ads/controllers/ads.controller.ts:275`

### Qué es y para qué sirve (negocio)

Subir conversiones offline con reporte de coincidencia. Caso de uso UC-43-09: Conversiones offline con match. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/offline-conversion-sets/upload` la atiende `AdsController.uploadOfflineConversions` (src/modules/ads/controllers/ads.controller.ts:275). Exige sesión con alguno de los roles AD_OPS, ADS_ADMIN. Valida el cuerpo como `UploadOfflineConversionsDto` (12 campos, 6 obligatorios). Delega en `AdsDataService.uploadOfflineConversions`. Crea filas en ads.offline_conversion_events, ads.offline_conversion_sets. Actualiza ads.offline_conversion_sets. Lee ads.ad_accounts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AD_OPS, ADS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:275` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_accounts` | LEE | LEE | DIRECTA | AdsController.uploadOfflineConversions → AdsDataService.uploadOfflineConversions → AdsAccountsRepository.findAdAccountById | `src/modules/ads/repositories/ads-accounts.repository.ts:364` |
| `ads.offline_conversion_events` | ESCRIBE | CREA | DIRECTA | AdsController.uploadOfflineConversions → AdsDataService.uploadOfflineConversions → AdsDataRepository.createOfflineEvent | `src/modules/ads/repositories/ads-data.repository.ts:1126` |
| `ads.offline_conversion_sets` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.uploadOfflineConversions → AdsDataService.uploadOfflineConversions | `src/modules/ads/services/ads-data.service.ts:645` |
| `ads.offline_conversion_sets` | ESCRIBE | CREA | DIRECTA | AdsController.uploadOfflineConversions → AdsDataService.uploadOfflineConversions → AdsDataRepository.createOfflineSet | `src/modules/ads/repositories/ads-data.repository.ts:1039` |

### Cuerpo — DTO `UploadOfflineConversionsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `adAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:1742` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:1750` |
| `uploadSource` | `string` | Sí | valores: FILE, API | `@IsIn(['FILE', 'API'])` | — | `src/modules/ads/dto/ads.dto.ts:1757` |
| `fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo en `common.files` | `src/modules/ads/dto/ads.dto.ts:1768` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:1776` |
| `events` | `array<OfflineEventDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => OfflineEventDto)` | — | `src/modules/ads/dto/ads.dto.ts:1786` |
| `events[].eventName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/ads/dto/ads.dto.ts:1686` |
| `events[].eventTime` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/ads/dto/ads.dto.ts:1694` |
| `events[].matchKeysHashJson` | `object` | Sí | — | `@IsObject()` | Claves de coincidencia YA hasheadas; nunca datos en claro | `src/modules/ads/dto/ads.dto.ts:1703` |
| `events[].valueAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/ads/dto/ads.dto.ts:1711` |
| `events[].orderRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:1720` |
| `events[].attributedCampaignRefId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Campaña a la que se atribuye; su presencia marca el evento como emparejado | `src/modules/ads/dto/ads.dto.ts:1732` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<OfflineUploadResponseDto>` · DTO `OfflineUploadResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `offlineConversionSetId` | `string` | Sí | formato uuid | — | Identificador asociado a offline conversion set. | `src/modules/ads/dto/ads.dto.ts:1797` |
| `totalEvents` | `number` | Sí | — | — | Valor de total events mantenido por la instancia. | `src/modules/ads/dto/ads.dto.ts:1803` |
| `matchedEvents` | `number` | Sí | — | — | Valor de matched events mantenido por la instancia. | `src/modules/ads/dto/ads.dto.ts:1809` |
| `matchRate` | `string` | Sí | — | — | Proporción de eventos emparejados | `src/modules/ads/dto/ads.dto.ts:1815` |
| `attributedValue` | `string` | Sí | — | — | Valor atribuido a los eventos emparejados | `src/modules/ads/dto/ads.dto.ts:1821` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/ads/dto/ads.dto.ts:1827` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cuenta publicitaria no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:172` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-09`

---

## 17. POST /ads/platform-connections

- **Origen:** CONTRATO
- **Nombre:** Conectar la plataforma externa e importar identidades
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.connectPlatform` — `src/modules/ads/controllers/ads.controller.ts:126`

### Qué es y para qué sirve (negocio)

Conectar la plataforma externa e importar identidades. Caso de uso UC-43-03: Conectar plataforma e importar identidades. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/platform-connections` la atiende `AdsController.connectPlatform` (src/modules/ads/controllers/ads.controller.ts:126). Exige sesión con alguno de los roles ADS_ADMIN, BUSINESS_ADMIN. Valida el cuerpo como `ConnectPlatformDto` (16 campos, 6 obligatorios). Delega en `AdsAccountsService.connectPlatform`. Crea filas en ads.ad_identity_assets, ads.ad_platform_connections, ads.ad_sync_checkpoints, ads.ad_sync_runs. Actualiza ads.ad_identity_assets, ads.ad_platform_connections, ads.ad_sync_checkpoints. Lee ads.ad_identity_assets, ads.ad_platform_connections, ads.ad_sync_checkpoints, ads.business_managers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ADS_ADMIN, BUSINESS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:126` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_identity_assets` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.connectPlatform → AdsAccountsService.connectPlatform | `src/modules/ads/services/ads-accounts.service.ts:375` |
| `ads.ad_identity_assets` | ESCRIBE | CREA | DIRECTA | AdsController.connectPlatform → AdsAccountsService.connectPlatform → AdsAccountsRepository.createIdentityAsset | `src/modules/ads/repositories/ads-accounts.repository.ts:640` |
| `ads.ad_identity_assets` | LEE | LEE | DIRECTA | AdsController.connectPlatform → AdsAccountsService.connectPlatform → AdsAccountsRepository.findIdentityAsset | `src/modules/ads/repositories/ads-accounts.repository.ts:664` |
| `ads.ad_platform_connections` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.connectPlatform → AdsAccountsService.connectPlatform | `src/modules/ads/services/ads-accounts.service.ts:423` |
| `ads.ad_platform_connections` | ESCRIBE | CREA | DIRECTA | AdsController.connectPlatform → AdsAccountsService.connectPlatform → AdsAccountsRepository.createConnection | `src/modules/ads/repositories/ads-accounts.repository.ts:564` |
| `ads.ad_platform_connections` | LEE | LEE | DIRECTA | AdsController.connectPlatform → AdsAccountsService.connectPlatform → AdsAccountsRepository.findConnectionByExternalAccount | `src/modules/ads/repositories/ads-accounts.repository.ts:622` |
| `ads.ad_sync_checkpoints` | ESCRIBE | ACTUALIZA | POR_TIPO | AdsController.connectPlatform → AdsAccountsService.connectPlatform → AdsAccountsRepository.upsertCheckpoint | `src/modules/ads/repositories/ads-accounts.repository.ts:786` |
| `ads.ad_sync_checkpoints` | ESCRIBE | CREA | DIRECTA | AdsController.connectPlatform → AdsAccountsService.connectPlatform → AdsAccountsRepository.upsertCheckpoint | `src/modules/ads/repositories/ads-accounts.repository.ts:791` |
| `ads.ad_sync_checkpoints` | LEE | LEE | DIRECTA | AdsController.connectPlatform → AdsAccountsService.connectPlatform → AdsAccountsRepository.findCheckpoint | `src/modules/ads/repositories/ads-accounts.repository.ts:818` |
| `ads.ad_sync_runs` | ESCRIBE | CREA | DIRECTA | AdsController.connectPlatform → AdsAccountsService.connectPlatform → AdsAccountsRepository.createSyncRun | `src/modules/ads/repositories/ads-accounts.repository.ts:866` |
| `ads.business_managers` | LEE | LEE | DIRECTA | AdsController.connectPlatform → AdsAccountsService.connectPlatform → AdsAccountsRepository.findBusinessManagerById | `src/modules/ads/repositories/ads-accounts.repository.ts:312` |

### Cuerpo — DTO `ConnectPlatformDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:331` |
| `businessManagerId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:338` |
| `adAccountId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/ads/dto/ads.dto.ts:346` |
| `platform` | `string` | Sí | valores: META, GOOGLE, TIKTOK | `@IsIn(AD_PLATFORMS)` | — | `src/modules/ads/dto/ads.dto.ts:353` |
| `connectionName` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:361` |
| `credentialId` | `string` | Sí | formato uuid | `@IsUUID()` | Credencial guardada en el vault; el token nunca viaja en el cuerpo | `src/modules/ads/dto/ads.dto.ts:372` |
| `apiVersion` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | — | `src/modules/ads/dto/ads.dto.ts:381` |
| `externalBusinessId` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:390` |
| `externalAdAccountId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Cuenta publicitaria en la plataforma | `src/modules/ads/dto/ads.dto.ts:401` |
| `identities` | `array<IdentityAssetDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => IdentityAssetDto)` | Identidades a importar | `src/modules/ads/dto/ads.dto.ts:414` |
| `identities[].identityType` | `string` | No | valores: PAGE, INSTAGRAM | `@IsIn(['PAGE', 'INSTAGRAM'])` | — | `src/modules/ads/dto/ads.dto.ts:285` |
| `identities[].externalIdentityId` | `string` | No | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Identificador de la identidad en la plataforma | `src/modules/ads/dto/ads.dto.ts:296` |
| `identities[].displayName` | `string` | No | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/ads/dto/ads.dto.ts:304` |
| `identities[].username` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/ads/dto/ads.dto.ts:313` |
| `identities[].profileUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/ads/dto/ads.dto.ts:321` |
| `checkpointValue` | `string` | No | — | `@IsOptional()` `@IsString()` | Cursor de sincronización devuelto por la plataforma | `src/modules/ads/dto/ads.dto.ts:424` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "businessManagerId": "00000000-0000-4000-8000-000000000001",
  "platform": "META",
  "connectionName": "Nombre de ejemplo",
  "credentialId": "00000000-0000-4000-8000-000000000001",
  "externalAdAccountId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<PlatformConnectionResponseDto>` · DTO `PlatformConnectionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/ads/dto/ads.dto.ts:435` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/ads/dto/ads.dto.ts:441` |
| `identitiesImported` | `number` | Sí | — | — | Identidades importadas por primera vez | `src/modules/ads/dto/ads.dto.ts:447` |
| `identitiesUpdated` | `number` | Sí | — | — | Identidades que ya existían y se actualizaron | `src/modules/ads/dto/ads.dto.ts:453` |
| `syncRunId` | `string` | Sí | formato uuid | — | Registro de la sincronización | `src/modules/ads/dto/ads.dto.ts:459` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Business manager no encontrado |
| 409 | `CONFLICT` | ConflictException: Esa cuenta de la plataforma ya está conectada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:92` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-03`

---

## 18. POST /ads/policy-violations/{id}/appeals

- **Origen:** CONTRATO
- **Nombre:** Apelar una infracción de política
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdsController.submitAppeal` — `src/modules/ads/controllers/ads.controller.ts:359`

### Qué es y para qué sirve (negocio)

Apelar una infracción de política. Caso de uso UC-43-12: Moderación y apelación. Dentro del módulo (descripción del modelo, en inglés): «Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/ads/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_43_ads.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /ads/policy-violations/{id}/appeals` la atiende `AdsController.submitAppeal` (src/modules/ads/controllers/ads.controller.ts:359). Exige sesión con alguno de los roles POLICY_REVIEWER, AD_OPS, ADS_ADMIN. Valida el cuerpo como `SubmitAppealDto` (2 campos, 1 obligatorio). Delega en `AdsOptimizationService.submitAppeal`. Crea filas en ads.ad_policy_appeals. Lee ads.ad_policy_appeals, ads.ad_policy_violations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: POLICY_REVIEWER, AD_OPS, ADS_ADMIN | `src/modules/ads/controllers/ads.controller.ts:359` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/ads/controllers/ads.controller.ts:359` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `ads.ad_policy_appeals` | ESCRIBE | CREA | DIRECTA | AdsController.submitAppeal → AdsOptimizationService.submitAppeal → AdsOptimizationRepository.createAppeal | `src/modules/ads/repositories/ads-optimization.repository.ts:544` |
| `ads.ad_policy_appeals` | LEE | LEE | DIRECTA | AdsController.submitAppeal → AdsOptimizationService.submitAppeal → AdsOptimizationRepository.findAppealByViolation | `src/modules/ads/repositories/ads-optimization.repository.ts:570` |
| `ads.ad_policy_violations` | LEE | LEE | DIRECTA | AdsController.submitAppeal → AdsOptimizationService.submitAppeal → AdsOptimizationRepository.findViolationForUpdate | `src/modules/ads/repositories/ads-optimization.repository.ts:489` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SubmitAppealDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `appealReason` | `string` | Sí | — | `@IsString()` | Argumento de la apelación | `src/modules/ads/dto/ads.dto.ts:2188` |
| `evidenceFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Evidencia adjunta en `common.files` | `src/modules/ads/dto/ads.dto.ts:2199` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "appealReason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "appealReason": "Texto descriptivo de ejemplo",
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<AppealResponseDto>` · DTO `AppealResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/ads/dto/ads.dto.ts:2210` |
| `adPolicyViolationId` | `string` | Sí | formato uuid | — | Identificador asociado a ad policy violation. | `src/modules/ads/dto/ads.dto.ts:2216` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/ads/dto/ads.dto.ts:2222` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Infracción no encontrada |
| 409 | `CONFLICT` | ConflictException: La infracción ya tiene una apelación |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La infracción ya no está abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ads.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/ads/controllers/ads.controller.spec.ts:214` |

### Flujos

- Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización — etapa `UC-43-12`

---

