# Revisión del módulo `organization_extensions` — ALOVIDA

## Alcance y evidencia

- Fecha: 2026-10-05. Controladores, servicios, repositorios, DTO y entidades de
  hospitales, licencias, afiliaciones y fronteras de datos.
- `corepack yarn test src/modules/organization_extensions --runInBand --silent`
  → **8 suites y 34 pruebas aprobadas**. Los mocks no representan otro tenant ni
  ejecutan RLS.

## Hallazgos confirmados

### ORGEXT-01 — Crítica — mutaciones por ID de hospital, licencia y afiliación no comprueban el alcance de tenant

Los controladores limitan la ruta a `SECURITY_ADMIN`, pero los servicios cargan
hospital, licencia y afiliación únicamente por UUID. `activate` y
`addServiceLine` usan `findById(id)` ([orgext-hospitals.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/organization_extensions/services/orgext-hospitals.service.ts#L118-L230));
`verify` usa una búsqueda equivalente de licencia ([orgext-facility-licenses.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/organization_extensions/services/orgext-facility-licenses.service.ts#L98-L132));
y `terminate` hace lo mismo con afiliación
([orgext-affiliations.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/organization_extensions/services/orgext-affiliations.service.ts#L137-L170)).
Los repositorios aplican `{ id }`, sin tenant
([hospitals.repository.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/organization_extensions/repositories/hospitals.repository.ts#L60-L78),
[facility-licenses.repository.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/organization_extensions/repositories/facility-licenses.repository.ts#L64-L83),
[organization-affiliations.repository.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/organization_extensions/repositories/organization-affiliations.repository.ts#L61-L82)).

El interceptor de tenant contrasta los IDs declarados en cuerpo/query, pero no
puede derivar el tenant propietario de un UUID de ruta. Como RLS es opt-in en la
configuración, un `SECURITY_ADMIN` de T1 puede activar un hospital T2, verificar
su licencia, modificar líneas o terminar una afiliación ajena.

**Plan de corrección.** Resolver el tenant activo una vez y crear búsquedas
`findByIdInTenant`. Para afiliaciones, exigir que el actor tenga el alcance
autorizado sobre ambos lados o introducir un flujo SYSTEM con identidad explícita.
Todas las rutas que reciben ID deben usar dichas búsquedas antes de leer o
mutar; la ausencia fuera del alcance debe ser indistinguible de inexistencia.

| Caso | Tipo y preparación | Entrada / resultado esperado |
| --- | --- | --- |
| Correcto | Integración: administrador T1, hospital/licencia T1. | Activar, verificar, crear y retirar línea: éxito. |
| Límite | Integración: afiliación permitida entre organizaciones autorizadas. | Valida ambos extremos y registra outbox. |
| Error | Integración: actor T1, IDs T2. | Ninguna transición ni evento de T2. |
| Falla catalogada | E2E: hospital, licencia o afiliación ajena. | `404`, `RESOURCE_NOT_FOUND`, `ORGEXT_RESOURCE_NOT_AVAILABLE`. |

### ORGEXT-02 — Media — no hay prueba de autorización ni de RLS para las rutas de administración

Las ocho suites aprobadas son unitarias de delegación y reglas de estado. Ninguna
prueba dirigida ejercita dos tenants, la resolución de `X-Tenant-Id`, RLS o la
distinción entre `SECURITY_ADMIN` de tenant y `SYSTEM`. Por la naturaleza de
licencias y fronteras de datos, un mock de repositorio no puede demostrar esas
fronteras.

Agregar integración con PostgreSQL para hospital, licencia y afiliación de T1/T2;
probar actor propio, actor ajeno, cabecera contradictoria y contexto SYSTEM. Cada
negativa debe afirmar `404`, `RESOURCE_NOT_FOUND` y el reason estable de
indisponibilidad del recurso.

## Olas

| Ola | Hallazgos | Esfuerzo |
|---|---|---:|
| 0 | ORGEXT-01 | M |
| 2 | ORGEXT-02 | S |
