<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `admin-catalog`

- **Bloque:** —
- **Operaciones:** 15 (15 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 15
- **Tablas distintas que tocan:** 0
- **Respuestas de error y detalle contractual:** `openapi/endpoints/admin-catalog.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/admin/catalog/annotations/{id}/review` | Aprueba o rechaza la revisión vigente de una ficha | BAJO | 0 | sesión (sin roles) |
| 2 | GET | `/admin/catalog/coverage` | Cobertura del catálogo por dimensión, calculada por el servidor | BAJO | 0 | sesión (sin roles) |
| 3 | GET | `/admin/catalog/objects` | Objetos del catálogo, paginados por cursor | BAJO | 0 | sesión (sin roles) |
| 4 | GET | `/admin/catalog/objects/{id}` | Ficha técnica, observación, ficha curada, cobertura y gobierno de un objeto | BAJO | 0 | sesión (sin roles) |
| 5 | PUT | `/admin/catalog/objects/{id}/annotation` | Crea o edita la ficha de un objeto (con versión esperada) | BAJO | 0 | sesión (sin roles) |
| 6 | GET | `/admin/catalog/objects/{id}/changes` | Cambios que los escaneos detectaron en un objeto | BAJO | 0 | sesión (sin roles) |
| 7 | GET | `/admin/catalog/objects/{id}/columns` | Columnas observadas de un objeto, con su ficha si la tienen | BAJO | 0 | sesión (sin roles) |
| 8 | GET | `/admin/catalog/objects/{id}/evidence` | Evidencia enlazada a un objeto | BAJO | 0 | sesión (sin roles) |
| 9 | POST | `/admin/catalog/objects/{id}/evidence` | Enlaza evidencia a un objeto | BAJO | 0 | sesión (sin roles) |
| 10 | GET | `/admin/catalog/objects/{id}/history` | Revisiones y decisiones de la ficha de un objeto | BAJO | 0 | sesión (sin roles) |
| 11 | GET | `/admin/catalog/objects/{id}/impact` | Quién referencia a un objeto y a quién referencia, por claves foráneas observadas | BAJO | 0 | sesión (sin roles) |
| 12 | GET | `/admin/catalog/scans` | Escaneos, del más reciente al más antiguo | BAJO | 0 | sesión (sin roles) |
| 13 | POST | `/admin/catalog/scans` | Pide un escaneo de la base primaria (se ejecuta fuera de la petición) | BAJO | 0 | sesión (sin roles) |
| 14 | GET | `/admin/catalog/scans/{id}` | Un escaneo | BAJO | 0 | sesión (sin roles) |
| 15 | GET | `/admin/catalog/schemas` | Schemas observados, con cuántos objetos tienen ficha y cuántos están aprobados | BAJO | 0 | sesión (sin roles) |

---

## 1. POST /admin/catalog/annotations/{id}/review

- **Origen:** CONTRATO
- **Nombre:** Aprueba o rechaza la revisión vigente de una ficha
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Aprueba o rechaza la revisión vigente de una ficha.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/catalog/annotations/{id}/review`: handler no localizado en el código. Exige sesión; el controlador no declara roles. Valida el cuerpo como `ReviewInputDto` (3 campos, 2 obligatorios). No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo — DTO `ReviewInputDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: APPROVED, REJECTED | `@IsIn(['APPROVED', 'REJECTED'])` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:305` |
| `expectedRevisionNo` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | Revisión que se revisó (`currentRevisionNo`); si hay una más reciente, 409 | `src/modules/data_catalog/dto/catalog-request.dto.ts:314` |
| `comment` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Obligatorio, de al menos 10 caracteres, al rechazar | `src/modules/data_catalog/dto/catalog-request.dto.ts:323` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "APPROVED",
  "expectedRevisionNo": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "APPROVED",
  "expectedRevisionNo": 1,
  "comment": "valor-ejemplo"
}
```

</details>

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /admin/catalog/coverage

- **Origen:** CONTRATO
- **Nombre:** Cobertura del catálogo por dimensión, calculada por el servidor
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Cobertura del catálogo por dimensión, calculada por el servidor.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/coverage`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `schema` | query | No | `string` | Limita la cobertura a un schema |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /admin/catalog/objects

- **Origen:** CONTRATO
- **Nombre:** Objetos del catálogo, paginados por cursor
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Objetos del catálogo, paginados por cursor.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |
| `schema` | query | No | `string` | Schema de PostgreSQL |
| `kind` | query | No | `string` | — |
| `observationStatus` | query | No | `string` | — |
| `reviewStatus` | query | No | `string` | `NONE`: objetos sin ficha |
| `q` | query | No | `string` | Busca en `schema.objeto` y en el nombre de negocio |
| `missing` | query | No | `string` | Sólo los objetos a los que les falta ese dato de la ficha |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /admin/catalog/objects/{id}

- **Origen:** CONTRATO
- **Nombre:** Ficha técnica, observación, ficha curada, cobertura y gobierno de un objeto
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Ficha técnica, observación, ficha curada, cobertura y gobierno de un objeto.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. PUT /admin/catalog/objects/{id}/annotation

- **Origen:** CONTRATO
- **Nombre:** Crea o edita la ficha de un objeto (con versión esperada)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Crea o edita la ficha de un objeto (con versión esperada).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PUT /admin/catalog/objects/{id}/annotation`: handler no localizado en el código. Exige sesión; el controlador no declara roles. Valida el cuerpo como `AnnotationPatchDto` (23 campos, 1 obligatorio). No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo — DTO `AnnotationPatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expectedVersion` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | Versión de la ficha que se leyó (`version`); 0 para crearla. Si cambió, 409 | `src/modules/data_catalog/dto/catalog-request.dto.ts:166` |
| `submit` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Enviarla a revisión: exige propósito, razón de existir y grano de fila (o declararlos como preguntas abiertas) | `src/modules/data_catalog/dto/catalog-request.dto.ts:174` |
| `changeReason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:180` |
| `businessName` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:186` |
| `definition` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:191` |
| `purpose` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:196` |
| `existenceRationale` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:201` |
| `rowGrain` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:206` |
| `alternativesRationale` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:211` |
| `deletionImpact` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:216` |
| `businessOwner` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:221` |
| `dataSteward` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:226` |
| `technicalOwner` | `object` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:231` |
| `unit` | `object` | No | longitud máxima 100; admite null | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:236` |
| `valueDomain` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:241` |
| `nullSemantics` | `object` | No | longitud máxima 4000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(TEXTO)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:246` |
| `sensitivity` | `string` | No | valores: UNKNOWN, NONE, INTERNAL, PII, PHI, SECRET | `@IsOptional()` `@IsIn(SENSITIVITIES)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:251` |
| `consumers` | `array<string>` | No | longitud máxima 200; máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@IsString({ each: true })` `@MaxLength(200, { each: true })` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:259` |
| `openQuestions` | `array<OpenQuestionDto>` | No | máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => OpenQuestionDto)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:267` |
| `openQuestions[].field` | `string` | No | longitud máxima 60 | `@IsOptional()` `@IsString()` `@MaxLength(60)` | Campo de la ficha sobre el que es la pregunta | `src/modules/data_catalog/dto/catalog-request.dto.ts:132` |
| `openQuestions[].question` | `string` | No | longitud mínima 3; longitud máxima 500 | `@IsString()` `@MinLength(3)` `@MaxLength(500)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:138` |
| `openQuestions[].owner` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/data_catalog/dto/catalog-request.dto.ts:144` |
| `openQuestions[].dueDate` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Fecha ISO 8601 | `src/modules/data_catalog/dto/catalog-request.dto.ts:149` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "expectedVersion": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "expectedVersion": 1,
  "submit": true,
  "changeReason": "Texto descriptivo de ejemplo",
  "businessName": {},
  "definition": {},
  "purpose": {},
  "existenceRationale": {},
  "rowGrain": {},
  "alternativesRationale": {},
  "deletionImpact": {},
  "businessOwner": {},
  "dataSteward": {},
  "technicalOwner": {},
  "unit": {},
  "valueDomain": {},
  "nullSemantics": {},
  "sensitivity": "UNKNOWN",
  "consumers": [
    "valor-ejemplo"
  ],
  "openQuestions": [
    {
      "field": "valor-ejemplo",
      "question": "valor-ejemplo",
      "owner": "valor-ejemplo",
      "dueDate": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /admin/catalog/objects/{id}/changes

- **Origen:** CONTRATO
- **Nombre:** Cambios que los escaneos detectaron en un objeto
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Cambios que los escaneos detectaron en un objeto.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/changes`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /admin/catalog/objects/{id}/columns

- **Origen:** CONTRATO
- **Nombre:** Columnas observadas de un objeto, con su ficha si la tienen
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Columnas observadas de un objeto, con su ficha si la tienen.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/columns`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /admin/catalog/objects/{id}/evidence

- **Origen:** CONTRATO
- **Nombre:** Evidencia enlazada a un objeto
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Evidencia enlazada a un objeto.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/evidence`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /admin/catalog/objects/{id}/evidence

- **Origen:** CONTRATO
- **Nombre:** Enlaza evidencia a un objeto
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Enlaza evidencia a un objeto.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/catalog/objects/{id}/evidence`: handler no localizado en el código. Exige sesión; el controlador no declara roles. Valida el cuerpo como `DataCatalogEvidenceInputDto` (4 campos, 2 obligatorios). No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo — DTO `DataCatalogEvidenceInputDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `string` | Sí | valores: SCHEMA_COMMENT, VAULT_NOTE, MIGRATION, CODE_REFERENCE, OPENAPI, OWNER_STATEMENT, DOCUMENT | — | — | sin fuente |
| `reference` | `string` | Sí | longitud mínima 3; longitud máxima 2000 | — | Dónde está la evidencia: ruta, enlace, identificador | sin fuente |
| `excerpt` | `string` | No | longitud máxima 2000 | — | — | sin fuente |
| `sourceRevision` | `string` | No | longitud máxima 200 | — | Revisión del documento o commit de donde se tomó | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "kind": "SCHEMA_COMMENT",
  "reference": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "kind": "SCHEMA_COMMENT",
  "reference": "valor-ejemplo",
  "excerpt": "valor-ejemplo",
  "sourceRevision": "valor-ejemplo"
}
```

</details>

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. GET /admin/catalog/objects/{id}/history

- **Origen:** CONTRATO
- **Nombre:** Revisiones y decisiones de la ficha de un objeto
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Revisiones y decisiones de la ficha de un objeto.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/history`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. GET /admin/catalog/objects/{id}/impact

- **Origen:** CONTRATO
- **Nombre:** Quién referencia a un objeto y a quién referencia, por claves foráneas observadas
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Quién referencia a un objeto y a quién referencia, por claves foráneas observadas.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/objects/{id}/impact`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `direction` | query | No | `string` | `downstream`: quién referencia al objeto; `upstream`: a quién referencia |
| `depth` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. GET /admin/catalog/scans

- **Origen:** CONTRATO
- **Nombre:** Escaneos, del más reciente al más antiguo
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Escaneos, del más reciente al más antiguo.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/scans`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco de la página anterior (`nextCursor`) |
| `limit` | query | No | `number` | Filas por página |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /admin/catalog/scans

- **Origen:** CONTRATO
- **Nombre:** Pide un escaneo de la base primaria (se ejecuta fuera de la petición)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Pide un escaneo de la base primaria (se ejecuta fuera de la petición).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/catalog/scans`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CABECERA | Idempotency-Key (obligatoria) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `Idempotency-Key` | header | Sí | `string` | 8–128 caracteres; la misma clave del mismo usuario devuelve el escaneo ya aceptado |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. GET /admin/catalog/scans/{id}

- **Origen:** CONTRATO
- **Nombre:** Un escaneo
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Un escaneo.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/scans/{id}`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. GET /admin/catalog/schemas

- **Origen:** CONTRATO
- **Nombre:** Schemas observados, con cuántos objetos tienen ficha y cuántos están aprobados
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Schemas observados, con cuántos objetos tienen ficha y cuántos están aprobados.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/catalog/schemas`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/admin-catalog.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- admin-catalog — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

