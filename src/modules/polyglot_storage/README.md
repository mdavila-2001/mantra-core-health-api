# Módulo 54 — Almacenamiento Políglota (gobierno de colocación)

Gobierno de dónde puede vivir cada dato: backends con sus regiones y capacidades, datasets
versionados con huella de esquema, colecciones físicas, colocaciones que sólo se aprueban si
cumplen residencia y clasificación a la vez, políticas de consistencia, acceso, cifrado, replicación
y retención, salud con failover, consolidación de costes e integridad de las proyecciones.

## Casos de uso cubiertos (13)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-54-01 | `POST /governance/storage-backends` | Registrar backend con regiones y capacidades |
| UC-54-02 | `POST /governance/datasets` | Definir dataset + versión inicial |
| UC-54-03 | `POST /governance/datasets/:id/versions` | Publicar versión con huella de esquema |
| UC-54-04 | `POST /governance/collections` | Definir colección y su esquema versionado |
| UC-54-05 | `POST /governance/placements/approve` | Aprobar colocación respetando residencia |
| UC-54-06 | `POST /governance/consistency-policies` | Política de consistencia del store |
| UC-54-07 | `POST /governance/datasets/:id/data-access-policies` | Política de acceso al dato |
| UC-54-08 | `POST /governance/tenants/:tenantId/storage-bindings` | Vincular tenant a colocación |
| UC-54-09 | `POST /governance/encryption-profiles` | Perfil de cifrado con rotación |
| UC-54-10 | `POST /governance/policies` | Residencia, replicación y retención |
| UC-54-11 | `POST /ops/store-health-checks` · `POST /governance/placements/:id/failover` | Salud y failover |
| UC-54-12 | `POST /finops/storage-cost-snapshots` | Consolidar costes por tenant/dataset |
| UC-54-13 | `POST /ops/integrity-policies` · `POST /ops/integrity/:datasetId/verify` | Integridad y cuarentena |

## Estados en `varchar`, en MAYÚSCULAS

Como `object_storage`, este esquema usa `varchar` y no `*_concept_id`. La diferencia es la **caja**:
aquí el caso de uso escribe `ACTIVE`, `DRAFT`, `APPROVED`; en el módulo 60, `active`, `initiated`. Se
respeta cada uno tal como está escrito, porque la comparación contra la columna es literal — y
mezclarlos sería un fallo silencioso que sólo aparecería en producción.

Todo vive en `constants/polyglot-storage.constants.ts`.

## Entidades

Escritas: `storage_backends`, `storage_backend_regions`, `storage_capabilities`,
`dataset_definitions`, `dataset_versions`, `collection_definitions`, `collection_schema_versions`,
`dataset_placements`, `data_access_policies`, `tenant_storage_bindings`, `consistency_policies`,
`residency_policies`, `replication_policies`, `retention_policies`, `encryption_profiles`,
`key_rotation_policies`, `store_health_checks` (append-only), `storage_cost_snapshots`,
`storage_integrity_policies`.

Sólo leída: `data_classifications`.

## Flujo general

```
storage-backends ──> backend REGISTERED + regiones + capacidades PENDING
datasets ──────────> dataset DRAFT + versión 1.0.0 DRAFT (compatibilidad NONE)
  └─ datasets/:id/versions ──> versión ACTIVE, dataset ACTIVE
                               la anterior queda SUPERSEDED
collections ───────> colección DRAFT + esquema ACTIVE   [exige dataset ACTIVE]

policies · consistency-policies · encryption-profiles ──> reglas ACTIVE

placements/approve  [las cuatro comprobaciones a la vez]
  ├─ país prohibido / fuera de permitidos ──> rechazo
  ├─ región fuera de permitidas ───────────> rechazo
  ├─ datos de paciente sin cifrado de campo > rechazo
  └─ todo cumple ──────────────────────────> colocación APPROVED
       └─ tenants/:id/storage-bindings ──> vínculo ACTIVE, colocación ACTIVATED

ops/store-health-checks  UNHEALTHY
  └─ política AUTOMATIC ──> colocaciones DEGRADED + vínculos mueven su primario
governance/placements/:id/failover ──> lo mismo, a mano

finops/storage-cost-snapshots ──> idempotente por ámbito y periodo
ops/integrity/:datasetId/verify ──> hashes distintos + política ⇒ colocación QUARANTINED
```

## Reglas de negocio

- **El backend nace `REGISTERED`, no `ACTIVE`**: declarar un motor no es lo mismo que haber
  comprobado que responde. Sus capacidades nacen sin verificar por la misma razón — lo que dice
  soportar y lo que soporta son cosas distintas hasta que alguien lo prueba.
- **Una sola región primaria**, y sin códigos de región repetidos.
- **El dataset nace en borrador con su versión 1.0.0.** La primera versión declara compatibilidad
  `NONE` porque no tiene con qué ser compatible; **a partir de la segunda, decir `NONE` es declarar
  una ruptura sin decirlo**, y se rechaza.
- **Una sola versión vigente por dataset**: publicar supersede a la anterior. Dos vigentes dejarían
  sin decidir contra qué esquema validar una escritura.
- **La colección exige dataset activo**: materializar almacenamiento para algo que aún puede cambiar
  de forma ata infraestructura a un borrador.
- **Aprobar una colocación exige cumplir cuatro cosas a la vez** — residencia, clasificación, cifrado
  y aislamiento. Con una sola incumplida basta para colocar datos de paciente en un país donde no
  pueden estar, que es exactamente lo que este caso de uso existe para impedir.
- **Prohibido gana sobre permitido**: una lista de países permitidos puesta por descuido no debe
  habilitar un país explícitamente vetado.
- **Datos de paciente exigen cifrado a nivel de campo.** El cifrado en reposo del disco no protege de
  quien tiene acceso al motor.
- **Exigir leer lo propio recién escrito obliga a tolerancia cero de lectura rancia**: pedir las dos
  cosas es una contradicción.
- **Prohibir la réplica entre regiones exige declarar los países permitidos**, o la restricción no
  tiene nada que la haga cumplir.
- **El vínculo del tenant es lo que activa la colocación**: aprobada significa "cumple el gobierno",
  activada significa "hay alguien escribiendo aquí". Sin vínculo no debe escribirse en el backend.
- **El failover automático sólo ocurre si la política lo autoriza.** Mover tráfico entre regiones
  puede cruzar una frontera de residencia, así que no es una decisión que el monitor pueda tomar por
  su cuenta.
- **Un vínculo sin secundario se queda como está** al degradar: dejarlo sin primario lo dejaría sin
  ningún sitio donde escribir, que es peor que escribir en algo degradado.
- **La consolidación de costes es idempotente por ámbito y periodo**: reconsolidar actualiza en lugar
  de sumar una segunda fila, que es lo que duplicaría la factura. Y no se consolida un periodo que
  aún no ha cerrado.
- **Una proyección divergente se cuarentena** si la política lo ordena: seguir sirviendo algo que ya
  se sabe que no cuadra con la fuente canónica es devolver datos incorrectos sin avisar.

## Permisos

`PLATFORM_ADMIN` cubre el módulo y es el único que registra backends y fuerza failovers.
`GOVERNANCE_ADMIN` define datasets, colecciones, políticas y vínculos. `SECURITY_ADMIN` define
perfiles de cifrado. `SYSTEM` registra salud y verifica integridad. `FINOPS_ANALYST` consolida
costes.

Ninguna ruta es pública.

## Concurrencia

`FOR UPDATE` sobre el dataset al publicar versión —el número sale de un máximo—, sobre la versión
vigente que se supersede, sobre la colocación al vincularla o degradarla, sobre la región al
comprobar su salud, sobre la instantánea de coste del periodo y sobre la política de integridad.
`FOR UPDATE SKIP LOCKED` al degradar las colocaciones de una región caída, para que el barrido no se
bloquee detrás de una colocación que alguien está tocando.

## Logs

`operation: 'polyglot.<área>.<acción>'`. Nivel `warn` ante región no saludable y failover manual —son
los dos momentos en que el tráfico cambia de sitio— y ante proyección cuarentenada. No se loguean
referencias de clave ni expresiones de filtro.

## Pruebas

`yarn test --testPathPatterns=modules/polyglot_storage` — 84 pruebas (69 de servicio + 15 de
delegación de los tres controladores).

## Divergencia con el caso de uso v3.9

- **`POST /governance/placements/approve`, sin `{id}`.** El caso de uso escribe
  `/governance/placements/{id}/approve`, pero en sus tablas impactadas declara
  `dataset_placements — INSERT/UPSERT`: la colocación **se crea** en esta operación, así que no hay
  ningún `{id}` que referenciar al llamar. Se publica sin el segmento, y la idempotencia la da la
  clave natural `(versión, región, papel)`.

## Pendiente

- **Ejecución real contra el motor**: crear la colección en Mongo, aplicar el TTL, mover la réplica.
  El módulo gobierna y registra; el adaptador de cada backend ejecuta.
- **Verificación de capacidades**: nacen `PENDING` y ahí se quedan. Probarlas contra el motor es del
  worker de salud.
- **Cálculo de los hashes de integridad**: se comparan los dos que llegan; recorrer la proyección y
  la fuente canónica para calcularlos es del worker.
- **Métricas de uso para el coste**: llegan consolidadas; medirlas es del proveedor.
- **Validación sintáctica de `row_filter_expression`**: el caso de uso la pide; hoy se guarda tal
  cual. Necesita el parser del lenguaje de filtros, que no está definido en el modelo.
- **Bloqueo distribuido e idempotencia en Redis** (`redis_runtime.*`): aquí lo cubren el `FOR UPDATE`
  y las claves naturales. Ese esquema es del módulo 56, **sin asignar**.
- **Outbox** (módulo 35, ya disponible): `StorageBackendRegistered`, `DatasetDefined`,
  `DatasetVersionPublished`, `CollectionSchemaRegistered`, `DataPlacementApproved`,
  `ConsistencyPolicyDefined`, `DataAccessPolicyDefined`, `TenantStorageBound`,
  `EncryptionProfileDefined`, `StoragePoliciesDefined`, `StoreHealthDegraded`,
  `PlacementFailedOver`, `StorageCostSnapshotConsolidated`, `IntegrityMismatchDetected`,
  `ProjectionQuarantined`. Quedan por cablear a `OutboxService.publishDomainEvent()`.
