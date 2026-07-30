# Controladores de promociones

Capa HTTP. Validan, autorizan y delegan; la transacción vive en el servicio.

## Rutas

| Controlador | Endpoints |
| --- | --- |
| `LoyaltyController` | 8 sobre `loyalty/programs`, `loyalty/memberships`, `loyalty/jobs`, `referral-programs` y `referrals` |
| `PromotionsController` | 6 sobre `promotions`, `coupons`, `redemptions` y `checkout` |

Ninguno declara prefijo en `@Controller()`: los casos de uso cuelgan de raíces distintas
(`/loyalty`, `/promotions`, `/coupons`, `/redemptions`, `/checkout`, `/referral-programs`), así que
la ruta completa va en cada decorador. Poner un prefijo obligaría a inventar uno que el modelo no
declara.

## Autenticación y autorización

`JwtAuthGuard` global + `@Roles(...)`. `PROMOTIONS_ADMIN` cubre el módulo; `MARKETING_MANAGER`
gestiona programas, promociones y cupones; `MEMBER` se inscribe, canjea sus puntos y genera su
código de referido; `CASHIER` valida, redime, descuenta en checkout y revierte; `SYSTEM` ejecuta
acumulación, recompute, barrido y calificación de referidos.

Es deliberado que un `MEMBER` pueda **canjear** pero no **acumular**: la acumulación la dispara un
evento del sistema, no el propio interesado.

## Validaciones HTTP

`ParseUUIDPipe` en todos los parámetros de ruta. `ValidationPipe` global sobre los cuerpos. El
código del cupón y el del referido viajan en el cuerpo, no en la ruta, porque el checkout los recibe
tecleados y no son identificadores del recurso que se está tocando.

## El referidor sale del token

`POST /referral-programs/:id/referrals` no acepta `referrerUserId` en el cuerpo: es
`@CurrentUser().id`. Aceptarlo permitiría generar referidos a nombre de otro.

## Códigos de respuesta

`201 Created` en las altas (programa, membresía, entrada del ledger por acumulación o canje,
promoción, cupones, redención, referido). `200 OK` en lo que consulta o muta algo existente:
recompute, barrido, validación, checkout, reversa y calificación.

## Nota sobre las rutas del caso de uso

Los casos de uso escriben cuatro rutas con dos puntos (`/points:earn`, `/points:redeem`,
`/coupons:batch`, `/coupons:validate`, `/redemptions/{id}:reverse`). Aquí se usan segmentos normales
(`/points/earn`, `/coupons/batch`, `/redemptions/:id/reverse`) por el mismo motivo que en ERP y en
marketing: es el estilo del proyecto y el enrutador de Nest 11 interpreta `:` como inicio de
parámetro en cualquier posición del segmento, de modo que `coupons:batch` quedaría como el literal
`coupons` seguido de un parámetro llamado `batch`.

## Pruebas

`promotions.controller.spec.ts` cubre ambos controladores con los servicios mockeados: delegación,
argumentos (incluido el actor y los ids de ruta), la validación que va sin actor y propagación de
errores.
