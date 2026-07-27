# Controladores de seguimiento

Capa HTTP. Validan, autorizan y delegan; la transacción vive en el servicio.

## Rutas

Un único controlador (`TrackingController`, prefijo `tracking`) con 11 endpoints sobre
`trackable-subjects`, `milestone-definitions`, `shipments`, `webhooks` y `sla`.

## Autenticación y autorización

`JwtAuthGuard` global + `@Roles(...)`:

| Rol | Alcance |
| --- | --- |
| `TRACKING_ADMIN` | Todo el módulo; único que define el catálogo de hitos |
| `LOGISTICS_OPERATOR` | Abrir, despachar, traspasar, cancelar, registrar eventos |
| `COURIER` | Eventos, traspasos, entregas y excepciones desde la calle |
| `SYSTEM` | Recalcular estimaciones y barrer el SLA |

Es deliberado que sólo `TRACKING_ADMIN` defina hitos: el catálogo fija contra qué se mide el
cumplimiento, y quien opera no debería poder cambiar la vara con la que se le mide.

## La ruta pública

`POST /tracking/webhooks/carriers/:carrierCode` es `@Public()`: el transportista es un tercero sin
sesión en el sistema. Su identidad se acredita con el código de la ruta —que debe existir como
transportista registrado— y, cuando el conector de integraciones lo aporte, con la firma del
proveedor (ver *Pendiente* del módulo).

Es también el único método del controlador que no recibe `@CurrentUser()`: no hay actor.

## Validaciones HTTP

`ParseUUIDPipe` en todos los parámetros de ruta salvo `:carrierCode`, que es una clave natural
legible, no un UUID. `ValidationPipe` global sobre los cuerpos.

## Códigos de respuesta

`201 Created` en lo que crea registro (sujeto, hitos, evento, traspaso, estimación, prueba de
entrega, excepción). `200 OK` en lo que muta algo existente o devuelve un resumen: despachar,
cancelar, el webhook y el barrido de SLA.

El webhook devuelve `200` incluso cuando el evento era duplicado: es lo que hace que el
transportista deje de reintentar.

## Nota sobre las rutas del caso de uso

Los casos de uso escriben tres rutas con dos puntos (`/eta:recompute`, `/{id}:cancel`,
`/sla:scan`). Aquí se usan segmentos normales por el mismo motivo que en el resto del proyecto: el
enrutador de Nest 11 interpreta `:` como inicio de parámetro en cualquier posición del segmento.

## Pruebas

`tracking.controller.spec.ts` con el servicio mockeado: delegación, argumentos (incluido el actor y
los ids de ruta), el webhook sin actor y propagación de errores.
