# Equipos de diagnóstico: formato de intercambio común

Cuatro sesiones cargan equipos de diagnóstico y sus marcas, cada una con sus propias fuentes, y
una quinta etapa (`master`) los consolida. Para que esa unión sea posible, todas escriben el mismo
NDJSON normalizado.

| Carpeta | Sesión | Fuentes |
|---|---|---|
| `us/` | `seed-dx-devices-us` | FDA |
| `eu/` | `seed-dx-devices-eu` | EUDAMED, EMDN, MHRA PARD, Swissmedic swissdamed, registros nacionales europeos |
| `row/` | `seed-dx-devices-row` | Resto del mundo |
| `master/` | `seed-dx-devices-master` | Consolida fabricantes y marcas, y clasifica |

## Archivo de equipos: `<region>/out/devices-<region>*.ndjson[.gz]`

Una línea por equipo (un registro de la fuente: un UDI-DI, un registro nacional, una ficha). Todos
los campos están siempre presentes; lo que la fuente no publica va en `null`, nunca inventado ni
deducido por parecido.

| Campo | Tipo | Qué es |
|---|---|---|
| `source` | string | Código estable de la fuente (`EUDAMED`, `SWISSDAMED`, `IT_BDRDM`, `FDA_GUDID`, …) |
| `sourceRecordId` | string | Id del registro en la fuente (UUID de EUDAMED, número de registro, …) |
| `sourceUrl` | string | URL de la ficha oficial o de la consulta exacta que devolvió la fila |
| `sourceVersion` | string\|null | Versión del registro o del archivo (número de versión, fecha de publicación, sha256) |
| `retrievedAt` | string | Fecha y hora ISO 8601 de la descarga |
| `deviceTypeCode` | string\|null | Código del tipo de dispositivo |
| `deviceTypeSystem` | string\|null | Sistema del código: `EMDN`, `GMDN`, `FDA_PRODUCT_CODE`, `CND`, `MIGEL`, … |
| `deviceTypeName` | string\|null | Nombre del tipo tal como lo publica la fuente (idioma original) |
| `manufacturerName` | string\|null | Razón social del fabricante legal |
| `manufacturerCountry` | string\|null | ISO 3166-1 alfa-2 |
| `manufacturerRegistryId` | string\|null | Id del fabricante en el registro (SRN de EUDAMED/swissdamed, FEI, …) |
| `brandName` | string\|null | Marca o nombre comercial |
| `model` | string\|null | Modelo, referencia o número de catálogo |
| `udiDi` | string\|null | UDI-DI (si la fuente solo da Basic UDI-DI, va en `extensions.basicUdiDi`) |
| `riskClass` | string\|null | Clase tal como la publica la fuente (`CLASS_IIA`, `IVDR_CLASS_C`, `2`, …) |
| `authorizationId` | string\|null | Certificado, número de registro o autorización |
| `authorizationDate` | string\|null | Fecha ISO de esa autorización |
| `status` | string\|null | Estado en la fuente (`ON_THE_MARKET`, `NO_LONGER_PLACED`, …) |

Campos adicionales permitidos (los consumidores pueden ignorarlos):

- `id`: UUID estable `md5('mantra:dx-devices:<source>:<sourceRecordId>')`, para deduplicar entre
  corridas.
- `extensions`: objeto con datos propios de la fuente que no tienen columna común
  (`basicUdiDi`, `notifiedBody`, `legislation`, `deviceName`, …).

## Archivo de fabricantes (opcional): `<region>/out/manufacturers-<region>*.ndjson[.gz]`

Una línea por actor registrado, para que `master` pueda unir fabricantes por id de registro.
Campos: `source`, `sourceRecordId`, `sourceUrl`, `sourceVersion`, `retrievedAt`,
`manufacturerRegistryId`, `manufacturerName`, `manufacturerCountry`, `actorRole`,
`extensions`.

## Reglas comunes

- **Deduplicación**: por UDI-DI, por número de certificado o por fabricante + modelo normalizados
  (mayúsculas, espacios colapsados). Nunca por parecido difuso.
- **Tamaño**: cada parte comprimida (`.gz`) pesa menos de 50 MB; los crudos que pesan demasiado no
  se suben y se reproducen con el script de descarga (URL, versión y sha256 en su manifiesto).
- **Sin DDL** (ADR-0021): los importadores no crean tablas ni columnas.
- Identificadores en inglés; texto visible en castellano de usted. Una traducción propia nunca se
  presenta como oficial.
