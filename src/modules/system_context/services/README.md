# Servicios de contexto de sistema

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

Dos, uno por familia:

- **`DynamicEnumsService`** (UC-45-01 … 05, UC-45-11) — definición, versiones con snapshot de
  opciones, publicación, binding a campos, resolución en escritura y retiro gobernado.
- **`SystemContextsService`** (UC-45-06 … 10, UC-45-12) — contexto con versión inicial, refresco
  idempotente con procedencia, promoción, binding a consumidores y rollback.

Comparten repositorio y nada más. La resolución de un valor de enum es un camino caliente que se
ejecuta en cada escritura; el refresco de contexto es un trabajo de fondo. Mezclarlos pondría al
primero a cargar el segundo.

## Reglas de negocio

### Enumeraciones dinámicas

- **Definición (01)**: código único global; nace en borrador, sin versión.
- **Versión (02)**: número correlativo al último; snapshot ordenado de opciones con exactamente una
  por defecto —y habilitada—, sin códigos ni conceptos repetidos. Una definición retirada no admite
  versiones nuevas.
- **Publicación (03)**: sólo desde borrador y con al menos una opción habilitada; supersede a la
  publicada anterior, sella `effective_from`, mina un `cacheToken` nuevo y activa la definición si
  seguía en borrador.
- **Binding (04)**: el campo destino no puede estar ya gobernado; el modo permisivo exige concepto
  de reserva.
- **Resolución (05)**: exige binding activo y versión publicada. Con valor: acepta si pertenece a
  las opciones **habilitadas**, por concepto o por código; si no, rechaza en estricto o cae a la
  reserva en permisivo. Sin valor: acepta si el campo es opcional, rechaza si es obligatorio.
- **Retiro (11)**: borrado lógico; deshabilita los bindings; un binding obligatorio lo bloquea.

### Contextos de sistema

- **Alta (06)**: código único; contexto y versión 1 en la misma transacción; `current_version_id`
  apunta a esa versión, que nace en borrador —activarla es una decisión aparte (UC-45-09).
- **Refresco (07 + 08)**: idempotente por clave; contexto activo. Una entrada obligatoria ausente
  falla la corrida sin redactar versión; contenido idéntico al último la cierra como *unchanged*;
  contenido nuevo redacta versión borrador y snapshotea las entradas por precedencia.
- **Promoción (09)**: sólo desde borrador, con hash esperado si se declara; supersede a la activa y
  avanza `current_version_id`.
- **Binding (10)**: contexto activo, ventana no invertida y sin solape con otro binding vivo del
  mismo consumidor.
- **Rollback (12)**: sólo a una versión *superseded*, con hash esperado si se declara; la actual pasa
  a *superseded* y la objetivo vuelve a estar vigente.

## Hash de contenido

`contentHash()` canoniza antes de hashear: ordena las claves de cada objeto y descarta las
`undefined`. Sin eso, `{a:1,b:2}` y `{b:2,a:1}` darían hashes distintos y el refresco redactaría una
versión nueva en cada ejecución aunque nada hubiera cambiado — que es exactamente lo que la
comparación de hash existe para evitar.

## Token de caché

`cacheToken()` deriva de `(definitionId, versionNumber, instante de publicación)`. Incluir el
instante importa: si sólo dependiera de la identidad de la versión, republicar produciría el mismo
token y los consumidores podrían seguir sirviendo el conjunto anterior.

## Solape de ventanas

`overlaps()` trata las ventanas abiertas por un extremo como infinitas en esa dirección: dos
bindings sólo **no** se solapan si uno termina antes o justo cuando empieza el otro. Es la regla que
permite encadenar bindings consecutivos sin conflicto y bloquea los que se pisan.

## Modo de validación ausente

`dynamic_enum_bindings.validation_mode_concept_id` es nullable en el modelo. Un binding sin modo se
valida **estricto**: lo contrario dejaría pasar cualquier valor en el campo peor gobernado del
sistema.

## Dependencias

`EntityManager`, `SystemContextRepository` y `PinoLogger`.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción, incluidas las compuestas: contexto + versión 1;
publicación + supersedimiento; refresco + versión + entradas; activación + supersedimiento + avance
de `current_version_id`; retiro + deshabilitación de bindings. Bloqueos: ver el README de
`repositories/`.

## Excepciones

`ResourceNotFoundException` (definición, versión, contexto o binding desconocidos),
`PreconditionFailedException` (definición retirada, versión que no está en borrador, versión sin
opciones habilitadas, opciones inválidas, modo permisivo sin reserva, contexto inactivo, hash
inesperado, ventana invertida, rollback a versión no vigente, contexto sin versión activa) y
`ConflictException` (código de definición o de contexto repetido, campo ya gobernado, definición ya
retirada, versión ya vigente, binding solapado).

**La resolución (UC-45-05) no lanza al rechazar**: devuelve `accepted: false` con el motivo. Un 4xx
obligaría al llamante a distinguir "el servicio falló" de "el valor no vale", y esto último es una
respuesta normal del validador.

## Logs

`operation: 'system-context.<área>.<acción>'`. `warn` en rechazo estricto, corrida fallida por
entrada obligatoria ausente, retiro y rollback. No se loguea el contenido del contexto: puede llevar
referencias gobernadas que no tienen por qué acabar en un log.

## Pruebas

- `dynamic-enums.service.spec.ts` (36): invariantes del snapshot de opciones, numeración de
  versiones, supersedimiento y token de caché, ambos modos de validación, resolución por concepto y
  por código, opción deshabilitada, campo obligatorio vacío, modo ausente y bloqueo del retiro.
- `system-contexts.service.spec.ts` (29): contexto y versión 1 en una transacción, hash estable ante
  el orden de claves, idempotencia del refresco, corrida fallida y *unchanged*, activación con y sin
  hash esperado, solape de ventanas —incluido el encadenamiento sin conflicto— y rollback completo.
