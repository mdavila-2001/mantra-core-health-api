# Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas

Enumeraciones gobernadas por filas versionadas —sin tipos `ENUM` nativos de PostgreSQL—, con
snapshot inmutable de opciones, publicación que invalida caché, binding a campos y validación en
escritura; y contextos de sistema versionados con refresco idempotente, procedencia, promoción,
binding a consumidores y vuelta atrás.

## Casos de uso cubiertos (12)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-45-01 | `POST /system-context/dynamic-enums/definitions` | Definir enumeración ligada a un value set |
| UC-45-02 | `POST /system-context/dynamic-enums/definitions/:defId/versions` | Redactar versión + snapshot de opciones |
| UC-45-03 | `POST /system-context/dynamic-enums/definitions/:defId/versions/:version/publish` | Publicar e invalidar caché |
| UC-45-04 | `POST /system-context/dynamic-enums/definitions/:defId/bindings` | Vincular el enum a un campo |
| UC-45-05 | `POST /system-context/dynamic-enums/resolve` | Resolver y validar un valor en escritura |
| UC-45-06 | `POST /system-context/contexts` | Definir contexto + versión inicial |
| UC-45-07 | `POST /system-context/contexts/:id/refresh` | Refresco idempotente con nueva versión |
| UC-45-08 | (incluido en el refresco) | Snapshot de entradas (procedencia) |
| UC-45-09 | `POST /system-context/contexts/:id/versions/:version/activate` | Promover versión vigente |
| UC-45-10 | `POST /system-context/contexts/:id/bindings` | Vincular contexto a un consumidor |
| UC-45-11 | `POST /system-context/dynamic-enums/definitions/:defId/retire` | Retiro gobernado de la definición |
| UC-45-12 | `POST /system-context/contexts/:id/rollback` | Volver a una versión anterior |

UC-45-08 no tiene endpoint propio: el caso de uso lo declara "(interno) parte del run de refresco" y
en la misma transacción, así que se resuelve dentro de UC-45-07 con el campo `inputs`. Publicar un
endpoint separado permitiría añadir procedencia a una versión ya cerrada, que es justo lo que la
inmutabilidad de las entradas impide.

Los casos de uso escriben las acciones con `:` (`{v}:publish`, `{id}:rollback`, `{defId}:retire`).
Nest 11 (path-to-regexp v8) trata `:` como inicio de parámetro en cualquier punto del segmento, así
que las rutas publicadas usan segmentos planos, como en el resto del proyecto.

## Entidades

`dynamic_enum_definitions`, `dynamic_enum_versions`, `dynamic_enum_options` (inmutable),
`dynamic_enum_bindings`, `system_contexts`, `system_context_versions`, `system_context_inputs`
(inmutable), `system_context_refresh_runs`, `system_context_bindings`.

## Flujo general

```
definición (draft)
   └─ versions ──> versión draft + snapshot ordenado de opciones (inmutable)
        └─ publish ──> versión published + cacheToken nuevo
                       la anterior queda superseded  ⇒ definición pasa a active
   └─ bindings ──> el campo destino queda gobernado por la enumeración
        └─ resolve ──> STRICT: fuera del conjunto se rechaza
                       LENIENT: fuera del conjunto cae al concepto de reserva
   └─ retire ──> definición retired + bindings disabled  (un campo obligatorio lo bloquea)

contexto (active) + versión 1 (draft)
   └─ refresh (idempotente por clave)
        ├─ entrada obligatoria ausente ──> run failed, sin versión
        ├─ contenido idéntico al último ─> run unchanged, sin versión
        └─ contenido nuevo ─────────────> versión draft + entradas de procedencia
   └─ activate ──> versión active; la anterior superseded; current_version_id avanza
   └─ rollback ──> una versión superseded vuelve a active; la actual pasa a superseded
   └─ bindings ──> el consumidor recibe el contexto en su ventana de validez
```

## Reglas de negocio

- **Nada de `ENUM` nativos de PostgreSQL** (`dynamic_postgresql_enums_allowed = false`): el conjunto
  permitido son filas versionadas, y por eso cambiar los valores no exige un despliegue.
- **Las opciones son inmutables una vez escritas**. Es lo que permite que una escritura de hace un
  año siga validando contra el conjunto que existía entonces.
- **Exactamente una opción por defecto**, y no puede estar deshabilitada. Con dos quedaría indefinido
  con qué se rellena el campo.
- **Códigos y conceptos sin repetir dentro de la versión**: un código repetido haría ambigua la
  resolución por código.
- **No se publica una versión sin ninguna opción habilitada**: dejaría el campo sin ningún valor
  escribible.
- **Una sola versión publicada sin `effective_to`** por definición, y una sola versión activa sin
  `effective_to` por contexto. Publicar o activar supersede a la anterior en la misma transacción.
- **El `cacheToken` cambia en cada publicación**: sin eso, los consumidores seguirían validando
  contra el conjunto viejo.
- **Un campo destino no puede estar gobernado por dos enumeraciones a la vez**.
- **El modo permisivo exige concepto de reserva**: sin él, "permisivo" sería simplemente "sin
  validar". Un binding sin modo declarado se valida **estricto**, que es lo único seguro.
- **Retirar es un borrado lógico**: la definición nunca se elimina y sus bindings quedan
  deshabilitados. Un binding obligatorio bloquea el retiro, porque dejaría un campo exigido sin
  catálogo del que sacar el valor.
- **El contexto nace con su versión 1** en la misma transacción: uno sin versión no tiene nada que
  entregar.
- **El contenido del contexto nunca lleva secretos**, sólo referencias gobernadas.
- **El refresco es idempotente por clave**: el worker reintenta y no vuelve a refrescar.
- **Contenido idéntico no versiona**. El hash se calcula con las claves ordenadas, así que dos
  objetos iguales con distinto orden dan el mismo hash y el refresco no redacta ruido.
- **Una entrada obligatoria ausente falla la corrida**: el contexto quedaría incompleto sin que nadie
  lo notara.
- **Activar comprueba el hash** si se declara: activar algo distinto de lo que se revisó es
  exactamente el error que el hash existe para impedir.
- **Sólo se vuelve a una versión que estuvo vigente**: una que nunca se activó no es un estado
  conocido al que volver. El rollback no borra nada, así que el historial conserva el ida y vuelta.
- **Dos bindings del mismo consumidor no pueden solapar su ventana**: dejarían sin decidir qué
  contexto se le entrega en el periodo común.

## Vocabularios: qué se define aquí y qué no

Sólo se derivan conceptos para los vocabularios de **ciclo de vida** que el caso de uso enumera:
estados de definición, versión y binding, modo de validación, y estado y disparador del refresco.

Los catálogos **abiertos** —tipo de contexto, ámbito, modo de selección, política de refresco,
locale, país, tipo de fuente, tipo de consumidor— no se inventan: el cliente entrega su
`*ConceptId` y el módulo lo persiste tal cual. El caso de uso los declara "validados contra value
sets cerrados", y esa validación vive en `terminology`, no aquí.

## Permisos

`PLATFORM_ADMIN` cubre el módulo. `TERMINOLOGY_ENGINEER` define enumeraciones, redacta y publica
versiones. `MODULE_OWNER` crea bindings de enum y de contexto. `WRITE_SERVICE` resuelve valores en
escritura. `GOVERNANCE` define contextos. `SYSTEM` ejecuta el refresco.

Ninguna ruta es pública.

## Concurrencia

`FOR UPDATE` sobre la definición al redactar —el número de versión sale de un máximo, y dos
redacciones simultáneas darían el mismo número—, sobre la versión y la publicada al publicar, sobre
los bindings al retirar, sobre el contexto en todo lo que mueva `current_version_id`, y sobre la
versión activa al promover o volver atrás. `row_version` aporta bloqueo optimista.

## Logs

`operation: 'system-context.<área>.<acción>'`. Nivel `warn` ante rechazo de valor en modo estricto,
corrida de refresco fallida por entrada obligatoria ausente, retiro de definición y rollback de
contexto. No se loguea el contenido del contexto.

## Pruebas

`yarn test --testPathPatterns=system_context` — 76 pruebas (65 de servicio + 11 de delegación del
controlador).

## Pendiente

- **Caché en Redis** (`redis_runtime.dynamic_enum_cache_entries`,
  `system_context_cache_entries`): el módulo emite y devuelve el `cacheToken`, que es lo que
  identifica la entrada; poblar e invalidar la caché es del módulo de almacenamiento políglota.
- **Validación contra `system_ops.entity_registry`**: el caso de uso pide validar
  `target_schema/entity/field` y `source_schema/entity` contra el registro de entidades. Escribir o
  leer ahí cruzaría la frontera del esquema; queda para cuando exista el cliente gobernado de
  `system_ops`.
- **Resolución de `value_set_version_id` vigente**: el caso de uso la resuelve contra
  `terminology.value_set_versions`. Aquí se acepta la que entrega el llamante.
- **Outbox** (módulo 35): `DynamicEnumDefinitionCreated`, `DynamicEnumVersionDrafted`,
  `DynamicEnumVersionPublished`, `DynamicEnumBindingCreated`, `DynamicEnumValidationRejected`,
  `DynamicEnumDefinitionRetired`, `SystemContextCreated`, `SystemContextRefreshCompleted`,
  `SystemContextVersionActivated`, `SystemContextBound`, `SystemContextRolledBack`.
- **Proyecciones y series**: `read_models.*` y `time_series.context_refresh_series` los alimenta el
  outbox.
