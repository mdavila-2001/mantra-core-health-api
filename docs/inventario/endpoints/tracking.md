<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `tracking`

- **Bloque:** Integraciones y Contratos (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)
- **Operaciones:** 11 (11 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 1 · MEDIO 10 · BAJO 0
- **Tablas distintas que tocan:** 8
- **Respuestas de error y detalle contractual:** `openapi/endpoints/tracking.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/tracking/milestone-definitions` | Definir el catálogo de hitos esperados | MEDIO | 2 | TRACKING_ADMIN |
| 2 | POST | `/tracking/shipments/{id}/cancel` | Cancelar el envío y cerrar el sujeto | MEDIO | 5 | LOGISTICS_OPERATOR, TRACKING_ADMIN |
| 3 | POST | `/tracking/shipments/{id}/delivery-proof` | Registrar la prueba de entrega y cerrar | MEDIO | 8 | COURIER, LOGISTICS_OPERATOR, TRACKING_ADMIN |
| 4 | POST | `/tracking/shipments/{id}/dispatch` | Despachar el envío | MEDIO | 5 | LOGISTICS_OPERATOR, TRACKING_ADMIN |
| 5 | POST | `/tracking/shipments/{id}/eta/recompute` | Registrar una estimación de llegada | MEDIO | 5 | SYSTEM, LOGISTICS_OPERATOR, TRACKING_ADMIN |
| 6 | POST | `/tracking/shipments/{id}/exception` | Marcar una excepción o reintento de entrega | MEDIO | 6 | COURIER, LOGISTICS_OPERATOR, TRACKING_ADMIN |
| 7 | POST | `/tracking/shipments/{id}/handoffs` | Registrar el traspaso entre responsables | MEDIO | 5 | LOGISTICS_OPERATOR, COURIER, TRACKING_ADMIN |
| 8 | POST | `/tracking/sla/scan` | Barrer los compromisos de hito vencidos | MEDIO | 4 | SYSTEM |
| 9 | POST | `/tracking/trackable-subjects` | Abrir un sujeto rastreable y su envío | MEDIO | 5 | TRACKING_ADMIN, LOGISTICS_OPERATOR |
| 10 | POST | `/tracking/trackable-subjects/{id}/events` | Registrar un evento y avanzar el hito | MEDIO | 4 | LOGISTICS_OPERATOR, COURIER, TRACKING_ADMIN |
| 11 | POST | `/tracking/webhooks/carriers/{carrierCode}` | Ingerir el webhook del transportista | ALTO | 7 | pública |

---

## 1. POST /tracking/milestone-definitions

- **Origen:** CONTRATO
- **Nombre:** Definir el catálogo de hitos esperados
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TrackingController.defineMilestones` — `src/modules/tracking/controllers/tracking.controller.ts:73`

### Qué es y para qué sirve (negocio)

Definir el catálogo de hitos esperados. Caso de uso UC-37-02: Catálogo de hitos esperados. Dentro del módulo (descripción del modelo, en inglés): «Business-level tracking of anything that moves or progresses: pharmacy deliveries, lab specimen transport, ambulance dispatch, referral fulfilment, claim processing.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/tracking/README.md:43`) · MODELO (`Mantra Core Health Context/modules/diagram_37_tracking.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /tracking/milestone-definitions` la atiende `TrackingController.defineMilestones` (src/modules/tracking/controllers/tracking.controller.ts:73). Exige sesión con alguno de los roles TRACKING_ADMIN. Valida el cuerpo como `DefineMilestonesDto` (8 campos, 5 obligatorios). Delega en `TrackingService.defineMilestones`. Crea filas en tracking.milestone_definitions. Lee tracking.milestone_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: TRACKING_ADMIN | `src/modules/tracking/controllers/tracking.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `tracking.milestone_definitions` | ESCRIBE | CREA | DIRECTA | TrackingController.defineMilestones → TrackingService.defineMilestones → TrackingRepository.createMilestoneDefinition | `src/modules/tracking/repositories/tracking.repository.ts:398` |
| `tracking.milestone_definitions` | LEE | LEE | DIRECTA | TrackingController.defineMilestones → TrackingService.defineMilestones → TrackingRepository.findMilestonesBySubjectType | `src/modules/tracking/repositories/tracking.repository.ts:464` |

### Cuerpo — DTO `DefineMilestonesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/tracking/dto/tracking.dto.ts:228` |
| `subjectType` | `string` | Sí | valores: SPECIMEN, ORDER, DEVICE | `@IsIn(SUBJECT_TYPES)` | — | `src/modules/tracking/dto/tracking.dto.ts:235` |
| `milestones` | `array<MilestoneDefinitionDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => MilestoneDefinitionDto)` | Hitos esperados en orden, al menos uno | `src/modules/tracking/dto/tracking.dto.ts:248` |
| `milestones[].code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del hito, único por tipo de sujeto | `src/modules/tracking/dto/tracking.dto.ts:182` |
| `milestones[].name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/tracking/dto/tracking.dto.ts:190` |
| `milestones[].milestoneStatus` | `string` | Sí | valores: CREATED, PREPARING, IN_TRANSIT, HANDOFF, DELIVERED, CANCELLED | `@IsIn(MILESTONE_STATUSES)` | — | `src/modules/tracking/dto/tracking.dto.ts:197` |
| `milestones[].isTerminal` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Alcanzarlo cierra el seguimiento del sujeto | `src/modules/tracking/dto/tracking.dto.ts:208` |
| `milestones[].slaMinutes` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Minutos de compromiso para alcanzarlo | `src/modules/tracking/dto/tracking.dto.ts:217` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "subjectType": "SPECIMEN",
  "milestones": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "milestoneStatus": "CREATED"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "subjectType": "SPECIMEN",
  "milestones": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "milestoneStatus": "CREATED",
      "isTerminal": false,
      "slaMinutes": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<MilestonesResponseDto>` · DTO `MilestonesResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `subjectTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a subject type concept. | `src/modules/tracking/dto/tracking.dto.ts:259` |
| `milestoneIds` | `array<string>` | Sí | formato uuid | — | Hitos creados, en orden | `src/modules/tracking/dto/tracking.dto.ts:269` |
| `skipped` | `number` | Sí | — | — | Hitos omitidos por tener ya ese código | `src/modules/tracking/dto/tracking.dto.ts:275` |
| `terminalCount` | `number` | Sí | — | — | Hitos terminales declarados | `src/modules/tracking/dto/tracking.dto.ts:281` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El tipo de sujeto ya tiene hito terminal |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo puede haber un hito terminal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/tracking.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/tracking/controllers/tracking.controller.spec.ts:56` |

### Flujos

- Módulo 37 — Seguimiento y Trazabilidad de Envíos — etapa `UC-37-02`

---

## 2. POST /tracking/shipments/{id}/cancel

- **Origen:** CONTRATO
- **Nombre:** Cancelar el envío y cerrar el sujeto
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TrackingController.cancelShipment` — `src/modules/tracking/controllers/tracking.controller.ts:204`

### Qué es y para qué sirve (negocio)

Cancelar el envío y cerrar el sujeto. Caso de uso UC-37-10: Cancelar y cerrar. Dentro del módulo (descripción del modelo, en inglés): «Business-level tracking of anything that moves or progresses: pharmacy deliveries, lab specimen transport, ambulance dispatch, referral fulfilment, claim processing.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/tracking/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_37_tracking.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /tracking/shipments/{id}/cancel` la atiende `TrackingController.cancelShipment` (src/modules/tracking/controllers/tracking.controller.ts:204). Exige sesión con alguno de los roles LOGISTICS_OPERATOR, TRACKING_ADMIN. Valida el cuerpo como `CancelShipmentDto` (1 campo, 1 obligatorio). Delega en `TrackingService.cancelShipment`. Crea filas en tracking.tracking_events. Actualiza tracking.shipments, tracking.trackable_subjects. Lee tracking.shipments, tracking.trackable_subjects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: LOGISTICS_OPERATOR, TRACKING_ADMIN | `src/modules/tracking/controllers/tracking.controller.ts:204` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/tracking/controllers/tracking.controller.ts:204` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `tracking.shipments` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackingController.cancelShipment → TrackingService.cancelShipment | `src/modules/tracking/services/tracking.service.ts:1032` |
| `tracking.shipments` | LEE | LEE | DIRECTA | TrackingController.cancelShipment → TrackingService.cancelShipment → TrackingRepository.findShipmentForUpdate | `src/modules/tracking/repositories/tracking.repository.ts:342` |
| `tracking.trackable_subjects` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackingController.cancelShipment → TrackingService.cancelShipment | `src/modules/tracking/services/tracking.service.ts:1035` |
| `tracking.trackable_subjects` | LEE | LEE | DIRECTA | TrackingController.cancelShipment → TrackingService.cancelShipment → TrackingRepository.findSubjectForUpdate | `src/modules/tracking/repositories/tracking.repository.ts:257` |
| `tracking.tracking_events` | ESCRIBE | CREA | DIRECTA | TrackingController.cancelShipment → TrackingService.cancelShipment → TrackingRepository.createEvent | `src/modules/tracking/repositories/tracking.repository.ts:482` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CancelShipmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | — | `@IsString()` | Por qué se cancela | `src/modules/tracking/dto/tracking.dto.ts:988` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<CancelShipmentResponseDto>` · DTO `CancelShipmentResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `shipmentId` | `string` | Sí | formato uuid | — | Identificador asociado a shipment. | `src/modules/tracking/dto/tracking.dto.ts:999` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/tracking/dto/tracking.dto.ts:1005` |
| `subjectStateConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda el sujeto | `src/modules/tracking/dto/tracking.dto.ts:1014` |
| `eventId` | `string` | Sí | formato uuid | — | Identificador asociado a event. | `src/modules/tracking/dto/tracking.dto.ts:1020` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Envío no encontrado; ResourceNotFoundException: Sujeto rastreable no encontrado |
| 409 | `CONFLICT` | ConflictException: El envío ya está cancelado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un envío entregado no se cancela |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/tracking.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/tracking/controllers/tracking.controller.spec.ts:153` |

### Flujos

- Módulo 37 — Seguimiento y Trazabilidad de Envíos — etapa `UC-37-10`

---

## 3. POST /tracking/shipments/{id}/delivery-proof

- **Origen:** CONTRATO
- **Nombre:** Registrar la prueba de entrega y cerrar
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TrackingController.recordDeliveryProof` — `src/modules/tracking/controllers/tracking.controller.ts:171`

### Qué es y para qué sirve (negocio)

Registrar la prueba de entrega y cerrar. Caso de uso UC-37-08: Prueba de entrega y cierre. Dentro del módulo (descripción del modelo, en inglés): «Business-level tracking of anything that moves or progresses: pharmacy deliveries, lab specimen transport, ambulance dispatch, referral fulfilment, claim processing.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/tracking/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_37_tracking.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /tracking/shipments/{id}/delivery-proof` la atiende `TrackingController.recordDeliveryProof` (src/modules/tracking/controllers/tracking.controller.ts:171). Exige sesión con alguno de los roles COURIER, LOGISTICS_OPERATOR, TRACKING_ADMIN. Valida el cuerpo como `RecordDeliveryProofDto` (7 campos, 1 obligatorio). Delega en `TrackingService.recordDeliveryProof`. Crea filas en tracking.delivery_proofs, tracking.tracking_events. Actualiza tracking.shipments, tracking.trackable_subjects. Lee tracking.delivery_proofs, tracking.milestone_definitions, tracking.shipments, tracking.trackable_subjects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: COURIER, LOGISTICS_OPERATOR, TRACKING_ADMIN | `src/modules/tracking/controllers/tracking.controller.ts:171` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/tracking/controllers/tracking.controller.ts:171` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `tracking.delivery_proofs` | ESCRIBE | CREA | DIRECTA | TrackingController.recordDeliveryProof → TrackingService.recordDeliveryProof → TrackingRepository.createDeliveryProof | `src/modules/tracking/repositories/tracking.repository.ts:705` |
| `tracking.delivery_proofs` | LEE | LEE | DIRECTA | TrackingController.recordDeliveryProof → TrackingService.recordDeliveryProof → TrackingRepository.findVerifiedProof | `src/modules/tracking/repositories/tracking.repository.ts:729` |
| `tracking.milestone_definitions` | LEE | LEE | DIRECTA | TrackingController.recordDeliveryProof → TrackingService.recordDeliveryProof → TrackingRepository.findMilestonesBySubjectType | `src/modules/tracking/repositories/tracking.repository.ts:464` |
| `tracking.shipments` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackingController.recordDeliveryProof → TrackingService.recordDeliveryProof | `src/modules/tracking/services/tracking.service.ts:854` |
| `tracking.shipments` | LEE | LEE | DIRECTA | TrackingController.recordDeliveryProof → TrackingService.recordDeliveryProof → TrackingRepository.findShipmentForUpdate | `src/modules/tracking/repositories/tracking.repository.ts:342` |
| `tracking.trackable_subjects` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackingController.recordDeliveryProof → TrackingService.recordDeliveryProof | `src/modules/tracking/services/tracking.service.ts:868` |
| `tracking.trackable_subjects` | LEE | LEE | DIRECTA | TrackingController.recordDeliveryProof → TrackingService.recordDeliveryProof → TrackingRepository.findSubjectForUpdate | `src/modules/tracking/repositories/tracking.repository.ts:257` |
| `tracking.tracking_events` | ESCRIBE | CREA | DIRECTA | TrackingController.recordDeliveryProof → TrackingService.recordDeliveryProof → TrackingRepository.createEvent | `src/modules/tracking/repositories/tracking.repository.ts:482` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordDeliveryProofDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `proofType` | `string` | Sí | valores: SIGNATURE, PHOTO | `@IsIn(PROOF_TYPES)` | — | `src/modules/tracking/dto/tracking.dto.ts:791` |
| `recipientName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Quién recibió | `src/modules/tracking/dto/tracking.dto.ts:800` |
| `signatureFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Firma capturada; obligatoria si el tipo es SIGNATURE | `src/modules/tracking/dto/tracking.dto.ts:811` |
| `photoFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Foto de la entrega; obligatoria si el tipo es PHOTO | `src/modules/tracking/dto/tracking.dto.ts:822` |
| `latitude` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/tracking/dto/tracking.dto.ts:830` |
| `longitude` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/tracking/dto/tracking.dto.ts:838` |
| `locationText` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/tracking/dto/tracking.dto.ts:847` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "proofType": "SIGNATURE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "proofType": "SIGNATURE",
  "recipientName": "Nombre de ejemplo",
  "signatureFileId": "00000000-0000-4000-8000-000000000001",
  "photoFileId": "00000000-0000-4000-8000-000000000001",
  "latitude": "valor-ejemplo",
  "longitude": "valor-ejemplo",
  "locationText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<DeliveryProofResponseDto>` · DTO `DeliveryProofResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/tracking/dto/tracking.dto.ts:858` |
| `shipmentId` | `string` | Sí | formato uuid | — | Identificador asociado a shipment. | `src/modules/tracking/dto/tracking.dto.ts:864` |
| `shipmentStatusConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda el envío | `src/modules/tracking/dto/tracking.dto.ts:873` |
| `subjectStateConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda el sujeto | `src/modules/tracking/dto/tracking.dto.ts:882` |
| `eventId` | `string` | Sí | formato uuid | — | Evento de entrega registrado | `src/modules/tracking/dto/tracking.dto.ts:888` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Envío no encontrado; ResourceNotFoundException: Sujeto rastreable no encontrado |
| 409 | `CONFLICT` | ConflictException: El envío ya está entregado; ConflictException: El envío ya tiene prueba de entrega verificada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una prueba por firma necesita el archivo de firma; PreconditionFailedException: Una prueba por foto necesita la foto; PreconditionFailedException: El envío no admite entrega en su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/tracking.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/tracking/controllers/tracking.controller.spec.ts:136` |

### Flujos

- Módulo 37 — Seguimiento y Trazabilidad de Envíos — etapa `UC-37-08`

---

## 4. POST /tracking/shipments/{id}/dispatch

- **Origen:** CONTRATO
- **Nombre:** Despachar el envío
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TrackingController.dispatchShipment` — `src/modules/tracking/controllers/tracking.controller.ts:88`

### Qué es y para qué sirve (negocio)

Despachar el envío. Caso de uso UC-37-03: Despachar envío. Dentro del módulo (descripción del modelo, en inglés): «Business-level tracking of anything that moves or progresses: pharmacy deliveries, lab specimen transport, ambulance dispatch, referral fulfilment, claim processing.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/tracking/README.md:44`) · MODELO (`Mantra Core Health Context/modules/diagram_37_tracking.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /tracking/shipments/{id}/dispatch` la atiende `TrackingController.dispatchShipment` (src/modules/tracking/controllers/tracking.controller.ts:88). Exige sesión con alguno de los roles LOGISTICS_OPERATOR, TRACKING_ADMIN. Valida el cuerpo como `DispatchShipmentDto` (2 campos, 0 obligatorios). Delega en `TrackingService.dispatchShipment`. Crea filas en tracking.tracking_events. Actualiza tracking.shipments, tracking.trackable_subjects. Lee tracking.shipments, tracking.trackable_subjects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: LOGISTICS_OPERATOR, TRACKING_ADMIN | `src/modules/tracking/controllers/tracking.controller.ts:88` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/tracking/controllers/tracking.controller.ts:88` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `tracking.shipments` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackingController.dispatchShipment → TrackingService.dispatchShipment | `src/modules/tracking/services/tracking.service.ts:356` |
| `tracking.shipments` | LEE | LEE | DIRECTA | TrackingController.dispatchShipment → TrackingService.dispatchShipment → TrackingRepository.findShipmentForUpdate | `src/modules/tracking/repositories/tracking.repository.ts:342` |
| `tracking.trackable_subjects` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackingController.dispatchShipment → TrackingService.dispatchShipment | `src/modules/tracking/services/tracking.service.ts:362` |
| `tracking.trackable_subjects` | LEE | LEE | DIRECTA | TrackingController.dispatchShipment → TrackingService.dispatchShipment → TrackingRepository.findSubjectForUpdate | `src/modules/tracking/repositories/tracking.repository.ts:257` |
| `tracking.tracking_events` | ESCRIBE | CREA | DIRECTA | TrackingController.dispatchShipment → TrackingService.dispatchShipment → TrackingRepository.createEvent | `src/modules/tracking/repositories/tracking.repository.ts:482` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DispatchShipmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `locationText` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Dónde se despachó | `src/modules/tracking/dto/tracking.dto.ts:297` |
| `assignedCourierUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Mensajero que se hace cargo | `src/modules/tracking/dto/tracking.dto.ts:308` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "locationText": "valor-ejemplo",
  "assignedCourierUserId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DispatchResponseDto>` · DTO `DispatchResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/tracking/dto/tracking.dto.ts:319` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/tracking/dto/tracking.dto.ts:325` |
| `eventId` | `string` | Sí | formato uuid | — | Evento de despacho registrado | `src/modules/tracking/dto/tracking.dto.ts:331` |
| `dispatchedAt` | `string` | Sí | formato date-time | — | Valor de dispatched at mantenido por la instancia. | `src/modules/tracking/dto/tracking.dto.ts:337` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Envío no encontrado; ResourceNotFoundException: Sujeto rastreable no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El envío no está en preparación; PreconditionFailedException: El despacho necesita transportista o mensajero asignado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/tracking.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/tracking/controllers/tracking.controller.spec.ts:66` |

### Flujos

- Módulo 37 — Seguimiento y Trazabilidad de Envíos — etapa `UC-37-03`

---

## 5. POST /tracking/shipments/{id}/eta/recompute

- **Origen:** CONTRATO
- **Nombre:** Registrar una estimación de llegada
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TrackingController.recomputeEta` — `src/modules/tracking/controllers/tracking.controller.ts:155`

### Qué es y para qué sirve (negocio)

Registrar una estimación de llegada. Caso de uso UC-37-07: Estimación de llegada. Dentro del módulo (descripción del modelo, en inglés): «Business-level tracking of anything that moves or progresses: pharmacy deliveries, lab specimen transport, ambulance dispatch, referral fulfilment, claim processing.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/tracking/README.md:48`) · MODELO (`Mantra Core Health Context/modules/diagram_37_tracking.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /tracking/shipments/{id}/eta/recompute` la atiende `TrackingController.recomputeEta` (src/modules/tracking/controllers/tracking.controller.ts:155). Exige sesión con alguno de los roles SYSTEM, LOGISTICS_OPERATOR, TRACKING_ADMIN. Valida el cuerpo como `RecomputeEtaDto` (4 campos, 2 obligatorios). Delega en `TrackingService.recomputeEta`. Crea filas en tracking.eta_estimates. Actualiza tracking.shipments. Lee tracking.eta_estimates, tracking.shipments, tracking.trackable_subjects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, LOGISTICS_OPERATOR, TRACKING_ADMIN | `src/modules/tracking/controllers/tracking.controller.ts:155` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/tracking/controllers/tracking.controller.ts:155` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `tracking.eta_estimates` | ESCRIBE | CREA | DIRECTA | TrackingController.recomputeEta → TrackingService.recomputeEta → TrackingRepository.createEtaEstimate | `src/modules/tracking/repositories/tracking.repository.ts:627` |
| `tracking.eta_estimates` | LEE | LEE | DIRECTA | TrackingController.recomputeEta → TrackingService.recomputeEta → TrackingRepository.findLatestEstimate | `src/modules/tracking/repositories/tracking.repository.ts:648` |
| `tracking.shipments` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackingController.recomputeEta → TrackingService.recomputeEta | `src/modules/tracking/services/tracking.service.ts:738` |
| `tracking.shipments` | LEE | LEE | DIRECTA | TrackingController.recomputeEta → TrackingService.recomputeEta → TrackingRepository.findShipmentForUpdate | `src/modules/tracking/repositories/tracking.repository.ts:342` |
| `tracking.trackable_subjects` | LEE | LEE | DIRECTA | TrackingController.recomputeEta → TrackingService.recomputeEta → TrackingRepository.findSubjectForUpdate | `src/modules/tracking/repositories/tracking.repository.ts:257` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecomputeEtaDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `estimatedArrivalAt` | `string` | Sí | formato date-time | `@IsISO8601()` | Llegada estimada | `src/modules/tracking/dto/tracking.dto.ts:710` |
| `method` | `string` | Sí | valores: CARRIER, DISTANCE, MANUAL | `@IsIn(ETA_METHODS)` | — | `src/modules/tracking/dto/tracking.dto.ts:717` |
| `confidencePct` | `number` | No | mínimo 0; máximo 100 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(100)` | Confianza de la estimación | `src/modules/tracking/dto/tracking.dto.ts:731` |
| `distanceM` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Distancia restante en metros | `src/modules/tracking/dto/tracking.dto.ts:739` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "estimatedArrivalAt": "2026-07-31T12:00:00.000Z",
  "method": "CARRIER"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "estimatedArrivalAt": "2026-07-31T12:00:00.000Z",
  "method": "CARRIER",
  "confidencePct": 1,
  "distanceM": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<EtaResponseDto>` · DTO `EtaResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Estimación registrada | `src/modules/tracking/dto/tracking.dto.ts:750` |
| `shipmentId` | `string` | Sí | formato uuid | — | Identificador asociado a shipment. | `src/modules/tracking/dto/tracking.dto.ts:756` |
| `estimatedArrivalAt` | `string` | Sí | formato date-time | — | Llegada estimada del envío | `src/modules/tracking/dto/tracking.dto.ts:765` |
| `applied` | `boolean` | Sí | — | — | true si esta estimación pasó a ser la vigente del envío | `src/modules/tracking/dto/tracking.dto.ts:773` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Envío no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El envío ya no admite estimaciones |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/tracking.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/tracking/controllers/tracking.controller.spec.ts:126` |

### Flujos

- Módulo 37 — Seguimiento y Trazabilidad de Envíos — etapa `UC-37-07`

---

## 6. POST /tracking/shipments/{id}/exception

- **Origen:** CONTRATO
- **Nombre:** Marcar una excepción o reintento de entrega
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TrackingController.recordException` — `src/modules/tracking/controllers/tracking.controller.ts:187`

### Qué es y para qué sirve (negocio)

Marcar una excepción o reintento de entrega. Caso de uso UC-37-09: Excepción o reintento. Dentro del módulo (descripción del modelo, en inglés): «Business-level tracking of anything that moves or progresses: pharmacy deliveries, lab specimen transport, ambulance dispatch, referral fulfilment, claim processing.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/tracking/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_37_tracking.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /tracking/shipments/{id}/exception` la atiende `TrackingController.recordException` (src/modules/tracking/controllers/tracking.controller.ts:187). Exige sesión con alguno de los roles COURIER, LOGISTICS_OPERATOR, TRACKING_ADMIN. Valida el cuerpo como `RecordExceptionDto` (4 campos, 1 obligatorio). Delega en `TrackingService.recordException`. Crea filas en tracking.delivery_proofs, tracking.tracking_events. Actualiza tracking.shipments, tracking.trackable_subjects. Lee tracking.shipments, tracking.trackable_subjects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: COURIER, LOGISTICS_OPERATOR, TRACKING_ADMIN | `src/modules/tracking/controllers/tracking.controller.ts:187` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/tracking/controllers/tracking.controller.ts:187` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `tracking.delivery_proofs` | ESCRIBE | CREA | DIRECTA | TrackingController.recordException → TrackingService.recordException → TrackingRepository.createDeliveryProof | `src/modules/tracking/repositories/tracking.repository.ts:705` |
| `tracking.shipments` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackingController.recordException → TrackingService.recordException | `src/modules/tracking/services/tracking.service.ts:945` |
| `tracking.shipments` | LEE | LEE | DIRECTA | TrackingController.recordException → TrackingService.recordException → TrackingRepository.findShipmentForUpdate | `src/modules/tracking/repositories/tracking.repository.ts:342` |
| `tracking.trackable_subjects` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackingController.recordException → TrackingService.recordException | `src/modules/tracking/services/tracking.service.ts:949` |
| `tracking.trackable_subjects` | LEE | LEE | DIRECTA | TrackingController.recordException → TrackingService.recordException → TrackingRepository.findSubjectForUpdate | `src/modules/tracking/repositories/tracking.repository.ts:257` |
| `tracking.tracking_events` | ESCRIBE | CREA | DIRECTA | TrackingController.recordException → TrackingService.recordException → TrackingRepository.createEvent | `src/modules/tracking/repositories/tracking.repository.ts:482` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordExceptionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | — | `@IsString()` | Qué pasó | `src/modules/tracking/dto/tracking.dto.ts:902` |
| `scheduleRetry` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Se reprograma un nuevo intento de entrega | `src/modules/tracking/dto/tracking.dto.ts:913` |
| `locationText` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/tracking/dto/tracking.dto.ts:922` |
| `photoFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Foto del intento fallido; deja constancia del intento | `src/modules/tracking/dto/tracking.dto.ts:933` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo",
  "scheduleRetry": false,
  "locationText": "valor-ejemplo",
  "photoFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ExceptionResponseDto>` · DTO `ExceptionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `shipmentId` | `string` | Sí | formato uuid | — | Identificador asociado a shipment. | `src/modules/tracking/dto/tracking.dto.ts:944` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/tracking/dto/tracking.dto.ts:950` |
| `priorityConceptId` | `string` | Sí | formato uuid | — | Prioridad a la que sube el sujeto | `src/modules/tracking/dto/tracking.dto.ts:959` |
| `eventId` | `string` | Sí | formato uuid | — | Identificador asociado a event. | `src/modules/tracking/dto/tracking.dto.ts:965` |
| `failedAttemptProofId` | `string` | No | formato uuid | — | Constancia del intento fallido | `src/modules/tracking/dto/tracking.dto.ts:974` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Envío no encontrado; ResourceNotFoundException: Sujeto rastreable no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El envío ya no admite excepciones |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/tracking.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/tracking/controllers/tracking.controller.spec.ts:152` |

### Flujos

- Módulo 37 — Seguimiento y Trazabilidad de Envíos — etapa `UC-37-09`

---

## 7. POST /tracking/shipments/{id}/handoffs

- **Origen:** CONTRATO
- **Nombre:** Registrar el traspaso entre responsables
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TrackingController.recordHandoff` — `src/modules/tracking/controllers/tracking.controller.ts:139`

### Qué es y para qué sirve (negocio)

Registrar el traspaso entre responsables. Caso de uso UC-37-06: Traspaso entre responsables. Dentro del módulo (descripción del modelo, en inglés): «Business-level tracking of anything that moves or progresses: pharmacy deliveries, lab specimen transport, ambulance dispatch, referral fulfilment, claim processing.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/tracking/README.md:47`) · MODELO (`Mantra Core Health Context/modules/diagram_37_tracking.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /tracking/shipments/{id}/handoffs` la atiende `TrackingController.recordHandoff` (src/modules/tracking/controllers/tracking.controller.ts:139). Exige sesión con alguno de los roles LOGISTICS_OPERATOR, COURIER, TRACKING_ADMIN. Valida el cuerpo como `RecordHandoffDto` (9 campos, 1 obligatorio). Delega en `TrackingService.recordHandoff`. Crea filas en tracking.shipment_handoffs, tracking.tracking_events. Actualiza tracking.shipments. Lee tracking.shipments, tracking.tracking_carriers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: LOGISTICS_OPERATOR, COURIER, TRACKING_ADMIN | `src/modules/tracking/controllers/tracking.controller.ts:139` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/tracking/controllers/tracking.controller.ts:139` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `tracking.shipment_handoffs` | ESCRIBE | CREA | DIRECTA | TrackingController.recordHandoff → TrackingService.recordHandoff → TrackingRepository.createHandoff | `src/modules/tracking/repositories/tracking.repository.ts:577` |
| `tracking.shipments` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackingController.recordHandoff → TrackingService.recordHandoff | `src/modules/tracking/services/tracking.service.ts:661` |
| `tracking.shipments` | LEE | LEE | DIRECTA | TrackingController.recordHandoff → TrackingService.recordHandoff → TrackingRepository.findShipmentForUpdate | `src/modules/tracking/repositories/tracking.repository.ts:342` |
| `tracking.tracking_carriers` | LEE | LEE | DIRECTA | TrackingController.recordHandoff → TrackingService.recordHandoff → TrackingRepository.findCarrierById | `src/modules/tracking/repositories/tracking.repository.ts:748` |
| `tracking.tracking_events` | ESCRIBE | CREA | DIRECTA | TrackingController.recordHandoff → TrackingService.recordHandoff → TrackingRepository.createEvent | `src/modules/tracking/repositories/tracking.repository.ts:482` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordHandoffDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `handoffType` | `string` | Sí | valores: PICKUP, TRANSFER, DROPOFF | `@IsIn(HANDOFF_TYPES)` | — | `src/modules/tracking/dto/tracking.dto.ts:587` |
| `fromPartyType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo de quien entrega | `src/modules/tracking/dto/tracking.dto.ts:596` |
| `fromPartyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/tracking/dto/tracking.dto.ts:604` |
| `toPartyType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo de quien recibe | `src/modules/tracking/dto/tracking.dto.ts:613` |
| `toPartyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/tracking/dto/tracking.dto.ts:621` |
| `newCarrierId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Transportista que pasa a ser responsable | `src/modules/tracking/dto/tracking.dto.ts:632` |
| `newCourierUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Mensajero que pasa a ser responsable | `src/modules/tracking/dto/tracking.dto.ts:643` |
| `locationText` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/tracking/dto/tracking.dto.ts:652` |
| `occurredAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/tracking/dto/tracking.dto.ts:660` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "handoffType": "PICKUP"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "handoffType": "PICKUP",
  "fromPartyType": "valor-ejemplo",
  "fromPartyId": "00000000-0000-4000-8000-000000000001",
  "toPartyType": "valor-ejemplo",
  "toPartyId": "00000000-0000-4000-8000-000000000001",
  "newCarrierId": "00000000-0000-4000-8000-000000000001",
  "newCourierUserId": "00000000-0000-4000-8000-000000000001",
  "locationText": "valor-ejemplo",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<HandoffResponseDto>` · DTO `HandoffResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/tracking/dto/tracking.dto.ts:671` |
| `shipmentId` | `string` | Sí | formato uuid | — | Identificador asociado a shipment. | `src/modules/tracking/dto/tracking.dto.ts:677` |
| `eventId` | `string` | Sí | formato uuid | — | Evento de traspaso registrado | `src/modules/tracking/dto/tracking.dto.ts:683` |
| `carrierId` | `string` | No | formato uuid | — | Transportista responsable tras el traspaso | `src/modules/tracking/dto/tracking.dto.ts:692` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Envío no encontrado; ResourceNotFoundException: Transportista no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El envío ya no admite traspasos; PreconditionFailedException: El transportista no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/tracking.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/tracking/controllers/tracking.controller.spec.ts:109` |

### Flujos

- Módulo 37 — Seguimiento y Trazabilidad de Envíos — etapa `UC-37-06`

---

## 8. POST /tracking/sla/scan

- **Origen:** CONTRATO
- **Nombre:** Barrer los compromisos de hito vencidos
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TrackingController.scanSla` — `src/modules/tracking/controllers/tracking.controller.ts:220`

### Qué es y para qué sirve (negocio)

Barrer los compromisos de hito vencidos. Caso de uso UC-37-11: Detectar incumplimiento de hito. Dentro del módulo (descripción del modelo, en inglés): «Business-level tracking of anything that moves or progresses: pharmacy deliveries, lab specimen transport, ambulance dispatch, referral fulfilment, claim processing.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/tracking/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_37_tracking.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /tracking/sla/scan` la atiende `TrackingController.scanSla` (src/modules/tracking/controllers/tracking.controller.ts:220). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `ScanSlaDto` (1 campo, 0 obligatorios). Delega en `TrackingService.scanSla`. Crea filas en tracking.tracking_events. Actualiza tracking.trackable_subjects. Lee tracking.milestone_definitions, tracking.trackable_subjects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/tracking/controllers/tracking.controller.ts:220` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `tracking.milestone_definitions` | LEE | LEE | DIRECTA | TrackingController.scanSla → TrackingService.scanSla → TrackingRepository.findMilestonesBySubjectType | `src/modules/tracking/repositories/tracking.repository.ts:464` |
| `tracking.trackable_subjects` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackingController.scanSla → TrackingService.scanSla | `src/modules/tracking/services/tracking.service.ts:1117` |
| `tracking.trackable_subjects` | LEE | LEE | DIRECTA | TrackingController.scanSla → TrackingService.scanSla → TrackingRepository.findOpenSubjectsForScan | `src/modules/tracking/repositories/tracking.repository.ts:770` |
| `tracking.tracking_events` | ESCRIBE | CREA | DIRECTA | TrackingController.scanSla → TrackingService.scanSla → TrackingRepository.createEvent | `src/modules/tracking/repositories/tracking.repository.ts:482` |

### Cuerpo — DTO `ScanSlaDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `batchSize` | `number` | No | mínimo 1; máximo 1000 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(1000)` | Sujetos a revisar por barrido | `src/modules/tracking/dto/tracking.dto.ts:1040` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "batchSize": 100
}
```

</details>

### Respuesta — `Promise<ScanSlaResponseDto>` · DTO `ScanSlaResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `scanned` | `number` | Sí | — | — | Sujetos abiertos revisados | `src/modules/tracking/dto/tracking.dto.ts:1051` |
| `breached` | `number` | Sí | — | — | Sujetos con incumplimiento de compromiso detectado | `src/modules/tracking/dto/tracking.dto.ts:1059` |
| `escalated` | `number` | Sí | — | — | Sujetos cuya prioridad subió por el incumplimiento | `src/modules/tracking/dto/tracking.dto.ts:1067` |
| `eventIds` | `array<string>` | Sí | formato uuid | — | Eventos de incumplimiento creados | `src/modules/tracking/dto/tracking.dto.ts:1077` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/tracking.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/tracking/controllers/tracking.controller.spec.ts:172` |

### Flujos

- Módulo 37 — Seguimiento y Trazabilidad de Envíos — etapa `UC-37-11`

---

## 9. POST /tracking/trackable-subjects

- **Origen:** CONTRATO
- **Nombre:** Abrir un sujeto rastreable y su envío
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TrackingController.openSubject` — `src/modules/tracking/controllers/tracking.controller.ts:57`

### Qué es y para qué sirve (negocio)

Abrir un sujeto rastreable y su envío. Caso de uso UC-37-01: Abrir sujeto y crear envío. Dentro del módulo (descripción del modelo, en inglés): «Business-level tracking of anything that moves or progresses: pharmacy deliveries, lab specimen transport, ambulance dispatch, referral fulfilment, claim processing.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/tracking/README.md:42`) · MODELO (`Mantra Core Health Context/modules/diagram_37_tracking.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /tracking/trackable-subjects` la atiende `TrackingController.openSubject` (src/modules/tracking/controllers/tracking.controller.ts:57). Exige sesión con alguno de los roles TRACKING_ADMIN, LOGISTICS_OPERATOR. Valida el cuerpo como `OpenSubjectDto` (9 campos, 3 obligatorios). Delega en `TrackingService.openSubject`. Crea filas en tracking.shipments, tracking.trackable_subjects. Lee tracking.shipments, tracking.trackable_subjects, tracking.tracking_carriers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: TRACKING_ADMIN, LOGISTICS_OPERATOR | `src/modules/tracking/controllers/tracking.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `tracking.shipments` | ESCRIBE | CREA | DIRECTA | TrackingController.openSubject → TrackingService.openSubject → TrackingRepository.createShipment | `src/modules/tracking/repositories/tracking.repository.ts:302` |
| `tracking.shipments` | LEE | LEE | DIRECTA | TrackingController.openSubject → TrackingService.openSubject → TrackingService.nextShipmentNumber → TrackingRepository.countShipments | `src/modules/tracking/repositories/tracking.repository.ts:382` |
| `tracking.trackable_subjects` | ESCRIBE | CREA | DIRECTA | TrackingController.openSubject → TrackingService.openSubject → TrackingRepository.createSubject | `src/modules/tracking/repositories/tracking.repository.ts:220` |
| `tracking.trackable_subjects` | LEE | LEE | DIRECTA | TrackingController.openSubject → TrackingService.openSubject → TrackingRepository.findOpenSubjectByRef | `src/modules/tracking/repositories/tracking.repository.ts:285` |
| `tracking.tracking_carriers` | LEE | LEE | DIRECTA | TrackingController.openSubject → TrackingService.openSubject → TrackingRepository.findCarrierById | `src/modules/tracking/repositories/tracking.repository.ts:748` |

### Cuerpo — DTO `OpenSubjectDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/tracking/dto/tracking.dto.ts:36` |
| `subjectType` | `string` | Sí | valores: SPECIMEN, ORDER, DEVICE | `@IsIn(SUBJECT_TYPES)` | — | `src/modules/tracking/dto/tracking.dto.ts:43` |
| `subjectRefType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Tipo de la entidad rastreada | `src/modules/tracking/dto/tracking.dto.ts:51` |
| `subjectRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Entidad rastreada | `src/modules/tracking/dto/tracking.dto.ts:58` |
| `carrierId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Transportista asignado | `src/modules/tracking/dto/tracking.dto.ts:69` |
| `originAddressId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/tracking/dto/tracking.dto.ts:77` |
| `destinationAddressId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/tracking/dto/tracking.dto.ts:85` |
| `assignedCourierUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Mensajero asignado | `src/modules/tracking/dto/tracking.dto.ts:93` |
| `temperatureControlled` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | El envío exige cadena de frío | `src/modules/tracking/dto/tracking.dto.ts:104` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "subjectType": "SPECIMEN",
  "subjectRefType": "valor-ejemplo",
  "subjectRefId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "subjectType": "SPECIMEN",
  "subjectRefType": "valor-ejemplo",
  "subjectRefId": "00000000-0000-4000-8000-000000000001",
  "carrierId": "00000000-0000-4000-8000-000000000001",
  "originAddressId": "00000000-0000-4000-8000-000000000001",
  "destinationAddressId": "00000000-0000-4000-8000-000000000001",
  "assignedCourierUserId": "00000000-0000-4000-8000-000000000001",
  "temperatureControlled": false
}
```

</details>

### Respuesta — `Promise<SubjectResponseDto>` · DTO `SubjectResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/tracking/dto/tracking.dto.ts:115` |
| `trackingNumber` | `string` | Sí | — | — | Número de seguimiento, opaco y único | `src/modules/tracking/dto/tracking.dto.ts:121` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/tracking/dto/tracking.dto.ts:127` |
| `currentStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a current status concept. | `src/modules/tracking/dto/tracking.dto.ts:133` |
| `shipmentId` | `string` | Sí | formato uuid | — | Identificador asociado a shipment. | `src/modules/tracking/dto/tracking.dto.ts:139` |
| `shipmentNumber` | `string` | Sí | — | — | Número del envío | `src/modules/tracking/dto/tracking.dto.ts:145` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Transportista no encontrado |
| 409 | `CONFLICT` | ConflictException: La entidad ya tiene un seguimiento abierto; ConflictException: No se pudo generar un número de seguimiento libre; ConflictException: No se pudo asignar número de envío |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El transportista no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/tracking.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/tracking/controllers/tracking.controller.spec.ts:46` |

### Flujos

- Módulo 37 — Seguimiento y Trazabilidad de Envíos — etapa `UC-37-01`

---

## 10. POST /tracking/trackable-subjects/{id}/events

- **Origen:** CONTRATO
- **Nombre:** Registrar un evento y avanzar el hito
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TrackingController.recordEvent` — `src/modules/tracking/controllers/tracking.controller.ts:104`

### Qué es y para qué sirve (negocio)

Registrar un evento y avanzar el hito. Caso de uso UC-37-04: Evento y avance de hito. Dentro del módulo (descripción del modelo, en inglés): «Business-level tracking of anything that moves or progresses: pharmacy deliveries, lab specimen transport, ambulance dispatch, referral fulfilment, claim processing.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/tracking/README.md:45`) · MODELO (`Mantra Core Health Context/modules/diagram_37_tracking.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /tracking/trackable-subjects/{id}/events` la atiende `TrackingController.recordEvent` (src/modules/tracking/controllers/tracking.controller.ts:104). Exige sesión con alguno de los roles LOGISTICS_OPERATOR, COURIER, TRACKING_ADMIN. Valida el cuerpo como `RecordEventDto` (9 campos, 1 obligatorio). Delega en `TrackingService.recordEvent`. Crea filas en tracking.tracking_events. Actualiza tracking.trackable_subjects. Lee tracking.milestone_definitions, tracking.trackable_subjects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: LOGISTICS_OPERATOR, COURIER, TRACKING_ADMIN | `src/modules/tracking/controllers/tracking.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/tracking/controllers/tracking.controller.ts:104` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `tracking.milestone_definitions` | LEE | LEE | DIRECTA | TrackingController.recordEvent → TrackingService.recordEvent → TrackingRepository.findMilestoneByCode | `src/modules/tracking/repositories/tracking.repository.ts:450` |
| `tracking.trackable_subjects` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackingController.recordEvent → TrackingService.recordEvent | `src/modules/tracking/services/tracking.service.ts:450` |
| `tracking.trackable_subjects` | LEE | LEE | DIRECTA | TrackingController.recordEvent → TrackingService.recordEvent → TrackingRepository.findSubjectForUpdate | `src/modules/tracking/repositories/tracking.repository.ts:257` |
| `tracking.tracking_events` | ESCRIBE | CREA | DIRECTA | TrackingController.recordEvent → TrackingService.recordEvent → TrackingRepository.createEvent | `src/modules/tracking/repositories/tracking.repository.ts:482` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordEventDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: CREATED, PREPARING, IN_TRANSIT, HANDOFF, DELIVERED, CANCELLED | `@IsIn(MILESTONE_STATUSES)` | — | `src/modules/tracking/dto/tracking.dto.ts:361` |
| `milestoneCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código del hito alcanzado; si se indica, mueve el hito actual | `src/modules/tracking/dto/tracking.dto.ts:374` |
| `source` | `string` | No | valores: OPERATOR, CARRIER_WEBHOOK, COURIER_APP, SYSTEM | `@IsOptional()` `@IsIn(EVENT_SOURCES)` | — | `src/modules/tracking/dto/tracking.dto.ts:382` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/tracking/dto/tracking.dto.ts:390` |
| `locationText` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/tracking/dto/tracking.dto.ts:399` |
| `latitude` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Latitud, como cadena decimal | `src/modules/tracking/dto/tracking.dto.ts:407` |
| `longitude` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Longitud, como cadena decimal | `src/modules/tracking/dto/tracking.dto.ts:415` |
| `locationPingId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ping de localización que lo respalda | `src/modules/tracking/dto/tracking.dto.ts:426` |
| `occurredAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo ocurrió; por defecto, ahora | `src/modules/tracking/dto/tracking.dto.ts:437` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "status": "CREATED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "CREATED",
  "milestoneCode": "CODIGO_EJEMPLO",
  "source": "OPERATOR",
  "description": "Texto descriptivo de ejemplo",
  "locationText": "valor-ejemplo",
  "latitude": "valor-ejemplo",
  "longitude": "valor-ejemplo",
  "locationPingId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<EventResponseDto>` · DTO `EventResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/tracking/dto/tracking.dto.ts:448` |
| `trackableSubjectId` | `string` | Sí | formato uuid | — | Identificador asociado a trackable subject. | `src/modules/tracking/dto/tracking.dto.ts:454` |
| `currentStatusConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda el sujeto | `src/modules/tracking/dto/tracking.dto.ts:463` |
| `currentMilestoneId` | `string` | No | formato uuid | — | Hito alcanzado, si lo hubo | `src/modules/tracking/dto/tracking.dto.ts:472` |
| `subjectClosed` | `boolean` | Sí | — | — | true si el hito alcanzado cierra el seguimiento | `src/modules/tracking/dto/tracking.dto.ts:480` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sujeto rastreable no encontrado; ResourceNotFoundException: Hito no encontrado para el tipo de sujeto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El seguimiento del sujeto está cerrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/tracking.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/tracking/controllers/tracking.controller.spec.ts:80` |

### Flujos

- Módulo 37 — Seguimiento y Trazabilidad de Envíos — etapa `UC-37-04`

---

## 11. POST /tracking/webhooks/carriers/{carrierCode}

- **Origen:** CONTRATO
- **Nombre:** Ingerir el webhook del transportista
- **Bloque:** Integraciones y Contratos
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TrackingController.ingestCarrierWebhook` — `src/modules/tracking/controllers/tracking.controller.ts:120`

### Qué es y para qué sirve (negocio)

Ingerir el webhook del transportista. Caso de uso UC-37-05: Webhook del transportista. Dentro del módulo (descripción del modelo, en inglés): «Business-level tracking of anything that moves or progresses: pharmacy deliveries, lab specimen transport, ambulance dispatch, referral fulfilment, claim processing.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/tracking/README.md:46`) · MODELO (`Mantra Core Health Context/modules/diagram_37_tracking.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /tracking/webhooks/carriers/{carrierCode}` la atiende `TrackingController.ingestCarrierWebhook` (src/modules/tracking/controllers/tracking.controller.ts:120). Es una ruta pública: no exige token. Valida el cuerpo como `CarrierWebhookDto` (5 campos, 3 obligatorios). Delega en `TrackingService.ingestCarrierWebhook`. Crea filas en tracking.tracking_events. Actualiza tracking.shipments, tracking.trackable_subjects. Lee tracking.shipments, tracking.trackable_subjects, tracking.tracking_carriers, tracking.tracking_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/tracking/controllers/tracking.controller.ts:120` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `tracking.shipments` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackingController.ingestCarrierWebhook → TrackingService.ingestCarrierWebhook | `src/modules/tracking/services/tracking.service.ts:575` |
| `tracking.shipments` | LEE | LEE | DIRECTA | TrackingController.ingestCarrierWebhook → TrackingService.ingestCarrierWebhook → TrackingRepository.findShipmentBySubjectForUpdate | `src/modules/tracking/repositories/tracking.repository.ts:368` |
| `tracking.trackable_subjects` | ESCRIBE | ACTUALIZA | POR_TIPO | TrackingController.ingestCarrierWebhook → TrackingService.ingestCarrierWebhook | `src/modules/tracking/services/tracking.service.ts:565` |
| `tracking.trackable_subjects` | LEE | LEE | DIRECTA | TrackingController.ingestCarrierWebhook → TrackingService.ingestCarrierWebhook → TrackingRepository.findSubjectByTrackingNumber | `src/modules/tracking/repositories/tracking.repository.ts:275` |
| `tracking.tracking_carriers` | LEE | LEE | DIRECTA | TrackingController.ingestCarrierWebhook → TrackingService.ingestCarrierWebhook → TrackingRepository.findCarrierByCode | `src/modules/tracking/repositories/tracking.repository.ts:756` |
| `tracking.tracking_events` | ESCRIBE | CREA | DIRECTA | TrackingController.ingestCarrierWebhook → TrackingService.ingestCarrierWebhook → TrackingRepository.createEvent | `src/modules/tracking/repositories/tracking.repository.ts:482` |
| `tracking.tracking_events` | LEE | LEE | DIRECTA | TrackingController.ingestCarrierWebhook → TrackingService.ingestCarrierWebhook → TrackingRepository.findEventByExternalReference | `src/modules/tracking/repositories/tracking.repository.ts:524` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `carrierCode` | path | Sí | `string` | — |

### Cuerpo — DTO `CarrierWebhookDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `trackingNumber` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Número de seguimiento que el transportista reporta | `src/modules/tracking/dto/tracking.dto.ts:497` |
| `externalStatusCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código de estado del transportista | `src/modules/tracking/dto/tracking.dto.ts:508` |
| `externalEventId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Identificador del evento en el transportista; con él se deduplica | `src/modules/tracking/dto/tracking.dto.ts:520` |
| `occurredAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/tracking/dto/tracking.dto.ts:528` |
| `locationText` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/tracking/dto/tracking.dto.ts:537` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "trackingNumber": "valor-ejemplo",
  "externalStatusCode": "CODIGO_EJEMPLO",
  "externalEventId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "trackingNumber": "valor-ejemplo",
  "externalStatusCode": "CODIGO_EJEMPLO",
  "externalEventId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "locationText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<WebhookResponseDto>` · DTO `WebhookResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `eventId` | `string` | No | formato uuid | — | Evento registrado; ausente si era duplicado | `src/modules/tracking/dto/tracking.dto.ts:551` |
| `trackableSubjectId` | `string` | Sí | formato uuid | — | Identificador asociado a trackable subject. | `src/modules/tracking/dto/tracking.dto.ts:557` |
| `currentStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a current status concept. | `src/modules/tracking/dto/tracking.dto.ts:563` |
| `duplicate` | `boolean` | Sí | — | — | true si el evento ya se había recibido | `src/modules/tracking/dto/tracking.dto.ts:569` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Transportista no encontrado; ResourceNotFoundException: Número de seguimiento desconocido; ResourceNotFoundException: Sujeto rastreable no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/tracking.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/tracking/controllers/tracking.controller.spec.ts:96` |

### Flujos

- Módulo 37 — Seguimiento y Trazabilidad de Envíos — etapa `UC-37-05`

---

