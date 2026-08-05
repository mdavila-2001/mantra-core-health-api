# DTO de publicidad

Contratos de entrada/salida con `class-validator` y anotaciones Swagger, en un único archivo
(`ads.dto.ts`) porque los 16 casos de uso comparten vocabulario (cuenta, plataforma, entidad,
importe).

## Convenciones

- **Importes y métricas como cadena decimal** (`@IsNumberString`): el modelo usa `numeric` y
  `bigint`, y pasarlos por `number` introduciría error de coma flotante en dinero y perdería
  precisión en impresiones.
- **Fechas** ISO-8601 (`@IsISO8601()`), convertidas a `Date` en el servicio.
- **Enums de dominio por código legible** (`META`, `CONVERSIONS`, `SINGLE_IMAGE`, `BLOCK`,
  `IN_STOCK`…); el servicio los traduce al `*_concept_id` del catálogo.
- **Jerarquía anidada** (`adSets` → `creative` → `assets`, `placements`) con
  `@ValidateNested({ each: true })` y `@Type`. `adSets`, `fieldRules` y `rows` llevan
  `@ArrayMinSize(1)`; `variants` lleva `@ArrayMinSize(2)`, porque un experimento con una sola rama
  no compara nada.
- **JSON de dominio** (`geoLocationsJson`, `reasonsJson`, `metricsJson`, `permissionsJson`) como
  `@IsObject()`: su forma la fija la plataforma, no esta capa.

## Lo que no se acepta

- **Tokens**: `ConnectPlatformDto` recibe `credentialId`, el identificador de la credencial en el
  vault. El token de acceso nunca viaja por la API.
- **Identificación en claro**: `ConversionUserDataDto` recibe `externalUserIdHash` ya hasheado, y
  `OfflineEventDto` recibe `matchKeysHashJson` con las claves ya hasheadas. La IP y el user-agent sí
  llegan en claro, pero se persisten cifrados — el DTO lo dice en su descripción.
- **Derivados**: `amountSpent`, `matchRate`, `attributedValue`, `itemCount`, `productCount`,
  `approximateCount`, `subtotal` y `total` se calculan y se devuelven; nunca se reciben.

## DTO por área

| Área | Entrada | Respuesta |
| --- | --- | --- |
| Cuentas | `ProvisionAdAccountDto`, `LinkPartnerDto`, `ConnectPlatformDto` (+ `IdentityAssetDto`) | `AdAccountResponseDto`, `PartnerLinkResponseDto`, `PlatformConnectionResponseDto` |
| Campaña | `LaunchCampaignDto` (+ `LaunchAdSetDto`, `LaunchCreativeDto`, `CreativeAssetDto`, `PlacementDto`) | `LaunchCampaignResponseDto` |
| Segmentación | `CreateTargetingDto` (+ `CreateCustomAudienceDto`), `AssignIdentityDto` | `TargetingResponseDto`, `AssignIdentityResponseDto` |
| Política | `CreateEventPolicyDto` (+ `FieldRuleDto`) | `EventPolicyResponseDto` |
| Ingesta | `IngestInsightsDto` (+ `InsightRowDto`) | `IngestInsightsResponseDto` |
| Conversiones | `SendConversionDto` (+ `ConversionUserDataDto`, `ConversionCustomDataDto`), `UploadOfflineConversionsDto` (+ `OfflineEventDto`) | `SendConversionResponseDto`, `OfflineUploadResponseDto` |
| Optimización | `CreateExperimentDto` (+ `ExperimentVariantDto`), `EvaluateRuleDto` | `ExperimentResponseDto`, `EvaluateRuleResponseDto` |
| Moderación | `RecordReviewEventDto`, `SubmitAppealDto` | `ReviewEventResponseDto`, `AppealResponseDto` |
| Catálogo | `RunFeedDto` (+ `FeedItemDto`) | `FeedRunResponseDto` |
| Facturación | `IssueAdInvoiceDto` | `AdInvoiceResponseDto` |
| Leads | `SubmitLeadDto` (+ `LeadAnswerDto`) | `LeadSubmissionResponseDto`, `BudgetScheduleResponseDto` |

## `EvaluateRuleDto` recibe las entidades ya filtradas

La condición de la regla (`condition_json`) la evalúa el planificador contra las métricas, que viven
en el almacén analítico. Este endpoint recibe **el resultado** de esa evaluación
(`matchedEntityIds`) y se limita a aplicar la acción. Separarlo evita meter la consulta analítica
dentro de la transacción que muta las entidades.

## Respuestas con `duplicate`

`SendConversionResponseDto`, `ReviewEventResponseDto` y `LeadSubmissionResponseDto` incluyen
`duplicate`. Es lo que un cliente que reintenta necesita para distinguir "se aplicó ahora" de "ya
estaba".

## Ejemplo de solicitud

```json
POST /ads/datasets/{id}/events
{
  "tenantId": "11111111-1111-1111-1111-111111111111",
  "eventName": "Purchase",
  "eventId": "evt-9f2c",
  "eventTime": "2026-07-01T10:00:00Z",
  "actionSource": "WEBSITE",
  "consentDirectiveId": "22222222-2222-2222-2222-222222222222",
  "userData": { "externalUserIdHash": "9b74c9…", "clickId": "fbclid_abc" },
  "customData": { "currencyCode": "BOB", "valueAmount": "350.00", "numItems": 1 }
}
```

## Ejemplo de respuesta

```json
{
  "eventId": "33333333-3333-3333-3333-333333333333",
  "processingStatusConceptId": "…",
  "duplicate": false,
  "blocked": false,
  "transformedFields": ["user_data.external_user_id"]
}
```

`transformedFields` enumera lo que la política obligó a hashear: quien envía puede comprobar que el
cortafuegos actuó sobre lo que esperaba.
