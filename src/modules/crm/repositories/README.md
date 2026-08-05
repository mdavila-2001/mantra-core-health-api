# Repositorios de CRM

Acceso a `crm.*` con MikroORM. Sin reglas de negocio.

## Fuente de datos

PostgreSQL, schema `crm`. Entidades generadas por introspección. Las altas usan
`em.create(..., { partial: true })` **sin flush**: lo cierra la transacción del servicio.

## Repositorios

| Repositorio | Tablas | Métodos destacados |
| --- | --- | --- |
| `CrmSalesRepository` | `crm_accounts`, `account_team_members`, `contacts`, `contact_channel_endpoints`, `leads`, `opportunities`, `pipeline_stages`, `opportunity_stage_history` | `createAccount`, `createTeamMember`, `findTeamMember`, `createContact`, `findChannelEndpointForUpdate`, `createLead`, `findLeadByIdForUpdate`, `createOpportunity`, `findOpportunityByIdForUpdate`, `findStageById`, `recordStageChange` |
| `CrmServiceRepository` | `crm_activities`, `crm_tasks`, `crm_notes`, `partnerships`, `partnership_agreements`, `crm_cases`, `crm_case_comments`, `crm_case_status_history` | `createActivity`, `createTask`, `createNote`, `createPartnership`, `createAgreement`, `createCase`, `findCaseByNumber`, `findCaseByIdForUpdate`, `createCaseComment`, `recordCaseStatusChange`, `findActivitiesByAccount`, `findCasesByAccount` |

La división sigue los dos frentes del módulo: el ciclo comercial (cuenta → lead → oportunidad) y el
de servicio (actividad, alianza, caso). Ambos comparten cuenta y contacto, que viven en el primero.

## Lecturas con bloqueo

`findLeadByIdForUpdate`, `findOpportunityByIdForUpdate`, `findCaseByIdForUpdate` y
`findChannelEndpointForUpdate` usan `LockMode.PESSIMISTIC_WRITE`: todas preceden a una mutación de
estado que no debe intercalarse con otra petición.

## Lecturas por clave natural

`findTeamMember` (cuenta + usuario) y `findCaseByNumber` (tenant + número) anticipan el conflicto de
la UNIQUE para devolver un error de dominio en vez de un fallo de base. La constraint sigue siendo
la garantía real ante dos peticiones simultáneas.

## Registros append-only

`recordStageChange` y `recordCaseStatusChange` escriben historial que no se actualiza ni se borra:
son la base del análisis de pipeline y de los SLA de soporte.

## Filtros y orden

`findActivitiesByAccount` y `findCasesByAccount` alimentan la vista 360: orden descendente por fecha
y `limit` explícito (50), para que la vista no crezca sin control con la antigüedad de la cuenta.

## Rendimiento

Consultas por PK, FK o clave natural indexada. Sin N+1: la vista 360 lanza las dos consultas en
paralelo (`Promise.all`) en lugar de recorrer relaciones una por una.

## Pruebas

Se ejercitan desde los specs de servicio, donde van mockeados. La cobertura real de las consultas
llega con las pruebas de integración sobre testcontainers.
