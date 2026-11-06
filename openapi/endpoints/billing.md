<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `billing`

Referencia exhaustiva de 56 operación(es) del módulo `billing`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `admin-catalogs-services`, `billing-operations`, `billing-payables`, `billing-receivables`, `billing-service-catalog`, `billing-simulated`, `billing-space-charges`, `patient-spending`
- **Controladores:** `AdminServiceCatalogController`, `BillingOperationsController`, `BillingPayablesController`, `BillingReceivablesController`, `BillingServiceCatalogController`, `BillingSimulatedController`, `BillingSpaceChargesController`, `PatientSpendingController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /admin/catalogs/services](#1-get-admin-catalogs-services) — Listar servicios de la organización, filtrable por tipo
2. [POST /admin/catalogs/services](#2-post-admin-catalogs-services) — Crear un servicio (idempotente por práctica y código)
3. [GET /admin/catalogs/services/{id}](#3-get-admin-catalogs-services-id) — Ver un servicio con su versión
4. [PATCH /admin/catalogs/services/{id}](#4-patch-admin-catalogs-services-id) — Editar un servicio con precondición de versión
5. [POST /admin/catalogs/services/{id}/deactivate](#5-post-admin-catalogs-services-id-deactivate) — Desactivar un servicio (no se borra)
6. [POST /admin/catalogs/services/{id}/reactivate](#6-post-admin-catalogs-services-id-reactivate) — Reactivar un servicio desactivado
7. [GET /admin/catalogs/services/scopes](#7-get-admin-catalogs-services-scopes) — Tipos de organización, prácticas y monedas del editor de servicios
8. [GET /billing/bed-day/stays](#8-get-billing-bed-day-stays) — Estancias de internación de una sede (F5e)
9. [POST /billing/bills](#9-post-billing-bills) — Registrar factura de proveedor con three-way match
10. [POST /billing/charge-captures/{id}/void](#10-post-billing-charge-captures-id-void) — Anular un cargo devengado
11. [POST /billing/documents/{id}:post-to-ledger](#11-post-billing-documents-id-post-to-ledger) — Contabilizar documento (posting CxC/CxP)
12. [POST /billing/dunning-runs:execute](#12-post-billing-dunning-runs-execute) — Ejecutar ciclo de morosidad (dunning)
13. [POST /billing/encounters/{encounterId}/bed-day-charges/run](#13-post-billing-encounters-encounterid-bed-day-charges-run) — Devengar los días-cama de un encuentro
14. [GET /billing/encounters/{encounterId}/pending-charges](#14-get-billing-encounters-encounterid-pending-charges) — Cargos devengados pendientes
15. [POST /billing/internal/dunning-runs/run-due](#15-post-billing-internal-dunning-runs-run-due) — Evaluar y disparar morosidad automática por tenant
16. [GET /billing/invoices](#16-get-billing-invoices) — Listar las facturas de la práctica
17. [POST /billing/invoices:issue-from-encounter](#17-post-billing-invoices-issue-from-encounter) — Emitir factura desde los cargos del encuentro
18. [GET /billing/invoices/{id}](#18-get-billing-invoices-id) — Detalle de una factura, con sus líneas
19. [POST /billing/invoices/{id}:credit-note](#19-post-billing-invoices-id-credit-note) — Emitir nota de crédito / castigo sobre una factura
20. [POST /billing/kpi-snapshots:compute](#20-post-billing-kpi-snapshots-compute) — Calcular snapshot de KPI financiero y aging
21. [GET /billing/patient-statements](#21-get-billing-patient-statements) — Listar los estados de cuenta de la práctica
22. [POST /billing/patient-statements:generate](#22-post-billing-patient-statements-generate) — Generar el estado de cuenta del paciente
23. [POST /billing/payment-plans](#23-post-billing-payment-plans) — Configurar un plan de pagos del paciente
24. [POST /billing/payments-made:execute](#24-post-billing-payments-made-execute) — Ejecutar pago a proveedor con asignación
25. [POST /billing/payments-received:apply](#25-post-billing-payments-received-apply) — Aplicar un pago recibido con asignación multi-factura
26. [POST /billing/reconciliation:clear](#26-post-billing-reconciliation-clear) — Conciliar pagos vía documento de compensación
27. [POST /billing/reimbursements:link](#27-post-billing-reimbursements-link) — Vincular reembolso de reclamo de seguro a la factura
28. [GET /billing/service-catalog](#28-get-billing-service-catalog) — Listar el catálogo de servicios de la práctica
29. [POST /billing/service-catalog](#29-post-billing-service-catalog) — Dar de alta en el catálogo un servicio del repositorio
30. [PATCH /billing/service-catalog/{id}](#30-patch-billing-service-catalog-id) — Corregir un servicio del catálogo de mi práctica
31. [GET /billing/service-catalog/{id}/image](#31-get-billing-service-catalog-id-image) — Descargar la imagen de un servicio que el actor puede ver
32. [POST /billing/service-catalog/import](#32-post-billing-service-catalog-import) — Importar servicios del repositorio a mi catálogo
33. [POST /billing/service-catalog/import-procedures](#33-post-billing-service-catalog-import-procedures) — Importar en lote procedimientos del arancel al catálogo
34. [GET /billing/service-catalog/procedure-specialties](#34-get-billing-service-catalog-procedure-specialties) — Listar las especialidades del nomenclador de procedimientos
35. [GET /billing/service-catalog/procedure-specialties/mine](#35-get-billing-service-catalog-procedure-specialties-mine) — Listar las especialidades del arancel que corresponden al médico
36. [GET /billing/service-catalog/procedures](#36-get-billing-service-catalog-procedures) — Listar el nomenclador de procedimientos (arancel de referencia)
37. [GET /billing/service-catalog/repository](#37-get-billing-service-catalog-repository) — Buscar en el repositorio de servicios (para importar)
38. [GET /billing/service-catalog/repository/facets](#38-get-billing-service-catalog-repository-facets) — Fuentes y especialidades del repositorio de servicios
39. [GET /billing/simulated/catalogs](#39-get-billing-simulated-catalogs) — Catálogos paramétricos del SIAT simulado
40. [GET /billing/simulated/charges](#40-get-billing-simulated-charges) — Cobros de consultas (opcionalmente de una persona)
41. [POST /billing/simulated/charges/{chargeId}/instances/{instanceId}/payments](#41-post-billing-simulated-charges-chargeid-instances-instanceid-payments) — Pago de una instancia de plan (no soportado: 409 NOT_A_PLAN)
42. [POST /billing/simulated/charges/{chargeId}/invoices](#42-post-billing-simulated-charges-chargeid-invoices) — Emitir la factura SIAT simulada de un cobro pagado
43. [POST /billing/simulated/charges/{chargeId}/payment](#43-post-billing-simulated-charges-chargeid-payment) — Registrar el pago real de un cobro
44. [GET /billing/simulated/invoices/{invoiceId}](#44-get-billing-simulated-invoices-invoiceid) — Una factura simulada, dentro del alcance de quien la pide
45. [POST /billing/simulated/invoices/{invoiceId}/annulment](#45-post-billing-simulated-invoices-invoiceid-annulment) — Anular la factura (sólo administración)
46. [POST /billing/simulated/invoices/{invoiceId}/annulment-reversal](#46-post-billing-simulated-invoices-invoiceid-annulment-reversal) — Revertir la anulación (sólo administración)
47. [POST /billing/simulated/invoices/{invoiceId}/email](#47-post-billing-simulated-invoices-invoiceid-email) — Encolar el envío (simulado, no se envía) de la factura
48. [GET /billing/simulated/my-invoices](#48-get-billing-simulated-my-invoices) — Mis facturas: recibidas (paciente) o emitidas (quien factura)
49. [GET /billing/simulated/my-invoices/{invoiceId}](#49-get-billing-simulated-my-invoices-invoiceid) — Una de mis facturas
50. [GET /billing/simulated/outbox](#50-get-billing-simulated-outbox) — Bandeja de correo simulada (sólo administración)
51. [GET /billing/simulated/status](#51-get-billing-simulated-status) — Estado fiscal simulado: emisores y credenciales sintéticas
52. [GET /billing/space-tariffs](#52-get-billing-space-tariffs) — Tarifas de espacios
53. [POST /billing/space-tariffs](#53-post-billing-space-tariffs) — Crear una tarifa de espacio
54. [POST /billing/space-tariffs/{id}/close](#54-post-billing-space-tariffs-id-close) — Cerrar la vigencia de una tarifa
55. [POST /internal/billing/bed-day-charges/run](#55-post-internal-billing-bed-day-charges-run) — Devengar día-cama y quirófano (worker)
56. [GET /patient-spending/me](#56-get-patient-spending-me) — Mis gastos de salud

---

## 1. GET /admin/catalogs/services

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `admin-catalogs-services`
- **Nombre:** Listar servicios de la organización, filtrable por tipo
- **Operation ID:** `AdminServiceCatalogController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminServiceCatalogController.list](../../src/modules/billing/controllers/admin-service-catalog.controller.ts)

### Descripción de negocio

Listar servicios de la organización, filtrable por tipo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalogs/services` en `AdminServiceCatalogController_list`. El controlador delega en `AdminServiceCatalogService.list`. No recibe body. El tipo de retorno estático es `Promise<AdminServicePageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceTypeConceptId` | query | No | `string` | formato `uuid` | Tipo de organización (concepto PR_TYPE_*): consultorio, laboratorio, farmacia, aseguradora… | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `isActive` | query | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `true` |
| `q` | query | No | `string` | longitud máxima 100 | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalogs/services HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalogs/services?practiceTypeConceptId=00000000-0000-4000-8000-000000000001&practiceId=00000000-0000-4000-8000-000000000001&isActive=true&q=valor-ejemplo&cursor=valor-ejemplo&limit=50 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AdminServicePageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<AdminServicePageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<AdminServicePageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<AdminServicePageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<AdminServicePageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<AdminServicePageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<AdminServicePageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AdminServicePageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practiceId": "00000000-0000-4000-8000-000000000001",
      "practiceTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "descriptionText": "Texto descriptivo de ejemplo",
      "termsText": "valor-ejemplo",
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "defaultPrice": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001",
      "currencyCode": "BOB",
      "isActive": true,
      "rowVersion": 1,
      "updatedAt": "2026-07-31T12:00:00.000Z",
      "updatedByUserId": "00000000-0000-4000-8000-000000000001"
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
| `items` | Sí | `array<AdminServiceItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","practiceId":"00000000-0000-4000-8000-000000000001","practiceTypeConceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","descriptionText":"Texto descriptivo de ejemplo","termsText":"valor-ejemplo","serviceConceptId":"00000000-0000-4000-8000-000000000001","defaultPrice":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001","currencyCode":"BOB","isActive":true,"rowVersion":1,"updatedAt":"2026-07-31T12:00:00.000Z","updatedByUserId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practiceTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de la organización dueña (la dimensión «tipo de usuario» disponible hoy). | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].descriptionText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `items[].termsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].currencyCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `items[].isActive` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión actual: es el `expectedRowVersion` de la próxima escritura. | `1` |
| `items[].updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].updatedByUserId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalogs/services"
}
```

---

## 2. POST /admin/catalogs/services

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `admin-catalogs-services`
- **Nombre:** Crear un servicio (idempotente por práctica y código)
- **Operation ID:** `AdminServiceCatalogController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminServiceCatalogController.create](../../src/modules/billing/controllers/admin-service-catalog.controller.ts)

### Descripción de negocio

Crear un servicio (idempotente por práctica y código). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/catalogs/services` en `AdminServiceCatalogController_create`. El controlador delega en `AdminServiceCatalogService.create`. Valida el body como `AdminCreateServiceDto` y consume `application/json`. El tipo de retorno estático es `Promise<AdminServiceItemDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AdminCreateServiceDto`; los campos opcionales se omiten.

```http
POST /admin/catalogs/services HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "defaultPrice": "100.00"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Práctica dueña del servicio | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 120 | Código interno, único en la práctica | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `descriptionText` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | Sí | `string` | patrón runtime `PRICE_PATTERN` | Sin descripción específica en el contrato OpenAPI. | `100.00` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `isActive` | No | `boolean` | Sin restricción adicional declarada | Por defecto true | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/catalogs/services HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "descriptionText": "Texto descriptivo de ejemplo",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "100.00",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "isActive": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AdminServiceItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practiceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "descriptionText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "currencyCode": "BOB",
  "isActive": true,
  "rowVersion": 1,
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "updatedByUserId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de la organización dueña (la dimensión «tipo de usuario» disponible hoy). | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `descriptionText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `termsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `currencyCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión actual: es el `expectedRowVersion` de la próxima escritura. | `1` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `updatedByUserId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un servicio con ese código en el catálogo | Excepción explícita en src/modules/billing/services/admin-service-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalogs/services"
}
```

---

## 3. GET /admin/catalogs/services/{id}

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `admin-catalogs-services`
- **Nombre:** Ver un servicio con su versión
- **Operation ID:** `AdminServiceCatalogController_get`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminServiceCatalogController.get](../../src/modules/billing/controllers/admin-service-catalog.controller.ts)

### Descripción de negocio

Ver un servicio con su versión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalogs/services/{id}` en `AdminServiceCatalogController_get`. El controlador delega en `AdminServiceCatalogService.get`. No recibe body. El tipo de retorno estático es `Promise<AdminServiceItemDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalogs/services/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalogs/services/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<AdminServiceItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AdminServiceItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practiceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "descriptionText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "currencyCode": "BOB",
  "isActive": true,
  "rowVersion": 1,
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "updatedByUserId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de la organización dueña (la dimensión «tipo de usuario» disponible hoy). | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `descriptionText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `termsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `currencyCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión actual: es el `expectedRowVersion` de la próxima escritura. | `1` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `updatedByUserId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Servicio no encontrado | Excepción explícita en src/modules/billing/services/admin-service-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalogs/services/{id}"
}
```

---

## 4. PATCH /admin/catalogs/services/{id}

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `admin-catalogs-services`
- **Nombre:** Editar un servicio con precondición de versión
- **Operation ID:** `AdminServiceCatalogController_update`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminServiceCatalogController.update](../../src/modules/billing/controllers/admin-service-catalog.controller.ts)

### Descripción de negocio

Editar un servicio con precondición de versión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /admin/catalogs/services/{id}` en `AdminServiceCatalogController_update`. El controlador delega en `AdminServiceCatalogService.update`. Valida el body como `AdminUpdateServiceDto` y consume `application/json`. El tipo de retorno estático es `Promise<AdminServiceItemDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AdminUpdateServiceDto`; los campos opcionales se omiten.

```http
PATCH /admin/catalogs/services/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedRowVersion": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expectedRowVersion` | Sí | `number` | mínimo 1 | row_version leída (bloqueo optimista) | `1` |
| `name` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `descriptionText` | No | `string` | longitud máxima 2000; admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `termsText` | No | `string` | longitud máxima 20000; admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | No | `string` | patrón runtime `PRICE_PATTERN` | Sin descripción específica en el contrato OpenAPI. | `150.00` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sólo se acepta junto con `defaultPrice` | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /admin/catalogs/services/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedRowVersion": 1,
  "name": "Nombre de ejemplo",
  "descriptionText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "150.00",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AdminServiceItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practiceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "descriptionText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "currencyCode": "BOB",
  "isActive": true,
  "rowVersion": 1,
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "updatedByUserId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de la organización dueña (la dimensión «tipo de usuario» disponible hoy). | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `descriptionText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `termsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `currencyCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión actual: es el `expectedRowVersion` de la próxima escritura. | `1` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `updatedByUserId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Servicio no encontrado | Excepción explícita en src/modules/billing/services/admin-service-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalogs/services/{id}"
}
```

---

## 5. POST /admin/catalogs/services/{id}/deactivate

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `admin-catalogs-services`
- **Nombre:** Desactivar un servicio (no se borra)
- **Operation ID:** `AdminServiceCatalogController_deactivate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminServiceCatalogController.deactivate](../../src/modules/billing/controllers/admin-service-catalog.controller.ts)

### Descripción de negocio

Desactivar un servicio (no se borra). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/catalogs/services/{id}/deactivate` en `AdminServiceCatalogController_deactivate`. El controlador delega en `AdminServiceCatalogService.setActive`. Valida el body como `AdminServiceStateChangeDto` y consume `application/json`. El tipo de retorno estático es `Promise<AdminServiceItemDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AdminServiceStateChangeDto`; los campos opcionales se omiten.

```http
POST /admin/catalogs/services/00000000-0000-4000-8000-000000000001/deactivate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedRowVersion": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expectedRowVersion` | Sí | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/catalogs/services/00000000-0000-4000-8000-000000000001/deactivate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedRowVersion": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AdminServiceItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practiceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "descriptionText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "currencyCode": "BOB",
  "isActive": true,
  "rowVersion": 1,
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "updatedByUserId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de la organización dueña (la dimensión «tipo de usuario» disponible hoy). | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `descriptionText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `termsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `currencyCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión actual: es el `expectedRowVersion` de la próxima escritura. | `1` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `updatedByUserId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Servicio no encontrado | Excepción explícita en src/modules/billing/services/admin-service-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalogs/services/{id}/deactivate"
}
```

---

## 6. POST /admin/catalogs/services/{id}/reactivate

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `admin-catalogs-services`
- **Nombre:** Reactivar un servicio desactivado
- **Operation ID:** `AdminServiceCatalogController_reactivate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminServiceCatalogController.reactivate](../../src/modules/billing/controllers/admin-service-catalog.controller.ts)

### Descripción de negocio

Reactivar un servicio desactivado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/catalogs/services/{id}/reactivate` en `AdminServiceCatalogController_reactivate`. El controlador delega en `AdminServiceCatalogService.setActive`. Valida el body como `AdminServiceStateChangeDto` y consume `application/json`. El tipo de retorno estático es `Promise<AdminServiceItemDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AdminServiceStateChangeDto`; los campos opcionales se omiten.

```http
POST /admin/catalogs/services/00000000-0000-4000-8000-000000000001/reactivate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedRowVersion": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expectedRowVersion` | Sí | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/catalogs/services/00000000-0000-4000-8000-000000000001/reactivate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedRowVersion": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AdminServiceItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AdminServiceItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practiceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "descriptionText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "currencyCode": "BOB",
  "isActive": true,
  "rowVersion": 1,
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "updatedByUserId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de la organización dueña (la dimensión «tipo de usuario» disponible hoy). | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `descriptionText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `termsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `currencyCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión actual: es el `expectedRowVersion` de la próxima escritura. | `1` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `updatedByUserId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Servicio no encontrado | Excepción explícita en src/modules/billing/services/admin-service-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalogs/services/{id}/reactivate"
}
```

---

## 7. GET /admin/catalogs/services/scopes

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `admin-catalogs-services`
- **Nombre:** Tipos de organización, prácticas y monedas del editor de servicios
- **Operation ID:** `AdminServiceCatalogController_scopes`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminServiceCatalogController.scopes](../../src/modules/billing/controllers/admin-service-catalog.controller.ts)

### Descripción de negocio

Tipos de organización, prácticas y monedas del editor de servicios. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalogs/services/scopes` en `AdminServiceCatalogController_scopes`. El controlador delega en `AdminServiceCatalogService.scopes`. No recibe body. El tipo de retorno estático es `Promise<AdminServiceScopesDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalogs/services/scopes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalogs/services/scopes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AdminServiceScopesDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<AdminServiceScopesDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<AdminServiceScopesDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<AdminServiceScopesDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<AdminServiceScopesDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<AdminServiceScopesDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<AdminServiceScopesDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AdminServiceScopesDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "types": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ],
  "practices": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "typeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "currencies": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `types` | Sí | `array<AdminServiceScopeTypeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `types[].conceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `types[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `types[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `practices` | Sí | `array<AdminServiceScopePracticeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","typeConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `practices[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practices[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `practices[].typeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `currencies` | Sí | `array<AdminServiceScopeCurrencyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO"}]` |
| `currencies[].conceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `currencies[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalogs/services/scopes"
}
```

---

## 8. GET /billing/bed-day/stays

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-space-charges`
- **Nombre:** Estancias de internación de una sede (F5e)
- **Operation ID:** `BillingSpaceChargesController_stays`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSpaceChargesController.stays](../../src/modules/billing/controllers/billing-space-charges.controller.ts)

### Descripción de negocio

Estancias de internación de una sede (F5e). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Estancias de internación de la sede (de dónde elige Facturación).

### Descripción del sistema

NestJS resuelve `GET /billing/bed-day/stays` en `BillingSpaceChargesController_stays`. El controlador delega en `SpaceChargesService.stays`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | query | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `from` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `2026-10-01` |
| `to` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `2026-10-31` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/bed-day/stays?siteId=00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /billing/bed-day/stays?siteId=00000000-0000-4000-8000-000000000001&from=2026-10-01&to=2026-10-31 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 422 | `PRECONDITION_FAILED` | Rango inválido (máximo 366 días) | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/bed-day/stays"
}
```

---

## 9. POST /billing/bills

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-payables`
- **Nombre:** Registrar factura de proveedor con three-way match
- **Operation ID:** `BillingPayablesController_registerBill`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingPayablesController.registerBill](../../src/modules/billing/controllers/billing-payables.controller.ts)

### Descripción de negocio

Registrar factura de proveedor con three-way match. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/bills` en `BillingPayablesController_registerBill`. El controlador delega en `BillsService.register`. Valida el body como `RegisterBillDto` y consume `application/json`. El tipo de retorno estático es `Promise<BillResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterBillDto`; los campos opcionales se omiten.

```http
POST /billing/bills HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "vendorId": "00000000-0000-4000-8000-000000000001",
  "billNumber": "valor-ejemplo",
  "lines": [
    {
      "quantity": "1",
      "unitPrice": "100.00"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `vendorId` | Sí | `string` | formato `uuid` | Proveedor (billing.vendors) | `00000000-0000-4000-8000-000000000001` |
| `billNumber` | Sí | `string` | longitud máxima 60 | Número de factura del proveedor | `valor-ejemplo` |
| `issueDate` | No | `string` | formato `date-time` | Fecha de emisión (ISO); por defecto hoy | `2026-07-31T12:00:00.000Z` |
| `dueDate` | No | `string` | formato `date-time` | Fecha de vencimiento (ISO) | `2026-07-31T12:00:00.000Z` |
| `currencyConceptId` | No | `string` | formato `uuid` | Moneda (concepto) | `00000000-0000-4000-8000-000000000001` |
| `purchaseOrderId` | No | `string` | formato `uuid` | Orden de compra (erp.purchase_orders) | `00000000-0000-4000-8000-000000000001` |
| `contractId` | No | `string` | formato `uuid` | Contrato (erp.contracts) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant (directory.tenants); requerido para el vínculo de documento | `00000000-0000-4000-8000-000000000001` |
| `lines` | Sí | `array<BillLineInputDto>` | mínimo 1 elemento(s) | Líneas (al menos una) | `[{"description":"Texto descriptivo de ejemplo","quantity":"1","unitPrice":"100.00","taxAmount":"0.00","expenseAccountId":"00000000-0000-4000-8000-000000000001","costCenterId":"00000000-0000-4000-8000-000000000001","purchaseOrderItemId":"00000000-0000-4000-8000-000000000001","goodsReceiptItemId":"00000000-0000-4000-8000-000000000001","serviceEntryItemId":"00000000-0000-4000-8000-000000000001"}]` |
| `lines[].description` | No | `string` | longitud máxima 500 | Descripción de la línea | `Texto descriptivo de ejemplo` |
| `lines[].quantity` | Sí | `string` | patrón runtime `QUANTITY_PATTERN` | Cantidad | `1` |
| `lines[].unitPrice` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Precio unitario | `100.00` |
| `lines[].taxAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Monto de impuesto de la línea | `0.00` |
| `lines[].expenseAccountId` | No | `string` | formato `uuid` | Cuenta de gasto (accounting.accounts) | `00000000-0000-4000-8000-000000000001` |
| `lines[].costCenterId` | No | `string` | formato `uuid` | Centro de costo (accounting.cost_centers) | `00000000-0000-4000-8000-000000000001` |
| `lines[].purchaseOrderItemId` | No | `string` | formato `uuid` | Ítem de orden de compra (erp.purchase_order_items) | `00000000-0000-4000-8000-000000000001` |
| `lines[].goodsReceiptItemId` | No | `string` | formato `uuid` | Ítem de recepción de bienes (erp.goods_receipt_items) | `00000000-0000-4000-8000-000000000001` |
| `lines[].serviceEntryItemId` | No | `string` | formato `uuid` | Ítem de hoja de servicio (erp.service_entry_items) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/bills HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "vendorId": "00000000-0000-4000-8000-000000000001",
  "billNumber": "valor-ejemplo",
  "issueDate": "2026-07-31T12:00:00.000Z",
  "dueDate": "2026-07-31T12:00:00.000Z",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "purchaseOrderId": "00000000-0000-4000-8000-000000000001",
  "contractId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    {
      "description": "Texto descriptivo de ejemplo",
      "quantity": "1",
      "unitPrice": "100.00",
      "taxAmount": "0.00",
      "expenseAccountId": "00000000-0000-4000-8000-000000000001",
      "costCenterId": "00000000-0000-4000-8000-000000000001",
      "purchaseOrderItemId": "00000000-0000-4000-8000-000000000001",
      "goodsReceiptItemId": "00000000-0000-4000-8000-000000000001",
      "serviceEntryItemId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BillResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BillResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "billNumber": "valor-ejemplo",
  "vendorId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "subtotal": "valor-ejemplo",
  "taxTotal": "valor-ejemplo",
  "total": "valor-ejemplo",
  "balance": "valor-ejemplo",
  "lineCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `billNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de bill number mantenido por la instancia. | `valor-ejemplo` |
| `vendorId` | Sí | `string` | formato `uuid` | Identificador asociado a vendor. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `subtotal` | No | `string` | Sin restricción adicional declarada | Valor de subtotal mantenido por la instancia. | `valor-ejemplo` |
| `taxTotal` | No | `string` | Sin restricción adicional declarada | Valor de tax total mantenido por la instancia. | `valor-ejemplo` |
| `total` | No | `string` | Sin restricción adicional declarada | Valor de total mantenido por la instancia. | `valor-ejemplo` |
| `balance` | No | `string` | Sin restricción adicional declarada | Valor de balance mantenido por la instancia. | `valor-ejemplo` |
| `lineCount` | Sí | `number` | Sin restricción adicional declarada | Valor de line count mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | La factura del proveedor ya fue capturada | Excepción explícita en src/modules/billing/services/bills.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El proveedor no está activo | Excepción explícita en src/modules/billing/services/bills.service.ts |
| 422 | `PRECONDITION_FAILED` | Three-way match: la línea con orden de compra requiere recepción de bienes | Excepción explícita en src/modules/billing/services/bills.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/bills"
}
```

---

## 10. POST /billing/charge-captures/{id}/void

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-space-charges`
- **Nombre:** Anular un cargo devengado
- **Operation ID:** `BillingSpaceChargesController_void`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSpaceChargesController.void](../../src/modules/billing/controllers/billing-space-charges.controller.ts)

### Descripción de negocio

Anular un cargo devengado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Anular un cargo devengado.

### Descripción del sistema

NestJS resuelve `POST /billing/charge-captures/{id}/void` en `BillingSpaceChargesController_void`. El controlador delega en `SpaceChargesService.voidCharge`. Valida el body como `VoidChargeDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VoidChargeDto`; los campos opcionales se omiten.

```http
POST /billing/charge-captures/00000000-0000-4000-8000-000000000001/void HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/charge-captures/00000000-0000-4000-8000-000000000001/void HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cargo no encontrado | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 409 | `CONFLICT` | El cargo ya está facturado | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 409 | `CONFLICT` | El cargo no está pendiente | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/charge-captures/{id}/void"
}
```

---

## 11. POST /billing/documents/{id}:post-to-ledger

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-operations`
- **Nombre:** Contabilizar documento (posting CxC/CxP)
- **Operation ID:** `BillingOperationsController_postToLedger`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingOperationsController.postToLedger](../../src/modules/billing/controllers/billing-operations.controller.ts)

### Descripción de negocio

Contabilizar documento (posting CxC/CxP). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/documents/{id}:post-to-ledger` en `BillingOperationsController_postToLedger`. El controlador delega en `LedgerService.postToLedger`. Valida el body como `PostToLedgerDto` y consume `application/json`. El tipo de retorno estático es `Promise<PostingResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PostToLedgerDto`; los campos opcionales se omiten.

```http
POST /billing/documents/00000000-0000-4000-8000-000000000001:post-to-ledger HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "documentType": "INVOICE",
  "transactionId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `documentType` | Sí | `string` | valores: `INVOICE`, `BILL`, `PAYMENT_RECEIVED`, `PAYMENT_MADE` | Tipo del documento origen | `INVOICE` |
| `transactionId` | Sí | `string` | formato `uuid` | Asiento contable resuelto (accounting.journal_transactions) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/documents/00000000-0000-4000-8000-000000000001:post-to-ledger HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "documentType": "INVOICE",
  "transactionId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PostingResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "documentType": "INVOICE",
  "transactionId": "00000000-0000-4000-8000-000000000001",
  "posted": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `documentType` | Sí | `string` | valores: `INVOICE`, `BILL`, `PAYMENT_RECEIVED`, `PAYMENT_MADE` | Valor de document type mantenido por la instancia. | `INVOICE` |
| `transactionId` | Sí | `string` | formato `uuid` | Identificador asociado a transaction. | `00000000-0000-4000-8000-000000000001` |
| `posted` | Sí | `boolean` | Sin restricción adicional declarada | Valor de posted mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El documento ya fue contabilizado | Excepción explícita en src/modules/billing/services/ledger.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/documents/{id}:post-to-ledger"
}
```

---

## 12. POST /billing/dunning-runs:execute

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-operations`
- **Nombre:** Ejecutar ciclo de morosidad (dunning)
- **Operation ID:** `BillingOperationsController_executeDunning`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingOperationsController.executeDunning](../../src/modules/billing/controllers/billing-operations.controller.ts)

### Descripción de negocio

Ejecutar ciclo de morosidad (dunning). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/dunning-runs:execute` en `BillingOperationsController_executeDunning`. El controlador delega en `DunningService.execute`. Valida el body como `ExecuteDunningRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<DunningRunResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExecuteDunningRunDto`; los campos opcionales se omiten.

```http
POST /billing/dunning-runs:execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "runNumber": "valor-ejemplo",
  "items": [
    {
      "invoiceId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Tenant (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `runNumber` | Sí | `string` | longitud máxima 60 | Número de corrida (único por tenant) | `valor-ejemplo` |
| `runDate` | No | `string` | formato `date-time` | Fecha de la corrida (ISO); por defecto hoy | `2026-07-31T12:00:00.000Z` |
| `dunningLevelConceptId` | No | `string` | formato `uuid` | Nivel de morosidad (concepto) | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<DunningItemInputDto>` | mínimo 1 elemento(s) | Facturas morosas (al menos una) | `[{"invoiceId":"00000000-0000-4000-8000-000000000001","outstandingAmount":"50.00","daysOverdue":30,"dunningFee":"0.00","businessPartnerId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].invoiceId` | Sí | `string` | formato `uuid` | Factura morosa (billing.invoices) | `00000000-0000-4000-8000-000000000001` |
| `items[].outstandingAmount` | No | `string` | Sin restricción adicional declarada | Saldo pendiente | `50.00` |
| `items[].daysOverdue` | No | `number` | mínimo 0 | Días de mora | `30` |
| `items[].dunningFee` | No | `string` | Sin restricción adicional declarada | Recargo por mora | `0.00` |
| `items[].businessPartnerId` | No | `string` | formato `uuid` | Socio de negocio (erp.business_partners) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/dunning-runs:execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "runNumber": "valor-ejemplo",
  "runDate": "2026-07-31T12:00:00.000Z",
  "dunningLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "invoiceId": "00000000-0000-4000-8000-000000000001",
      "outstandingAmount": "50.00",
      "daysOverdue": 30,
      "dunningFee": "0.00",
      "businessPartnerId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DunningRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "runNumber": "valor-ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "itemCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `runNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de run number mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `itemCount` | Sí | `number` | Sin restricción adicional declarada | Valor de item count mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El número de corrida ya existe para el tenant | Excepción explícita en src/modules/billing/services/dunning.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/dunning-runs:execute"
}
```

---

## 13. POST /billing/encounters/{encounterId}/bed-day-charges/run

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-space-charges`
- **Nombre:** Devengar los días-cama de un encuentro
- **Operation ID:** `BillingSpaceChargesController_run`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSpaceChargesController.run](../../src/modules/billing/controllers/billing-space-charges.controller.ts)

### Descripción de negocio

Devengar los días-cama de un encuentro. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Devengo de día-cama a pedido (idempotente).

### Descripción del sistema

NestJS resuelve `POST /billing/encounters/{encounterId}/bed-day-charges/run` en `BillingSpaceChargesController_run`. El controlador delega en `SpaceChargesService.runBedDays`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `encounterId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /billing/encounters/00000000-0000-4000-8000-000000000001/bed-day-charges/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `encounterId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /billing/encounters/00000000-0000-4000-8000-000000000001/bed-day-charges/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Encuentro no encontrado | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/encounters/{encounterId}/bed-day-charges/run"
}
```

---

## 14. GET /billing/encounters/{encounterId}/pending-charges

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-space-charges`
- **Nombre:** Cargos devengados pendientes
- **Operation ID:** `BillingSpaceChargesController_pending`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSpaceChargesController.pending](../../src/modules/billing/controllers/billing-space-charges.controller.ts)

### Descripción de negocio

Cargos devengados pendientes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Cargos devengados pendientes de un encuentro.

### Descripción del sistema

NestJS resuelve `GET /billing/encounters/{encounterId}/pending-charges` en `BillingSpaceChargesController_pending`. El controlador delega en `SpaceChargesService.pending`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `encounterId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/encounters/00000000-0000-4000-8000-000000000001/pending-charges HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `encounterId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /billing/encounters/00000000-0000-4000-8000-000000000001/pending-charges HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Encuentro no encontrado | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/encounters/{encounterId}/pending-charges"
}
```

---

## 15. POST /billing/internal/dunning-runs/run-due

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-operations`
- **Nombre:** Evaluar y disparar morosidad automática por tenant
- **Operation ID:** `BillingOperationsController_runDueDunning`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingOperationsController.runDueDunning](../../src/modules/billing/controllers/billing-operations.controller.ts)

### Descripción de negocio

Idempotente por día (`AUTO-<fecha>` por tenant): reintentar el mismo día no duplica la corrida.

Contexto declarado en el controlador: Fase 4 del plan de corrección de workers: descubrimiento + disparo diario de morosidad, por tenant. `dunning-runs:execute` (arriba) sigue siendo el contrato para una corrida puntual con facturas elegidas a mano; este endpoint es lo que hace falta para que exista una corrida automática sin que nadie tenga que armar la lista de facturas.

### Descripción del sistema

NestJS resuelve `POST /billing/internal/dunning-runs/run-due` en `BillingOperationsController_runDueDunning`. El controlador delega en `DunningService.runDueDunning`. Valida el body como `RunDueDunningDto` y consume `application/json`. El tipo de retorno estático es `Promise<RunDueDunningResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunDueDunningDto`; los campos opcionales se omiten.

```http
POST /billing/internal/dunning-runs/run-due HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `limit` | No | `number` | mínimo 1; máximo 2000 | Máximo de facturas vencidas por tenant en esta corrida | `500` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/internal/dunning-runs/run-due HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "limit": 500
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RunDueDunningResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "tenantsProcessed": 1,
  "results": [
    {
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "runId": "00000000-0000-4000-8000-000000000001",
      "itemCount": 1,
      "skipped": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantsProcessed` | Sí | `number` | Sin restricción adicional declarada | Tenants con al menos una factura vencida | `1` |
| `results` | Sí | `array<TenantDunningResultDto>` | Sin restricción adicional declarada | Valor de results mantenido por la instancia. | `[{"tenantId":"00000000-0000-4000-8000-000000000001","runId":"00000000-0000-4000-8000-000000000001","itemCount":1,"skipped":true}]` |
| `results[].tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `results[].runId` | Sí | `string` | formato `uuid` | Identificador asociado a run. | `00000000-0000-4000-8000-000000000001` |
| `results[].itemCount` | Sí | `number` | Sin restricción adicional declarada | Facturas incluidas en la corrida | `1` |
| `results[].skipped` | Sí | `boolean` | Sin restricción adicional declarada | true si el tenant ya tenía una corrida automática hoy | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/internal/dunning-runs/run-due"
}
```

---

## 16. GET /billing/invoices

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Listar las facturas de la práctica
- **Operation ID:** `BillingReceivablesController_listInvoices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.listInvoices](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Listar las facturas de la práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CV-12 — facturación deja de ser el único placeholder del menú: listado de facturas de la práctica, sin ninguna acción de cobro.

### Descripción del sistema

NestJS resuelve `GET /billing/invoices` en `BillingReceivablesController_listInvoices`. El controlador delega en `InvoicesService.listByPractice`. No recibe body. El tipo de retorno estático es `Promise<ListInvoicesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | query | Sí | `string` | Sin restricción adicional declarada | Práctica (uuid) | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Facturas por página | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/invoices?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /billing/invoices?practiceId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListInvoicesResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListInvoicesResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListInvoicesResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListInvoicesResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListInvoicesResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListInvoicesResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ListInvoicesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListInvoicesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "invoiceNumber": "valor-ejemplo",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "status": "00000000-0000-4000-8000-000000000001",
      "issueDate": "2026-07-31",
      "dueDate": "2026-07-31",
      "total": "valor-ejemplo",
      "balance": "valor-ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
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
| `items` | Sí | `array<InvoiceSummaryDto>` | Sin restricción adicional declarada | Facturas de esta página, ordenadas por `id`. | `[{"id":"00000000-0000-4000-8000-000000000001","invoiceNumber":"valor-ejemplo","patientProfileId":"00000000-0000-4000-8000-000000000001","status":"00000000-0000-4000-8000-000000000001","issueDate":"2026-07-31","dueDate":"2026-07-31","total":"valor-ejemplo","balance":"valor-ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].invoiceNumber` | Sí | `string` | Sin restricción adicional declarada | Número de factura. | `valor-ejemplo` |
| `items[].patientProfileId` | Sí | `string` | formato `uuid` | Paciente facturado. | `00000000-0000-4000-8000-000000000001` |
| `items[].status` | Sí | `string` | formato `uuid` | Concepto de estado. | `00000000-0000-4000-8000-000000000001` |
| `items[].issueDate` | Sí | `string` | formato `date` | Fecha de emisión. | `2026-07-31` |
| `items[].dueDate` | No | `string` | formato `date` | Fecha de vencimiento, si tiene. | `2026-07-31` |
| `items[].total` | No | `string` | Sin restricción adicional declarada | Importe total. | `valor-ejemplo` |
| `items[].balance` | No | `string` | Sin restricción adicional declarada | Saldo pendiente. | `valor-ejemplo` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Fecha de alta. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `nextCursor` | Sí | `string` | admite null | Cursor opaco de continuación, o `null` si ésta es la última página. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/invoices"
}
```

---

## 17. POST /billing/invoices:issue-from-encounter

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Emitir factura desde los cargos del encuentro
- **Operation ID:** `BillingReceivablesController_issueFromEncounter`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.issueFromEncounter](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Emitir factura desde los cargos del encuentro. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/invoices:issue-from-encounter` en `BillingReceivablesController_issueFromEncounter`. El controlador delega en `InvoicesService.issueFromEncounter`. Valida el body como `IssueInvoiceFromEncounterDto` y consume `application/json`. El tipo de retorno estático es `Promise<InvoiceResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IssueInvoiceFromEncounterDto`; los campos opcionales se omiten.

```http
POST /billing/invoices:issue-from-encounter HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    {
      "quantity": "1",
      "unitPrice": "100.00"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Práctica emisora (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente facturado (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro origen (clinical.encounters) | `00000000-0000-4000-8000-000000000001` |
| `invoiceNumber` | No | `string` | longitud máxima 60 | Número de folio; si se omite se genera | `valor-ejemplo` |
| `issueDate` | No | `string` | formato `date-time` | Fecha de emisión (ISO); por defecto hoy | `2026-07-31T12:00:00.000Z` |
| `dueDate` | No | `string` | formato `date-time` | Fecha de vencimiento (ISO) | `2026-07-31T12:00:00.000Z` |
| `currencyConceptId` | No | `string` | formato `uuid` | Moneda (terminology.catalog_concepts) | `00000000-0000-4000-8000-000000000001` |
| `claimId` | No | `string` | formato `uuid` | Reclamo de seguro asociado (para el vínculo de documento) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant (directory.tenants); requerido para registrar el vínculo de documento | `00000000-0000-4000-8000-000000000001` |
| `lines` | Sí | `array<InvoiceLineInputDto>` | Sin restricción adicional declarada | Líneas de cargo (al menos una, salvo que se facturen cargos devengados con chargeCaptureIds) | `[{"serviceId":"00000000-0000-4000-8000-000000000001","description":"Texto descriptivo de ejemplo","quantity":"1","unitPrice":"100.00","discount":"0.00","taxCodeId":"00000000-0000-4000-8000-000000000001","taxAmount":"0.00","incomeAccountId":"00000000-0000-4000-8000-000000000001","costCenterId":"00000000-0000-4000-8000-000000000001"}]` |
| `lines[].serviceId` | No | `string` | formato `uuid` | Servicio del catálogo (billing.service_catalog) | `00000000-0000-4000-8000-000000000001` |
| `lines[].description` | No | `string` | longitud máxima 500 | Descripción libre de la línea | `Texto descriptivo de ejemplo` |
| `lines[].quantity` | Sí | `string` | patrón runtime `QUANTITY_PATTERN` | Cantidad | `1` |
| `lines[].unitPrice` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Precio unitario | `100.00` |
| `lines[].discount` | No | `string` | patrón runtime `MONEY_PATTERN` | Descuento de línea | `0.00` |
| `lines[].taxCodeId` | No | `string` | formato `uuid` | Código de impuesto (billing.tax_codes) | `00000000-0000-4000-8000-000000000001` |
| `lines[].taxAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Monto de impuesto de la línea | `0.00` |
| `lines[].incomeAccountId` | No | `string` | formato `uuid` | Cuenta de ingreso (accounting.accounts) | `00000000-0000-4000-8000-000000000001` |
| `lines[].costCenterId` | No | `string` | formato `uuid` | Centro de costo (accounting.cost_centers) | `00000000-0000-4000-8000-000000000001` |
| `chargeCaptureIds` | No | `array<string>` | formato `uuid`; máximo 200 elemento(s) | Cargos devengados a facturar (F5e), hasta 200, sin repetir | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/invoices:issue-from-encounter HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "invoiceNumber": "valor-ejemplo",
  "issueDate": "2026-07-31T12:00:00.000Z",
  "dueDate": "2026-07-31T12:00:00.000Z",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "claimId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    {
      "serviceId": "00000000-0000-4000-8000-000000000001",
      "description": "Texto descriptivo de ejemplo",
      "quantity": "1",
      "unitPrice": "100.00",
      "discount": "0.00",
      "taxCodeId": "00000000-0000-4000-8000-000000000001",
      "taxAmount": "0.00",
      "incomeAccountId": "00000000-0000-4000-8000-000000000001",
      "costCenterId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "chargeCaptureIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InvoiceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "invoiceNumber": "valor-ejemplo",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "subtotal": "valor-ejemplo",
  "taxTotal": "valor-ejemplo",
  "discountTotal": "valor-ejemplo",
  "total": "valor-ejemplo",
  "paidTotal": "valor-ejemplo",
  "balance": "valor-ejemplo",
  "lineCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `invoiceNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de invoice number mantenido por la instancia. | `valor-ejemplo` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado | `00000000-0000-4000-8000-000000000001` |
| `subtotal` | No | `string` | Sin restricción adicional declarada | Valor de subtotal mantenido por la instancia. | `valor-ejemplo` |
| `taxTotal` | No | `string` | Sin restricción adicional declarada | Valor de tax total mantenido por la instancia. | `valor-ejemplo` |
| `discountTotal` | No | `string` | Sin restricción adicional declarada | Valor de discount total mantenido por la instancia. | `valor-ejemplo` |
| `total` | No | `string` | Sin restricción adicional declarada | Valor de total mantenido por la instancia. | `valor-ejemplo` |
| `paidTotal` | No | `string` | Sin restricción adicional declarada | Valor de paid total mantenido por la instancia. | `valor-ejemplo` |
| `balance` | No | `string` | Sin restricción adicional declarada | Valor de balance mantenido por la instancia. | `valor-ejemplo` |
| `lineCount` | Sí | `number` | Sin restricción adicional declarada | Valor de line count mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | INVOICE_ENCOUNTER_NOT_FOUND.message | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 404 | `NOT_FOUND` | Cargo no encontrado | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 409 | `CONFLICT` | El número de factura ya existe en la práctica | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 409 | `CONFLICT` | El cargo ya está facturado | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 409 | `CONFLICT` | El cargo no está pendiente | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Los servicios con seguro se facturan al paciente desde la solicitud de seguro, con su parte calculada | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 422 | `PRECONDITION_FAILED` | El cargo no tiene precio (sin tarifa vigente) | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/invoices:issue-from-encounter"
}
```

---

## 18. GET /billing/invoices/{id}

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Detalle de una factura, con sus líneas
- **Operation ID:** `BillingReceivablesController_getInvoice`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.getInvoice](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Detalle de una factura, con sus líneas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CV-12 — detalle de una factura con sus líneas.

### Descripción del sistema

NestJS resuelve `GET /billing/invoices/{id}` en `BillingReceivablesController_getInvoice`. El controlador delega en `InvoicesService.getDetail`. No recibe body. El tipo de retorno estático es `Promise<InvoiceDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | query | Sí | `string` | Sin restricción adicional declarada | Práctica (uuid) | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/invoices/00000000-0000-4000-8000-000000000001?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /billing/invoices/00000000-0000-4000-8000-000000000001?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<InvoiceDetailDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<InvoiceDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<InvoiceDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<InvoiceDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<InvoiceDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<InvoiceDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<InvoiceDetailDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<InvoiceDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InvoiceDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "lines": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "description": "Texto descriptivo de ejemplo",
      "quantity": "valor-ejemplo",
      "unitPrice": "valor-ejemplo",
      "discount": "valor-ejemplo",
      "taxAmount": "valor-ejemplo",
      "lineTotal": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `lines` | Sí | `array<InvoiceLineDto>` | Sin restricción adicional declarada | Líneas de la factura. | `[{"id":"00000000-0000-4000-8000-000000000001","description":"Texto descriptivo de ejemplo","quantity":"valor-ejemplo","unitPrice":"valor-ejemplo","discount":"valor-ejemplo","taxAmount":"valor-ejemplo","lineTotal":"valor-ejemplo"}]` |
| `lines[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `lines[].description` | No | `string` | Sin restricción adicional declarada | Descripción de la línea. | `Texto descriptivo de ejemplo` |
| `lines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Cantidad facturada. | `valor-ejemplo` |
| `lines[].unitPrice` | Sí | `string` | Sin restricción adicional declarada | Precio unitario. | `valor-ejemplo` |
| `lines[].discount` | No | `string` | Sin restricción adicional declarada | Descuento de la línea, si tiene. | `valor-ejemplo` |
| `lines[].taxAmount` | No | `string` | Sin restricción adicional declarada | Impuesto de la línea, si tiene. | `valor-ejemplo` |
| `lines[].lineTotal` | No | `string` | Sin restricción adicional declarada | Importe total de la línea. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Factura no encontrada | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/invoices/{id}"
}
```

---

## 19. POST /billing/invoices/{id}:credit-note

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Emitir nota de crédito / castigo sobre una factura
- **Operation ID:** `BillingReceivablesController_creditNote`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.creditNote](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Emitir nota de crédito / castigo sobre una factura. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/invoices/{id}:credit-note` en `BillingReceivablesController_creditNote`. El controlador delega en `InvoicesService.creditNote`. Valida el body como `CreditNoteDto` y consume `application/json`. El tipo de retorno estático es `Promise<InvoiceResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreditNoteDto`; los campos opcionales se omiten.

```http
POST /billing/invoices/00000000-0000-4000-8000-000000000001:credit-note HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo",
  "lines": [
    {
      "quantity": "1",
      "unitPrice": "100.00"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | longitud máxima 500 | Motivo del ajuste / nota de crédito | `Texto descriptivo de ejemplo` |
| `tenantId` | No | `string` | formato `uuid` | Tenant (directory.tenants); requerido para registrar el vínculo CREDIT_OF | `00000000-0000-4000-8000-000000000001` |
| `writeOff` | No | `boolean` | Sin restricción adicional declarada | Si es un castigo de saldo incobrable (write-off) | `true` |
| `lines` | Sí | `array<CreditNoteLineInputDto>` | mínimo 1 elemento(s) | Líneas a revertir | `[{"description":"Texto descriptivo de ejemplo","quantity":"1","unitPrice":"100.00","taxAmount":"0.00"}]` |
| `lines[].description` | No | `string` | longitud máxima 500 | Descripción del reverso | `Texto descriptivo de ejemplo` |
| `lines[].quantity` | Sí | `string` | patrón runtime `QUANTITY_PATTERN` | Cantidad (positiva; se invierte el signo del total) | `1` |
| `lines[].unitPrice` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Precio unitario a revertir | `100.00` |
| `lines[].taxAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Impuesto a revertir | `0.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/invoices/00000000-0000-4000-8000-000000000001:credit-note HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "writeOff": true,
  "lines": [
    {
      "description": "Texto descriptivo de ejemplo",
      "quantity": "1",
      "unitPrice": "100.00",
      "taxAmount": "0.00"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InvoiceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "invoiceNumber": "valor-ejemplo",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "subtotal": "valor-ejemplo",
  "taxTotal": "valor-ejemplo",
  "discountTotal": "valor-ejemplo",
  "total": "valor-ejemplo",
  "paidTotal": "valor-ejemplo",
  "balance": "valor-ejemplo",
  "lineCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `invoiceNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de invoice number mantenido por la instancia. | `valor-ejemplo` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado | `00000000-0000-4000-8000-000000000001` |
| `subtotal` | No | `string` | Sin restricción adicional declarada | Valor de subtotal mantenido por la instancia. | `valor-ejemplo` |
| `taxTotal` | No | `string` | Sin restricción adicional declarada | Valor de tax total mantenido por la instancia. | `valor-ejemplo` |
| `discountTotal` | No | `string` | Sin restricción adicional declarada | Valor de discount total mantenido por la instancia. | `valor-ejemplo` |
| `total` | No | `string` | Sin restricción adicional declarada | Valor de total mantenido por la instancia. | `valor-ejemplo` |
| `paidTotal` | No | `string` | Sin restricción adicional declarada | Valor de paid total mantenido por la instancia. | `valor-ejemplo` |
| `balance` | No | `string` | Sin restricción adicional declarada | Valor de balance mantenido por la instancia. | `valor-ejemplo` |
| `lineCount` | Sí | `number` | Sin restricción adicional declarada | Valor de line count mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La nota de crédito debe revertir un importe positivo | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 422 | `PRECONDITION_FAILED` | El monto de la nota de crédito excede el saldo de la factura | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/invoices/{id}:credit-note"
}
```

---

## 20. POST /billing/kpi-snapshots:compute

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-operations`
- **Nombre:** Calcular snapshot de KPI financiero y aging
- **Operation ID:** `BillingOperationsController_computeKpi`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingOperationsController.computeKpi](../../src/modules/billing/controllers/billing-operations.controller.ts)

### Descripción de negocio

Calcular snapshot de KPI financiero y aging. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/kpi-snapshots:compute` en `BillingOperationsController_computeKpi`. El controlador delega en `KpiSnapshotsService.compute`. Valida el body como `ComputeKpiSnapshotDto` y consume `application/json`. El tipo de retorno estático es `Promise<KpiSnapshotResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ComputeKpiSnapshotDto`; los campos opcionales se omiten.

```http
POST /billing/kpi-snapshots:compute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "kpiCode": "CODIGO_EJEMPLO",
  "valueNumeric": "42.50"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `fiscalPeriodId` | No | `string` | formato `uuid` | Periodo fiscal (accounting.fiscal_periods) | `00000000-0000-4000-8000-000000000001` |
| `kpiCode` | Sí | `string` | longitud máxima 60 | Código de KPI (p. ej. DSO, AR_AGING, CASH_POSITION) | `CODIGO_EJEMPLO` |
| `valueNumeric` | Sí | `string` | Sin restricción adicional declarada | Valor calculado del KPI | `42.50` |
| `dimensionJson` | No | `object` | Sin restricción adicional declarada | Dimensiones del cálculo (JSON) | `{}` |
| `computedAt` | No | `string` | formato `date-time` | Marca del cálculo (ISO); por defecto ahora | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/kpi-snapshots:compute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "kpiCode": "CODIGO_EJEMPLO",
  "valueNumeric": "42.50",
  "dimensionJson": {},
  "computedAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `KpiSnapshotResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "kpiCode": "CODIGO_EJEMPLO",
  "valueNumeric": "valor-ejemplo",
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `kpiCode` | Sí | `string` | Sin restricción adicional declarada | Valor de kpi code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `valueNumeric` | Sí | `string` | Sin restricción adicional declarada | Valor de value numeric mantenido por la instancia. | `valor-ejemplo` |
| `recordedAt` | Sí | `string` | formato `date-time` | Valor de recorded at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El snapshot de KPI ya fue calculado para esa marca | Excepción explícita en src/modules/billing/services/kpi-snapshots.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/kpi-snapshots:compute"
}
```

---

## 21. GET /billing/patient-statements

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Listar los estados de cuenta de la práctica
- **Operation ID:** `BillingReceivablesController_listStatements`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.listStatements](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Listar los estados de cuenta de la práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CV-12 — estados de cuenta de la práctica, sólo lectura.

### Descripción del sistema

NestJS resuelve `GET /billing/patient-statements` en `BillingReceivablesController_listStatements`. El controlador delega en `PatientStatementsService.listByPractice`. No recibe body. El tipo de retorno estático es `Promise<ListPatientStatementsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | query | Sí | `string` | Sin restricción adicional declarada | Práctica (uuid) | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Estados de cuenta por página | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/patient-statements?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /billing/patient-statements?practiceId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListPatientStatementsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListPatientStatementsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListPatientStatementsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListPatientStatementsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListPatientStatementsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListPatientStatementsResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ListPatientStatementsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListPatientStatementsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "periodStart": "valor-ejemplo",
      "periodEnd": "valor-ejemplo",
      "openingBalance": "valor-ejemplo",
      "charges": "valor-ejemplo",
      "payments": "valor-ejemplo",
      "closingBalance": "valor-ejemplo"
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
| `items` | Sí | `array<PatientStatementResponseDto>` | Sin restricción adicional declarada | Estados de cuenta de esta página, ordenados por `id`. | `[{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","periodStart":"valor-ejemplo","periodEnd":"valor-ejemplo","openingBalance":"valor-ejemplo","charges":"valor-ejemplo","payments":"valor-ejemplo","closingBalance":"valor-ejemplo"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `items[].periodStart` | Sí | `string` | Sin restricción adicional declarada | Valor de period start mantenido por la instancia. | `valor-ejemplo` |
| `items[].periodEnd` | Sí | `string` | Sin restricción adicional declarada | Valor de period end mantenido por la instancia. | `valor-ejemplo` |
| `items[].openingBalance` | Sí | `string` | Sin restricción adicional declarada | Valor de opening balance mantenido por la instancia. | `valor-ejemplo` |
| `items[].charges` | Sí | `string` | Sin restricción adicional declarada | Valor de charges mantenido por la instancia. | `valor-ejemplo` |
| `items[].payments` | Sí | `string` | Sin restricción adicional declarada | Valor de payments mantenido por la instancia. | `valor-ejemplo` |
| `items[].closingBalance` | Sí | `string` | Sin restricción adicional declarada | Valor de closing balance mantenido por la instancia. | `valor-ejemplo` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `nextCursor` | Sí | `string` | admite null | Cursor opaco de continuación, o `null` si ésta es la última página. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/patient-statements.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/patient-statements"
}
```

---

## 22. POST /billing/patient-statements:generate

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Generar el estado de cuenta del paciente
- **Operation ID:** `BillingReceivablesController_generateStatement`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.generateStatement](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Generar el estado de cuenta del paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/patient-statements:generate` en `BillingReceivablesController_generateStatement`. El controlador delega en `PatientStatementsService.generate`. Valida el body como `GeneratePatientStatementDto` y consume `application/json`. El tipo de retorno estático es `Promise<PatientStatementResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `GeneratePatientStatementDto`; los campos opcionales se omiten.

```http
POST /billing/patient-statements:generate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "periodEnd": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `periodStart` | Sí | `string` | formato `date-time` | Inicio del periodo (ISO) | `2026-07-31T12:00:00.000Z` |
| `periodEnd` | Sí | `string` | formato `date-time` | Fin del periodo (ISO) | `2026-07-31T12:00:00.000Z` |
| `openingBalance` | No | `string` | Sin restricción adicional declarada | Saldo de apertura; por defecto 0.00 | `0.00` |
| `tenantId` | No | `string` | formato `uuid` | Tenant (directory.tenants); requerido para vincular las facturas incluidas | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/patient-statements:generate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "periodEnd": "2026-07-31T12:00:00.000Z",
  "openingBalance": "0.00",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientStatementResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "valor-ejemplo",
  "periodEnd": "valor-ejemplo",
  "openingBalance": "valor-ejemplo",
  "charges": "valor-ejemplo",
  "payments": "valor-ejemplo",
  "closingBalance": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `periodStart` | Sí | `string` | Sin restricción adicional declarada | Valor de period start mantenido por la instancia. | `valor-ejemplo` |
| `periodEnd` | Sí | `string` | Sin restricción adicional declarada | Valor de period end mantenido por la instancia. | `valor-ejemplo` |
| `openingBalance` | Sí | `string` | Sin restricción adicional declarada | Valor de opening balance mantenido por la instancia. | `valor-ejemplo` |
| `charges` | Sí | `string` | Sin restricción adicional declarada | Valor de charges mantenido por la instancia. | `valor-ejemplo` |
| `payments` | Sí | `string` | Sin restricción adicional declarada | Valor de payments mantenido por la instancia. | `valor-ejemplo` |
| `closingBalance` | Sí | `string` | Sin restricción adicional declarada | Valor de closing balance mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un estado de cuenta para el periodo | Excepción explícita en src/modules/billing/services/patient-statements.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/patient-statements:generate"
}
```

---

## 23. POST /billing/payment-plans

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Configurar un plan de pagos del paciente
- **Operation ID:** `BillingReceivablesController_createPaymentPlan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.createPaymentPlan](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Configurar un plan de pagos del paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/payment-plans` en `BillingReceivablesController_createPaymentPlan`. El controlador delega en `InvoicesService.createPaymentPlan`. Valida el body como `CreatePaymentPlanDto` y consume `application/json`. El tipo de retorno estático es `Promise<PaymentPlanResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePaymentPlanDto`; los campos opcionales se omiten.

```http
POST /billing/payment-plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceInvoiceId": "00000000-0000-4000-8000-000000000001",
  "installments": [
    {
      "dueDate": "2026-07-31T12:00:00.000Z",
      "amount": "25.00"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sourceInvoiceId` | Sí | `string` | formato `uuid` | Factura origen con saldo (billing.invoices) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant (directory.tenants); requerido para vincular las cuotas | `00000000-0000-4000-8000-000000000001` |
| `installments` | Sí | `array<InstallmentInputDto>` | mínimo 1 elemento(s) | Cuotas; la suma debe igualar el saldo origen | `[{"dueDate":"2026-07-31T12:00:00.000Z","amount":"25.00"}]` |
| `installments[].dueDate` | Sí | `string` | formato `date-time` | Fecha de vencimiento de la cuota (ISO) | `2026-07-31T12:00:00.000Z` |
| `installments[].amount` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Importe de la cuota | `25.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/payment-plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceInvoiceId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "installments": [
    {
      "dueDate": "2026-07-31T12:00:00.000Z",
      "amount": "25.00"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PaymentPlanResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "sourceInvoiceId": "00000000-0000-4000-8000-000000000001",
  "installmentCount": 1,
  "installments": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "invoiceNumber": "valor-ejemplo",
      "total": "valor-ejemplo",
      "dueDate": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sourceInvoiceId` | Sí | `string` | formato `uuid` | Identificador asociado a source invoice. | `00000000-0000-4000-8000-000000000001` |
| `installmentCount` | Sí | `number` | Sin restricción adicional declarada | Valor de installment count mantenido por la instancia. | `1` |
| `installments` | Sí | `array<GeneratedInstallmentDto>` | Sin restricción adicional declarada | Valor de installments mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","invoiceNumber":"valor-ejemplo","total":"valor-ejemplo","dueDate":"valor-ejemplo"}]` |
| `installments[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `installments[].invoiceNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de invoice number mantenido por la instancia. | `valor-ejemplo` |
| `installments[].total` | Sí | `string` | Sin restricción adicional declarada | Valor de total mantenido por la instancia. | `valor-ejemplo` |
| `installments[].dueDate` | Sí | `string` | Sin restricción adicional declarada | Valor de due date mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La factura origen no tiene saldo | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 422 | `PRECONDITION_FAILED` | Cada cuota del plan debe ser un importe positivo | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 422 | `PRECONDITION_FAILED` | La suma de cuotas debe igualar el saldo de la factura | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/payment-plans"
}
```

---

## 24. POST /billing/payments-made:execute

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-payables`
- **Nombre:** Ejecutar pago a proveedor con asignación
- **Operation ID:** `BillingPayablesController_executePayment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingPayablesController.executePayment](../../src/modules/billing/controllers/billing-payables.controller.ts)

### Descripción de negocio

Ejecutar pago a proveedor con asignación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/payments-made:execute` en `BillingPayablesController_executePayment`. El controlador delega en `PaymentsMadeService.execute`. Valida el body como `ExecutePaymentMadeDto` y consume `application/json`. El tipo de retorno estático es `Promise<PaymentMadeResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExecutePaymentMadeDto`; los campos opcionales se omiten.

```http
POST /billing/payments-made:execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "amount": "100.00",
  "allocations": [
    {
      "billId": "00000000-0000-4000-8000-000000000001",
      "allocatedAmount": "100.00"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `vendorId` | No | `string` | formato `uuid` | Proveedor (billing.vendors) | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Monto total del pago | `100.00` |
| `methodConceptId` | No | `string` | formato `uuid` | Método de pago (concepto); por defecto transferencia | `00000000-0000-4000-8000-000000000001` |
| `paidAt` | No | `string` | formato `date-time` | Fecha de pago (ISO) | `2026-07-31T12:00:00.000Z` |
| `companyBankAccountId` | No | `string` | formato `uuid` | Cuenta bancaria origen (accounting.company_bank_accounts) | `00000000-0000-4000-8000-000000000001` |
| `allocations` | Sí | `array<PayableAllocationInputDto>` | mínimo 1 elemento(s) | Asignaciones por factura (al menos una) | `[{"billId":"00000000-0000-4000-8000-000000000001","allocatedAmount":"100.00","discountAmount":"0.00","withholdingAmount":"0.00","openItemId":"00000000-0000-4000-8000-000000000001"}]` |
| `allocations[].billId` | Sí | `string` | formato `uuid` | Factura de proveedor destino (billing.bills) | `00000000-0000-4000-8000-000000000001` |
| `allocations[].allocatedAmount` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Monto asignado | `100.00` |
| `allocations[].discountAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Descuento | `0.00` |
| `allocations[].withholdingAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Retención (withholding) | `0.00` |
| `allocations[].openItemId` | No | `string` | formato `uuid` | Partida abierta del subledger (accounting.open_items) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/payments-made:execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "vendorId": "00000000-0000-4000-8000-000000000001",
  "amount": "100.00",
  "methodConceptId": "00000000-0000-4000-8000-000000000001",
  "paidAt": "2026-07-31T12:00:00.000Z",
  "companyBankAccountId": "00000000-0000-4000-8000-000000000001",
  "allocations": [
    {
      "billId": "00000000-0000-4000-8000-000000000001",
      "allocatedAmount": "100.00",
      "discountAmount": "0.00",
      "withholdingAmount": "0.00",
      "openItemId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PaymentMadeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "amount": "valor-ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "allocations": [
    {
      "billId": "00000000-0000-4000-8000-000000000001",
      "allocatedAmount": "valor-ejemplo",
      "balance": "valor-ejemplo",
      "status": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Valor de amount mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `allocations` | Sí | `array<AllocatedBillDto>` | Sin restricción adicional declarada | Valor de allocations mantenido por la instancia. | `[{"billId":"00000000-0000-4000-8000-000000000001","allocatedAmount":"valor-ejemplo","balance":"valor-ejemplo","status":"00000000-0000-4000-8000-000000000001"}]` |
| `allocations[].billId` | Sí | `string` | formato `uuid` | Identificador asociado a bill. | `00000000-0000-4000-8000-000000000001` |
| `allocations[].allocatedAmount` | Sí | `string` | Sin restricción adicional declarada | Valor de allocated amount mantenido por la instancia. | `valor-ejemplo` |
| `allocations[].balance` | No | `string` | Sin restricción adicional declarada | Valor de balance mantenido por la instancia. | `valor-ejemplo` |
| `allocations[].status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El monto del pago debe ser positivo | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 422 | `PRECONDITION_FAILED` | La asignación debe ser un importe positivo | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 422 | `PRECONDITION_FAILED` | El descuento debe ser un importe no negativo | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 422 | `PRECONDITION_FAILED` | La retención debe ser un importe no negativo | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 422 | `PRECONDITION_FAILED` | La suma asignada más retención excede el monto del pago | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 422 | `PRECONDITION_FAILED` | La factura de proveedor no tiene saldo | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 422 | `PRECONDITION_FAILED` | La asignación excede el saldo de la factura de proveedor | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/payments-made:execute"
}
```

---

## 25. POST /billing/payments-received:apply

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Aplicar un pago recibido con asignación multi-factura
- **Operation ID:** `BillingReceivablesController_applyPayment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.applyPayment](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Aplicar un pago recibido con asignación multi-factura. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/payments-received:apply` en `BillingReceivablesController_applyPayment`. El controlador delega en `PaymentsReceivedService.apply`. Valida el body como `ApplyPaymentReceivedDto` y consume `application/json`. El tipo de retorno estático es `Promise<PaymentReceivedResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ApplyPaymentReceivedDto`; los campos opcionales se omiten.

```http
POST /billing/payments-received:apply HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "amount": "50.00",
  "allocations": [
    {
      "invoiceId": "00000000-0000-4000-8000-000000000001",
      "allocatedAmount": "50.00"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Paciente pagador (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Monto total recibido | `50.00` |
| `methodConceptId` | No | `string` | formato `uuid` | Método de pago (concepto); por defecto efectivo | `00000000-0000-4000-8000-000000000001` |
| `receivedAt` | No | `string` | formato `date-time` | Fecha de recepción (ISO) | `2026-07-31T12:00:00.000Z` |
| `reference` | No | `string` | longitud máxima 120 | Referencia externa (voucher, txn) | `valor-ejemplo` |
| `companyBankAccountId` | No | `string` | formato `uuid` | Cuenta bancaria receptora (accounting.company_bank_accounts) | `00000000-0000-4000-8000-000000000001` |
| `allocations` | Sí | `array<ReceivableAllocationInputDto>` | mínimo 1 elemento(s) | Asignaciones por factura (al menos una) | `[{"invoiceId":"00000000-0000-4000-8000-000000000001","allocatedAmount":"50.00","discountAmount":"0.00","openItemId":"00000000-0000-4000-8000-000000000001"}]` |
| `allocations[].invoiceId` | Sí | `string` | formato `uuid` | Factura destino (billing.invoices) | `00000000-0000-4000-8000-000000000001` |
| `allocations[].allocatedAmount` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Monto asignado a la factura | `50.00` |
| `allocations[].discountAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Descuento por pronto pago | `0.00` |
| `allocations[].openItemId` | No | `string` | formato `uuid` | Partida abierta del subledger (accounting.open_items) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/payments-received:apply HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "amount": "50.00",
  "methodConceptId": "00000000-0000-4000-8000-000000000001",
  "receivedAt": "2026-07-31T12:00:00.000Z",
  "reference": "valor-ejemplo",
  "companyBankAccountId": "00000000-0000-4000-8000-000000000001",
  "allocations": [
    {
      "invoiceId": "00000000-0000-4000-8000-000000000001",
      "allocatedAmount": "50.00",
      "discountAmount": "0.00",
      "openItemId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PaymentReceivedResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "amount": "valor-ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "allocations": [
    {
      "invoiceId": "00000000-0000-4000-8000-000000000001",
      "allocatedAmount": "valor-ejemplo",
      "balance": "valor-ejemplo",
      "status": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Valor de amount mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `allocations` | Sí | `array<AllocatedInvoiceDto>` | Sin restricción adicional declarada | Valor de allocations mantenido por la instancia. | `[{"invoiceId":"00000000-0000-4000-8000-000000000001","allocatedAmount":"valor-ejemplo","balance":"valor-ejemplo","status":"00000000-0000-4000-8000-000000000001"}]` |
| `allocations[].invoiceId` | Sí | `string` | formato `uuid` | Identificador asociado a invoice. | `00000000-0000-4000-8000-000000000001` |
| `allocations[].allocatedAmount` | Sí | `string` | Sin restricción adicional declarada | Valor de allocated amount mantenido por la instancia. | `valor-ejemplo` |
| `allocations[].balance` | No | `string` | Sin restricción adicional declarada | Valor de balance mantenido por la instancia. | `valor-ejemplo` |
| `allocations[].status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El monto del pago debe ser positivo | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La asignación debe ser un importe positivo | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | El descuento debe ser un importe no negativo | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La suma asignada excede el monto del pago | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | El cobro está en pausa mientras el paciente tenga una objeción abierta | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La factura no tiene saldo pendiente | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La asignación excede el saldo de la factura | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/payments-received:apply"
}
```

---

## 26. POST /billing/reconciliation:clear

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-operations`
- **Nombre:** Conciliar pagos vía documento de compensación
- **Operation ID:** `BillingOperationsController_reconcile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingOperationsController.reconcile](../../src/modules/billing/controllers/billing-operations.controller.ts)

### Descripción de negocio

Conciliar pagos vía documento de compensación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/reconciliation:clear` en `BillingOperationsController_reconcile`. El controlador delega en `ReconciliationService.clear`. Valida el body como `ReconciliationClearDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReconciliationResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReconciliationClearDto`; los campos opcionales se omiten.

```http
POST /billing/reconciliation:clear HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "clearingDocumentId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `clearingDocumentId` | Sí | `string` | formato `uuid` | Documento de compensación del lote (accounting.clearing_documents) | `00000000-0000-4000-8000-000000000001` |
| `paymentReceivedIds` | No | `array<string>` | formato `uuid` | Pagos recibidos a conciliar | `["00000000-0000-4000-8000-000000000001"]` |
| `paymentMadeIds` | No | `array<string>` | formato `uuid` | Pagos emitidos a conciliar | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/reconciliation:clear HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "clearingDocumentId": "00000000-0000-4000-8000-000000000001",
  "paymentReceivedIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "paymentMadeIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReconciliationResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "clearingDocumentId": "00000000-0000-4000-8000-000000000001",
  "reconciledReceived": 1,
  "reconciledMade": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `clearingDocumentId` | Sí | `string` | formato `uuid` | Identificador asociado a clearing document. | `00000000-0000-4000-8000-000000000001` |
| `reconciledReceived` | Sí | `number` | Sin restricción adicional declarada | Valor de reconciled received mantenido por la instancia. | `1` |
| `reconciledMade` | Sí | `number` | Sin restricción adicional declarada | Valor de reconciled made mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/reconciliation:clear"
}
```

---

## 27. POST /billing/reimbursements:link

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Vincular reembolso de reclamo de seguro a la factura
- **Operation ID:** `BillingReceivablesController_linkReimbursement`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.linkReimbursement](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Vincular reembolso de reclamo de seguro a la factura. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/reimbursements:link` en `BillingReceivablesController_linkReimbursement`. El controlador delega en `ReimbursementsService.link`. Valida el body como `LinkReimbursementDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReimbursementResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LinkReimbursementDto`; los campos opcionales se omiten.

```http
POST /billing/reimbursements:link HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "claimId": "00000000-0000-4000-8000-000000000001",
  "invoiceId": "00000000-0000-4000-8000-000000000001",
  "amount": "30.00"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `claimId` | Sí | `string` | formato `uuid` | Reclamo de seguro (insurance.insurance_claims) | `00000000-0000-4000-8000-000000000001` |
| `invoiceId` | Sí | `string` | formato `uuid` | Factura del paciente a acreditar (billing.invoices) | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Monto reembolsado por la aseguradora | `30.00` |
| `receivedAt` | No | `string` | formato `date-time` | Fecha de recepción del reembolso (ISO) | `2026-07-31T12:00:00.000Z` |
| `tenantId` | No | `string` | formato `uuid` | Tenant (directory.tenants); requerido para registrar el vínculo REIMBURSEMENT_OF | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/reimbursements:link HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "claimId": "00000000-0000-4000-8000-000000000001",
  "invoiceId": "00000000-0000-4000-8000-000000000001",
  "amount": "30.00",
  "receivedAt": "2026-07-31T12:00:00.000Z",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReimbursementResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "claimId": "00000000-0000-4000-8000-000000000001",
  "amount": "valor-ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "invoiceId": "00000000-0000-4000-8000-000000000001",
  "invoiceBalance": "valor-ejemplo",
  "invoiceStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `claimId` | Sí | `string` | formato `uuid` | Identificador asociado a claim. | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Valor de amount mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `invoiceId` | Sí | `string` | formato `uuid` | Identificador asociado a invoice. | `00000000-0000-4000-8000-000000000001` |
| `invoiceBalance` | No | `string` | Sin restricción adicional declarada | Valor de invoice balance mantenido por la instancia. | `valor-ejemplo` |
| `invoiceStatus` | Sí | `string` | formato `uuid` | Valor de invoice status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El reclamo ya tiene un reembolso registrado | Excepción explícita en src/modules/billing/services/reimbursements.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El monto del reembolso debe ser positivo | Excepción explícita en src/modules/billing/services/reimbursements.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/reimbursements:link"
}
```

---

## 28. GET /billing/service-catalog

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Listar el catálogo de servicios de la práctica
- **Operation ID:** `BillingServiceCatalogController_search`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.search](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Listar el catálogo de servicios de la práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Lista el catálogo de servicios de una práctica, buscable por código o nombre.

### Descripción del sistema

NestJS resuelve `GET /billing/service-catalog` en `BillingServiceCatalogController_search`. El controlador delega en `BillingServiceCatalogService.search`. No recibe body. El tipo de retorno estático es `Promise<SearchServiceCatalogResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | query | Sí | `string` | Sin restricción adicional declarada | Práctica (uuid) | `00000000-0000-4000-8000-000000000001` |
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en el código o el nombre | `valor-ejemplo` |
| `isActive` | query | No | `string` | Sin restricción adicional declarada | Filtra por servicios activos (`true`) o inactivos (`false`) | `valor-ejemplo` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Servicios por página (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/service-catalog?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /billing/service-catalog?practiceId=00000000-0000-4000-8000-000000000001&q=valor-ejemplo&isActive=valor-ejemplo&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SearchServiceCatalogResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SearchServiceCatalogResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SearchServiceCatalogResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SearchServiceCatalogResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SearchServiceCatalogResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SearchServiceCatalogResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<SearchServiceCatalogResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SearchServiceCatalogResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practiceId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "descriptionText": "Texto descriptivo de ejemplo",
      "termsText": "valor-ejemplo",
      "imageFileId": "00000000-0000-4000-8000-000000000001",
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "defaultPrice": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001",
      "currencyCode": "BOB",
      "taxCodeId": "00000000-0000-4000-8000-000000000001",
      "incomeAccountId": "00000000-0000-4000-8000-000000000001",
      "isActive": true
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
| `items` | Sí | `array<ServiceCatalogItemDto>` | Sin restricción adicional declarada | Servicios de esta página, ordenados por código. | `[{"id":"00000000-0000-4000-8000-000000000001","practiceId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","descriptionText":"Texto descriptivo de ejemplo","termsText":"valor-ejemplo","imageFileId":"00000000-0000-4000-8000-000000000001","serviceConceptId":"00000000-0000-4000-8000-000000000001","defaultPrice":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001","currencyCode":"BOB","taxCodeId":"00000000-0000-4000-8000-000000000001","incomeAccountId":"00000000-0000-4000-8000-000000000001","isActive":true}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].practiceId` | Sí | `string` | formato `uuid` | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `items[].descriptionText` | No | `string` | Sin restricción adicional declarada | Valor de description text mantenido por la instancia. | `Texto descriptivo de ejemplo` |
| `items[].termsText` | No | `string` | Sin restricción adicional declarada | Términos propios del servicio (carril 22). Ausente = usa los términos por defecto, cuyo texto legal provee el propietario. | `valor-ejemplo` |
| `items[].imageFileId` | No | `string` | formato `uuid` | Identificador asociado a image file. Es el id de un archivo de `common.files`, no una URL. Quién puede leer ese contenido lo decide `common.files`, y hoy sólo lo entrega a quien lo subió o a un rol de revisión. | `00000000-0000-4000-8000-000000000001` |
| `items[].serviceConceptId` | No | `string` | formato `uuid` | Identificador asociado a service concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Valor de default price mantenido por la instancia. | `valor-ejemplo` |
| `items[].currencyConceptId` | No | `string` | formato `uuid` | Identificador asociado a currency concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].currencyCode` | No | `string` | Sin restricción adicional declarada | Sigla de la moneda | `BOB` |
| `items[].taxCodeId` | No | `string` | formato `uuid` | Identificador asociado a tax code. | `00000000-0000-4000-8000-000000000001` |
| `items[].incomeAccountId` | No | `string` | formato `uuid` | Identificador asociado a income account. | `00000000-0000-4000-8000-000000000001` |
| `items[].isActive` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is active mantenido por la instancia. | `true` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `nextCursor` | Sí | `string` | admite null | Cursor opaco de continuación, o `null` si ésta es la última página. | `valor-ejemplo` |

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
  "path": "/billing/service-catalog"
}
```

---

## 29. POST /billing/service-catalog

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Dar de alta en el catálogo un servicio del repositorio
- **Operation ID:** `BillingServiceCatalogController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.create](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Exige serviceConceptId de un servicio del repositorio: no hay alta de texto libre. Código y nombre salen del repositorio. La administración lo da de alta en cualquier práctica de su organización; un profesional, sólo en su consultorio propio.

Contexto declarado en el controlador: Crea un servicio nuevo en el catálogo maestro.

### Descripción del sistema

NestJS resuelve `POST /billing/service-catalog` en `BillingServiceCatalogController_create`. El controlador delega en `BillingServiceCatalogService.create`. Valida el body como `CreateServiceCatalogItemDto` y consume `application/json`. El tipo de retorno estático es `Promise<ServiceCatalogItemDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateServiceCatalogItemDto`; los campos opcionales se omiten.

```http
POST /billing/service-catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "100.00"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PRACTITIONER`, `CLINICIAN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `code` | No | `string` | longitud máxima 120 | Obsoleto e ignorado: el código lo pone el repositorio | `CODIGO_EJEMPLO` |
| `name` | No | `string` | longitud máxima 200 | Obsoleto e ignorado: el nombre lo pone el repositorio | `Nombre de ejemplo` |
| `descriptionText` | No | `string` | longitud máxima 2000 | Descripción larga del servicio, para la tarjeta | `Texto descriptivo de ejemplo` |
| `imageFileId` | No | `string` | formato `uuid` | Imagen del servicio (`common.files`) | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | Sí | `string` | formato `uuid` | Concepto del repositorio de servicios (obligatorio). Buscarlo en GET /billing/service-catalog/repository | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | Sí | `string` | patrón runtime `PRICE_PATTERN` | Precio de referencia; cada doctor puede cotizar otro precio | `100.00` |
| `currencyConceptId` | No | `string` | formato `uuid` | Moneda (concepto) | `00000000-0000-4000-8000-000000000001` |
| `taxCodeId` | No | `string` | formato `uuid` | Código de impuesto (billing.tax_codes) | `00000000-0000-4000-8000-000000000001` |
| `incomeAccountId` | No | `string` | formato `uuid` | Cuenta de ingreso (accounting.accounts) | `00000000-0000-4000-8000-000000000001` |
| `isActive` | No | `boolean` | Sin restricción adicional declarada | Si queda disponible para cotizar; por defecto true | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/service-catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "descriptionText": "Texto descriptivo de ejemplo",
  "imageFileId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "100.00",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "taxCodeId": "00000000-0000-4000-8000-000000000001",
  "incomeAccountId": "00000000-0000-4000-8000-000000000001",
  "isActive": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ServiceCatalogItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "descriptionText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "imageFileId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "currencyCode": "BOB",
  "taxCodeId": "00000000-0000-4000-8000-000000000001",
  "incomeAccountId": "00000000-0000-4000-8000-000000000001",
  "isActive": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `descriptionText` | No | `string` | Sin restricción adicional declarada | Valor de description text mantenido por la instancia. | `Texto descriptivo de ejemplo` |
| `termsText` | No | `string` | Sin restricción adicional declarada | Términos propios del servicio (carril 22). Ausente = usa los términos por defecto, cuyo texto legal provee el propietario. | `valor-ejemplo` |
| `imageFileId` | No | `string` | formato `uuid` | Identificador asociado a image file. Es el id de un archivo de `common.files`, no una URL. Quién puede leer ese contenido lo decide `common.files`, y hoy sólo lo entrega a quien lo subió o a un rol de revisión. | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | No | `string` | formato `uuid` | Identificador asociado a service concept. | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Valor de default price mantenido por la instancia. | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Identificador asociado a currency concept. | `00000000-0000-4000-8000-000000000001` |
| `currencyCode` | No | `string` | Sin restricción adicional declarada | Sigla de la moneda | `BOB` |
| `taxCodeId` | No | `string` | formato `uuid` | Identificador asociado a tax code. | `00000000-0000-4000-8000-000000000001` |
| `incomeAccountId` | No | `string` | formato `uuid` | Identificador asociado a income account. | `00000000-0000-4000-8000-000000000001` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is active mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | ${labels.subject} no le pertenece | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/billing-service-catalog.service.ts |
| 404 | `NOT_FOUND` | Imagen no encontrada | Excepción explícita en src/modules/billing/services/billing-service-catalog.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 409 | `CONFLICT` | Ese servicio ya está en el catálogo | Excepción explícita en src/modules/billing/services/billing-service-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El servicio se elige del repositorio: indicá serviceConceptId | Excepción explícita en src/modules/billing/services/billing-service-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | Ese servicio no es del repositorio | Excepción explícita en src/modules/billing/services/billing-service-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/service-catalog"
}
```

---

## 30. PATCH /billing/service-catalog/{id}

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Corregir un servicio del catálogo de mi práctica
- **Operation ID:** `BillingServiceCatalogController_update`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.update](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Corregir un servicio del catálogo de mi práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Corrige un servicio del catálogo de una práctica propia. Los roles son más anchos que los del alta a propósito: quien atiende pone el precio de lo que ofrece en **su** práctica, y la cuenta administradora corrige lo que dio de alta. El alcance no lo decide el rol sino la vinculación —o el tenant—, y se comprueba en el servicio; un servicio de otra práctica responde **404**, igual que uno inexistente.

### Descripción del sistema

NestJS resuelve `PATCH /billing/service-catalog/{id}` en `BillingServiceCatalogController_update`. El controlador delega en `BillingServiceCatalogService.update`. Valida el body como `UpdateServiceCatalogItemDto` y consume `application/json`. El tipo de retorno estático es `Promise<ServiceCatalogItemDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateServiceCatalogItemDto`; los campos opcionales se omiten.

```http
PATCH /billing/service-catalog/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | No | `string` | longitud máxima 200 | Nombre del servicio | `Nombre de ejemplo` |
| `defaultPrice` | No | `string` | patrón runtime `PRICE_PATTERN` | Precio de referencia del servicio | `150.00` |
| `currencyConceptId` | No | `string` | formato `uuid` | Moneda del precio (concepto). Sólo se acepta junto con `defaultPrice` | `00000000-0000-4000-8000-000000000001` |
| `isActive` | No | `boolean` | Sin restricción adicional declarada | Si el servicio sigue disponible para cotizar | `true` |
| `termsText` | No | `string` | longitud máxima 20000; admite null | Términos propios del servicio. null vuelve a los términos por defecto | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /billing/service-catalog/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "defaultPrice": "150.00",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "isActive": true,
  "termsText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ServiceCatalogItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "descriptionText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "imageFileId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "currencyCode": "BOB",
  "taxCodeId": "00000000-0000-4000-8000-000000000001",
  "incomeAccountId": "00000000-0000-4000-8000-000000000001",
  "isActive": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `descriptionText` | No | `string` | Sin restricción adicional declarada | Valor de description text mantenido por la instancia. | `Texto descriptivo de ejemplo` |
| `termsText` | No | `string` | Sin restricción adicional declarada | Términos propios del servicio (carril 22). Ausente = usa los términos por defecto, cuyo texto legal provee el propietario. | `valor-ejemplo` |
| `imageFileId` | No | `string` | formato `uuid` | Identificador asociado a image file. Es el id de un archivo de `common.files`, no una URL. Quién puede leer ese contenido lo decide `common.files`, y hoy sólo lo entrega a quien lo subió o a un rol de revisión. | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | No | `string` | formato `uuid` | Identificador asociado a service concept. | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Valor de default price mantenido por la instancia. | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Identificador asociado a currency concept. | `00000000-0000-4000-8000-000000000001` |
| `currencyCode` | No | `string` | Sin restricción adicional declarada | Sigla de la moneda | `BOB` |
| `taxCodeId` | No | `string` | formato `uuid` | Identificador asociado a tax code. | `00000000-0000-4000-8000-000000000001` |
| `incomeAccountId` | No | `string` | formato `uuid` | Identificador asociado a income account. | `00000000-0000-4000-8000-000000000001` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is active mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Servicio no encontrado | Excepción explícita en src/modules/billing/services/billing-service-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/service-catalog/{id}"
}
```

---

## 31. GET /billing/service-catalog/{id}/image

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Descargar la imagen de un servicio que el actor puede ver
- **Operation ID:** `BillingServiceCatalogController_getImage`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.getImage](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Autoriza por contexto: servicio activo de una práctica del tenant activo. 404 uniforme en cualquier otro caso.

Contexto declarado en el controlador: Imagen de un servicio del catálogo (decisión P-22-8, opción 1). Sesión autenticada y nada más: la autorización es por contexto, en el servicio (servicio activo de una práctica del tenant activo). Un servicio ajeno, inactivo, sin imagen o inexistente responde el mismo 404. `no-store` y `nosniff`, como en el resto de descargas autenticadas.

### Descripción del sistema

NestJS resuelve `GET /billing/service-catalog/{id}/image` en `BillingServiceCatalogController_getImage`. El controlador delega en `BillingServiceCatalogService.getImageContent`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/service-catalog/00000000-0000-4000-8000-000000000001/image HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /billing/service-catalog/00000000-0000-4000-8000-000000000001/image HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<void>` | No |
| 400 | Consulta completada correctamente. | `Promise<void>` | No |
| 401 | Consulta completada correctamente. | `Promise<void>` | No |
| 403 | Consulta completada correctamente. | `Promise<void>` | No |
| 404 | Consulta completada correctamente. | `Promise<void>` | No |
| 429 | Consulta completada correctamente. | `Promise<void>` | No |
| 500 | Consulta completada correctamente. | `Promise<void>` | No |
| 504 | Consulta completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | notVisible.message | Excepción explícita en src/modules/billing/services/billing-service-catalog.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/service-catalog/{id}/image"
}
```

---

## 32. POST /billing/service-catalog/import

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Importar servicios del repositorio a mi catálogo
- **Operation ID:** `BillingServiceCatalogController_importServices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.importServices](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Importar servicios del repositorio a mi catálogo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Importa servicios del repositorio al catálogo de una práctica. Mismos roles y alcance que el alta. Idempotente por concepto.

### Descripción del sistema

NestJS resuelve `POST /billing/service-catalog/import` en `BillingServiceCatalogController_importServices`. El controlador delega en `BillingServiceCatalogService.importServices`. Valida el body como `ImportServicesDto` y consume `application/json`. El tipo de retorno estático es `Promise<ImportServicesResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ImportServicesDto`; los campos opcionales se omiten.

```http
POST /billing/service-catalog/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "defaultPrice": "250.00"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PRACTITIONER`, `CLINICIAN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<ImportServiceItemDto>` | mínimo 1 elemento(s); máximo SERVICE_IMPORT_MAX_ITEMS elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","defaultPrice":"250.00","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].conceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].defaultPrice` | Sí | `string` | patrón runtime `PRICE_PATTERN` | Sin descripción específica en el contrato OpenAPI. | `250.00` |
| `items[].currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/service-catalog/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "defaultPrice": "250.00",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ImportServicesResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ImportServicesResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ImportServicesResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ImportServicesResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ImportServicesResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ImportServicesResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ImportServicesResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ImportServicesResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ImportServicesResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ImportServicesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ImportServicesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "outcome": "CREATED",
      "serviceCatalogId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ImportServiceResultDto>` | Sin restricción adicional declarada | Un resultado por servicio pedido, en el mismo orden. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","outcome":"CREATED","serviceCatalogId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].conceptId` | Sí | `string` | formato `uuid` | Concepto pedido. | `00000000-0000-4000-8000-000000000001` |
| `items[].outcome` | Sí | `string` | valores: `CREATED`, `ALREADY_IMPORTED` | `CREATED` si nació ahora; `ALREADY_IMPORTED` si la práctica ya lo tenía. | `CREATED` |
| `items[].serviceCatalogId` | Sí | `string` | formato `uuid` | Servicio del catálogo de la práctica. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/billing-service-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Hay servicios que no son del repositorio | Excepción explícita en src/modules/billing/services/billing-service-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/service-catalog/import"
}
```

---

## 33. POST /billing/service-catalog/import-procedures

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Importar en lote procedimientos del arancel al catálogo
- **Operation ID:** `BillingServiceCatalogController_importProcedures`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.importProcedures](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Crea en el catálogo de la práctica todos los procedimientos del arancel que cumplan el filtro (especialidades, códigos y/o texto, combinados con Y; al menos uno). Idempotente: salta los códigos que la práctica ya tiene. Tope de 5000 coincidencias (400 si lo excede).

Contexto declarado en el controlador: Importa en lote al catálogo de una práctica los procedimientos del arancel. Mismo `@Roles` y mismo alcance que el alta individual: la administración en cualquier práctica de su organización, un profesional sólo en su consultorio propio, y 404 en cualquier otra. Declarada antes de `:id` junto con el resto de las rutas estáticas.

### Descripción del sistema

NestJS resuelve `POST /billing/service-catalog/import-procedures` en `BillingServiceCatalogController_importProcedures`. El controlador delega en `ProcedureImportService.importProcedures`. Valida el body como `ImportProceduresDto` y consume `application/json`. El tipo de retorno estático es `Promise<ImportProceduresResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ImportProceduresDto`; los campos opcionales se omiten.

```http
POST /billing/service-catalog/import-procedures HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PRACTITIONER`, `CLINICIAN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) cuyo catálogo recibe los servicios | `00000000-0000-4000-8000-000000000001` |
| `specialties` | No | `array<string>` | longitud máxima 200; máximo 100 elemento(s) | Nombres exactos de especialidad del arancel (`GET procedure-specialties`) | `["Cardiología"]` |
| `codes` | No | `array<string>` | longitud máxima 300; máximo PROCEDURE_IMPORT_MAX elemento(s) | Códigos del arancel (`procedure:...`) a importar | `["procedure:bo:BO_ARM_AUDITORIA_MEDICA_I_GENERAL"]` |
| `q` | No | `string` | longitud máxima 200 | Texto a buscar en el nombre del procedimiento; sin tildes ni mayúsculas, todas las palabras | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/service-catalog/import-procedures HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "specialties": [
    "Cardiología"
  ],
  "codes": [
    "procedure:bo:BO_ARM_AUDITORIA_MEDICA_I_GENERAL"
  ],
  "q": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ImportProceduresResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ImportProceduresResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ImportProceduresResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ImportProceduresResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ImportProceduresResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ImportProceduresResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ImportProceduresResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ImportProceduresResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ImportProceduresResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ImportProceduresResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ImportProceduresResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "created": 1,
  "skipped": 1,
  "total": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `created` | Sí | `number` | Sin restricción adicional declarada | Servicios creados | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Coincidencias que ya existían en la práctica y se saltaron | `1` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Procedimientos del arancel que cumplen el filtro | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 400 | `VALIDATION_FAILED` | El filtro abarca más de ${PROCEDURE_IMPORT_MAX} procedimientos; acotalo por especialidad o texto | Excepción explícita en src/modules/billing/services/procedure-import.service.ts |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/billing-service-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/service-catalog/import-procedures"
}
```

---

## 34. GET /billing/service-catalog/procedure-specialties

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Listar las especialidades del nomenclador de procedimientos
- **Operation ID:** `BillingServiceCatalogController_listProcedureSpecialties`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.listProcedureSpecialties](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Listar las especialidades del nomenclador de procedimientos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Las especialidades del nomenclador de procedimientos, con su recuento. Es lo que permite dibujar el filtro **sin traer las 4408 entradas**: la pantalla pide esto una vez y después pagina dentro de la especialidad elegida. Sin `@Roles` por la misma razón que la lectura del catálogo: es un arancel de referencia público, y cualquier profesional que arme un presupuesto necesita resolverlo. Lo que sigue siendo administrativo es el **alta** del servicio.

### Descripción del sistema

NestJS resuelve `GET /billing/service-catalog/procedure-specialties` en `BillingServiceCatalogController_listProcedureSpecialties`. El controlador delega en `ProcedureNomenclatureService.listSpecialties`. No recibe body. El tipo de retorno estático es `Promise<ProcedureSpecialtiesResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/service-catalog/procedure-specialties HTTP/1.1
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
GET /billing/service-catalog/procedure-specialties HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ProcedureSpecialtiesResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ProcedureSpecialtiesResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ProcedureSpecialtiesResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ProcedureSpecialtiesResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ProcedureSpecialtiesResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ProcedureSpecialtiesResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ProcedureSpecialtiesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProcedureSpecialtiesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "specialty": "Cardiología",
      "count": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ProcedureSpecialtyDto>` | Sin restricción adicional declarada | Especialidades, ordenadas alfabéticamente en español. | `[{"specialty":"Cardiología","count":1}]` |
| `items[].specialty` | Sí | `string` | Sin restricción adicional declarada | Nombre de la especialidad, tal cual lo publica el arancel. | `Cardiología` |
| `items[].count` | Sí | `number` | Sin restricción adicional declarada | Cuántos procedimientos agrupa. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/service-catalog/procedure-specialties"
}
```

---

## 35. GET /billing/service-catalog/procedure-specialties/mine

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Listar las especialidades del arancel que corresponden al médico
- **Operation ID:** `BillingServiceCatalogController_listMyProcedureSpecialties`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.listMyProcedureSpecialties](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Listar las especialidades del arancel que corresponden al médico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Las especialidades del arancel que corresponden al médico autenticado. Sale de las especialidades que el profesional cargó en su perfil, cruzadas con las del arancel sin tildes ni mayúsculas. Vacío si no tiene ninguna cargada o el usuario no es profesional. Declarada antes de `:id`.

### Descripción del sistema

NestJS resuelve `GET /billing/service-catalog/procedure-specialties/mine` en `BillingServiceCatalogController_listMyProcedureSpecialties`. El controlador delega en `ProcedureImportService.listMySpecialties`. No recibe body. El tipo de retorno estático es `Promise<MyProcedureSpecialtiesResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/service-catalog/procedure-specialties/mine HTTP/1.1
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
GET /billing/service-catalog/procedure-specialties/mine HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MyProcedureSpecialtiesResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<MyProcedureSpecialtiesResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MyProcedureSpecialtiesResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MyProcedureSpecialtiesResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MyProcedureSpecialtiesResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MyProcedureSpecialtiesResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<MyProcedureSpecialtiesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MyProcedureSpecialtiesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "specialty": "Cardiología",
      "count": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<MyProcedureSpecialtyDto>` | Sin restricción adicional declarada | Especialidades del arancel que corresponden al médico autenticado. | `[{"specialty":"Cardiología","count":1}]` |
| `items[].specialty` | Sí | `string` | Sin restricción adicional declarada | Nombre exacto de la especialidad, tal cual lo publica el arancel. | `Cardiología` |
| `items[].count` | Sí | `number` | Sin restricción adicional declarada | Procedimientos que el arancel agrupa bajo esa especialidad. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/service-catalog/procedure-specialties/mine"
}
```

---

## 36. GET /billing/service-catalog/procedures

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Listar el nomenclador de procedimientos (arancel de referencia)
- **Operation ID:** `BillingServiceCatalogController_searchProcedures`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.searchProcedures](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Listar el nomenclador de procedimientos (arancel de referencia). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El nomenclador de procedimientos, por cursor.

### Descripción del sistema

NestJS resuelve `GET /billing/service-catalog/procedures` en `BillingServiceCatalogController_searchProcedures`. El controlador delega en `ProcedureNomenclatureService.search`. No recibe body. El tipo de retorno estático es `Promise<ProcedureNomenclatureResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `specialty` | query | No | `string` | Sin restricción adicional declarada | Especialidad exacta, tal cual la publica el arancel | `valor-ejemplo` |
| `q` | query | No | `string` | Sin restricción adicional declarada | Palabras a buscar (todas deben aparecer), sin distinguir tildes ni mayúsculas, en el nombre, el código, el grupo o la especialidad | `valor-ejemplo` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Entradas por página | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/service-catalog/procedures HTTP/1.1
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
GET /billing/service-catalog/procedures?specialty=valor-ejemplo&q=valor-ejemplo&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ProcedureNomenclatureResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ProcedureNomenclatureResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ProcedureNomenclatureResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ProcedureNomenclatureResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ProcedureNomenclatureResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ProcedureNomenclatureResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ProcedureNomenclatureResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProcedureNomenclatureResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "procedure:bo:BO_ARM_AUDITORIA_MEDICA_I_GENERAL",
      "display": "General",
      "specialty": "Auditoría Médica",
      "group": "I",
      "referencePrice": 150,
      "priceUnit": "UMA",
      "ocrSuspect": true
    }
  ],
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ProcedureNomenclatureItemDto>` | Sin restricción adicional declarada | Entradas de esta página. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"procedure:bo:BO_ARM_AUDITORIA_MEDICA_I_GENERAL","display":"General","specialty":"Auditoría Médica","group":"I","referencePrice":150,"priceUnit":"UMA","ocrSuspect":true}]` |
| `items[].conceptId` | Sí | `string` | formato `uuid` | Concepto de terminología que representa el procedimiento. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código del arancel, tal cual lo publica el documento de origen. | `procedure:bo:BO_ARM_AUDITORIA_MEDICA_I_GENERAL` |
| `items[].display` | Sí | `string` | Sin restricción adicional declarada | Nombre del procedimiento. | `General` |
| `items[].specialty` | Sí | `string` | admite null | Especialidad bajo la que el arancel lo agrupa. | `Auditoría Médica` |
| `items[].group` | Sí | `string` | admite null | Grupo dentro de la especialidad, si el arancel lo declara. | `I` |
| `items[].referencePrice` | Sí | `string` | admite null | Precio de referencia, como cadena. **Es de referencia y de una unidad que puede no ser dinero**: ver . No se convierte a moneda acá — el factor de conversión de la UMA no está declarado en ninguna parte del producto. | `150` |
| `items[].priceUnit` | Sí | `string` | admite null | Unidad del precio: `UMA` o `USD`. `UMA` **no es una moneda**: es la unidad de cuenta del arancel de honorarios de Santa Cruz. Viaja tal cual para que quien importe sepa qué está copiando. | `UMA` |
| `items[].ocrSuspect` | Sí | `boolean` | Sin restricción adicional declarada | Si el texto de origen necesita revisión humana. Son las 228 entradas que salieron dañadas del reconocimiento óptico del arancel —se ven a simple vista: «Angioplastia periférica por balén»—. El catálogo las marca y la pantalla tiene que avisarlo: importar una de éstas en silencio mete un nombre y un precio dudosos en la lista de un profesional. | `true` |
| `nextCursor` | Sí | `string` | admite null | Cursor de la página siguiente, o `null` si esta es la última. | `valor-ejemplo` |

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
  "path": "/billing/service-catalog/procedures"
}
```

---

## 37. GET /billing/service-catalog/repository

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Buscar en el repositorio de servicios (para importar)
- **Operation ID:** `BillingServiceCatalogController_searchRepository`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.searchRepository](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Buscar en el repositorio de servicios (para importar). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Busca en el repositorio de servicios importables (todas las fuentes). Sin `@Roles`, como el nomenclador: es referencia pública y la necesita cualquiera que arme su catálogo. Lo que exige permiso es importar.

### Descripción del sistema

NestJS resuelve `GET /billing/service-catalog/repository` en `BillingServiceCatalogController_searchRepository`. El controlador delega en `ServiceRepositoryService.search`. No recibe body. El tipo de retorno estático es `Promise<ServiceRepositorySearchResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar | `valor-ejemplo` |
| `specialtyConceptId` | query | No | `string` | Sin restricción adicional declarada | Especialidad (uuid del concepto) | `00000000-0000-4000-8000-000000000001` |
| `codeSystem` | query | No | `string` | Sin restricción adicional declarada | Fuente: código del sistema de códigos | `CODIGO_EJEMPLO` |
| `practiceId` | query | No | `string` | Sin restricción adicional declarada | Práctica, para marcar lo ya importado | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/service-catalog/repository HTTP/1.1
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
GET /billing/service-catalog/repository?q=valor-ejemplo&specialtyConceptId=00000000-0000-4000-8000-000000000001&codeSystem=CODIGO_EJEMPLO&practiceId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ServiceRepositorySearchResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ServiceRepositorySearchResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ServiceRepositorySearchResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ServiceRepositorySearchResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ServiceRepositorySearchResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ServiceRepositorySearchResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ServiceRepositorySearchResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ServiceRepositorySearchResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "source": {
        "codeSystem": "cups",
        "name": "CUPS — Clasificación Única de Procedimientos en Salud",
        "publisher": "valor-ejemplo"
      },
      "specialties": [
        {
          "conceptId": "00000000-0000-4000-8000-000000000001",
          "code": "CARDIOLOGIA",
          "display": "Cardiología"
        }
      ],
      "referencePrice": "valor-ejemplo",
      "priceUnit": "valor-ejemplo",
      "importedServiceCatalogId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ServiceRepositoryItemDto>` | Sin restricción adicional declarada | Servicios de esta página, los más parecidos a la búsqueda primero. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","display":"valor-ejemplo","source":{"codeSystem":"cups","name":"CUPS — Clasificación Única de Procedimientos en Salud","publisher":"valor-ejemplo"},"specialties":[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CARDIOLOGIA","display":"Cardiología"}],"referencePrice":"valor-ejemplo","priceUnit":"valor-ejemplo","importedServiceCatalogId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].conceptId` | Sí | `string` | formato `uuid` | Concepto del servicio: es lo que se manda al importar. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código en su fuente. | `CODIGO_EJEMPLO` |
| `items[].display` | Sí | `string` | Sin restricción adicional declarada | Nombre en castellano, tal cual lo publica la fuente. | `valor-ejemplo` |
| `items[].source` | Sí | `ServiceRepositorySourceDto` | Sin restricción adicional declarada | Fuente del servicio. | `{"codeSystem":"cups","name":"CUPS — Clasificación Única de Procedimientos en Salud","publisher":"valor-ejemplo"}` |
| `items[].source.codeSystem` | Sí | `string` | Sin restricción adicional declarada | Código del sistema de códigos (`cups`, `fonasa-mle-2026`, …). | `cups` |
| `items[].source.name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible del sistema de códigos. | `CUPS — Clasificación Única de Procedimientos en Salud` |
| `items[].source.publisher` | No | `string` | admite null | Organismo o fuente que lo publica, cuando está registrado. | `valor-ejemplo` |
| `items[].specialties` | Sí | `array<ServiceRepositorySpecialtyDto>` | Sin restricción adicional declarada | Especialidades que lo atienden (puede estar vacía: no toda fuente lo dice). | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CARDIOLOGIA","display":"Cardiología"}]` |
| `items[].specialties[].conceptId` | Sí | `string` | formato `uuid` | Concepto de la especialidad (`VS_MEDICAL_SPECIALTY`). | `00000000-0000-4000-8000-000000000001` |
| `items[].specialties[].code` | Sí | `string` | Sin restricción adicional declarada | Código del modelo, p. ej. `CARDIOLOGIA`. | `CARDIOLOGIA` |
| `items[].specialties[].display` | Sí | `string` | Sin restricción adicional declarada | Nombre visible. | `Cardiología` |
| `items[].referencePrice` | No | `string` | admite null | Precio de referencia de la fuente, si publica uno. No es un precio del profesional. | `valor-ejemplo` |
| `items[].priceUnit` | No | `string` | admite null | Unidad del precio de referencia (`UMA`, `CLP`…), sin convertir. | `valor-ejemplo` |
| `items[].importedServiceCatalogId` | No | `string` | formato `uuid`; admite null | Si se pidió con `practiceId`: el servicio del catálogo de esa práctica que ya lo importó. `null` = todavía no está en su catálogo. | `00000000-0000-4000-8000-000000000001` |
| `nextCursor` | Sí | `string` | admite null | Cursor opaco de la página siguiente, o `null`. | `valor-ejemplo` |

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
  "path": "/billing/service-catalog/repository"
}
```

---

## 38. GET /billing/service-catalog/repository/facets

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Fuentes y especialidades del repositorio de servicios
- **Operation ID:** `BillingServiceCatalogController_repositoryFacets`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.repositoryFacets](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Fuentes y especialidades del repositorio de servicios. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Fuentes y especialidades del repositorio con su recuento, para los filtros.

### Descripción del sistema

NestJS resuelve `GET /billing/service-catalog/repository/facets` en `BillingServiceCatalogController_repositoryFacets`. El controlador delega en `ServiceRepositoryService.facets`. No recibe body. El tipo de retorno estático es `Promise<ServiceRepositoryFacetsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/service-catalog/repository/facets HTTP/1.1
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
GET /billing/service-catalog/repository/facets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ServiceRepositoryFacetsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ServiceRepositoryFacetsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ServiceRepositoryFacetsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ServiceRepositoryFacetsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ServiceRepositoryFacetsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ServiceRepositoryFacetsResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ServiceRepositoryFacetsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ServiceRepositoryFacetsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "total": 1,
  "sources": [
    {
      "key": "valor-ejemplo",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "count": 1
    }
  ],
  "specialties": [
    {
      "key": "valor-ejemplo",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "count": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `total` | Sí | `number` | Sin restricción adicional declarada | Total de servicios importables. | `1` |
| `sources` | Sí | `array<ServiceRepositoryFacetDto>` | Sin restricción adicional declarada | Fuentes, con su recuento. | `[{"key":"valor-ejemplo","code":"CODIGO_EJEMPLO","display":"valor-ejemplo","count":1}]` |
| `sources[].key` | Sí | `string` | Sin restricción adicional declarada | Identificador del filtro: código del sistema, o id del concepto de la especialidad. | `valor-ejemplo` |
| `sources[].code` | Sí | `string` | Sin restricción adicional declarada | Código legible (`CARDIOLOGIA`, `cups`). | `CODIGO_EJEMPLO` |
| `sources[].display` | Sí | `string` | Sin restricción adicional declarada | Nombre visible. | `valor-ejemplo` |
| `sources[].count` | Sí | `number` | Sin restricción adicional declarada | Servicios del repositorio con ese valor. | `1` |
| `specialties` | Sí | `array<ServiceRepositoryFacetDto>` | Sin restricción adicional declarada | Especialidades, con su recuento. | `[{"key":"valor-ejemplo","code":"CODIGO_EJEMPLO","display":"valor-ejemplo","count":1}]` |
| `specialties[].key` | Sí | `string` | Sin restricción adicional declarada | Identificador del filtro: código del sistema, o id del concepto de la especialidad. | `valor-ejemplo` |
| `specialties[].code` | Sí | `string` | Sin restricción adicional declarada | Código legible (`CARDIOLOGIA`, `cups`). | `CODIGO_EJEMPLO` |
| `specialties[].display` | Sí | `string` | Sin restricción adicional declarada | Nombre visible. | `valor-ejemplo` |
| `specialties[].count` | Sí | `number` | Sin restricción adicional declarada | Servicios del repositorio con ese valor. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/service-catalog/repository/facets"
}
```

---

## 39. GET /billing/simulated/catalogs

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Catálogos paramétricos del SIAT simulado
- **Operation ID:** `BillingSimulatedController_catalogs`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.catalogs](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Catálogos paramétricos del SIAT simulado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /billing/simulated/catalogs` en `BillingSimulatedController_catalogs`. El controlador delega en `BillingSimulatedService.catalogs`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/simulated/catalogs HTTP/1.1
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
GET /billing/simulated/catalogs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/catalogs"
}
```

---

## 40. GET /billing/simulated/charges

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Cobros de consultas (opcionalmente de una persona)
- **Operation ID:** `BillingSimulatedController_charges`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.charges](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Cobros de consultas (opcionalmente de una persona). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /billing/simulated/charges` en `BillingSimulatedController_charges`. El controlador delega en `BillingSimulatedService.listCharges`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/simulated/charges?patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /billing/simulated/charges?patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/charges"
}
```

---

## 41. POST /billing/simulated/charges/{chargeId}/instances/{instanceId}/payments

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Pago de una instancia de plan (no soportado: 409 NOT_A_PLAN)
- **Operation ID:** `BillingSimulatedController_instancePayment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.instancePayment](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Pago de una instancia de plan (no soportado: 409 NOT_A_PLAN). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/simulated/charges/{chargeId}/instances/{instanceId}/payments` en `BillingSimulatedController_instancePayment`. El controlador delega en `BillingSimulatedService.registerInstancePayment`. Valida el body como `SimulatedInstancePaymentDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `chargeId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `instanceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SimulatedInstancePaymentDto`; los campos opcionales se omiten.

```http
POST /billing/simulated/charges/00000000-0000-4000-8000-000000000001/instances/00000000-0000-4000-8000-000000000001/payments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "methodCode": 1,
  "amount": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `methodCode` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Decimal en texto | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/simulated/charges/00000000-0000-4000-8000-000000000001/instances/00000000-0000-4000-8000-000000000001/payments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "methodCode": 1,
  "amount": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 409 | `CONFLICT` | El servicio es de una sola instancia: se cobra y se factura de una vez | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/charges/{chargeId}/instances/{instanceId}/payments"
}
```

---

## 42. POST /billing/simulated/charges/{chargeId}/invoices

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Emitir la factura SIAT simulada de un cobro pagado
- **Operation ID:** `BillingSimulatedController_issue`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.issue](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Emitir la factura SIAT simulada de un cobro pagado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/simulated/charges/{chargeId}/invoices` en `BillingSimulatedController_issue`. El controlador delega en `BillingSimulatedService.issueInvoice`. Valida el body como `SimulatedIssueInvoiceDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `chargeId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SimulatedIssueInvoiceDto`; los campos opcionales se omiten.

```http
POST /billing/simulated/charges/00000000-0000-4000-8000-000000000001/invoices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "buyer": {
    "name": "Nombre de ejemplo",
    "documentTypeCode": 1,
    "documentNumber": "valor-ejemplo"
  }
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `buyer` | Sí | `SimulatedBuyerDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","documentTypeCode":1,"documentNumber":"valor-ejemplo","complement":{},"email":{}}` |
| `buyer.name` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `buyer.documentTypeCode` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `buyer.documentNumber` | Sí | `string` | longitud máxima 20 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `buyer.complement` | No | `object` | longitud máxima 5 | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `buyer.email` | No | `object` | longitud máxima 320 | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `additionalDiscount` | No | `object` | Sin restricción adicional declarada | Descuento adicional, decimal en texto | `{}` |
| `simulation` | No | `SimulatedSimulationDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"forceMessageCode":1}` |
| `simulation.forceMessageCode` | No | `number` | Sin restricción adicional declarada | Sólo simulador: forzar un mensaje del catálogo oficial | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/simulated/charges/00000000-0000-4000-8000-000000000001/invoices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "buyer": {
    "name": "Nombre de ejemplo",
    "documentTypeCode": 1,
    "documentNumber": "valor-ejemplo",
    "complement": {},
    "email": {}
  },
  "additionalDiscount": {},
  "simulation": {
    "forceMessageCode": 1
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 409 | `CONFLICT` | El cobro ya tiene la factura ${String(vigente[0]['n'])} vigente | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El cobro todavía no está pagado | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/charges/{chargeId}/invoices"
}
```

---

## 43. POST /billing/simulated/charges/{chargeId}/payment

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Registrar el pago real de un cobro
- **Operation ID:** `BillingSimulatedController_payment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.payment](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Registrar el pago real de un cobro. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/simulated/charges/{chargeId}/payment` en `BillingSimulatedController_payment`. El controlador delega en `BillingSimulatedService.registerPayment`. Valida el body como `SimulatedRegisterPaymentDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `chargeId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SimulatedRegisterPaymentDto`; los campos opcionales se omiten.

```http
POST /billing/simulated/charges/00000000-0000-4000-8000-000000000001/payment HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "methodCode": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `methodCode` | Sí | `number` | Sin restricción adicional declarada | Código del catálogo SIMULADO de métodos de pago | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/simulated/charges/00000000-0000-4000-8000-000000000001/payment HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "methodCode": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | INVOICE_ENCOUNTER_NOT_FOUND.message | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 404 | `NOT_FOUND` | Cargo no encontrado | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 409 | `CONFLICT` | El cobro ya está pagado | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 409 | `CONFLICT` | El número de factura ya existe en la práctica | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 409 | `CONFLICT` | El cargo ya está facturado | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 409 | `CONFLICT` | El cargo no está pendiente | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La consulta no tiene precio: defina el precio del servicio «${cobro.catalogName}» en el catálogo de servicios de la práctica | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 422 | `PRECONDITION_FAILED` | Los servicios con seguro se facturan al paciente desde la solicitud de seguro, con su parte calculada | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 422 | `PRECONDITION_FAILED` | El cargo no tiene precio (sin tarifa vigente) | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 422 | `PRECONDITION_FAILED` | El monto del pago debe ser positivo | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La asignación debe ser un importe positivo | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | El descuento debe ser un importe no negativo | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La suma asignada excede el monto del pago | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | El cobro está en pausa mientras el paciente tenga una objeción abierta | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La factura no tiene saldo pendiente | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La asignación excede el saldo de la factura | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/charges/{chargeId}/payment"
}
```

---

## 44. GET /billing/simulated/invoices/{invoiceId}

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Una factura simulada, dentro del alcance de quien la pide
- **Operation ID:** `BillingSimulatedController_invoice`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.invoice](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Una factura simulada, dentro del alcance de quien la pide. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /billing/simulated/invoices/{invoiceId}` en `BillingSimulatedController_invoice`. El controlador delega en `BillingSimulatedService.invoice`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `invoiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/simulated/invoices/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /billing/simulated/invoices/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo la administración de la clínica puede hacer esto | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/invoices/{invoiceId}"
}
```

---

## 45. POST /billing/simulated/invoices/{invoiceId}/annulment

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Anular la factura (sólo administración)
- **Operation ID:** `BillingSimulatedController_annul`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.annul](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Anular la factura (sólo administración). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/simulated/invoices/{invoiceId}/annulment` en `BillingSimulatedController_annul`. El controlador delega en `BillingSimulatedService.annul`. Valida el body como `SimulatedAnnulDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `invoiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SimulatedAnnulDto`; los campos opcionales se omiten.

```http
POST /billing/simulated/invoices/00000000-0000-4000-8000-000000000001/annulment HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reasonCode": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reasonCode` | Sí | `number` | Sin restricción adicional declarada | Motivo del catálogo SIMULADO de anulación | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/simulated/invoices/00000000-0000-4000-8000-000000000001/annulment HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reasonCode": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo la administración de la clínica puede hacer esto | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/invoices/{invoiceId}/annulment"
}
```

---

## 46. POST /billing/simulated/invoices/{invoiceId}/annulment-reversal

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Revertir la anulación (sólo administración)
- **Operation ID:** `BillingSimulatedController_revert`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.revert](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Revertir la anulación (sólo administración). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/simulated/invoices/{invoiceId}/annulment-reversal` en `BillingSimulatedController_revert`. El controlador delega en `BillingSimulatedService.revertAnnulment`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `invoiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /billing/simulated/invoices/00000000-0000-4000-8000-000000000001/annulment-reversal HTTP/1.1
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
POST /billing/simulated/invoices/00000000-0000-4000-8000-000000000001/annulment-reversal HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo la administración de la clínica puede hacer esto | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/invoices/{invoiceId}/annulment-reversal"
}
```

---

## 47. POST /billing/simulated/invoices/{invoiceId}/email

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Encolar el envío (simulado, no se envía) de la factura
- **Operation ID:** `BillingSimulatedController_email`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.email](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Encolar el envío (simulado, no se envía) de la factura. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/simulated/invoices/{invoiceId}/email` en `BillingSimulatedController_email`. El controlador delega en `BillingSimulatedService.email`. Valida el body como `SimulatedEmailDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `invoiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SimulatedEmailDto`; los campos opcionales se omiten.

```http
POST /billing/simulated/invoices/00000000-0000-4000-8000-000000000001/email HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "to": "paciente@correo.com"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `to` | Sí | `string` | longitud máxima 320 | Sin descripción específica en el contrato OpenAPI. | `paciente@correo.com` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/simulated/invoices/00000000-0000-4000-8000-000000000001/email HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "to": "paciente@correo.com"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo la administración de la clínica puede hacer esto | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/invoices/{invoiceId}/email"
}
```

---

## 48. GET /billing/simulated/my-invoices

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Mis facturas: recibidas (paciente) o emitidas (quien factura)
- **Operation ID:** `BillingSimulatedController_myInvoices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.myInvoices](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Mis facturas: recibidas (paciente) o emitidas (quien factura). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /billing/simulated/my-invoices` en `BillingSimulatedController_myInvoices`. El controlador delega en `BillingSimulatedService.myInvoices`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/simulated/my-invoices HTTP/1.1
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
GET /billing/simulated/my-invoices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/my-invoices"
}
```

---

## 49. GET /billing/simulated/my-invoices/{invoiceId}

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Una de mis facturas
- **Operation ID:** `BillingSimulatedController_myInvoice`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.myInvoice](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Una de mis facturas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /billing/simulated/my-invoices/{invoiceId}` en `BillingSimulatedController_myInvoice`. El controlador delega en `BillingSimulatedService.myInvoice`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `invoiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/simulated/my-invoices/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /billing/simulated/my-invoices/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/my-invoices/{invoiceId}"
}
```

---

## 50. GET /billing/simulated/outbox

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Bandeja de correo simulada (sólo administración)
- **Operation ID:** `BillingSimulatedController_outbox`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.outbox](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Bandeja de correo simulada (sólo administración). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /billing/simulated/outbox` en `BillingSimulatedController_outbox`. El controlador delega en `BillingSimulatedService.outbox`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/simulated/outbox HTTP/1.1
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
GET /billing/simulated/outbox HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo la administración de la clínica puede hacer esto | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/outbox"
}
```

---

## 51. GET /billing/simulated/status

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Estado fiscal simulado: emisores y credenciales sintéticas
- **Operation ID:** `BillingSimulatedController_status`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.status](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Estado fiscal simulado: emisores y credenciales sintéticas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /billing/simulated/status` en `BillingSimulatedController_status`. El controlador delega en `BillingSimulatedService.status`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/simulated/status HTTP/1.1
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
GET /billing/simulated/status HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/status"
}
```

---

## 52. GET /billing/space-tariffs

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-space-charges`
- **Nombre:** Tarifas de espacios
- **Operation ID:** `BillingSpaceChargesController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSpaceChargesController.list](../../src/modules/billing/controllers/billing-space-charges.controller.ts)

### Descripción de negocio

Tarifas de espacios. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Tarifas de espacios de una práctica.

### Descripción del sistema

NestJS resuelve `GET /billing/space-tariffs` en `BillingSpaceChargesController_list`. El controlador delega en `SpaceChargesService.listTariffs`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/space-tariffs?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /billing/space-tariffs?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/space-tariffs"
}
```

---

## 53. POST /billing/space-tariffs

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-space-charges`
- **Nombre:** Crear una tarifa de espacio
- **Operation ID:** `BillingSpaceChargesController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSpaceChargesController.create](../../src/modules/billing/controllers/billing-space-charges.controller.ts)

### Descripción de negocio

Crear una tarifa de espacio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Alta de tarifa (409 TARIFF_OVERLAP por EXCLUDE).

### Descripción del sistema

NestJS resuelve `POST /billing/space-tariffs` en `BillingSpaceChargesController_create`. El controlador delega en `SpaceChargesService.createTariff`. Valida el body como `CreateSpaceTariffDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateSpaceTariffDto`; los campos opcionales se omiten.

```http
POST /billing/space-tariffs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "tariffKind": "BED_DAY",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "unitPrice": "350.00",
  "validFrom": "2026-11-01"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tariffKind` | Sí | `string` | valores: `BED_DAY`, `OR_TIME` | Sin descripción específica en el contrato OpenAPI. | `BED_DAY` |
| `bedCategoryCode` | No | `string` | longitud máxima 40 | BED_CAT_* | `CODIGO_EJEMPLO` |
| `careSpaceId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceCatalogId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `unitMinutes` | No | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `minimumUnits` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `unitPrice` | Sí | `string` | longitud máxima 24 | Sin descripción específica en el contrato OpenAPI. | `350.00` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | Sí | `string` | patrón runtime `DATE` | Sin descripción específica en el contrato OpenAPI. | `2026-11-01` |
| `validTo` | No | `string` | patrón runtime `DATE` | Sin descripción específica en el contrato OpenAPI. | `2027-01-01` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/space-tariffs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "tariffKind": "BED_DAY",
  "bedCategoryCode": "CODIGO_EJEMPLO",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "unitMinutes": 1,
  "minimumUnits": 1,
  "unitPrice": "350.00",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-11-01",
  "validTo": "2027-01-01"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Vigencia inválida | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 422 | `PRECONDITION_FAILED` | La tarifa de quirófano necesita minutos por unidad | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 422 | `PRECONDITION_FAILED` | El servicio no es de la práctica | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 422 | `PRECONDITION_FAILED` | Categoría de cama desconocida | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/space-tariffs"
}
```

---

## 54. POST /billing/space-tariffs/{id}/close

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-space-charges`
- **Nombre:** Cerrar la vigencia de una tarifa
- **Operation ID:** `BillingSpaceChargesController_close`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSpaceChargesController.close](../../src/modules/billing/controllers/billing-space-charges.controller.ts)

### Descripción de negocio

Cerrar la vigencia de una tarifa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Cierre de vigencia.

### Descripción del sistema

NestJS resuelve `POST /billing/space-tariffs/{id}/close` en `BillingSpaceChargesController_close`. El controlador delega en `SpaceChargesService.closeTariff`. Valida el body como `CloseSpaceTariffDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CloseSpaceTariffDto`; los campos opcionales se omiten.

```http
POST /billing/space-tariffs/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "validTo": "2026-12-01"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `validTo` | Sí | `string` | patrón runtime `DATE` | Sin descripción específica en el contrato OpenAPI. | `2026-12-01` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/space-tariffs/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "validTo": "2026-12-01"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Tarifa no encontrada | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El fin debe ser posterior al inicio | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/space-tariffs/{id}/close"
}
```

---

## 55. POST /internal/billing/bed-day-charges/run

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-space-charges`
- **Nombre:** Devengar día-cama y quirófano (worker)
- **Operation ID:** `BillingSpaceChargesController_runInternal`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSpaceChargesController.runInternal](../../src/modules/billing/controllers/billing-space-charges.controller.ts)

### Descripción de negocio

Devengar día-cama y quirófano (worker). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Worker: día-cama y quirófano por tiempo.

### Descripción del sistema

NestJS resuelve `POST /internal/billing/bed-day-charges/run` en `BillingSpaceChargesController_runInternal`. El controlador delega en `SpaceChargesService.runInternal`. Valida el body como `RunBedDayDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunBedDayDto`; los campos opcionales se omiten.

```http
POST /internal/billing/bed-day-charges/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SYSTEM_WORKER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `date` | No | `string` | patrón runtime `DATE` | Sin descripción específica en el contrato OpenAPI. | `2026-10-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/billing/bed-day-charges/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "date": "2026-10-31"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SYSTEM_WORKER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Encuentro no encontrado | Excepción explícita en src/modules/billing/services/space-charges.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/billing/bed-day-charges/run"
}
```

---

## 56. GET /patient-spending/me

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `patient-spending`
- **Nombre:** Mis gastos de salud
- **Operation ID:** `PatientSpendingController_listMine`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PatientSpendingController.listMine](../../src/modules/billing/controllers/patient-spending.controller.ts)

### Descripción de negocio

Un movimiento por factura emitida al titular entre `from` y `to` (inclusive, nunca después de hoy), del más reciente al más antiguo. Importes en texto decimal exacto, con `paidAmount = grossAmount − coveredAmount − discountAmount`. El titular sale del token.

Contexto declarado en el controlador: Los gastos de salud del titular en un rango de fechas.

### Descripción del sistema

NestJS resuelve `GET /patient-spending/me` en `PatientSpendingController_listMine`. El controlador delega en `PatientSpendingService.listMine`. No recibe body. El tipo de retorno estático es `Promise<PatientSpendingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | Sí | `string` | Sin restricción adicional declarada | Desde (inclusive) | `2025-01-01` |
| `to` | query | Sí | `string` | Sin restricción adicional declarada | Hasta (inclusive) | `2026-10-26` |
| `limit` | query | No | `number` | mínimo 1; máximo 1000 | Sin descripción específica en OpenAPI. | `1000` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /patient-spending/me?from=2025-01-01&to=2026-10-26 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /patient-spending/me?from=2025-01-01&to=2026-10-26&limit=1000 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PatientSpendingResponseDto>` | Sí |
| 400 | `from`/`to` faltan, no son `YYYY-MM-DD` válidos, están invertidos o abarcan más de tres años; o `limit` fuera de 1..1000. | `Promise<PatientSpendingResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PatientSpendingResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PatientSpendingResponseDto>` | No |
| 422 | La cuenta no tiene perfil de paciente. | `Promise<PatientSpendingResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PatientSpendingResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PatientSpendingResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PatientSpendingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientSpendingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "currency": "BOB",
  "from": "2025-01-01",
  "to": "2026-10-26",
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "occurredAt": "2026-10-20T14:05:00.000Z",
      "description": "Texto descriptivo de ejemplo",
      "category": {
        "code": "SPEND_CONSULTATION",
        "display": "Consultations"
      },
      "providerName": "Nombre de ejemplo",
      "grossAmount": "300.00",
      "coveredAmount": "150.00",
      "discountAmount": "0.00",
      "paidAmount": "150.00"
    }
  ],
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `currency` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `from` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2025-01-01` |
| `to` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026-10-26` |
| `items` | Sí | `array<PatientSpendingMovementDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","occurredAt":"2026-10-20T14:05:00.000Z","description":"Texto descriptivo de ejemplo","category":{"code":"SPEND_CONSULTATION","display":"Consultations"},"providerName":"Nombre de ejemplo","grossAmount":"300.00","coveredAmount":"150.00","discountAmount":"0.00","paidAmount":"150.00"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].occurredAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026-10-20T14:05:00.000Z` |
| `items[].description` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `items[].category` | Sí | `PatientSpendingConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"SPEND_CONSULTATION","display":"Consultations"}` |
| `items[].category.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `SPEND_CONSULTATION` |
| `items[].category.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Consultations` |
| `items[].providerName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].grossAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `300.00` |
| `items[].coveredAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `150.00` |
| `items[].discountAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `0.00` |
| `items[].paidAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `150.00` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene perfil de paciente | Excepción explícita en src/modules/billing/services/patient-spending.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/patient-spending/me"
}
```

---

