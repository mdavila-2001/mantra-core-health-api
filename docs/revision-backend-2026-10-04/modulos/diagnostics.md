# Revisión del módulo `diagnostics` — ALOVIDA

## Alcance y evidencia

- Fecha: 2026-10-05. Controladores, servicios de imagen, laboratorio, especímenes, informes, resultados y DTOs.
- `corepack yarn test src/modules/diagnostics --runInBand --silent` → **20 suites y 146 tests pasan**. Emitió tres advertencias de import JSON sin atributo. No prueba RLS, relaciones clínicas ni dos tenants reales.

## Hallazgos confirmados

### DIAG-01 — Crítica — writes clínicos aceptan tenant, paciente y recursos relacionados sin política de alcance

Imagen permite al rol clínico crear endpoint, almacenar estudio, adjuntar media y registrar dosis ([diagnostics-imaging.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts#L42-L138)). `createEndpoint` persiste `dto.tenantId`; `storeStudy` carga endpoint por UUID y persiste paciente, custodio, encuentro y solicitud sin verificar relaciones ([diagnostics-imaging.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostics/services/diagnostics-imaging.service.ts#L80-L158)). Media persiste tenant, paciente, archivo y encuentro del cuerpo ([diagnostics-media-quality.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostics/services/diagnostics-media-quality.service.ts#L35-L90)).

Informes y críticos reciben tenant/paciente/observación/autor del body o cargan notificación global ([diagnostics-reports.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostics/services/diagnostics-reports.service.ts#L48-L124), [#L205-L304](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostics/services/diagnostics-reports.service.ts#L205-L304)). Especímenes se crean con paciente y tenant recibidos; acesión mezcla especímenes globales ([diagnostics-specimens.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostics/services/diagnostics-specimens.service.ts#L58-L150)); rechazo, contenedor y custodia cargan por UUID global ([#L168-L280](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostics/services/diagnostics-specimens.service.ts#L168-L280)).

Las lecturas de acesión y espécimen sí buscan `(id, custodianTenantId)` ([diagnostics-specimens.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostics/services/diagnostics-specimens.service.ts#L300-L371)); no corrigen los writes.

**Plan.** Derivar custodio del contexto o recurso raíz autorizado. Resolver paciente, encuentro, solicitud, endpoint, archivo, espécimen, observación y perfil dentro de una cadena. Reemplazar lookups globales y rechazar lotes de tenants mezclados.

| Caso | Preparación e input | Resultado esperado |
|---|---|---|
| Correcto | Profesional autorizado y cadena paciente/encuentro/archivo T1. | write T1 coherente. |
| Límite | Acesión con especímenes válidos T1. | una acesión T1. |
| Error | Actor T1 combina paciente, archivo, espécimen u observación T2. | cero writes. |
| Falla catalogada | UUID T2. | `404`, `RESOURCE_NOT_FOUND`, `DIAGNOSTICS_RESOURCE_NOT_AVAILABLE`. |

### DIAG-02 — Alta — listado de estudios por paciente no autoriza el acceso al paciente

`GET /diagnostics/patients/:patientProfileId/imaging-studies` pasa paciente y tenant al servicio sin actor ([diagnostics-imaging.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts#L65-L77)); el servicio consulta por tenant/paciente sin política clínica ([diagnostics-imaging.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostics/services/diagnostics-imaging.service.ts#L52-L76)).

**Plan y pruebas.** Aplicar política clínica paciente–profesional antes de listar. Probar profesional asignado, profesional sin vínculo y `404/RESOURCE_NOT_FOUND/DIAGNOSTICS_PATIENT_NOT_AVAILABLE`.

### DIAG-03 — Media — lotes de series, resultados, archivos y especímenes no tienen máximo

DTOs de laboratorio, informes, imagen y especímenes usan arrays sin `ArrayMaxSize` ([lab.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostics/dto/lab.dto.ts#L120-L135), [reports.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostics/dto/reports.dto.ts#L140-L164), [imaging.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostics/dto/imaging.dto.ts#L170-L255), [specimens.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostics/dto/specimens.dto.ts#L112-L128)). Definir máximo/deduplicación antes de transacción; probar máximo, máximo+1 y `400/VALIDATION_FAILED/DIAGNOSTICS_BATCH_TOO_LARGE`.

## Olas

| Ola | Hallazgos | Esfuerzo |
|---|---|---:|
| 0 | DIAG-01, DIAG-02 | L |
| 2 | DIAG-03 | S |

Tras corregir ejecutar la suite dirigida más integración con dos tenants, paciente, encuentro y archivos reales.
