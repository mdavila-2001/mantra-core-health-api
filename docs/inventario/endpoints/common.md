<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `common`

- **Bloque:** Núcleo y Terminología (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)
- **Operaciones:** 15 (15 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 10 · MEDIO 1 · BAJO 4
- **Tablas distintas que tocan:** 7
- **Respuestas de error y detalle contractual:** `openapi/endpoints/common.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/common/addresses` | Registrar una dirección (UC-02-04) | ALTO | 1 | sesión (sin roles) |
| 2 | POST | `/common/contact-points` | Registrar un punto de contacto (UC-02-02) | ALTO | 1 | sesión (sin roles) |
| 3 | POST | `/common/contact-points/{id}/verify` | Verificar un punto de contacto (UC-02-03) | ALTO | 2 | sesión (sin roles) |
| 4 | POST | `/common/files` | Crear un archivo con su versión inicial (UC-02-05) | ALTO | 2 | sesión (sin roles) |
| 5 | DELETE | `/common/files/{id}` | Borrar lógicamente un archivo (UC-02-10) | ALTO | 2 | sesión (sin roles) |
| 6 | GET | `/common/files/{id}/content` | Descargar el contenido vigente de un archivo | BAJO | 2 | sesión (sin roles) |
| 7 | POST | `/common/files/{id}/download-url` | Emitir una URL de descarga firmada (UC-02-11) | BAJO | 2 | sesión (sin roles) |
| 8 | POST | `/common/files/{id}/links` | Vincular un archivo a un propietario (UC-02-08) | ALTO | 2 | sesión (sin roles) |
| 9 | POST | `/common/files/{id}/versions` | Añadir una versión a un archivo (UC-02-06) | ALTO | 4 | sesión (sin roles) |
| 10 | POST | `/common/files/{id}/versions/{vid}/derivatives` | Generar un derivado de una versión (UC-02-07) | ALTO | 3 | sesión (sin roles) |
| 11 | GET | `/common/files/links` | Listar los archivos adjuntos a un recurso (UC-02-08) | BAJO | 2 | sesión (sin roles) |
| 12 | POST | `/common/files/upload` | Subir el contenido de un archivo (multipart) | ALTO | 2 | sesión (sin roles) |
| 13 | POST | `/common/identifiers` | Registrar un identificador oficial (UC-02-01) | ALTO | 2 | sesión (sin roles) |
| 14 | POST | `/internal/files/versions/{vid}/scan-result` | Registrar resultado de escaneo antimalware (UC-02-09) | MEDIO | 2 | SYSTEM, SECURITY_ADMIN |
| 15 | GET | `/internal/files/versions/pending-scan` | Listar versiones pendientes de escaneo antimalware | BAJO | 1 | SYSTEM, SECURITY_ADMIN |

---

## 1. POST /common/addresses

- **Origen:** CONTRATO
- **Nombre:** Registrar una dirección (UC-02-04)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommonAddressesController.create` — `src/modules/common/controllers/common-addresses.controller.ts:21`

### Qué es y para qué sirve (negocio)

Registrar una dirección (UC-02-04). Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /common/addresses` la atiende `CommonAddressesController.create` (src/modules/common/controllers/common-addresses.controller.ts:21). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateAddressDto` (11 campos, 3 obligatorios). Delega en `AddressesService.create`. Crea filas en common.addresses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/common/controllers/common-addresses.controller.ts:21` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | ESCRIBE | CREA | DIRECTA | CommonAddressesController.create → AddressesService.create → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:118` |

### Cuerpo — DTO `CreateAddressDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT | `@IsEnum(OwnerType)` | — | `src/modules/common/dto/addresses.dto.ts:23` |
| `ownerId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/common/dto/addresses.dto.ts:30` |
| `lines` | `array<string>` | Sí | — | `@IsArray()` `@ArrayNotEmpty()` `@IsString({ each: true })` | Líneas de la dirección. | `src/modules/common/dto/addresses.dto.ts:39` |
| `city` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/common/dto/addresses.dto.ts:48` |
| `municipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/common/dto/addresses.dto.ts:57` |
| `administrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/common/dto/addresses.dto.ts:65` |
| `postalCode` | `string` | No | longitud máxima 32 | `@IsOptional()` `@IsString()` `@MaxLength(32)` | — | `src/modules/common/dto/addresses.dto.ts:74` |
| `country` | `string` | No | longitud máxima 2 | `@IsOptional()` `@IsString()` `@MaxLength(2)` | Código de país ISO. Por defecto 'BO'. | `src/modules/common/dto/addresses.dto.ts:83` |
| `use` | `string` | No | valores: HOME, WORK | `@IsOptional()` `@IsEnum(ContactUse)` | — | `src/modules/common/dto/addresses.dto.ts:91` |
| `latitude` | `number` | No | mínimo -90; máximo 90 | `@IsOptional()` `@IsNumber()` `@Min(-90)` `@Max(90)` | Latitud geográfica | `src/modules/common/dto/addresses.dto.ts:109` |
| `longitude` | `number` | No | mínimo -180; máximo 180 | `@IsOptional()` `@IsNumber()` `@Min(-180)` `@Max(180)` | Longitud geográfica | `src/modules/common/dto/addresses.dto.ts:121` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    "valor-ejemplo"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    "valor-ejemplo"
  ],
  "city": "valor-ejemplo",
  "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "administrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "postalCode": "CODIGO_EJEMPLO",
  "country": "BO",
  "use": "HOME",
  "latitude": 1,
  "longitude": 1
}
```

</details>

### Respuesta — `Promise<AddressResponseDto>` · DTO `AddressResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/addresses.dto.ts:130` |
| `ownerId` | `string` | Sí | formato uuid | — | Identificador asociado a owner. | `src/modules/common/dto/addresses.dto.ts:136` |
| `ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT | — | Valor de owner type mantenido por la instancia. | `src/modules/common/dto/addresses.dto.ts:142` |
| `lines` | `array<string>` | Sí | — | — | Valor de lines mantenido por la instancia. | `src/modules/common/dto/addresses.dto.ts:148` |
| `city` | `string` | No | — | — | Valor de city mantenido por la instancia. | `src/modules/common/dto/addresses.dto.ts:154` |
| `municipalityConceptId` | `string` | No | formato uuid | — | Municipio boliviano, miembro de `VS_BO_MUNICIPALITY`. | `src/modules/common/dto/addresses.dto.ts:160` |
| `administrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento boliviano, miembro de `VS_BO_DEPARTMENT`. | `src/modules/common/dto/addresses.dto.ts:166` |
| `postalCode` | `string` | No | — | — | Valor de postal code mantenido por la instancia. | `src/modules/common/dto/addresses.dto.ts:172` |
| `country` | `string` | Sí | — | — | Código de país. | `src/modules/common/dto/addresses.dto.ts:178` |
| `latitude` | `number` | No | — | — | Latitud del punto, si se cargó. | `src/modules/common/dto/addresses.dto.ts:182` |
| `longitude` | `number` | No | — | — | Longitud del punto, si se cargó. | `src/modules/common/dto/addresses.dto.ts:186` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/addresses.dto.ts:192` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/common.int-spec.ts:92` |
| CONTROLADOR | `src/modules/common/controllers/common-addresses.controller.spec.ts:20` |

### Flujos

- Common module — etapa `ctrl:CommonAddressesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /common/contact-points

- **Origen:** CONTRATO
- **Nombre:** Registrar un punto de contacto (UC-02-02)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommonContactPointsController.create` — `src/modules/common/controllers/common-contact-points.controller.ts:33`

### Qué es y para qué sirve (negocio)

Registrar un punto de contacto (UC-02-02). Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /common/contact-points` la atiende `CommonContactPointsController.create` (src/modules/common/controllers/common-contact-points.controller.ts:33). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateContactPointDto` (6 campos, 4 obligatorios). Delega en `ContactPointsService.create`. Crea filas en common.contact_points.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/common/controllers/common-contact-points.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | CommonContactPointsController.create → ContactPointsService.create → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:135` |

### Cuerpo — DTO `CreateContactPointDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT | `@IsEnum(OwnerType)` | — | `src/modules/common/dto/contact-points.dto.ts:20` |
| `ownerId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/common/dto/contact-points.dto.ts:27` |
| `system` | `string` | Sí | valores: EMAIL, PHONE | `@IsEnum(ContactSystem)` | — | `src/modules/common/dto/contact-points.dto.ts:34` |
| `value` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | Correo o teléfono según el sistema. | `src/modules/common/dto/contact-points.dto.ts:42` |
| `use` | `string` | No | valores: HOME, WORK | `@IsOptional()` `@IsEnum(ContactUse)` | — | `src/modules/common/dto/contact-points.dto.ts:50` |
| `rank` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden de preferencia. | `src/modules/common/dto/contact-points.dto.ts:59` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "system": "EMAIL",
  "value": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "system": "EMAIL",
  "value": "valor-ejemplo",
  "use": "HOME",
  "rank": 1
}
```

</details>

### Respuesta — `Promise<ContactPointResponseDto>` · DTO `ContactPointResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/contact-points.dto.ts:83` |
| `ownerId` | `string` | Sí | formato uuid | — | Identificador asociado a owner. | `src/modules/common/dto/contact-points.dto.ts:89` |
| `ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT | — | Valor de owner type mantenido por la instancia. | `src/modules/common/dto/contact-points.dto.ts:95` |
| `system` | `string` | Sí | valores: EMAIL, PHONE | — | Valor de system mantenido por la instancia. | `src/modules/common/dto/contact-points.dto.ts:101` |
| `value` | `string` | Sí | — | — | Valor de value mantenido por la instancia. | `src/modules/common/dto/contact-points.dto.ts:107` |
| `verified` | `boolean` | Sí | — | — | Valor de verified mantenido por la instancia. | `src/modules/common/dto/contact-points.dto.ts:113` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/contact-points.dto.ts:119` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/common.int-spec.ts:72` |
| CONTROLADOR | `src/modules/common/controllers/common-contact-points.controller.spec.ts:31` |

### Flujos

- Common module — etapa `ctrl:CommonContactPointsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /common/contact-points/{id}/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar un punto de contacto (UC-02-03)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommonContactPointsController.verify` — `src/modules/common/controllers/common-contact-points.controller.ts:44`

### Qué es y para qué sirve (negocio)

Verificar un punto de contacto (UC-02-03). Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /common/contact-points/{id}/verify` la atiende `CommonContactPointsController.verify` (src/modules/common/controllers/common-contact-points.controller.ts:44). Exige sesión; el controlador no declara roles. Valida el cuerpo como `VerifyContactPointDto` (1 campo, 0 obligatorios). Delega en `ContactPointsService.verify`. Actualiza common.contact_points. Lee common.contact_points.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/common/controllers/common-contact-points.controller.ts:44` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/common/controllers/common-contact-points.controller.ts:44` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.contact_points` | ESCRIBE | ACTUALIZA | POR_TIPO | CommonContactPointsController.verify → ContactPointsService.verify | `src/modules/common/services/contact-points.service.ts:105` |
| `common.contact_points` | LEE | LEE | DIRECTA | CommonContactPointsController.verify → ContactPointsService.verify → ContactPointsRepository.findById | `src/modules/common/repositories/contact-points.repository.ts:48` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `VerifyContactPointDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | No | longitud máxima 32 | `@IsOptional()` `@IsString()` `@MaxLength(32)` | Código de verificación (OTP). En esta implementación se acepta cualquiera. | `src/modules/common/dto/contact-points.dto.ts:74` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<ContactPointResponseDto>` · DTO `ContactPointResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/contact-points.dto.ts:83` |
| `ownerId` | `string` | Sí | formato uuid | — | Identificador asociado a owner. | `src/modules/common/dto/contact-points.dto.ts:89` |
| `ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT | — | Valor de owner type mantenido por la instancia. | `src/modules/common/dto/contact-points.dto.ts:95` |
| `system` | `string` | Sí | valores: EMAIL, PHONE | — | Valor de system mantenido por la instancia. | `src/modules/common/dto/contact-points.dto.ts:101` |
| `value` | `string` | Sí | — | — | Valor de value mantenido por la instancia. | `src/modules/common/dto/contact-points.dto.ts:107` |
| `verified` | `boolean` | Sí | — | — | Valor de verified mantenido por la instancia. | `src/modules/common/dto/contact-points.dto.ts:113` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/contact-points.dto.ts:119` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Punto de contacto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/common.int-spec.ts:83` |
| CONTROLADOR | `src/modules/common/controllers/common-contact-points.controller.spec.ts:41` |

### Flujos

- Common module — etapa `ctrl:CommonContactPointsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /common/files

- **Origen:** CONTRATO
- **Nombre:** Crear un archivo con su versión inicial (UC-02-05)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommonFilesController.createFile` — `src/modules/common/controllers/common-files.controller.ts:136`

### Qué es y para qué sirve (negocio)

Crear un archivo con su versión inicial (UC-02-05). Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /common/files` la atiende `CommonFilesController.createFile` (src/modules/common/controllers/common-files.controller.ts:136). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateFileDto` (7 campos, 7 obligatorios). Delega en `FilesService.createFile`. Crea filas en common.file_versions, common.files.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/common/controllers/common-files.controller.ts:136` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | CommonFilesController.createFile → FilesService.createFile → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:119` |
| `common.files` | ESCRIBE | CREA | DIRECTA | CommonFilesController.createFile → FilesService.createFile → FilesRepository.create | `src/modules/common/repositories/files.repository.ts:50` |

### Cuerpo — DTO `CreateFileDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `originalName` | `string` | Sí | longitud máxima 512 | `@IsString()` `@MaxLength(512)` | — | `src/modules/common/dto/files.dto.ts:29` |
| `category` | `string` | Sí | valores: DOCUMENT, IMAGE | `@IsEnum(FileCategory)` | — | `src/modules/common/dto/files.dto.ts:36` |
| `sensitivity` | `string` | Sí | valores: NORMAL, PHI | `@IsEnum(FileSensitivity)` | — | `src/modules/common/dto/files.dto.ts:43` |
| `mimeType` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/common/dto/files.dto.ts:51` |
| `sizeBytes` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | — | `src/modules/common/dto/files.dto.ts:59` |
| `contentHash` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/common/dto/files.dto.ts:67` |
| `storageUri` | `string` | Sí | longitud máxima 2048 | `@IsString()` `@MaxLength(2048)` | — | `src/modules/common/dto/files.dto.ts:75` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "originalName": "Nombre de ejemplo",
  "category": "DOCUMENT",
  "sensitivity": "NORMAL",
  "mimeType": "valor-ejemplo",
  "sizeBytes": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "storageUri": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "originalName": "Nombre de ejemplo",
  "category": "DOCUMENT",
  "sensitivity": "NORMAL",
  "mimeType": "valor-ejemplo",
  "sizeBytes": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "storageUri": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<FileResponseDto>` · DTO `FileResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:279` |
| `currentVersionId` | `string` | No | formato uuid | — | Identificador asociado a current version. | `src/modules/common/dto/files.dto.ts:285` |
| `originalName` | `string` | No | — | — | Valor de original name mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:291` |
| `category` | `string` | Sí | valores: DOCUMENT, IMAGE | — | Valor de category mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:297` |
| `sensitivity` | `string` | Sí | valores: NORMAL, PHI | — | Valor de sensitivity mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:303` |
| `lifecycleStatusConceptId` | `string` | Sí | — | — | Estado del ciclo de vida (concept id). | `src/modules/common/dto/files.dto.ts:309` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/files.dto.ts:315` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/common.int-spec.ts:106` |
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:90` |
| CONTROLADOR | `src/modules/common/controllers/common-files.controller.spec.ts:53` |

### Flujos

- Common module — etapa `ctrl:CommonFilesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. DELETE /common/files/{id}

- **Origen:** CONTRATO
- **Nombre:** Borrar lógicamente un archivo (UC-02-10)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommonFilesController.softDelete` — `src/modules/common/controllers/common-files.controller.ts:186`

### Qué es y para qué sirve (negocio)

Borrar lógicamente un archivo (UC-02-10). Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`DELETE /common/files/{id}` la atiende `CommonFilesController.softDelete` (src/modules/common/controllers/common-files.controller.ts:186). Exige sesión; el controlador no declara roles. Delega en `FilesService.softDelete`. Actualiza common.files. Lee common.files.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/common/controllers/common-files.controller.ts:186` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/common/controllers/common-files.controller.ts:186` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.files` | ESCRIBE | ACTUALIZA | POR_TIPO | CommonFilesController.softDelete → FilesService.softDelete | `src/modules/common/services/files.service.ts:478` |
| `common.files` | LEE | LEE | DIRECTA | CommonFilesController.softDelete → FilesService.softDelete → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DeleteFileResponseDto>` · DTO `DeleteFileResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:497` |
| `deletedAt` | `string` | Sí | formato date-time | — | Fecha y hora de la eliminación lógica, si corresponde. | `src/modules/common/dto/files.dto.ts:503` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El archivo está bajo retención legal y no puede borrarse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/common.int-spec.ts:187` |
| CONTROLADOR | `src/modules/common/controllers/common-files.controller.spec.ts:115` |

### Flujos

- Common module — etapa `ctrl:CommonFilesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /common/files/{id}/content

- **Origen:** CONTRATO
- **Nombre:** Descargar el contenido vigente de un archivo
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommonFilesController.downloadContent` — `src/modules/common/controllers/common-files.controller.ts:115`

### Qué es y para qué sirve (negocio)

Descargar el contenido vigente de un archivo. Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /common/files/{id}/content` la atiende `CommonFilesController.downloadContent` (src/modules/common/controllers/common-files.controller.ts:115). Exige sesión; el controlador no declara roles. Delega en `FileUploadService.download`. Lee common.file_versions, common.files.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/common/controllers/common-files.controller.ts:115` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/common/controllers/common-files.controller.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | CommonFilesController.downloadContent → FileUploadService.download → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:72` |
| `common.files` | LEE | LEE | DIRECTA | CommonFilesController.downloadContent → FileUploadService.download → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No tiene acceso a este archivo |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: Versión vigente no encontrada; ResourceNotFoundException: La URI no pertenece al almacenamiento local; ResourceNotFoundException: La URI de almacenamiento local está mal formada; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: La URI no pertenece al bucket configurado; ResourceNotFoundException: La URI S3 está mal formada o fuera del prefijo permitido; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El archivo está borrado; PreconditionFailedException: El archivo no tiene una versión vigente; PreconditionFailedException: La versión vigente resultó infectada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3; Error: S3 object body is empty |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Common module — etapa `ctrl:CommonFilesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /common/files/{id}/download-url

- **Origen:** CONTRATO
- **Nombre:** Emitir una URL de descarga firmada (UC-02-11)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommonFilesController.downloadUrl` — `src/modules/common/controllers/common-files.controller.ts:197`

### Qué es y para qué sirve (negocio)

Emitir una URL de descarga firmada (UC-02-11). Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /common/files/{id}/download-url` la atiende `CommonFilesController.downloadUrl` (src/modules/common/controllers/common-files.controller.ts:197). Exige sesión; el controlador no declara roles. Delega en `FilesService.generateDownloadUrl`. Lee common.file_versions, common.files.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/common/controllers/common-files.controller.ts:197` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/common/controllers/common-files.controller.ts:197` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | CommonFilesController.downloadUrl → FilesService.generateDownloadUrl → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:72` |
| `common.files` | LEE | LEE | DIRECTA | CommonFilesController.downloadUrl → FilesService.generateDownloadUrl → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DownloadUrlResponseDto>` · DTO `DownloadUrlResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `url` | `string` | Sí | — | — | URL de descarga firmada (simulada). | `src/modules/common/dto/files.dto.ts:512` |
| `expiresAt` | `string` | Sí | formato date-time | — | Valor de expires at mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:518` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: Versión vigente no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El archivo está borrado; PreconditionFailedException: El archivo no tiene una versión vigente; PreconditionFailedException: La versión vigente no ha superado el escaneo antimalware |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/common.int-spec.ts:165` |
| CONTROLADOR | `src/modules/common/controllers/common-files.controller.spec.ts:126` |

### Flujos

- Common module — etapa `ctrl:CommonFilesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /common/files/{id}/links

- **Origen:** CONTRATO
- **Nombre:** Vincular un archivo a un propietario (UC-02-08)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommonFilesController.createLink` — `src/modules/common/controllers/common-files.controller.ts:174`

### Qué es y para qué sirve (negocio)

Vincular un archivo a un propietario (UC-02-08). Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /common/files/{id}/links` la atiende `CommonFilesController.createLink` (src/modules/common/controllers/common-files.controller.ts:174). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateFileLinkDto` (4 campos, 2 obligatorios). Delega en `FilesService.createLink`. Crea filas en common.file_links. Lee common.files.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/common/controllers/common-files.controller.ts:174` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/common/controllers/common-files.controller.ts:174` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_links` | ESCRIBE | CREA | DIRECTA | CommonFilesController.createLink → FilesService.createLink → FileLinksRepository.create | `src/modules/common/repositories/file-links.repository.ts:43` |
| `common.files` | LEE | LEE | DIRECTA | CommonFilesController.createLink → FilesService.createLink → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateFileLinkDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT | `@IsEnum(OwnerType)` | — | `src/modules/common/dto/files.dto.ts:199` |
| `ownerId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/common/dto/files.dto.ts:206` |
| `linkRole` | `string` | No | valores: ATTACHMENT | `@IsOptional()` `@IsEnum(LinkRole)` | — | `src/modules/common/dto/files.dto.ts:214` |
| `visibility` | `string` | No | valores: INTERNAL | `@IsOptional()` `@IsEnum(LinkVisibility)` | — | `src/modules/common/dto/files.dto.ts:222` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "linkRole": "ATTACHMENT",
  "visibility": "INTERNAL"
}
```

</details>

### Respuesta — `Promise<FileLinkResponseDto>` · DTO `FileLinkResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:410` |
| `fileId` | `string` | Sí | formato uuid | — | Identificador asociado a file. | `src/modules/common/dto/files.dto.ts:416` |
| `ownerId` | `string` | Sí | formato uuid | — | Identificador asociado a owner. | `src/modules/common/dto/files.dto.ts:422` |
| `ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT | — | Valor de owner type mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:428` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/files.dto.ts:434` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/common.int-spec.ts:152` |
| CONTROLADOR | `src/modules/common/controllers/common-files.controller.spec.ts:104` |

### Flujos

- Common module — etapa `ctrl:CommonFilesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /common/files/{id}/versions

- **Origen:** CONTRATO
- **Nombre:** Añadir una versión a un archivo (UC-02-06)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommonFilesController.createVersion` — `src/modules/common/controllers/common-files.controller.ts:149`

### Qué es y para qué sirve (negocio)

Añadir una versión a un archivo (UC-02-06). Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /common/files/{id}/versions` la atiende `CommonFilesController.createVersion` (src/modules/common/controllers/common-files.controller.ts:149). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateFileVersionDto` (4 campos, 4 obligatorios). Delega en `FilesService.createVersion`. Crea filas en common.file_versions. Actualiza common.files. Lee common.file_versions, common.files.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/common/controllers/common-files.controller.ts:149` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/common/controllers/common-files.controller.ts:149` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | CommonFilesController.createVersion → FilesService.createVersion → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:119` |
| `common.file_versions` | LEE | LEE | DIRECTA | CommonFilesController.createVersion → FilesService.createVersion → FileVersionsRepository.maxVersionNumber | `src/modules/common/repositories/file-versions.repository.ts:109` |
| `common.files` | ESCRIBE | ACTUALIZA | POR_TIPO | CommonFilesController.createVersion → FilesService.createVersion | `src/modules/common/services/files.service.ts:231` |
| `common.files` | LEE | LEE | DIRECTA | CommonFilesController.createVersion → FilesService.createVersion → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateFileVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `mimeType` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/common/dto/files.dto.ts:123` |
| `sizeBytes` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | — | `src/modules/common/dto/files.dto.ts:131` |
| `contentHash` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/common/dto/files.dto.ts:139` |
| `storageUri` | `string` | Sí | longitud máxima 2048 | `@IsString()` `@MaxLength(2048)` | — | `src/modules/common/dto/files.dto.ts:147` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "mimeType": "valor-ejemplo",
  "sizeBytes": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "storageUri": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "mimeType": "valor-ejemplo",
  "sizeBytes": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "storageUri": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<FileVersionResponseDto>` · DTO `FileVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:324` |
| `fileId` | `string` | Sí | formato uuid | — | Identificador asociado a file. | `src/modules/common/dto/files.dto.ts:330` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:336` |
| `mimeType` | `string` | Sí | — | — | Valor de mime type mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:342` |
| `sizeBytes` | `string` | Sí | — | — | Tamaño en bytes (bigint serializado como string). | `src/modules/common/dto/files.dto.ts:350` |
| `contentHash` | `string` | Sí | — | — | Valor de content hash mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:356` |
| `malwareScanStatusConceptId` | `string` | Sí | — | — | Estado del escaneo antimalware (concept id). | `src/modules/common/dto/files.dto.ts:362` |
| `recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:368` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/common.int-spec.ts:174` |
| CONTROLADOR | `src/modules/common/controllers/common-files.controller.spec.ts:67` |

### Flujos

- Common module — etapa `ctrl:CommonFilesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /common/files/{id}/versions/{vid}/derivatives

- **Origen:** CONTRATO
- **Nombre:** Generar un derivado de una versión (UC-02-07)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommonFilesController.createDerivative` — `src/modules/common/controllers/common-files.controller.ts:161`

### Qué es y para qué sirve (negocio)

Generar un derivado de una versión (UC-02-07). Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /common/files/{id}/versions/{vid}/derivatives` la atiende `CommonFilesController.createDerivative` (src/modules/common/controllers/common-files.controller.ts:161). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateFileDerivativeDto` (5 campos, 5 obligatorios). Delega en `FilesService.createDerivative`. Crea filas en common.file_derivatives, common.file_versions. Lee common.file_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/common/controllers/common-files.controller.ts:161` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, vid | `src/modules/common/controllers/common-files.controller.ts:161` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_derivatives` | ESCRIBE | CREA | DIRECTA | CommonFilesController.createDerivative → FilesService.createDerivative → FileDerivativesRepository.create | `src/modules/common/repositories/file-derivatives.repository.ts:41` |
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | CommonFilesController.createDerivative → FilesService.createDerivative → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:119` |
| `common.file_versions` | LEE | LEE | DIRECTA | CommonFilesController.createDerivative → FilesService.createDerivative → FileVersionsRepository.findByFileAndId | `src/modules/common/repositories/file-versions.repository.ts:81` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `vid` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateFileDerivativeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `derivativeType` | `string` | Sí | valores: THUMBNAIL, OCR | `@IsEnum(DerivativeType)` | — | `src/modules/common/dto/files.dto.ts:157` |
| `storageUri` | `string` | Sí | longitud máxima 2048 | `@IsString()` `@MaxLength(2048)` | — | `src/modules/common/dto/files.dto.ts:165` |
| `mimeType` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/common/dto/files.dto.ts:173` |
| `sizeBytes` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | — | `src/modules/common/dto/files.dto.ts:181` |
| `contentHash` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/common/dto/files.dto.ts:189` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "derivativeType": "THUMBNAIL",
  "storageUri": "valor-ejemplo",
  "mimeType": "valor-ejemplo",
  "sizeBytes": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "derivativeType": "THUMBNAIL",
  "storageUri": "valor-ejemplo",
  "mimeType": "valor-ejemplo",
  "sizeBytes": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

</details>

### Respuesta — `Promise<FileDerivativeResponseDto>` · DTO `FileDerivativeResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:377` |
| `sourceFileVersionId` | `string` | Sí | formato uuid | — | Identificador asociado a source file version. | `src/modules/common/dto/files.dto.ts:383` |
| `derivativeFileVersionId` | `string` | Sí | formato uuid | — | Identificador asociado a derivative file version. | `src/modules/common/dto/files.dto.ts:389` |
| `derivativeType` | `string` | Sí | valores: THUMBNAIL, OCR | — | Valor de derivative type mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:395` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/files.dto.ts:401` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de archivo no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se pueden generar derivados de versiones con escaneo limpio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/common.int-spec.ts:138` |
| CONTROLADOR | `src/modules/common/controllers/common-files.controller.spec.ts:82` |

### Flujos

- Common module — etapa `ctrl:CommonFilesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. GET /common/files/links

- **Origen:** CONTRATO
- **Nombre:** Listar los archivos adjuntos a un recurso (UC-02-08)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommonFilesController.listLinks` — `src/modules/common/controllers/common-files.controller.ts:106`

### Qué es y para qué sirve (negocio)

Listar los archivos adjuntos a un recurso (UC-02-08). Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /common/files/links` la atiende `CommonFilesController.listLinks` (src/modules/common/controllers/common-files.controller.ts:106). Exige sesión; el controlador no declara roles. Delega en `FilesService.listLinkedFiles`. Lee common.file_links, common.files.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/common/controllers/common-files.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | ownerType (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | ownerId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_links` | LEE | LEE | DIRECTA | CommonFilesController.listLinks → FilesService.listLinkedFiles → FileLinksRepository.findByOwner | `src/modules/common/repositories/file-links.repository.ts:78` |
| `common.files` | LEE | LEE | DIRECTA | CommonFilesController.listLinks → FilesService.listLinkedFiles → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `ownerType` | query | Sí | `string` | — |
| `ownerId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LinkedFilePageDto>` · DTO `LinkedFilePageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<LinkedFileResponseDto>` | Sí | — | — | — | `src/modules/common/dto/files.dto.ts:486` |
| `items[].linkId` | `string` | Sí | formato uuid | — | Id del vínculo, no del archivo. | `src/modules/common/dto/files.dto.ts:468` |
| `items[].ownerId` | `string` | Sí | formato uuid | — | — | `src/modules/common/dto/files.dto.ts:471` |
| `items[].ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT | — | — | `src/modules/common/dto/files.dto.ts:474` |
| `items[].linkedAt` | `string` | Sí | formato date-time | — | Cuándo se adjuntó. | `src/modules/common/dto/files.dto.ts:477` |
| `items[].file` | `FileResponseDto` | Sí | — | — | — | `src/modules/common/dto/files.dto.ts:480` |
| `items[].file.id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:279` |
| `items[].file.currentVersionId` | `string` | No | formato uuid | — | Identificador asociado a current version. | `src/modules/common/dto/files.dto.ts:285` |
| `items[].file.originalName` | `string` | No | — | — | Valor de original name mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:291` |
| `items[].file.category` | `string` | Sí | valores: DOCUMENT, IMAGE | — | Valor de category mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:297` |
| `items[].file.sensitivity` | `string` | Sí | valores: NORMAL, PHI | — | Valor de sensitivity mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:303` |
| `items[].file.lifecycleStatusConceptId` | `string` | Sí | — | — | Estado del ciclo de vida (concept id). | `src/modules/common/dto/files.dto.ts:309` |
| `items[].file.createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/files.dto.ts:315` |
| `count` | `number` | Sí | — | — | Cuántos vinieron en esta página. | `src/modules/common/dto/files.dto.ts:489` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Common module — etapa `ctrl:CommonFilesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /common/files/upload

- **Origen:** CONTRATO
- **Nombre:** Subir el contenido de un archivo (multipart)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommonFilesController.upload` — `src/modules/common/controllers/common-files.controller.ts:70`

### Qué es y para qué sirve (negocio)

Subir el contenido de un archivo (multipart). Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /common/files/upload` la atiende `CommonFilesController.upload` (src/modules/common/controllers/common-files.controller.ts:70). Exige sesión; el controlador no declara roles. Delega en `FileUploadService.upload`. Crea filas en common.file_versions, common.files.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/common/controllers/common-files.controller.ts:70` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | multipart/form-data (obligatorio); el tamaño del archivo lo define la ruta, no el límite global | `contrato (requestBody)` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | CommonFilesController.upload → FileUploadService.upload → FilesService.createFile → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:119` |
| `common.files` | ESCRIBE | CREA | DIRECTA | CommonFilesController.upload → FileUploadService.upload → FilesService.createFile → FilesRepository.create | `src/modules/common/repositories/files.repository.ts:50` |

### Cuerpo — DTO (no identificado) · `multipart/form-data`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `file` | `string` | Sí | formato binary | — | — | sin fuente |
| `category` | `string` | Sí | valores: DOCUMENT, IMAGE | — | — | sin fuente |
| `sensitivity` | `string` | Sí | valores: NORMAL, PHI | — | — | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "file": "<contenido-binario>",
  "category": "DOCUMENT",
  "sensitivity": "NORMAL"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "file": "<contenido-binario>",
  "category": "DOCUMENT",
  "sensitivity": "NORMAL"
}
```

</details>

### Respuesta — `Promise<FileResponseDto>` · DTO `FileResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:279` |
| `currentVersionId` | `string` | No | formato uuid | — | Identificador asociado a current version. | `src/modules/common/dto/files.dto.ts:285` |
| `originalName` | `string` | No | — | — | Valor de original name mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:291` |
| `category` | `string` | Sí | valores: DOCUMENT, IMAGE | — | Valor de category mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:297` |
| `sensitivity` | `string` | Sí | valores: NORMAL, PHI | — | Valor de sensitivity mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:303` |
| `lifecycleStatusConceptId` | `string` | Sí | — | — | Estado del ciclo de vida (concept id). | `src/modules/common/dto/files.dto.ts:309` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/files.dto.ts:315` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se recibió contenido en el campo "file"; PreconditionFailedException: El archivo excede el tamaño máximo permitido; PreconditionFailedException: El contenido no corresponde a ningún formato de archivo permitido; PreconditionFailedException: El formato del archivo no está permitido para esta categoría |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:341` |

### Flujos

- Common module — etapa `ctrl:CommonFilesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /common/identifiers

- **Origen:** CONTRATO
- **Nombre:** Registrar un identificador oficial (UC-02-01)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommonIdentifiersController.create` — `src/modules/common/controllers/common-identifiers.controller.ts:21`

### Qué es y para qué sirve (negocio)

Registrar un identificador oficial (UC-02-01). Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /common/identifiers` la atiende `CommonIdentifiersController.create` (src/modules/common/controllers/common-identifiers.controller.ts:21). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateIdentifierDto` (6 campos, 4 obligatorios). Delega en `IdentifiersService.create`. Crea filas en common.identifiers. Lee common.identifiers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/common/controllers/common-identifiers.controller.ts:21` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | CommonIdentifiersController.create → IdentifiersService.create → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:90` |
| `common.identifiers` | LEE | LEE | DIRECTA | CommonIdentifiersController.create → IdentifiersService.create → IdentifiersRepository.findActiveDuplicate | `src/modules/common/repositories/identifiers.repository.ts:80` |

### Cuerpo — DTO `CreateIdentifierDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT | `@IsEnum(OwnerType)` | Tipo de propietario polimórfico. | `src/modules/common/dto/identifiers.dto.ts:21` |
| `ownerId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del propietario (no FK). | `src/modules/common/dto/identifiers.dto.ts:28` |
| `type` | `string` | Sí | valores: NATIONAL_ID, MRN, PASSPORT | `@IsEnum(IdentifierType)` | — | `src/modules/common/dto/identifiers.dto.ts:35` |
| `system` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Sistema emisor (URI/OID) opcional. | `src/modules/common/dto/identifiers.dto.ts:44` |
| `value` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | Valor del identificador. | `src/modules/common/dto/identifiers.dto.ts:52` |
| `use` | `string` | No | valores: OFFICIAL, SECONDARY | `@IsOptional()` `@IsEnum(IdentifierUse)` | — | `src/modules/common/dto/identifiers.dto.ts:60` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "type": "NATIONAL_ID",
  "value": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "type": "NATIONAL_ID",
  "system": "valor-ejemplo",
  "value": "valor-ejemplo",
  "use": "OFFICIAL"
}
```

</details>

### Respuesta — `Promise<IdentifierResponseDto>` · DTO `IdentifierResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/identifiers.dto.ts:69` |
| `canonicalHealthResourceId` | `string` | Sí | formato uuid | — | Identificador asociado a canonical health resource. | sin fuente |
| `isPrimary` | `boolean` | Sí | — | — | Valor de is primary mantenido por la instancia. | sin fuente |
| `supersededIdentifierId` | `string` | No | formato uuid | — | Identificador principal que se cerró | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un identificador activo con ese tipo, sistema y valor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/common.int-spec.ts:42` |
| CONTROLADOR | `src/modules/common/controllers/common-identifiers.controller.spec.ts:21` |

### Flujos

- Common module — etapa `ctrl:CommonIdentifiersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /internal/files/versions/{vid}/scan-result

- **Origen:** CONTRATO
- **Nombre:** Registrar resultado de escaneo antimalware (UC-02-09)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InternalFilesController.scanResult` — `src/modules/common/controllers/internal-files.controller.ts:81`

### Qué es y para qué sirve (negocio)

Registrar resultado de escaneo antimalware (UC-02-09). Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /internal/files/versions/{vid}/scan-result` la atiende `InternalFilesController.scanResult` (src/modules/common/controllers/internal-files.controller.ts:81). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Valida el cuerpo como `ScanResultDto` (1 campo, 1 obligatorio). Delega en `FilesService.recordScanResult`. Actualiza common.file_versions. Lee common.file_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/common/controllers/internal-files.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: vid | `src/modules/common/controllers/internal-files.controller.ts:81` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | InternalFilesController.scanResult → FilesService.recordScanResult | `src/modules/common/services/files.service.ts:402` |
| `common.file_versions` | LEE | LEE | DIRECTA | InternalFilesController.scanResult → FilesService.recordScanResult → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:72` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `vid` | path | Sí | `string` | — |

### Cuerpo — DTO `ScanResultDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `result` | `string` | Sí | valores: CLEAN, INFECTED | `@IsEnum(ScanResult)` | — | `src/modules/common/dto/files.dto.ts:232` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "result": "CLEAN"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "result": "CLEAN"
}
```

</details>

### Respuesta — `Promise<FileVersionResponseDto>` · DTO `FileVersionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:324` |
| `fileId` | `string` | Sí | formato uuid | — | Identificador asociado a file. | `src/modules/common/dto/files.dto.ts:330` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:336` |
| `mimeType` | `string` | Sí | — | — | Valor de mime type mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:342` |
| `sizeBytes` | `string` | Sí | — | — | Tamaño en bytes (bigint serializado como string). | `src/modules/common/dto/files.dto.ts:350` |
| `contentHash` | `string` | Sí | — | — | Valor de content hash mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:356` |
| `malwareScanStatusConceptId` | `string` | Sí | — | — | Estado del escaneo antimalware (concept id). | `src/modules/common/dto/files.dto.ts:362` |
| `recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:368` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de archivo no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/common.int-spec.ts:130` |
| CONTROLADOR | `src/modules/common/controllers/internal-files.controller.spec.ts:14` |

### Flujos

- Common module — etapa `ctrl:InternalFilesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. GET /internal/files/versions/pending-scan

- **Origen:** CONTRATO
- **Nombre:** Listar versiones pendientes de escaneo antimalware
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InternalFilesController.pendingScan` — `src/modules/common/controllers/internal-files.controller.ts:65`

### Qué es y para qué sirve (negocio)

Listar versiones pendientes de escaneo antimalware. Dentro del módulo (descripción del modelo, en inglés): «Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_02_common.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /internal/files/versions/pending-scan` la atiende `InternalFilesController.pendingScan` (src/modules/common/controllers/internal-files.controller.ts:65). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `FilesService.listPendingScan`. Lee common.file_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/common/controllers/internal-files.controller.ts:65` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | InternalFilesController.pendingScan → FilesService.listPendingScan → FileVersionsRepository.findPendingScan | `src/modules/common/repositories/file-versions.repository.ts:97` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PendingScanResponseDto>` · DTO `PendingScanResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PendingScanItemDto>` | Sí | — | — | Lote de versiones pendientes, de la más antigua a la más nueva. | `src/modules/common/dto/files.dto.ts:270` |
| `items[].versionId` | `string` | Sí | formato uuid | — | Versión a escanear. | `src/modules/common/dto/files.dto.ts:239` |
| `items[].fileId` | `string` | Sí | formato uuid | — | Archivo al que pertenece, para el rastro del resultado. | `src/modules/common/dto/files.dto.ts:243` |
| `items[].storageUri` | `string` | Sí | — | — | URI de almacenamiento (`s3://…` o `file://…`). | `src/modules/common/dto/files.dto.ts:255` |
| `items[].sizeBytes` | `number` | Sí | — | — | Tamaño declarado, para acotar el lote y descartar lo que excede al escáner. | `src/modules/common/dto/files.dto.ts:259` |
| `items[].mimeType` | `string` | Sí | — | — | Tipo deducido de los bytes al subir. Va sólo para el registro. | `src/modules/common/dto/files.dto.ts:263` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/common.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Common module — etapa `ctrl:InternalFilesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

