# Revisión del módulo `tracking` — ALOVIDA

## Alcance y evidencia

Se revisaron los once casos de uso de seguimiento, su controlador, el servicio, repositorio y pruebas. `corepack yarn test src/modules/tracking --runInBand --silent` aprobó **2 suites y 57 pruebas**. La cobertura dirigida no demuestra ni autenticación del webhook ni separación entre tenants para las mutaciones por UUID.

## Hallazgos confirmados

### TRACK-01 — Crítica — Un tercero puede falsificar eventos de transportista

`POST /tracking/webhooks/carriers/:carrierCode` está marcado `@Public()` en [`tracking.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/tracking/controllers/tracking.controller.ts#L83-L97). `ingestCarrierWebhook` sólo busca el transportista por `carrierCode` y el sujeto por `trackingNumber`, antes de insertar el evento y cambiar el estado del envío ([`tracking.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/tracking/services/tracking.service.ts#L477-L590)); no recibe ni verifica firma, secreto, fecha, nonce o identificador del proveedor. La idempotencia por `externalEventId` evita duplicados, pero no acredita el origen. El propio README lo declara pendiente.

Esto permite a quien conozca un código válido y un número de seguimiento enviar estados falsos, incluso `DELIVERED`, que actualizan el timeline y el envío. Es la manifestación en `tracking` de `AUTHZ-T01` del informe transversal; se mantiene aquí para que la unidad conserve su plan ejecutable.

**Plan:** exigir una cabecera de firma HMAC con secreto por transportista, timestamp dentro de una ventana corta y nonce o event-id consumido atómicamente antes de procesar el payload. Comparar en tiempo constante, rechazar por defecto transportistas sin configuración y registrar sólo metadatos saneados. Mantener la idempotencia después de autenticar el evento.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Válido | Firma HMAC, timestamp y payload correctos | `200`, evento creado una vez |
| Límite | Reentrega firmada del mismo `externalEventId` | `200`, `duplicate: true`, sin segundo evento |
| Inválido | Firma ausente o alterada | `401/UNAUTHORIZED/TRACKING_WEBHOOK_SIGNATURE_INVALID`, sin mutación |
| Catálogo | Timestamp vencido o nonce repetido | `401/UNAUTHORIZED/TRACKING_WEBHOOK_REPLAY_REJECTED`, sin mutación |

### TRACK-02 — Crítica — Mutaciones de envíos por UUID sin alcance de tenant ni recurso

Las rutas de despacho, traspaso, ETA, entrega, excepción y cancelación aceptan sólo `:id` y roles globales ([`tracking.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/tracking/controllers/tracking.controller.ts#L53-L221)). En el servicio, por ejemplo, `dispatchShipment` carga el envío mediante `findShipmentForUpdate(tx, shipmentId)` y después muta envío y sujeto ([`tracking.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/tracking/services/tracking.service.ts#L305-L390)); los demás flujos reutilizan el mismo patrón. El repositorio ejecuta esas búsquedas como `{ id }`, sin `tenantId` ([`tracking.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/tracking/repositories/tracking.repository.ts#L253-L263), [`tracking.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/tracking/repositories/tracking.repository.ts#L338-L350)). `recordEvent` hace lo mismo para el sujeto. Ninguna de esas llamadas compara el tenant o una asignación del actor con la entidad cargada.

Un `LOGISTICS_OPERATOR`, `COURIER` o `TRACKING_ADMIN` que posea un UUID ajeno puede mutar su envío o timeline si la base no aporta una política RLS efectiva para esa identidad. El lock pesimista resuelve concurrencia; no autoriza el recurso.

**Plan:** derivar tenant y permisos desde `AuthenticatedUser`, cargar sujeto y envío con `id + tenantId`, y aplicar una política de recurso antes de cada transición: operador del tenant, mensajero asignado cuando corresponda y administrador explícitamente autorizado. No aceptar `tenantId` del DTO como evidencia de permiso. La consulta debe devolver indistinguible `404` para recursos fuera de alcance y la política RLS debe verificarse en integración.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Válido | Operador autorizado despacha un envío de su tenant | `200`, transición y evento atómicos |
| Límite | Courier asignado registra la entrega permitida | `201`, prueba y cierre correctos |
| Inválido | Mismo rol con UUID de envío de otro tenant | `404/RESOURCE_NOT_FOUND/TRACKING_SHIPMENT_NOT_FOUND`, sin escritura |
| Catálogo | Courier no asignado intenta cancelar o entregar | `403/FORBIDDEN/TRACKING_SHIPMENT_ACCESS_DENIED`, sin escritura |

## Cobertura a conservar

Las pruebas existentes cubren transiciones de estado, idempotencia funcional, bloqueos de actualización, hitos terminales y el cierre conjunto de sujeto y envío. Al corregir los hallazgos, preservar esas invariantes y sumar una matriz con dos tenants, dos actores del mismo tenant y el courier asignado/no asignado.
