# Controladores de marketing

Capa HTTP. Validan, autorizan y delegan; la transacción vive en el servicio.

## Rutas

| Controlador | Prefijo | Endpoints |
| --- | --- | --- |
| `MarketingController` | `marketing` | 12 sobre `segments`, `campaigns`, `content-templates`, `journeys`, `enrollments`, `tracked-links`, `touchpoints` y `attribution:compute` |
| `TrackedLinkRedirectController` | `r` | 1: `GET /r/:code` |

La redirección vive en su propio controlador porque el código corto es la URL que se publica dentro
del mensaje: colgarla de `/marketing` la alargaría sin ganar nada.

## Autenticación y autorización

`JwtAuthGuard` global + `@Roles(...)`. `MARKETING_MANAGER` cubre el módulo; `CONTENT_EDITOR` publica
plantillas; `SYSTEM` está en lo que ejecutan los workers (refresco, materialización, avance y salida
de inscripciones, touchpoints y atribución).

`GET /r/:code` es `@Public()`: quien hace click es el destinatario del mensaje, no un usuario con
sesión. Lo que se registra sale de la petición, no de un token.

## Validaciones HTTP

`ParseUUIDPipe` en todos los parámetros de ruta salvo `:code` de plantillas y de enlaces, que son
claves naturales legibles, no UUID. `ValidationPipe` global sobre los cuerpos.

La identidad del miembro en `GET /r/:code` llega por query (`memberType`, `memberRefId`) y es
opcional: un click anónimo sigue contando aunque no genere touchpoint.

## Códigos de respuesta

`201 Created` en las altas (segmento, campaña, plantilla, journey, pasos, enlace, touchpoint).
`200 OK` en las que mutan un recurso existente o devuelven un cálculo: refresco, materialización,
activación, avance, salida, resolución del enlace y atribución.

## Nota sobre las rutas del caso de uso

Los casos de uso escriben dos rutas con dos puntos (`/attribution:compute`,
`/campaigns/{id}/members:materialize`). Aquí se usan segmentos normales
(`/attribution/compute`, `/campaigns/:id/members/materialize`) por dos razones: es el estilo del
resto del proyecto (ver ERP) y, sobre todo, porque el enrutador de Nest 11 interpreta `:` como
inicio de parámetro en cualquier posición del segmento — `members:materialize` quedaría como el
literal `members` seguido de un parámetro llamado `materialize`, y la ruta capturaría cualquier
`members<algo>`.

## Pruebas

`marketing.controller.spec.ts` con ambos servicios mockeados: delegación, argumentos (incluido el
actor y los ids de ruta), la variante anónima de la redirección y propagación de errores.
