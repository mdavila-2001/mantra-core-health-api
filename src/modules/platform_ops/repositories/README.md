# Repositorios de operaciones de plataforma

Acceso a datos de `platform_ops.*`. Sin lógica de negocio: sólo lecturas, escrituras y el modo de
bloqueo que cada operación necesita.

## Reparto

| Repositorio | Tablas | Por qué va junto |
| --- | --- | --- |
| `OpsReleasesRepository` | componentes, herramientas, ventanas, cambios, aprobaciones, artefactos, despliegues | Todo lo que recorre un release, del cambio al despliegue |
| `OpsIncidentsRepository` | health checks y corridas, incidentes, respondientes, timeline, comunicaciones, postmortems y acciones | El incidente y su historia |
| `OpsReliabilityRepository` | SLO y mediciones, políticas y quema, planes y mediciones de capacidad | Lo que se mide de forma continua |
| `OpsPracticesRepository` | revisiones y hallazgos, runbooks, versiones y ejecuciones, ejercicios y objetivos de recuperación | Prácticas periódicas, no continuas |
| `OpsImprovementsRepository` | `operational_improvement_items` | Ver abajo |

`OpsImprovementsRepository` tiene una sola tabla y un solo método a propósito: es el backlog común de
tres fuentes —postmortem, revisión de preparación y ejercicio de resiliencia—, y cada una vive en un
servicio distinto. Colgarla de cualquiera de ellos obligaría a los otros dos a depender de un
repositorio que no es suyo.

## Lecturas con bloqueo

| Método | Modo | Por qué |
| --- | --- | --- |
| `findWindowForUpdate` | `FOR UPDATE` | Atarle un cambio comprueba que quepa dentro |
| `findChangeRequestForUpdate` | `FOR UPDATE` | La transición de estado del cambio debe ser atómica |
| `findDeploymentForUpdate` | `FOR UPDATE` | Revertir toca el despliegue de origen |
| `findCurrentDeploymentForUpdate` | `FOR UPDATE` | Sólo hay un vigente por componente+entorno |
| `findIncidentForUpdate` | `FOR UPDATE` | Transición del incidente |
| `findOpenIncidentByCheckForUpdate` | `FOR UPDATE` | Evita abrir un segundo incidente por la misma caída |
| `findPolicyForUpdate` | `FOR UPDATE` | Evaluar la quema lee el umbral mientras decide |
| `findCapacityPlanForUpdate` | `FOR UPDATE` | Recomputar el plan |
| `findReviewForUpdate` / `findFindingsForUpdate` | `FOR UPDATE` | Cerrar la revisión y sus hallazgos es una operación en bloque |
| `findRunbookForUpdate` | `FOR UPDATE` | Mover `current_version_id` |
| `findExerciseForUpdate` / `findRecoveryObjectiveForUpdate` | `FOR UPDATE` | El ejercicio se mide contra un objetivo que no debe cambiar mientras se compara |

El resto son lecturas simples: catálogo, comprobación de duplicados y precondiciones.

## Consultas que llevan semántica

- **`findPreviousSucceededDeployment`** — el último correcto del mismo componente y entorno,
  excluyendo el que se revierte, ordenado por inicio descendente. Es el artefacto al que se vuelve.
- **`findGoReview`** — la revisión completada con decisión "go" más reciente del componente. Es la
  puerta de producción de UC-46-04.
- **`findFreezingPolicies`** — políticas activas con `deployment_freeze_on_exhaustion`. El servicio
  las recorre y mira el último evento de quema de cada una.
- **`findRecentRuns(healthCheckId, limit)`** — de la más reciente a la más antigua. El servicio
  cuenta los fallos consecutivos desde el principio de esa lista.
- **`findMeasurementByWindow`** — es la clave de idempotencia del evaluador de SLO.
- **`findApprovals`** — ordenadas por paso, porque el orden es parte de la regla.

## Números correlativos

`countChangeRequests(tenantId)`, `countIncidents(tenantId)` y `countDeployments()` alimentan la
generación de `CHG-######`, `INC-######` y `DEP-######`. El número de despliegue es único en todo el
módulo, no por componente; los otros dos, por tenant.

## Auditoría

Toda creación de tabla con columnas de auditoría pasa por `createdBy(actorUserId)`. Los logs
append-only —corridas, timeline, comunicaciones, mediciones, quema, ejecuciones de runbook— no la
usan: no tienen columnas de modificación que auditar, y llevan sus propias marcas de tiempo.

## Pruebas

Los repositorios no tienen suite propia; se ejercitan como dobles desde los cuatro servicios.
