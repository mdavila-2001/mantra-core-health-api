# Repositorios perioperatorios

Acceso a `procedures_perioperative.*` con MikroORM. Sin reglas de negocio.

## Fuente de datos

PostgreSQL, schema `procedures_perioperative`. Entidades generadas por introspección. Las altas usan
`em.create(..., { partial: true })` **sin flush**: lo cierra la transacción del servicio.

## Repositorios

| Repositorio | Área | Métodos destacados |
| --- | --- | --- |
| `PeriopCasesRepository` | Caso, estado, hitos, diagnósticos, equipo, ubicaciones, quirófano, cancelación, cargos | `createCase`, `findCaseForUpdate`, `findCaseByNumber`, `findOverlappingCases`, `createStatusHistory`, `createMilestone`, `findMilestone`, `createDiagnosis`, `findDiagnosesByCase`, `createTeamMember`, `findTeamByCase`, `createLocation`, `findOpenLocation`, `createUtilizationEvent`, `createCancellation`, `createChargeItem`, `findChargeItemsForUpdate` |
| `PeriopPreopRepository` | Valoración, riesgo, órdenes, checklist, anestesia | `createAssessment`, `findAssessmentByCase`, `createRiskScore`, `findOrdersByCaseForUpdate`, `findChecklistForUpdate`, `findItemsByPhase`, `createResponse`, `findResponsesByChecklist`, `createAnesthesiaPlan`, `findAnesthesiaPlanForUpdate`, `createAirwayAssessment`, `createAnesthesiaEvent` |
| `PeriopIntraopRepository` | Pasos, hallazgos, implantes, insumos, reporte, PACU | `createStep`, `findStepsByCase`, `createFinding`, `createBodySite`, `findBodySite`, `createImplant`, `createImplantIdentifier`, `createDevice`, `createMedicationUse`, `createSpecimen`, `createReport`, `findLastReport`, `createComplication`, `createPacuStay`, `findPacuStayForUpdate`, `createPacuAssessment`, `findAssessmentsByStay` |

La división sigue las tres fases reales del quirófano —lo que se **decide** antes, lo que se
**hace** dentro y lo que **gobierna** el caso de punta a punta— porque son las que tienen actores y
tiempos distintos.

## Lecturas con bloqueo

`findCaseForUpdate` es la más usada del módulo: el caso es el agregado que gobierna el flujo, y
**toda** operación que lo toque lo bloquea. Además, `findChecklistForUpdate`,
`findAnesthesiaPlanForUpdate`, `findStepForUpdate`, `findReportForUpdate`, `findPacuStayForUpdate` y
`findChargeItemsForUpdate` usan `LockMode.PESSIMISTIC_WRITE`.

`findOrdersByCaseForUpdate` bloquea **la colección** de órdenes: verificar una y decidir si el caso
queda listo exige ver el conjunto sin que otra petición lo cambie en medio.

## La consulta de solape

`findOverlappingCases` filtra por quirófano, estados que todavía lo ocupan y solape real —el caso
existente empieza antes del fin pedido y termina después del inicio pedido—. Es la que impide
reservar dos veces la misma sala; la restricción de exclusión de la base sigue siendo la garantía
última.

## Lecturas de idempotencia

`findAssessmentByCase`, `findAnesthesiaPlanByCase`, `findPacuStayByCase` y `findBodySite` anticipan
lo que ya existe para no duplicarlo. `findMilestone` evita crear dos veces el mismo hito.
`findCaseByNumber` contrasta el correlativo antes de chocar con la UNIQUE.

## Evidencia inmutable

`createStatusHistory`, `createRiskScore`, `createResponse`, `createAirwayAssessment`,
`createAnesthesiaEvent`, `createFinding`, `createImplantIdentifier`, `createComplication`,
`createPacuAssessment` y `createUtilizationEvent` sólo insertan. No hay método de actualización ni
de borrado para estas tablas: son el registro clínico y de seguridad del caso.

## Lecturas ordenadas

`findStepsByCase` (por número de paso), `findDiagnosesByCase` (por secuencia) y `findItemsByPhase`
(por orden de presentación) devuelven el orden que importa clínicamente.
`findAssessmentsByStay` va de la más reciente a la más antigua: el alta se decide sobre la última.

## Rendimiento

Consultas por PK, FK o clave natural indexada. La de solape filtra por quirófano y rango de fechas,
ambos indexados. Sin N+1: nada recorre relaciones fila por fila.

## Pruebas

Se ejercitan desde los specs de servicio, donde van mockeados. La cobertura real de los bloqueos,
del solape y de las UNIQUE llega con las pruebas de integración.
