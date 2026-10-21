<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `procedures_perioperative`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 32 (32 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 26 · BAJO 6
- **Tablas distintas que tocan:** 41
- **Respuestas de error y detalle contractual:** `openapi/endpoints/procedures-perioperative.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/dental-procedures` | Histórico odontológico del paciente | BAJO | 2 | CLINICIAN, PRACTITIONER |
| 2 | POST | `/dental-procedures` | Registrar un procedimiento odontológico | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 3 | GET | `/dental-procedures/catalog` | Catálogo odontológico: códigos, piezas (FDI) y cuadrantes | BAJO | 0 | CLINICIAN, PRACTITIONER |
| 4 | POST | `/pacu-stays/{stayId}/assessments` | Registrar una valoración de recuperación | MEDIO | 2 | PERIOP_NURSE, ANESTHESIOLOGIST, PERIOP_ADMIN |
| 5 | POST | `/pacu-stays/{stayId}/discharge` | Dar el alta de recuperación | MEDIO | 7 | ANESTHESIOLOGIST, PERIOP_ADMIN |
| 6 | GET | `/procedure-cases` | Listar casos quirúrgicos (agenda) | BAJO | 1 | SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN |
| 7 | POST | `/procedure-cases` | Programar un caso quirúrgico y reservar el quirófano | MEDIO | 6 | SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN |
| 8 | GET | `/procedure-cases/{id}` | Detalle completo del caso quirúrgico | BAJO | 12 | SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN |
| 9 | PATCH | `/procedure-cases/{id}` | Modificar el caso quirúrgico | MEDIO | 9 | SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN |
| 10 | POST | `/procedure-cases/{id}/anesthesia-events` | Anotar un evento intraoperatorio de anestesia | MEDIO | 8 | ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN |
| 11 | POST | `/procedure-cases/{id}/anesthesia-plans` | Registrar el plan de anestesia y la valoración de vía aérea | MEDIO | 4 | ANESTHESIOLOGIST, PERIOP_ADMIN |
| 12 | POST | `/procedure-cases/{id}/anesthesia-plans/{planId}/approve` | Aprobar el plan de anestesia | MEDIO | 4 | ANESTHESIOLOGIST, PERIOP_ADMIN |
| 13 | POST | `/procedure-cases/{id}/cancel` | Cancelar el caso quirúrgico | MEDIO | 5 | SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN |
| 14 | POST | `/procedure-cases/{id}/charge-items/post` | Generar los cargos y consolidar el uso del quirófano | MEDIO | 4 | PERIOP_ADMIN, BILLING |
| 15 | POST | `/procedure-cases/{id}/confirm` | Confirmar la intervención verificando las credenciales del equipo | MEDIO | 10 | SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN |
| 16 | POST | `/procedure-cases/{id}/diagnoses` | Registrar los diagnósticos del caso | MEDIO | 10 | SURGEON, PERIOP_ADMIN |
| 17 | POST | `/procedure-cases/{id}/findings` | Registrar un hallazgo operatorio | MEDIO | 5 | SURGEON, PERIOP_ADMIN |
| 18 | POST | `/procedure-cases/{id}/implants` | Registrar un implante con su trazabilidad UDI, lote o serie | MEDIO | 4 | SURGEON, PERIOP_NURSE, PERIOP_ADMIN |
| 19 | POST | `/procedure-cases/{id}/medication-uses` | Registrar el uso de un medicamento en la intervención | MEDIO | 3 | ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN |
| 20 | POST | `/procedure-cases/{id}/operative-reports` | Redactar el reporte operatorio | MEDIO | 8 | SURGEON, PERIOP_ADMIN |
| 21 | POST | `/procedure-cases/{id}/operative-reports/{reportId}/sign` | Firmar el reporte operatorio | MEDIO | 6 | SURGEON, PERIOP_ADMIN |
| 22 | POST | `/procedure-cases/{id}/operative-steps` | Registrar un paso operatorio | MEDIO | 3 | SURGEON, PERIOP_NURSE, PERIOP_ADMIN |
| 23 | POST | `/procedure-cases/{id}/pacu-stays` | Admitir al paciente en recuperación | MEDIO | 4 | PERIOP_NURSE, ANESTHESIOLOGIST, PERIOP_ADMIN |
| 24 | POST | `/procedure-cases/{id}/preoperative-assessments` | Registrar la valoración preoperatoria y sus puntuaciones de riesgo | MEDIO | 5 | ANESTHESIOLOGIST, SURGEON, PERIOP_ADMIN |
| 25 | POST | `/procedure-cases/{id}/preoperative-orders` | Indicar una orden preoperatoria para el caso | MEDIO | 4 | ANESTHESIOLOGIST, SURGEON, PERIOP_ADMIN |
| 26 | POST | `/procedure-cases/{id}/preoperative-orders/verify` | Verificar las órdenes preoperatorias | MEDIO | 4 | ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN |
| 27 | POST | `/procedure-cases/{id}/safety-checklists/{checklistId}/responses` | Responder una fase del checklist quirúrgico | MEDIO | 6 | PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST, PERIOP_ADMIN |
| 28 | POST | `/procedure-cases/{id}/specimens` | Registrar una muestra tomada en la intervención | MEDIO | 3 | SURGEON, PERIOP_NURSE, PERIOP_ADMIN |
| 29 | GET | `/procedure-cases/{id}/team-members` | Listar el equipo del caso quirúrgico | BAJO | 2 | SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN |
| 30 | POST | `/procedure-cases/{id}/team-members` | Asignar un miembro al equipo quirúrgico | MEDIO | 4 | SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN |
| 31 | POST | `/procedure-cases/{id}/team-members/{memberId}/accept` | Aceptar la participación en el equipo quirúrgico | BAJO | 3 | SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN |
| 32 | POST | `/procedure-cases/{id}/team-members/{memberId}/respond` | Rechazar, pedir cambios o informar indisponibilidad | MEDIO | 7 | SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN |

---

## 1. GET /dental-procedures

- **Origen:** CONTRATO
- **Nombre:** Histórico odontológico del paciente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DentalController.listByPatient` — `src/modules/procedures_perioperative/controllers/dental.controller.ts:73`

### Qué es y para qué sirve (negocio)

Histórico odontológico del paciente. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /dental-procedures` la atiende `DentalController.listByPatient` (src/modules/procedures_perioperative/controllers/dental.controller.ts:73). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `PeriopDentalService.listByPatient`. Lee clinical.procedures, procedures_perioperative.procedure_body_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/procedures_perioperative/controllers/dental.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | patientProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.procedures` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → PeriopDentalRepository.findByPatient | `src/modules/procedures_perioperative/repositories/periop-dental.repository.ts:166` |
| `procedures_perioperative.procedure_body_sites` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → PeriopDentalRepository.findSitesByProcedures | `src/modules/procedures_perioperative/repositories/periop-dental.repository.ts:209` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | Paciente consultado |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DentalProcedureListDto>` · DTO `DentalProcedureListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<DentalProcedureDto>` | Sí | — | — | Valor de items mantenido por la instancia. | `src/modules/procedures_perioperative/dto/dental.dto.ts:234` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/dental.dto.ts:144` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/procedures_perioperative/dto/dental.dto.ts:150` |
| `items[].procedureCodeConceptId` | `string` | Sí | formato uuid | — | Qué se hizo. | `src/modules/procedures_perioperative/dto/dental.dto.ts:156` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado del registro. | `src/modules/procedures_perioperative/dto/dental.dto.ts:162` |
| `items[].performerProfileId` | `string` | No | formato uuid | — | Odontólogo que lo realizó, si consta. | `src/modules/procedures_perioperative/dto/dental.dto.ts:168` |
| `items[].encounterId` | `string` | No | formato uuid | — | Encuentro en el que se realizó, si lo hubo. | `src/modules/procedures_perioperative/dto/dental.dto.ts:174` |
| `items[].noteText` | `string` | No | — | — | Nota clínica. | `src/modules/procedures_perioperative/dto/dental.dto.ts:180` |
| `items[].performedAt` | `string` | No | formato date-time | — | Cuándo se realizó. | `src/modules/procedures_perioperative/dto/dental.dto.ts:186` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo quedó registrado. | `src/modules/procedures_perioperative/dto/dental.dto.ts:192` |
| `items[].sites` | `array<DentalSiteDto>` | Sí | — | — | Piezas o cuadrantes tratados. | `src/modules/procedures_perioperative/dto/dental.dto.ts:198` |
| `items[].sites[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/dental.dto.ts:123` |
| `items[].sites[].bodySiteConceptId` | `string` | Sí | formato uuid | — | Pieza o cuadrante. | `src/modules/procedures_perioperative/dto/dental.dto.ts:129` |
| `items[].sites[].description` | `string` | No | — | — | Cara o superficie, si se precisó. | `src/modules/procedures_perioperative/dto/dental.dto.ts:135` |
| `total` | `number` | Sí | — | — | Procedimientos de la persona, sin paginar | `src/modules/procedures_perioperative/dto/dental.dto.ts:240` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/dental-procedures.int-spec.ts:108` |
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/dental.controller.spec.ts:74` |

### Flujos

_Se completa en la fase de flujos._

---

## 2. POST /dental-procedures

- **Origen:** CONTRATO
- **Nombre:** Registrar un procedimiento odontológico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DentalController.record` — `src/modules/procedures_perioperative/controllers/dental.controller.ts:86`

### Qué es y para qué sirve (negocio)

Registrar un procedimiento odontológico. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /dental-procedures` la atiende `DentalController.record` (src/modules/procedures_perioperative/controllers/dental.controller.ts:86). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateDentalProcedureDto` (8 campos, 2 obligatorios). Delega en `PeriopDentalService.record`. Crea filas en audit.audit_log, clinical.procedures, procedures_perioperative.procedure_body_sites. Lee audit.audit_log.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/procedures_perioperative/controllers/dental.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | DentalController.record → PeriopDentalService.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |
| `clinical.procedures` | ESCRIBE | CREA | DIRECTA | DentalController.record → PeriopDentalService.record → PeriopDentalRepository.createProcedure | `src/modules/procedures_perioperative/repositories/periop-dental.repository.ts:101` |
| `procedures_perioperative.procedure_body_sites` | ESCRIBE | CREA | DIRECTA | DentalController.record → PeriopDentalService.record → PeriopDentalRepository.createSite | `src/modules/procedures_perioperative/repositories/periop-dental.repository.ts:133` |

### Cuerpo — DTO `CreateDentalProcedureDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente tratado | `src/modules/procedures_perioperative/dto/dental.dto.ts:36` |
| `procedureCodeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Qué se hizo. Los códigos sembrados salen de `GET /dental-procedures/catalog`; se admite cualquier concepto válido. | `src/modules/procedures_perioperative/dto/dental.dto.ts:47` |
| `performerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Odontólogo que lo realizó. Si se omite se toma el profesional de la sesión. | `src/modules/procedures_perioperative/dto/dental.dto.ts:59` |
| `toothSiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Pieza dentaria en notación FDI o cuadrante. Tiene que ser uno de los sitios del catálogo. | `src/modules/procedures_perioperative/dto/dental.dto.ts:71` |
| `siteDetail` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(SITE_DETAIL_MAX_LENGTH)` | Cara o superficie tratada, si corresponde | `src/modules/procedures_perioperative/dto/dental.dto.ts:83` |
| `noteText` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(NOTE_MAX_LENGTH)` | — | `src/modules/procedures_perioperative/dto/dental.dto.ts:92` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en el que se realizó, si lo hubo | `src/modules/procedures_perioperative/dto/dental.dto.ts:103` |
| `performedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo se realizó. Si se omite, ahora. | `src/modules/procedures_perioperative/dto/dental.dto.ts:114` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "procedureCodeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "procedureCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "performerProfileId": "00000000-0000-4000-8000-000000000001",
  "toothSiteConceptId": "00000000-0000-4000-8000-000000000001",
  "siteDetail": "valor-ejemplo",
  "noteText": "valor-ejemplo",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "performedAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<DentalProcedureResponseDto>` · DTO `DentalProcedureResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/dental.dto.ts:207` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/procedures_perioperative/dto/dental.dto.ts:213` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado del registro. | `src/modules/procedures_perioperative/dto/dental.dto.ts:219` |
| `createdAt` | `string` | Sí | formato date-time | — | Cuándo quedó registrado. | `src/modules/procedures_perioperative/dto/dental.dto.ts:225` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/dental-procedures.int-spec.ts:93` |
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/dental.controller.spec.ts:45` |

### Flujos

_Se completa en la fase de flujos._

---

## 3. GET /dental-procedures/catalog

- **Origen:** CONTRATO
- **Nombre:** Catálogo odontológico: códigos, piezas (FDI) y cuadrantes
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DentalController.catalog` — `src/modules/procedures_perioperative/controllers/dental.controller.ts:62`

### Qué es y para qué sirve (negocio)

Catálogo odontológico: códigos, piezas (FDI) y cuadrantes. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /dental-procedures/catalog` la atiende `DentalController.catalog` (src/modules/procedures_perioperative/controllers/dental.controller.ts:62). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `PeriopDentalService.catalog`. No toca tablas relacionales: Devuelve catálogos que viven en constantes del código (códigos, piezas, cuadrantes)..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/procedures_perioperative/controllers/dental.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: Devuelve catálogos que viven en constantes del código (códigos, piezas, cuadrantes).. _(manual, 2026-10-21; fuente: `src/modules/procedures_perioperative/services/periop-dental.service.ts:252`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `DentalCatalogDto` · DTO `DentalCatalogDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedureCodes` | `array<DentalCatalogEntryDto>` | Sí | — | — | Códigos de procedimiento sembrados. | `src/modules/procedures_perioperative/dto/dental.dto.ts:297` |
| `procedureCodes[].conceptId` | `string` | Sí | formato uuid | — | Identificador del concepto. | `src/modules/procedures_perioperative/dto/dental.dto.ts:270` |
| `procedureCodes[].code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/procedures_perioperative/dto/dental.dto.ts:276` |
| `procedureCodes[].display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/procedures_perioperative/dto/dental.dto.ts:282` |
| `teeth` | `array<DentalCatalogEntryDto>` | Sí | — | — | Las 32 piezas permanentes, en orden FDI. | `src/modules/procedures_perioperative/dto/dental.dto.ts:303` |
| `teeth[].conceptId` | `string` | Sí | formato uuid | — | Identificador del concepto. | `src/modules/procedures_perioperative/dto/dental.dto.ts:270` |
| `teeth[].code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/procedures_perioperative/dto/dental.dto.ts:276` |
| `teeth[].display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/procedures_perioperative/dto/dental.dto.ts:282` |
| `quadrants` | `array<DentalCatalogEntryDto>` | Sí | — | — | Los cuatro cuadrantes. | `src/modules/procedures_perioperative/dto/dental.dto.ts:309` |
| `quadrants[].conceptId` | `string` | Sí | formato uuid | — | Identificador del concepto. | `src/modules/procedures_perioperative/dto/dental.dto.ts:270` |
| `quadrants[].code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/procedures_perioperative/dto/dental.dto.ts:276` |
| `quadrants[].display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/procedures_perioperative/dto/dental.dto.ts:282` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/dental-procedures.int-spec.ts:56` |
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/dental.controller.spec.ts:82` |

### Flujos

_Se completa en la fase de flujos._

---

## 4. POST /pacu-stays/{stayId}/assessments

- **Origen:** CONTRATO
- **Nombre:** Registrar una valoración de recuperación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.recordPacuAssessment` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:540`

### Qué es y para qué sirve (negocio)

Registrar una valoración de recuperación. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /pacu-stays/{stayId}/assessments` la atiende `PeriopController.recordPacuAssessment` (src/modules/procedures_perioperative/controllers/periop.controller.ts:540). Exige sesión con alguno de los roles PERIOP_NURSE, ANESTHESIOLOGIST, PERIOP_ADMIN. Valida el cuerpo como `RecordPacuAssessmentDto` (7 campos, 1 obligatorio). Delega en `PeriopIntraopService.recordPacuAssessment`. Crea filas en procedures_perioperative.pacu_assessments. Lee procedures_perioperative.pacu_stays.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PERIOP_NURSE, ANESTHESIOLOGIST, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:540` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: stayId | `src/modules/procedures_perioperative/controllers/periop.controller.ts:540` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.pacu_assessments` | ESCRIBE | CREA | DIRECTA | PeriopController.recordPacuAssessment → PeriopIntraopService.recordPacuAssessment → PeriopIntraopRepository.createPacuAssessment | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:928` |
| `procedures_perioperative.pacu_stays` | LEE | LEE | DIRECTA | PeriopController.recordPacuAssessment → PeriopIntraopService.recordPacuAssessment → PeriopIntraopRepository.findPacuStayForUpdate | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:869` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `stayId` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordPacuAssessmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `assessedByProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2430` |
| `aldreteScore` | `number` | No | mínimo 0; máximo 10 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(10)` | Puntuación de Aldrete | `src/modules/procedures_perioperative/dto/periop.dto.ts:2444` |
| `painScore` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Escala de dolor | `src/modules/procedures_perioperative/dto/periop.dto.ts:2452` |
| `nauseaScore` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Escala de náusea | `src/modules/procedures_perioperative/dto/periop.dto.ts:2460` |
| `airwayStatus` | `string` | No | valores: PATENT, SUPPORTED | `@IsOptional()` `@IsIn(['PATENT', 'SUPPORTED'])` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2468` |
| `observationsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Observaciones registradas | `src/modules/procedures_perioperative/dto/periop.dto.ts:2476` |
| `criteriaJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Criterios de alta evaluados | `src/modules/procedures_perioperative/dto/periop.dto.ts:2484` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "assessedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
  "aldreteScore": 1,
  "painScore": "valor-ejemplo",
  "nauseaScore": "valor-ejemplo",
  "airwayStatus": "PATENT",
  "observationsJson": {},
  "criteriaJson": {}
}
```

</details>

### Respuesta — `Promise<PacuAssessmentResponseDto>` · DTO `PacuAssessmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2495` |
| `pacuStayId` | `string` | Sí | formato uuid | — | Identificador asociado a pacu stay. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2501` |
| `meetsDischargeCriteria` | `boolean` | Sí | — | — | true si la valoración cumple el criterio de alta | `src/modules/procedures_perioperative/dto/periop.dto.ts:2509` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:308` |

### Flujos

_Se completa en la fase de flujos._

---

## 5. POST /pacu-stays/{stayId}/discharge

- **Origen:** CONTRATO
- **Nombre:** Dar el alta de recuperación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.dischargeFromPacu` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:556`

### Qué es y para qué sirve (negocio)

Dar el alta de recuperación. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /pacu-stays/{stayId}/discharge` la atiende `PeriopController.dischargeFromPacu` (src/modules/procedures_perioperative/controllers/periop.controller.ts:556). Exige sesión con alguno de los roles ANESTHESIOLOGIST, PERIOP_ADMIN. Valida el cuerpo como `DischargePacuDto` (10 campos, 1 obligatorio). Delega en `PeriopIntraopService.dischargeFromPacu`. Crea filas en procedures_perioperative.postoperative_followups, procedures_perioperative.postoperative_orders. Actualiza procedures_perioperative.pacu_stays, procedures_perioperative.procedure_case_locations. Lee procedures_perioperative.pacu_assessments, procedures_perioperative.pacu_stays, procedures_perioperative.procedure_case_locations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:556` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: stayId | `src/modules/procedures_perioperative/controllers/periop.controller.ts:556` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.pacu_assessments` | LEE | LEE | DIRECTA | PeriopController.dischargeFromPacu → PeriopIntraopService.dischargeFromPacu → PeriopIntraopRepository.findAssessmentsByStay | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:951` |
| `procedures_perioperative.pacu_stays` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.dischargeFromPacu → PeriopIntraopService.dischargeFromPacu | `src/modules/procedures_perioperative/services/periop-intraop.service.ts:789` |
| `procedures_perioperative.pacu_stays` | LEE | LEE | DIRECTA | PeriopController.dischargeFromPacu → PeriopIntraopService.dischargeFromPacu → PeriopIntraopRepository.findPacuStayForUpdate | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:869` |
| `procedures_perioperative.postoperative_followups` | ESCRIBE | CREA | DIRECTA | PeriopController.dischargeFromPacu → PeriopIntraopService.dischargeFromPacu → PeriopIntraopRepository.createFollowup | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:1044` |
| `procedures_perioperative.postoperative_orders` | ESCRIBE | CREA | DIRECTA | PeriopController.dischargeFromPacu → PeriopIntraopService.dischargeFromPacu → PeriopIntraopRepository.createPostoperativeOrder | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:990` |
| `procedures_perioperative.procedure_case_locations` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.dischargeFromPacu → PeriopIntraopService.dischargeFromPacu | `src/modules/procedures_perioperative/services/periop-intraop.service.ts:801` |
| `procedures_perioperative.procedure_case_locations` | LEE | LEE | DIRECTA | PeriopController.dischargeFromPacu → PeriopIntraopService.dischargeFromPacu → PeriopCasesRepository.findOpenLocation | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:659` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `stayId` | path | Sí | `string` | — |

### Cuerpo — DTO `DischargePacuDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `destination` | `string` | Sí | valores: PACU, ICU, WARD, HOME | `@IsIn(DISPOSITIONS)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2574` |
| `dischargedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2582` |
| `orders` | `array<PostoperativeOrderDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => PostoperativeOrderDto)` | Órdenes postoperatorias | `src/modules/procedures_perioperative/dto/periop.dto.ts:2595` |
| `orders[].serviceRequestId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2521` |
| `orders[].orderRole` | `string` | No | valores: LAB, IMAGING, CONSULT, MEDICATION | `@IsIn(['LAB', 'IMAGING', 'CONSULT', 'MEDICATION'])` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2528` |
| `followups` | `array<PostoperativeFollowupDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => PostoperativeFollowupDto)` | Seguimientos a agendar | `src/modules/procedures_perioperative/dto/periop.dto.ts:2608` |
| `followups[].followupType` | `string` | No | valores: WOUND_CHECK, VISIT | `@IsIn(['WOUND_CHECK', 'VISIT'])` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2540` |
| `followups[].appointmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2548` |
| `followups[].dueAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2556` |
| `followups[].instructionsText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2564` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "destination": "PACU"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "destination": "PACU",
  "dischargedByProfileId": "00000000-0000-4000-8000-000000000001",
  "orders": [
    {
      "serviceRequestId": "00000000-0000-4000-8000-000000000001",
      "orderRole": "LAB"
    }
  ],
  "followups": [
    {
      "followupType": "WOUND_CHECK",
      "appointmentId": "00000000-0000-4000-8000-000000000001",
      "dueAt": "2026-07-31T12:00:00.000Z",
      "instructionsText": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<DischargePacuResponseDto>` · DTO `DischargePacuResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2619` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2625` |
| `ordersCreated` | `number` | Sí | — | — | Órdenes postoperatorias creadas | `src/modules/procedures_perioperative/dto/periop.dto.ts:2631` |
| `followupsCreated` | `number` | Sí | — | — | Seguimientos agendados | `src/modules/procedures_perioperative/dto/periop.dto.ts:2637` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:309` |

### Flujos

_Se completa en la fase de flujos._

---

## 6. GET /procedure-cases

- **Origen:** CONTRATO
- **Nombre:** Listar casos quirúrgicos (agenda)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.listCases` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:103`

### Qué es y para qué sirve (negocio)

Listar casos quirúrgicos (agenda). Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /procedure-cases` la atiende `PeriopController.listCases` (src/modules/procedures_perioperative/controllers/periop.controller.ts:103). Exige sesión con alguno de los roles SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. Delega en `PeriopCasesService.listCases`. Lee procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:103` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.listCases → PeriopCasesService.listCases → PeriopCasesRepository.findCases | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:267` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | query | No | `string` | Paciente |
| `operatingRoomId` | query | No | `string` | Quirófano reservado |
| `primarySurgeonProfileId` | query | No | `string` | Cirujano principal |
| `statusConceptId` | query | No | `string` | Estado del caso |
| `from` | query | No | `string` | Inicio de la ventana (inclusive) |
| `to` | query | No | `string` | Fin de la ventana (exclusivo) |
| `limit` | query | No | `number` | — |
| `offset` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CaseListResponseDto>` · DTO `CaseListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CaseSummaryDto>` | Sí | — | — | Valor de items mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:729` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:678` |
| `items[].caseNumber` | `string` | Sí | — | — | Valor de case number mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:684` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/procedures_perioperative/dto/periop.dto.ts:690` |
| `items[].primarySurgeonProfileId` | `string` | No | formato uuid | — | Identificador asociado a primary surgeon profile. | `src/modules/procedures_perioperative/dto/periop.dto.ts:696` |
| `items[].operatingRoomId` | `string` | No | formato uuid | — | Identificador asociado a operating room. | `src/modules/procedures_perioperative/dto/periop.dto.ts:702` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:708` |
| `items[].scheduledStartAt` | `string` | No | formato date-time | — | Valor de scheduled start at mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:714` |
| `items[].scheduledEndAt` | `string` | No | formato date-time | — | Valor de scheduled end at mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:720` |
| `total` | `number` | Sí | — | — | Casos que cumplen el filtro, sin paginar | `src/modules/procedures_perioperative/dto/periop.dto.ts:735` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 7. POST /procedure-cases

- **Origen:** CONTRATO
- **Nombre:** Programar un caso quirúrgico y reservar el quirófano
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.scheduleCase` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:135`

### Qué es y para qué sirve (negocio)

Programar un caso quirúrgico y reservar el quirófano. Caso de uso UC-53-01: Programar caso y reservar quirófano. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:11`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases` la atiende `PeriopController.scheduleCase` (src/modules/procedures_perioperative/controllers/periop.controller.ts:135). Exige sesión con alguno de los roles SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. Valida el cuerpo como `ScheduleCaseDto` (15 campos, 8 obligatorios). Delega en `PeriopCasesService.scheduleCase`. Crea filas en procedures_perioperative.operating_room_utilization_events, procedures_perioperative.procedure_case_milestones, procedures_perioperative.procedure_case_status_history, procedures_perioperative.procedure_case_team_members, procedures_perioperative.procedure_cases. Lee procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:135` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operating_room_utilization_events` | ESCRIBE | CREA | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → PeriopCasesRepository.createUtilizationEvent | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:712` |
| `procedures_perioperative.procedure_case_milestones` | ESCRIBE | CREA | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → PeriopCasesRepository.createMilestone | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:455` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:397` |
| `procedures_perioperative.procedure_case_team_members` | ESCRIBE | CREA | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → PeriopCasesRepository.createTeamMember | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:588` |
| `procedures_perioperative.procedure_cases` | ESCRIBE | CREA | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → PeriopCasesRepository.createCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:153` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → PeriopCasesRepository.findOverlappingCases | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:359` |

### Cuerpo — DTO `ScheduleCaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:49` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:56` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:64` |
| `serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Solicitud que origina el caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:75` |
| `primaryProcedureId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:83` |
| `caseType` | `string` | Sí | valores: ELECTIVE, URGENT, EMERGENCY | `@IsIn(CASE_TYPES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:90` |
| `priority` | `string` | Sí | valores: ROUTINE, URGENT, STAT | `@IsIn(CASE_PRIORITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:97` |
| `surgicalSpecialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:105` |
| `requestedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:113` |
| `primarySurgeonProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Cirujano principal | `src/modules/procedures_perioperative/dto/periop.dto.ts:120` |
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:128` |
| `operatingRoomId` | `string` | Sí | formato uuid | `@IsUUID()` | Quirófano que se reserva | `src/modules/procedures_perioperative/dto/periop.dto.ts:135` |
| `scheduledStartAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:142` |
| `scheduledEndAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:149` |
| `urgencyReasonText` | `string` | No | — | `@IsOptional()` `@IsString()` | Justificación de la urgencia; obligatoria si el caso no es electivo | `src/modules/procedures_perioperative/dto/periop.dto.ts:160` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "caseType": "ELECTIVE",
  "priority": "ROUTINE",
  "primarySurgeonProfileId": "00000000-0000-4000-8000-000000000001",
  "operatingRoomId": "00000000-0000-4000-8000-000000000001",
  "scheduledStartAt": "2026-07-31T12:00:00.000Z",
  "scheduledEndAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "primaryProcedureId": "00000000-0000-4000-8000-000000000001",
  "caseType": "ELECTIVE",
  "priority": "ROUTINE",
  "surgicalSpecialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "requestedByProfileId": "00000000-0000-4000-8000-000000000001",
  "primarySurgeonProfileId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "operatingRoomId": "00000000-0000-4000-8000-000000000001",
  "scheduledStartAt": "2026-07-31T12:00:00.000Z",
  "scheduledEndAt": "2026-07-31T12:00:00.000Z",
  "urgencyReasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<CaseResponseDto>` · DTO `CaseResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:171` |
| `caseNumber` | `string` | Sí | — | — | Número del caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:177` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:183` |
| `operatingRoomId` | `string` | Sí | formato uuid | — | Quirófano reservado | `src/modules/procedures_perioperative/dto/periop.dto.ts:189` |
| `milestoneId` | `string` | Sí | formato uuid | — | Hito de programación creado | `src/modules/procedures_perioperative/dto/periop.dto.ts:195` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:70` |

### Flujos

_Se completa en la fase de flujos._

---

## 8. GET /procedure-cases/{id}

- **Origen:** CONTRATO
- **Nombre:** Detalle completo del caso quirúrgico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.getCase` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:121`

### Qué es y para qué sirve (negocio)

Detalle completo del caso quirúrgico. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /procedure-cases/{id}` la atiende `PeriopController.getCase` (src/modules/procedures_perioperative/controllers/periop.controller.ts:121). Exige sesión con alguno de los roles SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. Delega en `PeriopCasesService.getCaseDetail`. Lee procedures_perioperative.anesthesia_plans, procedures_perioperative.implant_identifiers, procedures_perioperative.operative_findings, procedures_perioperative.operative_reports, procedures_perioperative.operative_steps, procedures_perioperative.preoperative_assessments, procedures_perioperative.preoperative_orders, procedures_perioperative.procedure_case_diagnoses y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:121` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:121` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.anesthesia_plans` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopPreopRepository.findAnesthesiaPlanByCase | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:551` |
| `procedures_perioperative.implant_identifiers` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopIntraopRepository.findIdentifiersByImplants | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:749` |
| `procedures_perioperative.operative_findings` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopIntraopRepository.findFindingsByCase | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:706` |
| `procedures_perioperative.operative_reports` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopIntraopRepository.findReportsByCase | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:677` |
| `procedures_perioperative.operative_steps` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopIntraopRepository.findStepsByCase | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:239` |
| `procedures_perioperative.preoperative_assessments` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopPreopRepository.findAssessmentByCase | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:178` |
| `procedures_perioperative.preoperative_orders` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopPreopRepository.findOrdersByCase | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:295` |
| `procedures_perioperative.procedure_case_diagnoses` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesRepository.findDiagnosesByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:549` |
| `procedures_perioperative.procedure_case_milestones` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesRepository.findMilestonesByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:330` |
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:607` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesRepository.findCaseById | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:187` |
| `procedures_perioperative.procedure_implants` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopIntraopRepository.findImplantsByCase | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:724` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CaseDetailDto>` · DTO `CaseDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `case` | `CaseSummaryDto` | Sí | — | — | Datos de cabecera del caso. | `src/modules/procedures_perioperative/dto/periop.dto.ts:778` |
| `case.id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:678` |
| `case.caseNumber` | `string` | Sí | — | — | Valor de case number mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:684` |
| `case.patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/procedures_perioperative/dto/periop.dto.ts:690` |
| `case.primarySurgeonProfileId` | `string` | No | formato uuid | — | Identificador asociado a primary surgeon profile. | `src/modules/procedures_perioperative/dto/periop.dto.ts:696` |
| `case.operatingRoomId` | `string` | No | formato uuid | — | Identificador asociado a operating room. | `src/modules/procedures_perioperative/dto/periop.dto.ts:702` |
| `case.statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:708` |
| `case.scheduledStartAt` | `string` | No | formato date-time | — | Valor de scheduled start at mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:714` |
| `case.scheduledEndAt` | `string` | No | formato date-time | — | Valor de scheduled end at mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:720` |
| `diagnoses` | `array<object>` | Sí | — | — | Diagnósticos del caso con su papel y orden | `src/modules/procedures_perioperative/dto/periop.dto.ts:787` |
| `diagnoses[].id` | `string` | Sí | — | — | Identificador del diagnóstico del caso. | sin fuente |
| `diagnoses[].conditionId` | `string` | Sí | — | — | Condición clínica a la que apunta. | sin fuente |
| `diagnoses[].diagnosisRoleConceptId` | `string` | Sí | — | — | Papel del diagnóstico (principal, secundario, postoperatorio). | sin fuente |
| `diagnoses[].sequenceNumber` | `number` | Sí | — | — | Orden dentro del caso. | sin fuente |
| `team` | `array<TeamMemberSummaryDto>` | Sí | — | — | Valor de team mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:802` |
| `team[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:744` |
| `team[].practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/procedures_perioperative/dto/periop.dto.ts:750` |
| `team[].teamRoleConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a team role concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:756` |
| `team[].statusConceptId` | `string` | Sí | formato uuid | — | Asignado o aceptado | `src/modules/procedures_perioperative/dto/periop.dto.ts:762` |
| `milestones` | `array<object>` | Sí | — | — | Hitos del caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:808` |
| `milestones[].id` | `string` | Sí | — | — | Identificador del hito. | sin fuente |
| `milestones[].milestoneTypeConceptId` | `string` | Sí | — | — | Tipo de hito. | sin fuente |
| `milestones[].statusConceptId` | `string` | Sí | — | — | Estado del hito. | sin fuente |
| `milestones[].plannedAt` | `string` | No | formato date-time | — | Momento planificado, si lo tiene. | sin fuente |
| `milestones[].reachedAt` | `string` | No | formato date-time | — | Momento en que se alcanzó, si ya ocurrió. | sin fuente |
| `preoperativeOrders` | `array<object>` | Sí | — | — | Órdenes preoperatorias | `src/modules/procedures_perioperative/dto/periop.dto.ts:825` |
| `preoperativeOrders[].id` | `string` | Sí | — | — | Identificador de la orden. | sin fuente |
| `preoperativeOrders[].serviceRequestId` | `string` | Sí | — | — | Orden clínica a la que apunta. | sin fuente |
| `preoperativeOrders[].orderRoleConceptId` | `string` | Sí | — | — | Papel de la orden. | sin fuente |
| `preoperativeOrders[].statusConceptId` | `string` | Sí | — | — | Estado: pendiente o verificada. | sin fuente |
| `preoperativeAssessment` | `object` | No | admite null | — | Valoración preoperatoria, si ya se hizo | `src/modules/procedures_perioperative/dto/periop.dto.ts:842` |
| `preoperativeAssessment.id` | `string` | No | — | — | Identificador de la valoración. | sin fuente |
| `preoperativeAssessment.fitnessStatusConceptId` | `string` | No | — | — | Aptitud del paciente para la intervención. | sin fuente |
| `preoperativeAssessment.asaClassConceptId` | `string` | No | — | — | Clase ASA, si se registró. | sin fuente |
| `anesthesiaPlan` | `object` | No | admite null | — | Plan anestésico, si ya se redactó | `src/modules/procedures_perioperative/dto/periop.dto.ts:855` |
| `anesthesiaPlan.id` | `string` | No | — | — | Identificador del plan. | sin fuente |
| `anesthesiaPlan.anesthesiaTypeConceptId` | `string` | No | — | — | Tipo de anestesia previsto. | sin fuente |
| `anesthesiaPlan.statusConceptId` | `string` | No | — | — | Estado del plan: borrador o aprobado. | sin fuente |
| `operativeReports` | `array<object>` | Sí | — | — | Versiones del informe operatorio, de la última a la primera | `src/modules/procedures_perioperative/dto/periop.dto.ts:871` |
| `operativeReports[].id` | `string` | Sí | — | — | Identificador del informe. | sin fuente |
| `operativeReports[].reportVersion` | `number` | Sí | — | — | Número de versión. | sin fuente |
| `operativeReports[].statusConceptId` | `string` | Sí | — | — | Estado: borrador o firmado. | sin fuente |
| `operativeReports[].signedAt` | `string` | No | formato date-time | — | Cuándo se firmó, si ya ocurrió. | sin fuente |
| `operativeSteps` | `array<object>` | Sí | — | — | Pasos de la intervención, en orden | `src/modules/procedures_perioperative/dto/periop.dto.ts:894` |
| `operativeSteps[].id` | `string` | Sí | — | — | Identificador del paso. | sin fuente |
| `operativeSteps[].stepNumber` | `number` | Sí | — | — | Orden dentro de la intervención. | sin fuente |
| `operativeSteps[].stepCodeConceptId` | `string` | Sí | — | — | Código del paso. | sin fuente |
| `operativeSteps[].description` | `string` | Sí | — | — | Descripción escrita por quien lo registró. | sin fuente |
| `operativeSteps[].performedByProfileId` | `string` | No | — | — | Profesional que lo ejecutó, si se registró. | sin fuente |
| `operativeSteps[].bodySiteConceptId` | `string` | No | — | — | Sitio anatómico, si se registró. | sin fuente |
| `operativeSteps[].lateralityConceptId` | `string` | No | — | — | Lateralidad, si aplica. | sin fuente |
| `operativeSteps[].statusConceptId` | `string` | Sí | — | — | Estado del paso. | sin fuente |
| `operativeSteps[].startedAt` | `string` | No | formato date-time | — | Cuándo empezó, si se cronometró. | sin fuente |
| `operativeSteps[].endedAt` | `string` | No | formato date-time | — | Cuándo terminó, si se cronometró. | sin fuente |
| `findings` | `array<object>` | Sí | — | — | Hallazgos registrados durante la intervención | `src/modules/procedures_perioperative/dto/periop.dto.ts:922` |
| `findings[].id` | `string` | Sí | — | — | Identificador del hallazgo. | sin fuente |
| `findings[].operativeStepId` | `string` | No | — | — | Paso en el que se halló, si se ató a uno. | sin fuente |
| `findings[].findingCodeConceptId` | `string` | Sí | — | — | Código del hallazgo. | sin fuente |
| `findings[].findingText` | `string` | Sí | — | — | Descripción escrita por quien lo halló. | sin fuente |
| `findings[].bodySiteConceptId` | `string` | No | — | — | Sitio anatómico, si se registró. | sin fuente |
| `findings[].lateralityConceptId` | `string` | No | — | — | Lateralidad, si aplica. | sin fuente |
| `findings[].severityConceptId` | `string` | No | — | — | Severidad, si se graduó. | sin fuente |
| `findings[].recordedByProfileId` | `string` | No | — | — | Profesional que lo registró, si consta. | sin fuente |
| `findings[].recordedAt` | `string` | Sí | formato date-time | — | Cuándo se registró. | sin fuente |
| `implants` | `array<object>` | Sí | — | — | Implantes colocados, con sus identificadores | `src/modules/procedures_perioperative/dto/periop.dto.ts:955` |
| `implants[].id` | `string` | Sí | — | — | Identificador del implante en el caso. | sin fuente |
| `implants[].procedureId` | `string` | Sí | — | — | Procedimiento clínico al que se imputa. | sin fuente |
| `implants[].implantDeviceId` | `string` | Sí | — | — | Dispositivo implantado. | sin fuente |
| `implants[].implantRoleConceptId` | `string` | Sí | — | — | Papel del implante en la intervención. | sin fuente |
| `implants[].bodySiteConceptId` | `string` | No | — | — | Sitio anatómico, si se registró. | sin fuente |
| `implants[].lateralityConceptId` | `string` | No | — | — | Lateralidad, si aplica. | sin fuente |
| `implants[].implantedAt` | `string` | Sí | formato date-time | — | Cuándo se implantó. | sin fuente |
| `implants[].explantedAt` | `string` | No | formato date-time | — | Cuándo se explantó, si se explantó. | sin fuente |
| `implants[].statusConceptId` | `string` | No | — | — | Estado del implante, si se registró. | sin fuente |
| `implants[].identifiers` | `array<object>` | Sí | — | — | UDI, lote y serie del implante. | sin fuente |
| `implants[].identifiers[].id` | `string` | Sí | — | — | Identificador de la fila. | sin fuente |
| `implants[].identifiers[].identifierTypeConceptId` | `string` | Sí | — | — | Tipo de identificador (UDI-DI, UDI-PI, …). | sin fuente |
| `implants[].identifiers[].identifierValue` | `string` | Sí | — | — | Valor del identificador. | sin fuente |
| `implants[].identifiers[].issuingSystem` | `string` | No | — | — | Sistema emisor, si consta. | sin fuente |
| `implants[].identifiers[].lotNumber` | `string` | No | — | — | Número de lote, si consta. | sin fuente |
| `implants[].identifiers[].serialNumber` | `string` | No | — | — | Número de serie, si consta. | sin fuente |
| `implants[].identifiers[].expirationDate` | `string` | No | formato date-time | — | Vencimiento, si consta. | sin fuente |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 9. PATCH /procedure-cases/{id}

- **Origen:** CONTRATO
- **Nombre:** Modificar el caso quirúrgico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.updateCase` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:151`

### Qué es y para qué sirve (negocio)

Modificar el caso quirúrgico. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /procedure-cases/{id}` la atiende `PeriopController.updateCase` (src/modules/procedures_perioperative/controllers/periop.controller.ts:151). Exige sesión con alguno de los roles SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. Valida el cuerpo como `UpdateCaseDto` (5 campos, 0 obligatorios). Delega en `PeriopCasesService.updateCase`. Crea filas en messaging.domain_events, messaging.outbox_messages, procedures_perioperative.procedure_case_status_history. Actualiza procedures_perioperative.procedure_case_team_members, procedures_perioperative.procedure_cases. Lee messaging.outbox_messages, procedures_perioperative.procedure_case_diagnoses, procedures_perioperative.procedure_case_team_members, procedures_perioperative.procedure_cases. Publica periop.case.reacceptance_required.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:151` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:151` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `procedures_perioperative.procedure_case_diagnoses` | LEE | LEE | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → PeriopCasesService.caseHasBlockingDependencies → PeriopCasesRepository.findDiagnosesByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:549` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:397` |
| `procedures_perioperative.procedure_case_team_members` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.updateCase → PeriopCasesService.updateCase | `src/modules/procedures_perioperative/services/periop-cases.service.ts:446` |
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:607` |
| `procedures_perioperative.procedure_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.updateCase → PeriopCasesService.updateCase | `src/modules/procedures_perioperative/services/periop-cases.service.ts:407` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `periop.case.reacceptance_required` | `src/modules/procedures_perioperative/services/periop-cases.service.ts:471` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateCaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente de la intervención. Sólo corregible con el caso en borrador y sin dependencias (CAN-INT-001). | `src/modules/procedures_perioperative/dto/periop.dto.ts:214` |
| `priority` | `string` | No | valores: ROUTINE, URGENT, STAT | `@IsOptional()` `@IsIn(CASE_PRIORITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:222` |
| `scheduledStartAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:230` |
| `scheduledEndAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:238` |
| `urgencyReasonText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:246` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "priority": "ROUTINE",
  "scheduledStartAt": "2026-07-31T12:00:00.000Z",
  "scheduledEndAt": "2026-07-31T12:00:00.000Z",
  "urgencyReasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<UpdateCaseResponseDto>` · DTO `UpdateCaseResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:257` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:263` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Paciente vigente del caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:269` |
| `patientChanged` | `boolean` | Sí | — | — | true si se corrigió el paciente del caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:275` |
| `reacceptanceRequired` | `boolean` | Sí | — | — | true si la modificación fue relevante y el equipo debe volver a aceptar | `src/modules/procedures_perioperative/dto/periop.dto.ts:284` |
| `acceptancesInvalidated` | `number` | Sí | — | — | Aceptaciones que quedaron invalidadas por la modificación relevante | `src/modules/procedures_perioperative/dto/periop.dto.ts:293` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:81` |

### Flujos

_Se completa en la fase de flujos._

---

## 10. POST /procedure-cases/{id}/anesthesia-events

- **Origen:** CONTRATO
- **Nombre:** Anotar un evento intraoperatorio de anestesia
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.recordAnesthesiaEvent` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:403`

### Qué es y para qué sirve (negocio)

Anotar un evento intraoperatorio de anestesia. Caso de uso UC-53-07: Eventos intraoperatorios. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/anesthesia-events` la atiende `PeriopController.recordAnesthesiaEvent` (src/modules/procedures_perioperative/controllers/periop.controller.ts:403). Exige sesión con alguno de los roles ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN. Valida el cuerpo como `RecordAnesthesiaEventDto` (8 campos, 2 obligatorios). Delega en `PeriopPreopService.recordAnesthesiaEvent`. Crea filas en procedures_perioperative.anesthesia_events, procedures_perioperative.operating_room_utilization_events, procedures_perioperative.procedure_case_milestones, procedures_perioperative.procedure_case_status_history. Actualiza procedures_perioperative.procedure_cases. Lee procedures_perioperative.anesthesia_plans, procedures_perioperative.procedure_case_milestones, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:403` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:403` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.anesthesia_events` | ESCRIBE | CREA | DIRECTA | PeriopController.recordAnesthesiaEvent → PeriopPreopService.recordAnesthesiaEvent → PeriopPreopRepository.createAnesthesiaEvent | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:651` |
| `procedures_perioperative.anesthesia_plans` | LEE | LEE | DIRECTA | PeriopController.recordAnesthesiaEvent → PeriopPreopService.recordAnesthesiaEvent → PeriopPreopRepository.findAnesthesiaPlanByCase | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:551` |
| `procedures_perioperative.operating_room_utilization_events` | ESCRIBE | CREA | DIRECTA | PeriopController.recordAnesthesiaEvent → PeriopPreopService.recordAnesthesiaEvent → PeriopCasesRepository.createUtilizationEvent | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:712` |
| `procedures_perioperative.procedure_case_milestones` | ESCRIBE | CREA | DIRECTA | PeriopController.recordAnesthesiaEvent → PeriopPreopService.recordAnesthesiaEvent → PeriopCasesRepository.createMilestone | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:455` |
| `procedures_perioperative.procedure_case_milestones` | LEE | LEE | DIRECTA | PeriopController.recordAnesthesiaEvent → PeriopPreopService.recordAnesthesiaEvent → PeriopCasesRepository.findMilestone | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:484` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.recordAnesthesiaEvent → PeriopPreopService.recordAnesthesiaEvent → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:397` |
| `procedures_perioperative.procedure_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.recordAnesthesiaEvent → PeriopPreopService.recordAnesthesiaEvent | `src/modules/procedures_perioperative/services/periop-preop.service.ts:819` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.recordAnesthesiaEvent → PeriopPreopService.recordAnesthesiaEvent → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordAnesthesiaEventDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `eventType` | `string` | Sí | valores: INDUCTION, INTUBATION, MEDICATION, VITALS, EMERGENCE, COMPLICATION | `@IsIn(ANESTHESIA_EVENT_TYPES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1589` |
| `occurredAt` | `string` | Sí | formato date-time | `@IsISO8601()` | Momento del evento | `src/modules/procedures_perioperative/dto/periop.dto.ts:1596` |
| `severity` | `string` | No | valores: ROUTINE, MINOR, MAJOR, CRITICAL | `@IsOptional()` `@IsIn(CLINICAL_SEVERITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1604` |
| `medicationAdministrationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1612` |
| `observationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1620` |
| `deviceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1628` |
| `performedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1636` |
| `detailsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Detalle del evento | `src/modules/procedures_perioperative/dto/periop.dto.ts:1644` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "eventType": "INDUCTION",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "eventType": "INDUCTION",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "severity": "ROUTINE",
  "medicationAdministrationId": "00000000-0000-4000-8000-000000000001",
  "observationId": "00000000-0000-4000-8000-000000000001",
  "deviceId": "00000000-0000-4000-8000-000000000001",
  "performedByProfileId": "00000000-0000-4000-8000-000000000001",
  "detailsJson": {}
}
```

</details>

### Respuesta — `Promise<AnesthesiaEventResponseDto>` · DTO `AnesthesiaEventResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1655` |
| `eventTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a event type concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1661` |
| `milestoneId` | `string` | No | formato uuid | — | Hito creado si el evento fue inducción o despertar | `src/modules/procedures_perioperative/dto/periop.dto.ts:1670` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:198` |

### Flujos

_Se completa en la fase de flujos._

---

## 11. POST /procedure-cases/{id}/anesthesia-plans

- **Origen:** CONTRATO
- **Nombre:** Registrar el plan de anestesia y la valoración de vía aérea
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.createAnesthesiaPlan` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:373`

### Qué es y para qué sirve (negocio)

Registrar el plan de anestesia y la valoración de vía aérea. Caso de uso UC-53-06: Plan de anestesia. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/anesthesia-plans` la atiende `PeriopController.createAnesthesiaPlan` (src/modules/procedures_perioperative/controllers/periop.controller.ts:373). Exige sesión con alguno de los roles ANESTHESIOLOGIST, PERIOP_ADMIN. Valida el cuerpo como `CreateAnesthesiaPlanDto` (13 campos, 5 obligatorios). Delega en `PeriopPreopService.createAnesthesiaPlan`. Crea filas en procedures_perioperative.anesthesia_airway_assessments, procedures_perioperative.anesthesia_plans. Lee procedures_perioperative.anesthesia_plans, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:373` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:373` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.anesthesia_airway_assessments` | ESCRIBE | CREA | DIRECTA | PeriopController.createAnesthesiaPlan → PeriopPreopService.createAnesthesiaPlan → PeriopPreopRepository.createAirwayAssessment | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:588` |
| `procedures_perioperative.anesthesia_plans` | ESCRIBE | CREA | DIRECTA | PeriopController.createAnesthesiaPlan → PeriopPreopService.createAnesthesiaPlan → PeriopPreopRepository.createAnesthesiaPlan | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:504` |
| `procedures_perioperative.anesthesia_plans` | LEE | LEE | DIRECTA | PeriopController.createAnesthesiaPlan → PeriopPreopService.createAnesthesiaPlan → PeriopPreopRepository.findAnesthesiaPlanByCase | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:551` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.createAnesthesiaPlan → PeriopPreopService.createAnesthesiaPlan → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAnesthesiaPlanDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `anesthesiologistProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1453` |
| `anesthesiaType` | `string` | Sí | valores: GENERAL, REGIONAL, LOCAL, SEDATION | `@IsIn(ANESTHESIA_TYPES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1460` |
| `airwayPlan` | `string` | No | valores: ETT, LMA, MASK | `@IsOptional()` `@IsIn(AIRWAY_PLANS)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1468` |
| `monitoringPlanJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Monitorización planificada | `src/modules/procedures_perioperative/dto/periop.dto.ts:1476` |
| `medicationsPlanJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Medicación planificada | `src/modules/procedures_perioperative/dto/periop.dto.ts:1484` |
| `postoperativeAnalgesiaPlanText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1492` |
| `airwayAssessment` | `AirwayAssessmentDto` | Sí | — | `@ValidateNested()` `@Type(() => AirwayAssessmentDto)` | Valoración de vía aérea | `src/modules/procedures_perioperative/dto/periop.dto.ts:1503` |
| `airwayAssessment.assessedByProfileId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `airwayAssessment.mallampati` | `string` | No | valores: I, II, III, IV | — | — | sin fuente |
| `airwayAssessment.mouthOpeningMm` | `string` | No | — | — | Apertura bucal en milímetros | sin fuente |
| `airwayAssessment.thyromentalDistanceMm` | `string` | No | — | — | Distancia tiromentoniana en milímetros | sin fuente |
| `airwayAssessment.difficultAirwayExpected` | `boolean` | Sí | — | — | Se anticipa vía aérea difícil | sin fuente |
| `airwayAssessment.rescuePlanText` | `string` | No | — | — | Plan de rescate; obligatorio si se anticipa vía aérea difícil | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "anesthesiologistProfileId": "00000000-0000-4000-8000-000000000001",
  "anesthesiaType": "GENERAL",
  "airwayAssessment": {
    "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
    "difficultAirwayExpected": true
  }
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "anesthesiologistProfileId": "00000000-0000-4000-8000-000000000001",
  "anesthesiaType": "GENERAL",
  "airwayPlan": "ETT",
  "monitoringPlanJson": {},
  "medicationsPlanJson": {},
  "postoperativeAnalgesiaPlanText": "valor-ejemplo",
  "airwayAssessment": {
    "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
    "mallampati": "I",
    "mouthOpeningMm": "valor-ejemplo",
    "thyromentalDistanceMm": "valor-ejemplo",
    "difficultAirwayExpected": true,
    "rescuePlanText": "valor-ejemplo"
  }
}
```

</details>

### Respuesta — `Promise<AnesthesiaPlanResponseDto>` · DTO `AnesthesiaPlanResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1514` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1520` |
| `airwayAssessmentId` | `string` | Sí | formato uuid | — | Identificador asociado a airway assessment. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1526` |
| `difficultAirwayExpected` | `boolean` | Sí | — | — | true si se anticipa vía aérea difícil | `src/modules/procedures_perioperative/dto/periop.dto.ts:1532` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:175` |

### Flujos

_Se completa en la fase de flujos._

---

## 12. POST /procedure-cases/{id}/anesthesia-plans/{planId}/approve

- **Origen:** CONTRATO
- **Nombre:** Aprobar el plan de anestesia
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.approveAnesthesiaPlan` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:390`

### Qué es y para qué sirve (negocio)

Aprobar el plan de anestesia. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/anesthesia-plans/{planId}/approve` la atiende `PeriopController.approveAnesthesiaPlan` (src/modules/procedures_perioperative/controllers/periop.controller.ts:390). Exige sesión con alguno de los roles ANESTHESIOLOGIST, PERIOP_ADMIN. Delega en `PeriopPreopService.approveAnesthesiaPlan`. Actualiza procedures_perioperative.anesthesia_plans, procedures_perioperative.procedure_cases. Lee procedures_perioperative.anesthesia_plans, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:390` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, planId | `src/modules/procedures_perioperative/controllers/periop.controller.ts:390` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.anesthesia_plans` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.approveAnesthesiaPlan → PeriopPreopService.approveAnesthesiaPlan | `src/modules/procedures_perioperative/services/periop-preop.service.ts:712` |
| `procedures_perioperative.anesthesia_plans` | LEE | LEE | DIRECTA | PeriopController.approveAnesthesiaPlan → PeriopPreopService.approveAnesthesiaPlan → PeriopPreopRepository.findAnesthesiaPlanForUpdate | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:533` |
| `procedures_perioperative.procedure_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.approveAnesthesiaPlan → PeriopPreopService.approveAnesthesiaPlan | `src/modules/procedures_perioperative/services/periop-preop.service.ts:716` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.approveAnesthesiaPlan → PeriopPreopService.approveAnesthesiaPlan → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `planId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ApprovePlanResponseDto>` · DTO `ApprovePlanResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1543` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1549` |
| `anesthesiologistProfileId` | `string` | Sí | formato uuid | — | Anestesiólogo asignado al caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:1558` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:176` |

### Flujos

_Se completa en la fase de flujos._

---

## 13. POST /procedure-cases/{id}/cancel

- **Origen:** CONTRATO
- **Nombre:** Cancelar el caso quirúrgico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.cancelCase` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:572`

### Qué es y para qué sirve (negocio)

Cancelar el caso quirúrgico. Caso de uso UC-53-13: Cancelar y liberar quirófano. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:23`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/cancel` la atiende `PeriopController.cancelCase` (src/modules/procedures_perioperative/controllers/periop.controller.ts:572). Exige sesión con alguno de los roles SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. Valida el cuerpo como `CancelCaseDto` (5 campos, 3 obligatorios). Delega en `PeriopCasesService.cancelCase`. Crea filas en procedures_perioperative.operating_room_utilization_events, procedures_perioperative.procedure_cancellations, procedures_perioperative.procedure_case_status_history. Actualiza procedures_perioperative.procedure_cases. Lee procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:572` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:572` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operating_room_utilization_events` | ESCRIBE | CREA | DIRECTA | PeriopController.cancelCase → PeriopCasesService.cancelCase → PeriopCasesRepository.createUtilizationEvent | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:712` |
| `procedures_perioperative.procedure_cancellations` | ESCRIBE | CREA | DIRECTA | PeriopController.cancelCase → PeriopCasesService.cancelCase → PeriopCasesRepository.createCancellation | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:776` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.cancelCase → PeriopCasesService.cancelCase → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:397` |
| `procedures_perioperative.procedure_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.cancelCase → PeriopCasesService.cancelCase | `src/modules/procedures_perioperative/services/periop-cases.service.ts:1423` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.cancelCase → PeriopCasesService.cancelCase → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CancelCaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `cancellationReasonConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Motivo de la cancelación | `src/modules/procedures_perioperative/dto/periop.dto.ts:2655` |
| `category` | `string` | Sí | valores: PATIENT, FACILITY, CLINICAL | `@IsIn(CANCELLATION_CATEGORIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2662` |
| `preventable` | `boolean` | Sí | — | `@IsBoolean()` | Si era evitable; es lo que mide la calidad del proceso | `src/modules/procedures_perioperative/dto/periop.dto.ts:2671` |
| `explanationText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2679` |
| `rescheduleRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2687` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "cancellationReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "category": "PATIENT",
  "preventable": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "cancellationReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "category": "PATIENT",
  "preventable": true,
  "explanationText": "valor-ejemplo",
  "rescheduleRequired": false
}
```

</details>

### Respuesta — `Promise<CancelCaseResponseDto>` · DTO `CancelCaseResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2698` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2704` |
| `cancellationId` | `string` | Sí | formato uuid | — | Registro de la cancelación | `src/modules/procedures_perioperative/dto/periop.dto.ts:2710` |
| `operatingRoomReleased` | `boolean` | Sí | — | — | true si se liberó el quirófano reservado | `src/modules/procedures_perioperative/dto/periop.dto.ts:2716` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:339` |

### Flujos

_Se completa en la fase de flujos._

---

## 14. POST /procedure-cases/{id}/charge-items/post

- **Origen:** CONTRATO
- **Nombre:** Generar los cargos y consolidar el uso del quirófano
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.postCharges` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:588`

### Qué es y para qué sirve (negocio)

Generar los cargos y consolidar el uso del quirófano. Caso de uso UC-53-14: Cargos y utilización. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:24`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/charge-items/post` la atiende `PeriopController.postCharges` (src/modules/procedures_perioperative/controllers/periop.controller.ts:588). Exige sesión con alguno de los roles PERIOP_ADMIN, BILLING. Valida el cuerpo como `PostChargesDto` (8 campos, 4 obligatorios). Delega en `PeriopCasesService.postCharges`. Crea filas en procedures_perioperative.operating_room_utilization_events, procedures_perioperative.procedure_charge_items. Lee procedures_perioperative.procedure_cases, procedures_perioperative.procedure_charge_items.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PERIOP_ADMIN, BILLING | `src/modules/procedures_perioperative/controllers/periop.controller.ts:588` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:588` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operating_room_utilization_events` | ESCRIBE | CREA | DIRECTA | PeriopController.postCharges → PeriopCasesService.postCharges → PeriopCasesRepository.createUtilizationEvent | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:712` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.postCharges → PeriopCasesService.postCharges → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |
| `procedures_perioperative.procedure_charge_items` | ESCRIBE | CREA | DIRECTA | PeriopController.postCharges → PeriopCasesService.postCharges → PeriopCasesRepository.createChargeItem | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:807` |
| `procedures_perioperative.procedure_charge_items` | LEE | LEE | DIRECTA | PeriopController.postCharges → PeriopCasesService.postCharges → PeriopCasesRepository.findChargeItemsForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:843` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PostChargesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ChargeItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ChargeItemDto)` | Cargos a generar, al menos uno | `src/modules/procedures_perioperative/dto/periop.dto.ts:2786` |
| `items[].chargeType` | `string` | Sí | valores: PROCEDURE, IMPLANT, SUPPLY, OR_TIME | `@IsIn(CHARGE_TYPES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2736` |
| `items[].billableItemId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto facturable del catálogo | `src/modules/procedures_perioperative/dto/periop.dto.ts:2746` |
| `items[].quantity` | `string` | Sí | — | `@IsNumberString()` | Cantidad, como cadena decimal | `src/modules/procedures_perioperative/dto/periop.dto.ts:2753` |
| `items[].unitPrice` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Precio unitario | `src/modules/procedures_perioperative/dto/periop.dto.ts:2761` |
| `items[].currencyCode` | `string` | No | longitud máxima 3 | `@IsOptional()` `@IsString()` `@MaxLength(3)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2770` |
| `consolidateUtilization` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Consolidar además el uso real del quirófano | `src/modules/procedures_perioperative/dto/periop.dto.ts:2797` |
| `turnoverSeconds` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Segundos de recambio hasta el siguiente caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:2808` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "items": [
    {
      "chargeType": "PROCEDURE",
      "billableItemId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "items": [
    {
      "chargeType": "PROCEDURE",
      "billableItemId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo",
      "unitPrice": "valor-ejemplo",
      "currencyCode": "BOB"
    }
  ],
  "consolidateUtilization": true,
  "turnoverSeconds": 1
}
```

</details>

### Respuesta — `Promise<PostChargesResponseDto>` · DTO `PostChargesResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2819` |
| `charged` | `number` | Sí | — | — | Cargos generados | `src/modules/procedures_perioperative/dto/periop.dto.ts:2825` |
| `totalAmount` | `string` | Sí | — | — | Importe total de los cargos | `src/modules/procedures_perioperative/dto/periop.dto.ts:2831` |
| `actualDurationSeconds` | `number` | No | — | — | Duración real del caso, en segundos | `src/modules/procedures_perioperative/dto/periop.dto.ts:2837` |
| `scheduleVarianceSeconds` | `number` | No | — | — | Desviación frente a lo programado, en segundos | `src/modules/procedures_perioperative/dto/periop.dto.ts:2845` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:340` |

### Flujos

_Se completa en la fase de flujos._

---

## 15. POST /procedure-cases/{id}/confirm

- **Origen:** CONTRATO
- **Nombre:** Confirmar la intervención verificando las credenciales del equipo
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.confirmCase` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:168`

### Qué es y para qué sirve (negocio)

Confirmar la intervención verificando las credenciales del equipo. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/confirm` la atiende `PeriopController.confirmCase` (src/modules/procedures_perioperative/controllers/periop.controller.ts:168). Exige sesión con alguno de los roles SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. Delega en `PeriopCasesService.confirmCase`. Crea filas en audit.audit_log, messaging.domain_events, messaging.outbox_messages, procedures_perioperative.procedure_case_status_history. Actualiza procedures_perioperative.procedure_cases. Lee audit.audit_log, messaging.outbox_messages, procedures_perioperative.procedure_case_team_members, procedures_perioperative.procedure_cases, profiles.professional_credentials. Publica periop.case.confirmation_blocked.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:168` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:168` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:397` |
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:607` |
| `procedures_perioperative.procedure_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.confirmCase → PeriopCasesService.confirmCase | `src/modules/procedures_perioperative/services/periop-cases.service.ts:613` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → ProfessionalCredentialsRepository.hasCurrentCredential | `src/modules/profiles/repositories/professional-credentials.repository.ts:127` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `periop.case.confirmation_blocked` | `src/modules/procedures_perioperative/services/periop-cases.service.ts:581` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ConfirmCaseResponseDto>` · DTO `ConfirmCaseResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:304` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado tras confirmar | `src/modules/procedures_perioperative/dto/periop.dto.ts:310` |
| `teamVerified` | `number` | Sí | — | — | Miembros del equipo con credencial verificada al confirmar | `src/modules/procedures_perioperative/dto/periop.dto.ts:318` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:82` |

### Flujos

_Se completa en la fase de flujos._

---

## 16. POST /procedure-cases/{id}/diagnoses

- **Origen:** CONTRATO
- **Nombre:** Registrar los diagnósticos del caso
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.addDiagnoses` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:185`

### Qué es y para qué sirve (negocio)

Registrar los diagnósticos del caso. Caso de uso UC-53-02: Diagnósticos y equipo. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:12`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/diagnoses` la atiende `PeriopController.addDiagnoses` (src/modules/procedures_perioperative/controllers/periop.controller.ts:185). Exige sesión con alguno de los roles SURGEON, PERIOP_ADMIN. Valida el cuerpo como `AddDiagnosesDto` (5 campos, 2 obligatorios). Delega en `PeriopCasesService.addDiagnoses`. Crea filas en audit.audit_log, audit.conditions_history, clinical.conditions, procedures_perioperative.procedure_case_diagnoses. Actualiza audit.conditions_history. Lee audit.audit_log, audit.conditions_history, clinical.conditions, procedures_perioperative.procedure_case_diagnoses, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:185` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:185` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |
| `audit.conditions_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create | `src/modules/clinical/services/conditions.service.ts:179` |
| `audit.conditions_history` | ESCRIBE | CREA | POR_REGISTRO | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create | `src/modules/clinical/services/conditions.service.ts:179` |
| `audit.conditions_history` | LEE | LEE | POR_REGISTRO | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create | `src/modules/clinical/services/conditions.service.ts:179` |
| `clinical.conditions` | ESCRIBE | CREA | DIRECTA | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create → ConditionsRepository.create | `src/modules/clinical/repositories/conditions.repository.ts:134` |
| `clinical.conditions` | LEE | LEE | DIRECTA | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create → ConditionsRepository.findActiveByCode | `src/modules/clinical/repositories/conditions.repository.ts:118` |
| `procedures_perioperative.procedure_case_diagnoses` | ESCRIBE | CREA | DIRECTA | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesRepository.createDiagnosis | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:524` |
| `procedures_perioperative.procedure_case_diagnoses` | LEE | LEE | DIRECTA | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesRepository.findDiagnosesByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:549` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AddDiagnosesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `diagnoses` | `array<CaseDiagnosisDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => CaseDiagnosisDto)` | Diagnósticos del caso, al menos uno | `src/modules/procedures_perioperative/dto/periop.dto.ts:394` |
| `diagnoses[].conditionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Condición ya registrada en la historia clínica | `src/modules/procedures_perioperative/dto/periop.dto.ts:344` |
| `diagnoses[].conditionCodeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Código de la condición a registrar si aún no existe | `src/modules/procedures_perioperative/dto/periop.dto.ts:363` |
| `diagnoses[].role` | `string` | Sí | valores: PRIMARY, SECONDARY, POSTOPERATIVE | `@IsIn(DIAGNOSIS_ROLES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:370` |
| `diagnoses[].presentOnAdmission` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Presente al ingresar | `src/modules/procedures_perioperative/dto/periop.dto.ts:378` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "diagnoses": [
    {
      "role": "PRIMARY"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "diagnoses": [
    {
      "conditionId": "00000000-0000-4000-8000-000000000001",
      "conditionCodeConceptId": "00000000-0000-4000-8000-000000000001",
      "role": "PRIMARY",
      "presentOnAdmission": false
    }
  ]
}
```

</details>

### Respuesta — `Promise<DiagnosesResponseDto>` · DTO `DiagnosesResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:405` |
| `diagnosisIds` | `array<string>` | Sí | formato uuid | — | Valor de diagnosis ids mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:411` |
| `skipped` | `number` | Sí | — | — | Diagnósticos que ya estaban registrados y se omitieron | `src/modules/procedures_perioperative/dto/periop.dto.ts:419` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:99` |

### Flujos

_Se completa en la fase de flujos._

---

## 17. POST /procedure-cases/{id}/findings

- **Origen:** CONTRATO
- **Nombre:** Registrar un hallazgo operatorio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.recordFinding` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:433`

### Qué es y para qué sirve (negocio)

Registrar un hallazgo operatorio. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/findings` la atiende `PeriopController.recordFinding` (src/modules/procedures_perioperative/controllers/periop.controller.ts:433). Exige sesión con alguno de los roles SURGEON, PERIOP_ADMIN. Valida el cuerpo como `RecordFindingDto` (8 campos, 2 obligatorios). Delega en `PeriopIntraopService.recordFinding`. Crea filas en procedures_perioperative.operative_findings, procedures_perioperative.procedure_body_sites. Lee procedures_perioperative.operative_steps, procedures_perioperative.procedure_body_sites, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:433` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:433` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operative_findings` | ESCRIBE | CREA | DIRECTA | PeriopController.recordFinding → PeriopIntraopService.recordFinding → PeriopIntraopRepository.createFinding | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:288` |
| `procedures_perioperative.operative_steps` | LEE | LEE | DIRECTA | PeriopController.recordFinding → PeriopIntraopService.recordFinding → PeriopIntraopRepository.findStepById | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:213` |
| `procedures_perioperative.procedure_body_sites` | ESCRIBE | CREA | DIRECTA | PeriopController.recordFinding → PeriopIntraopService.recordFinding → PeriopIntraopRepository.createBodySite | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:339` |
| `procedures_perioperative.procedure_body_sites` | LEE | LEE | DIRECTA | PeriopController.recordFinding → PeriopIntraopService.recordFinding → PeriopIntraopRepository.findBodySite | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:366` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.recordFinding → PeriopIntraopService.recordFinding → PeriopIntraopService.assertCaseInProgress → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordFindingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `findingCodeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código del hallazgo | `src/modules/procedures_perioperative/dto/periop.dto.ts:1759` |
| `findingText` | `string` | Sí | — | `@IsString()` | Qué se encontró | `src/modules/procedures_perioperative/dto/periop.dto.ts:1766` |
| `operativeStepId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paso en el que se observó | `src/modules/procedures_perioperative/dto/periop.dto.ts:1777` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1785` |
| `laterality` | `string` | No | valores: LEFT, RIGHT, BILATERAL | `@IsOptional()` `@IsIn(LATERALITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1793` |
| `severity` | `string` | No | valores: ROUTINE, MINOR, MAJOR, CRITICAL | `@IsOptional()` `@IsIn(CLINICAL_SEVERITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1801` |
| `observationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1809` |
| `recordedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1817` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "findingCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "findingText": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "findingCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "findingText": "valor-ejemplo",
  "operativeStepId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "laterality": "LEFT",
  "severity": "ROUTINE",
  "observationId": "00000000-0000-4000-8000-000000000001",
  "recordedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<FindingResponseDto>` · DTO `FindingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1828` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:218` |

### Flujos

_Se completa en la fase de flujos._

---

## 18. POST /procedure-cases/{id}/implants

- **Origen:** CONTRATO
- **Nombre:** Registrar un implante con su trazabilidad UDI, lote o serie
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.recordImplant` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:450`

### Qué es y para qué sirve (negocio)

Registrar un implante con su trazabilidad UDI, lote o serie. Caso de uso UC-53-09: Implantes con UDI, lote y serie. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/implants` la atiende `PeriopController.recordImplant` (src/modules/procedures_perioperative/controllers/periop.controller.ts:450). Exige sesión con alguno de los roles SURGEON, PERIOP_NURSE, PERIOP_ADMIN. Valida el cuerpo como `RecordImplantDto` (13 campos, 6 obligatorios). Delega en `PeriopIntraopService.recordImplant`. Crea filas en procedures_perioperative.implant_identifiers, procedures_perioperative.procedure_devices, procedures_perioperative.procedure_implants. Lee procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, PERIOP_NURSE, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:450` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:450` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.implant_identifiers` | ESCRIBE | CREA | DIRECTA | PeriopController.recordImplant → PeriopIntraopService.recordImplant → PeriopIntraopRepository.createImplantIdentifier | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:430` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.recordImplant → PeriopIntraopService.recordImplant → PeriopIntraopService.assertCaseInProgress → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |
| `procedures_perioperative.procedure_devices` | ESCRIBE | CREA | DIRECTA | PeriopController.recordImplant → PeriopIntraopService.recordImplant → PeriopIntraopRepository.createDevice | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:482` |
| `procedures_perioperative.procedure_implants` | ESCRIBE | CREA | DIRECTA | PeriopController.recordImplant → PeriopIntraopService.recordImplant → PeriopIntraopRepository.createImplant | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:379` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordImplantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedureId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1918` |
| `implantDeviceId` | `string` | Sí | formato uuid | `@IsUUID()` | Dispositivo implantado | `src/modules/procedures_perioperative/dto/periop.dto.ts:1925` |
| `implantRole` | `string` | Sí | valores: PRIMARY, ADJUNCT | `@IsIn(['PRIMARY', 'ADJUNCT'])` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1932` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1940` |
| `laterality` | `string` | No | valores: LEFT, RIGHT, BILATERAL | `@IsOptional()` `@IsIn(LATERALITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1948` |
| `identifiers` | `array<ImplantIdentifierDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ImplantIdentifierDto)` | Identificadores de trazabilidad, al menos uno | `src/modules/procedures_perioperative/dto/periop.dto.ts:1961` |
| `identifiers[].identifierType` | `string` | Sí | valores: UDI_DI, UDI_PI, SERIAL | `@IsIn(IMPLANT_IDENTIFIER_TYPES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1865` |
| `identifiers[].identifierValue` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Valor del identificador | `src/modules/procedures_perioperative/dto/periop.dto.ts:1873` |
| `identifiers[].issuingSystem` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Sistema emisor | `src/modules/procedures_perioperative/dto/periop.dto.ts:1882` |
| `identifiers[].lotNumber` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1891` |
| `identifiers[].serialNumber` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1900` |
| `identifiers[].expirationDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1908` |
| `udiCarrier` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Portador UDI leído del envase | `src/modules/procedures_perioperative/dto/periop.dto.ts:1973` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "implantDeviceId": "00000000-0000-4000-8000-000000000001",
  "implantRole": "PRIMARY",
  "identifiers": [
    {
      "identifierType": "UDI_DI",
      "identifierValue": "valor-ejemplo"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "implantDeviceId": "00000000-0000-4000-8000-000000000001",
  "implantRole": "PRIMARY",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "laterality": "LEFT",
  "identifiers": [
    {
      "identifierType": "UDI_DI",
      "identifierValue": "valor-ejemplo",
      "issuingSystem": "valor-ejemplo",
      "lotNumber": "valor-ejemplo",
      "serialNumber": "valor-ejemplo",
      "expirationDate": "2026-07-31"
    }
  ],
  "udiCarrier": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ImplantResponseDto>` · DTO `ImplantResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1984` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1990` |
| `identifierIds` | `array<string>` | Sí | formato uuid | — | Valor de identifier ids mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1996` |
| `deviceUseId` | `string` | Sí | formato uuid | — | Registro del dispositivo usado | `src/modules/procedures_perioperative/dto/periop.dto.ts:2005` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:237` |

### Flujos

_Se completa en la fase de flujos._

---

## 19. POST /procedure-cases/{id}/medication-uses

- **Origen:** CONTRATO
- **Nombre:** Registrar el uso de un medicamento en la intervención
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.recordMedicationUse` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:466`

### Qué es y para qué sirve (negocio)

Registrar el uso de un medicamento en la intervención. Caso de uso UC-53-10: Insumos y muestras. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/medication-uses` la atiende `PeriopController.recordMedicationUse` (src/modules/procedures_perioperative/controllers/periop.controller.ts:466). Exige sesión con alguno de los roles ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN. Valida el cuerpo como `RecordMedicationUseDto` (4 campos, 2 obligatorios). Delega en `PeriopIntraopService.recordMedicationUse`. Crea filas en procedures_perioperative.procedure_medication_uses. Lee procedures_perioperative.operative_steps, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:466` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:466` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operative_steps` | LEE | LEE | DIRECTA | PeriopController.recordMedicationUse → PeriopIntraopService.recordMedicationUse → PeriopIntraopRepository.findStepById | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:213` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.recordMedicationUse → PeriopIntraopService.recordMedicationUse → PeriopIntraopService.assertCaseInProgress → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |
| `procedures_perioperative.procedure_medication_uses` | ESCRIBE | CREA | DIRECTA | PeriopController.recordMedicationUse → PeriopIntraopService.recordMedicationUse → PeriopIntraopRepository.createMedicationUse | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:532` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordMedicationUseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `medicationAdministrationId` | `string` | Sí | formato uuid | `@IsUUID()` | Administración registrada en farmacia | `src/modules/procedures_perioperative/dto/periop.dto.ts:2030` |
| `useRole` | `string` | Sí | valores: ANESTHESIA, ANTIBIOTIC, ANALGESIA | `@IsIn(MEDICATION_USE_ROLES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2037` |
| `procedureId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2045` |
| `operativeStepId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paso durante el que se administró | `src/modules/procedures_perioperative/dto/periop.dto.ts:2056` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "medicationAdministrationId": "00000000-0000-4000-8000-000000000001",
  "useRole": "ANESTHESIA"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "medicationAdministrationId": "00000000-0000-4000-8000-000000000001",
  "useRole": "ANESTHESIA",
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "operativeStepId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SuppliesResponseDto>` · DTO `SuppliesResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2128` |
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2134` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:256` |

### Flujos

_Se completa en la fase de flujos._

---

## 20. POST /procedure-cases/{id}/operative-reports

- **Origen:** CONTRATO
- **Nombre:** Redactar el reporte operatorio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.draftReport` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:494`

### Qué es y para qué sirve (negocio)

Redactar el reporte operatorio. Caso de uso UC-53-11: Reporte operatorio. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/operative-reports` la atiende `PeriopController.draftReport` (src/modules/procedures_perioperative/controllers/periop.controller.ts:494). Exige sesión con alguno de los roles SURGEON, PERIOP_ADMIN. Valida el cuerpo como `DraftOperativeReportDto` (17 campos, 3 obligatorios). Delega en `PeriopIntraopService.draftReport`. Crea filas en clinical.procedures, procedures_perioperative.operative_reports, procedures_perioperative.procedure_complications. Actualiza clinical.service_requests. Lee clinical.procedures, clinical.service_requests, procedures_perioperative.operative_reports, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:494` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:494` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.procedures` | ESCRIBE | CREA | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopService.ensureProcedure → ProceduresService.create → ProceduresRepository.create | `src/modules/clinical/repositories/procedures.repository.ts:106` |
| `clinical.procedures` | LEE | LEE | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopService.ensureProcedure → ProceduresService.create → ProceduresRepository.findById | `src/modules/clinical/repositories/procedures.repository.ts:95` |
| `clinical.service_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopService.ensureProcedure → ProceduresService.create | `src/modules/clinical/services/procedures.service.ts:62` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopService.ensureProcedure → ProceduresService.create → ServiceRequestsRepository.findById | `src/modules/clinical/repositories/service-requests.repository.ts:67` |
| `procedures_perioperative.operative_reports` | ESCRIBE | CREA | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopRepository.createReport | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:620` |
| `procedures_perioperative.operative_reports` | LEE | LEE | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopRepository.findLastReport | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:688` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |
| `procedures_perioperative.procedure_complications` | ESCRIBE | CREA | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopRepository.createComplication | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:792` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DraftOperativeReportDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedureId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Procedimiento ya registrado en la historia clínica | `src/modules/procedures_perioperative/dto/periop.dto.ts:2204` |
| `procedureCodeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Código del procedimiento a registrar si aún no existe | `src/modules/procedures_perioperative/dto/periop.dto.ts:2220` |
| `authorProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Autor del reporte | `src/modules/procedures_perioperative/dto/periop.dto.ts:2227` |
| `preoperativeDiagnosisText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2235` |
| `postoperativeDiagnosisText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2243` |
| `procedureDescription` | `string` | Sí | — | `@IsString()` | Descripción de lo realizado | `src/modules/procedures_perioperative/dto/periop.dto.ts:2250` |
| `findingsText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2258` |
| `estimatedBloodLossMl` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Sangrado estimado en mililitros | `src/modules/procedures_perioperative/dto/periop.dto.ts:2266` |
| `drainsText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2274` |
| `complicationsText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2282` |
| `disposition` | `string` | Sí | valores: PACU, ICU, WARD, HOME | `@IsIn(DISPOSITIONS)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2289` |
| `complications` | `array<ComplicationDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ComplicationDto)` | Complicaciones a registrar | `src/modules/procedures_perioperative/dto/periop.dto.ts:2302` |
| `complications[].complicationCodeConceptId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2158` |
| `complications[].severity` | `string` | No | valores: ROUTINE, MINOR, MAJOR, CRITICAL | `@IsIn(CLINICAL_SEVERITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2165` |
| `complications[].relatedness` | `string` | No | valores: PROCEDURE, ANESTHESIA, UNRELATED | `@IsIn(RELATEDNESS)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2172` |
| `complications[].conditionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2180` |
| `complications[].managementText` | `string` | No | — | `@IsOptional()` `@IsString()` | Cómo se manejó | `src/modules/procedures_perioperative/dto/periop.dto.ts:2188` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "procedureDescription": "Texto descriptivo de ejemplo",
  "disposition": "PACU"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "procedureCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "preoperativeDiagnosisText": "valor-ejemplo",
  "postoperativeDiagnosisText": "valor-ejemplo",
  "procedureDescription": "Texto descriptivo de ejemplo",
  "findingsText": "valor-ejemplo",
  "estimatedBloodLossMl": "valor-ejemplo",
  "drainsText": "valor-ejemplo",
  "complicationsText": "valor-ejemplo",
  "disposition": "PACU",
  "complications": [
    {
      "complicationCodeConceptId": "00000000-0000-4000-8000-000000000001",
      "severity": "ROUTINE",
      "relatedness": "PROCEDURE",
      "conditionId": "00000000-0000-4000-8000-000000000001",
      "managementText": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<OperativeReportResponseDto>` · DTO `OperativeReportResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2313` |
| `reportVersion` | `number` | Sí | — | — | Versión del reporte | `src/modules/procedures_perioperative/dto/periop.dto.ts:2319` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2325` |
| `complicationIds` | `array<string>` | Sí | formato uuid | — | Valor de complication ids mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2331` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:282` |

### Flujos

_Se completa en la fase de flujos._

---

## 21. POST /procedure-cases/{id}/operative-reports/{reportId}/sign

- **Origen:** CONTRATO
- **Nombre:** Firmar el reporte operatorio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.signReport` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:510`

### Qué es y para qué sirve (negocio)

Firmar el reporte operatorio. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/operative-reports/{reportId}/sign` la atiende `PeriopController.signReport` (src/modules/procedures_perioperative/controllers/periop.controller.ts:510). Exige sesión con alguno de los roles SURGEON, PERIOP_ADMIN. Valida el cuerpo como `SignReportDto` (2 campos, 1 obligatorio). Delega en `PeriopIntraopService.signReport`. Crea filas en procedures_perioperative.procedure_case_milestones, procedures_perioperative.procedure_case_status_history. Actualiza procedures_perioperative.operative_reports, procedures_perioperative.procedure_cases. Lee procedures_perioperative.operative_reports, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:510` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, reportId | `src/modules/procedures_perioperative/controllers/periop.controller.ts:510` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operative_reports` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.signReport → PeriopIntraopService.signReport | `src/modules/procedures_perioperative/services/periop-intraop.service.ts:592` |
| `procedures_perioperative.operative_reports` | LEE | LEE | DIRECTA | PeriopController.signReport → PeriopIntraopService.signReport → PeriopIntraopRepository.findReportForUpdate | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:655` |
| `procedures_perioperative.procedure_case_milestones` | ESCRIBE | CREA | DIRECTA | PeriopController.signReport → PeriopIntraopService.signReport → PeriopCasesRepository.createMilestone | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:455` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.signReport → PeriopIntraopService.signReport → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:397` |
| `procedures_perioperative.procedure_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.signReport → PeriopIntraopService.signReport | `src/modules/procedures_perioperative/services/periop-intraop.service.ts:606` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.signReport → PeriopIntraopService.signReport → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `reportId` | path | Sí | `string` | — |

### Cuerpo — DTO `SignReportDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `signatureId` | `string` | Sí | formato uuid | `@IsUUID()` | Firma electrónica aplicada | `src/modules/procedures_perioperative/dto/periop.dto.ts:2341` |
| `fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Documento firmado | `src/modules/procedures_perioperative/dto/periop.dto.ts:2349` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "signatureId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "signatureId": "00000000-0000-4000-8000-000000000001",
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SignReportResponseDto>` · DTO `SignReportResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2360` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2366` |
| `caseStatusConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda el caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:2375` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:283` |

### Flujos

_Se completa en la fase de flujos._

---

## 22. POST /procedure-cases/{id}/operative-steps

- **Origen:** CONTRATO
- **Nombre:** Registrar un paso operatorio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.createStep` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:420`

### Qué es y para qué sirve (negocio)

Registrar un paso operatorio. Caso de uso UC-53-08: Pasos y hallazgos. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/operative-steps` la atiende `PeriopController.createStep` (src/modules/procedures_perioperative/controllers/periop.controller.ts:420). Exige sesión con alguno de los roles SURGEON, PERIOP_NURSE, PERIOP_ADMIN. Valida el cuerpo como `CreateOperativeStepDto` (6 campos, 2 obligatorios). Delega en `PeriopIntraopService.createStep`. Crea filas en procedures_perioperative.operative_steps. Lee procedures_perioperative.operative_steps, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, PERIOP_NURSE, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:420` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:420` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operative_steps` | ESCRIBE | CREA | DIRECTA | PeriopController.createStep → PeriopIntraopService.createStep → PeriopIntraopRepository.createStep | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:186` |
| `procedures_perioperative.operative_steps` | LEE | LEE | DIRECTA | PeriopController.createStep → PeriopIntraopService.createStep → PeriopIntraopRepository.findStepsByCase | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:239` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.createStep → PeriopIntraopService.createStep → PeriopIntraopService.assertCaseInProgress → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateOperativeStepDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `stepCodeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código del paso operatorio | `src/modules/procedures_perioperative/dto/periop.dto.ts:1684` |
| `description` | `string` | Sí | — | `@IsString()` | Qué se hizo | `src/modules/procedures_perioperative/dto/periop.dto.ts:1691` |
| `procedureId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1699` |
| `performedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1707` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio anatómico intervenido | `src/modules/procedures_perioperative/dto/periop.dto.ts:1718` |
| `laterality` | `string` | No | valores: LEFT, RIGHT, BILATERAL | `@IsOptional()` `@IsIn(LATERALITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1726` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "stepCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "stepCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "performedByProfileId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "laterality": "LEFT"
}
```

</details>

### Respuesta — `Promise<OperativeStepResponseDto>` · DTO `OperativeStepResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1737` |
| `stepNumber` | `number` | Sí | — | — | Número del paso dentro del caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:1743` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1749` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:217` |

### Flujos

_Se completa en la fase de flujos._

---

## 23. POST /procedure-cases/{id}/pacu-stays

- **Origen:** CONTRATO
- **Nombre:** Admitir al paciente en recuperación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.admitToPacu` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:527`

### Qué es y para qué sirve (negocio)

Admitir al paciente en recuperación. Caso de uso UC-53-12: Recuperación. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/pacu-stays` la atiende `PeriopController.admitToPacu` (src/modules/procedures_perioperative/controllers/periop.controller.ts:527). Exige sesión con alguno de los roles PERIOP_NURSE, ANESTHESIOLOGIST, PERIOP_ADMIN. Valida el cuerpo como `AdmitToPacuDto` (2 campos, 1 obligatorio). Delega en `PeriopIntraopService.admitToPacu`. Crea filas en procedures_perioperative.pacu_stays, procedures_perioperative.procedure_case_locations. Lee procedures_perioperative.pacu_stays, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PERIOP_NURSE, ANESTHESIOLOGIST, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:527` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:527` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.pacu_stays` | ESCRIBE | CREA | DIRECTA | PeriopController.admitToPacu → PeriopIntraopService.admitToPacu → PeriopIntraopRepository.createPacuStay | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:844` |
| `procedures_perioperative.pacu_stays` | LEE | LEE | DIRECTA | PeriopController.admitToPacu → PeriopIntraopService.admitToPacu → PeriopIntraopRepository.findPacuStayByCase | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:887` |
| `procedures_perioperative.procedure_case_locations` | ESCRIBE | CREA | DIRECTA | PeriopController.admitToPacu → PeriopIntraopService.admitToPacu → PeriopCasesRepository.createLocation | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:640` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.admitToPacu → PeriopIntraopService.admitToPacu → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AdmitToPacuDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `careSpaceId` | `string` | Sí | formato uuid | `@IsUUID()` | Espacio de recuperación | `src/modules/procedures_perioperative/dto/periop.dto.ts:2389` |
| `admittedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2397` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "careSpaceId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "admittedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<PacuStayResponseDto>` · DTO `PacuStayResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2408` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2414` |
| `locationId` | `string` | Sí | formato uuid | — | Ubicación del caso creada | `src/modules/procedures_perioperative/dto/periop.dto.ts:2420` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:307` |

### Flujos

_Se completa en la fase de flujos._

---

## 24. POST /procedure-cases/{id}/preoperative-assessments

- **Origen:** CONTRATO
- **Nombre:** Registrar la valoración preoperatoria y sus puntuaciones de riesgo
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.createAssessment` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:214`

### Qué es y para qué sirve (negocio)

Registrar la valoración preoperatoria y sus puntuaciones de riesgo. Caso de uso UC-53-03: Valoración y riesgo. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/preoperative-assessments` la atiende `PeriopController.createAssessment` (src/modules/procedures_perioperative/controllers/periop.controller.ts:214). Exige sesión con alguno de los roles ANESTHESIOLOGIST, SURGEON, PERIOP_ADMIN. Valida el cuerpo como `CreatePreopAssessmentDto` (15 campos, 5 obligatorios). Delega en `PeriopPreopService.createAssessment`. Crea filas en procedures_perioperative.preoperative_assessments, procedures_perioperative.preoperative_risk_scores, procedures_perioperative.procedure_case_milestones. Lee procedures_perioperative.preoperative_assessments, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:214` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:214` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.preoperative_assessments` | ESCRIBE | CREA | DIRECTA | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopPreopRepository.createAssessment | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:144` |
| `procedures_perioperative.preoperative_assessments` | LEE | LEE | DIRECTA | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopPreopRepository.findAssessmentByCase | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:178` |
| `procedures_perioperative.preoperative_risk_scores` | ESCRIBE | CREA | DIRECTA | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopPreopRepository.createRiskScore | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:215` |
| `procedures_perioperative.procedure_case_milestones` | ESCRIBE | CREA | DIRECTA | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopCasesRepository.createMilestone | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:455` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePreopAssessmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `assessmentType` | `string` | Sí | valores: ANESTHESIA, SURGICAL | `@IsIn(['ANESTHESIA', 'SURGICAL'])` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1001` |
| `assessedByProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Profesional que valora | `src/modules/procedures_perioperative/dto/periop.dto.ts:1008` |
| `fitnessStatus` | `string` | Sí | valores: FIT, FIT_WITH_CAUTION, UNFIT | `@IsIn(FITNESS_STATUSES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1015` |
| `asaClass` | `string` | No | valores: I, II, III, IV, V | `@IsOptional()` `@IsIn(ASA_CLASSES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1023` |
| `allergiesReviewed` | `boolean` | Sí | — | `@IsBoolean()` | Se revisaron las alergias del paciente | `src/modules/procedures_perioperative/dto/periop.dto.ts:1030` |
| `medicationsReviewed` | `boolean` | Sí | — | `@IsBoolean()` | Se revisó la medicación del paciente | `src/modules/procedures_perioperative/dto/periop.dto.ts:1037` |
| `anticoagulationPlanText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1045` |
| `fastingInstructionsText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1053` |
| `assessmentJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Detalle estructurado de la valoración | `src/modules/procedures_perioperative/dto/periop.dto.ts:1061` |
| `riskScores` | `array<RiskScoreDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => RiskScoreDto)` | Puntuaciones de riesgo calculadas | `src/modules/procedures_perioperative/dto/periop.dto.ts:1074` |
| `riskScores[].model` | `string` | No | valores: ASA, RCRI, APFEL | `@IsIn(RISK_MODELS)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:560` |
| `riskScores[].modelVersion` | `string` | No | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | Versión del modelo aplicada | `src/modules/procedures_perioperative/dto/periop.dto.ts:568` |
| `riskScores[].scoreValue` | `string` | No | — | `@IsNumberString()` | Puntuación obtenida | `src/modules/procedures_perioperative/dto/periop.dto.ts:575` |
| `riskScores[].inputsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Entradas con las que se calculó | `src/modules/procedures_perioperative/dto/periop.dto.ts:583` |
| `riskScores[].interpretationText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:591` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "assessmentType": "ANESTHESIA",
  "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
  "fitnessStatus": "FIT",
  "allergiesReviewed": true,
  "medicationsReviewed": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "assessmentType": "ANESTHESIA",
  "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
  "fitnessStatus": "FIT",
  "asaClass": "I",
  "allergiesReviewed": true,
  "medicationsReviewed": true,
  "anticoagulationPlanText": "valor-ejemplo",
  "fastingInstructionsText": "valor-ejemplo",
  "assessmentJson": {},
  "riskScores": [
    {
      "model": "ASA",
      "modelVersion": "valor-ejemplo",
      "scoreValue": "valor-ejemplo",
      "inputsJson": {},
      "interpretationText": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<PreopAssessmentResponseDto>` · DTO `PreopAssessmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1085` |
| `fitnessStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a fitness status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1091` |
| `riskScoreIds` | `array<string>` | Sí | formato uuid | — | Valor de risk score ids mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1097` |
| `milestoneId` | `string` | No | formato uuid | — | Hito de aptitud preoperatoria, si el paciente quedó apto | `src/modules/procedures_perioperative/dto/periop.dto.ts:1106` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:133` |

### Flujos

_Se completa en la fase de flujos._

---

## 25. POST /procedure-cases/{id}/preoperative-orders

- **Origen:** CONTRATO
- **Nombre:** Indicar una orden preoperatoria para el caso
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.createPreoperativeOrder` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:238`

### Qué es y para qué sirve (negocio)

Indicar una orden preoperatoria para el caso. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/preoperative-orders` la atiende `PeriopController.createPreoperativeOrder` (src/modules/procedures_perioperative/controllers/periop.controller.ts:238). Exige sesión con alguno de los roles ANESTHESIOLOGIST, SURGEON, PERIOP_ADMIN. Valida el cuerpo como `CreatePreoperativeOrderDto` (4 campos, 1 obligatorio). Delega en `PeriopPreopService.createOrder`. Crea filas en clinical.service_requests, procedures_perioperative.preoperative_orders. Lee clinical.encounters, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:238` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:238` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:167` |
| `clinical.service_requests` | ESCRIBE | CREA | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestsRepository.create | `src/modules/clinical/repositories/service-requests.repository.ts:78` |
| `procedures_perioperative.preoperative_orders` | ESCRIBE | CREA | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → PeriopPreopRepository.createOrder | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:266` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePreoperativeOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Orden clínica ya existente | `src/modules/procedures_perioperative/dto/periop.dto.ts:1136` |
| `serviceRequestCodeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Código de la orden clínica a registrar si aún no existe | `src/modules/procedures_perioperative/dto/periop.dto.ts:1151` |
| `orderRole` | `string` | Sí | valores: LAB, IMAGING, CONSULT, MEDICATION | `@IsIn(PREOP_ORDER_ROLES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1158` |
| `mandatory` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si es obligatoria antes de la cirugía; una pendiente impide que el caso quede listo | `src/modules/procedures_perioperative/dto/periop.dto.ts:1170` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "orderRole": "LAB"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "orderRole": "LAB",
  "mandatory": true
}
```

</details>

### Respuesta — `Promise<PreoperativeOrderResponseDto>` · DTO `PreoperativeOrderResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1179` |
| `serviceRequestId` | `string` | Sí | formato uuid | — | Identificador asociado a service request. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1185` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1191` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 26. POST /procedure-cases/{id}/preoperative-orders/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar las órdenes preoperatorias
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.verifyOrders` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:339`

### Qué es y para qué sirve (negocio)

Verificar las órdenes preoperatorias. Caso de uso UC-53-04: Clearance de órdenes. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/preoperative-orders/verify` la atiende `PeriopController.verifyOrders` (src/modules/procedures_perioperative/controllers/periop.controller.ts:339). Exige sesión con alguno de los roles ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN. Valida el cuerpo como `VerifyOrdersDto` (2 campos, 2 obligatorios). Delega en `PeriopPreopService.verifyOrders`. Crea filas en procedures_perioperative.procedure_case_status_history. Actualiza procedures_perioperative.procedure_cases. Lee procedures_perioperative.preoperative_orders, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:339` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:339` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.preoperative_orders` | LEE | LEE | DIRECTA | PeriopController.verifyOrders → PeriopPreopService.verifyOrders → PeriopPreopRepository.findOrdersByCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:310` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.verifyOrders → PeriopPreopService.verifyOrders → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:397` |
| `procedures_perioperative.procedure_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.verifyOrders → PeriopPreopService.verifyOrders | `src/modules/procedures_perioperative/services/periop-preop.service.ts:415` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.verifyOrders → PeriopPreopService.verifyOrders → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `VerifyOrdersDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `orderIds` | `array<string>` | Sí | formato uuid; mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@IsUUID(undefined, { each: true })` | Órdenes que se dan por verificadas | `src/modules/procedures_perioperative/dto/periop.dto.ts:1207` |
| `verifiedByProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Profesional que verifica | `src/modules/procedures_perioperative/dto/periop.dto.ts:1214` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "orderIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "verifiedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "orderIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "verifiedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VerifyOrdersResponseDto>` · DTO `VerifyOrdersResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1225` |
| `verified` | `number` | Sí | — | — | Órdenes que pasaron a verificadas | `src/modules/procedures_perioperative/dto/periop.dto.ts:1231` |
| `pendingMandatory` | `number` | Sí | — | — | Órdenes obligatorias que siguen pendientes | `src/modules/procedures_perioperative/dto/periop.dto.ts:1237` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda el caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:1246` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:147` |

### Flujos

_Se completa en la fase de flujos._

---

## 27. POST /procedure-cases/{id}/safety-checklists/{checklistId}/responses

- **Origen:** CONTRATO
- **Nombre:** Responder una fase del checklist quirúrgico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.submitChecklistPhase` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:355`

### Qué es y para qué sirve (negocio)

Responder una fase del checklist quirúrgico. Caso de uso UC-53-05: Checklist por fases. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/safety-checklists/{checklistId}/responses` la atiende `PeriopController.submitChecklistPhase` (src/modules/procedures_perioperative/controllers/periop.controller.ts:355). Exige sesión con alguno de los roles PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST, PERIOP_ADMIN. Valida el cuerpo como `SubmitChecklistPhaseDto` (8 campos, 5 obligatorios). Delega en `PeriopPreopService.submitChecklistPhase`. Crea filas en procedures_perioperative.procedure_case_milestones, procedures_perioperative.surgical_safety_responses. Actualiza procedures_perioperative.surgical_safety_checklists. Lee procedures_perioperative.surgical_safety_checklists, procedures_perioperative.surgical_safety_items, procedures_perioperative.surgical_safety_responses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:355` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, checklistId | `src/modules/procedures_perioperative/controllers/periop.controller.ts:355` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.procedure_case_milestones` | ESCRIBE | CREA | DIRECTA | PeriopController.submitChecklistPhase → PeriopPreopService.submitChecklistPhase → PeriopCasesRepository.createMilestone | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:455` |
| `procedures_perioperative.surgical_safety_checklists` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.submitChecklistPhase → PeriopPreopService.submitChecklistPhase | `src/modules/procedures_perioperative/services/periop-preop.service.ts:544` |
| `procedures_perioperative.surgical_safety_checklists` | LEE | LEE | DIRECTA | PeriopController.submitChecklistPhase → PeriopPreopService.submitChecklistPhase → PeriopPreopRepository.findChecklistForUpdate | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:377` |
| `procedures_perioperative.surgical_safety_items` | LEE | LEE | DIRECTA | PeriopController.submitChecklistPhase → PeriopPreopService.submitChecklistPhase → PeriopPreopRepository.findItemsByPhase | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:406` |
| `procedures_perioperative.surgical_safety_responses` | ESCRIBE | CREA | DIRECTA | PeriopController.submitChecklistPhase → PeriopPreopService.submitChecklistPhase → PeriopPreopRepository.createResponse | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:466` |
| `procedures_perioperative.surgical_safety_responses` | LEE | LEE | DIRECTA | PeriopController.submitChecklistPhase → PeriopPreopService.submitChecklistPhase → PeriopPreopRepository.findResponsesByChecklist | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:488` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `checklistId` | path | Sí | `string` | — |

### Cuerpo — DTO `SubmitChecklistPhaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `phase` | `string` | Sí | valores: SIGN_IN, TIME_OUT, SIGN_OUT | `@IsIn(CHECKLIST_PHASES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1313` |
| `respondedByProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Profesional que responde | `src/modules/procedures_perioperative/dto/periop.dto.ts:1320` |
| `responses` | `array<ChecklistResponseItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ChecklistResponseItemDto)` | Respuestas de la fase | `src/modules/procedures_perioperative/dto/periop.dto.ts:1333` |
| `responses[].itemId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1270` |
| `responses[].status` | `string` | Sí | valores: CONFIRMED, NOT_APPLICABLE, EXCEPTION | `@IsIn(RESPONSE_STATUSES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1277` |
| `responses[].responseBoolean` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1285` |
| `responses[].responseText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1293` |
| `responses[].exceptionReason` | `string` | No | — | `@IsOptional()` `@IsString()` | Justificación; obligatoria cuando la respuesta es EXCEPTION | `src/modules/procedures_perioperative/dto/periop.dto.ts:1303` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "phase": "SIGN_IN",
  "respondedByProfileId": "00000000-0000-4000-8000-000000000001",
  "responses": [
    {
      "itemId": "00000000-0000-4000-8000-000000000001",
      "status": "CONFIRMED"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "phase": "SIGN_IN",
  "respondedByProfileId": "00000000-0000-4000-8000-000000000001",
  "responses": [
    {
      "itemId": "00000000-0000-4000-8000-000000000001",
      "status": "CONFIRMED",
      "responseBoolean": true,
      "responseText": "valor-ejemplo",
      "exceptionReason": "Texto descriptivo de ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<ChecklistPhaseResponseDto>` · DTO `ChecklistPhaseResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `checklistId` | `string` | Sí | formato uuid | — | Identificador asociado a checklist. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1344` |
| `recorded` | `number` | Sí | — | — | Respuestas registradas en esta fase | `src/modules/procedures_perioperative/dto/periop.dto.ts:1350` |
| `phaseCompleted` | `boolean` | Sí | — | — | true si la fase quedó completa | `src/modules/procedures_perioperative/dto/periop.dto.ts:1356` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1362` |
| `milestoneId` | `string` | No | formato uuid | — | Hito de time-out, si la fase completada fue esa | `src/modules/procedures_perioperative/dto/periop.dto.ts:1371` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:159` |

### Flujos

_Se completa en la fase de flujos._

---

## 28. POST /procedure-cases/{id}/specimens

- **Origen:** CONTRATO
- **Nombre:** Registrar una muestra tomada en la intervención
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.recordSpecimen` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:481`

### Qué es y para qué sirve (negocio)

Registrar una muestra tomada en la intervención. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/specimens` la atiende `PeriopController.recordSpecimen` (src/modules/procedures_perioperative/controllers/periop.controller.ts:481). Exige sesión con alguno de los roles SURGEON, PERIOP_NURSE, PERIOP_ADMIN. Valida el cuerpo como `RecordSpecimenDto` (7 campos, 3 obligatorios). Delega en `PeriopIntraopService.recordSpecimen`. Crea filas en procedures_perioperative.procedure_specimens. Lee procedures_perioperative.operative_steps, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, PERIOP_NURSE, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:481` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:481` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operative_steps` | LEE | LEE | DIRECTA | PeriopController.recordSpecimen → PeriopIntraopService.recordSpecimen → PeriopIntraopRepository.findStepById | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:213` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.recordSpecimen → PeriopIntraopService.recordSpecimen → PeriopIntraopService.assertCaseInProgress → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |
| `procedures_perioperative.procedure_specimens` | ESCRIBE | CREA | DIRECTA | PeriopController.recordSpecimen → PeriopIntraopService.recordSpecimen → PeriopIntraopRepository.createSpecimen | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:590` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordSpecimenDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedureId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2066` |
| `specimenId` | `string` | Sí | formato uuid | `@IsUUID()` | Muestra registrada en laboratorio | `src/modules/procedures_perioperative/dto/periop.dto.ts:2076` |
| `specimenRole` | `string` | Sí | valores: BIOPSY, RESECTION, CULTURE | `@IsIn(SPECIMEN_ROLES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2083` |
| `operativeStepId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2091` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2099` |
| `orientationText` | `string` | No | — | `@IsOptional()` `@IsString()` | Orientación de la pieza para el patólogo | `src/modules/procedures_perioperative/dto/periop.dto.ts:2109` |
| `surgeonComment` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2117` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "specimenId": "00000000-0000-4000-8000-000000000001",
  "specimenRole": "BIOPSY"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "specimenId": "00000000-0000-4000-8000-000000000001",
  "specimenRole": "BIOPSY",
  "operativeStepId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "orientationText": "valor-ejemplo",
  "surgeonComment": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<SuppliesResponseDto>` · DTO `SuppliesResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2128` |
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2134` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:257` |

### Flujos

_Se completa en la fase de flujos._

---

## 29. GET /procedure-cases/{id}/team-members

- **Origen:** CONTRATO
- **Nombre:** Listar el equipo del caso quirúrgico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.listTeamMembers` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:263`

### Qué es y para qué sirve (negocio)

Listar el equipo del caso quirúrgico. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /procedure-cases/{id}/team-members` la atiende `PeriopController.listTeamMembers` (src/modules/procedures_perioperative/controllers/periop.controller.ts:263). Exige sesión con alguno de los roles SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. Delega en `PeriopCasesService.listTeamMembers`. Lee procedures_perioperative.procedure_case_team_members, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:263` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:263` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.listTeamMembers → PeriopCasesService.listTeamMembers → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:607` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.listTeamMembers → PeriopCasesService.listTeamMembers → PeriopCasesRepository.findCaseById | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:187` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TeamMemberSummaryDto[]>` · DTO `TeamMemberSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:744` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/procedures_perioperative/dto/periop.dto.ts:750` |
| `teamRoleConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a team role concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:756` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Asignado o aceptado | `src/modules/procedures_perioperative/dto/periop.dto.ts:762` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 30. POST /procedure-cases/{id}/team-members

- **Origen:** CONTRATO
- **Nombre:** Asignar un miembro al equipo quirúrgico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.assignTeamMember` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:201`

### Qué es y para qué sirve (negocio)

Asignar un miembro al equipo quirúrgico. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/team-members` la atiende `PeriopController.assignTeamMember` (src/modules/procedures_perioperative/controllers/periop.controller.ts:201). Exige sesión con alguno de los roles SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. Valida el cuerpo como `AssignTeamMemberDto` (2 campos, 2 obligatorios). Delega en `PeriopCasesService.assignTeamMember`. Crea filas en procedures_perioperative.procedure_case_team_members. Actualiza procedures_perioperative.procedure_cases. Lee procedures_perioperative.procedure_case_team_members, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:201` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:201` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.procedure_case_team_members` | ESCRIBE | CREA | DIRECTA | PeriopController.assignTeamMember → PeriopCasesService.assignTeamMember → PeriopCasesRepository.createTeamMember | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:588` |
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.assignTeamMember → PeriopCasesService.assignTeamMember → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:607` |
| `procedures_perioperative.procedure_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.assignTeamMember → PeriopCasesService.assignTeamMember | `src/modules/procedures_perioperative/services/periop-cases.service.ts:876` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.assignTeamMember → PeriopCasesService.assignTeamMember → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AssignTeamMemberDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:444` |
| `role` | `string` | Sí | valores: SURGEON, ASSISTANT, ANESTHESIOLOGIST, SCRUB_NURSE, CIRCULATING_NURSE | `@IsIn(TEAM_ROLES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:451` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "role": "SURGEON"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "role": "SURGEON"
}
```

</details>

### Respuesta — `Promise<TeamMemberResponseDto>` · DTO `TeamMemberResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:514` |
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:520` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:526` |
| `teamSize` | `number` | Sí | — | — | Miembros del equipo tras la asignación | `src/modules/procedures_perioperative/dto/periop.dto.ts:532` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:100` |

### Flujos

_Se completa en la fase de flujos._

---

## 31. POST /procedure-cases/{id}/team-members/{memberId}/accept

- **Origen:** CONTRATO
- **Nombre:** Aceptar la participación en el equipo quirúrgico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.acceptTeamMember` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:285`

### Qué es y para qué sirve (negocio)

Aceptar la participación en el equipo quirúrgico. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/team-members/{memberId}/accept` la atiende `PeriopController.acceptTeamMember` (src/modules/procedures_perioperative/controllers/periop.controller.ts:285). Exige sesión con alguno de los roles SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. Delega en `PeriopCasesService.acceptTeamMember`. Lee procedures_perioperative.procedure_case_team_members, procedures_perioperative.procedure_cases, profiles.professional_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:285` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, memberId | `src/modules/procedures_perioperative/controllers/periop.controller.ts:285` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.acceptTeamMember → PeriopCasesService.acceptTeamMember → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:607` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.acceptTeamMember → PeriopCasesService.acceptTeamMember → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | PeriopController.acceptTeamMember → PeriopCasesService.acceptTeamMember → ProfessionalCredentialsRepository.hasCurrentCredential | `src/modules/profiles/repositories/professional-credentials.repository.ts:127` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `memberId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TeamMemberResponseDto>` · DTO `TeamMemberResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:514` |
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:520` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:526` |
| `teamSize` | `number` | Sí | — | — | Miembros del equipo tras la asignación | `src/modules/procedures_perioperative/dto/periop.dto.ts:532` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 32. POST /procedure-cases/{id}/team-members/{memberId}/respond

- **Origen:** CONTRATO
- **Nombre:** Rechazar, pedir cambios o informar indisponibilidad
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.respondTeamMember` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:315`

### Qué es y para qué sirve (negocio)

Rechazar, pedir cambios o informar indisponibilidad. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/team-members/{memberId}/respond` la atiende `PeriopController.respondTeamMember` (src/modules/procedures_perioperative/controllers/periop.controller.ts:315). Exige sesión con alguno de los roles SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. Valida el cuerpo como `RespondTeamMemberDto` (2 campos, 2 obligatorios). Delega en `PeriopCasesService.respondTeamMember`. Crea filas en audit.audit_log, messaging.domain_events, messaging.outbox_messages. Lee audit.audit_log, messaging.outbox_messages, procedures_perioperative.procedure_case_team_members, procedures_perioperative.procedure_cases. Publica periop.case.team_participation_declined.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:315` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, memberId | `src/modules/procedures_perioperative/controllers/periop.controller.ts:315` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PeriopController.respondTeamMember → PeriopCasesService.respondTeamMember → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PeriopController.respondTeamMember → PeriopCasesService.respondTeamMember → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PeriopController.respondTeamMember → PeriopCasesService.respondTeamMember → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PeriopController.respondTeamMember → PeriopCasesService.respondTeamMember → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PeriopController.respondTeamMember → PeriopCasesService.respondTeamMember → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.respondTeamMember → PeriopCasesService.respondTeamMember → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:607` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.respondTeamMember → PeriopCasesService.respondTeamMember → PeriopCasesRepository.findCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:195` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `periop.case.team_participation_declined` | `src/modules/procedures_perioperative/services/periop-cases.service.ts:1322` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `memberId` | path | Sí | `string` | — |

### Cuerpo — DTO `RespondTeamMemberDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `response` | `string` | Sí | valores: DECLINE, REQUEST_CHANGE, UNAVAILABLE | `@IsIn(TEAM_PARTICIPATION_RESPONSES)` | Rechazo, solicitud de modificación o indisponibilidad informada | `src/modules/procedures_perioperative/dto/periop.dto.ts:486` |
| `reasonText` | `string` | Sí | longitud mínima 1; longitud máxima 2000 | `@IsString()` `@MinLength(1)` `@MaxLength(2000)` | Motivo de la respuesta (obligatorio) | `src/modules/procedures_perioperative/dto/periop.dto.ts:503` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "response": "DECLINE",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "response": "DECLINE",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<TeamMemberResponseDto>` · DTO `TeamMemberResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:514` |
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:520` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:526` |
| `teamSize` | `number` | Sí | — | — | Miembros del equipo tras la asignación | `src/modules/procedures_perioperative/dto/periop.dto.ts:532` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:118` |

### Flujos

_Se completa en la fase de flujos._

---

