# Servicios — lakehouse

Tres servicios. Cada método público es un caso de uso completo dentro de un único
`em.transactional`.

| Servicio | UC | Qué hace |
| --- | --- | --- |
| `lakehouse-catalog.service.ts` | 01, 02, 03, 04 | dónde vive el dato y qué contrato promete |
| `transformation.service.ts` | 05, 06, 07, 08 | materializa, deja linaje y controla la calidad |
| `research-release.service.ts` | 09, 10, 11, 12 | investigación, releases y su caducidad |

## LakehouseCatalogService

- `defineZone` (UC-63-01) / `registerCatalog` (UC-63-02) — altas con unicidad por código.
- `publishProductVersion` (UC-63-03) — hace tres cosas en una transacción: upsert del producto, alta
  de la versión superseiendo la vigente, y creación de las reglas de calidad derivadas del SLO.

  El upsert acepta el id de la ruta para el alta (ver README del módulo), pero **rechaza** si el
  código ya lo tiene otro producto: la clave natural manda sobre el id.

- `registerDataset` (UC-63-04) — exige versión de producto **activa**, y zona y catálogo activos. El
  formato sale del catálogo si no se declara: el `default_format` existe para no repetirlo en cada
  tabla.

## TransformationService

**No transforma nada**: recibe del worker lo que ya escribió en el almacén.

`materialize()` es la pieza compartida por UC-63-05 y UC-63-07. Su regla: una partición cuya huella
ya existe **no se toca**, y un archivo cuyo hash ya existe tampoco. Eso es lo que permite reintentar
una corrida sin duplicar el lago, y es también por lo que corregir consiste en materializar una
partición nueva en vez de reescribir la anterior.

- `runTransformation` (UC-63-05 + UC-63-06) — una sola corrida viva por definición. El linaje se
  registra **dentro** de `materialize`, en la misma transacción: un linaje que se escribe después
  puede no escribirse nunca.

  Si la partición declara `sourcePartitionIds`, se registra una arista por par
  `(dataset fuente, partición fuente)`; si no, una por dataset fuente con sólo el destino. Las dos
  formas son linaje válido con distinta granularidad.

- `ingestCurated` (UC-63-07) — el destino tiene que estar en zona `curated`. La zona no es
  descriptiva: es lo que impide que dato clínico sin de-identificar acabe donde se sirven releases.
  La corrida de de-identificación se registra en `health_data` en la misma transacción.

  No registra linaje: la ingesta curada no viene de otro dataset del lago.

- `runQualityCheck` (UC-63-08) — abre un hallazgo por regla incumplida y suma los registros fallidos
  con `BigInt`. Sólo una regla `blocking` que supere su umbral cuarentena el dataset.

  `exceedsThreshold` sin umbral devuelve `true` con una sola incidencia: una regla declarada
  bloqueante sin decir cuánto se tolera es una regla que no tolera nada.

  El umbral se compara sobre el **conteo** de incidencias, que es lo que declara la regla. Calcular
  un porcentaje aquí sería inventar su semántica.

## ResearchReleaseService

La idea que lo sostiene: **el acceso a datos de investigación siempre caduca**. Un release sin fecha
de fin es un acceso permanente a datos de pacientes concedido por un comité que aprobó un estudio con
principio y final.

- `defineCohort` (UC-63-09) — valida la ventana ética antes de nada: coherente y no caducada. Upsert
  del proyecto con el id de la ruta, igual que el producto.
- `requestRelease` (UC-63-10) — comprueba la ventana **al solicitar**, la cohorte pertenece al
  proyecto y está activa, y si el producto tiene PHI la cohorte declara perfil de de-identificación.
- `approveRelease` (UC-63-11) — corrida de de-identificación, manifiesto y cambio de estado en una
  transacción. Es idempotente: si el manifiesto ya existe se devuelve sin publicar nada.

  **El plazo se recorta a la aprobación ética**: `expiresAt = min(now + ttlDays, project.approvedTo)`.

  El evento lleva `grantToUserId` y `expiresAt` para que quien lo consuma pueda conceder el acceso
  temporal al investigador y programarlo para que caduque solo.

- `revokeRelease` (UC-63-12) — `expired` y `revoked` se distinguen. Adelantar `expiresAt` es lo que
  corta el acceso; el manifiesto no se borra aquí porque su purga física es del almacén de objetos.
  Es idempotente sobre un release ya cerrado.

## Transacciones

Un caso de uso, una transacción. `OutboxService.publishDomainEvent(tx, …)` recibe la transacción
abierta y se enlista en ella.

## Errores

`ConflictException` (409) para códigos y versiones repetidas y para el choque entre el id de la ruta
y la clave natural. `PreconditionFailedException` (422) para estados incompatibles, zona equivocada,
ventana ética caducada, PHI sin perfil y hallazgo que cita una regla inactiva.
`ResourceNotFoundException` (404) para referencias que no resuelven.

## Logs

`operation: 'lakehouse.<área>.<acción>'`. `warn` en cuarentena de dataset, materialización de release
y su cierre. No se loguean valores de partición, contratos ni expresiones de cohorte.
