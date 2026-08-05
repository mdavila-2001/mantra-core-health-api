# Repositorios de laboratorio de pruebas

Acceso a `qa_lab.*` con MikroORM. Sin reglas de negocio.

## Fuente de datos

PostgreSQL, schema `qa_lab`. Entidades generadas por introspección. Las altas usan
`em.create(..., { partial: true })` **sin flush**: lo cierra la transacción del servicio.

## Repositorios

| Repositorio | Tablas | Métodos destacados |
| --- | --- | --- |
| `QaCatalogRepository` | `test_environments`, `test_suites`, `test_cases`, `test_assertions`, `test_schedules` | `createEnvironment`, `findEnvironmentByCode`, `findSuiteForUpdate`, `createCase`, `findCaseByCode`, `findCasesBySuiteForUpdate`, `countActiveCases`, `createAssertion`, `findAssertionsByCase`, `createSchedule`, `findScheduleByCode` |
| `QaRunsRepository` | `test_runs`, `test_case_results`, `assertion_results`, `request_payloads`, `response_payloads`, `run_artifacts`, `test_defects` | `createRun`, `findRunForUpdate`, `findLastRun`, `findRunsInProgress`, `createCaseResult`, `findCaseResult`, `findResultsByRun`, `createAssertionResult`, `countAssertionResults`, `createRequestPayload`, `createResponsePayload`, `createArtifact`, `findArtifactsByRun`, `createDefect`, `findDefectBySignatureForUpdate` |

La división separa lo que se **define** de lo que se **ejecuta**: el catálogo cambia cuando alguien
escribe pruebas, la ejecución en cada corrida.

## Lecturas con bloqueo

`findSuiteForUpdate` (añadir casos y publicar), `findRunForUpdate`, `findCaseResultForUpdate` y
`findDefectForUpdate` usan `LockMode.PESSIMISTIC_WRITE`.

`findCasesBySuiteForUpdate` bloquea **la colección** de casos de la suite: publicar los activa todos
a la vez, y activarlos a medias dejaría una suite que ejecuta un subconjunto arbitrario.

`findDefectBySignatureForUpdate` es la consulta clave de la deduplicación: busca por
`(test_case_id, failure_signature_hash)` **bloqueando**. Sin el bloqueo, dos fallos simultáneos del
mismo caso abrirían dos defectos idénticos.

## Lecturas de idempotencia

`findCaseResult` (corrida + caso) impide ejecutar el mismo caso dos veces en una corrida.
`countAssertionResults` impide evaluar dos veces. `findEnvironmentByCode`, `findCaseByCode`,
`findScheduleByCode`, `findRunByNumber` y `findDefectByNumber` anticipan la UNIQUE correspondiente.

## Numeración secuencial

`findLastRun` devuelve la corrida más reciente de la suite, de cuyo número sale el siguiente.
`countDefects` cumple el mismo papel para el correlativo de defectos. Ambos se contrastan después
contra la UNIQUE mediante `findRunByNumber` / `findDefectByNumber`, que es la garantía real.

## Evidencia inmutable

`createRequestPayload`, `createResponsePayload` y `createAssertionResult` sólo insertan. No hay
método de actualización ni de borrado para estas tablas, y es deliberado: la reproducibilidad de una
corrida depende de que su evidencia no se pueda tocar.

## Rendimiento

Consultas por PK, FK, clave natural o firma de fallo, todas indexadas. `countActiveCases` y
`countAssertionResults` son `COUNT` sobre índice, no carga de colecciones. Sin N+1.

## Pruebas

Se ejercitan desde los specs de servicio, donde van mockeados. La cobertura real de los bloqueos y
de las UNIQUE llega con las pruebas de integración.
