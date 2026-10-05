# Revisión del módulo `medical_groups` — ALOVIDA

## Alcance y evidencia

- Fecha: 2026-10-05. Controlador, servicio, repositorios y DTOs completos.
- `corepack yarn test src/modules/medical_groups --runInBand --silent` → **exit 1: no se encontró ninguna prueba**.

## Hallazgos confirmados

### MG-01 — Crítica — un profesional puede asociar un paciente ajeno si omite el diagnóstico

Al crear, el servicio comprueba que el servicio pertenece a una práctica propia ([medical-groups.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/medical_groups/services/medical-groups.service.ts#L82-L110)). Si llega `patientProfileId`, sólo comprueba existencia; `assertPuedeLeerHistoria` se ejecuta exclusivamente dentro de `if (dto.conditionId !== undefined)` ([#L112-L148](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/medical_groups/services/medical-groups.service.ts#L112-L148)). Luego persiste `patientProfileId` y lo expone en el DTO/listado a los miembros ([#L188-L201](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/medical_groups/services/medical-groups.service.ts#L188-L201), [#L295-L309](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/medical_groups/services/medical-groups.service.ts#L295-L309)).

Un profesional de T1 puede crear grupo sobre paciente T2 sin condición y revelar/vincular ese paciente al equipo invitado. Ejecutar siempre la política clínica cuando haya paciente, antes de persistir; comprobar que los invitados pertenezcan al alcance permitido. Probar paciente autorizado, condición correcta, paciente T2 sin condición y `404/RESOURCE_NOT_FOUND/MEDICAL_GROUP_PATIENT_NOT_AVAILABLE`.

### MG-02 — Alta — no hay tests para ningún flujo de grupo médico

La ejecución dirigida no encuentra specs. Esto deja sin regresión alta, invitación, aislamiento paciente, respuestas, reprogramación, expiración e inmutabilidad.

Crear specs unitarias para controles del servicio e integración para dos prácticas/tenants. Como mínimo: correcto, límite, error y falla catalogada por cada endpoint; añadir una regresión de MG-01 antes del arreglo.

### MG-03 — Media — lista de miembros sin máximo

`members` admite `@ArrayMinSize(0)` sin máximo ([medical-groups.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/medical_groups/dto/medical-groups.dto.ts#L82-L96)); el servicio busca y crea cada invitación en serie ([medical-groups.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/medical_groups/services/medical-groups.service.ts#L151-L233)). Definir tope, deduplicar y rechazar máximo+1 con `400/VALIDATION_FAILED/MEDICAL_GROUP_MEMBER_BATCH_TOO_LARGE`.

## Olas

| Ola | Hallazgos | Esfuerzo |
|---|---|---:|
| 0 | MG-01 | S |
| 1 | MG-02 | M |
| 2 | MG-03 | S |
