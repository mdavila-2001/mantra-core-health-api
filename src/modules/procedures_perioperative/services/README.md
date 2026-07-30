# Servicios perioperatorios

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

| Servicio | Casos de uso | Responsabilidad |
| --- | --- | --- |
| `PeriopCasesService` | 01, 02, 13, 14 | Programación, diagnósticos y equipo, cancelación y cargos |
| `PeriopPreopService` | 03 … 07 | Valoración, clearance, checklist y anestesia |
| `PeriopIntraopService` | 08 … 12 | Intervención, implantes, insumos, reporte y recuperación |

## Reglas de negocio

- **Programación (01)**: comprueba el solape de quirófano, numera el caso, deja registrada la
  primera transición, crea el hito y el evento de reserva, y sienta al cirujano en el equipo.
- **Diagnósticos (02)**: numera continuando los existentes, omite condiciones ya registradas y
  rechaza un segundo principal.
- **Equipo (02)**: rechaza duplicar persona y rol; asignar anestesiólogo lo deja también en el caso.
- **Valoración (03)**: exige revisar alergias y medicación, guarda puntuaciones inmutables con
  modelo y versión, y sólo crea el hito de clearance si el paciente es apto.
- **Órdenes (04)**: sólo desde caso programado; el caso pasa a listo cuando ninguna queda pendiente.
- **Checklist (05)**: valida que el ítem sea de la fase, exige justificación en las excepciones,
  cierra la fase cuando no queda obligatorio sin responder y completa el checklist con las tres.
- **Anestesia (06)**: un plan por caso; vía aérea difícil exige plan de rescate. Aprobar deja al
  anestesiólogo asignado.
- **Eventos (07)**: la inducción exige plan aprobado y abre el caso —estado, `actual_start_at`,
  historial y evento de inicio de quirófano—. Inducción y despertar dejan hito, sin duplicarlo.
- **Pasos y hallazgos (08)**: sólo sobre caso en curso; el paso se numera correlativo y el sitio
  anatómico del hallazgo se acumula en el procedimiento.
- **Implantes (09)**: al menos un identificador, y el uso del dispositivo se registra aparte con el
  lote y la serie del primero.
- **Insumos (10)**: el paso indicado, si lo hay, debe ser del caso.
- **Reporte (11)**: versión nueva sobre la anterior; firmar cierra el caso y crea el hito de fin.
- **Recuperación (12)**: una estancia por caso, con su ubicación; la valoración informa del criterio
  y el alta lo exige, cerrando la ubicación y creando órdenes y seguimientos.
- **Cancelación (13)**: sólo desde estados vivos; libera el quirófano y registra si era evitable.
- **Cargos (14)**: sólo caso completado y una sola vez; consolida duración real y desviación.

## El caso es el agregado

Toda operación bloquea el caso, incluso las que escriben en otras tablas. Es deliberado: el estado
del caso decide qué se puede registrar (`assertCaseInProgress`), y leerlo sin bloquear permitiría
que dos peticiones simultáneas vieran estados distintos del mismo quirófano.

Ese estado se mueve en cuatro puntos, y sólo en cuatro:

| Transición | Quién la provoca |
| --- | --- |
| `scheduled → ready-for-surgery` | Verificar la última orden pendiente |
| `ready → in-progress` | La inducción anestésica |
| `in-progress → completed` | Firmar el reporte operatorio |
| `* → cancelled` | Cancelar el caso |

Cada una deja fila en `procedure_case_status_history`. No hay forma de mover el estado sin que
quede registrado quién y por qué.

## Criterio de alta de recuperación

`ALDRETE_DISCHARGE_THRESHOLD = 9`. La valoración devuelve `meetsDischargeCriteria` pero **no** da el
alta; el alta lee la valoración más reciente y la exige. Separarlos es lo que impide que anotar una
puntuación saque al paciente de recuperación sin que nadie lo decida.

## Dependencias

`EntityManager`, los repositorios del módulo y `PinoLogger`. `PeriopPreopService` y
`PeriopIntraopService` usan `PeriopCasesRepository` para leer y mover el caso, crear hitos y
registrar eventos de quirófano: no es escritura cruzada de esquema, es el mismo agregado.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción, incluida la programación completa (caso + historial +
hito + evento de quirófano + cirujano). `FOR UPDATE` sobre el caso siempre, y sobre checklist, plan,
reporte, estancia y cargos según corresponda; las órdenes preoperatorias se leen bloqueadas como
colección. `row_version` aporta bloqueo optimista.

## Excepciones

`ResourceNotFoundException` (caso, orden, checklist, plan, paso, reporte o estancia inexistente),
`PreconditionFailedException` (ventana invertida, urgencia sin justificar, caso cancelado o fuera de
estado, alergias sin revisar, orden ajena al caso, ítem de otra fase, excepción sin justificar, vía
aérea difícil sin plan de rescate, inducción sin plan aprobado, caso no en curso, paso ajeno,
reporte o plan de otro caso, alta sin valoración o sin criterio, caso no completado) y
`ConflictException` (quirófano ocupado, segundo diagnóstico principal, rol repetido, valoración o
plan duplicados, fase ya completa, plan ya aprobado, reporte ya firmado, estancia duplicada, caso ya
cancelado, cargos ya emitidos).

## Logs

`operation: 'periop.<área>.<acción>'`. `warn` en paciente no apto, vía aérea difícil, evento de
anestesia grave o crítico, complicación quirúrgica y cancelación. Nunca se loguean datos clínicos
del paciente más allá del identificador del caso.

## Pruebas

`periop-cases.service.spec.ts` (24), `periop-preop.service.spec.ts` (28) y
`periop-intraop.service.spec.ts` (27): solape de quirófano, único diagnóstico principal, clearance
condicionado, fases del checklist, plan de anestesia y su aprobación, apertura del caso con la
inducción, acumulación del sitio anatómico, trazabilidad del implante, versionado del reporte,
criterio de Aldrete y consolidación de la utilización.
