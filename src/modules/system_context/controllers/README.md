# Controladores de contexto de sistema

Capa HTTP: recibe, delega y devuelve. Sin lógica de negocio.

## Controlador

Uno, `SystemContextController`, con prefijo `/system-context`. Reparte entre `DynamicEnumsService`
(las rutas bajo `dynamic-enums`) y `SystemContextsService` (las rutas bajo `contexts`).

## Rutas

| Método | Ruta | UC |
| --- | --- | --- |
| `POST` | `/system-context/dynamic-enums/definitions` | 01 |
| `POST` | `/system-context/dynamic-enums/definitions/:defId/versions` | 02 |
| `POST` | `/system-context/dynamic-enums/definitions/:defId/versions/:version/publish` | 03 |
| `POST` | `/system-context/dynamic-enums/definitions/:defId/bindings` | 04 |
| `POST` | `/system-context/dynamic-enums/resolve` | 05 |
| `POST` | `/system-context/dynamic-enums/definitions/:defId/retire` | 11 |
| `POST` | `/system-context/contexts` | 06 |
| `POST` | `/system-context/contexts/:id/refresh` | 07 (+ 08) |
| `POST` | `/system-context/contexts/:id/versions/:version/activate` | 09 |
| `POST` | `/system-context/contexts/:id/bindings` | 10 |
| `POST` | `/system-context/contexts/:id/rollback` | 12 |

## Decisiones de ruteo

- **Segmentos planos en lugar de `:` de acción**. Los casos de uso escriben `{v}:publish`,
  `{defId}:retire` y `{id}:rollback`; Nest 11 usa path-to-regexp v8, que trata `:` como inicio de
  parámetro en **cualquier** punto del segmento, así que `versions/2:publish` se registraría como el
  literal `versions/2` seguido de un parámetro `publish`. Misma convención que el resto del proyecto.
- **`definitions/:defId/...` en lugar de `:defId/...`**. El caso de uso escribe
  `/dynamic-enums/{defId}/versions`, pero eso pondría `:defId` a competir con el literal
  `definitions` y con `resolve` en la misma posición. El segmento explícito quita la ambigüedad.
- **`:version` es un entero, no un UUID**: la versión se identifica por su número dentro de la
  definición o del contexto, que es como la nombra quien la publicó. Lleva `ParseIntPipe`.
- **`resolve` sin identificador**: la resolución llega con el campo destino en el cuerpo, porque el
  llamante conoce `(schema, entity, field)` y no el id del binding.
- **UC-45-08 no tiene ruta**: sus entradas viajan dentro del refresco. Ver el README del módulo.

## Códigos de estado

`201 Created` en lo que crea recurso (01, 02, 04, 06, 07, 10). `200 OK` en lo que actúa sobre algo
existente (03, 05, 09, 11, 12). La resolución (05) devuelve `200` también cuando rechaza el valor: el
rechazo es la respuesta del validador, no un error de la petición.

## Validación de parámetros de ruta

`ParseUUIDPipe` en `:defId` y `:id`; `ParseIntPipe` en `:version`.

## Permisos

`PLATFORM_ADMIN` en todo. Además: `TERMINOLOGY_ENGINEER` (01–03), `MODULE_OWNER` (04, 05, 10),
`WRITE_SERVICE` (05), `GOVERNANCE` (06) y `SYSTEM` (07).

Ninguna ruta es `@Public()`, incluida la resolución: la llama el servicio de escritura con su propia
sesión.

## Pruebas

`system-context.controller.spec.ts` (11): una por endpoint, comprobando que delega en el servicio
correcto y que pasa el id, el número de versión, el cuerpo y el actor.
