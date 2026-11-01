<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `marketing`

- **Bloque:** Marketing y Crecimiento (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)
- **Operaciones:** 31 (31 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 4 · MEDIO 12 · BAJO 15
- **Tablas distintas que tocan:** 24
- **Respuestas de error y detalle contractual:** `openapi/endpoints/marketing.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/marketing/attribution/compute` | Calcular la atribución multi-touch de una conversión | ALTO | 6 | SYSTEM, MARKETING_MANAGER |
| 2 | POST | `/marketing/campaigns` | Lanzar una campaña multicanal desde un segmento | MEDIO | 3 | MARKETING_MANAGER |
| 3 | POST | `/marketing/campaigns/{id}/members/materialize` | Materializar la audiencia de la campaña desde su segmento | MEDIO | 4 | MARKETING_MANAGER, SYSTEM |
| 4 | POST | `/marketing/content-templates/{code}/versions` | Publicar una versión de plantilla de contenido | MEDIO | 3 | CONTENT_EDITOR, MARKETING_MANAGER |
| 5 | POST | `/marketing/enrollments/{id}/advance` | Avanzar la inscripción al siguiente paso | MEDIO | 4 | SYSTEM, MARKETING_MANAGER |
| 6 | POST | `/marketing/enrollments/{id}/exit` | Cerrar la inscripción por meta, baja o rebote | MEDIO | 5 | SYSTEM, MARKETING_MANAGER |
| 7 | GET | `/marketing/insights/alert-rules` | Las siete reglas de alerta con su umbral y estado | BAJO | 4 | MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN |
| 8 | PATCH | `/marketing/insights/alert-rules/{code}` | Enciende, apaga o cambia el umbral (1 a 500) de una regla | BAJO | 2 | PLATFORM_ADMIN, DATA_PLATFORM_ADMIN |
| 9 | GET | `/marketing/insights/alert-workflow` | Estado, responsable e historial de las alertas que existen | BAJO | 5 | MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN |
| 10 | PUT | `/marketing/insights/alert-workflow/{fingerprint}` | Cambia estado y/o responsable de una alerta (la crea la primera vez) | BAJO | 2 | ...INSIGHTS_WRITE_ROLES |
| 11 | GET | `/marketing/insights/campaign-facts` | Hechos diarios por campaña y canal; lo que la fuente no reporta se declara en meta.notMeasured | BAJO | 3 | MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN |
| 12 | GET | `/marketing/insights/catalog` | Campañas (con sus canales y objetivos) e hitos de Insights | BAJO | 6 | MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN |
| 13 | GET | `/marketing/insights/notification-preferences` | Preferencias de aviso del usuario (rowVersion 0 si no guardó nada) | BAJO | 3 | MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN |
| 14 | PUT | `/marketing/insights/notification-preferences` | Guarda las preferencias de aviso del usuario (no se envía nada) | BAJO | 2 | ...INSIGHTS_WRITE_ROLES |
| 15 | GET | `/marketing/insights/reports` | Historial de informes del usuario (máximo 12, el más nuevo primero) | BAJO | 3 | MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN |
| 16 | DELETE | `/marketing/insights/reports/{id}` | Borra un informe del usuario (idempotente) | ALTO | 1 | ...INSIGHTS_WRITE_ROLES |
| 17 | PUT | `/marketing/insights/reports/{id}` | Guarda un informe en el historial (idempotente por id) | BAJO | 2 | ...INSIGHTS_WRITE_ROLES |
| 18 | GET | `/marketing/insights/saved-views` | Vistas guardadas del usuario | BAJO | 3 | MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN |
| 19 | DELETE | `/marketing/insights/saved-views/{id}` | Borra una vista del usuario (idempotente) | ALTO | 1 | ...INSIGHTS_WRITE_ROLES |
| 20 | PUT | `/marketing/insights/saved-views/{id}` | Guarda una vista con el id que manda el cliente (idempotente) | BAJO | 2 | ...INSIGHTS_WRITE_ROLES |
| 21 | GET | `/marketing/insights/user-preferences` | Preferencias de interfaz del usuario (rowVersion 0 si no guardó nada) | BAJO | 3 | MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN |
| 22 | PUT | `/marketing/insights/user-preferences` | Guarda las preferencias de interfaz del usuario | BAJO | 2 | ...INSIGHTS_WRITE_ROLES |
| 23 | POST | `/marketing/journeys` | Crear un journey en borrador | MEDIO | 3 | MARKETING_MANAGER |
| 24 | POST | `/marketing/journeys/{id}/activate` | Activar el journey e inscribir la cohorte inicial | MEDIO | 4 | MARKETING_MANAGER |
| 25 | POST | `/marketing/journeys/{id}/steps` | Añadir pasos al journey | MEDIO | 5 | MARKETING_MANAGER |
| 26 | POST | `/marketing/segments` | Crear un segmento y ligarlo a su read model | MEDIO | 2 | MARKETING_MANAGER |
| 27 | POST | `/marketing/segments/{id}/refresh` | Recomputar la membresía del segmento | MEDIO | 3 | MARKETING_MANAGER, SYSTEM |
| 28 | POST | `/marketing/touchpoints` | Registrar un touchpoint de marketing | MEDIO | 7 | SYSTEM, MARKETING_MANAGER |
| 29 | POST | `/marketing/tracked-links` | Crear un enlace rastreable con parámetros UTM | MEDIO | 3 | MARKETING_MANAGER |
| 30 | POST | `/marketing/tracked-links/{id}/recipient-tokens` | Emitir el token de destinatario de un enlace rastreable | BAJO | 3 | SYSTEM, MARKETING_MANAGER |
| 31 | GET | `/r/{code}` | Resolver un enlace rastreable y registrar el click | ALTO | 3 | pública |

---

## 1. POST /marketing/attribution/compute

- **Origen:** CONTRATO
- **Nombre:** Calcular la atribución multi-touch de una conversión
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MarketingController.computeAttribution` — `src/modules/marketing/controllers/marketing.controller.ts:324`

### Qué es y para qué sirve (negocio)

Calcular la atribución multi-touch de una conversión. Caso de uso UC-50-12: Atribución multi-touch. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:68`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /marketing/attribution/compute` la atiende `MarketingController.computeAttribution` (src/modules/marketing/controllers/marketing.controller.ts:324). Exige sesión con alguno de los roles SYSTEM, MARKETING_MANAGER. Valida el cuerpo como `ComputeAttributionDto` (9 campos, 7 obligatorios). Delega en `MarketingJourneysService.computeAttribution`. Crea filas en marketing.attribution_touches. Borra de marketing.attribution_touches. Lee marketing.attribution_touches, marketing.journeys, marketing.marketing_campaigns, marketing.marketing_touchpoints.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MARKETING_MANAGER | `src/modules/marketing/controllers/marketing.controller.ts:324` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.attribution_touches` | BORRA | BORRA | POR_TIPO | MarketingController.computeAttribution → MarketingJourneysService.computeAttribution → MarketingJourneysRepository.removeAttributionTouches | `src/modules/marketing/repositories/marketing-journeys.repository.ts:726` |
| `marketing.attribution_touches` | ESCRIBE | CREA | DIRECTA | MarketingController.computeAttribution → MarketingJourneysService.computeAttribution → MarketingJourneysRepository.createAttributionTouch | `src/modules/marketing/repositories/marketing-journeys.repository.ts:682` |
| `marketing.attribution_touches` | LEE | LEE | DIRECTA | MarketingController.computeAttribution → MarketingJourneysService.computeAttribution → MarketingJourneysRepository.findAttributionTouches | `src/modules/marketing/repositories/marketing-journeys.repository.ts:709` |
| `marketing.journeys` | LEE | LEE | DIRECTA | MarketingController.computeAttribution → MarketingJourneysService.computeAttribution → MarketingJourneysRepository.keepTouchpointsOfTenant | `src/modules/marketing/repositories/marketing-journeys.repository.ts:634` |
| `marketing.marketing_campaigns` | LEE | LEE | DIRECTA | MarketingController.computeAttribution → MarketingJourneysService.computeAttribution → MarketingJourneysRepository.keepTouchpointsOfTenant | `src/modules/marketing/repositories/marketing-journeys.repository.ts:618` |
| `marketing.marketing_touchpoints` | LEE | LEE | DIRECTA | MarketingController.computeAttribution → MarketingJourneysService.computeAttribution → MarketingJourneysRepository.findTouchpointsInWindow | `src/modules/marketing/repositories/marketing-journeys.repository.ts:660` |

### Cuerpo — DTO `ComputeAttributionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `conversionRefType` | `string` | Sí | valores: opportunity, enrollment, payment_intent, appointment_booking, order | `@IsIn(CONVERSION_REF_TYPES)` | — | `src/modules/marketing/dto/marketing.dto.ts:1199` |
| `conversionRefId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/marketing/dto/marketing.dto.ts:1206` |
| `memberType` | `string` | Sí | valores: CONTACT, PATIENT | `@IsIn(MEMBER_TYPES)` | — | `src/modules/marketing/dto/marketing.dto.ts:1213` |
| `memberRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Miembro cuyo recorrido se atribuye | `src/modules/marketing/dto/marketing.dto.ts:1223` |
| `model` | `string` | Sí | valores: LAST_TOUCH, FIRST_TOUCH, LINEAR | `@IsIn(['LAST_TOUCH', 'FIRST_TOUCH', 'LINEAR'])` | — | `src/modules/marketing/dto/marketing.dto.ts:1230` |
| `windowFrom` | `string` | Sí | formato date-time | `@IsISO8601()` | Inicio de la ventana de atribución | `src/modules/marketing/dto/marketing.dto.ts:1240` |
| `windowTo` | `string` | Sí | formato date-time | `@IsISO8601()` | Momento de la conversión | `src/modules/marketing/dto/marketing.dto.ts:1247` |
| `conversionValue` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Valor de la conversión a repartir, como cadena decimal | `src/modules/marketing/dto/marketing.dto.ts:1257` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/marketing/dto/marketing.dto.ts:1265` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "conversionRefType": "opportunity",
  "conversionRefId": "00000000-0000-4000-8000-000000000001",
  "memberType": "CONTACT",
  "memberRefId": "00000000-0000-4000-8000-000000000001",
  "model": "LAST_TOUCH",
  "windowFrom": "2026-07-31T12:00:00.000Z",
  "windowTo": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "conversionRefType": "opportunity",
  "conversionRefId": "00000000-0000-4000-8000-000000000001",
  "memberType": "CONTACT",
  "memberRefId": "00000000-0000-4000-8000-000000000001",
  "model": "LAST_TOUCH",
  "windowFrom": "2026-07-31T12:00:00.000Z",
  "windowTo": "2026-07-31T12:00:00.000Z",
  "conversionValue": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ComputeAttributionResponseDto>` · DTO `ComputeAttributionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `conversionRefType` | `string` | Sí | — | — | Valor de conversion ref type mantenido por la instancia. | `src/modules/marketing/dto/marketing.dto.ts:1305` |
| `conversionRefId` | `string` | Sí | formato uuid | — | Identificador asociado a conversion ref. | `src/modules/marketing/dto/marketing.dto.ts:1311` |
| `attributionModelConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a attribution model concept. | `src/modules/marketing/dto/marketing.dto.ts:1317` |
| `replaced` | `number` | Sí | — | — | Repartos previos del mismo modelo que se reemplazaron | `src/modules/marketing/dto/marketing.dto.ts:1325` |
| `touches` | `array<AttributionTouchDto>` | Sí | — | — | Valor de touches mantenido por la instancia. | `src/modules/marketing/dto/marketing.dto.ts:1331` |
| `touches[].touchpointId` | `string` | Sí | formato uuid | — | Identificador asociado a touchpoint. | `src/modules/marketing/dto/marketing.dto.ts:1276` |
| `touches[].weight` | `string` | Sí | — | — | Peso del touchpoint; la suma del reparto es 1 | `src/modules/marketing/dto/marketing.dto.ts:1282` |
| `touches[].attributedValue` | `string` | No | — | — | Valor atribuido a este touchpoint | `src/modules/marketing/dto/marketing.dto.ts:1288` |
| `touches[].positionConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a position concept. | `src/modules/marketing/dto/marketing.dto.ts:1294` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana de atribución es inválida; PreconditionFailedException: No hay touchpoints del miembro en la ventana de atribución |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:200` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-12`

---

## 2. POST /marketing/campaigns

- **Origen:** CONTRATO
- **Nombre:** Lanzar una campaña multicanal desde un segmento
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MarketingController.createCampaign` — `src/modules/marketing/controllers/marketing.controller.ts:108`

### Qué es y para qué sirve (negocio)

Lanzar una campaña multicanal desde un segmento. Caso de uso UC-50-03: Lanzar campaña multicanal desde un segmento. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /marketing/campaigns` la atiende `MarketingController.createCampaign` (src/modules/marketing/controllers/marketing.controller.ts:108). Exige sesión con alguno de los roles MARKETING_MANAGER. Valida el cuerpo como `CreateCampaignDto` (13 campos, 4 obligatorios). Delega en `MarketingCampaignsService.createCampaign`. Crea filas en marketing.marketing_campaigns. Lee marketing.marketing_campaigns, marketing.segments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER | `src/modules/marketing/controllers/marketing.controller.ts:108` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.marketing_campaigns` | ESCRIBE | CREA | DIRECTA | MarketingController.createCampaign → MarketingCampaignsService.createCampaign → MarketingCampaignsService.persistCampaign → MarketingCampaignsRepository.createCampaign | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:383` |
| `marketing.marketing_campaigns` | LEE | LEE | DIRECTA | MarketingController.createCampaign → MarketingCampaignsService.createCampaign → MarketingCampaignsRepository.findCampaignByCode | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:472` |
| `marketing.segments` | LEE | LEE | DIRECTA | MarketingController.createCampaign → MarketingCampaignsService.createCampaign → MarketingCampaignsService.persistCampaign → MarketingCampaignsRepository.findSegmentForUpdate | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:294` |

### Cuerpo — DTO `CreateCampaignDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Opcional: el tenant sale del contexto autenticado; si se envía debe coincidir con él | `src/modules/marketing/dto/marketing.dto.ts:216` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código de campaña, único por tenant | `src/modules/marketing/dto/marketing.dto.ts:227` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/marketing/dto/marketing.dto.ts:235` |
| `campaignType` | `string` | Sí | valores: ONE_SHOT, RECURRING | `@IsIn(['ONE_SHOT', 'RECURRING'])` | — | `src/modules/marketing/dto/marketing.dto.ts:242` |
| `objective` | `string` | Sí | valores: AWARENESS, CONVERSION, RETENTION | `@IsIn(['AWARENESS', 'CONVERSION', 'RETENTION'])` | — | `src/modules/marketing/dto/marketing.dto.ts:249` |
| `channel` | `string` | No | valores: EMAIL, SMS, PUSH | `@IsOptional()` `@IsIn(MARKETING_CHANNELS)` | — | `src/modules/marketing/dto/marketing.dto.ts:257` |
| `segmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Segmento del que sale la audiencia | `src/modules/marketing/dto/marketing.dto.ts:268` |
| `budgetAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Presupuesto como cadena decimal | `src/modules/marketing/dto/marketing.dto.ts:276` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/marketing/dto/marketing.dto.ts:284` |
| `promotionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Promoción asociada | `src/modules/marketing/dto/marketing.dto.ts:292` |
| `adCampaignRefId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Campaña de ads equivalente | `src/modules/marketing/dto/marketing.dto.ts:303` |
| `startAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/marketing/dto/marketing.dto.ts:311` |
| `endAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/marketing/dto/marketing.dto.ts:319` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "campaignType": "ONE_SHOT",
  "objective": "AWARENESS"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "campaignType": "ONE_SHOT",
  "objective": "AWARENESS",
  "channel": "EMAIL",
  "segmentId": "00000000-0000-4000-8000-000000000001",
  "budgetAmount": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "promotionId": "00000000-0000-4000-8000-000000000001",
  "adCampaignRefId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<CampaignResponseDto>` · DTO `CampaignResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/marketing/dto/marketing.dto.ts:330` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/marketing/dto/marketing.dto.ts:336` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/marketing/dto/marketing.dto.ts:342` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una campaña con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La campaña debe terminar después de empezar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:82` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-03`

---

## 3. POST /marketing/campaigns/{id}/members/materialize

- **Origen:** CONTRATO
- **Nombre:** Materializar la audiencia de la campaña desde su segmento
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MarketingController.materializeMembers` — `src/modules/marketing/controllers/marketing.controller.ts:125`

### Qué es y para qué sirve (negocio)

Materializar la audiencia de la campaña desde su segmento. Caso de uso UC-50-04: Materializar la audiencia. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /marketing/campaigns/{id}/members/materialize` la atiende `MarketingController.materializeMembers` (src/modules/marketing/controllers/marketing.controller.ts:125). Exige sesión con alguno de los roles MARKETING_MANAGER, SYSTEM. Valida el cuerpo como `MaterializeMembersDto` (1 campo, 0 obligatorios). Delega en `MarketingCampaignsService.materializeMembers`. Crea filas en marketing.campaign_members. Lee marketing.campaign_members, marketing.marketing_campaigns, marketing.segment_members.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER, SYSTEM | `src/modules/marketing/controllers/marketing.controller.ts:125` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/marketing/controllers/marketing.controller.ts:125` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.campaign_members` | ESCRIBE | CREA | DIRECTA | MarketingController.materializeMembers → MarketingCampaignsService.materializeMembers → MarketingCampaignsRepository.createCampaignMember | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:486` |
| `marketing.campaign_members` | LEE | LEE | DIRECTA | MarketingController.materializeMembers → MarketingCampaignsService.materializeMembers → MarketingCampaignsRepository.findCampaignMembers | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:507` |
| `marketing.marketing_campaigns` | LEE | LEE | DIRECTA | MarketingController.materializeMembers → MarketingCampaignsService.materializeMembers → MarketingCampaignsRepository.findCampaignForUpdate | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:452` |
| `marketing.segment_members` | LEE | LEE | DIRECTA | MarketingController.materializeMembers → MarketingCampaignsService.materializeMembers → MarketingCampaignsRepository.findActiveSegmentMembers | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:364` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `MaterializeMembersDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `suppressedMemberRefIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID(undefined, { each: true })` | Miembros a suprimir (do-not-contact o preferencia de mensajería). Se excluyen de la audiencia. | `src/modules/marketing/dto/marketing.dto.ts:359` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "suppressedMemberRefIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

</details>

### Respuesta — `Promise<MaterializeMembersResponseDto>` · DTO `MaterializeMembersResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `campaignId` | `string` | Sí | formato uuid | — | Identificador asociado a campaign. | `src/modules/marketing/dto/marketing.dto.ts:370` |
| `materialized` | `number` | Sí | — | — | Miembros añadidos a la audiencia en esta llamada | `src/modules/marketing/dto/marketing.dto.ts:378` |
| `skipped` | `number` | Sí | — | — | Miembros omitidos por supresión o por estar ya materializados | `src/modules/marketing/dto/marketing.dto.ts:387` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/marketing/dto/marketing.dto.ts:393` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La campaña no admite materializar audiencia en su estado actual; PreconditionFailedException: La campaña no tiene segmento del que derivar audiencia |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:92` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-04`

---

## 4. POST /marketing/content-templates/{code}/versions

- **Origen:** CONTRATO
- **Nombre:** Publicar una versión de plantilla de contenido
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MarketingController.publishTemplateVersion` — `src/modules/marketing/controllers/marketing.controller.ts:146`

### Qué es y para qué sirve (negocio)

Publicar una versión de plantilla de contenido. Caso de uso UC-50-05: Publicar versión de plantilla. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:61`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /marketing/content-templates/{code}/versions` la atiende `MarketingController.publishTemplateVersion` (src/modules/marketing/controllers/marketing.controller.ts:146). Exige sesión con alguno de los roles CONTENT_EDITOR, MARKETING_MANAGER. Valida el cuerpo como `PublishTemplateVersionDto` (8 campos, 2 obligatorios). Delega en `MarketingCampaignsService.publishTemplateVersion`. Crea filas en marketing.content_templates. Actualiza marketing.content_templates. Lee marketing.content_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CONTENT_EDITOR, MARKETING_MANAGER | `src/modules/marketing/controllers/marketing.controller.ts:146` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.content_templates` | ESCRIBE | ACTUALIZA | POR_TIPO | MarketingController.publishTemplateVersion → MarketingCampaignsService.publishTemplateVersion → MarketingCampaignsService.persistTemplateVersion | `src/modules/marketing/services/marketing-campaigns.service.ts:470` |
| `marketing.content_templates` | ESCRIBE | CREA | DIRECTA | MarketingController.publishTemplateVersion → MarketingCampaignsService.publishTemplateVersion → MarketingCampaignsService.persistTemplateVersion → MarketingCampaignsRepository.createContentTemplate | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:551` |
| `marketing.content_templates` | LEE | LEE | DIRECTA | MarketingController.publishTemplateVersion → MarketingCampaignsService.publishTemplateVersion → MarketingCampaignsService.persistTemplateVersion → MarketingCampaignsRepository.findLatestTemplateVersionForUpdate | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:580` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `code` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishTemplateVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Opcional: el tenant sale del contexto autenticado; si se envía debe coincidir con él | `src/modules/marketing/dto/marketing.dto.ts:413` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/marketing/dto/marketing.dto.ts:421` |
| `channel` | `string` | Sí | valores: EMAIL, SMS, PUSH | `@IsIn(MARKETING_CHANNELS)` | — | `src/modules/marketing/dto/marketing.dto.ts:428` |
| `languageConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/marketing/dto/marketing.dto.ts:436` |
| `subject` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/marketing/dto/marketing.dto.ts:445` |
| `bodyTemplate` | `string` | No | — | `@IsOptional()` `@IsString()` | Cuerpo con marcadores de variables | `src/modules/marketing/dto/marketing.dto.ts:453` |
| `variablesJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Variables declaradas por la plantilla | `src/modules/marketing/dto/marketing.dto.ts:461` |
| `messagingTemplateId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Plantilla equivalente en messaging | `src/modules/marketing/dto/marketing.dto.ts:472` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo",
  "channel": "EMAIL"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "channel": "EMAIL",
  "languageConceptId": "00000000-0000-4000-8000-000000000001",
  "subject": "valor-ejemplo",
  "bodyTemplate": "valor-ejemplo",
  "variablesJson": {},
  "messagingTemplateId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<TemplateVersionResponseDto>` · DTO `TemplateVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/marketing/dto/marketing.dto.ts:483` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/marketing/dto/marketing.dto.ts:489` |
| `version` | `number` | Sí | — | — | Versión publicada | `src/modules/marketing/dto/marketing.dto.ts:495` |
| `archivedVersionId` | `string` | No | formato uuid | — | Versión archivada al publicar esta | `src/modules/marketing/dto/marketing.dto.ts:504` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:106` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-05`

---

## 5. POST /marketing/enrollments/{id}/advance

- **Origen:** CONTRATO
- **Nombre:** Avanzar la inscripción al siguiente paso
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MarketingController.advanceEnrollment` — `src/modules/marketing/controllers/marketing.controller.ts:225`

### Qué es y para qué sirve (negocio)

Avanzar la inscripción al siguiente paso. Caso de uso UC-50-08: Avanzar la inscripción. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:64`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /marketing/enrollments/{id}/advance` la atiende `MarketingController.advanceEnrollment` (src/modules/marketing/controllers/marketing.controller.ts:225). Exige sesión con alguno de los roles SYSTEM, MARKETING_MANAGER. Valida el cuerpo como `AdvanceEnrollmentDto` (1 campo, 0 obligatorios). Delega en `MarketingJourneysService.advanceEnrollment`. Crea filas en marketing.marketing_touchpoints. Lee marketing.journey_enrollments, marketing.journey_steps, marketing.journeys.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MARKETING_MANAGER | `src/modules/marketing/controllers/marketing.controller.ts:225` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/marketing/controllers/marketing.controller.ts:225` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.journey_enrollments` | LEE | LEE | DIRECTA | MarketingController.advanceEnrollment → MarketingJourneysService.advanceEnrollment → MarketingJourneysRepository.findEnrollmentForUpdateSkipLocked | `src/modules/marketing/repositories/marketing-journeys.repository.ts:466` |
| `marketing.journey_steps` | LEE | LEE | DIRECTA | MarketingController.advanceEnrollment → MarketingJourneysService.advanceEnrollment → MarketingJourneysRepository.findStepById | `src/modules/marketing/repositories/marketing-journeys.repository.ts:396` |
| `marketing.journeys` | LEE | LEE | DIRECTA | MarketingController.advanceEnrollment → MarketingJourneysService.advanceEnrollment → MarketingJourneysRepository.findJourneyById | `src/modules/marketing/repositories/marketing-journeys.repository.ts:309` |
| `marketing.marketing_touchpoints` | ESCRIBE | CREA | DIRECTA | MarketingController.advanceEnrollment → MarketingJourneysService.advanceEnrollment → MarketingJourneysRepository.createTouchpoint | `src/modules/marketing/repositories/marketing-journeys.repository.ts:556` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AdvanceEnrollmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `branchTaken` | `boolean` | No | — | `@IsOptional()` | Resultado de la condición cuando el paso actual es BRANCH: true toma la rama, false sigue el camino principal. | `src/modules/marketing/dto/marketing.dto.ts:800` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "branchTaken": true
}
```

</details>

### Respuesta — `Promise<AdvanceEnrollmentResponseDto>` · DTO `AdvanceEnrollmentResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `enrollmentId` | `string` | Sí | formato uuid | — | Identificador asociado a enrollment. | `src/modules/marketing/dto/marketing.dto.ts:811` |
| `currentStepId` | `string` | No | formato uuid | — | Paso en el que queda; ausente si terminó | `src/modules/marketing/dto/marketing.dto.ts:820` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/marketing/dto/marketing.dto.ts:826` |
| `touchpointId` | `string` | No | formato uuid | — | Touchpoint registrado cuando el paso ejecutado era SEND | `src/modules/marketing/dto/marketing.dto.ts:835` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paso actual no encontrado |
| 409 | `CONFLICT` | ConflictException: La inscripción ya no está activa |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La inscripción no tiene paso actual; PreconditionFailedException: La espera del paso aún no ha vencido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:157` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-08`

---

## 6. POST /marketing/enrollments/{id}/exit

- **Origen:** CONTRATO
- **Nombre:** Cerrar la inscripción por meta, baja o rebote
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MarketingController.exitEnrollment` — `src/modules/marketing/controllers/marketing.controller.ts:247`

### Qué es y para qué sirve (negocio)

Cerrar la inscripción por meta, baja o rebote. Caso de uso UC-50-09: Cerrar la inscripción. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:65`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /marketing/enrollments/{id}/exit` la atiende `MarketingController.exitEnrollment` (src/modules/marketing/controllers/marketing.controller.ts:247). Exige sesión con alguno de los roles SYSTEM, MARKETING_MANAGER. Valida el cuerpo como `ExitEnrollmentDto` (2 campos, 1 obligatorio). Delega en `MarketingJourneysService.exitEnrollment`. Actualiza marketing.campaign_members. Lee marketing.campaign_members, marketing.journey_enrollments, marketing.journeys, marketing.marketing_campaigns.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MARKETING_MANAGER | `src/modules/marketing/controllers/marketing.controller.ts:247` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/marketing/controllers/marketing.controller.ts:247` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.campaign_members` | ESCRIBE | ACTUALIZA | POR_TIPO | MarketingController.exitEnrollment → MarketingJourneysService.exitEnrollment | `src/modules/marketing/services/marketing-journeys.service.ts:611` |
| `marketing.campaign_members` | LEE | LEE | DIRECTA | MarketingController.exitEnrollment → MarketingJourneysService.exitEnrollment → MarketingCampaignsRepository.findCampaignMemberByRefForUpdate | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:531` |
| `marketing.journey_enrollments` | LEE | LEE | DIRECTA | MarketingController.exitEnrollment → MarketingJourneysService.exitEnrollment → MarketingJourneysRepository.findEnrollmentForUpdate | `src/modules/marketing/repositories/marketing-journeys.repository.ts:484` |
| `marketing.journeys` | LEE | LEE | DIRECTA | MarketingController.exitEnrollment → MarketingJourneysService.exitEnrollment → MarketingJourneysRepository.findJourneyById | `src/modules/marketing/repositories/marketing-journeys.repository.ts:309` |
| `marketing.marketing_campaigns` | LEE | LEE | DIRECTA | MarketingController.exitEnrollment → MarketingJourneysService.exitEnrollment → MarketingCampaignsRepository.findCampaignByIdOrAdRef | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:433` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ExitEnrollmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | valores: GOAL, UNSUBSCRIBE, BOUNCE | `@IsIn(['GOAL', 'UNSUBSCRIBE', 'BOUNCE'])` | — | `src/modules/marketing/dto/marketing.dto.ts:848` |
| `campaignId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Campaña cuyo miembro debe reflejar la salida (converted / unsubscribed / bounced) | `src/modules/marketing/dto/marketing.dto.ts:860` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "GOAL"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "GOAL",
  "campaignId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ExitEnrollmentResponseDto>` · DTO `ExitEnrollmentResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `enrollmentId` | `string` | Sí | formato uuid | — | Identificador asociado a enrollment. | `src/modules/marketing/dto/marketing.dto.ts:871` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/marketing/dto/marketing.dto.ts:877` |
| `exitReasonConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a exit reason concept. | `src/modules/marketing/dto/marketing.dto.ts:883` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La inscripción ya no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:158` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-09`

---

## 7. GET /marketing/insights/alert-rules

- **Origen:** CONTRATO
- **Nombre:** Las siete reglas de alerta con su umbral y estado
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsWorkflowController.listRules` — `src/modules/marketing/controllers/insights-workflow.controller.ts:90`

### Qué es y para qué sirve (negocio)

Las siete reglas de alerta con su umbral y estado. Caso de uso UC-50-16: Encender, apagar o cambiar el umbral (1 a 500) de una de las siete reglas; If-Match obligatorio. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:72`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /marketing/insights/alert-rules` la atiende `InsightsWorkflowController.listRules` (src/modules/marketing/controllers/insights-workflow.controller.ts:90). Exige sesión con alguno de los roles MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. Delega en `InsightsWorkflowService.listRules`. Lee marketing.insights_alert_rules, marketing.insights_campaign_daily_facts, marketing.insights_data_sources, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN | `src/modules/marketing/controllers/insights-workflow.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_alert_rules` | LEE | LEE | POR_SQL | InsightsWorkflowController.listRules → InsightsWorkflowService.listRules → InsightsWorkflowRepository.rules | `src/modules/marketing/repositories/insights-workflow.repository.ts:199` |
| `marketing.insights_campaign_daily_facts` | LEE | LEE | POR_SQL | InsightsWorkflowController.listRules → InsightsWorkflowService.listRules → InsightsWorkflowService.envelope → InsightsFactsService.meta → InsightsFactsRepository.lastFactDate | `src/modules/marketing/repositories/insights-facts.repository.ts:137` |
| `marketing.insights_data_sources` | LEE | LEE | POR_SQL | InsightsWorkflowController.listRules → InsightsWorkflowService.listRules → InsightsWorkflowService.envelope → InsightsFactsService.meta → InsightsFactsRepository.dataSources | `src/modules/marketing/repositories/insights-facts.repository.ts:127` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsightsWorkflowController.listRules → InsightsWorkflowService.listRules → InsightsWorkflowRepository.rules | `src/modules/marketing/repositories/insights-workflow.repository.ts:199` |

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
| 500 | `INTERNAL` | Error: Regla de alerta desconocida: {row.code}/{row.severity} |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-16`

---

## 8. PATCH /marketing/insights/alert-rules/{code}

- **Origen:** CONTRATO
- **Nombre:** Enciende, apaga o cambia el umbral (1 a 500) de una regla
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsWorkflowController.patchRule` — `src/modules/marketing/controllers/insights-workflow.controller.ts:100`

### Qué es y para qué sirve (negocio)

Enciende, apaga o cambia el umbral (1 a 500) de una regla. Caso de uso UC-50-16: Encender, apagar o cambiar el umbral (1 a 500) de una de las siete reglas; If-Match obligatorio. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:72`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PATCH /marketing/insights/alert-rules/{code}` la atiende `InsightsWorkflowController.patchRule` (src/modules/marketing/controllers/insights-workflow.controller.ts:100). Exige sesión con alguno de los roles PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. Valida el cuerpo como `MarketingInsightsPatchAlertRuleDto` (2 campos, 0 obligatorios). Delega en `InsightsWorkflowService.patchRule`. Lee marketing.insights_campaign_daily_facts, marketing.insights_data_sources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, DATA_PLATFORM_ADMIN | `src/modules/marketing/controllers/insights-workflow.controller.ts:100` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (obligatoria) | `contrato (parameters)` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_campaign_daily_facts` | LEE | LEE | POR_SQL | InsightsWorkflowController.patchRule → InsightsWorkflowService.patchRule → InsightsWorkflowService.envelope → InsightsFactsService.meta → InsightsFactsRepository.lastFactDate | `src/modules/marketing/repositories/insights-facts.repository.ts:137` |
| `marketing.insights_data_sources` | LEE | LEE | POR_SQL | InsightsWorkflowController.patchRule → InsightsWorkflowService.patchRule → InsightsWorkflowService.envelope → InsightsFactsService.meta → InsightsFactsRepository.dataSources | `src/modules/marketing/repositories/insights-facts.repository.ts:127` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `code` | path | Sí | `string` | — |
| `If-Match` | header | Sí | `string` | rowVersion leído |

### Cuerpo — DTO `MarketingInsightsPatchAlertRuleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `enabled` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:160` |
| `threshold` | `number` | No | mínimo 1; máximo 500 | `@IsOptional()` `@IsNumber({ allowNaN: false, allowInfinity: false })` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:170` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "enabled": true,
  "threshold": 1
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: La regla de alerta no existe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY}; Error: Regla de alerta desconocida: {row.code}/{row.severity}; Error: La regla guardada no se encuentra |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/insights-workflow.controller.spec.ts:118` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-16`

---

## 9. GET /marketing/insights/alert-workflow

- **Origen:** CONTRATO
- **Nombre:** Estado, responsable e historial de las alertas que existen
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsWorkflowController.listWorkflow` — `src/modules/marketing/controllers/insights-workflow.controller.ts:52`

### Qué es y para qué sirve (negocio)

Estado, responsable e historial de las alertas que existen. Caso de uso UC-50-15: Estado, responsable e historial de una alerta detectada por la pantalla: el PUT la crea con su snapshot la primera vez y escribe una fila de insights_alert_transitions solo si cambia el estado o el responsable. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:71`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /marketing/insights/alert-workflow` la atiende `InsightsWorkflowController.listWorkflow` (src/modules/marketing/controllers/insights-workflow.controller.ts:52). Exige sesión con alguno de los roles MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. Delega en `InsightsWorkflowService.listWorkflow`. Lee marketing.insights_alert_transitions, marketing.insights_alerts, marketing.insights_campaign_daily_facts, marketing.insights_data_sources, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN | `src/modules/marketing/controllers/insights-workflow.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_alert_transitions` | LEE | LEE | POR_SQL | InsightsWorkflowController.listWorkflow → InsightsWorkflowService.listWorkflow → InsightsWorkflowRepository.transitionsOf | `src/modules/marketing/repositories/insights-workflow.repository.ts:117` |
| `marketing.insights_alerts` | LEE | LEE | POR_SQL | InsightsWorkflowController.listWorkflow → InsightsWorkflowService.listWorkflow → InsightsWorkflowRepository.alerts | `src/modules/marketing/repositories/insights-workflow.repository.ts:94` |
| `marketing.insights_campaign_daily_facts` | LEE | LEE | POR_SQL | InsightsWorkflowController.listWorkflow → InsightsWorkflowService.listWorkflow → InsightsWorkflowService.envelope → InsightsFactsService.meta → InsightsFactsRepository.lastFactDate | `src/modules/marketing/repositories/insights-facts.repository.ts:137` |
| `marketing.insights_data_sources` | LEE | LEE | POR_SQL | InsightsWorkflowController.listWorkflow → InsightsWorkflowService.listWorkflow → InsightsWorkflowService.envelope → InsightsFactsService.meta → InsightsFactsRepository.dataSources | `src/modules/marketing/repositories/insights-facts.repository.ts:127` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsightsWorkflowController.listWorkflow → InsightsWorkflowService.listWorkflow → InsightsWorkflowRepository.alerts | `src/modules/marketing/repositories/insights-workflow.repository.ts:94` |

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

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-15`

---

## 10. PUT /marketing/insights/alert-workflow/{fingerprint}

- **Origen:** CONTRATO
- **Nombre:** Cambia estado y/o responsable de una alerta (la crea la primera vez)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsWorkflowController.putWorkflow` — `src/modules/marketing/controllers/insights-workflow.controller.ts:62`

### Qué es y para qué sirve (negocio)

Cambia estado y/o responsable de una alerta (la crea la primera vez). Caso de uso UC-50-15: Estado, responsable e historial de una alerta detectada por la pantalla: el PUT la crea con su snapshot la primera vez y escribe una fila de insights_alert_transitions solo si cambia el estado o el responsable. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:71`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PUT /marketing/insights/alert-workflow/{fingerprint}` la atiende `InsightsWorkflowController.putWorkflow` (src/modules/marketing/controllers/insights-workflow.controller.ts:62). Exige sesión con alguno de los roles ...INSIGHTS_WRITE_ROLES. Valida el cuerpo como `MarketingInsightsPutAlertWorkflowDto` (10 campos, 9 obligatorios). Delega en `InsightsWorkflowService.putWorkflow`. Lee marketing.insights_campaign_daily_facts, marketing.insights_data_sources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...INSIGHTS_WRITE_ROLES | `src/modules/marketing/controllers/insights-workflow.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (opcional) | `contrato (parameters)` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_campaign_daily_facts` | LEE | LEE | POR_SQL | InsightsWorkflowController.putWorkflow → InsightsWorkflowService.putWorkflow → InsightsWorkflowService.envelope → InsightsFactsService.meta → InsightsFactsRepository.lastFactDate | `src/modules/marketing/repositories/insights-facts.repository.ts:137` |
| `marketing.insights_data_sources` | LEE | LEE | POR_SQL | InsightsWorkflowController.putWorkflow → InsightsWorkflowService.putWorkflow → InsightsWorkflowService.envelope → InsightsFactsService.meta → InsightsFactsRepository.dataSources | `src/modules/marketing/repositories/insights-facts.repository.ts:127` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `fingerprint` | path | Sí | `string` | — |
| `If-Match` | header | No | `string` | rowVersion leído |

### Cuerpo — DTO `MarketingInsightsPutAlertWorkflowDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: new, in_progress, resolved, dismissed | `@IsIn(INSIGHTS_ALERT_STATUSES)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:133` |
| `ownerTeam` | `string` | Sí | valores: marketing, innovation, product, communication, content, systems, direction; admite null | `@ValidateIf((_, value) => value !== null)` `@IsIn(INSIGHTS_OWNER_TEAMS)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:138` |
| `note` | `string` | No | longitud máxima 500 | `@IsOptional()` `@Transform(trim)` `@IsString()` `@MaxLength(500)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:145` |
| `snapshot` | `MarketingInsightsAlertSnapshotDto` | Sí | — | `@IsDefined()` `@ValidateNested()` `@Type(() => InsightsAlertSnapshotDto)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:151` |
| `snapshot.severity` | `string` | Sí | valores: critical, risk, anomaly, opportunity | `@IsIn(INSIGHTS_ALERT_SEVERITIES)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:94` |
| `snapshot.title` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@Transform(trim)` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:101` |
| `snapshot.whatText` | `string` | Sí | longitud mínima 1; longitud máxima 2000 | `@Transform(trim)` `@IsString()` `@MinLength(1)` `@MaxLength(2000)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:108` |
| `snapshot.detectedOn` | `string` | Sí | patrón runtime DAY | `@Matches(DAY)` | Día de detección | `src/modules/marketing/dto/insights-workspace.dto.ts:112` |
| `snapshot.moduleCode` | `string` | Sí | longitud mínima 1; longitud máxima 40; patrón runtime CODE | `@IsString()` `@MinLength(1)` `@MaxLength(40)` `@Matches(CODE)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:119` |
| `snapshot.priority` | `number` | Sí | mínimo 1; máximo 5 | `@IsInt()` `@Min(1)` `@Max(5)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:125` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "status": "new",
  "ownerTeam": "marketing",
  "snapshot": {
    "severity": "critical",
    "title": "valor-ejemplo",
    "whatText": "valor-ejemplo",
    "detectedOn": "2026-10-29",
    "moduleCode": "campaigns",
    "priority": 1
  }
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "new",
  "ownerTeam": "marketing",
  "note": "valor-ejemplo",
  "snapshot": {
    "severity": "critical",
    "title": "valor-ejemplo",
    "whatText": "valor-ejemplo",
    "detectedOn": "2026-10-29",
    "moduleCode": "campaigns",
    "priority": 1
  }
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
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY}; Error: El value set {ALERT_SEVERITY_VALUE_SET} no tiene el concepto «{dto.snapshot.severity}»; Error: La alerta recién insertada no se encuentra; Error: La alerta guardada no se encuentra |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/insights-workflow.controller.spec.ts:116` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-15`

---

## 11. GET /marketing/insights/campaign-facts

- **Origen:** CONTRATO
- **Nombre:** Hechos diarios por campaña y canal; lo que la fuente no reporta se declara en meta.notMeasured
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsFactsController.campaignFacts` — `src/modules/marketing/controllers/insights-facts.controller.ts:45`

### Qué es y para qué sirve (negocio)

Hechos diarios por campaña y canal; lo que la fuente no reporta se declara en meta.notMeasured. Caso de uso UC-50-14: Hechos diarios por campaña y canal en una ventana de hasta 92 días, con meta (dataset, asOf, notMeasured). Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:70`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /marketing/insights/campaign-facts` la atiende `InsightsFactsController.campaignFacts` (src/modules/marketing/controllers/insights-facts.controller.ts:45). Exige sesión con alguno de los roles MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. Delega en `InsightsFactsService.campaignFacts`. Lee marketing.insights_campaign_daily_facts, marketing.insights_campaigns, marketing.insights_data_sources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN | `src/modules/marketing/controllers/insights-facts.controller.ts:45` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_campaign_daily_facts` | LEE | LEE | POR_SQL | InsightsFactsController.campaignFacts → InsightsFactsService.campaignFacts → InsightsFactsRepository.facts | `src/modules/marketing/repositories/insights-facts.repository.ts:163` |
| `marketing.insights_campaigns` | LEE | LEE | POR_SQL | InsightsFactsController.campaignFacts → InsightsFactsService.campaignFacts → InsightsFactsRepository.facts | `src/modules/marketing/repositories/insights-facts.repository.ts:163` |
| `marketing.insights_data_sources` | LEE | LEE | POR_SQL | InsightsFactsController.campaignFacts → InsightsFactsService.campaignFacts → InsightsFactsService.meta → InsightsFactsRepository.dataSources | `src/modules/marketing/repositories/insights-facts.repository.ts:127` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `from` | query | Sí | `string` | Primer día (inclusive) |
| `to` | query | Sí | `string` | Último día (inclusive) |
| `campaignIds` | query | No | `array<string>` | Códigos de campaña (lista separada por comas) |
| `channels` | query | No | `array<string>` | Canales (lista separada por comas) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/insights-facts.controller.spec.ts:71` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-14`

---

## 12. GET /marketing/insights/catalog

- **Origen:** CONTRATO
- **Nombre:** Campañas (con sus canales y objetivos) e hitos de Insights
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsFactsController.catalog` — `src/modules/marketing/controllers/insights-facts.controller.ts:35`

### Qué es y para qué sirve (negocio)

Campañas (con sus canales y objetivos) e hitos de Insights. Caso de uso UC-50-13: Catálogo de Insights: campañas (con canales derivados de sus creativos) e hitos. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:69`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /marketing/insights/catalog` la atiende `InsightsFactsController.catalog` (src/modules/marketing/controllers/insights-facts.controller.ts:35). Exige sesión con alguno de los roles MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. Delega en `InsightsFactsService.catalog`. Lee marketing.insights_campaign_daily_facts, marketing.insights_campaigns, marketing.insights_creatives, marketing.insights_data_sources, marketing.insights_milestones, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN | `src/modules/marketing/controllers/insights-facts.controller.ts:35` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_campaign_daily_facts` | LEE | LEE | POR_SQL | InsightsFactsController.catalog → InsightsFactsService.catalog → InsightsFactsService.meta → InsightsFactsRepository.lastFactDate | `src/modules/marketing/repositories/insights-facts.repository.ts:137` |
| `marketing.insights_campaigns` | LEE | LEE | POR_SQL | InsightsFactsController.catalog → InsightsFactsService.catalog → InsightsFactsRepository.campaigns | `src/modules/marketing/repositories/insights-facts.repository.ts:94` |
| `marketing.insights_creatives` | LEE | LEE | POR_SQL | InsightsFactsController.catalog → InsightsFactsService.catalog → InsightsFactsRepository.campaignChannels | `src/modules/marketing/repositories/insights-facts.repository.ts:107` |
| `marketing.insights_data_sources` | LEE | LEE | POR_SQL | InsightsFactsController.catalog → InsightsFactsService.catalog → InsightsFactsService.meta → InsightsFactsRepository.dataSources | `src/modules/marketing/repositories/insights-facts.repository.ts:127` |
| `marketing.insights_milestones` | LEE | LEE | POR_SQL | InsightsFactsController.catalog → InsightsFactsService.catalog → InsightsFactsRepository.milestones | `src/modules/marketing/repositories/insights-facts.repository.ts:116` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsightsFactsController.catalog → InsightsFactsService.catalog → InsightsFactsRepository.campaigns | `src/modules/marketing/repositories/insights-facts.repository.ts:94` |

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
| 500 | `INTERNAL` | Error: Estado de campaña desconocido para {row.code}: {row.status_code ?? 'sin conce…} |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/insights-facts.controller.spec.ts:70` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-13`

---

## 13. GET /marketing/insights/notification-preferences

- **Origen:** CONTRATO
- **Nombre:** Preferencias de aviso del usuario (rowVersion 0 si no guardó nada)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsWorkspaceController.getNotificationPreferences` — `src/modules/marketing/controllers/insights-workspace.controller.ts:58`

### Qué es y para qué sirve (negocio)

Preferencias de aviso del usuario (rowVersion 0 si no guardó nada). Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /marketing/insights/notification-preferences` la atiende `InsightsWorkspaceController.getNotificationPreferences` (src/modules/marketing/controllers/insights-workspace.controller.ts:58). Exige sesión con alguno de los roles MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. Delega en `InsightsWorkspaceService.getNotificationPreferences`. Lee marketing.insights_campaign_daily_facts, marketing.insights_data_sources, marketing.insights_notification_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN | `src/modules/marketing/controllers/insights-workspace.controller.ts:58` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_campaign_daily_facts` | LEE | LEE | POR_SQL | InsightsWorkspaceController.getNotificationPreferences → InsightsWorkspaceService.getNotificationPreferences → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.lastFactDate | `src/modules/marketing/repositories/insights-facts.repository.ts:137` |
| `marketing.insights_data_sources` | LEE | LEE | POR_SQL | InsightsWorkspaceController.getNotificationPreferences → InsightsWorkspaceService.getNotificationPreferences → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.dataSources | `src/modules/marketing/repositories/insights-facts.repository.ts:127` |
| `marketing.insights_notification_preferences` | LEE | LEE | POR_SQL | InsightsWorkspaceController.getNotificationPreferences → InsightsWorkspaceService.getNotificationPreferences → InsightsWorkspaceRepository.notificationPreferences | `src/modules/marketing/repositories/insights-workspace.repository.ts:120` |

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

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `ctrl:InsightsWorkspaceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. PUT /marketing/insights/notification-preferences

- **Origen:** CONTRATO
- **Nombre:** Guarda las preferencias de aviso del usuario (no se envía nada)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsWorkspaceController.putNotificationPreferences` — `src/modules/marketing/controllers/insights-workspace.controller.ts:69`

### Qué es y para qué sirve (negocio)

Guarda las preferencias de aviso del usuario (no se envía nada). Caso de uso UC-50-17: Preferencias de aviso (no se envía nada) y de interfaz del usuario autenticado. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:73`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PUT /marketing/insights/notification-preferences` la atiende `InsightsWorkspaceController.putNotificationPreferences` (src/modules/marketing/controllers/insights-workspace.controller.ts:69). Exige sesión con alguno de los roles ...INSIGHTS_WRITE_ROLES. Valida el cuerpo como `MarketingInsightsPutNotificationPreferencesDto` (10 campos, 10 obligatorios). Delega en `InsightsWorkspaceService.putNotificationPreferences`. Lee marketing.insights_campaign_daily_facts, marketing.insights_data_sources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...INSIGHTS_WRITE_ROLES | `src/modules/marketing/controllers/insights-workspace.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (opcional) | `contrato (parameters)` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_campaign_daily_facts` | LEE | LEE | POR_SQL | InsightsWorkspaceController.putNotificationPreferences → InsightsWorkspaceService.putNotificationPreferences → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.lastFactDate | `src/modules/marketing/repositories/insights-facts.repository.ts:137` |
| `marketing.insights_data_sources` | LEE | LEE | POR_SQL | InsightsWorkspaceController.putNotificationPreferences → InsightsWorkspaceService.putNotificationPreferences → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.dataSources | `src/modules/marketing/repositories/insights-facts.repository.ts:127` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `If-Match` | header | No | `string` | rowVersion leído; obligatorio si ya hay fila |

### Cuerpo — DTO `MarketingInsightsPutNotificationPreferencesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `matrix` | `MarketingInsightsNotificationMatrixDto` | Sí | — | `@IsDefined()` `@ValidateNested()` `@Type(() => InsightsNotificationMatrixDto)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:215` |
| `matrix.critical` | `array<string>` | Sí | — | `@applyAll(channelList())` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:193` |
| `matrix.risk` | `array<string>` | Sí | — | `@applyAll(channelList())` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:197` |
| `matrix.anomaly` | `array<string>` | Sí | — | `@applyAll(channelList())` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:201` |
| `matrix.opportunity` | `array<string>` | Sí | — | `@applyAll(channelList())` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:205` |
| `frequency` | `string` | Sí | valores: immediate, daily_digest | `@IsIn(INSIGHTS_NOTIFICATION_FREQUENCIES)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:219` |
| `digestHour` | `number` | Sí | mínimo 0; máximo 23 | `@IsInt()` `@Min(0)` `@Max(23)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:225` |
| `quietFrom` | `object` | Sí | patrón runtime HOUR_MINUTE; admite null | `@ValidateIf((_, value) => value !== null)` `@Matches(HOUR_MINUTE)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:230` |
| `quietTo` | `object` | Sí | patrón runtime HOUR_MINUTE; admite null | `@ValidateIf((_, value) => value !== null)` `@Matches(HOUR_MINUTE)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:235` |
| `quietExemptCritical` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:239` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "matrix": {
    "critical": [
      "app"
    ],
    "risk": [
      "app"
    ],
    "anomaly": [
      "app"
    ],
    "opportunity": [
      "app"
    ]
  },
  "frequency": "immediate",
  "digestHour": 1,
  "quietFrom": "22:00",
  "quietTo": "07:00",
  "quietExemptCritical": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "matrix": {
    "critical": [
      "app"
    ],
    "risk": [
      "app"
    ],
    "anomaly": [
      "app"
    ],
    "opportunity": [
      "app"
    ]
  },
  "frequency": "immediate",
  "digestHour": 1,
  "quietFrom": "22:00",
  "quietTo": "07:00",
  "quietExemptCritical": true
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
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Las preferencias guardadas no se encuentran |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-17`

---

## 15. GET /marketing/insights/reports

- **Origen:** CONTRATO
- **Nombre:** Historial de informes del usuario (máximo 12, el más nuevo primero)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsWorkspaceController.listReports` — `src/modules/marketing/controllers/insights-workspace.controller.ts:173`

### Qué es y para qué sirve (negocio)

Historial de informes del usuario (máximo 12, el más nuevo primero). Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /marketing/insights/reports` la atiende `InsightsWorkspaceController.listReports` (src/modules/marketing/controllers/insights-workspace.controller.ts:173). Exige sesión con alguno de los roles MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. Delega en `InsightsWorkspaceService.listReports`. Lee marketing.insights_campaign_daily_facts, marketing.insights_data_sources, marketing.insights_reports.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN | `src/modules/marketing/controllers/insights-workspace.controller.ts:173` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_campaign_daily_facts` | LEE | LEE | POR_SQL | InsightsWorkspaceController.listReports → InsightsWorkspaceService.listReports → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.lastFactDate | `src/modules/marketing/repositories/insights-facts.repository.ts:137` |
| `marketing.insights_data_sources` | LEE | LEE | POR_SQL | InsightsWorkspaceController.listReports → InsightsWorkspaceService.listReports → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.dataSources | `src/modules/marketing/repositories/insights-facts.repository.ts:127` |
| `marketing.insights_reports` | LEE | LEE | POR_SQL | InsightsWorkspaceController.listReports → InsightsWorkspaceService.listReports → InsightsWorkspaceRepository.reports | `src/modules/marketing/repositories/insights-workspace.repository.ts:322` |

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

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/insights-workflow.controller.spec.ts:188` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `ctrl:InsightsWorkspaceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. DELETE /marketing/insights/reports/{id}

- **Origen:** CONTRATO
- **Nombre:** Borra un informe del usuario (idempotente)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsWorkspaceController.deleteReport` — `src/modules/marketing/controllers/insights-workspace.controller.ts:205`

### Qué es y para qué sirve (negocio)

Borra un informe del usuario (idempotente). Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DELETE /marketing/insights/reports/{id}` la atiende `InsightsWorkspaceController.deleteReport` (src/modules/marketing/controllers/insights-workspace.controller.ts:205). Exige sesión con alguno de los roles ...INSIGHTS_WRITE_ROLES. Delega en `InsightsWorkspaceService.deleteReport`. Borra de marketing.insights_reports.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...INSIGHTS_WRITE_ROLES | `src/modules/marketing/controllers/insights-workspace.controller.ts:205` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/marketing/controllers/insights-workspace.controller.ts:205` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_reports` | BORRA | BORRA | POR_SQL | InsightsWorkspaceController.deleteReport → InsightsWorkspaceService.deleteReport → InsightsWorkspaceRepository.deleteReport | `src/modules/marketing/repositories/insights-workspace.repository.ts:411` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `ctrl:InsightsWorkspaceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. PUT /marketing/insights/reports/{id}

- **Origen:** CONTRATO
- **Nombre:** Guarda un informe en el historial (idempotente por id)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsWorkspaceController.putReport` — `src/modules/marketing/controllers/insights-workspace.controller.ts:184`

### Qué es y para qué sirve (negocio)

Guarda un informe en el historial (idempotente por id). Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PUT /marketing/insights/reports/{id}` la atiende `InsightsWorkspaceController.putReport` (src/modules/marketing/controllers/insights-workspace.controller.ts:184). Exige sesión con alguno de los roles ...INSIGHTS_WRITE_ROLES. Valida el cuerpo como `MarketingInsightsPutReportDto` (8 campos, 8 obligatorios). Delega en `InsightsWorkspaceService.putReport`. Lee marketing.insights_campaign_daily_facts, marketing.insights_data_sources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...INSIGHTS_WRITE_ROLES | `src/modules/marketing/controllers/insights-workspace.controller.ts:184` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/marketing/controllers/insights-workspace.controller.ts:184` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_campaign_daily_facts` | LEE | LEE | POR_SQL | InsightsWorkspaceController.putReport → InsightsWorkspaceService.putReport → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.lastFactDate | `src/modules/marketing/repositories/insights-facts.repository.ts:137` |
| `marketing.insights_data_sources` | LEE | LEE | POR_SQL | InsightsWorkspaceController.putReport → InsightsWorkspaceService.putReport → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.dataSources | `src/modules/marketing/repositories/insights-facts.repository.ts:127` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `MarketingInsightsPutReportDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `title` | `string` | Sí | longitud mínima 1; longitud máxima 120 | `@Transform(trim)` `@IsString()` `@MinLength(1)` `@MaxLength(120)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:298` |
| `type` | `string` | Sí | longitud mínima 1; longitud máxima 40; patrón runtime CODE | `@IsString()` `@MinLength(1)` `@MaxLength(40)` `@Matches(CODE)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:305` |
| `audience` | `string` | Sí | longitud mínima 1; longitud máxima 40; patrón runtime CODE | `@IsString()` `@MinLength(1)` `@MaxLength(40)` `@Matches(CODE)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:312` |
| `periodFrom` | `string` | Sí | patrón runtime DAY | `@Matches(DAY)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:316` |
| `periodTo` | `string` | Sí | patrón runtime DAY | `@Matches(DAY)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:320` |
| `campaignIds` | `array<string>` | Sí | — | `@applyAll(codeItems(20, 40))` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:324` |
| `channels` | `array<string>` | Sí | máximo INSIGHTS_CHANNELS.length elemento(s) | `@IsArray()` `@ArrayUnique()` `@ArrayMaxSize(INSIGHTS_CHANNELS.length)` `@IsIn(INSIGHTS_CHANNELS, { each: true })` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:331` |
| `sections` | `array<string>` | Sí | — | `@applyAll(codeItems(32, 40))` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:335` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "title": "valor-ejemplo",
  "type": "valor-ejemplo",
  "audience": "valor-ejemplo",
  "periodFrom": "2026-10-01",
  "periodTo": "2026-10-29",
  "campaignIds": [
    "valor-ejemplo"
  ],
  "channels": [
    "instagram"
  ],
  "sections": [
    "valor-ejemplo"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "title": "valor-ejemplo",
  "type": "valor-ejemplo",
  "audience": "valor-ejemplo",
  "periodFrom": "2026-10-01",
  "periodTo": "2026-10-29",
  "campaignIds": [
    "valor-ejemplo"
  ],
  "channels": [
    "instagram"
  ],
  "sections": [
    "valor-ejemplo"
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
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY}; Error: El informe guardado no se encuentra |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/insights-workflow.controller.spec.ts:191` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `ctrl:InsightsWorkspaceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. GET /marketing/insights/saved-views

- **Origen:** CONTRATO
- **Nombre:** Vistas guardadas del usuario
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsWorkspaceController.listSavedViews` — `src/modules/marketing/controllers/insights-workspace.controller.ts:126`

### Qué es y para qué sirve (negocio)

Vistas guardadas del usuario. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /marketing/insights/saved-views` la atiende `InsightsWorkspaceController.listSavedViews` (src/modules/marketing/controllers/insights-workspace.controller.ts:126). Exige sesión con alguno de los roles MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. Delega en `InsightsWorkspaceService.listSavedViews`. Lee marketing.insights_campaign_daily_facts, marketing.insights_data_sources, marketing.insights_saved_views.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN | `src/modules/marketing/controllers/insights-workspace.controller.ts:126` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_campaign_daily_facts` | LEE | LEE | POR_SQL | InsightsWorkspaceController.listSavedViews → InsightsWorkspaceService.listSavedViews → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.lastFactDate | `src/modules/marketing/repositories/insights-facts.repository.ts:137` |
| `marketing.insights_data_sources` | LEE | LEE | POR_SQL | InsightsWorkspaceController.listSavedViews → InsightsWorkspaceService.listSavedViews → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.dataSources | `src/modules/marketing/repositories/insights-facts.repository.ts:127` |
| `marketing.insights_saved_views` | LEE | LEE | POR_SQL | InsightsWorkspaceController.listSavedViews → InsightsWorkspaceService.listSavedViews → InsightsWorkspaceRepository.savedViews | `src/modules/marketing/repositories/insights-workspace.repository.ts:240` |

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

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `ctrl:InsightsWorkspaceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. DELETE /marketing/insights/saved-views/{id}

- **Origen:** CONTRATO
- **Nombre:** Borra una vista del usuario (idempotente)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsWorkspaceController.deleteSavedView` — `src/modules/marketing/controllers/insights-workspace.controller.ts:156`

### Qué es y para qué sirve (negocio)

Borra una vista del usuario (idempotente). Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DELETE /marketing/insights/saved-views/{id}` la atiende `InsightsWorkspaceController.deleteSavedView` (src/modules/marketing/controllers/insights-workspace.controller.ts:156). Exige sesión con alguno de los roles ...INSIGHTS_WRITE_ROLES. Delega en `InsightsWorkspaceService.deleteSavedView`. Borra de marketing.insights_saved_views.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...INSIGHTS_WRITE_ROLES | `src/modules/marketing/controllers/insights-workspace.controller.ts:156` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/marketing/controllers/insights-workspace.controller.ts:156` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_saved_views` | BORRA | BORRA | POR_SQL | InsightsWorkspaceController.deleteSavedView → InsightsWorkspaceService.deleteSavedView → InsightsWorkspaceRepository.deleteSavedView | `src/modules/marketing/repositories/insights-workspace.repository.ts:313` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `ctrl:InsightsWorkspaceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. PUT /marketing/insights/saved-views/{id}

- **Origen:** CONTRATO
- **Nombre:** Guarda una vista con el id que manda el cliente (idempotente)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsWorkspaceController.putSavedView` — `src/modules/marketing/controllers/insights-workspace.controller.ts:134`

### Qué es y para qué sirve (negocio)

Guarda una vista con el id que manda el cliente (idempotente). Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PUT /marketing/insights/saved-views/{id}` la atiende `InsightsWorkspaceController.putSavedView` (src/modules/marketing/controllers/insights-workspace.controller.ts:134). Exige sesión con alguno de los roles ...INSIGHTS_WRITE_ROLES. Valida el cuerpo como `MarketingInsightsPutSavedViewDto` (2 campos, 2 obligatorios). Delega en `InsightsWorkspaceService.putSavedView`. Lee marketing.insights_campaign_daily_facts, marketing.insights_data_sources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...INSIGHTS_WRITE_ROLES | `src/modules/marketing/controllers/insights-workspace.controller.ts:134` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/marketing/controllers/insights-workspace.controller.ts:134` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_campaign_daily_facts` | LEE | LEE | POR_SQL | InsightsWorkspaceController.putSavedView → InsightsWorkspaceService.putSavedView → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.lastFactDate | `src/modules/marketing/repositories/insights-facts.repository.ts:137` |
| `marketing.insights_data_sources` | LEE | LEE | POR_SQL | InsightsWorkspaceController.putSavedView → InsightsWorkspaceService.putSavedView → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.dataSources | `src/modules/marketing/repositories/insights-facts.repository.ts:127` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `MarketingInsightsPutSavedViewDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@Transform(trim)` `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:273` |
| `url` | `string` | Sí | longitud máxima 500; patrón runtime /^\/insights(?:\/[a-z0-9-]+)*(?:\?[^\s#]*)?$/ | `@IsString()` `@MaxLength(500)` `@Matches(/^\/insights(?:\/[a-z0-9-]+)*(?:\?[^\s#]*)?$/)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:279` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo",
  "url": "/insights/campaigns?c=c1&p=30d"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo",
  "url": "/insights/campaigns?c=c1&p=30d"
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya tienes una vista guardada con ese nombre |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: La vista guardada no se encuentra |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `ctrl:InsightsWorkspaceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. GET /marketing/insights/user-preferences

- **Origen:** CONTRATO
- **Nombre:** Preferencias de interfaz del usuario (rowVersion 0 si no guardó nada)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsWorkspaceController.getUserPreferences` — `src/modules/marketing/controllers/insights-workspace.controller.ts:93`

### Qué es y para qué sirve (negocio)

Preferencias de interfaz del usuario (rowVersion 0 si no guardó nada). Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /marketing/insights/user-preferences` la atiende `InsightsWorkspaceController.getUserPreferences` (src/modules/marketing/controllers/insights-workspace.controller.ts:93). Exige sesión con alguno de los roles MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. Delega en `InsightsWorkspaceService.getUserPreferences`. Lee marketing.insights_campaign_daily_facts, marketing.insights_data_sources, marketing.insights_user_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN | `src/modules/marketing/controllers/insights-workspace.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_campaign_daily_facts` | LEE | LEE | POR_SQL | InsightsWorkspaceController.getUserPreferences → InsightsWorkspaceService.getUserPreferences → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.lastFactDate | `src/modules/marketing/repositories/insights-facts.repository.ts:137` |
| `marketing.insights_data_sources` | LEE | LEE | POR_SQL | InsightsWorkspaceController.getUserPreferences → InsightsWorkspaceService.getUserPreferences → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.dataSources | `src/modules/marketing/repositories/insights-facts.repository.ts:127` |
| `marketing.insights_user_preferences` | LEE | LEE | POR_SQL | InsightsWorkspaceController.getUserPreferences → InsightsWorkspaceService.getUserPreferences → InsightsWorkspaceRepository.userPreferences | `src/modules/marketing/repositories/insights-workspace.repository.ts:184` |

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

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `ctrl:InsightsWorkspaceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. PUT /marketing/insights/user-preferences

- **Origen:** CONTRATO
- **Nombre:** Guarda las preferencias de interfaz del usuario
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsightsWorkspaceController.putUserPreferences` — `src/modules/marketing/controllers/insights-workspace.controller.ts:104`

### Qué es y para qué sirve (negocio)

Guarda las preferencias de interfaz del usuario. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PUT /marketing/insights/user-preferences` la atiende `InsightsWorkspaceController.putUserPreferences` (src/modules/marketing/controllers/insights-workspace.controller.ts:104). Exige sesión con alguno de los roles ...INSIGHTS_WRITE_ROLES. Valida el cuerpo como `MarketingInsightsPutUserPreferencesDto` (4 campos, 4 obligatorios). Delega en `InsightsWorkspaceService.putUserPreferences`. Lee marketing.insights_campaign_daily_facts, marketing.insights_data_sources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ...INSIGHTS_WRITE_ROLES | `src/modules/marketing/controllers/insights-workspace.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (opcional) | `contrato (parameters)` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.insights_campaign_daily_facts` | LEE | LEE | POR_SQL | InsightsWorkspaceController.putUserPreferences → InsightsWorkspaceService.putUserPreferences → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.lastFactDate | `src/modules/marketing/repositories/insights-facts.repository.ts:137` |
| `marketing.insights_data_sources` | LEE | LEE | POR_SQL | InsightsWorkspaceController.putUserPreferences → InsightsWorkspaceService.putUserPreferences → InsightsWorkspaceService.envelope → InsightsFactsService.meta → InsightsFactsRepository.dataSources | `src/modules/marketing/repositories/insights-facts.repository.ts:127` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `If-Match` | header | No | `string` | rowVersion leído; obligatorio si ya hay fila |

### Cuerpo — DTO `MarketingInsightsPutUserPreferencesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `density` | `string` | Sí | valores: comfortable, compact | `@IsIn(INSIGHTS_DENSITIES)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:247` |
| `theme` | `string` | Sí | valores: system, light, dark | `@IsIn(INSIGHTS_THEMES)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:251` |
| `navCollapsed` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:255` |
| `timezone` | `object` | Sí | longitud máxima 64; patrón runtime /^[A-Za-z0-9_+\-/]+$/; admite null | `@ValidateIf((_, value) => value !== null)` `@IsString()` `@MaxLength(64)` `@Matches(/^[A-Za-z0-9_+\-/]+$/)` | — | `src/modules/marketing/dto/insights-workspace.dto.ts:262` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "density": "comfortable",
  "theme": "system",
  "navCollapsed": true,
  "timezone": "America/La_Paz"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "density": "comfortable",
  "theme": "system",
  "navCollapsed": true,
  "timezone": "America/La_Paz"
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
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Las preferencias guardadas no se encuentran |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `ctrl:InsightsWorkspaceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /marketing/journeys

- **Origen:** CONTRATO
- **Nombre:** Crear un journey en borrador
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MarketingController.createJourney` — `src/modules/marketing/controllers/marketing.controller.ts:167`

### Qué es y para qué sirve (negocio)

Crear un journey en borrador. Caso de uso UC-50-06: Diseñar journey con pasos. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:62`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /marketing/journeys` la atiende `MarketingController.createJourney` (src/modules/marketing/controllers/marketing.controller.ts:167). Exige sesión con alguno de los roles MARKETING_MANAGER. Valida el cuerpo como `CreateJourneyDto` (7 campos, 3 obligatorios). Delega en `MarketingJourneysService.createJourney`. Crea filas en marketing.journeys. Lee marketing.journeys, marketing.segments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER | `src/modules/marketing/controllers/marketing.controller.ts:167` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.journeys` | ESCRIBE | CREA | DIRECTA | MarketingController.createJourney → MarketingJourneysService.createJourney → MarketingJourneysService.persistJourney → MarketingJourneysRepository.createJourney | `src/modules/marketing/repositories/marketing-journeys.repository.ts:279` |
| `marketing.journeys` | LEE | LEE | DIRECTA | MarketingController.createJourney → MarketingJourneysService.createJourney → MarketingJourneysRepository.findJourneyByCode | `src/modules/marketing/repositories/marketing-journeys.repository.ts:345` |
| `marketing.segments` | LEE | LEE | DIRECTA | MarketingController.createJourney → MarketingJourneysService.createJourney → MarketingJourneysService.persistJourney → MarketingCampaignsRepository.findSegmentById | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:282` |

### Cuerpo — DTO `CreateJourneyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Opcional: el tenant sale del contexto autenticado; si se envía debe coincidir con él | `src/modules/marketing/dto/marketing.dto.ts:527` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del journey, único por tenant | `src/modules/marketing/dto/marketing.dto.ts:538` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/marketing/dto/marketing.dto.ts:546` |
| `entryTrigger` | `string` | Sí | valores: SEGMENT, EVENT | `@IsIn(['SEGMENT', 'EVENT'])` | — | `src/modules/marketing/dto/marketing.dto.ts:553` |
| `entrySegmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Segmento de entrada; obligatorio si el disparador es SEGMENT | `src/modules/marketing/dto/marketing.dto.ts:564` |
| `goalMetricConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/marketing/dto/marketing.dto.ts:572` |
| `definitionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Definición completa del grafo, informativa | `src/modules/marketing/dto/marketing.dto.ts:582` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "entryTrigger": "SEGMENT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "entryTrigger": "SEGMENT",
  "entrySegmentId": "00000000-0000-4000-8000-000000000001",
  "goalMetricConceptId": "00000000-0000-4000-8000-000000000001",
  "definitionJson": {}
}
```

</details>

### Respuesta — `Promise<JourneyResponseDto>` · DTO `JourneyResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/marketing/dto/marketing.dto.ts:593` |
| `journeyStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a journey status concept. | sin fuente |
| `endedAt` | `string` | No | formato date-time | — | Valor de ended at mantenido por la instancia. | sin fuente |
| `eventCount` | `number` | Sí | — | — | Valor de event count mantenido por la instancia. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un journey con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un journey con entrada por segmento necesita entrySegmentId |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:122` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-06`

---

## 24. POST /marketing/journeys/{id}/activate

- **Origen:** CONTRATO
- **Nombre:** Activar el journey e inscribir la cohorte inicial
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MarketingController.activateJourney` — `src/modules/marketing/controllers/marketing.controller.ts:205`

### Qué es y para qué sirve (negocio)

Activar el journey e inscribir la cohorte inicial. Caso de uso UC-50-07: Activar e inscribir la cohorte. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:63`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /marketing/journeys/{id}/activate` la atiende `MarketingController.activateJourney` (src/modules/marketing/controllers/marketing.controller.ts:205). Exige sesión con alguno de los roles MARKETING_MANAGER. Valida el cuerpo como `ActivateJourneyDto` (3 campos, 0 obligatorios). Delega en `MarketingJourneysService.activateJourney`. Crea filas en marketing.journey_enrollments. Lee marketing.journey_enrollments, marketing.journey_steps, marketing.journeys.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER | `src/modules/marketing/controllers/marketing.controller.ts:205` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/marketing/controllers/marketing.controller.ts:205` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.journey_enrollments` | ESCRIBE | CREA | DIRECTA | MarketingController.activateJourney → MarketingJourneysService.activateJourney → MarketingJourneysRepository.createEnrollment | `src/modules/marketing/repositories/marketing-journeys.repository.ts:424` |
| `marketing.journey_enrollments` | LEE | LEE | DIRECTA | MarketingController.activateJourney → MarketingJourneysService.activateJourney → MarketingJourneysRepository.findActiveEnrollment | `src/modules/marketing/repositories/marketing-journeys.repository.ts:450` |
| `marketing.journey_steps` | LEE | LEE | DIRECTA | MarketingController.activateJourney → MarketingJourneysService.activateJourney → MarketingJourneysRepository.findStepsByJourney | `src/modules/marketing/repositories/marketing-journeys.repository.ts:381` |
| `marketing.journeys` | LEE | LEE | DIRECTA | MarketingController.activateJourney → MarketingJourneysService.activateJourney → MarketingJourneysRepository.findJourneyForUpdate | `src/modules/marketing/repositories/marketing-journeys.repository.ts:325` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ActivateJourneyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `cohort` | `array<CohortMemberDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => CohortMemberDto)` | Cohorte inicial. Sin ella el journey se activa sin inscribir a nadie. | `src/modules/marketing/dto/marketing.dto.ts:752` |
| `cohort[].memberType` | `string` | No | valores: CONTACT, PATIENT | `@IsIn(MEMBER_TYPES)` | — | `src/modules/marketing/dto/marketing.dto.ts:728` |
| `cohort[].memberRefId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/marketing/dto/marketing.dto.ts:735` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "cohort": [
    {
      "memberType": "CONTACT",
      "memberRefId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — `Promise<ActivateJourneyResponseDto>` · DTO `ActivateJourneyResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `journeyId` | `string` | Sí | formato uuid | — | Identificador asociado a journey. | `src/modules/marketing/dto/marketing.dto.ts:763` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/marketing/dto/marketing.dto.ts:769` |
| `enrolled` | `number` | Sí | — | — | Inscripciones creadas | `src/modules/marketing/dto/marketing.dto.ts:775` |
| `skipped` | `number` | Sí | — | — | Miembros omitidos por tener ya una inscripción activa | `src/modules/marketing/dto/marketing.dto.ts:783` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El journey ya no está en borrador |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un journey sin pasos no puede activarse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:141` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-07`

---

## 25. POST /marketing/journeys/{id}/steps

- **Origen:** CONTRATO
- **Nombre:** Añadir pasos al journey
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MarketingController.addSteps` — `src/modules/marketing/controllers/marketing.controller.ts:184`

### Qué es y para qué sirve (negocio)

Añadir pasos al journey. Caso de uso UC-50-06: Diseñar journey con pasos. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:62`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /marketing/journeys/{id}/steps` la atiende `MarketingController.addSteps` (src/modules/marketing/controllers/marketing.controller.ts:184). Exige sesión con alguno de los roles MARKETING_MANAGER. Valida el cuerpo como `AddJourneyStepsDto` (7 campos, 3 obligatorios). Delega en `MarketingJourneysService.addSteps`. Crea filas en marketing.journey_steps. Actualiza marketing.journey_steps. Lee marketing.content_templates, marketing.journey_steps, marketing.journeys.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER | `src/modules/marketing/controllers/marketing.controller.ts:184` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/marketing/controllers/marketing.controller.ts:184` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.content_templates` | LEE | LEE | DIRECTA | MarketingController.addSteps → MarketingJourneysService.addSteps → MarketingCampaignsRepository.findPublishedTemplate | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:602` |
| `marketing.journey_steps` | ESCRIBE | ACTUALIZA | POR_TIPO | MarketingController.addSteps → MarketingJourneysService.addSteps | `src/modules/marketing/services/marketing-journeys.service.ts:324` |
| `marketing.journey_steps` | ESCRIBE | CREA | DIRECTA | MarketingController.addSteps → MarketingJourneysService.addSteps → MarketingJourneysRepository.createJourneyStep | `src/modules/marketing/repositories/marketing-journeys.repository.ts:359` |
| `marketing.journey_steps` | LEE | LEE | DIRECTA | MarketingController.addSteps → MarketingJourneysService.addSteps → MarketingJourneysRepository.findLastStep | `src/modules/marketing/repositories/marketing-journeys.repository.ts:404` |
| `marketing.journeys` | LEE | LEE | DIRECTA | MarketingController.addSteps → MarketingJourneysService.addSteps → MarketingJourneysRepository.findJourneyForUpdate | `src/modules/marketing/repositories/marketing-journeys.repository.ts:325` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AddJourneyStepsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `steps` | `array<JourneyStepDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => JourneyStepDto)` | Pasos en orden de ejecución | `src/modules/marketing/dto/marketing.dto.ts:697` |
| `steps[].stepCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Identificador legible del paso dentro del journey | `src/modules/marketing/dto/marketing.dto.ts:634` |
| `steps[].stepType` | `string` | Sí | valores: SEND, WAIT, BRANCH, GOAL, UPDATE, EXIT, WEBHOOK | `@IsIn(JOURNEY_STEP_TYPES)` | — | `src/modules/marketing/dto/marketing.dto.ts:641` |
| `steps[].channel` | `string` | No | valores: EMAIL, SMS, PUSH | `@IsOptional()` `@IsIn(MARKETING_CHANNELS)` | — | `src/modules/marketing/dto/marketing.dto.ts:649` |
| `steps[].contentTemplateId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Plantilla publicada; obligatoria en los pasos SEND | `src/modules/marketing/dto/marketing.dto.ts:660` |
| `steps[].waitDurationMinutes` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Espera en minutos; obligatoria en los pasos WAIT | `src/modules/marketing/dto/marketing.dto.ts:671` |
| `steps[].conditionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Condición de la rama; obligatoria en los pasos BRANCH | `src/modules/marketing/dto/marketing.dto.ts:681` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "steps": [
    {
      "stepCode": "CODIGO_EJEMPLO",
      "stepType": "SEND"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "steps": [
    {
      "stepCode": "CODIGO_EJEMPLO",
      "stepType": "SEND",
      "channel": "EMAIL",
      "contentTemplateId": "00000000-0000-4000-8000-000000000001",
      "waitDurationMinutes": 1,
      "conditionJson": {}
    }
  ]
}
```

</details>

### Respuesta — `Promise<JourneyStepsResponseDto>` · DTO `JourneyStepsResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `journeyId` | `string` | Sí | formato uuid | — | Identificador asociado a journey. | `src/modules/marketing/dto/marketing.dto.ts:708` |
| `stepIds` | `array<string>` | Sí | formato uuid | — | Pasos creados, en orden | `src/modules/marketing/dto/marketing.dto.ts:718` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo un journey en borrador admite nuevos pasos; PreconditionFailedException: Un paso SEND necesita plantilla de contenido; PreconditionFailedException: La plantilla del paso SEND no existe o no está publicada; PreconditionFailedException: Un paso WAIT necesita duración; PreconditionFailedException: Un paso BRANCH necesita condición |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:123` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-06`

---

## 26. POST /marketing/segments

- **Origen:** CONTRATO
- **Nombre:** Crear un segmento y ligarlo a su read model
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MarketingController.createSegment` — `src/modules/marketing/controllers/marketing.controller.ts:69`

### Qué es y para qué sirve (negocio)

Crear un segmento y ligarlo a su read model. Caso de uso UC-50-01: Crear segmento y ligarlo a su read model. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /marketing/segments` la atiende `MarketingController.createSegment` (src/modules/marketing/controllers/marketing.controller.ts:69). Exige sesión con alguno de los roles MARKETING_MANAGER. Valida el cuerpo como `CreateSegmentDto` (6 campos, 3 obligatorios). Delega en `MarketingCampaignsService.createSegment`. Crea filas en marketing.segments. Lee marketing.segments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER | `src/modules/marketing/controllers/marketing.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.segments` | ESCRIBE | CREA | DIRECTA | MarketingController.createSegment → MarketingCampaignsService.createSegment → MarketingCampaignsService.persistSegment → MarketingCampaignsRepository.createSegment | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:251` |
| `marketing.segments` | LEE | LEE | DIRECTA | MarketingController.createSegment → MarketingCampaignsService.createSegment → MarketingCampaignsRepository.findSegmentByCode | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:314` |

### Cuerpo — DTO `CreateSegmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Opcional: el tenant sale del contexto autenticado; si se envía debe coincidir con él | `src/modules/marketing/dto/marketing.dto.ts:49` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del segmento, único por tenant | `src/modules/marketing/dto/marketing.dto.ts:60` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/marketing/dto/marketing.dto.ts:68` |
| `segmentType` | `string` | Sí | valores: DYNAMIC, STATIC | `@IsIn(['DYNAMIC', 'STATIC'])` | — | `src/modules/marketing/dto/marketing.dto.ts:75` |
| `definitionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Definición ejecutable del segmento contra el read model | `src/modules/marketing/dto/marketing.dto.ts:85` |
| `sourceReadModelId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Read model del que se deriva la membresía | `src/modules/marketing/dto/marketing.dto.ts:96` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "segmentType": "DYNAMIC"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "segmentType": "DYNAMIC",
  "definitionJson": {},
  "sourceReadModelId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SegmentResponseDto>` · DTO `SegmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/marketing/dto/marketing.dto.ts:107` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/marketing/dto/marketing.dto.ts:113` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/marketing/dto/marketing.dto.ts:119` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un segmento con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:58` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-01`

---

## 27. POST /marketing/segments/{id}/refresh

- **Origen:** CONTRATO
- **Nombre:** Recomputar la membresía del segmento
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MarketingController.refreshSegment` — `src/modules/marketing/controllers/marketing.controller.ts:86`

### Qué es y para qué sirve (negocio)

Recomputar la membresía del segmento. Caso de uso UC-50-02: Recomputar la membresía. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /marketing/segments/{id}/refresh` la atiende `MarketingController.refreshSegment` (src/modules/marketing/controllers/marketing.controller.ts:86). Exige sesión con alguno de los roles MARKETING_MANAGER, SYSTEM. Valida el cuerpo como `RefreshSegmentDto` (4 campos, 3 obligatorios). Delega en `MarketingCampaignsService.refreshSegment`. Crea filas en marketing.segment_members. Lee marketing.segment_members, marketing.segments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER, SYSTEM | `src/modules/marketing/controllers/marketing.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/marketing/controllers/marketing.controller.ts:86` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.segment_members` | ESCRIBE | CREA | DIRECTA | MarketingController.refreshSegment → MarketingCampaignsService.refreshSegment → MarketingCampaignsRepository.createSegmentMember | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:328` |
| `marketing.segment_members` | LEE | LEE | DIRECTA | MarketingController.refreshSegment → MarketingCampaignsService.refreshSegment → MarketingCampaignsRepository.findSegmentMembers | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:348` |
| `marketing.segments` | LEE | LEE | DIRECTA | MarketingController.refreshSegment → MarketingCampaignsService.refreshSegment → MarketingCampaignsRepository.findSegmentForUpdate | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:294` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RefreshSegmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `members` | `array<SegmentMemberInputDto>` | Sí | — | `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => SegmentMemberInputDto)` | Membresía recomputada completa | `src/modules/marketing/dto/marketing.dto.ts:161` |
| `members[].memberType` | `string` | Sí | valores: CONTACT, PATIENT | `@IsIn(MEMBER_TYPES)` | — | `src/modules/marketing/dto/marketing.dto.ts:129` |
| `members[].memberRefId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/marketing/dto/marketing.dto.ts:136` |
| `members[].score` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Puntuación del miembro como cadena decimal | `src/modules/marketing/dto/marketing.dto.ts:146` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "members": [
    {
      "memberType": "CONTACT",
      "memberRefId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "members": [
    {
      "memberType": "CONTACT",
      "memberRefId": "00000000-0000-4000-8000-000000000001",
      "score": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<RefreshSegmentResponseDto>` · DTO `RefreshSegmentResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `segmentId` | `string` | Sí | formato uuid | — | Identificador asociado a segment. | `src/modules/marketing/dto/marketing.dto.ts:172` |
| `added` | `number` | Sí | — | — | Miembros incorporados en este refresco | `src/modules/marketing/dto/marketing.dto.ts:178` |
| `removed` | `number` | Sí | — | — | Miembros dados de baja por salir del segmento | `src/modules/marketing/dto/marketing.dto.ts:184` |
| `estimatedSize` | `number` | Sí | — | — | Tamaño derivado del segmento tras el refresco | `src/modules/marketing/dto/marketing.dto.ts:190` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El segmento no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:68` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-02`

---

## 28. POST /marketing/touchpoints

- **Origen:** CONTRATO
- **Nombre:** Registrar un touchpoint de marketing
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MarketingController.recordTouchpoint` — `src/modules/marketing/controllers/marketing.controller.ts:303`

### Qué es y para qué sirve (negocio)

Registrar un touchpoint de marketing. Caso de uso UC-50-11: Registrar touchpoint (append-only). Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:67`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /marketing/touchpoints` la atiende `MarketingController.recordTouchpoint` (src/modules/marketing/controllers/marketing.controller.ts:303). Exige sesión con alguno de los roles SYSTEM, MARKETING_MANAGER. Valida el cuerpo como `RecordTouchpointDto` (10 campos, 4 obligatorios). Delega en `MarketingJourneysService.recordTouchpoint`. Crea filas en marketing.marketing_touchpoints. Actualiza marketing.campaign_members. Lee marketing.campaign_members, marketing.content_templates, marketing.journeys, marketing.marketing_campaigns, marketing.tracked_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MARKETING_MANAGER | `src/modules/marketing/controllers/marketing.controller.ts:303` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.campaign_members` | ESCRIBE | ACTUALIZA | POR_TIPO | MarketingController.recordTouchpoint → MarketingJourneysService.recordTouchpoint | `src/modules/marketing/services/marketing-journeys.service.ts:838` |
| `marketing.campaign_members` | LEE | LEE | DIRECTA | MarketingController.recordTouchpoint → MarketingJourneysService.recordTouchpoint → MarketingCampaignsRepository.findCampaignMemberByRefForUpdate | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:531` |
| `marketing.content_templates` | LEE | LEE | DIRECTA | MarketingController.recordTouchpoint → MarketingJourneysService.recordTouchpoint → MarketingJourneysService.assertTouchpointOriginsInTenant → MarketingCampaignsRepository.findTemplateById | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:615` |
| `marketing.journeys` | LEE | LEE | DIRECTA | MarketingController.recordTouchpoint → MarketingJourneysService.recordTouchpoint → MarketingJourneysService.assertTouchpointOriginsInTenant → MarketingJourneysRepository.findJourneyById | `src/modules/marketing/repositories/marketing-journeys.repository.ts:309` |
| `marketing.marketing_campaigns` | LEE | LEE | DIRECTA | MarketingController.recordTouchpoint → MarketingJourneysService.recordTouchpoint → MarketingJourneysService.assertTouchpointOriginsInTenant → MarketingCampaignsRepository.findCampaignByIdOrAdRef | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:433` |
| `marketing.marketing_touchpoints` | ESCRIBE | CREA | DIRECTA | MarketingController.recordTouchpoint → MarketingJourneysService.recordTouchpoint → MarketingJourneysRepository.createTouchpoint | `src/modules/marketing/repositories/marketing-journeys.repository.ts:556` |
| `marketing.tracked_links` | LEE | LEE | DIRECTA | MarketingController.recordTouchpoint → MarketingJourneysService.recordTouchpoint → MarketingJourneysService.assertTouchpointOriginsInTenant → MarketingJourneysRepository.findTrackedLinkById | `src/modules/marketing/repositories/marketing-journeys.repository.ts:581` |

### Cuerpo — DTO `RecordTouchpointDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `memberType` | `string` | Sí | valores: CONTACT, PATIENT | `@IsIn(MEMBER_TYPES)` | — | `src/modules/marketing/dto/marketing.dto.ts:1069` |
| `memberRefId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/marketing/dto/marketing.dto.ts:1076` |
| `touchType` | `string` | Sí | valores: IMPRESSION, OPEN, CLICK, VISIT, CONVERSION, REPLY | `@IsIn(TOUCH_TYPES)` | — | `src/modules/marketing/dto/marketing.dto.ts:1083` |
| `channel` | `string` | Sí | valores: EMAIL, SMS, PUSH | `@IsIn(MARKETING_CHANNELS)` | — | `src/modules/marketing/dto/marketing.dto.ts:1090` |
| `campaignId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Campaña de origen | `src/modules/marketing/dto/marketing.dto.ts:1098` |
| `journeyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Journey de origen | `src/modules/marketing/dto/marketing.dto.ts:1106` |
| `trackedLinkId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/marketing/dto/marketing.dto.ts:1114` |
| `contentTemplateId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/marketing/dto/marketing.dto.ts:1122` |
| `metadataJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Metadatos del evento para analítica | `src/modules/marketing/dto/marketing.dto.ts:1130` |
| `occurredAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo ocurrió; por defecto, ahora | `src/modules/marketing/dto/marketing.dto.ts:1141` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "memberType": "CONTACT",
  "memberRefId": "00000000-0000-4000-8000-000000000001",
  "touchType": "IMPRESSION",
  "channel": "EMAIL"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "memberType": "CONTACT",
  "memberRefId": "00000000-0000-4000-8000-000000000001",
  "touchType": "IMPRESSION",
  "channel": "EMAIL",
  "campaignId": "00000000-0000-4000-8000-000000000001",
  "journeyId": "00000000-0000-4000-8000-000000000001",
  "trackedLinkId": "00000000-0000-4000-8000-000000000001",
  "contentTemplateId": "00000000-0000-4000-8000-000000000001",
  "metadataJson": {},
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<TouchpointResponseDto>` · DTO `TouchpointResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/marketing/dto/marketing.dto.ts:1152` |
| `touchTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a touch type concept. | `src/modules/marketing/dto/marketing.dto.ts:1158` |
| `memberStatusConceptId` | `string` | No | formato uuid | — | Estado al que pasó el miembro de campaña, si había campaña | `src/modules/marketing/dto/marketing.dto.ts:1167` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Enlace no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El touchpoint necesita campaña o journey de origen |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:190` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-11`

---

## 29. POST /marketing/tracked-links

- **Origen:** CONTRATO
- **Nombre:** Crear un enlace rastreable con parámetros UTM
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MarketingController.createTrackedLink` — `src/modules/marketing/controllers/marketing.controller.ts:265`

### Qué es y para qué sirve (negocio)

Crear un enlace rastreable con parámetros UTM. Caso de uso UC-50-10: Enlace rastreable y click. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:66`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /marketing/tracked-links` la atiende `MarketingController.createTrackedLink` (src/modules/marketing/controllers/marketing.controller.ts:265). Exige sesión con alguno de los roles MARKETING_MANAGER. Valida el cuerpo como `CreateTrackedLinkDto` (7 campos, 2 obligatorios). Delega en `MarketingJourneysService.createTrackedLink`. Crea filas en marketing.tracked_links. Lee marketing.marketing_campaigns, marketing.tracked_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MARKETING_MANAGER | `src/modules/marketing/controllers/marketing.controller.ts:265` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.marketing_campaigns` | LEE | LEE | DIRECTA | MarketingController.createTrackedLink → MarketingJourneysService.createTrackedLink → MarketingCampaignsRepository.findCampaignByIdOrAdRef | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:433` |
| `marketing.tracked_links` | ESCRIBE | CREA | DIRECTA | MarketingController.createTrackedLink → MarketingJourneysService.createTrackedLink → MarketingJourneysRepository.createTrackedLink | `src/modules/marketing/repositories/marketing-journeys.repository.ts:504` |
| `marketing.tracked_links` | LEE | LEE | DIRECTA | MarketingController.createTrackedLink → MarketingJourneysService.createTrackedLink → MarketingJourneysRepository.findTrackedLinkByCode | `src/modules/marketing/repositories/marketing-journeys.repository.ts:534` |

### Cuerpo — DTO `CreateTrackedLinkDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código corto, único global | `src/modules/marketing/dto/marketing.dto.ts:898` |
| `targetUrl` | `string` | Sí | formato uri | `@IsUrl({ require_tld: false })` | Destino de la redirección | `src/modules/marketing/dto/marketing.dto.ts:905` |
| `campaignId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/marketing/dto/marketing.dto.ts:913` |
| `utmSource` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/marketing/dto/marketing.dto.ts:922` |
| `utmMedium` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/marketing/dto/marketing.dto.ts:931` |
| `utmCampaign` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/marketing/dto/marketing.dto.ts:940` |
| `utmContent` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/marketing/dto/marketing.dto.ts:949` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "targetUrl": "https://example.com/recurso"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "targetUrl": "https://example.com/recurso",
  "campaignId": "00000000-0000-4000-8000-000000000001",
  "utmSource": "valor-ejemplo",
  "utmMedium": "valor-ejemplo",
  "utmCampaign": "valor-ejemplo",
  "utmContent": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<TrackedLinkResponseDto>` · DTO `TrackedLinkResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/marketing/dto/marketing.dto.ts:960` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/marketing/dto/marketing.dto.ts:966` |
| `targetUrl` | `string` | Sí | — | — | Valor de target url mantenido por la instancia. | `src/modules/marketing/dto/marketing.dto.ts:972` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un enlace con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:177` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-10`

---

## 30. POST /marketing/tracked-links/{id}/recipient-tokens

- **Origen:** CONTRATO
- **Nombre:** Emitir el token de destinatario de un enlace rastreable
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MarketingController.issueTrackedLinkToken` — `src/modules/marketing/controllers/marketing.controller.ts:282`

### Qué es y para qué sirve (negocio)

Emitir el token de destinatario de un enlace rastreable. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /marketing/tracked-links/{id}/recipient-tokens` la atiende `MarketingController.issueTrackedLinkToken` (src/modules/marketing/controllers/marketing.controller.ts:282). Exige sesión con alguno de los roles SYSTEM, MARKETING_MANAGER. Valida el cuerpo como `IssueTrackedLinkTokenDto` (3 campos, 2 obligatorios). Delega en `MarketingJourneysService.issueTrackedLinkToken`. Lee marketing.campaign_members, marketing.marketing_campaigns, marketing.tracked_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MARKETING_MANAGER | `src/modules/marketing/controllers/marketing.controller.ts:282` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/marketing/controllers/marketing.controller.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.campaign_members` | LEE | LEE | DIRECTA | MarketingController.issueTrackedLinkToken → MarketingJourneysService.issueTrackedLinkToken → MarketingCampaignsRepository.findCampaignMemberByRef | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:517` |
| `marketing.marketing_campaigns` | LEE | LEE | DIRECTA | MarketingController.issueTrackedLinkToken → MarketingJourneysService.issueTrackedLinkToken → MarketingCampaignsRepository.findCampaignByIdOrAdRef | `src/modules/marketing/repositories/marketing-campaigns.repository.ts:433` |
| `marketing.tracked_links` | LEE | LEE | DIRECTA | MarketingController.issueTrackedLinkToken → MarketingJourneysService.issueTrackedLinkToken → MarketingJourneysRepository.findTrackedLinkById | `src/modules/marketing/repositories/marketing-journeys.repository.ts:581` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `IssueTrackedLinkTokenDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `memberType` | `string` | Sí | valores: CONTACT, PATIENT | `@IsIn(MEMBER_TYPES)` | — | `src/modules/marketing/dto/marketing.dto.ts:1009` |
| `memberRefId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/marketing/dto/marketing.dto.ts:1016` |
| `ttlSeconds` | `number` | No | mínimo 60; máximo 2592000 | `@IsOptional()` `@IsInt()` `@Min(60)` `@Max(2_592_000)` | — | `src/modules/marketing/dto/marketing.dto.ts:1026` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "memberType": "CONTACT",
  "memberRefId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "memberType": "CONTACT",
  "memberRefId": "00000000-0000-4000-8000-000000000001",
  "ttlSeconds": 604800
}
```

</details>

### Respuesta — `Promise<TrackedLinkTokenResponseDto>` · DTO `TrackedLinkTokenResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `token` | `string` | Sí | — | — | Se agrega al enlace público como `?t=<token>` | `src/modules/marketing/dto/marketing.dto.ts:1037` |
| `expiresAt` | `string` | Sí | formato date-time | — | Momento en que el token deja de ser válido. | `src/modules/marketing/dto/marketing.dto.ts:1043` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Enlace no encontrado; ResourceNotFoundException: Destinatario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:227` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `ctrl:MarketingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. GET /r/{code}

- **Origen:** CONTRATO
- **Nombre:** Resolver un enlace rastreable y registrar el click
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TrackedLinkRedirectController.resolve` — `src/modules/marketing/controllers/tracked-link-redirect.controller.ts:36`

### Qué es y para qué sirve (negocio)

Resolver un enlace rastreable y registrar el click. Caso de uso UC-50-10: Enlace rastreable y click. Dentro del módulo (descripción del modelo, en inglés): «Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51).» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/marketing/README.md:66`) · MODELO (`Mantra Core Health Context/modules/diagram_50_marketing.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /r/{code}` la atiende `TrackedLinkRedirectController.resolve` (src/modules/marketing/controllers/tracked-link-redirect.controller.ts:36). Es una ruta pública: no exige token. Delega en `MarketingJourneysService.registerClick`. Crea filas en marketing.marketing_touchpoints. Actualiza marketing.tracked_links. Lee marketing.tracked_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/marketing/controllers/tracked-link-redirect.controller.ts:36` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `marketing.marketing_touchpoints` | ESCRIBE | CREA | DIRECTA | TrackedLinkRedirectController.resolve → MarketingJourneysService.registerClick → MarketingJourneysRepository.createTouchpoint | `src/modules/marketing/repositories/marketing-journeys.repository.ts:556` |
| `marketing.tracked_links` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackedLinkRedirectController.resolve → MarketingJourneysService.registerClick | `src/modules/marketing/services/marketing-journeys.service.ts:714` |
| `marketing.tracked_links` | LEE | LEE | DIRECTA | TrackedLinkRedirectController.resolve → MarketingJourneysService.registerClick → MarketingJourneysRepository.findTrackedLinkByCodeForUpdate | `src/modules/marketing/repositories/marketing-journeys.repository.ts:542` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `code` | path | Sí | `string` | — |
| `t` | query | No | `string` | Token opaco emitido por POST /marketing/tracked-links/:id/recipient-tokens |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TrackedLinkClickResponseDto>` · DTO `TrackedLinkClickResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetUrl` | `string` | Sí | — | — | Destino al que redirigir | `src/modules/marketing/dto/marketing.dto.ts:983` |
| `clickCount` | `string` | Sí | — | — | Clicks acumulados tras registrar este | `src/modules/marketing/dto/marketing.dto.ts:989` |
| `touchpointId` | `string` | No | formato uuid | — | Touchpoint del click; ausente si el click no trae un token de destinatario válido | `src/modules/marketing/dto/marketing.dto.ts:999` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Enlace no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El enlace no está activo; PreconditionFailedException: El token del enlace no es válido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/marketing.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/marketing/controllers/marketing.controller.spec.ts:243` |

### Flujos

- Módulo 50 — Marketing Automation, Journeys y Atribución — etapa `UC-50-10`

---

