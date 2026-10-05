# Revisión del núcleo `common` — ALOVIDA

## 1. Alcance y evidencia

Se revisaron los contratos transversales de autenticación, resolución de tenant,
errores HTTP, DTO y paginación, despacho saliente/SSRF, criptografía, resiliencia,
almacenamiento, runtime, rate limit, verificación y seeds. Se leyeron los
componentes ejecutables de `src/common`; los JSON clínicos se trataron como datos de
seed y no se realizó una validación semántica clínica archivo por archivo.

La ejecución dirigida fue:

```sh
corepack yarn test src/common --runInBand --silent
```

Resultado: **72 suites y 712 pruebas aprobadas**. Jest informó advertencias de
importación JSON sin `with { type: 'json' }` en catálogos de seed; Node indica que
será un error duro en una versión mayor. No se contabiliza como hallazgo funcional
actual, pero debe resolverse al actualizar el runtime.

## 2. Resumen

| Severidad | Cantidad | Lentes |
| --- | ---: | --- |
| Crítica | 0 | — |
| Alta | 1 | contrato de errores / autorización |
| Media | 1 | contrato temporal |
| Baja | 0 | — |

## 3. Mapa de controles revisados

| Área | Control confirmado | Límites revisados |
| --- | --- | --- |
| Autenticación y tenant | JWT global; sesión viva; `TenantScopeGuard` antes de roles; contexto `AsyncLocalStorage`; RLS opcional | `SUPERADMIN` y `SYSTEM` pueden seleccionar tenant o entrar en barrido de sistema conforme a la política actual |
| Egreso HTTP | Sólo HTTP(S), resolución de todas las IP, bloqueo de redes privadas en producción, DNS anclado, sin proxy/redirecciones y límites de tiempo/tamaño | los llamadores reciben fallos de entrega como resultado, no excepción HTTP de negocio |
| Errores | El filtro sanea 5xx, conserva códigos de driver conocidos y evita filtrar esquema | las excepciones Nest genéricas sólo reciben el código por defecto del status |
| Concurrencia/archivos | locks transaccionales PostgreSQL, deduplicación de operaciones, estados de publicación y cierre ante incertidumbre | la coordinación depende de usar el protocolo por los productores |
| Resiliencia | reintentos allowlist, plazo abortable, circuito, mamparo y mutex por proceso | los mutex en memoria no coordinan réplicas; los flujos de almacenamiento usan locks de PostgreSQL |

## 4. Hallazgos confirmados y plan

### CMM-01 — Alta — Los rechazos centrales de auth y tenant no tienen `reason` de negocio estable

El contrato de revisión exige `HttpStatus`, `ErrorCode` y `reason`. Sin embargo,
`RolesGuard` lanza un `ForbiddenException` de texto ([`roles.guard.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/auth/roles.guard.ts#L79-L85)); la resolución de tenant hace lo mismo para membresía ausente o declaraciones contradictorias ([`tenant-resolution.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/tenant/tenant-resolution.ts#L36-L40), [`tenant-resolution.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/tenant/tenant-resolution.ts#L81-L85)); y el interceptor expone el campo y UUID declarados mediante otro `ForbiddenException` textual ([`tenant-context.interceptor.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/tenant/tenant-context.interceptor.ts#L186-L196)).

El filtro sólo toma `details` cuando la respuesta de la excepción ya es un objeto; para una excepción construida con texto devuelve el código genérico del status y ningún `details.reason` ([`all-exceptions.filter.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/filters/all-exceptions.filter.ts#L270-L283)). Por eso el cliente sólo obtiene `403/FORBIDDEN` y no puede diferenciar rol insuficiente, tenant no miembro, declaración contradictoria o tenant cruzado. Las rutas de falta/ambigüedad sí construyen un `reason`, lo que demuestra el contrato esperado ([`tenant-resolution.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/tenant/tenant-resolution.ts#L49-L59)).

**Impacto.** Pantallas y clientes automáticos no pueden elegir una recuperación correcta y deben interpretar texto en castellano. Además, el rechazo de alcance incluye el UUID de otro tenant en el mensaje de respuesta.

**Plan de corrección.** Crear razones del núcleo (`ROLE_INSUFFICIENT`, `TENANT_MEMBERSHIP_REQUIRED`, `TENANT_SCOPE_CONFLICT`, `TENANT_DECLARATION_CONFLICT`) y una excepción de dominio de autorización, o ampliar de forma tipada el contrato de `DomainException`. Sustituir las excepciones genéricas de los guards e interceptor; conservar el mensaje seguro y eliminar de la respuesta los valores de tenant conflictivos. Ampliar el filtro sólo para serializar el contrato de dominio, sin inferir reasons desde textos.

| Caso | Tipo y preparación | Entrada exacta | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | unit `tenant-scope.guard.spec.ts` | miembro de A con `X-Tenant-Id: A` y rol requerido | continúa; `resolvedTenantId=A` |
| Límite | unit `roles.guard.spec.ts` | rol scoped en A, tenant resuelto A | autorización positiva; no se degrada a rol global |
| Error | unit `tenant-context.interceptor.spec.ts` | miembro de A con `body.tenantId=B` | `403/FORBIDDEN/TENANT_SCOPE_CONFLICT`; sin UUID de B en cuerpo |
| Falla catalogada | unit de filtro + e2e de un endpoint protegido | rol ausente o `X-Tenant-Id` ajeno | `403/FORBIDDEN/ROLE_INSUFFICIENT` o `TENANT_MEMBERSHIP_REQUIRED` exacto |

**Ola y esfuerzo:** Ola 0, M. Es transversal: primero catálogo y filtro, después guard, resolución e interceptor, y por último consumidores y contratos OpenAPI.

### CMM-02 — Media — `ParseOptionalDatePipe` acepta fechas no ISO y timestamps sin zona pese a prometer ISO 8601

El pipe declara que exige un instante ISO 8601 y ofrece un ejemplo con `Z` ([`parse-optional-date.pipe.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/http/parse-optional-date.pipe.ts#L8-L16)), pero su única validación es `!Number.isNaN(new Date(value).getTime())` ([`parse-optional-date.pipe.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/http/parse-optional-date.pipe.ts#L31-L43)). En Node 24, `2026/07/01`, `07/01/2026` y `2026-07-01T10:00:00` se aceptan; los dos primeros dependen del parser de plataforma y el tercero toma la zona local. No hay spec para este pipe en `src/common/http`.

**Impacto.** Un filtro temporal puede cambiar de día o de intervalo según host/zona y contradecir el contrato público. Los consumidores no reciben un rechazo estable para formatos ambiguos.

**Plan de corrección.** Exigir una gramática ISO de fecha/hora completa con offset (`Z` o `±HH:MM`), comprobar el calendario tras parsear y devolver una excepción de dominio con `INVALID_ISO_DATETIME`. Definir aparte, si se necesita, un pipe de fecha civil `YYYY-MM-DD`; no reutilizarlo para instantes. Añadir pruebas de zona y fechas imposibles.

| Caso | Tipo y preparación | Entrada exacta | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | unit `parse-optional-date.pipe.spec.ts` | `2026-08-07T00:00:00Z` | `Date` del mismo instante UTC |
| Límite | unit | `2024-02-29T23:59:59.999-04:00` | acepta y conserva el instante exacto |
| Error | unit | `2026/07/01`, `07/01/2026` y `2026-07-01T10:00:00` | rechazo, sin ejecutar consulta |
| Falla catalogada | e2e de una ruta que usa el pipe | `?from=2026/07/01` | `400/VALIDATION_FAILED/INVALID_ISO_DATETIME` |

**Ola y esfuerzo:** Ola 2, S. Inventariar primero los controladores que instancian el pipe y publicar el cambio de contrato.

## 5. Plan de pruebas por hallazgo

Las cuatro filas de prueba de cada hallazgo se detallan junto a su evidencia y plan. La matriz siguiente cubre la unidad completa.

## 6. Matriz de pruebas de la unidad

| Componente | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| JWT, roles y tenant | JWT/sesión/membresía válidos | rol scoped y múltiples tenants | cabecera ajena o body cruzado | `401/UNAUTHENTICATED/*` y `403/FORBIDDEN/*` con reason |
| Filtro global | `DomainException` | SQLSTATE conocido y causa anidada | JSON malformado / 413 | status, `ErrorCode` y reason cuando el error es de negocio |
| Egreso HTTP | host público firmado | tamaño/timeout máximos | DNS privado, redirección y respuesta sobredimensionada | precondición de dominio con reason de política |
| Storage lifecycle | reserva, settle y commit | reintento idempotente / competencia | receipt o referencia opaca | `StorageLifecycleDenied` con razón del protocolo |
| Resiliencia | operación sana | transición half-open/cancelación | dependencia 5xx/no transitoria | errores de circuito, mamparo y plazo tipados |
| Seeds | catálogo válido idempotente | catálogo grande completo | JSON o referencia inexistente | fallo de bootstrap legible, sin publicar seed parcial |

## 7. Catálogo de errores

Los reasons propuestos para CMM-01 y CMM-02 deben declararse antes de reemplazar throws. El commit pendiente de integrar `fa74b78c` modifica el catálogo de errores y `2372d42a` endurece DTOs y validadores; se debe contrastar este informe cuando lleguen a `dev`.

## 8. Olas de ejecución y esfuerzo

| Ola | Hallazgo | Esfuerzo | Dependencia |
| --- | --- | --- | --- |
| 0 | CMM-01 | M | Catálogo, filtro, guard, resolución e interceptor deben cambiar coordinadamente. |
| 2 | CMM-02 | S | Acordar la gramática pública y actualizar consumidores antes de exigirla. |

## 9. Trabajo pendiente de integrar y cobertura no realizada

No se levantaron PostgreSQL, Redis, S3 ni los proveedores externos: las garantías RLS, advisory locks y almacenamiento se verificaron por código y por sus pruebas unitarias. Tampoco se validó clínicamente cada JSON de formularios de seed.
