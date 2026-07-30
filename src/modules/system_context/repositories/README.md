# Repositorios de contexto de sistema

Acceso a datos de `system_context.*`. Sin lógica de negocio: sólo lecturas, escrituras y el modo de
bloqueo que cada operación necesita.

## Repositorio

Uno solo, `SystemContextRepository`, sobre las nueve tablas del módulo. Enumeraciones y contextos son
dos familias distintas, pero comparten la misma forma —definición → versiones → binding— y el
binding del enum puede acotarse por contexto (`dynamic_enum_bindings.system_context_id`). Partirlo
obligaría a que una mitad conociera tablas de la otra.

## Lecturas con bloqueo

| Método | Modo | Por qué |
| --- | --- | --- |
| `findEnumDefinitionForUpdate` | `FOR UPDATE` | El número de versión sale de un máximo: serializa las redacciones |
| `findEnumVersionForUpdate` | `FOR UPDATE` | Publicar cambia su estado y su vigencia |
| `findPublishedEnumVersionForUpdate` | `FOR UPDATE` | Publicar y supersedir deben ver el mismo conjunto |
| `findEnumBindingsForUpdate` | `FOR UPDATE` | Retirar los deshabilita en bloque |
| `findContextForUpdate` | `FOR UPDATE` | Todo lo que mueve `current_version_id` |
| `findContextVersionForUpdate` | `FOR UPDATE` | Activar o reactivar la versión |
| `findActiveContextVersionForUpdate` | `FOR UPDATE` | La versión saliente cede el testigo en la misma transacción |

El resto son lecturas simples: catálogo, comprobación de duplicados y resolución en escritura, que es
un camino caliente y no debe bloquear nada.

## Consultas que llevan semántica

- **`findPublishedEnumVersion` / `findActiveContextVersionForUpdate`** filtran por
  `effective_to IS NULL`: es la invariante de "una sola vigente" expresada en la consulta, no en
  memoria.
- **`findEnumOptions`** devuelve ordenado por `ordinal`: el orden es parte del snapshot, no un
  detalle de presentación.
- **`findEnumBindingByTarget`** busca por `(schema, entity, field)` entre los bindings activos. Es
  a la vez la comprobación de duplicado (UC-45-04) y la entrada de la resolución (UC-45-05).
- **`findContextInputs`** ordena por `precedence`: menor gana ante colisión de fuentes.
- **`findRefreshRunByKey`** es la clave de idempotencia del worker de refresco.
- **`findContextBindingsForConsumer`** trae los bindings vivos del mismo consumidor para que el
  servicio compruebe el solape de ventanas.

## Inmutables

`createEnumOption` y `createContextInput` sólo insertan: no hay método para modificarlos ni
eliminarlos. Las opciones sostienen la validación histórica y las entradas son la procedencia de una
versión ya cerrada; ambas dejarían de servir para lo que existen si se pudieran reescribir. Tampoco
llevan `createdBy`: no tienen columnas de modificación, sólo `recorded_at`/`recorded_by_user_id`.

## Auditoría

Las tablas con columnas de auditoría —definiciones, bindings, contextos— pasan por
`createdBy(actorUserId)` al crearse y por `touch(entity, actorUserId)` al modificarse desde el
servicio.

## Pruebas

El repositorio no tiene suite propia; se ejercita como doble desde `dynamic-enums.service.spec.ts` y
`system-contexts.service.spec.ts`.
