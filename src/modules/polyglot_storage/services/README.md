# Servicios — polyglot_storage

Tres servicios. Cada método público es un caso de uso completo dentro de un único
`em.transactional`.

| Servicio | UC | Qué gobierna |
| --- | --- | --- |
| `storage-governance.service.ts` | 01, 04, 06, 09, 10 | infraestructura declarada: backends, colecciones y las políticas transversales |
| `dataset-governance.service.ts` | 02, 03, 05, 07, 08 | el dato: datasets, versiones, colocaciones, acceso y vínculo del tenant |
| `storage-operations.service.ts` | 11, 12, 13 | lo que pasa en marcha: salud, failover, coste e integridad |

## StorageGovernanceService

- `registerBackend` (UC-54-01) — backend `REGISTERED` con sus regiones y capacidades. Rechaza
  códigos de región repetidos y más de una región primaria. Las capacidades nacen `PENDING`:
  declarar que se soporta transacciones no es haberlo comprobado.
- `defineCollection` (UC-54-04) — exige el dataset en `ACTIVE`. Materializar una colección física
  para un dataset que aún puede cambiar de forma ata infraestructura a un borrador.
- `defineConsistencyPolicy` (UC-54-06) — rechaza la combinación contradictoria: exigir leer lo propio
  recién escrito y a la vez tolerar lecturas rancias.
- `defineEncryptionProfile` (UC-54-09) — perfil con su política de rotación.
- `defineStoragePolicies` (UC-54-10) — residencia, replicación y retención en una sola operación,
  porque las tres se contradicen entre sí si se declaran por separado. Prohibir la réplica entre
  regiones sin declarar países permitidos deja la restricción sin nada que la haga cumplir.

## DatasetGovernanceService

- `defineDataset` (UC-54-02) — dataset `DRAFT` + versión `1.0.0` `DRAFT`. La primera versión declara
  compatibilidad `NONE` porque no tiene con qué ser compatible.
- `publishDatasetVersion` (UC-54-03) — versión `ACTIVE`, dataset `ACTIVE`, la anterior `SUPERSEDED`.
  A partir de la segunda versión, declarar compatibilidad `NONE` es anunciar una ruptura sin decirlo,
  y se rechaza.
- `approvePlacement` (UC-54-05) — **la puerta de gobierno del módulo**. `assertResidency` aplica
  *prohibido gana sobre permitido*: una lista de países permitidos puesta por descuido no debe
  habilitar un país explícitamente vetado. Y datos de paciente sin cifrado a nivel de campo se
  rechazan: el cifrado en reposo del disco no protege de quien tiene acceso al motor.
- `defineAccessPolicy` (UC-54-07) — la expresión de filtro se guarda tal cual (ver *Pendiente* en el
  README del módulo).
- `bindTenantStorage` (UC-54-08) — el vínculo es lo que pasa la colocación de `APPROVED` a
  `ACTIVATED`. Aprobada significa "cumple el gobierno"; activada, "hay alguien escribiendo aquí".

## StorageOperationsService

- `recordHealthCheck` (UC-54-11) — `UNHEALTHY` degrada las colocaciones de la región **sólo si la
  política de replicación autoriza el failover automático**. Mover tráfico entre regiones puede
  cruzar una frontera de residencia; no es decisión del monitor.
- `failoverPlacement` (UC-54-11) — el mismo movimiento, a mano, y por eso pide actor y se loguea en
  `warn`.
- `swapBindings` (privado) — sólo mueve los vínculos que **tienen** secundario. Dejar un vínculo sin
  primario lo dejaría sin ningún sitio donde escribir, que es peor que escribir en algo degradado.
- `consolidateCostSnapshot` (UC-54-12) — idempotente por ámbito y periodo: reconsolidar actualiza en
  lugar de insertar una segunda fila, que es lo que duplicaría la factura. No consolida un periodo
  que aún no ha cerrado.
- `defineIntegrityPolicy` / `verifyIntegrity` (UC-54-13) — compara los dos hashes recibidos; si
  divergen y la política lo ordena, la colocación queda `QUARANTINED`. Seguir sirviendo una
  proyección que ya se sabe descuadrada es devolver datos incorrectos sin avisar.

## Transacciones

Un caso de uso, una transacción. Ningún servicio llama a otro dentro de su propia transacción; los
controladores tampoco encadenan dos.

## Logs

`operation: 'polyglot.<área>.<acción>'` con el id del agregado. `warn` en región no saludable,
failover manual y proyección cuarentenada. No se loguean referencias de clave de cifrado ni
expresiones de filtro de fila.

## Errores

`ConflictException` para códigos duplicados y estados que ya no permiten la transición.
`BadRequestException` para las contradicciones de política y para el rechazo de residencia.
`NotFoundException` para referencias que no resuelven.
