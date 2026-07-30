# Controladores de CRM

Capa HTTP. Validan, autorizan y delegan; la transacción vive en el servicio.

## Rutas

Un único controlador (`CrmController`, prefijo `crm`) porque todas las rutas comparten el mismo
dominio y el mismo par de servicios. Agrupa 15 endpoints sobre `accounts`, `leads`,
`opportunities`, `activities`, `partnerships`, `cases` y `contacts`.

## Autenticación y autorización

`JwtAuthGuard` global + `@Roles(...)`. `CRM_AGENT` cubre la operación diaria (cuentas, leads,
oportunidades, actividades, casos, consentimiento); `CRM_ADMIN` añade equipo de cuenta y alianzas,
que definen quién ve qué y comprometen acuerdos comerciales.

## Validaciones HTTP

`ParseUUIDPipe` en todos los parámetros de ruta, incluidos los dos de
`contacts/:id/channels/:cid/opt-in`. `ValidationPipe` global sobre los cuerpos.

## Códigos de respuesta

`201 Created` en altas (cuenta, miembro, lead, conversión, actividad, alianza, caso, comentario).
`200 OK` en las que mutan o consultan un recurso existente: calificar lead, avanzar etapa, ganar,
perder, transicionar o resolver caso, consentimiento y vista 360.

## Métodos HTTP

Se usa `PATCH` donde el caso de uso lo pide explícitamente —calificar lead, cambiar estado de caso,
opt-in de canal— porque son modificaciones parciales de un recurso existente. El resto son `POST`
de comando (avanzar, ganar, perder, resolver), que no son actualizaciones parciales sino
transiciones de negocio.

## Relación con los servicios

Inyecta `CrmSalesService` (ciclo comercial) y `CrmServiceService` (actividades, alianzas, casos,
consentimiento y 360). `resolveCase` delega en `changeCaseStatus` con `RESOLVED`: es un atajo del
caso de uso 13 sobre la misma transición, no una regla aparte.

## Pruebas

`crm.controller.spec.ts` con ambos servicios mockeados: delegación, argumentos (incluido el actor y
los ids de ruta) y propagación de errores.
