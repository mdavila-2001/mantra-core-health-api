# Revisión de núcleo: errores, HTTP, DTO, paginación, dinero y constantes

## 1. Fecha, alcance y cobertura real

Fecha: 2026-10-05. Se leyeron `errors`, `filters`, `http`, `dto`, `pagination`, `money` y `constants`, junto con specs locales. `corepack yarn test src/common/errors src/common/filters src/common/http src/common/pagination src/common/money --runInBand --silent` terminó en **9 suites y 120 pruebas aprobadas**. La revisión es estática y unitaria: no se levantó API ni se ejercieron las rutas de cada módulo.

## 2. Resumen ejecutivo

| Severidad | Cantidad | Lente |
| --- | ---: | --- |
| Crítica | 0 | — |
| Alta | 2 | contrato de errores / validación |
| Media | 1 | semántica temporal |
| Baja | 0 | — |

## 3. Mapa de la unidad

| Componente | Responsabilidad | Evidencia |
| --- | --- | --- |
| `DomainException` | status, code y details | `domain.exception.ts:13-58` |
| Filtro global | serializa y sanea | `all-exceptions.filter.ts:120-310` |
| Pipes | fecha, límite, UUIDs | `src/common/http/parse-*.pipe.ts` |
| Cursor | decode base64url/JSON | `keyset-cursor.ts:37-59` |
| Dinero | decimal con `BigInt` | `decimal-money.ts:41-124` |

No se auditaron todas las rutas consumidoras ni el catálogo total de módulos.

## 4. Hallazgos confirmados y plan

### CEH-01 — Alta — Pipes de query rechazan sin `ErrorCode` ni `reason`

**Evidencia y veredicto.** `ParseOptionalLimitPipe` rechaza fuera de 1..max con cadena ([`parse-optional-limit.pipe.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/http/parse-optional-limit.pipe.ts#L25-L34)); `ParseUuidListPipe` hace lo mismo para formato, cantidad y UUID ([`parse-uuid-list.pipe.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/http/parse-uuid-list.pipe.ts#L55-L73)); el cursor inválido repite el patrón ([`keyset-cursor.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/pagination/keyset-cursor.ts#L37-L59)). El filtro no inventa reason para una respuesta cadena ([`all-exceptions.filter.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/filters/all-exceptions.filter.ts#L270-L283)). Confirmado.

**Impacto.** El cliente no recibe una causa estable para corregir límite, cursor o UUID y queda atado al texto. No hay evidencia de inyección: los validadores sí frenan entradas inválidas.

**Plan.** 1. Añadir `INVALID_LIMIT`, `INVALID_UUID_LIST` e `INVALID_CURSOR` bajo `VALIDATION_FAILED`. 2. Reemplazar las tres excepciones por una fábrica de validación que no devuelva la entrada completa. 3. Probar forma serializada. 4. Inventariar consumidores y OpenAPI. Sin DDL; riesgo de clientes que comparen `message`.

| Caso | Tipo / spec propuesto | Preparación e entrada exacta | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | unit de tres pipes | `limit=500`, UUIDs válidos, cursor emitido | valores tipados aceptados |
| Límite | unit | `limit=1`, lista máxima, cursor con `null` | acepta |
| Error | unit | `limit=501`, `ids=no-uuid`, cursor `@@@` | sin repositorio ni parse error crudo |
| Falla catalogada | e2e ruta paginada | `?limit=501` | HTTP **400**, `VALIDATION_FAILED`, `INVALID_LIMIT` |

### CEH-02 — Alta — Secreto cifrado inválido escapa como `Error` genérico

**Evidencia y veredicto.** `decryptSecret` sólo verifica cuatro partes y lanza `Error` textual ([`secret-cipher.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/crypto/secret-cipher.ts#L91-L108)). Base64 truncado o tag GCM inválido alcanza primitivas crypto sin traducción local. El filtro sanea el 500, pero no distingue configuración/clave/dato corrupto. No se afirma fuga de texto porque el filtro lo evita.

**Plan.** 1. Validar longitudes de salt/IV/tag y base64 canónico. 2. Capturar errores crypto y emitir error interno seguro `SECRET_CIPHER_INVALID`. 3. En flujos HTTP, traducir al `DomainException` adecuado. 4. Medir sin registrar el secreto. Riesgo: distinguir datos históricos corruptos de cambio de clave; sin DDL.

| Caso | Tipo / spec propuesto | Preparación e entrada exacta | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | unit `secret-cipher.spec.ts` | `encryptSecret('abc')` | descifra `abc` |
| Límite | unit | salt 16 B, IV 12 B, tag 16 B | acepta formato mínimo válido |
| Error | unit | `a.b.c` y tag base64 truncado | error tipado sin secreto |
| Falla catalogada | integración consumidor HTTP | secreto sintético corrupto | **500**, `INTERNAL_ERROR`, reason seguro acordado |

### CEH-03 — Media — El pipe ISO acepta fechas ambiguas y timestamps sin zona

**Evidencia y veredicto.** El JSDoc exige ISO y ejemplifica `Z` ([`parse-optional-date.pipe.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/http/parse-optional-date.pipe.ts#L8-L16)), pero sólo comprueba `new Date(value)` ([líneas 31-43](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/http/parse-optional-date.pipe.ts#L31-L43)). `2026/07/01` y `2026-07-01T10:00:00` dependen de parser/zona. No hay spec local. Confirmado.

**Plan.** Exigir fecha-hora con `Z` u offset, validar calendario y usar `INVALID_ISO_DATETIME`. Crear pipe separado para fecha civil si hace falta. Riesgo: clientes que hoy envían tiempo local.

| Caso | Tipo / spec propuesto | Preparación e entrada exacta | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | unit `parse-optional-date.pipe.spec.ts` | `2026-08-07T00:00:00Z` | mismo instante UTC |
| Límite | unit | `2024-02-29T23:59:59.999-04:00` | acepta |
| Error | unit | `2026/07/01`, timestamp sin offset | rechaza sin consulta |
| Falla catalogada | e2e endpoint | `?from=2026/07/01` | **400**, `VALIDATION_FAILED`, `INVALID_ISO_DATETIME` |

## 5. Matriz de pruebas de la unidad completa

| Superficie | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| Filtro | `DomainException` | SQLSTATE conocido | ORM con detalle | status/code/reason seguro |
| Query pipes | valores válidos | máximo/mínimo | formato inválido | 400 + reason |
| Cursor | cursor emitido | escalares/null | JSON inválido | 400 `INVALID_CURSOR` |
| Fecha | ISO con offset | bisiesto | formato ambiguo | 400 `INVALID_ISO_DATETIME` |
| Dinero | suma literal | escala distinta | decimal mal formado | excepción del consumidor |

## 6. Catálogo de errores

Propuestos: `INVALID_LIMIT`, `INVALID_UUID_LIST`, `INVALID_CURSOR`, `INVALID_ISO_DATETIME` (400/`VALIDATION_FAILED`) y `SECRET_CIPHER_INVALID` interno. Ningún reason se declara huérfano.

## 7. Dependencias y riesgos

Depende de la fábrica de `DomainException`, filtro y `catalogo-errores`. Un reason interno de cifrado no debe exponerse a usuario final.

## 8. Olas y esfuerzo

| Ola | Hallazgo | Esfuerzo | Criterio de salida |
| --- | --- | --- | --- |
| 0 | CEH-01 | M | tres validadores con code/reason estable |
| 1 | CEH-02 | S | cifrado inválido tipado y sin filtración |
| 2 | CEH-03 | S | ISO con offset cubierto por spec/OpenAPI |

## 9. Trabajo pendiente de integrar

`fa74b78c` afecta el catálogo y `2372d42a` DTO/validadores; contrastar duplicados al llegar a `dev`. Esta revisión no cambia código.
