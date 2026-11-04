<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `study_catalog`

Referencia exhaustiva de 2 operación(es) del módulo `study_catalog`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `study-catalog`
- **Controladores:** `StudyCatalogController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /clinical/study-catalog](#1-get-clinical-study-catalog) — Catálogo de estudios pedibles, con búsqueda y paginación
2. [GET /clinical/study-catalog/{conceptId}](#2-get-clinical-study-catalog-conceptid) — Detalle de un estudio del catálogo

---

## 1. GET /clinical/study-catalog

- **Módulo:** `study_catalog`
- **Etiqueta OpenAPI:** `study-catalog`
- **Nombre:** Catálogo de estudios pedibles, con búsqueda y paginación
- **Operation ID:** `StudyCatalogController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StudyCatalogController.list](../../src/modules/study_catalog/controllers/study-catalog.controller.ts)

### Descripción de negocio

Orden alfabético sin tildes. `q` exige que todas sus palabras aparezcan en el nombre, un sinónimo, el código o un componente. Paginación por cursor.

Contexto declarado en el controlador: Lista el catálogo con búsqueda sin tildes ni mayúsculas (incluye sinónimos y componentes).

### Descripción del sistema

NestJS resuelve `GET /clinical/study-catalog` en `StudyCatalogController_list`. El controlador delega en `StudyCatalogService.list`. No recibe body. El tipo de retorno estático es `Promise<StudyCatalogPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `family` | query | No | `string` | valores: `LAB`, `IMAGING`, `CARDIO`, `PATHOLOGY`, `PROCEDURE` | Sin descripción específica en OpenAPI. | `LAB` |
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto libre (hasta 100 caracteres) | `valor-ejemplo` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | 1 a 100; por omisión 25 | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /clinical/study-catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /clinical/study-catalog?family=LAB&q=valor-ejemplo&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StudyCatalogPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<StudyCatalogPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<StudyCatalogPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<StudyCatalogPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<StudyCatalogPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<StudyCatalogPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<StudyCatalogPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StudyCatalogPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "legacyCode": "CODIGO_EJEMPLO",
      "codeSystem": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "family": {},
      "componentsSelectable": true,
      "componentCount": 1,
      "specimenHint": {
        "text": "valor-ejemplo",
        "code": "CODIGO_EJEMPLO",
        "hl7Code": "CODIGO_EJEMPLO",
        "snomedCode": "CODIGO_EJEMPLO",
        "source": "valor-ejemplo"
      },
      "modalityConceptId": "00000000-0000-4000-8000-000000000001",
      "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
      "provenance": {
        "source": "valor-ejemplo",
        "version": "valor-ejemplo",
        "sourceIds": [
          "valor-ejemplo"
        ]
      },
      "section": {
        "code": "CODIGO_EJEMPLO",
        "name": "Nombre de ejemplo"
      },
      "componentNames": [
        "Nombre de ejemplo"
      ],
      "regionCode": "CODIGO_EJEMPLO",
      "requiresLaterality": true
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<StudyCatalogItemDto>` | Sin restricción adicional declarada | Estudios de la página. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","legacyCode":"CODIGO_EJEMPLO","codeSystem":"CODIGO_EJEMPLO","display":"valor-ejemplo","family":{},"componentsSelectable":true,"componentCount":1,"specimenHint":{"text":"valor-ejemplo","code":"CODIGO_EJEMPLO","hl7Code":"CODIGO_EJEMPLO","snomedCode":"CODIGO_EJEMPLO","source":"valor-ejemplo"},"modalityConceptId":"00000000-0000-4000-8000-000000000001","bodySiteConceptId":"00000000-0000-4000-8000-000000000001","provenance":{"source":"valor-ejemplo","version":"valor-ejemplo","sourceIds":["valor-ejemplo"]},"section":{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo"},"componentNames":["Nombre de ejemplo"],"regionCode":"CODIGO_EJEMPLO","requiresLaterality":true}]` |
| `items[].conceptId` | Sí | `string` | formato `uuid` | Concepto del estudio: es el `codeConceptId` que se manda al pedirlo. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código del catálogo (`HEMOGRAMA`, `RX_TORAX_PA`). | `CODIGO_EJEMPLO` |
| `items[].legacyCode` | No | `string` | admite null | Código local anterior (`LAB_HEMOGRAMA`) cuando el estudio ya existía. | `CODIGO_EJEMPLO` |
| `items[].codeSystem` | Sí | `string` | Sin restricción adicional declarada | Sistema de codificación del concepto. | `CODIGO_EJEMPLO` |
| `items[].display` | Sí | `string` | Sin restricción adicional declarada | Nombre en castellano. | `valor-ejemplo` |
| `items[].family` | Sí | `object` | Sin restricción adicional declarada | Familia del estudio. | `{}` |
| `items[].componentsSelectable` | Sí | `boolean` | Sin restricción adicional declarada | Si el estudio se pide con componentes marcables. | `true` |
| `items[].componentCount` | Sí | `number` | Sin restricción adicional declarada | Cuántos componentes directos tiene. | `1` |
| `items[].specimenHint` | No | `SpecimenHintDto` | Sin restricción adicional declarada | Muestra sugerida (laboratorio). | `{"text":"valor-ejemplo","code":"CODIGO_EJEMPLO","hl7Code":"CODIGO_EJEMPLO","snomedCode":"CODIGO_EJEMPLO","source":"valor-ejemplo"}` |
| `items[].specimenHint.text` | No | `string` | Sin restricción adicional declarada | Nombre de la muestra, en castellano. | `valor-ejemplo` |
| `items[].specimenHint.code` | No | `string` | Sin restricción adicional declarada | Código del catálogo (`SANGRE_EDTA`). | `CODIGO_EJEMPLO` |
| `items[].specimenHint.hl7Code` | No | `string` | admite null | HL7 v2 tabla 0487, si la muestra tiene equivalente. | `CODIGO_EJEMPLO` |
| `items[].specimenHint.snomedCode` | No | `string` | admite null | SNOMED CT, si la muestra tiene equivalente. | `CODIGO_EJEMPLO` |
| `items[].specimenHint.source` | No | `string` | Sin restricción adicional declarada | Origen del dato, para mostrarlo. | `valor-ejemplo` |
| `items[].modalityConceptId` | No | `string` | formato `uuid`; admite null | Modalidad del estudio (imagen). | `00000000-0000-4000-8000-000000000001` |
| `items[].bodySiteConceptId` | No | `string` | formato `uuid`; admite null | Región por defecto del estudio (imagen). | `00000000-0000-4000-8000-000000000001` |
| `items[].provenance` | Sí | `StudyProvenanceDto` | Sin restricción adicional declarada | De dónde sale el renglón. | `{"source":"valor-ejemplo","version":"valor-ejemplo","sourceIds":["valor-ejemplo"]}` |
| `items[].provenance.source` | No | `string` | admite null | Archivo versionado del que sale (`laboratorio.json` \| `imagenologia.json`), o `null` en un estudio local. | `valor-ejemplo` |
| `items[].provenance.version` | No | `string` | admite null | Versión del catálogo (fecha). | `valor-ejemplo` |
| `items[].provenance.sourceIds` | Sí | `array<string>` | Sin restricción adicional declarada | Fuentes que respaldan el renglón (ids de `fuentes` del catálogo). | `["valor-ejemplo"]` |
| `items[].section` | No | `StudySectionDto` | Sin restricción adicional declarada | Sección de laboratorio; `null` en imagen y en estudios sin sección sembrada. | `{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo"}` |
| `items[].section.code` | No | `string` | Sin restricción adicional declarada | Código de la sección (`HEMATO`). | `CODIGO_EJEMPLO` |
| `items[].section.name` | No | `string` | Sin restricción adicional declarada | Nombre en castellano (`Hematología`). | `Nombre de ejemplo` |
| `items[].componentNames` | Sí | `array<string>` | Sin restricción adicional declarada | Nombres de los componentes directos del panel (máx. 60, en su orden); `[]` si no tiene. | `["Nombre de ejemplo"]` |
| `items[].regionCode` | No | `string` | admite null | Código de la región por defecto del estudio (`TORAX`); `null` fuera de imagen. | `CODIGO_EJEMPLO` |
| `items[].requiresLaterality` | No | `boolean` | admite null | Si el estudio exige lateralidad; `null` fuera de imagen. | `true` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántos devolvió esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null` si es la última. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/study-catalog"
}
```

---

## 2. GET /clinical/study-catalog/{conceptId}

- **Módulo:** `study_catalog`
- **Etiqueta OpenAPI:** `study-catalog`
- **Nombre:** Detalle de un estudio del catálogo
- **Operation ID:** `StudyCatalogController_detail`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StudyCatalogController.detail](../../src/modules/study_catalog/controllers/study-catalog.controller.ts)

### Descripción de negocio

Componentes anidados (laboratorio), muestra sugerida y elegibles, modalidad, regiones permitidas, lateralidad, contraste y avisos de licencia (LOINC, DICOM, SNOMED, RadLex, UBERON). 404 si el concepto no es un estudio del catálogo.

Contexto declarado en el controlador: Detalle de un estudio: componentes, muestra sugerida, modalidad, regiones y contraste.

### Descripción del sistema

NestJS resuelve `GET /clinical/study-catalog/{conceptId}` en `StudyCatalogController_detail`. El controlador delega en `StudyCatalogService.detail`. No recibe body. El tipo de retorno estático es `Promise<StudyCatalogDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conceptId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /clinical/study-catalog/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /clinical/study-catalog/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StudyCatalogDetailDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<StudyCatalogDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<StudyCatalogDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<StudyCatalogDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<StudyCatalogDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<StudyCatalogDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<StudyCatalogDetailDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<StudyCatalogDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StudyCatalogDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "components": [
    {
      "componentOfferingId": "00000000-0000-4000-8000-000000000001",
      "componentRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "quantity": "1",
      "ordinal": 1
    }
  ],
  "suggestedSpecimen": {
    "conceptId": "00000000-0000-4000-8000-000000000001",
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo",
    "isDefault": true
  },
  "allowedSpecimenTypes": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "isDefault": true
    }
  ],
  "allowedModalities": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "isDefault": true
    }
  ],
  "allowedBodySites": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "parentConceptId": "00000000-0000-4000-8000-000000000001",
      "regionType": "valor-ejemplo",
      "admitsLaterality": true,
      "isDefault": true
    }
  ],
  "lateralityOptions": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "isDefault": true
    }
  ],
  "contrastOptions": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "isDefault": true
    }
  ],
  "lab": {
    "section": "valor-ejemplo",
    "fasting": true,
    "turnaroundHours": 1,
    "loincCode": "CODIGO_EJEMPLO",
    "loincName": "Nombre de ejemplo"
  },
  "imaging": {
    "projections": [
      "valor-ejemplo"
    ],
    "contrast": "valor-ejemplo",
    "contrastRoute": "valor-ejemplo",
    "preparation": "valor-ejemplo",
    "requiresLaterality": true,
    "loincCode": "CODIGO_EJEMPLO",
    "radlexRpid": "00000000-0000-4000-8000-000000000001"
  },
  "attribution": [
    {
      "source": "valor-ejemplo",
      "url": "valor-ejemplo",
      "license": "valor-ejemplo",
      "text": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `components` | Sí | `array<StudyComponentDto>` | Sin restricción adicional declarada | Componentes (árbol). Vacío si el estudio no se desglosa. | `[{"componentOfferingId":"00000000-0000-4000-8000-000000000001","componentRoleConceptId":"00000000-0000-4000-8000-000000000001","quantity":"1","ordinal":1}]` |
| `components[].componentOfferingId` | Sí | `string` | formato `uuid` | Oferta que actúa como componente | `00000000-0000-4000-8000-000000000001` |
| `components[].componentRoleConceptId` | No | `string` | formato `uuid` | Rol del componente (concept id) | `00000000-0000-4000-8000-000000000001` |
| `components[].quantity` | No | `string` | Sin restricción adicional declarada | Cantidad | `1` |
| `components[].ordinal` | No | `number` | Sin restricción adicional declarada | Orden en el panel | `1` |
| `suggestedSpecimen` | No | `StudyOptionDto` | Sin restricción adicional declarada | Muestra que el catálogo propone convertida en concepto de `specimen-type`, si hay equivalencia. | `{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","display":"valor-ejemplo","isDefault":true}` |
| `suggestedSpecimen.conceptId` | No | `string` | formato `uuid` | Concepto de la opción. | `00000000-0000-4000-8000-000000000001` |
| `suggestedSpecimen.code` | No | `string` | Sin restricción adicional declarada | Código de la opción. | `CODIGO_EJEMPLO` |
| `suggestedSpecimen.display` | No | `string` | Sin restricción adicional declarada | Rótulo en castellano. | `valor-ejemplo` |
| `suggestedSpecimen.isDefault` | No | `boolean` | Sin restricción adicional declarada | Opción que el estudio fija o sugiere. | `true` |
| `allowedSpecimenTypes` | Sí | `array<StudyOptionDto>` | Sin restricción adicional declarada | Tipos de muestra elegibles (value set `specimen-type`); vacío si el estudio no lleva muestra. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","display":"valor-ejemplo","isDefault":true}]` |
| `allowedSpecimenTypes[].conceptId` | Sí | `string` | formato `uuid` | Concepto de la opción. | `00000000-0000-4000-8000-000000000001` |
| `allowedSpecimenTypes[].code` | Sí | `string` | Sin restricción adicional declarada | Código de la opción. | `CODIGO_EJEMPLO` |
| `allowedSpecimenTypes[].display` | Sí | `string` | Sin restricción adicional declarada | Rótulo en castellano. | `valor-ejemplo` |
| `allowedSpecimenTypes[].isDefault` | Sí | `boolean` | Sin restricción adicional declarada | Opción que el estudio fija o sugiere. | `true` |
| `allowedModalities` | Sí | `array<StudyOptionDto>` | Sin restricción adicional declarada | Modalidades elegibles; el estudio fija una. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","display":"valor-ejemplo","isDefault":true}]` |
| `allowedModalities[].conceptId` | Sí | `string` | formato `uuid` | Concepto de la opción. | `00000000-0000-4000-8000-000000000001` |
| `allowedModalities[].code` | Sí | `string` | Sin restricción adicional declarada | Código de la opción. | `CODIGO_EJEMPLO` |
| `allowedModalities[].display` | Sí | `string` | Sin restricción adicional declarada | Rótulo en castellano. | `valor-ejemplo` |
| `allowedModalities[].isDefault` | Sí | `boolean` | Sin restricción adicional declarada | Opción que el estudio fija o sugiere. | `true` |
| `allowedBodySites` | Sí | `array<AllowedBodySiteDto>` | Sin restricción adicional declarada | Regiones elegibles: la del estudio y las que contiene. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","display":"valor-ejemplo","parentConceptId":"00000000-0000-4000-8000-000000000001","regionType":"valor-ejemplo","admitsLaterality":true,"isDefault":true}]` |
| `allowedBodySites[].conceptId` | Sí | `string` | formato `uuid` | Concepto de la región: es el `bodySiteConceptId` de la orden. | `00000000-0000-4000-8000-000000000001` |
| `allowedBodySites[].code` | Sí | `string` | Sin restricción adicional declarada | Código de la región (`MANO`). | `CODIGO_EJEMPLO` |
| `allowedBodySites[].display` | Sí | `string` | Sin restricción adicional declarada | Nombre en castellano. | `valor-ejemplo` |
| `allowedBodySites[].parentConceptId` | No | `string` | formato `uuid`; admite null | Región contenedora dentro del catálogo (`null` en la raíz). | `00000000-0000-4000-8000-000000000001` |
| `allowedBodySites[].regionType` | No | `string` | admite null | Clase de región del catálogo (`region`, `grupo`, `vascular`, `combinada`). | `valor-ejemplo` |
| `allowedBodySites[].admitsLaterality` | Sí | `boolean` | Sin restricción adicional declarada | Si la región admite lado izquierdo/derecho. | `true` |
| `allowedBodySites[].isDefault` | Sí | `boolean` | Sin restricción adicional declarada | Es la región por defecto del estudio. | `true` |
| `lateralityOptions` | Sí | `array<StudyOptionDto>` | Sin restricción adicional declarada | Opciones de lateralidad (vocabulario `condition-laterality`); vacío si el estudio no es de imagen. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","display":"valor-ejemplo","isDefault":true}]` |
| `lateralityOptions[].conceptId` | Sí | `string` | formato `uuid` | Concepto de la opción. | `00000000-0000-4000-8000-000000000001` |
| `lateralityOptions[].code` | Sí | `string` | Sin restricción adicional declarada | Código de la opción. | `CODIGO_EJEMPLO` |
| `lateralityOptions[].display` | Sí | `string` | Sin restricción adicional declarada | Rótulo en castellano. | `valor-ejemplo` |
| `lateralityOptions[].isDefault` | Sí | `boolean` | Sin restricción adicional declarada | Opción que el estudio fija o sugiere. | `true` |
| `contrastOptions` | Sí | `array<StudyOptionDto>` | Sin restricción adicional declarada | Opciones de contraste (`imaging-contrast`); vacío si el estudio no es de imagen. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","display":"valor-ejemplo","isDefault":true}]` |
| `contrastOptions[].conceptId` | Sí | `string` | formato `uuid` | Concepto de la opción. | `00000000-0000-4000-8000-000000000001` |
| `contrastOptions[].code` | Sí | `string` | Sin restricción adicional declarada | Código de la opción. | `CODIGO_EJEMPLO` |
| `contrastOptions[].display` | Sí | `string` | Sin restricción adicional declarada | Rótulo en castellano. | `valor-ejemplo` |
| `contrastOptions[].isDefault` | Sí | `boolean` | Sin restricción adicional declarada | Opción que el estudio fija o sugiere. | `true` |
| `lab` | No | `LabStudyDetailDto` | Sin restricción adicional declarada | Datos de laboratorio, si es un análisis. | `{"section":"valor-ejemplo","fasting":true,"turnaroundHours":1,"loincCode":"CODIGO_EJEMPLO","loincName":"Nombre de ejemplo"}` |
| `lab.section` | No | `string` | admite null | Sección del laboratorio (`HEMATO`). | `valor-ejemplo` |
| `lab.fasting` | No | `boolean` | admite null | Ayuno requerido, si el catálogo lo dice. | `true` |
| `lab.turnaroundHours` | No | `number` | admite null | Horas de entrega, si el catálogo lo dice. | `1` |
| `lab.loincCode` | No | `string` | admite null | Código LOINC del análisis, si está verificado. | `CODIGO_EJEMPLO` |
| `lab.loincName` | No | `string` | admite null | Nombre LOINC (inglés). | `Nombre de ejemplo` |
| `imaging` | No | `ImagingStudyDetailDto` | Sin restricción adicional declarada | Datos de imagen, si es un estudio de imagen. | `{"projections":["valor-ejemplo"],"contrast":"valor-ejemplo","contrastRoute":"valor-ejemplo","preparation":"valor-ejemplo","requiresLaterality":true,"loincCode":"CODIGO_EJEMPLO","radlexRpid":"00000000-0000-4000-8000-000000000001"}` |
| `imaging.projections` | No | `array<string>` | Sin restricción adicional declarada | Proyecciones o cortes del estudio. | `["valor-ejemplo"]` |
| `imaging.contrast` | No | `string` | Sin restricción adicional declarada | Contraste del estudio (`sin` \| `con` \| `sin_y_con`). | `valor-ejemplo` |
| `imaging.contrastRoute` | No | `string` | admite null | Vía de administración del contraste, texto del catálogo. | `valor-ejemplo` |
| `imaging.preparation` | No | `string` | admite null | Preparación del paciente. | `valor-ejemplo` |
| `imaging.requiresLaterality` | No | `boolean` | Sin restricción adicional declarada | El estudio exige lateralidad. | `true` |
| `imaging.loincCode` | No | `string` | admite null | Código LOINC, si está verificado. | `CODIGO_EJEMPLO` |
| `imaging.radlexRpid` | No | `string` | admite null | Identificador RadLex Playbook. | `00000000-0000-4000-8000-000000000001` |
| `attribution` | Sí | `array<AttributionDto>` | Sin restricción adicional declarada | Avisos de licencia que deben mostrarse junto al estudio. | `[{"source":"valor-ejemplo","url":"valor-ejemplo","license":"valor-ejemplo","text":"valor-ejemplo"}]` |
| `attribution[].source` | Sí | `string` | Sin restricción adicional declarada | Nombre de la fuente. | `valor-ejemplo` |
| `attribution[].url` | Sí | `string` | Sin restricción adicional declarada | Sitio de la fuente. | `valor-ejemplo` |
| `attribution[].license` | Sí | `string` | Sin restricción adicional declarada | Licencia. | `valor-ejemplo` |
| `attribution[].text` | Sí | `string` | Sin restricción adicional declarada | Texto del aviso. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Estudio no encontrado en el catálogo | Excepción explícita en src/modules/study_catalog/services/study-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/study-catalog/{conceptId}"
}
```

---

