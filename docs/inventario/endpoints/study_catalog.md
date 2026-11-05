<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `study_catalog`

- **Bloque:** —
- **Operaciones:** 2 (2 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 2
- **Tablas distintas que tocan:** 7
- **Respuestas de error y detalle contractual:** `openapi/endpoints/study-catalog.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/clinical/study-catalog` | Catálogo de estudios pedibles, con búsqueda y paginación | BAJO | 7 | sesión (sin roles) |
| 2 | GET | `/clinical/study-catalog/{conceptId}` | Detalle de un estudio del catálogo | BAJO | 7 | sesión (sin roles) |

---

## 1. GET /clinical/study-catalog

- **Origen:** CONTRATO
- **Nombre:** Catálogo de estudios pedibles, con búsqueda y paginación
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StudyCatalogController.list` — `src/modules/study_catalog/controllers/study-catalog.controller.ts:52`

### Qué es y para qué sirve (negocio)

Catálogo de estudios pedibles, con búsqueda y paginación.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /clinical/study-catalog` la atiende `StudyCatalogController.list` (src/modules/study_catalog/controllers/study-catalog.controller.ts:52). Exige sesión; el controlador no declara roles. Delega en `StudyCatalogService.list`. Lee terminology.catalog_concepts, terminology.concept_designations, terminology.concept_properties, terminology.concept_relationships, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/study_catalog/controllers/study-catalog.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | StudyCatalogController.list → StudyCatalogService.list → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:138` |
| `terminology.concept_designations` | LEE | LEE | POR_SQL | StudyCatalogController.list → StudyCatalogService.list → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:110` |
| `terminology.concept_properties` | LEE | LEE | POR_SQL | StudyCatalogController.list → StudyCatalogService.list → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:138` |
| `terminology.concept_relationships` | LEE | LEE | POR_SQL | StudyCatalogController.list → StudyCatalogService.list → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:110` |
| `terminology.value_set_members` | LEE | LEE | POR_SQL | StudyCatalogController.list → StudyCatalogService.list → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:138` |
| `terminology.value_set_versions` | LEE | LEE | POR_SQL | StudyCatalogController.list → StudyCatalogService.list → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:138` |
| `terminology.value_sets` | LEE | LEE | POR_SQL | StudyCatalogController.list → StudyCatalogService.list → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:138` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `family` | query | No | `string` | — |
| `q` | query | No | `string` | Texto libre (hasta 100 caracteres) |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `number` | 1 a 100; por omisión 25 |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StudyCatalogPageDto>` · DTO `StudyCatalogPageDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<StudyCatalogItemDto>` | Sí | — | — | Estudios de la página. | `src/modules/study_catalog/dto/study-catalog.dto.ts:80` |
| `items[].conceptId` | `string` | Sí | formato uuid | — | Concepto del estudio: es el `codeConceptId` que se manda al pedirlo. | `src/modules/study_catalog/dto/study-catalog.dto.ts:40` |
| `items[].code` | `string` | Sí | — | — | Código del catálogo (`HEMOGRAMA`, `RX_TORAX_PA`). | `src/modules/study_catalog/dto/study-catalog.dto.ts:42` |
| `items[].legacyCode` | `string` | No | admite null | — | Código local anterior (`LAB_HEMOGRAMA`) cuando el estudio ya existía. | `src/modules/study_catalog/dto/study-catalog.dto.ts:44` |
| `items[].codeSystem` | `string` | Sí | — | — | Sistema de codificación del concepto. | `src/modules/study_catalog/dto/study-catalog.dto.ts:46` |
| `items[].display` | `string` | Sí | — | — | Nombre en castellano. | `src/modules/study_catalog/dto/study-catalog.dto.ts:48` |
| `items[].family` | `object` | Sí | — | — | Familia del estudio. | `src/modules/study_catalog/dto/study-catalog.dto.ts:50` |
| `items[].componentsSelectable` | `boolean` | Sí | — | — | Si el estudio se pide con componentes marcables. | `src/modules/study_catalog/dto/study-catalog.dto.ts:52` |
| `items[].componentCount` | `number` | Sí | — | — | Cuántos componentes directos tiene. | `src/modules/study_catalog/dto/study-catalog.dto.ts:54` |
| `items[].specimenHint` | `SpecimenHintDto` | No | — | — | Muestra sugerida (laboratorio). | `src/modules/study_catalog/dto/study-catalog.dto.ts:57` |
| `items[].specimenHint.text` | `string` | No | — | — | Nombre de la muestra, en castellano. | `src/modules/study_catalog/dto/study-catalog.dto.ts:8` |
| `items[].specimenHint.code` | `string` | No | — | — | Código del catálogo (`SANGRE_EDTA`). | `src/modules/study_catalog/dto/study-catalog.dto.ts:10` |
| `items[].specimenHint.hl7Code` | `string` | No | admite null | — | HL7 v2 tabla 0487, si la muestra tiene equivalente. | `src/modules/study_catalog/dto/study-catalog.dto.ts:12` |
| `items[].specimenHint.snomedCode` | `string` | No | admite null | — | SNOMED CT, si la muestra tiene equivalente. | `src/modules/study_catalog/dto/study-catalog.dto.ts:14` |
| `items[].specimenHint.source` | `string` | No | — | — | Origen del dato, para mostrarlo. | `src/modules/study_catalog/dto/study-catalog.dto.ts:16` |
| `items[].modalityConceptId` | `string` | No | formato uuid; admite null | — | Modalidad del estudio (imagen). | `src/modules/study_catalog/dto/study-catalog.dto.ts:60` |
| `items[].bodySiteConceptId` | `string` | No | formato uuid; admite null | — | Región por defecto del estudio (imagen). | `src/modules/study_catalog/dto/study-catalog.dto.ts:63` |
| `items[].provenance` | `StudyProvenanceDto` | Sí | — | — | De dónde sale el renglón. | `src/modules/study_catalog/dto/study-catalog.dto.ts:65` |
| `items[].provenance.source` | `string` | No | admite null | — | Archivo versionado del que sale (`laboratorio.json` \| `imagenologia.json`), o `null` en un estudio local. | `src/modules/study_catalog/dto/study-catalog.dto.ts:22` |
| `items[].provenance.version` | `string` | No | admite null | — | Versión del catálogo (fecha). | `src/modules/study_catalog/dto/study-catalog.dto.ts:24` |
| `items[].provenance.sourceIds` | `array<string>` | Sí | — | — | Fuentes que respaldan el renglón (ids de `fuentes` del catálogo). | `src/modules/study_catalog/dto/study-catalog.dto.ts:26` |
| `items[].section` | `StudySectionDto` | No | — | — | Sección de laboratorio; `null` en imagen y en estudios sin sección sembrada. | `src/modules/study_catalog/dto/study-catalog.dto.ts:68` |
| `items[].section.code` | `string` | No | — | — | Código de la sección (`HEMATO`). | `src/modules/study_catalog/dto/study-catalog.dto.ts:32` |
| `items[].section.name` | `string` | No | — | — | Nombre en castellano (`Hematología`). | `src/modules/study_catalog/dto/study-catalog.dto.ts:34` |
| `items[].componentNames` | `array<string>` | Sí | — | — | Nombres de los componentes directos del panel (máx. 60, en su orden); `[]` si no tiene. | `src/modules/study_catalog/dto/study-catalog.dto.ts:70` |
| `items[].regionCode` | `string` | No | admite null | — | Código de la región por defecto del estudio (`TORAX`); `null` fuera de imagen. | `src/modules/study_catalog/dto/study-catalog.dto.ts:72` |
| `items[].requiresLaterality` | `boolean` | No | admite null | — | Si el estudio exige lateralidad; `null` fuera de imagen. | `src/modules/study_catalog/dto/study-catalog.dto.ts:74` |
| `count` | `number` | Sí | — | — | Cuántos devolvió esta página. | `src/modules/study_catalog/dto/study-catalog.dto.ts:82` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/study_catalog/dto/study-catalog.dto.ts:84` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null` si es la última. | `src/modules/study_catalog/dto/study-catalog.dto.ts:86` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/study_catalog.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/study-catalog.int-spec.ts:68` |

### Flujos

- study_catalog — etapa `ctrl:StudyCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /clinical/study-catalog/{conceptId}

- **Origen:** CONTRATO
- **Nombre:** Detalle de un estudio del catálogo
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StudyCatalogController.detail` — `src/modules/study_catalog/controllers/study-catalog.controller.ts:87`

### Qué es y para qué sirve (negocio)

Detalle de un estudio del catálogo.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /clinical/study-catalog/{conceptId}` la atiende `StudyCatalogController.detail` (src/modules/study_catalog/controllers/study-catalog.controller.ts:87). Exige sesión; el controlador no declara roles. Delega en `StudyCatalogService.detail`. Lee terminology.catalog_concepts, terminology.concept_designations, terminology.concept_properties, terminology.concept_relationships, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/study_catalog/controllers/study-catalog.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | StudyCatalogController.detail → StudyCatalogService.detail → StudyCatalogRepository.findOne | `src/modules/study_catalog/repositories/study-catalog.repository.ts:192` |
| `terminology.concept_designations` | LEE | LEE | POR_SQL | StudyCatalogController.detail → StudyCatalogService.detail → StudyCatalogRepository.findOne | `src/modules/study_catalog/repositories/study-catalog.repository.ts:192` |
| `terminology.concept_properties` | LEE | LEE | POR_SQL | StudyCatalogController.detail → StudyCatalogService.detail → StudyCatalogRepository.findOne | `src/modules/study_catalog/repositories/study-catalog.repository.ts:192` |
| `terminology.concept_relationships` | LEE | LEE | POR_SQL | StudyCatalogController.detail → StudyCatalogService.detail → StudyCatalogRepository.findComponents | `src/modules/study_catalog/repositories/study-catalog.repository.ts:296` |
| `terminology.value_set_members` | LEE | LEE | POR_SQL | StudyCatalogController.detail → StudyCatalogService.detail → StudyCatalogRepository.findOne | `src/modules/study_catalog/repositories/study-catalog.repository.ts:192` |
| `terminology.value_set_versions` | LEE | LEE | POR_SQL | StudyCatalogController.detail → StudyCatalogService.detail → StudyCatalogRepository.findOne | `src/modules/study_catalog/repositories/study-catalog.repository.ts:192` |
| `terminology.value_sets` | LEE | LEE | POR_SQL | StudyCatalogController.detail → StudyCatalogService.detail → StudyCatalogRepository.findOne | `src/modules/study_catalog/repositories/study-catalog.repository.ts:192` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conceptId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StudyCatalogDetailDto>` · DTO `StudyCatalogDetailDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `components` | `array<StudyComponentDto>` | Sí | — | — | Componentes (árbol). Vacío si el estudio no se desglosa. | `src/modules/study_catalog/dto/study-catalog.dto.ts:192` |
| `components[].componentOfferingId` | `string` | Sí | formato uuid | — | Oferta que actúa como componente | sin fuente |
| `components[].componentRoleConceptId` | `string` | No | formato uuid | — | Rol del componente (concept id) | sin fuente |
| `components[].quantity` | `string` | No | — | — | Cantidad | sin fuente |
| `components[].ordinal` | `number` | No | — | — | Orden en el panel | `src/modules/study_catalog/dto/study-catalog.dto.ts:98` |
| `suggestedSpecimen` | `StudyOptionDto` | No | — | — | Muestra que el catálogo propone convertida en concepto de `specimen-type`, si hay equivalencia. | `src/modules/study_catalog/dto/study-catalog.dto.ts:195` |
| `suggestedSpecimen.conceptId` | `string` | No | formato uuid | — | Concepto de la opción. | `src/modules/study_catalog/dto/study-catalog.dto.ts:117` |
| `suggestedSpecimen.code` | `string` | No | — | — | Código de la opción. | `src/modules/study_catalog/dto/study-catalog.dto.ts:119` |
| `suggestedSpecimen.display` | `string` | No | — | — | Rótulo en castellano. | `src/modules/study_catalog/dto/study-catalog.dto.ts:121` |
| `suggestedSpecimen.isDefault` | `boolean` | No | — | — | Opción que el estudio fija o sugiere. | `src/modules/study_catalog/dto/study-catalog.dto.ts:123` |
| `allowedSpecimenTypes` | `array<StudyOptionDto>` | Sí | — | — | Tipos de muestra elegibles (value set `specimen-type`); vacío si el estudio no lleva muestra. | `src/modules/study_catalog/dto/study-catalog.dto.ts:198` |
| `allowedSpecimenTypes[].conceptId` | `string` | Sí | formato uuid | — | Concepto de la opción. | `src/modules/study_catalog/dto/study-catalog.dto.ts:117` |
| `allowedSpecimenTypes[].code` | `string` | Sí | — | — | Código de la opción. | `src/modules/study_catalog/dto/study-catalog.dto.ts:119` |
| `allowedSpecimenTypes[].display` | `string` | Sí | — | — | Rótulo en castellano. | `src/modules/study_catalog/dto/study-catalog.dto.ts:121` |
| `allowedSpecimenTypes[].isDefault` | `boolean` | Sí | — | — | Opción que el estudio fija o sugiere. | `src/modules/study_catalog/dto/study-catalog.dto.ts:123` |
| `allowedModalities` | `array<StudyOptionDto>` | Sí | — | — | Modalidades elegibles; el estudio fija una. | `src/modules/study_catalog/dto/study-catalog.dto.ts:201` |
| `allowedModalities[].conceptId` | `string` | Sí | formato uuid | — | Concepto de la opción. | `src/modules/study_catalog/dto/study-catalog.dto.ts:117` |
| `allowedModalities[].code` | `string` | Sí | — | — | Código de la opción. | `src/modules/study_catalog/dto/study-catalog.dto.ts:119` |
| `allowedModalities[].display` | `string` | Sí | — | — | Rótulo en castellano. | `src/modules/study_catalog/dto/study-catalog.dto.ts:121` |
| `allowedModalities[].isDefault` | `boolean` | Sí | — | — | Opción que el estudio fija o sugiere. | `src/modules/study_catalog/dto/study-catalog.dto.ts:123` |
| `allowedBodySites` | `array<AllowedBodySiteDto>` | Sí | — | — | Regiones elegibles: la del estudio y las que contiene. | `src/modules/study_catalog/dto/study-catalog.dto.ts:204` |
| `allowedBodySites[].conceptId` | `string` | Sí | formato uuid | — | Concepto de la región: es el `bodySiteConceptId` de la orden. | `src/modules/study_catalog/dto/study-catalog.dto.ts:129` |
| `allowedBodySites[].code` | `string` | Sí | — | — | Código de la región (`MANO`). | `src/modules/study_catalog/dto/study-catalog.dto.ts:131` |
| `allowedBodySites[].display` | `string` | Sí | — | — | Nombre en castellano. | `src/modules/study_catalog/dto/study-catalog.dto.ts:133` |
| `allowedBodySites[].parentConceptId` | `string` | No | formato uuid; admite null | — | Región contenedora dentro del catálogo (`null` en la raíz). | `src/modules/study_catalog/dto/study-catalog.dto.ts:136` |
| `allowedBodySites[].regionType` | `string` | No | admite null | — | Clase de región del catálogo (`region`, `grupo`, `vascular`, `combinada`). | `src/modules/study_catalog/dto/study-catalog.dto.ts:138` |
| `allowedBodySites[].admitsLaterality` | `boolean` | Sí | — | — | Si la región admite lado izquierdo/derecho. | `src/modules/study_catalog/dto/study-catalog.dto.ts:140` |
| `allowedBodySites[].isDefault` | `boolean` | Sí | — | — | Es la región por defecto del estudio. | `src/modules/study_catalog/dto/study-catalog.dto.ts:142` |
| `lateralityOptions` | `array<StudyOptionDto>` | Sí | — | — | Opciones de lateralidad (vocabulario `condition-laterality`); vacío si el estudio no es de imagen. | `src/modules/study_catalog/dto/study-catalog.dto.ts:207` |
| `lateralityOptions[].conceptId` | `string` | Sí | formato uuid | — | Concepto de la opción. | `src/modules/study_catalog/dto/study-catalog.dto.ts:117` |
| `lateralityOptions[].code` | `string` | Sí | — | — | Código de la opción. | `src/modules/study_catalog/dto/study-catalog.dto.ts:119` |
| `lateralityOptions[].display` | `string` | Sí | — | — | Rótulo en castellano. | `src/modules/study_catalog/dto/study-catalog.dto.ts:121` |
| `lateralityOptions[].isDefault` | `boolean` | Sí | — | — | Opción que el estudio fija o sugiere. | `src/modules/study_catalog/dto/study-catalog.dto.ts:123` |
| `contrastOptions` | `array<StudyOptionDto>` | Sí | — | — | Opciones de contraste (`imaging-contrast`); vacío si el estudio no es de imagen. | `src/modules/study_catalog/dto/study-catalog.dto.ts:210` |
| `contrastOptions[].conceptId` | `string` | Sí | formato uuid | — | Concepto de la opción. | `src/modules/study_catalog/dto/study-catalog.dto.ts:117` |
| `contrastOptions[].code` | `string` | Sí | — | — | Código de la opción. | `src/modules/study_catalog/dto/study-catalog.dto.ts:119` |
| `contrastOptions[].display` | `string` | Sí | — | — | Rótulo en castellano. | `src/modules/study_catalog/dto/study-catalog.dto.ts:121` |
| `contrastOptions[].isDefault` | `boolean` | Sí | — | — | Opción que el estudio fija o sugiere. | `src/modules/study_catalog/dto/study-catalog.dto.ts:123` |
| `lab` | `LabStudyDetailDto` | No | — | — | Datos de laboratorio, si es un análisis. | `src/modules/study_catalog/dto/study-catalog.dto.ts:213` |
| `lab.section` | `string` | No | admite null | — | Sección del laboratorio (`HEMATO`). | `src/modules/study_catalog/dto/study-catalog.dto.ts:160` |
| `lab.fasting` | `boolean` | No | admite null | — | Ayuno requerido, si el catálogo lo dice. | `src/modules/study_catalog/dto/study-catalog.dto.ts:162` |
| `lab.turnaroundHours` | `number` | No | admite null | — | Horas de entrega, si el catálogo lo dice. | `src/modules/study_catalog/dto/study-catalog.dto.ts:164` |
| `lab.loincCode` | `string` | No | admite null | — | Código LOINC del análisis, si está verificado. | `src/modules/study_catalog/dto/study-catalog.dto.ts:166` |
| `lab.loincName` | `string` | No | admite null | — | Nombre LOINC (inglés). | `src/modules/study_catalog/dto/study-catalog.dto.ts:168` |
| `imaging` | `ImagingStudyDetailDto` | No | — | — | Datos de imagen, si es un estudio de imagen. | `src/modules/study_catalog/dto/study-catalog.dto.ts:216` |
| `imaging.projections` | `array<string>` | No | — | — | Proyecciones o cortes del estudio. | `src/modules/study_catalog/dto/study-catalog.dto.ts:174` |
| `imaging.contrast` | `string` | No | — | — | Contraste del estudio (`sin` \| `con` \| `sin_y_con`). | `src/modules/study_catalog/dto/study-catalog.dto.ts:176` |
| `imaging.contrastRoute` | `string` | No | admite null | — | Vía de administración del contraste, texto del catálogo. | `src/modules/study_catalog/dto/study-catalog.dto.ts:178` |
| `imaging.preparation` | `string` | No | admite null | — | Preparación del paciente. | `src/modules/study_catalog/dto/study-catalog.dto.ts:180` |
| `imaging.requiresLaterality` | `boolean` | No | — | — | El estudio exige lateralidad. | `src/modules/study_catalog/dto/study-catalog.dto.ts:182` |
| `imaging.loincCode` | `string` | No | admite null | — | Código LOINC, si está verificado. | `src/modules/study_catalog/dto/study-catalog.dto.ts:184` |
| `imaging.radlexRpid` | `string` | No | admite null | — | Identificador RadLex Playbook. | `src/modules/study_catalog/dto/study-catalog.dto.ts:186` |
| `attribution` | `array<AttributionDto>` | Sí | — | — | Avisos de licencia que deben mostrarse junto al estudio. | `src/modules/study_catalog/dto/study-catalog.dto.ts:218` |
| `attribution[].source` | `string` | Sí | — | — | Nombre de la fuente. | `src/modules/study_catalog/dto/study-catalog.dto.ts:148` |
| `attribution[].url` | `string` | Sí | — | — | Sitio de la fuente. | `src/modules/study_catalog/dto/study-catalog.dto.ts:150` |
| `attribution[].license` | `string` | Sí | — | — | Licencia. | `src/modules/study_catalog/dto/study-catalog.dto.ts:152` |
| `attribution[].text` | `string` | Sí | — | — | Texto del aviso. | `src/modules/study_catalog/dto/study-catalog.dto.ts:154` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Estudio no encontrado en el catálogo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/study_catalog.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/study-catalog.int-spec.ts:211` |

### Flujos

- study_catalog — etapa `ctrl:StudyCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

