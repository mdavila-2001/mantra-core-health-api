# Convenciones de API

> Fase 5. Cubre versionado, paginación/filtrado/ordenamiento e idempotencia — derivado del código
> real (`src/common/dto/pagination-query.dto.ts`, controllers con `idempotencyKey`), no de una
> plantilla genérica.

## Versionado

**No hay versionado de API activo** (sin prefijo `/v1`, sin `Accept-Version`, sin versionado por
Nest `VersioningType`). Todas las rutas cuelgan directamente del dominio (`/accounting/...`,
`/scheduling/...`). Es un estado real a documentar, no una omisión: si se introduce versionado en
el futuro, corresponde un ADR (`docs/adr/`, Fase 10) justificando la estrategia elegida
(URI, header, o content negotiation).

## Paginación

Compartida por todos los listados vía `PaginationQueryDto` (`src/common/dto/pagination-query.dto.ts`):

| Parámetro | Tipo | Default | Límite |
|---|---|---:|---:|
| `page` | entero, 1-based | `1` | — |
| `pageSize` | entero | `20` | **máximo 100** (límite duro) |
| `order` | `'ASC' \| 'DESC'` | `'DESC'` | — |
| `sortBy` | string | `'createdAt'` | — |

El límite de `pageSize=100` es deliberado: acota el costo de la consulta y cierra la paginación
abusiva como vector de extracción masiva de datos (comentario de diseño explícito en el código).
El offset para el ORM se deriva como `(page - 1) * pageSize`.

**Filtrado y ordenamiento:** no hay un mecanismo genérico de filtrado tipo `?filter[campo]=valor`;
cada listado define sus propios query params específicos del dominio sobre `PaginationQueryDto`
(patrón DTO por herencia/composición, verificable módulo por módulo en `docs/modules/*/endpoints.md`,
Fase 9).

## Idempotencia

No hay un mecanismo genérico de cabecera `Idempotency-Key` aplicado transversalmente por
middleware — se implementa **por dominio**, donde el negocio lo exige. Ejemplo real verificado:
`POST /payments/intents` (`src/modules/payments/controllers/payments-intents.controller.ts`):
repetir la misma `idempotencyKey` devuelve el intent existente en lugar de generar un segundo
cobro. Otros flujos con semántica idempotente conocida (documentados en
`ESTADO-Y-PENDIENTES.md`): emisión de solicitudes de medicación (perioperatorio).

**Brecha:** no existe un catálogo consolidado de qué endpoints son idempotentes y con qué
mecanismo (`Idempotency-Key` header vs. campo del body vs. `UNIQUE` constraint natural). Se
construye módulo por módulo en Fase 9 (`docs/modules/*/domain-rules.md`).

## Formato de fecha/hora

ISO 8601 en UTC (`timestamp` del modelo de error usa `.toISOString()`, ver
`docs/api/error-model.md`). No se detectó una convención distinta en DTOs de negocio durante esta
fase — confirmar caso por caso al documentar cada módulo.

## Content-Type

`application/json` con límite explícito de payload de **1 MB** (`json({ limit: '1mb' })`,
`src/main.ts`) — cargas grandes (imágenes, DICOM) van por el flujo de almacenamiento de objetos
(`object_storage`, MinIO/S3), no por el body JSON.

## Deprecación

No existe todavía una política de deprecación de endpoints (sin cabecera `Deprecation`, sin campo
`deprecated: true` usado en el contrato OpenAPI generado). Se define cuando exista el primer caso
real que la requiera — no se documenta una política hipotética sin evidencia de uso.

## Errores con `details.reason` (BR-04)

El status no cambia; `details.reason` deja al cliente distinguir subcasos:

| `reason` | Status | Cuándo | Qué hace el cliente |
| --- | --- | --- | --- |
| `TENANT_REQUIRED` | 403 / 422 | Hay que indicar `X-Tenant-Id` y el actor no tiene uno resoluble | Abre el selector de organización |
| `TENANT_AMBIGUOUS` | 403 | El actor pertenece a varios tenants y no indicó cuál | Abre el selector de organización |
| `MFA_REQUIRED` | 401 | Login de una cuenta con MFA verificado sin `mfaCode` (con `AUTH_MFA_CHALLENGE_ENABLED=true`) | Pide el código y reintenta el login |
| `MFA_INVALID` | 401 | `mfaCode` que no valida | Vuelve a pedir el código |
| `CURRENT_PASSWORD_INVALID`, `PASSWORD_UNCHANGED` | 422 | `POST /iam/auth/change-password` | Muestra el error en el formulario |

Un `429` lleva `code: RATE_LIMITED` y `Retry-After` (segundos).

Front y API van bajo **el mismo origen** (TX-20): no se abre CORS. Ver
`src/common/auth/README.md`.
