# Servicios de reportes

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

| Servicio | Casos de uso | Responsabilidad |
| --- | --- | --- |
| `ReportingDefinitionsService` | 01, 02, 03, 10, 12 | Fuentes, definiciones, versiones, tableros y deprecación |
| `ReportingRunsService` | 04 … 09, 11 | Corridas, snapshots, programación, distribución y reintentos |

## Reglas de negocio

- **Fuente (01)**: código único; una `READ_MODEL` exige su read model gobernado y una `VIEW` el
  nombre de la vista. No hay tercer camino: sin uno de los dos no habría dónde aplicar la seguridad
  por fila.
- **Definición (02)**: cabecera, parámetros y columnas en una transacción, numerados en el orden
  recibido y con códigos únicos dentro de la definición. Nace en borrador, sobre una fuente activa,
  y si no es pública debe declarar el permiso que exige.
- **Versión (03)**: la primera publicación estrena la versión 1 (la que ya lleva la cabecera) y las
  siguientes incrementan. La versión congela consulta y parámetros, y la definición pasa a activa.
- **Corrida (04)**: contra la versión vigente, con los parámetros resueltos antes de encolar.
- **Snapshot (05)**: cierra la corrida como `succeeded`, fija la retención y compara el hash del
  contenido con lo ya guardado. Una corrida fallida se reintenta antes de materializar.
- **Programación (06)**: sobre una definición activa, con sus parámetros fijos validados igual que
  los de una corrida.
- **Tick (07)**: toma las vencidas con SKIP LOCKED, encola una corrida por cada una y avanza la
  ventana. Las que ya no tienen definición activa o versión publicada se saltan, pero su ventana
  avanza igual.
- **Distribución (08)**: sólo sobre una corrida exitosa; una fila por destinatario y canal, con los
  suscriptores de la programación más los destinatarios que lleguen en el cuerpo.
- **Suscripción (09)**: el suscriptor es el usuario autenticado; repetirla reactiva.
- **Tablero (10)**: código único, un widget `CHART` exige tipo de gráfico y ningún widget puede
  apuntar a un reporte deprecado.
- **Reintento (11)**: sólo sobre una corrida fallida cuya definición no esté deprecada. Limpia el
  error, reinicia las marcas de tiempo y, si se pide, devuelve sus distribuciones a pendiente.
- **Deprecación (12)**: la definición y sus programaciones cambian juntas.

## Cómo se resuelven los parámetros

`resolveParameters` recorre **lo declarado**, no lo recibido:

1. Si llega valor, se toma.
2. Si no llega y hay valor por defecto, se usa el defecto.
3. Si no llega, no hay defecto y era obligatorio, se acumula en la lista de faltantes.

Al final, un solo error enumera todos los faltantes. Lo que llegó y no está declarado **no pasa**:
aceptarlo sería dejar entrar entrada arbitraria en la consulta que luego ejecuta el worker.

La misma función valida los parámetros fijos de una programación, porque una programación con un
obligatorio sin valor fallaría en cada ventana.

## Dependencias

`EntityManager`, los repositorios del módulo y `PinoLogger`. `ReportingDefinitionsService` usa
`ReportingRunsRepository` sólo para suspender programaciones al deprecar —tienen que caer en la
misma transacción—, y `ReportingRunsService` usa `ReportingDefinitionsRepository` para leer la
definición, su versión vigente y sus parámetros.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción, incluidos el alta completa de la definición y la del
tablero. `FOR UPDATE` sobre definición, ejecución, programaciones y distribuciones que se mutan;
`FOR UPDATE SKIP LOCKED` sobre las programaciones vencidas; `row_version` aporta bloqueo optimista.

## Excepciones

`ResourceNotFoundException` (fuente, definición, ejecución o programación inexistente),
`PreconditionFailedException` (fuente incompleta o inactiva, reporte no público sin permiso, códigos
repetidos, definición no activa o sin versión, parámetros obligatorios ausentes, corrida no exitosa
o no fallida, widget sin visualización o sobre reporte deprecado, destinatario incompleto) y
`ConflictException` (código duplicado, versión ya publicada, corrida ya materializada, snapshot
repetido, definición ya deprecada).

## Logs

`operation: 'reporting.<área>.<acción>'`. `warn` al deprecar una definición. No se loguean
parámetros de ejecución ni direcciones de destinatarios.

## Pruebas

`reporting-definitions.service.spec.ts` (24) y `reporting-runs.service.spec.ts` (34): gobernanza de
la fuente, numeración de parámetros y columnas, congelado de la versión, resolución y descarte de
parámetros, deduplicación por contenido, SKIP LOCKED del tick con avance de ventana, no duplicación
de distribuciones, reactivación de suscripciones y arrastre de la deprecación.
