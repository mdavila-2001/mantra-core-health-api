<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `terminology`

- **Bloque:** Núcleo y Terminología (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)
- **Operaciones:** 25 (25 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 2 · MEDIO 11 · BAJO 12
- **Tablas distintas que tocan:** 16
- **Respuestas de error y detalle contractual:** `openapi/endpoints/terminology.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/terminology/code-systems` | Sistemas de códigos registrados | BAJO | 1 | SECURITY_ADMIN |
| 2 | POST | `/terminology/code-systems` | UC-03-01: crea un sistema de códigos y su fuente | MEDIO | 4 | SECURITY_ADMIN |
| 3 | GET | `/terminology/code-systems/{id}/versions` | Versiones de un sistema de códigos | BAJO | 1 | SECURITY_ADMIN |
| 4 | POST | `/terminology/code-systems/{id}/versions` | UC-03-02: crea una versión (borrador) de un sistema de códigos | MEDIO | 3 | SECURITY_ADMIN |
| 5 | GET | `/terminology/CodeSystem/$lookup` | UC-03-11: resuelve un concepto por sistema y código | BAJO | 5 | sesión (sin roles) |
| 6 | POST | `/terminology/ConceptMap/$translate` | UC-03-09: cura o consulta un mapeo entre conceptos | ALTO | 4 | sesión (sin roles) |
| 7 | GET | `/terminology/concepts` | UC-03-13: busca conceptos por código/denominación, o resuelve ids a etiqueta | BAJO | 7 | sesión (sin roles) |
| 8 | GET | `/terminology/concepts/{conceptId}` | Lee la ficha de un concepto: textos en el idioma pedido, conjuntos de valores a los que pertenece y denominaciones alternativas | BAJO | 7 | sesión (sin roles) |
| 9 | POST | `/terminology/concepts/{conceptId}/$deprecate` | UC-03-10: retira el concepto y lo excluye de las expansiones | MEDIO | 4 | SECURITY_ADMIN |
| 10 | POST | `/terminology/concepts/{conceptId}/designations` | UC-03-05: añade una designación (y opcionalmente propiedades) | MEDIO | 5 | SECURITY_ADMIN |
| 11 | GET | `/terminology/concepts/{conceptId}/glossary-article` | Lee el artículo enciclopédico de un término del glosario | BAJO | 1 | sesión (sin roles) |
| 12 | GET | `/terminology/concepts/{conceptId}/glossary-neighborhood` | Lee el vecindario de un término del glosario: relaciones salientes y entrantes agrupadas por tipo | BAJO | 8 | sesión (sin roles) |
| 13 | POST | `/terminology/concepts/{conceptId}/properties` | UC-03-05: alta o actualización de propiedades del concepto | MEDIO | 4 | SECURITY_ADMIN |
| 14 | POST | `/terminology/concepts/{conceptId}/relationships` | UC-03-06: crea una relación dirigida entre conceptos | MEDIO | 3 | SECURITY_ADMIN |
| 15 | GET | `/terminology/concepts/glossary-graph` | Lee el grafo de términos publicados del glosario médico | BAJO | 7 | sesión (sin roles) |
| 16 | GET | `/terminology/import-template` | UC-03-03: descarga la plantilla de importación de un perfil | BAJO | 0 | SECURITY_ADMIN |
| 17 | PUT | `/terminology/tenants/{tenantId}/catalog-policies` | UC-03-12: define la política de catálogo del tenant | MEDIO | 8 | SECURITY_ADMIN |
| 18 | GET | `/terminology/value-sets` | Listar conjuntos de valores por código interno o texto | BAJO | 3 | pública |
| 19 | POST | `/terminology/value-sets` | UC-03-07: crea un conjunto de valores con versión y reglas | MEDIO | 4 | SECURITY_ADMIN |
| 20 | GET | `/terminology/value-sets/{id}/$expand` | UC-03-08: lee la expansión vigente de un conjunto de valores | BAJO | 5 | pública |
| 21 | GET | `/terminology/value-sets/$glossary-facets` | Facetas del glosario: conteo por categoría y etiqueta | BAJO | 5 | pública |
| 22 | POST | `/terminology/ValueSet/{id}/$expand` | UC-03-08: materializa los miembros de la expansión | ALTO | 10 | SECURITY_ADMIN |
| 23 | POST | `/terminology/versions/{versionId}/import` | UC-03-03: importa conceptos en una versión en borrador | MEDIO | 3 | SECURITY_ADMIN |
| 24 | POST | `/terminology/versions/{versionId}/import-file` | UC-03-03: importa filas desde un archivo, o las valida sin escribir | MEDIO | 7 | SECURITY_ADMIN |
| 25 | POST | `/terminology/versions/{versionId}/publish` | UC-03-04: publica una versión (borrador → activa) | MEDIO | 4 | SECURITY_ADMIN |

---

## 1. GET /terminology/code-systems

- **Origen:** CONTRATO
- **Nombre:** Sistemas de códigos registrados
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyCodeSystemsController.listCodeSystems` — `src/modules/terminology/controllers/terminology-code-systems.controller.ts:56`

### Qué es y para qué sirve (negocio)

Sistemas de códigos registrados. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /terminology/code-systems` la atiende `TerminologyCodeSystemsController.listCodeSystems` (src/modules/terminology/controllers/terminology-code-systems.controller.ts:56). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `CodeSystemsReadService.listCodeSystems`. Lee terminology.code_systems.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-code-systems.controller.ts:56` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.code_systems` | LEE | LEE | DIRECTA | TerminologyCodeSystemsController.listCodeSystems → CodeSystemsReadService.listCodeSystems | `src/modules/terminology/services/code-systems-read.service.ts:58` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListCodeSystemsResponseDto>` · DTO `ListCodeSystemsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CodeSystemListItemDto>` | Sí | — | — | Los sistemas registrados. | `src/modules/terminology/dto/code-systems-read.dto.ts:26` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del sistema. | `src/modules/terminology/dto/code-systems-read.dto.ts:7` |
| `items[].internalCode` | `string` | Sí | — | — | Código interno | `src/modules/terminology/dto/code-systems-read.dto.ts:11` |
| `items[].name` | `string` | Sí | — | — | Nombre del sistema de codificación | `src/modules/terminology/dto/code-systems-read.dto.ts:15` |
| `items[].canonicalUrl` | `string` | Sí | — | — | URL canónica del sistema | `src/modules/terminology/dto/code-systems-read.dto.ts:19` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/terminology/controllers/terminology-code-systems.controller.spec.ts:63` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyCodeSystemsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /terminology/code-systems

- **Origen:** CONTRATO
- **Nombre:** UC-03-01: crea un sistema de códigos y su fuente
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyCodeSystemsController.createCodeSystem` — `src/modules/terminology/controllers/terminology-code-systems.controller.ts:88`

### Qué es y para qué sirve (negocio)

UC-03-01: crea un sistema de códigos y su fuente. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /terminology/code-systems` la atiende `TerminologyCodeSystemsController.createCodeSystem` (src/modules/terminology/controllers/terminology-code-systems.controller.ts:88). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateCodeSystemDto` (5 campos, 5 obligatorios). Delega en `CodeSystemsService.createCodeSystem`. Crea filas en terminology.code_systems, terminology.terminology_sources. Lee terminology.code_systems, terminology.terminology_sources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-code-systems.controller.ts:88` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.code_systems` | ESCRIBE | CREA | DIRECTA | TerminologyCodeSystemsController.createCodeSystem → CodeSystemsService.createCodeSystem → CodeSystemsRepository.create | `src/modules/terminology/repositories/code-systems.repository.ts:73` |
| `terminology.code_systems` | LEE | LEE | DIRECTA | TerminologyCodeSystemsController.createCodeSystem → CodeSystemsService.createCodeSystem → CodeSystemsRepository.findByInternalCode | `src/modules/terminology/repositories/code-systems.repository.ts:56` |
| `terminology.terminology_sources` | ESCRIBE | CREA | DIRECTA | TerminologyCodeSystemsController.createCodeSystem → CodeSystemsService.createCodeSystem → TerminologySourcesRepository.create | `src/modules/terminology/repositories/terminology-sources.repository.ts:52` |
| `terminology.terminology_sources` | LEE | LEE | DIRECTA | TerminologyCodeSystemsController.createCodeSystem → CodeSystemsService.createCodeSystem → TerminologySourcesRepository.findByCode | `src/modules/terminology/repositories/terminology-sources.repository.ts:44` |

### Cuerpo — DTO `CreateCodeSystemDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `internalCode` | `string` | Sí | longitud mínima 1; longitud máxima 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | Código interno único del sistema de códigos | `src/modules/terminology/dto/create-code-system.dto.ts:20` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | Nombre legible del sistema de códigos | `src/modules/terminology/dto/create-code-system.dto.ts:32` |
| `canonicalUrl` | `string` | Sí | longitud mínima 1 | `@IsString()` `@IsNotEmpty()` | URL canónica FHIR del sistema de códigos | `src/modules/terminology/dto/create-code-system.dto.ts:40` |
| `sourceCode` | `string` | Sí | longitud mínima 1; longitud máxima 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | Código de negocio de la fuente que publica el sistema | `src/modules/terminology/dto/create-code-system.dto.ts:52` |
| `sourceName` | `string` | Sí | longitud mínima 1; longitud máxima 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | Nombre de la fuente que publica el sistema | `src/modules/terminology/dto/create-code-system.dto.ts:64` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "internalCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "canonicalUrl": "valor-ejemplo",
  "sourceCode": "CODIGO_EJEMPLO",
  "sourceName": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "internalCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "canonicalUrl": "valor-ejemplo",
  "sourceCode": "CODIGO_EJEMPLO",
  "sourceName": "Nombre de ejemplo"
}
```

</details>

### Respuesta — `Promise<CodeSystemResponseDto>` · DTO `CodeSystemResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id del sistema de códigos creado | `src/modules/terminology/dto/create-code-system.dto.ts:73` |
| `internalCode` | `string` | Sí | — | — | Código interno del sistema de códigos | `src/modules/terminology/dto/create-code-system.dto.ts:79` |
| `sourceId` | `string` | Sí | — | — | Id de la fuente (creada o reutilizada) | `src/modules/terminology/dto/create-code-system.dto.ts:85` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un sistema de códigos con ese código interno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/terminology/concept-file-import.int-spec.ts:71` |
| INTEGRACION | `test/integration/terminology.int-spec.ts:43` |
| CONTROLADOR | `src/modules/terminology/controllers/terminology-code-systems.controller.spec.ts:40` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyCodeSystemsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /terminology/code-systems/{id}/versions

- **Origen:** CONTRATO
- **Nombre:** Versiones de un sistema de códigos
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyCodeSystemsController.listVersions` — `src/modules/terminology/controllers/terminology-code-systems.controller.ts:72`

### Qué es y para qué sirve (negocio)

Versiones de un sistema de códigos. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /terminology/code-systems/{id}/versions` la atiende `TerminologyCodeSystemsController.listVersions` (src/modules/terminology/controllers/terminology-code-systems.controller.ts:72). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `CodeSystemsReadService.listVersions`. Lee terminology.code_system_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-code-systems.controller.ts:72` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/terminology/controllers/terminology-code-systems.controller.ts:72` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.code_system_versions` | LEE | LEE | DIRECTA | TerminologyCodeSystemsController.listVersions → CodeSystemsReadService.listVersions | `src/modules/terminology/services/code-systems-read.service.ts:84` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListCodeSystemVersionsResponseDto>` · DTO `ListCodeSystemVersionsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CodeSystemVersionListItemDto>` | Sí | — | — | Las versiones del sistema. | `src/modules/terminology/dto/code-systems-read.dto.ts:69` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la versión. | `src/modules/terminology/dto/code-systems-read.dto.ts:33` |
| `items[].version` | `string` | Sí | — | — | Versión | `src/modules/terminology/dto/code-systems-read.dto.ts:37` |
| `items[].state` | `string` | Sí | valores: DRAFT, ACTIVE, RETIRED, DEPRECATED, UNKNOWN | — | Estado, en palabra. `UNKNOWN` es el caso real de las versiones que dejaron los importadores externos sin fijar estado: no es un error, y admiten conceptos igual. `RETIRED` y `DEPRECATED` se nombran aparte porque **no** los admiten, y agruparlos bajo `UNKNOWN` los hacía pasar por el caso que sí. | `src/modules/terminology/dto/code-systems-read.dto.ts:50` |
| `items[].isDefault` | `boolean` | Sí | — | — | Si es la versión por defecto | `src/modules/terminology/dto/code-systems-read.dto.ts:54` |
| `items[].publishedAt` | `string` | Sí | formato date-time; admite null | — | Cuándo se publicó, si se publicó. | `src/modules/terminology/dto/code-systems-read.dto.ts:58` |
| `items[].acceptsConcepts` | `boolean` | Sí | — | — | Si se le pueden importar conceptos | `src/modules/terminology/dto/code-systems-read.dto.ts:62` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/terminology/controllers/terminology-code-systems.controller.spec.ts:74` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyCodeSystemsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /terminology/code-systems/{id}/versions

- **Origen:** CONTRATO
- **Nombre:** UC-03-02: crea una versión (borrador) de un sistema de códigos
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyCodeSystemsController.createVersion` — `src/modules/terminology/controllers/terminology-code-systems.controller.ts:112`

### Qué es y para qué sirve (negocio)

UC-03-02: crea una versión (borrador) de un sistema de códigos. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /terminology/code-systems/{id}/versions` la atiende `TerminologyCodeSystemsController.createVersion` (src/modules/terminology/controllers/terminology-code-systems.controller.ts:112). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateCodeSystemVersionDto` (2 campos, 1 obligatorio). Delega en `CodeSystemsService.createVersion`. Crea filas en terminology.code_system_versions. Lee terminology.code_system_versions, terminology.code_systems.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-code-systems.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/terminology/controllers/terminology-code-systems.controller.ts:112` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.code_system_versions` | ESCRIBE | CREA | DIRECTA | TerminologyCodeSystemsController.createVersion → CodeSystemsService.createVersion → CodeSystemVersionsRepository.create | `src/modules/terminology/repositories/code-system-versions.repository.ts:77` |
| `terminology.code_system_versions` | LEE | LEE | DIRECTA | TerminologyCodeSystemsController.createVersion → CodeSystemsService.createVersion → CodeSystemVersionsRepository.findByCodeSystemAndVersion | `src/modules/terminology/repositories/code-system-versions.repository.ts:49` |
| `terminology.code_systems` | LEE | LEE | DIRECTA | TerminologyCodeSystemsController.createVersion → CodeSystemsService.createVersion → CodeSystemsRepository.findById | `src/modules/terminology/repositories/code-systems.repository.ts:48` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateCodeSystemVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `version` | `string` | Sí | longitud mínima 1; longitud máxima 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | Etiqueta de versión (p. ej. 1.0.0) | `src/modules/terminology/dto/create-code-system-version.dto.ts:22` |
| `isDefault` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca la versión como predeterminada | `src/modules/terminology/dto/create-code-system-version.dto.ts:30` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "version": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "version": "valor-ejemplo",
  "isDefault": true
}
```

</details>

### Respuesta — `Promise<CodeSystemVersionResponseDto>` · DTO `CodeSystemVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id de la versión creada | `src/modules/terminology/dto/create-code-system-version.dto.ts:39` |
| `version` | `string` | Sí | — | — | Etiqueta de versión | `src/modules/terminology/dto/create-code-system-version.dto.ts:45` |
| `state` | `string` | Sí | — | — | Estado del ciclo de vida (código de concepto) | `src/modules/terminology/dto/create-code-system-version.dto.ts:51` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sistema de códigos no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe esa versión para el sistema de códigos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/terminology/concept-file-import.int-spec.ts:83` |
| INTEGRACION | `test/integration/terminology.int-spec.ts:73` |
| CONTROLADOR | `src/modules/terminology/controllers/terminology-code-systems.controller.spec.ts:52` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyCodeSystemsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /terminology/CodeSystem/$lookup

- **Origen:** CONTRATO
- **Nombre:** UC-03-11: resuelve un concepto por sistema y código
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyFhirController.lookup` — `src/modules/terminology/controllers/terminology-fhir.controller.ts:122`

### Qué es y para qué sirve (negocio)

UC-03-11: resuelve un concepto por sistema y código. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /terminology/CodeSystem/$lookup` la atiende `TerminologyFhirController.lookup` (src/modules/terminology/controllers/terminology-fhir.controller.ts:122). Exige sesión; el controlador no declara roles. Delega en `ConceptsService.lookupConcept`. Lee terminology.catalog_concepts, terminology.code_system_versions, terminology.code_systems, terminology.concept_designations, terminology.concept_properties.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/terminology/controllers/terminology-fhir.controller.ts:122` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_QUERY | system (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | code (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyFhirController.lookup → ConceptsService.lookupConcept → CatalogConceptsRepository.findByVersionAndCode | `src/modules/terminology/repositories/catalog-concepts.repository.ts:139` |
| `terminology.code_system_versions` | LEE | LEE | DIRECTA | TerminologyFhirController.lookup → ConceptsService.lookupConcept → CodeSystemVersionsRepository.findDefaultActiveVersion | `src/modules/terminology/repositories/code-system-versions.repository.ts:65` |
| `terminology.code_systems` | LEE | LEE | DIRECTA | TerminologyFhirController.lookup → ConceptsService.lookupConcept → CodeSystemsRepository.findByCanonicalUrl | `src/modules/terminology/repositories/code-systems.repository.ts:68` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | TerminologyFhirController.lookup → ConceptsService.lookupConcept → ConceptDesignationsRepository.findByConcept | `src/modules/terminology/repositories/concept-designations.repository.ts:127` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | TerminologyFhirController.lookup → ConceptsService.lookupConcept → ConceptDesignationsRepository.findPropertiesByConcept | `src/modules/terminology/repositories/concept-designations.repository.ts:147` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `system` | query | Sí | `string` | URL canónica del sistema de códigos |
| `code` | query | Sí | `string` | Código dentro del sistema |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LookupResponseDto>` · DTO `LookupResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `conceptId` | `string` | Sí | — | — | Id del concepto resuelto | `src/modules/terminology/dto/concept-properties.dto.ts:188` |
| `code` | `string` | Sí | — | — | Código dentro del sistema | `src/modules/terminology/dto/concept-properties.dto.ts:194` |
| `display` | `string` | Sí | — | — | Denominación principal | `src/modules/terminology/dto/concept-properties.dto.ts:200` |
| `definition` | `string` | No | — | — | Definición del concepto | `src/modules/terminology/dto/concept-properties.dto.ts:206` |
| `selectable` | `boolean` | No | — | — | Si el concepto puede seleccionarse | `src/modules/terminology/dto/concept-properties.dto.ts:212` |
| `stateConceptId` | `string` | No | — | — | Estado del concepto | `src/modules/terminology/dto/concept-properties.dto.ts:218` |
| `designations` | `array<LookupDesignationDto>` | Sí | — | — | Designaciones multilingües | `src/modules/terminology/dto/concept-properties.dto.ts:227` |
| `designations[].value` | `string` | Sí | — | — | Texto de la designación | `src/modules/terminology/dto/concept-properties.dto.ts:109` |
| `designations[].languageConceptId` | `string` | No | — | — | Idioma (concepto) | `src/modules/terminology/dto/concept-properties.dto.ts:115` |
| `designations[].preferred` | `boolean` | No | — | — | Si es la designación preferida de su idioma | `src/modules/terminology/dto/concept-properties.dto.ts:123` |
| `properties` | `array<LookupPropertyDto>` | Sí | — | — | Propiedades del concepto | `src/modules/terminology/dto/concept-properties.dto.ts:236` |
| `properties[].propertyCode` | `string` | Sí | — | — | Código de la propiedad | `src/modules/terminology/dto/concept-properties.dto.ts:156` |
| `properties[].dataType` | `string` | No | — | — | Tipo de dato técnico | `src/modules/terminology/dto/concept-properties.dto.ts:162` |
| `properties[].valueJson` | `object` | Sí | — | — | Valor de la propiedad | `src/modules/terminology/dto/concept-properties.dto.ts:168` |
| `properties[].sourceAge` | `PropertySourceAgeDto` | No | — | — | Antigüedad del dato (estado S7). Solo en las secciones de farmacología clínica. known=false: antigüedad desconocida | `src/modules/terminology/dto/concept-properties.dto.ts:179` |
| `properties[].sourceAge.known` | `boolean` | No | — | — | Falso si la fuente no publica la fecha de la versión (p. ej. fichas de CIMA de autorización centralizada): la antigüedad es desconocida y la fecha que vale es la de consulta | `src/modules/terminology/dto/concept-properties.dto.ts:135` |
| `properties[].sourceAge.sourceDate` | `string` | No | — | — | Fecha de la versión de la fuente tal como se cargó (ISO, o mm/aaaa en las fichas de CIMA que solo la traen en el texto). Solo si known es verdadero | `src/modules/terminology/dto/concept-properties.dto.ts:141` |
| `properties[].sourceAge.retrievedAt` | `string` | No | formato date-time | — | Cuándo se consultó la fuente | `src/modules/terminology/dto/concept-properties.dto.ts:147` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; BadRequestException: $lookup exige los parámetros system y code |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sistema de códigos no encontrado; ResourceNotFoundException: El sistema de códigos no tiene versión vigente publicada; ResourceNotFoundException: Código no encontrado en la versión vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/terminology/controllers/terminology-fhir.controller.spec.ts:68` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyFhirController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /terminology/ConceptMap/$translate

- **Origen:** CONTRATO
- **Nombre:** UC-03-09: cura o consulta un mapeo entre conceptos
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyFhirController.translate` — `src/modules/terminology/controllers/terminology-fhir.controller.ts:97`

### Qué es y para qué sirve (negocio)

UC-03-09: cura o consulta un mapeo entre conceptos. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /terminology/ConceptMap/$translate` la atiende `TerminologyFhirController.translate` (src/modules/terminology/controllers/terminology-fhir.controller.ts:97). Exige sesión; el controlador no declara roles. Valida el cuerpo como `TranslateConceptDto` (5 campos, 1 obligatorio). Delega en `ConceptMapsService.translate`. Crea filas en terminology.concept_maps. Actualiza terminology.concept_maps. Lee terminology.catalog_concepts, terminology.concept_maps.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/terminology/controllers/terminology-fhir.controller.ts:97` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyFhirController.translate → ConceptMapsService.translate → ConceptMapsService.curate → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:75` |
| `terminology.concept_maps` | ESCRIBE | ACTUALIZA | POR_TIPO | TerminologyFhirController.translate → ConceptMapsService.translate → ConceptMapsService.curate | `src/modules/terminology/services/concept-maps.service.ts:180` |
| `terminology.concept_maps` | ESCRIBE | CREA | DIRECTA | TerminologyFhirController.translate → ConceptMapsService.translate → ConceptMapsService.curate → ConceptMapsRepository.create | `src/modules/terminology/repositories/concept-maps.repository.ts:100` |
| `terminology.concept_maps` | LEE | LEE | DIRECTA | TerminologyFhirController.translate → ConceptMapsService.translate → ConceptMapsService.curate → ConceptMapsRepository.findEquivalent | `src/modules/terminology/repositories/concept-maps.repository.ts:59` |

### Cuerpo — DTO `TranslateConceptDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sourceConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto de origen | `src/modules/terminology/dto/translate-concept.dto.ts:30` |
| `targetConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de destino. Si se envía, la llamada cura el mapeo. | `src/modules/terminology/dto/translate-concept.dto.ts:41` |
| `equivalence` | `string` | No | valores: EQUIVALENT, WIDER, NARROWER, INEXACT, UNMATCHED | `@IsOptional()` `@IsIn(EQUIVALENCES)` | Equivalencia del mapeo; obligatoria al curar | `src/modules/terminology/dto/translate-concept.dto.ts:52` |
| `context` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Contexto del mapeo | `src/modules/terminology/dto/translate-concept.dto.ts:61` |
| `version` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | Versión del mapeo | `src/modules/terminology/dto/translate-concept.dto.ts:70` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "sourceConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "sourceConceptId": "00000000-0000-4000-8000-000000000001",
  "targetConceptId": "00000000-0000-4000-8000-000000000001",
  "equivalence": "EQUIVALENT",
  "context": "valor-ejemplo",
  "version": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<TranslateResponseDto>` · DTO `TranslateResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sourceConceptId` | `string` | Sí | — | — | Concepto de origen | `src/modules/terminology/dto/translate-concept.dto.ts:106` |
| `matched` | `boolean` | Sí | — | — | Verdadero si hay al menos una traducción | `src/modules/terminology/dto/translate-concept.dto.ts:112` |
| `matches` | `array<TranslationMatchDto>` | Sí | — | — | Traducciones encontradas | `src/modules/terminology/dto/translate-concept.dto.ts:121` |
| `matches[].conceptMapId` | `string` | Sí | — | — | Id del mapeo | `src/modules/terminology/dto/translate-concept.dto.ts:79` |
| `matches[].targetConceptId` | `string` | Sí | — | — | Concepto de destino | `src/modules/terminology/dto/translate-concept.dto.ts:85` |
| `matches[].equivalenceConceptId` | `string` | No | — | — | Equivalencia (concepto) | `src/modules/terminology/dto/translate-concept.dto.ts:91` |
| `matches[].context` | `string` | No | — | — | Contexto del mapeo | `src/modules/terminology/dto/translate-concept.dto.ts:97` |
| `curated` | `boolean` | Sí | — | — | Verdadero si la llamada curó un mapeo en vez de sólo consultar | `src/modules/terminology/dto/translate-concept.dto.ts:130` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Curar un mapeo exige un rol de terminología |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Concepto origen no encontrado; ResourceNotFoundException: Concepto destino no encontrado; ResourceNotFoundException: El mapeo dejó de existir durante el curado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Curar un mapeo exige declarar la equivalencia; PreconditionFailedException: Un concepto no puede mapearse a sí mismo; PreconditionFailedException: Los conceptos del mapeo tienen que estar activos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/terminology/controllers/terminology-fhir.controller.spec.ts:57` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyFhirController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /terminology/concepts

- **Origen:** CONTRATO
- **Nombre:** UC-03-13: busca conceptos por código/denominación, o resuelve ids a etiqueta
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyConceptsController.searchConcepts` — `src/modules/terminology/controllers/terminology-concepts.controller.ts:153`

### Qué es y para qué sirve (negocio)

UC-03-13: busca conceptos por código/denominación, o resuelve ids a etiqueta. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /terminology/concepts` la atiende `TerminologyConceptsController.searchConcepts` (src/modules/terminology/controllers/terminology-concepts.controller.ts:153). Exige sesión; el controlador no declara roles. Delega en `ConceptsService.searchConcepts`. Lee terminology.catalog_concepts, terminology.concept_designations, terminology.concept_properties, terminology.concept_relationships, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/terminology/controllers/terminology-concepts.controller.ts:153` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyConceptsController.searchConcepts → ConceptsService.searchConcepts → CatalogConceptsRepository.search | `src/modules/terminology/repositories/catalog-concepts.repository.ts:257` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | TerminologyConceptsController.searchConcepts → ConceptsService.searchConcepts → ConceptsService.buildSearchItems → ConceptsService.resolveTexts → ConceptDesignationsRepository.findPreferredByLanguageForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:176` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | TerminologyConceptsController.searchConcepts → ConceptsService.searchConcepts → ConceptsService.buildSearchItems → ConceptDesignationsRepository.findPropertyForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:200` |
| `terminology.concept_relationships` | LEE | LEE | DIRECTA | TerminologyConceptsController.searchConcepts → ConceptsService.searchConcepts → ConceptsService.buildSearchItems → ConceptsService.resolveGlossaryRelations → ConceptRelationshipsRepository.findByTypesForSources | `src/modules/terminology/repositories/concept-relationships.repository.ts:132` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | TerminologyConceptsController.searchConcepts → ConceptsService.searchConcepts → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | TerminologyConceptsController.searchConcepts → ConceptsService.searchConcepts → ConceptsService.searchGlossaryPage → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | TerminologyConceptsController.searchConcepts → ConceptsService.searchConcepts → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | No | `string` | Texto a buscar en el código o la denominación |
| `codeSystemVersionId` | query | No | `string` | Acota la búsqueda a una versión de sistema de códigos |
| `limit` | query | No | `number` | Tope de resultados (por defecto 50) |
| `ids` | query | No | `array<string>` | Ids de concepto a resolver, separados por coma (máx. 200). Es la vía para traducir a etiqueta los `*ConceptId` que devuelve el resto del contrato |
| `lang` | query | No | `string` | Idioma preferido de `display` y `definition`. Sin este parámetro la respuesta es idéntica a la histórica; con él, los conceptos sin designación en ese idioma vuelven con su texto original y `translated: false` |
| `includeValueSets` | query | No | `string` | Añade a cada concepto los conjuntos de valores a los que pertenece — el camino inverso al de `$expand` |
| `valueSetId` | query | No | `string` | Acota a los conceptos de ese conjunto de valores. Es «navegar por categoría»: se combina con `q` y devuelve lo mismo que la búsqueda, no los miembros crudos de `$expand` |
| `tagValueSetId` | query | No | `string` | Sólo glosario: además de `valueSetId`, el término tiene que llevar esta etiqueta (intersección) |
| `offset` | query | No | `string` | Sólo glosario: cuántos términos saltear. La respuesta trae `total` para armar la paginación |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SearchConceptsResponseDto>` · DTO `SearchConceptsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ConceptSearchItemDto>` | Sí | — | — | Conceptos que casan con el filtro. | `src/modules/terminology/dto/search-concepts.dto.ts:476` |
| `items[].conceptId` | `string` | Sí | formato uuid | — | Valor a enviar en los campos `*ConceptId` del contrato | `src/modules/terminology/dto/search-concepts.dto.ts:16` |
| `items[].code` | `string` | Sí | — | — | Código del concepto | `src/modules/terminology/dto/search-concepts.dto.ts:22` |
| `items[].display` | `string` | Sí | — | — | Denominación principal | `src/modules/terminology/dto/search-concepts.dto.ts:28` |
| `items[].definition` | `string` | No | — | — | Definición del concepto | `src/modules/terminology/dto/search-concepts.dto.ts:34` |
| `items[].selectable` | `boolean` | No | — | — | Si el concepto puede seleccionarse | `src/modules/terminology/dto/search-concepts.dto.ts:40` |
| `items[].codeSystemVersionId` | `string` | Sí | formato uuid | — | Versión del sistema de códigos | `src/modules/terminology/dto/search-concepts.dto.ts:49` |
| `items[].translated` | `boolean` | No | — | — | Si los textos vienen en el idioma pedido. `false` significa que se devolvió el original del sistema de codificación porque falta la designación | `src/modules/terminology/dto/search-concepts.dto.ts:70` |
| `items[].valueSets` | `array<ConceptValueSetRefDto>` | No | — | — | Conjuntos de valores a los que pertenece el concepto. Sólo se informa con `includeValueSets=true`. Son las categorías bajo las cuales el término tiene sentido —«Diagnóstico», «Severidad», «Vía de administración»— y es lo que el glosario pinta como etiquetas. | `src/modules/terminology/dto/search-concepts.dto.ts:80` |
| `items[].valueSets[].id` | `string` | No | formato uuid | — | Identificador del conjunto de valores. | `src/modules/terminology/dto/search-concepts.dto.ts:138` |
| `items[].valueSets[].internalCode` | `string` | No | — | — | Código interno estable, como `condition-severity`. | `src/modules/terminology/dto/search-concepts.dto.ts:144` |
| `items[].valueSets[].name` | `string` | No | — | — | Nombre legible del conjunto. Es el texto de la etiqueta. | `src/modules/terminology/dto/search-concepts.dto.ts:150` |
| `items[].slug` | `string` | No | — | — | Slug kebab-case del término, único en el glosario. | `src/modules/terminology/dto/search-concepts.dto.ts:91` |
| `items[].category` | `ConceptTaxonomyRefDto` | No | — | — | Categoría del término, o `null` si —siendo del glosario— no tiene ninguna asignada. | `src/modules/terminology/dto/search-concepts.dto.ts:95` |
| `items[].category.internalCode` | `string` | No | — | — | Código interno estable, como `glossary-category-anatomy`. | `src/modules/terminology/dto/search-concepts.dto.ts:163` |
| `items[].category.name` | `string` | No | — | — | Nombre legible de la categoría. | `src/modules/terminology/dto/search-concepts.dto.ts:167` |
| `items[].shortDefinition` | `string` | No | — | — | Resumen en lenguaje llano, para la columna «definición corta» de la tabla. | `src/modules/terminology/dto/search-concepts.dto.ts:99` |
| `items[].tags` | `array<string>` | No | — | — | Nombres de las etiquetas del término (la categoría no se repite acá). | `src/modules/terminology/dto/search-concepts.dto.ts:103` |
| `items[].relationsCount` | `number` | No | — | — | Cuántas relaciones tipadas tiene el término; la lista completa vive en la ficha. | `src/modules/terminology/dto/search-concepts.dto.ts:107` |
| `items[].status` | `string` | No | — | — | Estado publicado del término (`active`, hoy el único que puede llegar al glosario público). | `src/modules/terminology/dto/search-concepts.dto.ts:111` |
| `items[].imageThumbnailUrl` | `string` | No | formato uri | — | Miniatura de la imagen del término, si tiene una cargada (propiedad `glossary-image`). Sólo la URL: la atribución y la licencia viajan en la ficha, que es donde se muestra la imagen entera con su crédito. | `src/modules/terminology/dto/search-concepts.dto.ts:119` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página | `src/modules/terminology/dto/search-concepts.dto.ts:482` |
| `limit` | `number` | Sí | — | — | Tope de resultados aplicado | `src/modules/terminology/dto/search-concepts.dto.ts:488` |
| `offset` | `number` | No | — | — | Desplazamiento aplicado (sólo glosario) | `src/modules/terminology/dto/search-concepts.dto.ts:500` |
| `total` | `number` | No | — | — | Total que coincide (sólo glosario) | `src/modules/terminology/dto/search-concepts.dto.ts:509` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El conjunto de valores no existe o no tiene versión vigente; ResourceNotFoundException: La etiqueta no existe o no tiene versión vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/br14-encuentros-seguridad-clinica.int-spec.ts:108` |
| INTEGRACION | `test/integration/clinical-c14-c23-notas-e-internacion.int-spec.ts:116` |
| INTEGRACION | `test/integration/clinical-prescriptions-pdf.int-spec.ts:123` |
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:589` |
| INTEGRACION | `test/integration/glossary.int-spec.ts:86` |
| CONTROLADOR | `src/modules/terminology/controllers/terminology-concepts.controller.spec.ts:194` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyConceptsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /terminology/concepts/{conceptId}

- **Origen:** CONTRATO
- **Nombre:** Lee la ficha de un concepto: textos en el idioma pedido, conjuntos de valores a los que pertenece y denominaciones alternativas
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyConceptsController.readConcept` — `src/modules/terminology/controllers/terminology-concepts.controller.ts:344`

### Qué es y para qué sirve (negocio)

Lee la ficha de un concepto: textos en el idioma pedido, conjuntos de valores a los que pertenece y denominaciones alternativas. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /terminology/concepts/{conceptId}` la atiende `TerminologyConceptsController.readConcept` (src/modules/terminology/controllers/terminology-concepts.controller.ts:344). Exige sesión; el controlador no declara roles. Delega en `ConceptsService.readConcept`. Lee terminology.catalog_concepts, terminology.concept_designations, terminology.concept_properties, terminology.concept_relationships, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/terminology/controllers/terminology-concepts.controller.ts:344` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conceptId | `src/modules/terminology/controllers/terminology-concepts.controller.ts:344` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyConceptsController.readConcept → ConceptsService.readConcept → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:75` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | TerminologyConceptsController.readConcept → ConceptsService.readConcept → ConceptDesignationsRepository.findByConcept | `src/modules/terminology/repositories/concept-designations.repository.ts:127` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | TerminologyConceptsController.readConcept → ConceptsService.readConcept → ConceptDesignationsRepository.findPropertiesByConcept | `src/modules/terminology/repositories/concept-designations.repository.ts:147` |
| `terminology.concept_relationships` | LEE | LEE | DIRECTA | TerminologyConceptsController.readConcept → ConceptsService.readConcept → ConceptsService.resolveGlossaryRelations → ConceptRelationshipsRepository.findByTypesForSources | `src/modules/terminology/repositories/concept-relationships.repository.ts:132` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | TerminologyConceptsController.readConcept → ConceptsService.readConcept → ValueSetsRepository.findValueSetsByConceptIds | `src/modules/terminology/repositories/value-sets.repository.ts:367` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | TerminologyConceptsController.readConcept → ConceptsService.readConcept → ValueSetsRepository.findValueSetsByConceptIds | `src/modules/terminology/repositories/value-sets.repository.ts:373` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | TerminologyConceptsController.readConcept → ConceptsService.readConcept → ValueSetsRepository.findValueSetsByConceptIds | `src/modules/terminology/repositories/value-sets.repository.ts:382` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conceptId` | path | Sí | `string` | — |
| `lang` | query | No | `string` | Idioma preferido de `display` y `definition` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ConceptDetailDto>` · DTO `ConceptDetailDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `conceptId` | `string` | Sí | formato uuid | — | Id del concepto. | `src/modules/terminology/dto/search-concepts.dto.ts:346` |
| `code` | `string` | Sí | — | — | Código dentro de su sistema. | `src/modules/terminology/dto/search-concepts.dto.ts:352` |
| `display` | `string` | Sí | — | — | Denominación, en el idioma pedido si la hay. | `src/modules/terminology/dto/search-concepts.dto.ts:358` |
| `definition` | `string` | No | — | — | Definición, en el idioma pedido si la hay. | `src/modules/terminology/dto/search-concepts.dto.ts:364` |
| `selectable` | `boolean` | No | — | — | Si el concepto puede seleccionarse. | `src/modules/terminology/dto/search-concepts.dto.ts:370` |
| `codeSystemVersionId` | `string` | Sí | formato uuid | — | Versión del sistema de códigos a la que pertenece. | `src/modules/terminology/dto/search-concepts.dto.ts:376` |
| `translated` | `boolean` | No | — | — | Si los textos vienen en el idioma pedido; ver . | `src/modules/terminology/dto/search-concepts.dto.ts:382` |
| `valueSets` | `array<ConceptValueSetRefDto>` | Sí | — | — | Categorías a las que pertenece el término. | `src/modules/terminology/dto/search-concepts.dto.ts:388` |
| `valueSets[].id` | `string` | Sí | formato uuid | — | Identificador del conjunto de valores. | `src/modules/terminology/dto/search-concepts.dto.ts:138` |
| `valueSets[].internalCode` | `string` | Sí | — | — | Código interno estable, como `condition-severity`. | `src/modules/terminology/dto/search-concepts.dto.ts:144` |
| `valueSets[].name` | `string` | Sí | — | — | Nombre legible del conjunto. Es el texto de la etiqueta. | `src/modules/terminology/dto/search-concepts.dto.ts:150` |
| `synonyms` | `array<ConceptSynonymDto>` | Sí | — | — | Otras formas de nombrar lo mismo. Se excluye la designación que ya se está mostrando como `display`: repetirla bajo el título «también se le dice» no informa de nada. | `src/modules/terminology/dto/search-concepts.dto.ts:397` |
| `synonyms[].value` | `string` | Sí | — | — | El texto de la denominación. | `src/modules/terminology/dto/search-concepts.dto.ts:176` |
| `synonyms[].language` | `string` | No | valores: ES, EN | — | Idioma de la denominación, cuando el catálogo lo declara. | `src/modules/terminology/dto/search-concepts.dto.ts:182` |
| `synonyms[].preferred` | `boolean` | No | — | — | Si es la denominación preferida de su idioma. | `src/modules/terminology/dto/search-concepts.dto.ts:188` |
| `slug` | `string` | No | — | — | Slug del término, si es un término del glosario. | `src/modules/terminology/dto/search-concepts.dto.ts:408` |
| `clinicalDefinition` | `ConceptTextDto` | No | — | — | Definición clínica, si el término la tiene cargada. | `src/modules/terminology/dto/search-concepts.dto.ts:412` |
| `clinicalDefinition.text` | `string` | No | — | — | El texto, en el idioma pedido o su respaldo en castellano. | `src/modules/terminology/dto/search-concepts.dto.ts:218` |
| `clinicalDefinition.translated` | `boolean` | No | — | — | Si `text` vino en el idioma pedido. En `false`, es el texto en castellano —siempre presente, es obligatorio en el catálogo curado— porque no hay traducción cargada para ese idioma. | `src/modules/terminology/dto/search-concepts.dto.ts:226` |
| `plainSummary` | `ConceptTextDto` | No | — | — | Resumen en lenguaje llano, si el término lo tiene cargado. | `src/modules/terminology/dto/search-concepts.dto.ts:416` |
| `plainSummary.text` | `string` | No | — | — | El texto, en el idioma pedido o su respaldo en castellano. | `src/modules/terminology/dto/search-concepts.dto.ts:218` |
| `plainSummary.translated` | `boolean` | No | — | — | Si `text` vino en el idioma pedido. En `false`, es el texto en castellano —siempre presente, es obligatorio en el catálogo curado— porque no hay traducción cargada para ese idioma. | `src/modules/terminology/dto/search-concepts.dto.ts:226` |
| `category` | `ConceptCategoryRefDto` | Sí | — | — | Categoría del glosario a la que pertenece, o `null` si no pertenece a ninguna. | `src/modules/terminology/dto/search-concepts.dto.ts:420` |
| `category.valueSetId` | `string` | Sí | formato uuid | — | Identificador del value set. | `src/modules/terminology/dto/search-concepts.dto.ts:200` |
| `category.internalCode` | `string` | Sí | — | — | Código interno estable. | `src/modules/terminology/dto/search-concepts.dto.ts:204` |
| `category.name` | `string` | Sí | — | — | Nombre legible. | `src/modules/terminology/dto/search-concepts.dto.ts:208` |
| `tags` | `array<ConceptCategoryRefDto>` | Sí | — | — | Etiquetas del glosario (la categoría no se repite acá). | `src/modules/terminology/dto/search-concepts.dto.ts:424` |
| `tags[].valueSetId` | `string` | Sí | formato uuid | — | Identificador del value set. | `src/modules/terminology/dto/search-concepts.dto.ts:200` |
| `tags[].internalCode` | `string` | Sí | — | — | Código interno estable. | `src/modules/terminology/dto/search-concepts.dto.ts:204` |
| `tags[].name` | `string` | Sí | — | — | Nombre legible. | `src/modules/terminology/dto/search-concepts.dto.ts:208` |
| `relations` | `array<ConceptRelationDto>` | Sí | — | — | Relaciones tipadas salientes, con el término destino ya resuelto. | `src/modules/terminology/dto/search-concepts.dto.ts:428` |
| `relations[].type` | `object` | Sí | — | — | Tipo de relación. | `src/modules/terminology/dto/search-concepts.dto.ts:233` |
| `relations[].conceptId` | `string` | Sí | formato uuid | — | Id del concepto destino. | `src/modules/terminology/dto/search-concepts.dto.ts:237` |
| `relations[].slug` | `string` | Sí | — | — | Slug del término destino. | `src/modules/terminology/dto/search-concepts.dto.ts:241` |
| `relations[].display` | `string` | Sí | — | — | Denominación del término destino (EN, `CatalogConcepts.display`). | `src/modules/terminology/dto/search-concepts.dto.ts:245` |
| `properties` | `object` | Sí | — | — | Propiedades declaradas del concepto, indexadas por su código. Es donde cada code system guarda lo suyo sin que el modelo tenga que declarar una columna por vocabulario: el vademécum publica acá `dose_forms`, `strengths` y `routes` —lo que la pantalla de receta necesita para que el profesional elija presentación y concentración en vez de teclearlas—, y también `rxnorm_cui` o `snomed_code` para cruzar con otros catálogos. Se devuelve como mapa `código -> valor` y no como lista de pares porque se consume por nombre (`properties.strengths`), nunca recorriéndolo. El valor es el `value_json` tal como se guardó: un texto, una lista o un objeto, según lo que declare cada propiedad. Va sólo en la ficha, no en la búsqueda: son varias filas por concepto y traerlas para cada resultado de un autocompletar es peso que la lista no usa. | `src/modules/terminology/dto/search-concepts.dto.ts:459` |
| `image` | `ConceptImageDto` | No | — | — | Imagen ilustrativa. Siempre ausente hoy (ver ); el campo existe para que un carril futuro pueda adjuntar una sin romper el contrato. | `src/modules/terminology/dto/search-concepts.dto.ts:467` |
| `image.source` | `string` | No | — | — | URL o referencia del activo. | `src/modules/terminology/dto/search-concepts.dto.ts:305` |
| `image.license` | `string` | No | — | — | Licencia bajo la que se usa la imagen. | `src/modules/terminology/dto/search-concepts.dto.ts:309` |
| `image.attribution` | `string` | No | — | — | A quién atribuir la imagen. | `src/modules/terminology/dto/search-concepts.dto.ts:313` |
| `image.alt` | `string` | No | — | — | Texto alternativo, para accesibilidad. | `src/modules/terminology/dto/search-concepts.dto.ts:317` |
| `image.status` | `string` | No | valores: approved, pending, rejected | — | Estado de revisión de la imagen. | `src/modules/terminology/dto/search-concepts.dto.ts:321` |
| `image.thumbnailSource` | `string` | No | formato uri | — | Miniatura del mismo activo, para la lista y para no bajar el original de entrada. | `src/modules/terminology/dto/search-concepts.dto.ts:325` |
| `image.sourcePage` | `string` | No | formato uri | — | Página de la fuente donde se publica la imagen con su licencia (p. ej. Wikimedia Commons). | `src/modules/terminology/dto/search-concepts.dto.ts:329` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Concepto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/glossary.int-spec.ts:234` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyConceptsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /terminology/concepts/{conceptId}/$deprecate

- **Origen:** CONTRATO
- **Nombre:** UC-03-10: retira el concepto y lo excluye de las expansiones
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyConceptsController.deprecateConcept` — `src/modules/terminology/controllers/terminology-concepts.controller.ts:457`

### Qué es y para qué sirve (negocio)

UC-03-10: retira el concepto y lo excluye de las expansiones. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /terminology/concepts/{conceptId}/$deprecate` la atiende `TerminologyConceptsController.deprecateConcept` (src/modules/terminology/controllers/terminology-concepts.controller.ts:457). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `DeprecateConceptDto` (1 campo, 0 obligatorios). Delega en `ConceptsService.deprecateConcept`. Actualiza terminology.catalog_concepts, terminology.value_set_members. Lee terminology.catalog_concepts, terminology.value_set_members.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-concepts.controller.ts:457` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conceptId | `src/modules/terminology/controllers/terminology-concepts.controller.ts:457` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | ESCRIBE | ACTUALIZA | POR_TIPO | TerminologyConceptsController.deprecateConcept → ConceptsService.deprecateConcept | `src/modules/terminology/services/concepts.service.ts:543` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyConceptsController.deprecateConcept → ConceptsService.deprecateConcept → CatalogConceptsRepository.findByIdForUpdate | `src/modules/terminology/repositories/catalog-concepts.repository.ts:123` |
| `terminology.value_set_members` | ESCRIBE | ACTUALIZA | POR_TIPO | TerminologyConceptsController.deprecateConcept → ConceptsService.deprecateConcept | `src/modules/terminology/services/concepts.service.ts:555` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | TerminologyConceptsController.deprecateConcept → ConceptsService.deprecateConcept → ValueSetsRepository.findMembersByConceptForUpdate | `src/modules/terminology/repositories/value-sets.repository.ts:597` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conceptId` | path | Sí | `string` | — |

### Cuerpo — DTO `DeprecateConceptDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `replacedByConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto que lo sustituye; tiene que estar activo | `src/modules/terminology/dto/concept-properties.dto.ts:65` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "replacedByConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DeprecateConceptResponseDto>` · DTO `DeprecateConceptResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id del concepto retirado | `src/modules/terminology/dto/concept-properties.dto.ts:74` |
| `stateConceptId` | `string` | Sí | — | — | Estado en el que queda | `src/modules/terminology/dto/concept-properties.dto.ts:80` |
| `replacedByConceptId` | `string` | No | — | — | Concepto que lo sustituye | `src/modules/terminology/dto/concept-properties.dto.ts:86` |
| `excludedMembers` | `number` | Sí | — | — | Miembros de conjuntos de valores que quedaron excluidos | `src/modules/terminology/dto/concept-properties.dto.ts:94` |
| `alreadyRetired` | `boolean` | Sí | — | — | Verdadero si el concepto ya estaba retirado | `src/modules/terminology/dto/concept-properties.dto.ts:100` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Concepto no encontrado; ResourceNotFoundException: Concepto de reemplazo no encontrado |
| 409 | `CONFLICT` | ConflictException: Un concepto no puede reemplazarse a sí mismo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El concepto de reemplazo está retirado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/terminology/controllers/terminology-concepts.controller.spec.ts:103` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyConceptsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /terminology/concepts/{conceptId}/designations

- **Origen:** CONTRATO
- **Nombre:** UC-03-05: añade una designación (y opcionalmente propiedades)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyConceptsController.addDesignation` — `src/modules/terminology/controllers/terminology-concepts.controller.ts:376`

### Qué es y para qué sirve (negocio)

UC-03-05: añade una designación (y opcionalmente propiedades). Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /terminology/concepts/{conceptId}/designations` la atiende `TerminologyConceptsController.addDesignation` (src/modules/terminology/controllers/terminology-concepts.controller.ts:376). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateDesignationDto` (8 campos, 1 obligatorio). Delega en `ConceptsService.addDesignation`. Crea filas en terminology.concept_designations, terminology.concept_properties. Actualiza terminology.concept_designations. Lee terminology.catalog_concepts, terminology.concept_designations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-concepts.controller.ts:376` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conceptId | `src/modules/terminology/controllers/terminology-concepts.controller.ts:376` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyConceptsController.addDesignation → ConceptsService.addDesignation → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:75` |
| `terminology.concept_designations` | ESCRIBE | ACTUALIZA | POR_TIPO | TerminologyConceptsController.addDesignation → ConceptsService.addDesignation | `src/modules/terminology/services/concepts.service.ts:255` |
| `terminology.concept_designations` | ESCRIBE | CREA | DIRECTA | TerminologyConceptsController.addDesignation → ConceptsService.addDesignation → ConceptDesignationsRepository.createDesignation | `src/modules/terminology/repositories/concept-designations.repository.ts:73` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | TerminologyConceptsController.addDesignation → ConceptsService.addDesignation → ConceptDesignationsRepository.findByLanguageForUpdate | `src/modules/terminology/repositories/concept-designations.repository.ts:115` |
| `terminology.concept_properties` | ESCRIBE | CREA | DIRECTA | TerminologyConceptsController.addDesignation → ConceptsService.addDesignation → ConceptDesignationsRepository.createProperty | `src/modules/terminology/repositories/concept-designations.repository.ts:92` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conceptId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateDesignationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `value` | `string` | Sí | longitud mínima 1; longitud máxima 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | Texto de la designación | `src/modules/terminology/dto/create-designation.dto.ts:57` |
| `language` | `string` | No | valores: ES, EN | `@IsOptional()` `@IsIn(['ES', 'EN'])` | Idioma de la designación | `src/modules/terminology/dto/create-designation.dto.ts:68` |
| `designationType` | `string` | No | valores: PREFERRED, SYNONYM | `@IsOptional()` `@IsIn(['PREFERRED', 'SYNONYM'])` | Tipo de designación | `src/modules/terminology/dto/create-designation.dto.ts:79` |
| `preferred` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca la designación como preferida | `src/modules/terminology/dto/create-designation.dto.ts:87` |
| `properties` | `array<ConceptPropertyInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ConceptPropertyInputDto)` | Propiedades a adjuntar al concepto | `src/modules/terminology/dto/create-designation.dto.ts:100` |
| `properties[].propertyCode` | `string` | No | longitud mínima 1; longitud máxima 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | Código de la propiedad | `src/modules/terminology/dto/create-designation.dto.ts:28` |
| `properties[].valueJson` | `object` | No | longitud mínima 1 | `@IsNotEmpty()` | Valor de la propiedad (JSON arbitrario) | `src/modules/terminology/dto/create-designation.dto.ts:35` |
| `properties[].dataType` | `string` | No | — | `@IsOptional()` `@IsString()` | Tipo de dato técnico (enum terminology.technical_data_type) | `src/modules/terminology/dto/create-designation.dto.ts:45` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "value": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "value": "valor-ejemplo",
  "language": "ES",
  "designationType": "PREFERRED",
  "preferred": true,
  "properties": [
    {
      "propertyCode": "CODIGO_EJEMPLO",
      "valueJson": {},
      "dataType": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<DesignationResponseDto>` · DTO `DesignationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id de la designación creada | `src/modules/terminology/dto/create-designation.dto.ts:109` |
| `conceptId` | `string` | Sí | — | — | Id del concepto al que pertenece | `src/modules/terminology/dto/create-designation.dto.ts:115` |
| `value` | `string` | Sí | — | — | Texto de la designación | `src/modules/terminology/dto/create-designation.dto.ts:121` |
| `languageConceptId` | `string` | No | — | — | Idioma (concepto) | `src/modules/terminology/dto/create-designation.dto.ts:127` |
| `designationTypeConceptId` | `string` | No | — | — | Tipo de designación (concepto) | `src/modules/terminology/dto/create-designation.dto.ts:133` |
| `preferred` | `boolean` | No | — | — | Si es la designación preferida | `src/modules/terminology/dto/create-designation.dto.ts:139` |
| `propertiesCount` | `number` | Sí | — | — | Número de propiedades adjuntadas | `src/modules/terminology/dto/create-designation.dto.ts:145` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Concepto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/terminology.int-spec.ts:127` |
| CONTROLADOR | `src/modules/terminology/controllers/terminology-concepts.controller.spec.ts:46` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyConceptsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. GET /terminology/concepts/{conceptId}/glossary-article

- **Origen:** CONTRATO
- **Nombre:** Lee el artículo enciclopédico de un término del glosario
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyConceptsController.readGlossaryArticle` — `src/modules/terminology/controllers/terminology-concepts.controller.ts:318`

### Qué es y para qué sirve (negocio)

Lee el artículo enciclopédico de un término del glosario. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /terminology/concepts/{conceptId}/glossary-article` la atiende `TerminologyConceptsController.readGlossaryArticle` (src/modules/terminology/controllers/terminology-concepts.controller.ts:318). Exige sesión; el controlador no declara roles. Delega en `ConceptsService.readGlossaryArticle`. Lee terminology.concept_properties.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/terminology/controllers/terminology-concepts.controller.ts:318` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conceptId | `src/modules/terminology/controllers/terminology-concepts.controller.ts:318` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.concept_properties` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryArticle → ConceptsService.readGlossaryArticle → ConceptDesignationsRepository.findProperty | `src/modules/terminology/repositories/concept-designations.repository.ts:139` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conceptId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<unknown>` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Artículo del glosario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/terminology/controllers/terminology-concepts.controller.spec.ts:57` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyConceptsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. GET /terminology/concepts/{conceptId}/glossary-neighborhood

- **Origen:** CONTRATO
- **Nombre:** Lee el vecindario de un término del glosario: relaciones salientes y entrantes agrupadas por tipo
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyConceptsController.readGlossaryNeighborhood` — `src/modules/terminology/controllers/terminology-concepts.controller.ts:289`

### Qué es y para qué sirve (negocio)

Lee el vecindario de un término del glosario: relaciones salientes y entrantes agrupadas por tipo. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /terminology/concepts/{conceptId}/glossary-neighborhood` la atiende `TerminologyConceptsController.readGlossaryNeighborhood` (src/modules/terminology/controllers/terminology-concepts.controller.ts:289). Exige sesión; el controlador no declara roles. Delega en `ConceptsService.readGlossaryNeighborhood`. Lee terminology.catalog_concepts, terminology.concept_designations, terminology.concept_properties, terminology.concept_relationship_evidence, terminology.concept_relationships, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/terminology/controllers/terminology-concepts.controller.ts:289` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conceptId | `src/modules/terminology/controllers/terminology-concepts.controller.ts:289` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryNeighborhood → ConceptsService.readGlossaryNeighborhood → ConceptsService.readGlossaryFocus → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:75` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryNeighborhood → ConceptsService.readGlossaryNeighborhood → ConceptsService.readGlossaryFocus → ConceptsService.resolveTexts → ConceptDesignationsRepository.findPreferredByLanguageForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:176` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryNeighborhood → ConceptsService.readGlossaryNeighborhood → ConceptsService.readGlossaryFocus → ConceptsService.resolveTexts → ConceptDesignationsRepository.findPropertyForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:200` |
| `terminology.concept_relationship_evidence` | LEE | LEE | POR_SQL | TerminologyConceptsController.readGlossaryNeighborhood → ConceptsService.readGlossaryNeighborhood → ConceptsService.resolveNeighborEvidence → ConceptRelationshipsRepository.findEvidenceSummaries | `src/modules/terminology/repositories/concept-relationships.repository.ts:277` |
| `terminology.concept_relationships` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryNeighborhood → ConceptsService.readGlossaryNeighborhood → ConceptsService.collectSortedNeighbors → ConceptRelationshipsRepository.findByTypesForSources | `src/modules/terminology/repositories/concept-relationships.repository.ts:132` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryNeighborhood → ConceptsService.readGlossaryNeighborhood → ConceptsService.readGlossaryFocus → ValueSetsRepository.findValueSetsByConceptIds | `src/modules/terminology/repositories/value-sets.repository.ts:367` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryNeighborhood → ConceptsService.readGlossaryNeighborhood → ConceptsService.readGlossaryFocus → ValueSetsRepository.findValueSetsByConceptIds | `src/modules/terminology/repositories/value-sets.repository.ts:373` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryNeighborhood → ConceptsService.readGlossaryNeighborhood → ConceptsService.readGlossaryFocus → ValueSetsRepository.findValueSetsByConceptIds | `src/modules/terminology/repositories/value-sets.repository.ts:382` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conceptId` | path | Sí | `string` | — |
| `lang` | query | No | `string` | — |
| `perGroup` | query | No | `number` | — |
| `type` | query | No | `string` | — |
| `direction` | query | No | `string` | — |
| `offset` | query | No | `number` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<GlossaryNeighborhoodDto>` · DTO `GlossaryNeighborhoodDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `focus` | `GlossaryGraphNodeDto` | Sí | — | — | — | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:200` |
| `focus.conceptId` | `string` | Sí | formato uuid | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:251` |
| `focus.slug` | `string` | Sí | — | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:254` |
| `focus.display` | `string` | Sí | — | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:257` |
| `focus.category` | `ConceptTaxonomyRefDto` | Sí | — | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:260` |
| `focus.category.internalCode` | `string` | Sí | — | — | Código interno estable, como `glossary-category-anatomy`. | `src/modules/terminology/dto/search-concepts.dto.ts:163` |
| `focus.category.name` | `string` | Sí | — | — | Nombre legible de la categoría. | `src/modules/terminology/dto/search-concepts.dto.ts:167` |
| `focus.shortDefinition` | `string` | Sí | — | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:263` |
| `groups` | `array<GlossaryNeighborGroupDto>` | Sí | — | — | — | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:203` |
| `groups[].type` | `object` | Sí | — | — | Tipo TypeScript no expandido:  \| 'RELATED_TERM' \| 'DISEASE' \| 'PROCEDURE' \| 'TREATMENT' \| 'ANATOMY' \| 'DIAGNOSTIC_TEST' \| 'SYMPTOM' \| 'SPECIALTY' \| 'DIAGNOSTIC_CRITERION' \| 'REQUIRED_TEST' \| 'COMPLICATION' \| 'RISK_FACTOR' \| 'REFERRAL_CRITERION' | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:184` |
| `groups[].direction` | `string` | Sí | valores: outgoing, incoming | — | — | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:187` |
| `groups[].total` | `number` | Sí | — | — | Tamaño real del grupo, no lo que vino en `items`. | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:191` |
| `groups[].items` | `array<GlossaryNeighborDto>` | Sí | — | — | — | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:194` |
| `groups[].items[].conceptId` | `string` | Sí | formato uuid | — | — | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:147` |
| `groups[].items[].slug` | `string` | Sí | — | — | — | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:150` |
| `groups[].items[].display` | `string` | Sí | — | — | — | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:153` |
| `groups[].items[].category` | `ConceptTaxonomyRefDto` | Sí | — | — | — | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:156` |
| `groups[].items[].category.internalCode` | `string` | Sí | — | — | Código interno estable, como `glossary-category-anatomy`. | `src/modules/terminology/dto/search-concepts.dto.ts:163` |
| `groups[].items[].category.name` | `string` | Sí | — | — | Nombre legible de la categoría. | `src/modules/terminology/dto/search-concepts.dto.ts:167` |
| `groups[].items[].strength` | `number` | No | — | — | Fuerza de la relación, de 0 a 1 (`strength_score`). Ordena el grupo. | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:160` |
| `groups[].items[].frequency` | `object` | No | — | — | Frecuencia del hallazgo según la mejor evidencia. `EXCLUDED` significa que la fuente lo descarta: no es una relación positiva. | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:167` |
| `groups[].items[].evidenceTier` | `object` | No | — | — | Mejor nivel de evidencia de la relación. | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:171` |
| `groups[].items[].sourceCodes` | `array<string>` | No | — | — | Ids de origen de cada evidencia (`source_reference`), sin repetir. | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:175` |
| `groups[].items[].qualifiers` | `GlossaryNeighborQualifiersDto` | No | — | — | — | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:178` |
| `groups[].items[].qualifiers.sex` | `string` | No | — | — | Código del sexo al que aplica (`sex_concept_id`). | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:115` |
| `groups[].items[].qualifiers.ageMinDays` | `number` | No | — | — | Edad mínima en días: la menor entre las evidencias. | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:119` |
| `groups[].items[].qualifiers.ageMaxDays` | `number` | No | — | — | Edad máxima en días: la mayor entre las evidencias. | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:123` |
| `groups[].items[].qualifiers.pregnancy` | `string` | No | — | — | Código de aplicabilidad en el embarazo. | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:127` |
| `groups[].items[].qualifiers.careLevel` | `string` | No | — | — | Código del nivel de atención (`FIRST_LEVEL`, `SECOND_LEVEL`, `THIRD_LEVEL`). | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:131` |
| `groups[].items[].qualifiers.lineOfTherapy` | `string` | No | — | — | Código de la línea de tratamiento (`FIRST_LINE`, `SECOND_LINE`). | `src/modules/terminology/dto/glossary-neighborhood.dto.ts:135` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/glossary.int-spec.ts:399` |
| CONTROLADOR | `src/modules/terminology/controllers/terminology-concepts.controller.spec.ts:132` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyConceptsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /terminology/concepts/{conceptId}/properties

- **Origen:** CONTRATO
- **Nombre:** UC-03-05: alta o actualización de propiedades del concepto
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyConceptsController.upsertProperties` — `src/modules/terminology/controllers/terminology-concepts.controller.ts:430`

### Qué es y para qué sirve (negocio)

UC-03-05: alta o actualización de propiedades del concepto. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /terminology/concepts/{conceptId}/properties` la atiende `TerminologyConceptsController.upsertProperties` (src/modules/terminology/controllers/terminology-concepts.controller.ts:430). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpsertConceptPropertiesDto` (4 campos, 3 obligatorios). Delega en `ConceptsService.upsertProperties`. Crea filas en terminology.concept_properties. Actualiza terminology.concept_properties. Lee terminology.catalog_concepts, terminology.concept_properties.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-concepts.controller.ts:430` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conceptId | `src/modules/terminology/controllers/terminology-concepts.controller.ts:430` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyConceptsController.upsertProperties → ConceptsService.upsertProperties → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:75` |
| `terminology.concept_properties` | ESCRIBE | ACTUALIZA | POR_TIPO | TerminologyConceptsController.upsertProperties → ConceptsService.upsertProperties | `src/modules/terminology/services/concepts.service.ts:437` |
| `terminology.concept_properties` | ESCRIBE | CREA | DIRECTA | TerminologyConceptsController.upsertProperties → ConceptsService.upsertProperties → ConceptDesignationsRepository.createProperty | `src/modules/terminology/repositories/concept-designations.repository.ts:92` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | TerminologyConceptsController.upsertProperties → ConceptsService.upsertProperties → ConceptDesignationsRepository.findProperty | `src/modules/terminology/repositories/concept-designations.repository.ts:139` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conceptId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpsertConceptPropertiesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `properties` | `array<ConceptPropertyInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ConceptPropertyInputDto)` | Propiedades del concepto | `src/modules/terminology/dto/concept-properties.dto.ts:30` |
| `properties[].propertyCode` | `string` | Sí | longitud mínima 1; longitud máxima 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | Código de la propiedad | `src/modules/terminology/dto/create-designation.dto.ts:28` |
| `properties[].valueJson` | `object` | Sí | longitud mínima 1 | `@IsNotEmpty()` | Valor de la propiedad (JSON arbitrario) | `src/modules/terminology/dto/create-designation.dto.ts:35` |
| `properties[].dataType` | `string` | No | — | `@IsOptional()` `@IsString()` | Tipo de dato técnico (enum terminology.technical_data_type) | `src/modules/terminology/dto/create-designation.dto.ts:45` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "properties": [
    {
      "propertyCode": "CODIGO_EJEMPLO",
      "valueJson": {}
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "properties": [
    {
      "propertyCode": "CODIGO_EJEMPLO",
      "valueJson": {},
      "dataType": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<ConceptPropertiesResponseDto>` · DTO `ConceptPropertiesResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `conceptId` | `string` | Sí | — | — | Id del concepto | `src/modules/terminology/dto/concept-properties.dto.ts:39` |
| `created` | `number` | Sí | — | — | Propiedades creadas | `src/modules/terminology/dto/concept-properties.dto.ts:45` |
| `updated` | `number` | Sí | — | — | Propiedades actualizadas sobre una existente | `src/modules/terminology/dto/concept-properties.dto.ts:51` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Concepto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/terminology/controllers/terminology-concepts.controller.spec.ts:86` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyConceptsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /terminology/concepts/{conceptId}/relationships

- **Origen:** CONTRATO
- **Nombre:** UC-03-06: crea una relación dirigida entre conceptos
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyConceptsController.addRelationship` — `src/modules/terminology/controllers/terminology-concepts.controller.ts:403`

### Qué es y para qué sirve (negocio)

UC-03-06: crea una relación dirigida entre conceptos. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /terminology/concepts/{conceptId}/relationships` la atiende `TerminologyConceptsController.addRelationship` (src/modules/terminology/controllers/terminology-concepts.controller.ts:403). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `TerminologyCreateRelationshipDto` (3 campos, 2 obligatorios). Delega en `ConceptsService.addRelationship`. Crea filas en terminology.concept_relationships. Lee terminology.catalog_concepts, terminology.concept_relationships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-concepts.controller.ts:403` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conceptId | `src/modules/terminology/controllers/terminology-concepts.controller.ts:403` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyConceptsController.addRelationship → ConceptsService.addRelationship → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:75` |
| `terminology.concept_relationships` | ESCRIBE | CREA | DIRECTA | TerminologyConceptsController.addRelationship → ConceptsService.addRelationship → ConceptRelationshipsRepository.create | `src/modules/terminology/repositories/concept-relationships.repository.ts:315` |
| `terminology.concept_relationships` | LEE | LEE | DIRECTA | TerminologyConceptsController.addRelationship → ConceptsService.addRelationship → ConceptRelationshipsRepository.findEquivalent | `src/modules/terminology/repositories/concept-relationships.repository.ts:86` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conceptId` | path | Sí | `string` | — |

### Cuerpo — DTO `TerminologyCreateRelationshipDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del concepto destino | `src/modules/terminology/dto/create-relationship.dto.ts:15` |
| `relationshipType` | `string` | Sí | valores: IS_A, PART_OF | `@IsIn(['IS_A', 'PART_OF'])` | Tipo de relación | `src/modules/terminology/dto/create-relationship.dto.ts:22` |
| `ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden dentro de las relaciones del mismo tipo | `src/modules/terminology/dto/create-relationship.dto.ts:33` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "targetConceptId": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "IS_A"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "targetConceptId": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "IS_A",
  "ordinal": 1
}
```

</details>

### Respuesta — `Promise<RelationshipResponseDto>` · DTO `RelationshipResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id de la relación creada | `src/modules/terminology/dto/create-relationship.dto.ts:42` |
| `sourceConceptId` | `string` | Sí | — | — | Id del concepto origen | `src/modules/terminology/dto/create-relationship.dto.ts:48` |
| `targetConceptId` | `string` | Sí | — | — | Id del concepto destino | `src/modules/terminology/dto/create-relationship.dto.ts:54` |
| `relationshipTypeConceptId` | `string` | Sí | — | — | Tipo de relación (concepto) | `src/modules/terminology/dto/create-relationship.dto.ts:60` |
| `ordinal` | `number` | No | — | — | Orden dentro de las relaciones del mismo tipo | `src/modules/terminology/dto/create-relationship.dto.ts:68` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Concepto origen no encontrado; ResourceNotFoundException: Concepto destino no encontrado |
| 409 | `CONFLICT` | ConflictException: Un concepto no puede relacionarse consigo mismo; ConflictException: Ya existe una relación equivalente entre esos conceptos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/terminology.int-spec.ts:140` |
| CONTROLADOR | `src/modules/terminology/controllers/terminology-concepts.controller.spec.ts:74` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyConceptsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. GET /terminology/concepts/glossary-graph

- **Origen:** CONTRATO
- **Nombre:** Lee el grafo de términos publicados del glosario médico
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyConceptsController.readGlossaryGraph` — `src/modules/terminology/controllers/terminology-concepts.controller.ts:250`

### Qué es y para qué sirve (negocio)

Lee el grafo de términos publicados del glosario médico. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /terminology/concepts/glossary-graph` la atiende `TerminologyConceptsController.readGlossaryGraph` (src/modules/terminology/controllers/terminology-concepts.controller.ts:250). Exige sesión; el controlador no declara roles. Delega en `ConceptsService.readGlossaryGraph`. Lee terminology.catalog_concepts, terminology.concept_designations, terminology.concept_properties, terminology.concept_relationships, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/terminology/controllers/terminology-concepts.controller.ts:250` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryGraph → ConceptsService.readGlossaryGraph → ConceptsService.searchConcepts → CatalogConceptsRepository.search | `src/modules/terminology/repositories/catalog-concepts.repository.ts:257` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryGraph → ConceptsService.readGlossaryGraph → ConceptsService.searchConcepts → ConceptsService.buildSearchItems → ConceptsService.resolveTexts → ConceptDesignationsRepository.findPreferredByLanguageForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:176` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryGraph → ConceptsService.readGlossaryGraph → ConceptsService.searchConcepts → ConceptsService.buildSearchItems → ConceptDesignationsRepository.findPropertyForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:200` |
| `terminology.concept_relationships` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryGraph → ConceptsService.readGlossaryGraph → ConceptsService.resolveGlossaryRelations → ConceptRelationshipsRepository.findByTypesForSources | `src/modules/terminology/repositories/concept-relationships.repository.ts:132` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryGraph → ConceptsService.readGlossaryGraph → ConceptsService.searchConcepts → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryGraph → ConceptsService.readGlossaryGraph → ConceptsService.searchConcepts → ConceptsService.searchGlossaryPage → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | TerminologyConceptsController.readGlossaryGraph → ConceptsService.readGlossaryGraph → ConceptsService.searchConcepts → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `lang` | query | No | `string` | — |
| `limit` | query | No | `number` | Máximo de nodos devueltos; por defecto 500 |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<GlossaryGraphDto>` · DTO `GlossaryGraphDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nodes` | `array<GlossaryGraphNodeDto>` | Sí | — | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:281` |
| `nodes[].conceptId` | `string` | Sí | formato uuid | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:251` |
| `nodes[].slug` | `string` | Sí | — | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:254` |
| `nodes[].display` | `string` | Sí | — | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:257` |
| `nodes[].category` | `ConceptTaxonomyRefDto` | Sí | — | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:260` |
| `nodes[].category.internalCode` | `string` | Sí | — | — | Código interno estable, como `glossary-category-anatomy`. | `src/modules/terminology/dto/search-concepts.dto.ts:163` |
| `nodes[].category.name` | `string` | Sí | — | — | Nombre legible de la categoría. | `src/modules/terminology/dto/search-concepts.dto.ts:167` |
| `nodes[].shortDefinition` | `string` | Sí | — | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:263` |
| `edges` | `array<GlossaryGraphEdgeDto>` | Sí | — | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:284` |
| `edges[].sourceConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:269` |
| `edges[].targetConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:272` |
| `edges[].type` | `object` | Sí | — | — | Tipo TypeScript no expandido:  \| 'RELATED_TERM' \| 'DISEASE' \| 'PROCEDURE' \| 'TREATMENT' \| 'ANATOMY' \| 'DIAGNOSTIC_TEST' \| 'SYMPTOM' \| 'SPECIALTY' \| 'DIAGNOSTIC_CRITERION' \| 'REQUIRED_TEST' \| 'COMPLICATION' \| 'RISK_FACTOR' \| 'REFERRAL_CRITERION' | `src/modules/terminology/dto/search-concepts.dto.ts:275` |
| `count` | `number` | Sí | — | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:287` |
| `limit` | `number` | Sí | — | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:290` |
| `possiblyTruncated` | `boolean` | Sí | — | — | — | `src/modules/terminology/dto/search-concepts.dto.ts:293` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El conjunto de valores no existe o no tiene versión vigente; ResourceNotFoundException: La etiqueta no existe o no tiene versión vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/terminology/controllers/terminology-concepts.controller.spec.ts:359` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyConceptsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. GET /terminology/import-template

- **Origen:** CONTRATO
- **Nombre:** UC-03-03: descarga la plantilla de importación de un perfil
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyImportTemplateController.descargarPlantilla` — `src/modules/terminology/controllers/terminology-import-template.controller.ts:34`

### Qué es y para qué sirve (negocio)

UC-03-03: descarga la plantilla de importación de un perfil. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /terminology/import-template` la atiende `TerminologyImportTemplateController.descargarPlantilla` (src/modules/terminology/controllers/terminology-import-template.controller.ts:34). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ImportTemplateService.generate`. No toca tablas relacionales: Arma la plantilla en memoria a partir de la definición del perfil de importación y la devuelve como archivo; no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-import-template.controller.ts:34` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

No toca tablas relacionales: Arma la plantilla en memoria a partir de la definición del perfil de importación y la devuelve como archivo; no consulta la base de datos.. _(manual, 2026-10-25; fuente: `src/modules/terminology/services/import-template.service.ts:79`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profile` | query | No | `string` | Qué se va a cargar |
| `format` | query | No | `string` | Formato de la plantilla |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `StreamableFile`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportFileRejectedException: {ErrorCode.IMPORT_PROFILE_UNKNOWN}; ImportFileRejectedException: {ErrorCode.IMPORT_FORMAT_UNSUPPORTED} |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/terminology/controllers/terminology-import-template.controller.spec.ts:26` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyImportTemplateController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. PUT /terminology/tenants/{tenantId}/catalog-policies

- **Origen:** CONTRATO
- **Nombre:** UC-03-12: define la política de catálogo del tenant
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyTenantCatalogController.upsertPolicy` — `src/modules/terminology/controllers/terminology-tenant-catalog.controller.ts:46`

### Qué es y para qué sirve (negocio)

UC-03-12: define la política de catálogo del tenant. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PUT /terminology/tenants/{tenantId}/catalog-policies` la atiende `TerminologyTenantCatalogController.upsertPolicy` (src/modules/terminology/controllers/terminology-tenant-catalog.controller.ts:46). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpsertTenantCatalogPolicyDto` (13 campos, 1 obligatorio). Delega en `TenantCatalogService.upsertPolicy`. Crea filas en terminology.tenant_catalog_policies, terminology.tenant_concept_config. Actualiza terminology.tenant_catalog_policies, terminology.tenant_concept_config. Lee terminology.catalog_concepts, terminology.tenant_catalog_policies, terminology.tenant_concept_config, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-tenant-catalog.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/terminology/controllers/terminology-tenant-catalog.controller.ts:46` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyTenantCatalogController.upsertPolicy → TenantCatalogService.upsertPolicy → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:75` |
| `terminology.tenant_catalog_policies` | ESCRIBE | ACTUALIZA | POR_TIPO | TerminologyTenantCatalogController.upsertPolicy → TenantCatalogService.upsertPolicy | `src/modules/terminology/services/tenant-catalog.service.ts:145` |
| `terminology.tenant_catalog_policies` | ESCRIBE | CREA | DIRECTA | TerminologyTenantCatalogController.upsertPolicy → TenantCatalogService.upsertPolicy → TenantCatalogRepository.createPolicy | `src/modules/terminology/repositories/tenant-catalog.repository.ts:108` |
| `terminology.tenant_catalog_policies` | LEE | LEE | DIRECTA | TerminologyTenantCatalogController.upsertPolicy → TenantCatalogService.upsertPolicy → TenantCatalogRepository.findPolicyForUpdate | `src/modules/terminology/repositories/tenant-catalog.repository.ts:96` |
| `terminology.tenant_concept_config` | ESCRIBE | ACTUALIZA | POR_TIPO | TerminologyTenantCatalogController.upsertPolicy → TenantCatalogService.upsertPolicy | `src/modules/terminology/services/tenant-catalog.service.ts:179` |
| `terminology.tenant_concept_config` | ESCRIBE | CREA | DIRECTA | TerminologyTenantCatalogController.upsertPolicy → TenantCatalogService.upsertPolicy → TenantCatalogRepository.createConfig | `src/modules/terminology/repositories/tenant-catalog.repository.ts:160` |
| `terminology.tenant_concept_config` | LEE | LEE | DIRECTA | TerminologyTenantCatalogController.upsertPolicy → TenantCatalogService.upsertPolicy → TenantCatalogRepository.findDefaultsForUpdate | `src/modules/terminology/repositories/tenant-catalog.repository.ts:148` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | TerminologyTenantCatalogController.upsertPolicy → TenantCatalogService.upsertPolicy → ValueSetsRepository.findById | `src/modules/terminology/repositories/value-sets.repository.ts:112` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpsertTenantCatalogPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `valueSetId` | `string` | Sí | formato uuid | `@IsUUID()` | Conjunto de valores sobre el que aplica | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:89` |
| `mode` | `string` | No | valores: INHERIT, SUBSET, EXTEND | `@IsOptional()` `@IsIn(CATALOG_MODES)` | — | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:97` |
| `allowSubset` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si el tenant puede recortar el conjunto | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:108` |
| `allowAlias` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si el tenant puede renombrar conceptos | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:119` |
| `allowLocalConcepts` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si el tenant puede añadir conceptos locales | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:130` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Desde cuándo rige | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:141` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Hasta cuándo rige | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:152` |
| `concepts` | `array<TenantConceptConfigInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => TenantConceptConfigInputDto)` | Configuración por concepto | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:165` |
| `concepts[].conceptId` | `string` | No | formato uuid | `@IsUUID()` | Concepto configurado | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:31` |
| `concepts[].enabled` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si el tenant lo ofrece | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:39` |
| `concepts[].aliasDisplay` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Nombre con el que el tenant lo muestra; exige `allowAlias` | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:51` |
| `concepts[].ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden de presentación | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:60` |
| `concepts[].isDefault` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Valor por omisión del conjunto; sólo uno puede serlo | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:71` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "valueSetId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "valueSetId": "00000000-0000-4000-8000-000000000001",
  "mode": "INHERIT",
  "allowSubset": false,
  "allowAlias": false,
  "allowLocalConcepts": false,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "concepts": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "enabled": true,
      "aliasDisplay": "valor-ejemplo",
      "ordinal": 1,
      "isDefault": false
    }
  ]
}
```

</details>

### Respuesta — `Promise<TenantCatalogPolicyResponseDto>` · DTO `TenantCatalogPolicyResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id de la política | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:174` |
| `tenantId` | `string` | Sí | — | — | Tenant al que pertenece | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:180` |
| `valueSetId` | `string` | Sí | — | — | Conjunto de valores sobre el que aplica | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:186` |
| `modeConceptId` | `string` | No | — | — | Modo del catálogo (concepto) | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:192` |
| `conceptsCreated` | `number` | Sí | — | — | Configuraciones de concepto creadas | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:198` |
| `conceptsUpdated` | `number` | Sí | — | — | Configuraciones de concepto actualizadas | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:204` |
| `updated` | `boolean` | Sí | — | — | Verdadero si la política ya existía y se actualizó | `src/modules/terminology/dto/tenant-catalog-policy.dto.ts:212` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conjunto de valores no encontrado; ResourceNotFoundException: Concepto no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La política no permite renombrar conceptos; PreconditionFailedException: Sólo un concepto puede ser el valor por omisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/terminology/controllers/terminology-tenant-catalog.controller.spec.ts:31` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyTenantCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. GET /terminology/value-sets

- **Origen:** CONTRATO
- **Nombre:** Listar conjuntos de valores por código interno o texto
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyValueSetsController.searchValueSets` — `src/modules/terminology/controllers/terminology-value-sets.controller.ts:124`

### Qué es y para qué sirve (negocio)

Listar conjuntos de valores por código interno o texto. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /terminology/value-sets` la atiende `TerminologyValueSetsController.searchValueSets` (src/modules/terminology/controllers/terminology-value-sets.controller.ts:124). Es una ruta pública: no exige token. Delega en `ValueSetsService.searchValueSets`. Lee terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/terminology/controllers/terminology-value-sets.controller.ts:124` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_CATALOG_READ_THROTTLE) | `src/modules/terminology/controllers/terminology-value-sets.controller.ts:124` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.value_set_members` | LEE | LEE | POR_SQL | TerminologyValueSetsController.searchValueSets → ValueSetsService.searchValueSets → ValueSetsRepository.countMembersByVersionIds | `src/modules/terminology/repositories/value-sets.repository.ts:221` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | TerminologyValueSetsController.searchValueSets → ValueSetsService.searchValueSets → ValueSetsRepository.findDefaultVersionsByValueSetIds | `src/modules/terminology/repositories/value-sets.repository.ts:187` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | TerminologyValueSetsController.searchValueSets → ValueSetsService.searchValueSets → ValueSetsRepository.searchPage | `src/modules/terminology/repositories/value-sets.repository.ts:170` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `code` | query | No | `string` | Código interno exacto del conjunto |
| `q` | query | No | `string` | Texto a buscar en el código interno o el nombre |
| `cursor` | query | No | `string` | Cursor opaco devuelto por la página anterior |
| `limit` | query | No | `number` | Conjuntos por página (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SearchValueSetsResponseDto>` · DTO `SearchValueSetsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ValueSetListItemDto>` | Sí | — | — | Conjuntos de esta página, ordenados por código interno. | `src/modules/terminology/dto/search-value-sets.dto.ts:74` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del conjunto de valores. | `src/modules/terminology/dto/search-value-sets.dto.ts:15` |
| `items[].internalCode` | `string` | Sí | — | — | Código interno estable. Es la clave por la que se busca sin conocer el uuid. | `src/modules/terminology/dto/search-value-sets.dto.ts:21` |
| `items[].name` | `string` | Sí | — | — | Nombre legible. | `src/modules/terminology/dto/search-value-sets.dto.ts:27` |
| `items[].canonicalUrl` | `string` | Sí | — | — | URL canónica FHIR del conjunto. | `src/modules/terminology/dto/search-value-sets.dto.ts:33` |
| `items[].description` | `string` | No | — | — | Descripción de qué agrupa. | `src/modules/terminology/dto/search-value-sets.dto.ts:39` |
| `items[].stateConceptId` | `string` | No | formato uuid | — | Estado del conjunto en el ciclo de vida de terminología. | `src/modules/terminology/dto/search-value-sets.dto.ts:45` |
| `items[].defaultVersionId` | `string` | No | formato uuid; admite null | — | Versión marcada por defecto, o `null` si todavía no hay ninguna. | `src/modules/terminology/dto/search-value-sets.dto.ts:51` |
| `items[].memberCount` | `number` | No | — | — | Conceptos incluidos en la versión vigente del conjunto | `src/modules/terminology/dto/search-value-sets.dto.ts:65` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página. | `src/modules/terminology/dto/search-value-sets.dto.ts:80` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/terminology/dto/search-value-sets.dto.ts:86` |
| `nextCursor` | `string` | No | admite null | — | Cursor opaco de continuación, o `null` si ésta es la última página. | `src/modules/terminology/dto/search-value-sets.dto.ts:92` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/glossary.int-spec.ts:70` |
| INTEGRACION | `test/integration/organization-legal-entity-type.int-spec.ts:113` |
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:475` |
| INTEGRACION | `test/integration/terminology.int-spec.ts:182` |
| CONTROLADOR | `src/modules/terminology/controllers/terminology-value-sets.controller.spec.ts:77` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyValueSetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /terminology/value-sets

- **Origen:** CONTRATO
- **Nombre:** UC-03-07: crea un conjunto de valores con versión y reglas
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyValueSetsController.createValueSet` — `src/modules/terminology/controllers/terminology-value-sets.controller.ts:80`

### Qué es y para qué sirve (negocio)

UC-03-07: crea un conjunto de valores con versión y reglas. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /terminology/value-sets` la atiende `TerminologyValueSetsController.createValueSet` (src/modules/terminology/controllers/terminology-value-sets.controller.ts:80). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateValueSetDto` (9 campos, 3 obligatorios). Delega en `ValueSetsService.createValueSet`. Crea filas en terminology.value_set_rules, terminology.value_set_versions, terminology.value_sets. Lee terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-value-sets.controller.ts:80` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.value_set_rules` | ESCRIBE | CREA | DIRECTA | TerminologyValueSetsController.createValueSet → ValueSetsService.createValueSet → ValueSetsRepository.createRule | `src/modules/terminology/repositories/value-sets.repository.ts:480` |
| `terminology.value_set_versions` | ESCRIBE | CREA | DIRECTA | TerminologyValueSetsController.createValueSet → ValueSetsService.createValueSet → ValueSetsRepository.createVersion | `src/modules/terminology/repositories/value-sets.repository.ts:465` |
| `terminology.value_sets` | ESCRIBE | CREA | DIRECTA | TerminologyValueSetsController.createValueSet → ValueSetsService.createValueSet → ValueSetsRepository.createValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:447` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | TerminologyValueSetsController.createValueSet → ValueSetsService.createValueSet → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Cuerpo — DTO `CreateValueSetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `internalCode` | `string` | Sí | longitud mínima 1; longitud máxima 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | Código interno único del conjunto de valores | `src/modules/terminology/dto/create-value-set.dto.ts:88` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | Nombre legible del conjunto de valores | `src/modules/terminology/dto/create-value-set.dto.ts:100` |
| `canonicalUrl` | `string` | Sí | longitud mínima 1 | `@IsString()` `@IsNotEmpty()` | URL canónica FHIR del conjunto de valores | `src/modules/terminology/dto/create-value-set.dto.ts:108` |
| `rules` | `array<ValueSetRuleInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ValueSetRuleInputDto)` | Reglas de composición | `src/modules/terminology/dto/create-value-set.dto.ts:121` |
| `rules[].codeSystemId` | `string` | No | formato uuid | `@IsUUID()` | Id del sistema de códigos referido por la regla | `src/modules/terminology/dto/create-value-set.dto.ts:27` |
| `rules[].operator` | `string` | No | valores: IN, IS_A | `@IsOptional()` `@IsIn(['IN', 'IS_A'])` | Operador de la regla | `src/modules/terminology/dto/create-value-set.dto.ts:38` |
| `rules[].property` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Propiedad sobre la que aplica la regla | `src/modules/terminology/dto/create-value-set.dto.ts:50` |
| `rules[].value` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Valor comparado por la regla | `src/modules/terminology/dto/create-value-set.dto.ts:62` |
| `rules[].included` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si la regla incluye (true) o excluye (false); por defecto true | `src/modules/terminology/dto/create-value-set.dto.ts:73` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "internalCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "canonicalUrl": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "internalCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "canonicalUrl": "valor-ejemplo",
  "rules": [
    {
      "codeSystemId": "00000000-0000-4000-8000-000000000001",
      "operator": "IN",
      "property": "valor-ejemplo",
      "value": "valor-ejemplo",
      "included": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<ValueSetResponseDto>` · DTO `ValueSetResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id del conjunto de valores creado | `src/modules/terminology/dto/create-value-set.dto.ts:130` |
| `versionId` | `string` | Sí | — | — | Id de la versión inicial creada | `src/modules/terminology/dto/create-value-set.dto.ts:136` |
| `rulesCount` | `number` | Sí | — | — | Número de reglas creadas | `src/modules/terminology/dto/create-value-set.dto.ts:142` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un conjunto de valores con ese código interno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/terminology.int-spec.ts:148` |
| CONTROLADOR | `src/modules/terminology/controllers/terminology-value-sets.controller.spec.ts:15` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyValueSetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. GET /terminology/value-sets/{id}/$expand

- **Origen:** CONTRATO
- **Nombre:** UC-03-08: lee la expansión vigente de un conjunto de valores
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyValueSetsController.readExpansion` — `src/modules/terminology/controllers/terminology-value-sets.controller.ts:218`

### Qué es y para qué sirve (negocio)

UC-03-08: lee la expansión vigente de un conjunto de valores. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /terminology/value-sets/{id}/$expand` la atiende `TerminologyValueSetsController.readExpansion` (src/modules/terminology/controllers/terminology-value-sets.controller.ts:218). Es una ruta pública: no exige token. Delega en `ValueSetsService.readExpansion`. Lee terminology.catalog_concepts, terminology.concept_properties, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/terminology/controllers/terminology-value-sets.controller.ts:218` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/terminology/controllers/terminology-value-sets.controller.ts:218` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_CATALOG_READ_THROTTLE) | `src/modules/terminology/controllers/terminology-value-sets.controller.ts:218` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyValueSetsController.readExpansion → ValueSetsService.readExpansion → CatalogConceptsRepository.findByIds | `src/modules/terminology/repositories/catalog-concepts.repository.ts:202` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | TerminologyValueSetsController.readExpansion → ValueSetsService.readExpansion → ConceptDesignationsRepository.findPropertiesForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:235` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | TerminologyValueSetsController.readExpansion → ValueSetsService.readExpansion → ValueSetsRepository.findMembersPage | `src/modules/terminology/repositories/value-sets.repository.ts:667` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | TerminologyValueSetsController.readExpansion → ValueSetsService.readExpansion → ValueSetsRepository.findVersionById | `src/modules/terminology/repositories/value-sets.repository.ts:619` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | TerminologyValueSetsController.readExpansion → ValueSetsService.readExpansion → ValueSetsRepository.findById | `src/modules/terminology/repositories/value-sets.repository.ts:112` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `valueSetVersionId` | query | No | `string` | Versión concreta a leer; por defecto la vigente |
| `cursor` | query | No | `string` | Cursor opaco devuelto por la página anterior |
| `limit` | query | No | `number` | Miembros por página (por defecto 50) |
| `includeProperties` | query | No | `boolean` | Trae también las propiedades de cada concepto. Opt-in: hay catálogos cuyo dato útil vive ahí (el nomenclador guarda especialidad, precio y unidad como propiedades). |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReadValueSetExpansionResponseDto>` · DTO `ReadValueSetExpansionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `valueSetId` | `string` | Sí | formato uuid | — | Id del conjunto de valores | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:90` |
| `valueSetVersionId` | `string` | Sí | formato uuid | — | Id de la versión leída | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:96` |
| `version` | `string` | Sí | — | — | Etiqueta de la versión | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:102` |
| `items` | `array<ValueSetExpansionItemDto>` | Sí | — | — | Miembros de esta página. | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:108` |
| `items[].conceptId` | `string` | Sí | formato uuid | — | Valor a enviar en los campos `*ConceptId` del contrato | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:18` |
| `items[].code` | `string` | Sí | — | — | Código del concepto | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:24` |
| `items[].display` | `string` | Sí | — | — | Denominación principal | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:30` |
| `items[].definition` | `string` | No | — | — | Definición del concepto | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:36` |
| `items[].selectable` | `boolean` | No | — | — | Si el concepto puede seleccionarse | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:42` |
| `items[].codeSystemVersionId` | `string` | Sí | formato uuid | — | Versión del sistema de códigos | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:51` |
| `items[].ordinal` | `number` | No | — | — | Posición del miembro dentro de la expansión | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:59` |
| `items[].properties` | `object` | No | — | — | Propiedades del concepto; sólo con includeProperties=true | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:81` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:114` |
| `limit` | `number` | Sí | — | — | Tope de resultados aplicado | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:120` |
| `nextCursor` | `string` | No | admite null | — | Cursor opaco para pedir la página siguiente | `src/modules/terminology/dto/read-value-set-expansion.dto.ts:133` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conjunto de valores no encontrado; ResourceNotFoundException: Versión del conjunto de valores no encontrada / El conjunto de valores no tiene una versión vigente |
| 409 | `CONFLICT` | ConflictException: La versión no pertenece a ese conjunto de valores |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx6-nomenclador-en-lote.int-spec.ts:61` |
| INTEGRACION | `test/integration/organization-legal-entity-type.int-spec.ts:119` |
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:487` |
| INTEGRACION | `test/integration/terminology.int-spec.ts:193` |
| CONTROLADOR | `src/modules/terminology/controllers/terminology-value-sets.controller.spec.ts:26` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyValueSetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. GET /terminology/value-sets/$glossary-facets

- **Origen:** CONTRATO
- **Nombre:** Facetas del glosario: conteo por categoría y etiqueta
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyValueSetsController.readGlossaryFacets` — `src/modules/terminology/controllers/terminology-value-sets.controller.ts:183`

### Qué es y para qué sirve (negocio)

Facetas del glosario: conteo por categoría y etiqueta. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /terminology/value-sets/$glossary-facets` la atiende `TerminologyValueSetsController.readGlossaryFacets` (src/modules/terminology/controllers/terminology-value-sets.controller.ts:183). Es una ruta pública: no exige token. Delega en `ValueSetsService.readGlossaryFacets`. Lee terminology.catalog_concepts, terminology.concept_designations, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/terminology/controllers/terminology-value-sets.controller.ts:183` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_CATALOG_READ_THROTTLE) | `src/modules/terminology/controllers/terminology-value-sets.controller.ts:183` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | TerminologyValueSetsController.readGlossaryFacets → ValueSetsService.readGlossaryFacets → ValueSetsRepository.findGlossaryFacets | `src/modules/terminology/repositories/value-sets.repository.ts:265` |
| `terminology.concept_designations` | LEE | LEE | POR_SQL | TerminologyValueSetsController.readGlossaryFacets → ValueSetsService.readGlossaryFacets → ValueSetsRepository.findGlossaryFacets | `src/modules/terminology/repositories/value-sets.repository.ts:265` |
| `terminology.value_set_members` | LEE | LEE | POR_SQL | TerminologyValueSetsController.readGlossaryFacets → ValueSetsService.readGlossaryFacets → ValueSetsRepository.findGlossaryFacets | `src/modules/terminology/repositories/value-sets.repository.ts:265` |
| `terminology.value_set_versions` | LEE | LEE | POR_SQL | TerminologyValueSetsController.readGlossaryFacets → ValueSetsService.readGlossaryFacets → ValueSetsRepository.findGlossaryFacets | `src/modules/terminology/repositories/value-sets.repository.ts:265` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | TerminologyValueSetsController.readGlossaryFacets → ValueSetsService.readGlossaryFacets → ValueSetsRepository.findByIds | `src/modules/terminology/repositories/value-sets.repository.ts:333` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<GlossaryFacetsResponseDto>` · DTO `GlossaryFacetsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `categories` | `array<GlossaryFacetCategoryDto>` | Sí | — | — | Las categorías con al menos un término publicado. | `src/modules/terminology/dto/glossary-facets.dto.ts:63` |
| `categories[].id` | `string` | Sí | formato uuid | — | Identificador del conjunto de valores de la categoría. | `src/modules/terminology/dto/glossary-facets.dto.ts:26` |
| `categories[].internalCode` | `string` | Sí | — | — | Código interno estable, como `glossary-category-pharmacology`. | `src/modules/terminology/dto/glossary-facets.dto.ts:30` |
| `categories[].name` | `string` | Sí | — | — | Nombre legible. | `src/modules/terminology/dto/glossary-facets.dto.ts:34` |
| `categories[].description` | `string` | No | — | — | Qué agrupa, si el catálogo lo declara. | `src/modules/terminology/dto/glossary-facets.dto.ts:38` |
| `categories[].count` | `number` | Sí | — | — | Términos publicados de la categoría. | `src/modules/terminology/dto/glossary-facets.dto.ts:42` |
| `categories[].translatedCount` | `number` | Sí | — | — | Cuántos de ellos tienen nombre en castellano. Una categoría puede sumar miles de nombres oficiales en inglés: el total solo engaña. | `src/modules/terminology/dto/glossary-facets.dto.ts:49` |
| `categories[].tags` | `array<GlossaryFacetTagDto>` | Sí | — | — | Etiquetas que llevan sus términos, de la más frecuente a la menos. | `src/modules/terminology/dto/glossary-facets.dto.ts:53` |
| `categories[].tags[].id` | `string` | Sí | formato uuid | — | Identificador del conjunto de valores de la etiqueta. | `src/modules/terminology/dto/glossary-facets.dto.ts:7` |
| `categories[].tags[].internalCode` | `string` | Sí | — | — | Código interno estable, como `glossary-tag-cardiovascular`. | `src/modules/terminology/dto/glossary-facets.dto.ts:11` |
| `categories[].tags[].name` | `string` | Sí | — | — | Nombre legible. | `src/modules/terminology/dto/glossary-facets.dto.ts:15` |
| `categories[].tags[].count` | `number` | Sí | — | — | Términos publicados que la llevan (en la categoría, dentro de una categoría). | `src/modules/terminology/dto/glossary-facets.dto.ts:19` |
| `tags` | `array<GlossaryFacetTagDto>` | Sí | — | — | Las etiquetas con al menos un término publicado, en todo el glosario. | `src/modules/terminology/dto/glossary-facets.dto.ts:67` |
| `tags[].id` | `string` | Sí | formato uuid | — | Identificador del conjunto de valores de la etiqueta. | `src/modules/terminology/dto/glossary-facets.dto.ts:7` |
| `tags[].internalCode` | `string` | Sí | — | — | Código interno estable, como `glossary-tag-cardiovascular`. | `src/modules/terminology/dto/glossary-facets.dto.ts:11` |
| `tags[].name` | `string` | Sí | — | — | Nombre legible. | `src/modules/terminology/dto/glossary-facets.dto.ts:15` |
| `tags[].count` | `number` | Sí | — | — | Términos publicados que la llevan (en la categoría, dentro de una categoría). | `src/modules/terminology/dto/glossary-facets.dto.ts:19` |
| `total` | `number` | Sí | — | — | Términos publicados en todo el glosario (miembros del paraguas). | `src/modules/terminology/dto/glossary-facets.dto.ts:71` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Terminology module — etapa `ctrl:TerminologyValueSetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /terminology/ValueSet/{id}/$expand

- **Origen:** CONTRATO
- **Nombre:** UC-03-08: materializa los miembros de la expansión
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyFhirController.expandValueSet` — `src/modules/terminology/controllers/terminology-fhir.controller.ts:71`

### Qué es y para qué sirve (negocio)

UC-03-08: materializa los miembros de la expansión. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /terminology/ValueSet/{id}/$expand` la atiende `TerminologyFhirController.expandValueSet` (src/modules/terminology/controllers/terminology-fhir.controller.ts:71). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ExpandValueSetDto` (3 campos, 1 obligatorio). Delega en `ValueSetsService.expandValueSet`. Crea filas en terminology.value_set_members. Actualiza terminology.value_set_versions. Borra de terminology.value_set_members. Lee terminology.catalog_concepts, terminology.code_system_versions, terminology.concept_properties, terminology.concept_relationships, terminology.value_set_rules, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-fhir.controller.ts:71` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/terminology/controllers/terminology-fhir.controller.ts:71` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyFhirController.expandValueSet → ValueSetsService.expandValueSet → ValueSetsService.evaluateRules → ValueSetsService.evaluateRule → CatalogConceptsRepository.findByVersion | `src/modules/terminology/repositories/catalog-concepts.repository.ts:151` |
| `terminology.code_system_versions` | LEE | LEE | DIRECTA | TerminologyFhirController.expandValueSet → ValueSetsService.expandValueSet → ValueSetsService.evaluateRules → ValueSetsService.evaluateRule → CodeSystemVersionsRepository.findDefaultActiveVersion | `src/modules/terminology/repositories/code-system-versions.repository.ts:65` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | TerminologyFhirController.expandValueSet → ValueSetsService.expandValueSet → ValueSetsService.evaluateRules → ValueSetsService.evaluateRule → ValueSetsService.matchProperty → ConceptDesignationsRepository.findPropertyForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:200` |
| `terminology.concept_relationships` | LEE | LEE | DIRECTA | TerminologyFhirController.expandValueSet → ValueSetsService.expandValueSet → ValueSetsService.evaluateRules → ValueSetsService.evaluateRule → ValueSetsService.matchIsA → ConceptRelationshipsRepository.findByTypeForSources | `src/modules/terminology/repositories/concept-relationships.repository.ts:106` |
| `terminology.value_set_members` | BORRA | BORRA | DIRECTA | TerminologyFhirController.expandValueSet → ValueSetsService.expandValueSet → ValueSetsRepository.deleteMembersByVersion | `src/modules/terminology/repositories/value-sets.repository.ts:546` |
| `terminology.value_set_members` | ESCRIBE | CREA | DIRECTA | TerminologyFhirController.expandValueSet → ValueSetsService.expandValueSet → ValueSetsRepository.createMember | `src/modules/terminology/repositories/value-sets.repository.ts:575` |
| `terminology.value_set_rules` | LEE | LEE | DIRECTA | TerminologyFhirController.expandValueSet → ValueSetsService.expandValueSet → ValueSetsRepository.findRulesByVersion | `src/modules/terminology/repositories/value-sets.repository.ts:534` |
| `terminology.value_set_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | TerminologyFhirController.expandValueSet → ValueSetsService.expandValueSet | `src/modules/terminology/services/value-sets.service.ts:438` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | TerminologyFhirController.expandValueSet → ValueSetsService.expandValueSet → ValueSetsRepository.findVersionForUpdate | `src/modules/terminology/repositories/value-sets.repository.ts:506` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | TerminologyFhirController.expandValueSet → ValueSetsService.expandValueSet → ValueSetsRepository.findById | `src/modules/terminology/repositories/value-sets.repository.ts:112` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ExpandValueSetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `valueSetVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión del conjunto de valores a expandir | `src/modules/terminology/dto/expand-value-set.dto.ts:20` |
| `activate` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Activa la versión al expandirla (draft -> active) | `src/modules/terminology/dto/expand-value-set.dto.ts:31` |
| `makeDefault` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca la versión como la vigente por defecto del conjunto | `src/modules/terminology/dto/expand-value-set.dto.ts:42` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "valueSetVersionId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "valueSetVersionId": "00000000-0000-4000-8000-000000000001",
  "activate": true,
  "makeDefault": false
}
```

</details>

### Respuesta — `Promise<ExpandValueSetResponseDto>` · DTO `ExpandValueSetResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `valueSetId` | `string` | Sí | — | — | Id del conjunto de valores | `src/modules/terminology/dto/expand-value-set.dto.ts:51` |
| `valueSetVersionId` | `string` | Sí | — | — | Id de la versión expandida | `src/modules/terminology/dto/expand-value-set.dto.ts:57` |
| `stateConceptId` | `string` | Sí | — | — | Estado en el que queda la versión | `src/modules/terminology/dto/expand-value-set.dto.ts:63` |
| `rulesEvaluated` | `number` | Sí | — | — | Reglas evaluadas | `src/modules/terminology/dto/expand-value-set.dto.ts:69` |
| `includedMembers` | `number` | Sí | — | — | Conceptos incluidos en la expansión | `src/modules/terminology/dto/expand-value-set.dto.ts:75` |
| `replacedMembers` | `number` | Sí | — | — | Miembros de la expansión anterior que se reemplazaron | `src/modules/terminology/dto/expand-value-set.dto.ts:83` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conjunto de valores no encontrado; ResourceNotFoundException: Versión del conjunto de valores no encontrada |
| 409 | `CONFLICT` | ConflictException: La versión no pertenece a ese conjunto de valores |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se expanden versiones en borrador o activas |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/terminology/controllers/terminology-fhir.controller.spec.ts:36` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyFhirController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /terminology/versions/{versionId}/import

- **Origen:** CONTRATO
- **Nombre:** UC-03-03: importa conceptos en una versión en borrador
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyVersionsController.importConcepts` — `src/modules/terminology/controllers/terminology-versions.controller.ts:78`

### Qué es y para qué sirve (negocio)

UC-03-03: importa conceptos en una versión en borrador. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /terminology/versions/{versionId}/import` la atiende `TerminologyVersionsController.importConcepts` (src/modules/terminology/controllers/terminology-versions.controller.ts:78). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ImportConceptsDto` (4 campos, 3 obligatorios). Delega en `CodeSystemVersionsService.importConcepts`. Crea filas en terminology.catalog_concepts. Lee terminology.catalog_concepts, terminology.code_system_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-versions.controller.ts:78` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId | `src/modules/terminology/controllers/terminology-versions.controller.ts:78` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | ESCRIBE | CREA | DIRECTA | TerminologyVersionsController.importConcepts → CodeSystemVersionsService.importConcepts → CatalogConceptsRepository.create | `src/modules/terminology/repositories/catalog-concepts.repository.ts:98` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyVersionsController.importConcepts → CodeSystemVersionsService.importConcepts → CatalogConceptsRepository.findExistingCodes | `src/modules/terminology/repositories/catalog-concepts.repository.ts:88` |
| `terminology.code_system_versions` | LEE | LEE | DIRECTA | TerminologyVersionsController.importConcepts → CodeSystemVersionsService.importConcepts → CodeSystemVersionsRepository.findById | `src/modules/terminology/repositories/code-system-versions.repository.ts:40` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `ImportConceptsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `concepts` | `array<ImportConceptItemDto>` | Sí | — | `@IsArray()` `@ArrayNotEmpty()` `@ValidateNested({ each: true })` `@Type(() => ImportConceptItemDto)` | Conceptos a importar | `src/modules/terminology/dto/import-concepts.dto.ts:61` |
| `concepts[].code` | `string` | Sí | longitud mínima 1; longitud máxima 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | Código del concepto dentro de la versión | `src/modules/terminology/dto/import-concepts.dto.ts:25` |
| `concepts[].display` | `string` | Sí | longitud mínima 1; longitud máxima 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | Texto de presentación del concepto | `src/modules/terminology/dto/import-concepts.dto.ts:37` |
| `concepts[].definition` | `string` | No | — | `@IsOptional()` `@IsString()` | Definición larga del concepto | `src/modules/terminology/dto/import-concepts.dto.ts:45` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "concepts": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "concepts": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "definition": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<ImportConceptsResponseDto>` · DTO `ImportConceptsResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `inserted` | `number` | Sí | — | — | Conceptos insertados | `src/modules/terminology/dto/import-concepts.dto.ts:70` |
| `skipped` | `number` | Sí | — | — | Conceptos omitidos por existir ya en la versión | `src/modules/terminology/dto/import-concepts.dto.ts:78` |
| `total` | `number` | Sí | — | — | Conceptos recibidos en la petición | `src/modules/terminology/dto/import-concepts.dto.ts:84` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se puede importar en una versión que no está en borrador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/terminology.int-spec.ts:83` |
| CONTROLADOR | `src/modules/terminology/controllers/terminology-versions.controller.spec.ts:29` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyVersionsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /terminology/versions/{versionId}/import-file

- **Origen:** CONTRATO
- **Nombre:** UC-03-03: importa filas desde un archivo, o las valida sin escribir
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyVersionsController.importConceptsFile` — `src/modules/terminology/controllers/terminology-versions.controller.ts:118`

### Qué es y para qué sirve (negocio)

UC-03-03: importa filas desde un archivo, o las valida sin escribir. Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /terminology/versions/{versionId}/import-file` la atiende `TerminologyVersionsController.importConceptsFile` (src/modules/terminology/controllers/terminology-versions.controller.ts:118). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ConceptFileImportService.importFromFile`. Crea filas en terminology.catalog_concepts, terminology.catalog_import_batches. Actualiza terminology.catalog_import_batches. Lee terminology.catalog_concepts, terminology.catalog_import_batches, terminology.code_system_versions, terminology.code_systems.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-versions.controller.ts:118` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId | `src/modules/terminology/controllers/terminology-versions.controller.ts:118` |
| CUERPO | multipart/form-data (obligatorio); el tamaño del archivo lo define la ruta, no el límite global | `contrato (requestBody)` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | ESCRIBE | CREA | DIRECTA | TerminologyVersionsController.importConceptsFile → ConceptFileImportService.importFromFile → ConceptFileImportService.write → CatalogConceptsRepository.create | `src/modules/terminology/repositories/catalog-concepts.repository.ts:98` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyVersionsController.importConceptsFile → ConceptFileImportService.importFromFile → ConceptFileImportService.write → CatalogConceptsRepository.findExistingCodes | `src/modules/terminology/repositories/catalog-concepts.repository.ts:88` |
| `terminology.catalog_import_batches` | ESCRIBE | CREA | DIRECTA | TerminologyVersionsController.importConceptsFile → ConceptFileImportService.importFromFile → ConceptFileImportService.openBatch | `src/modules/terminology/services/concept-file-import.service.ts:518` |
| `terminology.catalog_import_batches` | ESCRIBE | ACTUALIZA | POR_TIPO | TerminologyVersionsController.importConceptsFile → ConceptFileImportService.importFromFile → ConceptFileImportService.closeBatch | `src/modules/terminology/services/concept-file-import.service.ts:557` |
| `terminology.catalog_import_batches` | LEE | LEE | DIRECTA | TerminologyVersionsController.importConceptsFile → ConceptFileImportService.importFromFile → ConceptFileImportService.closeBatch | `src/modules/terminology/services/concept-file-import.service.ts:554` |
| `terminology.code_system_versions` | LEE | LEE | DIRECTA | TerminologyVersionsController.importConceptsFile → ConceptFileImportService.importFromFile → ConceptFileImportService.requireVersionInDraft → CodeSystemVersionsRepository.findById | `src/modules/terminology/repositories/code-system-versions.repository.ts:40` |
| `terminology.code_systems` | LEE | LEE | DIRECTA | TerminologyVersionsController.importConceptsFile → ConceptFileImportService.importFromFile → ConceptFileImportService.requireVersionInDraft → CodeSystemsRepository.findById | `src/modules/terminology/repositories/code-systems.repository.ts:48` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO (no identificado) · `multipart/form-data`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `file` | `string` | Sí | formato binary | — | — | sin fuente |
| `dryRun` | `boolean` | No | — | — | — | sin fuente |
| `profile` | `string` | No | — | — | — | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "file": "<contenido-binario>"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "file": "<contenido-binario>",
  "dryRun": false,
  "profile": "conceptos"
}
```

</details>

### Respuesta — `Promise<ImportConceptsFileResponseDto>` · DTO `ImportConceptsFileResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `batchId` | `object` | Sí | formato uuid; admite null | — | Lote de importación registrado; nulo si no se escribió nada | `src/modules/terminology/dto/import-concepts-file.dto.ts:110` |
| `format` | `string` | Sí | valores: ndjson, csv, xlsx | — | Formato reconocido en el contenido del archivo | `src/modules/terminology/dto/import-concepts-file.dto.ts:117` |
| `profile` | `string` | Sí | — | — | Perfil con el que se leyeron las columnas | `src/modules/terminology/dto/import-concepts-file.dto.ts:121` |
| `dryRun` | `boolean` | Sí | — | — | La importación fue una validación sin escribir | `src/modules/terminology/dto/import-concepts-file.dto.ts:127` |
| `aborted` | `boolean` | Sí | — | — | El archivo se rechazó entero por tener errores | `src/modules/terminology/dto/import-concepts-file.dto.ts:138` |
| `totalRead` | `number` | Sí | — | — | Filas con contenido leídas | `src/modules/terminology/dto/import-concepts-file.dto.ts:142` |
| `inserted` | `number` | Sí | — | — | Conceptos creados | `src/modules/terminology/dto/import-concepts-file.dto.ts:146` |
| `skipped` | `number` | Sí | — | — | Códigos que ya existían en la versión | `src/modules/terminology/dto/import-concepts-file.dto.ts:150` |
| `errors` | `number` | Sí | — | — | Problemas encontrados | `src/modules/terminology/dto/import-concepts-file.dto.ts:154` |
| `errorSamples` | `array<ImportFileIssueDto>` | Sí | — | — | Primeros errores encontrados, como muestra | `src/modules/terminology/dto/import-concepts-file.dto.ts:167` |
| `errorSamples[].line` | `number` | Sí | — | — | Fila del archivo, empezando en 1 | `src/modules/terminology/dto/import-concepts-file.dto.ts:65` |
| `errorSamples[].column` | `string` | No | — | — | Columna con el problema, si es de una | `src/modules/terminology/dto/import-concepts-file.dto.ts:74` |
| `errorSamples[].message` | `string` | Sí | — | — | Motivo por el que la fila se descartó | `src/modules/terminology/dto/import-concepts-file.dto.ts:78` |
| `preview` | `array<ImportPreviewRowDto>` | No | — | — | Primeras filas válidas, en una validación sin escribir. Cada fila lleva `line` más una clave por columna del perfil: para `conceptos`, `code`, `display` y `definition` | `src/modules/terminology/dto/import-concepts-file.dto.ts:184` |
| `preview[].line` | `number` | No | — | — | Fila del archivo, empezando en 1 | `src/modules/terminology/dto/import-concepts-file.dto.ts:93` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: El sistema de codificación de la versión no existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el archivo; PreconditionFailedException: Solo se puede importar en una versión en borrador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportFileRejectedException: {ErrorCode.IMPORT_PROFILE_UNKNOWN}; ImportFileRejectedException: {ErrorCode.IMPORT_EMPTY_FILE}; ImportFileRejectedException: {ErrorCode.IMPORT_FORMAT_UNSUPPORTED} |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/terminology/concept-file-import.int-spec.ts:107` |
| CONTROLADOR | `src/modules/terminology/controllers/terminology-versions.controller.spec.ts:78` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyVersionsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /terminology/versions/{versionId}/publish

- **Origen:** CONTRATO
- **Nombre:** UC-03-04: publica una versión (borrador → activa)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TerminologyVersionsController.publishVersion` — `src/modules/terminology/controllers/terminology-versions.controller.ts:198`

### Qué es y para qué sirve (negocio)

UC-03-04: publica una versión (borrador → activa). Dentro del módulo (descripción del modelo, en inglés): «A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_03_terminology.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /terminology/versions/{versionId}/publish` la atiende `TerminologyVersionsController.publishVersion` (src/modules/terminology/controllers/terminology-versions.controller.ts:198). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `CodeSystemVersionsService.publishVersion`. Actualiza terminology.catalog_concepts, terminology.code_system_versions. Lee terminology.catalog_concepts, terminology.code_system_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/terminology/controllers/terminology-versions.controller.ts:198` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId | `src/modules/terminology/controllers/terminology-versions.controller.ts:198` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | ESCRIBE | ACTUALIZA | POR_TIPO | TerminologyVersionsController.publishVersion → CodeSystemVersionsService.publishVersion | `src/modules/terminology/services/code-system-versions.service.ts:189` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TerminologyVersionsController.publishVersion → CodeSystemVersionsService.publishVersion → CatalogConceptsRepository.findPromotableByVersion | `src/modules/terminology/repositories/catalog-concepts.repository.ts:180` |
| `terminology.code_system_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | TerminologyVersionsController.publishVersion → CodeSystemVersionsService.publishVersion | `src/modules/terminology/services/code-system-versions.service.ts:175` |
| `terminology.code_system_versions` | LEE | LEE | DIRECTA | TerminologyVersionsController.publishVersion → CodeSystemVersionsService.publishVersion → CodeSystemVersionsRepository.findById | `src/modules/terminology/repositories/code-system-versions.repository.ts:40` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublishVersionResponseDto>` · DTO `PublishVersionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id de la versión publicada | `src/modules/terminology/dto/publish-version.dto.ts:9` |
| `state` | `string` | Sí | — | — | Estado del ciclo de vida tras la publicación (código de concepto) | `src/modules/terminology/dto/publish-version.dto.ts:18` |
| `publishedAt` | `string` | Sí | formato date-time | — | Instante de publicación | `src/modules/terminology/dto/publish-version.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada |
| 409 | `CONFLICT` | ConflictException: La versión ya está publicada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se puede publicar una versión en borrador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/terminology.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/terminology.int-spec.ts:106` |
| CONTROLADOR | `src/modules/terminology/controllers/terminology-versions.controller.spec.ts:44` |

### Flujos

- Terminology module — etapa `ctrl:TerminologyVersionsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

