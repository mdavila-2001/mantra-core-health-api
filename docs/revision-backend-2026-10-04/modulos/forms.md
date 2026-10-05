# Revisión del módulo `forms` — ALOVIDA

## Alcance y evidencia

Se revisaron definiciones, asignaciones, instancias, valores, migraciones y autoservicio del paciente. `corepack yarn test src/modules/forms --runInBand --silent` aprobó **9 suites y 129 pruebas**.

## Hallazgo confirmado

### FORM-01 — Alta — Clínicos del tenant pueden leer formularios de cualquier paciente del mismo tenant

`GET /forms/instances?encounter=` y `GET /forms/instances/:id` exigen sólo `CLINICIAN` o `PRACTITIONER` y no reciben ni pasan el actor al servicio ([`forms-instances.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/forms/controllers/forms-instances.controller.ts#L67-L98)). `FormsReadService` resuelve el encuentro y compara únicamente `encounter.tenantId` con el contexto ([`forms-read.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/forms/services/forms-read.service.ts#L264-L313), [`…591-L605`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/forms/services/forms-read.service.ts#L591-L605)); no llama a `ClinicalReadService` ni comprueba relación asistencial, consentimiento o acceso clínico sobre `encounter.patientProfileId`.

Un clínico del tenant que conozca un UUID de encuentro o instancia ajeno puede recuperar valores de formularios clínicos del paciente. El autoservicio `forms/me` sí ancla paciente y tenant, por lo que no mitiga las rutas clínicas generales.

**Plan:** pasar `AuthenticatedUser` a las lecturas clínicas y exigir `ClinicalReadService.assertPuedeLeerHistoria(encounter.patientProfileId, actor)` después de resolver el encuentro y antes de cargar instancias/valores. Conservar el 404 uniforme fuera de alcance y registrar la denegación sin contenido.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Clínico con relación vigente consulta formulario del paciente | `200` con valores permitidos |
| Límite | Mismo tenant sin relación clínica activa | denegación uniforme, sin metadatos de instancia |
| Error | UUID de instancia de paciente ajeno | `404` sin valores ni identificador de encuentro |
| Falla catalogada | Actor sin autorización clínica consulta por encuentro | `404/RESOURCE_NOT_FOUND/FORM_INSTANCE_OUT_OF_SCOPE` |

## Controles verificados

El autoservicio deriva el paciente de sesión; las asignaciones y sets aplican alcance de tenant; el valor dinámico usa columnas exclusivas. Faltan pruebas de dos clínicos y dos pacientes para las rutas de lectura profesional.
