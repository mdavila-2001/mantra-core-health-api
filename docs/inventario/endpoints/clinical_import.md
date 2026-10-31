<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `clinical_import`

- **Bloque:** —
- **Operaciones:** 8 (0 en el contrato, 8 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 8
- **Tablas distintas que tocan:** 0
- **Respuestas de error y detalle contractual:** `openapi/endpoints/clinical-import.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/clinical-imports` | — | BAJO | 0 | SECURITY_ADMIN |
| 2 | POST | `/admin/clinical-imports` | Valida y previsualiza. No escribe nada en ninguna historia clínica. | BAJO | 0 | SECURITY_ADMIN |
| 3 | GET | `/admin/clinical-imports/{id}` | — | BAJO | 0 | SECURITY_ADMIN |
| 4 | POST | `/admin/clinical-imports/{id}/confirm` | — | BAJO | 0 | SECURITY_ADMIN |
| 5 | GET | `/admin/clinical-imports/{id}/loaded` | Qué agregó el lote y dónde: sólo identificadores. Leerlo queda auditado. | BAJO | 0 | SECURITY_ADMIN |
| 6 | GET | `/admin/clinical-imports/{id}/report` | El informe: sólo fila, resultado y motivo. Leerlo queda auditado. | BAJO | 0 | SECURITY_ADMIN |
| 7 | GET | `/admin/clinical-imports/catalog` | — | BAJO | 0 | SECURITY_ADMIN |
| 8 | GET | `/admin/clinical-imports/import-template` | T1: la plantilla del tipo, en CSV o JSON, generada del mismo esquema que valida. | BAJO | 0 | SECURITY_ADMIN |

---

## 1. GET /admin/clinical-imports

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalImportController.list` — `src/modules/clinical_import/clinical-import.controller.ts:145`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`GET /admin/clinical-imports` la atiende `ClinicalImportController.list` (src/modules/clinical_import/clinical-import.controller.ts:145). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ClinicalImportService.list`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_import/clinical-import.controller.ts:145` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | sin dato | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.BAD_REQUEST} |

El árbol de decisión completo está en [flujos](../flujos/clinical_import.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_import/clinical-import.controller.spec.ts:164` |

### Flujos

- clinical_import — etapa `ctrl:ClinicalImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /admin/clinical-imports

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Valida y previsualiza. No escribe nada en ninguna historia clínica.
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalImportController.create` — `src/modules/clinical_import/clinical-import.controller.ts:163`

### Qué es y para qué sirve (negocio)

Valida y previsualiza. No escribe nada en ninguna historia clínica.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/clinical-imports` la atiende `ClinicalImportController.create` (src/modules/clinical_import/clinical-import.controller.ts:163). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateClinicalImportDto` (4 campos, 1 obligatorio). Delega en `ClinicalImportService.create`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_import/clinical-import.controller.ts:163` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo — DTO `CreateClinicalImportDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `string` | Sí | longitud máxima 64 | `@IsString()` `@MaxLength(64)` | Tipo de registro (`hc-encuentro`, `hc-diagnostico`…) | `src/modules/clinical_import/clinical-import.dto.ts:16` |
| `sourceOrganization` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Organización de origen de los datos (1–200) | `src/modules/clinical_import/clinical-import.dto.ts:24` |
| `legalBasis` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Base legal que habilita la carga (3–500) | `src/modules/clinical_import/clinical-import.dto.ts:32` |
| `loadedAt` | `string` | No | longitud máxima 32 | `@IsOptional()` `@IsString()` `@MaxLength(32)` | Fecha de la carga AAAA-MM-DD, de hoy o anterior | `src/modules/clinical_import/clinical-import.dto.ts:40` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "kind": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "kind": "valor-ejemplo",
  "sourceOrganization": "valor-ejemplo",
  "legalBasis": "valor-ejemplo",
  "loadedAt": "valor-ejemplo"
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.CREATED`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportError: BAD_REQUEST; ImportError: NOT_FOUND; ImportError: PAYLOAD_TOO_LARGE |

El árbol de decisión completo está en [flujos](../flujos/clinical_import.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- clinical_import — etapa `ctrl:ClinicalImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /admin/clinical-imports/{id}

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalImportController.get` — `src/modules/clinical_import/clinical-import.controller.ts:241`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`GET /admin/clinical-imports/{id}` la atiende `ClinicalImportController.get` (src/modules/clinical_import/clinical-import.controller.ts:241). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ClinicalImportService.get`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_import/clinical-import.controller.ts:241` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_import/clinical-import.controller.ts:241` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportError: NOT_FOUND |

El árbol de decisión completo está en [flujos](../flujos/clinical_import.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_import/clinical-import.controller.spec.ts:145` |

### Flujos

- clinical_import — etapa `ctrl:ClinicalImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /admin/clinical-imports/{id}/confirm

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalImportController.confirm` — `src/modules/clinical_import/clinical-import.controller.ts:220`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`POST /admin/clinical-imports/{id}/confirm` la atiende `ClinicalImportController.confirm` (src/modules/clinical_import/clinical-import.controller.ts:220). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ClinicalImportService.confirm`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_import/clinical-import.controller.ts:220` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_import/clinical-import.controller.ts:220` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `idempotency-key` | header | sin dato | `string \| undefined` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado` · HTTP `HttpStatus.ACCEPTED`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 202 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportError: BAD_REQUEST; ImportError: NOT_FOUND; ImportError: CONFLICT |

El árbol de decisión completo está en [flujos](../flujos/clinical_import.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- clinical_import — etapa `ctrl:ClinicalImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /admin/clinical-imports/{id}/loaded

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Qué agregó el lote y dónde: sólo identificadores. Leerlo queda auditado.
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalImportController.loaded` — `src/modules/clinical_import/clinical-import.controller.ts:274`

### Qué es y para qué sirve (negocio)

Qué agregó el lote y dónde: sólo identificadores. Leerlo queda auditado.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/clinical-imports/{id}/loaded` la atiende `ClinicalImportController.loaded` (src/modules/clinical_import/clinical-import.controller.ts:274). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ClinicalImportService.loaded`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_import/clinical-import.controller.ts:274` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_import/clinical-import.controller.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportError: NOT_FOUND; ImportError: CONFLICT |

El árbol de decisión completo está en [flujos](../flujos/clinical_import.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- clinical_import — etapa `ctrl:ClinicalImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /admin/clinical-imports/{id}/report

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** El informe: sólo fila, resultado y motivo. Leerlo queda auditado.
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalImportController.report` — `src/modules/clinical_import/clinical-import.controller.ts:248`

### Qué es y para qué sirve (negocio)

El informe: sólo fila, resultado y motivo. Leerlo queda auditado.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/clinical-imports/{id}/report` la atiende `ClinicalImportController.report` (src/modules/clinical_import/clinical-import.controller.ts:248). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ClinicalImportService.report`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_import/clinical-import.controller.ts:248` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_import/clinical-import.controller.ts:248` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `—` | query | sin dato | `ReportQueryDto` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<unknown>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportError: NOT_FOUND; ImportError: CONFLICT |

El árbol de decisión completo está en [flujos](../flujos/clinical_import.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- clinical_import — etapa `ctrl:ClinicalImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /admin/clinical-imports/catalog

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalImportController.catalog` — `src/modules/clinical_import/clinical-import.controller.ts:117`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`GET /admin/clinical-imports/catalog` la atiende `ClinicalImportController.catalog` (src/modules/clinical_import/clinical-import.controller.ts:117). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ClinicalImportService.catalog`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_import/clinical-import.controller.ts:117` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_import.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- clinical_import — etapa `ctrl:ClinicalImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /admin/clinical-imports/import-template

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** T1: la plantilla del tipo, en CSV o JSON, generada del mismo esquema que valida.
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalImportController.template` — `src/modules/clinical_import/clinical-import.controller.ts:126`

### Qué es y para qué sirve (negocio)

T1: la plantilla del tipo, en CSV o JSON, generada del mismo esquema que valida.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/clinical-imports/import-template` la atiende `ClinicalImportController.template` (src/modules/clinical_import/clinical-import.controller.ts:126). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ClinicalImportService.template`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_import/clinical-import.controller.ts:126` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `ImportTemplateQueryDto` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StreamableFile>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportError: BAD_REQUEST; ImportError: NOT_FOUND |

El árbol de decisión completo está en [flujos](../flujos/clinical_import.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- clinical_import — etapa `ctrl:ClinicalImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

