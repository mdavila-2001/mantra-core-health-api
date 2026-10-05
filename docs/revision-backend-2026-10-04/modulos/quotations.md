# Revisión del módulo `quotations` — ALOVIDA

## Alcance y evidencia

- Fecha: 2026-10-05. Controlador, servicio, repositorios, DTO y plan de pagos.
- `corepack yarn test src/modules/quotations --runInBand --silent` → **4 suites y 53 tests pasan**. No prueba autorización por paciente con dos tenants.

## Hallazgos confirmados

### QUOTE-01 — Crítica — práctica autorizada no implica acceso a cualquier paciente

El alta exige perfil profesional y alcance de `practiceId`, y valida que el servicio sea de esa práctica ([quotations.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/quotations/services/quotations.service.ts#L81-L141)). Después persiste `dto.patientProfileId` y `appointmentId` sin cargar paciente, comprobar política clínica ni validar cita ([#L143-L184](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/quotations/services/quotations.service.ts#L143-L184)). El listado recibe cualquier `patientProfileId` y filtra sólo las prácticas alcanzables, no el permiso sobre el paciente ([#L216-L247](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/quotations/services/quotations.service.ts#L216-L247), [quotations.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/quotations/controllers/quotations.controller.ts#L70-L85)).

Un profesional T1 puede crear ofertas financieras para paciente T2 o enumerar sus cotizaciones si alguna práctica alcanzable las tiene. Resolver y autorizar paciente antes de crear/listar; validar que cita, paciente, servicio y práctica se relacionen; filtrar/ocultar el recurso ajeno. Probar relación clínica válida, cita del mismo paciente, paciente/cita T2 sin writes y `404/RESOURCE_NOT_FOUND/QUOTATION_PATIENT_NOT_AVAILABLE`.

### QUOTE-02 — Media — modo interno sin tenant permite a `SECURITY_ADMIN` alcanzar cualquier práctica

`alcanzaPractica` permite a `SECURITY_ADMIN` cualquier práctica existente cuando `getCurrentTenantId()` es `undefined` ([quotations.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/quotations/services/quotations.service.ts#L257-L283)). El comentario lo atribuye a carriles internos, pero el servicio no distingue un caller interno confiable de una petición que perdió contexto. Requerir identidad de sistema explícita y rechazar ausencia de tenant en rutas HTTP; probar contexto T1, sistema interno autenticado y admin sin contexto con `403/FORBIDDEN/QUOTATION_TENANT_CONTEXT_REQUIRED`.

## Olas

| Ola | Hallazgos | Esfuerzo |
|---|---|---:|
| 0 | QUOTE-01 | M |
| 1 | QUOTE-02 | S |
