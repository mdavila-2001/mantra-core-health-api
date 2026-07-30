# Controladores de publicidad

Capa HTTP. Validan, autorizan y delegan; la transacción vive en el servicio.

## Rutas

Un único controlador (`AdsController`, prefijo `ads`) con 17 endpoints sobre `business-managers`,
`platform-connections`, `ad-accounts`, `ad-sets`, `ads`, `event-data-policies`, `ingest`,
`datasets`, `offline-conversion-sets`, `automated-rules`, `policy-violations`, `catalogs` y
`lead-forms`. Un módulo de 74 tablas cabe en un controlador porque la capa HTTP no hace más que
delegar: el reparto real está en los cuatro servicios.

## Autenticación y autorización

`JwtAuthGuard` global + `@Roles(...)`, con roles por función en lugar de un único rol de módulo:

| Rol | Alcance |
| --- | --- |
| `ADS_ADMIN` | Todo el módulo |
| `BUSINESS_ADMIN` | Provisión de cuentas, socios y conexiones |
| `AD_OPS` | Campañas, segmentación, identidad, offline, experimentos, presupuesto |
| `DATA_PRIVACY_OFFICER` | Política de datos de evento |
| `POLICY_REVIEWER` | Revisiones y apelaciones |
| `FINANCE` | Emisión de facturas |
| `SYSTEM` | Ingesta, conversiones, reglas, feed y leads |

Es deliberado que `AD_OPS` no pueda publicar la política de datos: quien lanza campañas no debería
poder ampliar lo que se envía a la plataforma.

## Validaciones HTTP

`ParseUUIDPipe` en todos los parámetros de ruta, incluidos los dos de
`catalogs/:id/feeds/:feedId/run`. `ValidationPipe` global sobre los cuerpos.

## Ninguna ruta es pública

Los tres endpoints que alimenta la plataforma externa (ingesta, revisión y lead) llevan rol
`SYSTEM`, no `@Public()`: entran por el conector de integraciones, que sí autentica. A diferencia
del callback de pagos, aquí no hay un tercero llamando directamente sin credencial.

## Códigos de respuesta

`201 Created` en las altas (cuenta, socio, conexión, campaña, segmentación, política, conversión,
subida offline, experimento, revisión, apelación, factura, lead, tramo de presupuesto). `200 OK` en
lo que muta algo existente o devuelve un cálculo: asignar identidad, ingerir insights, evaluar una
regla y correr el feed.

## Nota sobre las rutas del caso de uso

Los casos de uso escriben tres rutas con dos puntos (`/campaigns:launch`, `/feeds/{feedId}:run`,
`/invoices:issue`). Aquí se usan segmentos normales (`/campaigns/launch`, `/feeds/:feedId/run`,
`/invoices/issue`) por el mismo motivo que en ERP, marketing y promociones: es el estilo del
proyecto y el enrutador de Nest 11 interpreta `:` como inicio de parámetro en cualquier posición del
segmento.

## Pruebas

`ads.controller.spec.ts` con los cuatro servicios mockeados: delegación, argumentos (incluido el
actor y los ids de ruta, con los dos de la corrida de feed) y propagación de errores.
