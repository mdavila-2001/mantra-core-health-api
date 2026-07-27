# DTOs — polyglot_storage

Un solo archivo, `polyglot-storage.dto.ts`, con 35 clases: una de entrada y una de respuesta por
caso de uso, más los anidados (`BackendRegionDto`, `BackendCapabilityDto`, `RotationPolicyDto`,
`ResidencyPolicyDto`, `ReplicationPolicyDto`, `RetentionPolicyDto`).

## Numéricos como cadena

`storageBytes`, `readUnits`, `writeUnits` y `egressBytes` son `bigint`; `estimatedCost` es
`numeric`. Los cinco se validan con `@IsNumberString()`, no con `@IsNumber()` — los cuatro primeros
además con `{ no_symbols: true }`, porque un contador de bytes negativo o con signo no significa
nada. Un `bigint` que pasa por `number` pierde precisión por encima de 2^53, y la precisión aquí
decide una factura.

## Anidados

`RegisterBackendDto` lleva `regions[]` y `capabilities[]`; `DefineEncryptionProfileDto` lleva
`rotationPolicy`; `DefineStoragePoliciesDto` lleva las tres políticas a la vez. Todos con
`@ValidateNested({ each: true })` + `@Type(() => …)`, porque sin `@Type` `class-transformer` deja
objetos planos y la validación anidada no corre.

Las tres políticas van en un solo DTO deliberadamente: residencia, replicación y retención se
contradicen entre sí, y sólo se pueden validar juntas.

## Listas de países y regiones

`allowedCountries`, `forbiddenCountries` y `allowedRegions` son `string[]` opcionales validados con
`@IsArray()` + `@IsString({ each: true })`. La regla *prohibido gana sobre permitido* no vive aquí
sino en el servicio: es una regla de negocio, no de forma.

## Estados

El único estado que llega por la petición —`status` del chequeo de salud— se valida con `@IsIn`
contra `HEALTH_STATUSES` de `constants/polyglot-storage.constants.ts`, en MAYÚSCULAS. No se
normaliza la caja: la comparación contra la columna `varchar` es literal, y aceptar `healthy` para
escribir `HEALTHY` sería aceptar dos verdades distintas para el mismo hecho. Los demás estados los
fija el servicio, no el cliente.

## Respuestas

Las `*ResponseDto` exponen id, código, estado y las marcas de tiempo relevantes. No exponen
`keyReference` de los perfiles de cifrado ni `rowFilterExpression` de las políticas de acceso: son
los dos campos con los que un lector de la respuesta podría deducir qué se está protegiendo y cómo.
