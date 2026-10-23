# Revisión de núcleo: criptografía, persistencia, resiliencia, runtime y storage

## 1. Fecha, alcance y cobertura real

Fecha: 2026-10-05. Se leyeron `crypto`, `persistence`, `resilience`, `runtime`, `storage`, `build-info.ts` e `index.ts`, con sus specs. `corepack yarn test src/common/crypto src/common/resilience src/common/runtime src/common/storage --runInBand --silent` terminó en **21 suites y 225 pruebas aprobadas**. No se conectó S3, disco productivo ni PostgreSQL; las conclusiones sobre proveedores se limitan al manejo de errores observado.

## 2. Resumen ejecutivo

| Severidad | Cantidad | Lente |
| --- | ---: | --- |
| Crítica | 0 | — |
| Alta | 1 | contrato de storage/configuración |
| Media | 1 | errores de proveedor |
| Baja | 0 | — |

AES-GCM usa sal/IV aleatorios, HMAC compara en tiempo constante, timeouts abortan y los deletes S3 devuelven receipts conservadores. Los hallazgos son fallas de configuración/proveedor sin traducción tipada en sus bordes.

## 3. Mapa de la unidad

| Área | Rol | Evidencia |
| --- | --- | --- |
| Cripto | AES-256-GCM y HMAC | `secret-cipher.ts:20-108`, `webhook-signature.ts:37-72` |
| Resiliencia | timeout, retry, circuito, mamparo | `resilience/with-timeout.ts`, `resilience/retry.ts` |
| Runtime | logs y salida ante fallo fatal | `runtime/process-guards.ts:56-132` |
| Storage | disco/S3, lifecycle/publicación | `storage/file-storage.module.ts`, adaptadores |
| Persistencia | campos de auditoría | `persistence/audit-fields.ts` |

No se revisó el dueño de cada archivo de negocio; es responsabilidad de los módulos consumidores.

## 4. Hallazgos confirmados y plan

### CIF-01 — Alta — Configuración S3 faltante produce `Error` genérico en la primera operación

**Evidencia y veredicto.** El schema permite bucket vacío ([`storage.env.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/storage/storage.env.ts#L18-L30)) y `S3FileStorageAdapter.assertConfigured` lanza `Error` si falta ([`s3-file-storage.adapter.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/storage/s3-file-storage.adapter.ts#L308-L313)). El módulo selecciona el adaptador por entorno ([`file-storage.module.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/storage/file-storage.module.ts#L14-L30)). Es correcto no operar sin bucket, pero la validación llega al primer uso y no tiene code/reason; un endpoint sólo deja un 500 saneado.

**Plan.** 1. Hacer condicional el schema: adapter S3 exige bucket, endpoint y las credenciales del modo elegido. 2. Validar en bootstrap/fábrica. 3. Convertir falla operativa a error tipado seguro. 4. Añadir readiness de storage si el producto lo requiere. Riesgo: instalaciones IAM sin credencial estática; acordar modo explícito. Sin DDL.

| Caso | Tipo / spec propuesto | Preparación e entrada exacta | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | unit `storage.env.spec.ts` | adapter S3 y bucket sintético válido | configuración aceptada |
| Límite | unit | credenciales vacías con IAM explícito | acepta sólo modo documentado |
| Error | unit/bootstrap | adapter S3, bucket vacío | aborta antes de servir rutas |
| Falla catalogada | integración readiness | fixture inválido | **503**, `DEPENDENCY_UNAVAILABLE`, reason seguro acordado |

### CIF-02 — Media — Respuestas S3 anómalas se relanzan como `Error`/driver sin clasificación

**Evidencia y veredicto.** Una lectura con `Body` vacío construye `Error` y los demás errores no-404 se loguean y relanzan ([`s3-file-storage.adapter.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/storage/s3-file-storage.adapter.ts#L218-L237)). Sólo 404 se vuelve `ResourceNotFoundException`. En cambio el delete responde `UNKNOWN`/`NOT_DELETED` ante incertidumbre ([líneas 274-305](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/storage/s3-file-storage.adapter.ts#L274-L305)), por lo que se refuta que declare éxito de borrado incierto.

**Impacto.** Caída, cuerpo truncado o timeout llegan como driver genérico. El filtro sanea pero no ofrece code/reason estable ni política de retry consistente.

**Plan.** 1. Introducir `StorageProviderUnavailable` y `StorageObjectInvalid` internos con causa para logs. 2. Mapear timeout/5xx/body vacío y conservar 404 como recurso ausente. 3. Reintentar sólo lecturas idempotentes con `AbortSignal`. 4. Traducir en borde HTTP sin bucket, key, endpoint ni error AWS. Sin DDL.

| Caso | Tipo / spec propuesto | Preparación e entrada exacta | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | unit `s3-file-storage.adapter.spec.ts` | `GetObject` con bytes | buffer exacto |
| Límite | unit | `HeadObject` 404 tras delete | receipt `DELETED` tras confirmación |
| Error | unit | `Body: undefined` o timeout sintético | error tipado y log sin credencial |
| Falla catalogada | e2e descarga | proveedor fixture 503 | **503**, `DEPENDENCY_UNAVAILABLE`, `STORAGE_PROVIDER_UNAVAILABLE` |

## 5. Matriz de pruebas de la unidad completa

| Superficie | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| Cifrado | cifra/descifra | IV/salt mínimo | tag corrupto | error seguro sin secreto |
| HMAC | firma válida | prefijo `sha256=` | firma inválida | rechazo de consumidor |
| Retry/timeout | operación idempotente | presupuesto exacto | cancelación/5xx | plazo/proveedor tipado |
| Storage local | hash y permit | competencia `wx` | URI ajena | `StorageLifecycleDenied` |
| Storage S3 | bucket/body válidos | delete confirmado | config/proveedor inválido | 503 code/reason seguro |
| Runtime | fatal con flush | timeout flush | rejected promise | salida 1 y log estructurado |

## 6. Catálogo de errores

Propuestos: `STORAGE_PROVIDER_UNAVAILABLE` y `STORAGE_CONFIGURATION_INVALID`, asociados a `503/DEPENDENCY_UNAVAILABLE` al cruzar un endpoint. `StorageLifecycleDenied` ya tiene razones de protocolo interno.

## 7. Dependencias y riesgos

Depende de schemas de entorno y de decidir IAM frente a credenciales estáticas. La traducción HTTP debe residir en consumidor/adaptador sin revelar bucket, key, endpoint ni secretos.

## 8. Olas y esfuerzo

| Ola | Hallazgo | Esfuerzo | Criterio de salida |
| --- | --- | --- | --- |
| 0 | CIF-01 | S | S3 inválido impide bootstrap y razón segura observable |
| 1 | CIF-02 | M | ramas S3 no-404 tipadas y cubiertas con dobles |

## 9. Trabajo pendiente de integrar

No se observó conexión S3 real. Contrastar con `fa74b78c` si el catálogo recibe nuevos reasons. Esta revisión no modifica configuración ni código.
