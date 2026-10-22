<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `pharmacy_inventory`

- **Procesos:** 1 · **Máquinas de estado:** 1
- **Operaciones:** 29 (27 con decisiones propias, 2 sin ellas)
- Inventario de endpoints del módulo: [pharmacy_inventory](../endpoints/pharmacy_inventory.md)

## Proceso: src / modules / pharmacy inventory

- **Código:** `pharmacy_inventory` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 29
- **Actores:** Cualquier sesión válida · PATIENT · PHARMACY_STAFF · SECURITY_ADMIN · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/pharmacy_inventory/README.md`

### Para qué sirve

Inventario y operación de farmacia (schema `pharmacy_inventory`): ubicaciones, lotes, series y posiciones de stock con su libro de movimientos; conteos físicos, retiros de lote (recall), reservas y transferencias; sincronización de inventario externo; compras (proveedores, cotizaciones, órdenes y recepciones); dispensación de medicación y pedidos del paciente a la farmacia.

_Fuente: `src/modules/pharmacy_inventory/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:PharmacyDispensingController` | Operaciones de PharmacyDispensingController que el README no asigna a un caso de uso | POST /pharmacy/{pharmacyId}/dispensations | SECURITY_ADMIN | MEDIO | 12 |
|  |  | POST /pharmacy/dispensations/{id}/reverse | SECURITY_ADMIN | MEDIO | 7 |
| `ctrl:PharmacyInventoryController` | Operaciones de PharmacyInventoryController que el README no asigna a un caso de uso | POST /pharmacy/{pharmacyId}/reservations | SECURITY_ADMIN | MEDIO | 5 |
|  |  | POST /pharmacy/{pharmacyId}/transfers | SECURITY_ADMIN | MEDIO | 6 |
|  |  | POST /pharmacy/{siteId}/count-sessions | SECURITY_ADMIN | MEDIO | 5 |
|  |  | POST /pharmacy/{siteId}/inventory-locations | SECURITY_ADMIN | MEDIO | 1 |
|  |  | POST /pharmacy/count-sessions/{id}/approve | SECURITY_ADMIN | MEDIO | 8 |
|  |  | POST /pharmacy/recall-holds | SECURITY_ADMIN | MEDIO | 7 |
|  |  | POST /pharmacy/recall-holds/{id}/release | SECURITY_ADMIN | MEDIO | 8 |
| `ctrl:PharmacyInventoryInternalController` | Operaciones de PharmacyInventoryInternalController que el README no asigna a un caso de uso | POST /internal/inventory-sync-batches | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /internal/inventory-sync/{batchId}/reconcile | SECURITY_ADMIN | MEDIO | 4 |
|  |  | POST /internal/reservations/expire | SYSTEM · SECURITY_ADMIN | MEDIO | 22 |
| `ctrl:PharmacyInventoryReadController` | Operaciones de PharmacyInventoryReadController que el README no asigna a un caso de uso | GET /pharmacy-inventory/availability | Cualquier sesión válida | BAJO | 10 |
|  |  | GET /pharmacy-inventory/sites/{siteId}/stock | Cualquier sesión válida | BAJO | 6 |
| `ctrl:PharmacyOrdersController` | Operaciones de PharmacyOrdersController que el README no asigna a un caso de uso | GET /pharmacy/orders | SECURITY_ADMIN · PHARMACY_STAFF | MEDIO | 30 |
|  |  | POST /pharmacy/orders | PATIENT | MEDIO | 25 |
|  |  | GET /pharmacy/orders/{id} | Cualquier sesión válida | ALTO | 45 |
|  |  | POST /pharmacy/orders/{id}/accept-substitutions | PATIENT | MEDIO | 24 |
|  |  | POST /pharmacy/orders/{id}/cancel | PATIENT | MEDIO | 21 |
|  |  | POST /pharmacy/orders/{id}/confirm | SECURITY_ADMIN · PHARMACY_STAFF | MEDIO | 33 |
|  |  | POST /pharmacy/orders/{id}/dispense | SECURITY_ADMIN · PHARMACY_STAFF | MEDIO | 33 |
|  |  | POST /pharmacy/orders/{id}/prefer-original | PATIENT | MEDIO | 17 |
|  |  | POST /pharmacy/orders/{id}/ready | SECURITY_ADMIN · PHARMACY_STAFF | MEDIO | 25 |
|  |  | POST /pharmacy/orders/{id}/reject | SECURITY_ADMIN · PHARMACY_STAFF | MEDIO | 30 |
|  |  | POST /pharmacy/orders/{id}/review | SECURITY_ADMIN · PHARMACY_STAFF | MEDIO | 25 |
|  |  | GET /pharmacy/orders/me | PATIENT | MEDIO | 44 |
| `ctrl:PharmacyProcurementController` | Operaciones de PharmacyProcurementController que el README no asigna a un caso de uso | POST /pharmacy/{pharmacyId}/goods-receipts | SECURITY_ADMIN | MEDIO | 16 |
|  |  | POST /pharmacy/{pharmacyId}/purchase-orders | SECURITY_ADMIN | MEDIO | 5 |
|  |  | POST /pharmacy/{pharmacyId}/suppliers | SECURITY_ADMIN | MEDIO | 1 |

### Diagrama 1 de 2 — etapas `ctrl:PharmacyDispensingController`, `ctrl:PharmacyInventoryController`, `ctrl:PharmacyInventoryInternalController`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  a32(["SYSTEM · SECURITY_ADMIN"]):::actor
  a41(["Cualquier sesión válida"]):::actor
  a52(["SECURITY_ADMIN · PHARMACY_STAFF"]):::actor
  a55(["PATIENT"]):::actor
  t3[("pharmacy_inventory.inventory_ledger_entries")]:::tabla
  t4[("pharmacy_inventory.inventory_reservation_lines")]:::tabla
  t5[("pharmacy_inventory.inventory_reservations")]:::tabla
  t8[("pharmacy_inventory.inventory_stock_positions")]:::tabla
  t9[("pharmacy_inventory.medication_dispensation_lines")]:::tabla
  t10[("pharmacy_inventory.medication_dispensations")]:::tabla
  t14[("pharmacy_inventory.inventory_locations")]:::tabla
  t16[("pharmacy_inventory.inventory_count_lines")]:::tabla
  t17[("pharmacy_inventory.inventory_count_sessions")]:::tabla
  t22[("pharmacy_inventory.inventory_lots")]:::tabla
  t23[("pharmacy_inventory.inventory_recall_holds")]:::tabla
  t28[("pharmacy_inventory.pharmacy_inventory_sync_batches")]:::tabla
  t29[("pharmacy_inventory.pharmacy_inventory_sync_items")]:::tabla
  t33[("clinical.medication_requests")]:::tabla
  t34[("messaging.domain_events")]:::tabla
  t35[("messaging.in_app_notifications")]:::tabla
  t36[("messaging.message_channels")]:::tabla
  t37[("messaging.messaging_providers")]:::tabla
  e39>"~null"]:::evento
  t42[("common.addresses")]:::tabla
  t43[("pharmacy.pharmacies")]:::tabla
  t44[("pharmacy.pharmacy_price_lists")]:::tabla
  t45[("pharmacy.pharmacy_product_prices")]:::tabla
  t48[("pharmacy.pharmacy_products")]:::tabla
  t49[("pharmacy.pharmacy_sites")]:::tabla
  t50[("terminology.catalog_concepts")]:::tabla
  t56[("messaging.outbox_messages")]:::tabla
  t59[("clinical.service_requests")]:::tabla
  t60[("diagnostic_units.diagnostic_study_offerings")]:::tabla
  t61[("diagnostic_units.diagnostic_units")]:::tabla
  t62[("directory.tenant_memberships")]:::tabla
  t71[("insurance.insurance_claims")]:::tabla
  t82[("insurance.claim_adjudication_versions")]:::tabla
  t6[("+6 tablas más")]
  t11[("+1 tablas más")]
  subgraph s0["ctrl:PharmacyDispensingController · Operaciones de PharmacyDispensingController…"]
    o1["POST /pharmacy/{pharmacyId}/dispensations"]:::op
    o7["POST /pharmacy/dispensations/{id}/reverse"]:::op
  end
  t20[("+2 tablas más")]
  t24[("+1 tablas más")]
  t26[("+2 tablas más")]
  subgraph s1["ctrl:PharmacyInventoryController · Operaciones de PharmacyInventoryController q…"]
    o12["POST /pharmacy/{pharmacyId}/reservations"]:::op
    o13["POST /pharmacy/{pharmacyId}/transfers"]:::op
    o15["POST /pharmacy/{siteId}/count-sessions"]:::op
    o18["POST /pharmacy/{siteId}/inventory-locations"]:::op
    o19["POST /pharmacy/count-sessions/{id}/approve"]:::op
    o21["POST /pharmacy/recall-holds"]:::op
    o25["POST /pharmacy/recall-holds/{id}/release"]:::op
  end
  t38[("+16 tablas más")]
  subgraph s2["ctrl:PharmacyInventoryInternalController · Operaciones de PharmacyInventoryInte…"]
    o27["POST /internal/inventory-sync-batches"]:::op
    o30["POST /internal/inventory-sync/{batchId}/reconcile"]:::op
    o31["POST /internal/reservations/expire"]:::op
  end
  t46[("+4 tablas más")]
  subgraph s3["ctrl:PharmacyInventoryReadController · Operaciones de PharmacyInventoryReadCont…"]
    o40["GET /pharmacy-inventory/availability"]:::op
    o47["GET /pharmacy-inventory/sites/{siteId}/stock"]:::op
  end
  t53[("+24 tablas más")]
  t57[("+19 tablas más")]
  t63[("+39 tablas más")]
  t65[("+18 tablas más")]
  t67[("+15 tablas más")]
  t69[("+27 tablas más")]
  t72[("+27 tablas más")]
  t74[("+11 tablas más")]
  t76[("+19 tablas más")]
  t78[("+24 tablas más")]
  t80[("+19 tablas más")]
  t83[("+38 tablas más")]
  subgraph s4["ctrl:PharmacyOrdersController · Operaciones de PharmacyOrdersController que el…"]
    o51["GET /pharmacy/orders"]:::op
    o54["POST /pharmacy/orders"]:::op
    o58["GET /pharmacy/orders/{id}"]:::op
    o64["POST /pharmacy/orders/{id}/accept-substitutions"]:::op
    o66["POST /pharmacy/orders/{id}/cancel"]:::op
    o68["POST /pharmacy/orders/{id}/confirm"]:::op
    o70["POST /pharmacy/orders/{id}/dispense"]:::op
    o73["POST /pharmacy/orders/{id}/prefer-original"]:::op
    o75["POST /pharmacy/orders/{id}/ready"]:::op
    o77["POST /pharmacy/orders/{id}/reject"]:::op
    o79["POST /pharmacy/orders/{id}/review"]:::op
    o81["GET /pharmacy/orders/me"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  o1 -->|"ACTUALIZA"| t4
  o1 -->|"LEE"| t4
  o1 -->|"ACTUALIZA"| t5
  o1 -->|"LEE"| t5
  o1 -.-> t6
  a2 --> o7
  o7 -->|"CREA"| t3
  o7 -->|"LEE"| t3
  o7 -->|"ACTUALIZA"| t8
  o7 -->|"LEE"| t8
  o7 -->|"LEE"| t9
  o7 -->|"ACTUALIZA"| t10
  o7 -.-> t11
  a2 --> o12
  o12 -->|"CREA"| t3
  o12 -->|"LEE"| t3
  o12 -->|"CREA"| t4
  o12 -->|"CREA"| t5
  o12 -->|"LEE"| t8
  a2 --> o13
  o13 -->|"CREA"| t3
  o13 -->|"LEE"| t3
  o13 -->|"LEE"| t14
  o13 -->|"ACTUALIZA"| t8
  o13 -->|"CREA"| t8
  o13 -->|"LEE"| t8
  a2 --> o15
  o15 -->|"CREA"| t16
  o15 -->|"CREA"| t17
  o15 -->|"LEE"| t17
  o15 -->|"LEE"| t14
  o15 -->|"LEE"| t8
  a2 --> o18
  o18 -->|"CREA"| t14
  a2 --> o19
  o19 -->|"ACTUALIZA"| t16
  o19 -->|"LEE"| t16
  o19 -->|"ACTUALIZA"| t17
  o19 -->|"LEE"| t17
  o19 -->|"CREA"| t3
  o19 -->|"LEE"| t3
  o19 -.-> t20
  a2 --> o21
  o21 -->|"CREA"| t3
  o21 -->|"LEE"| t3
  o21 -->|"ACTUALIZA"| t22
  o21 -->|"LEE"| t22
  o21 -->|"CREA"| t23
  o21 -->|"ACTUALIZA"| t8
  o21 -.-> t24
  a2 --> o25
  o25 -->|"CREA"| t3
  o25 -->|"LEE"| t3
  o25 -->|"ACTUALIZA"| t22
  o25 -->|"LEE"| t22
  o25 -->|"ACTUALIZA"| t23
  o25 -->|"LEE"| t23
  o25 -.-> t26
  a2 --> o27
  o27 -->|"CREA"| t28
  o27 -->|"CREA"| t29
  o27 -->|"LEE"| t29
  a2 --> o30
  o30 -->|"ACTUALIZA"| t28
  o30 -->|"LEE"| t28
  o30 -->|"ACTUALIZA"| t29
  o30 -->|"LEE"| t29
  a32 --> o31
  o31 -->|"LEE"| t33
  o31 -->|"CREA"| t34
  o31 -->|"CREA"| t35
  o31 -->|"LEE"| t35
  o31 -->|"LEE"| t36
  o31 -->|"LEE"| t37
  o31 -.-> t38
  o31 -->|"evento"| e39
  a41 --> o40
  o40 -->|"LEE"| t42
  o40 -->|"LEE"| t14
  o40 -->|"LEE"| t8
  o40 -->|"LEE"| t43
  o40 -->|"LEE"| t44
  o40 -->|"LEE"| t45
  o40 -.-> t46
  a41 --> o47
  o47 -->|"LEE"| t14
  o47 -->|"LEE"| t8
  o47 -->|"LEE"| t43
  o47 -->|"LEE"| t48
  o47 -->|"LEE"| t49
  o47 -->|"LEE"| t50
  a52 --> o51
  o51 -->|"LEE"| t33
  o51 -->|"LEE"| t42
  o51 -->|"CREA"| t34
  o51 -->|"CREA"| t35
  o51 -->|"LEE"| t35
  o51 -->|"LEE"| t36
  o51 -.-> t53
  o51 -->|"evento"| e39
  a55 --> o54
  o54 -->|"LEE"| t33
  o54 -->|"LEE"| t42
  o54 -->|"CREA"| t34
  o54 -->|"CREA"| t56
  o54 -->|"LEE"| t56
  o54 -->|"CREA"| t3
  o54 -.-> t57
  o54 -->|"evento"| e39
  a41 --> o58
  o58 -->|"LEE"| t33
  o58 -->|"LEE"| t59
  o58 -->|"LEE"| t42
  o58 -->|"LEE"| t60
  o58 -->|"LEE"| t61
  o58 -->|"LEE"| t62
  o58 -.-> t63
  o58 -->|"evento"| e39
  a55 --> o64
  o64 -->|"LEE"| t33
  o64 -->|"LEE"| t42
  o64 -->|"CREA"| t34
  o64 -->|"CREA"| t56
  o64 -->|"LEE"| t56
  o64 -->|"CREA"| t3
  o64 -.-> t65
  o64 -->|"evento"| e39
  a55 --> o66
  o66 -->|"LEE"| t33
  o66 -->|"LEE"| t42
  o66 -->|"CREA"| t34
  o66 -->|"CREA"| t56
  o66 -->|"LEE"| t56
  o66 -->|"CREA"| t3
  o66 -.-> t67
  o66 -->|"evento"| e39
  a52 --> o68
  o68 -->|"LEE"| t33
  o68 -->|"LEE"| t42
  o68 -->|"CREA"| t34
  o68 -->|"CREA"| t35
  o68 -->|"LEE"| t35
  o68 -->|"LEE"| t36
  o68 -.-> t69
  o68 -->|"evento"| e39
  a52 --> o70
  o70 -->|"LEE"| t33
  o70 -->|"LEE"| t42
  o70 -->|"LEE"| t71
  o70 -->|"CREA"| t34
  o70 -->|"CREA"| t35
  o70 -->|"LEE"| t35
  o70 -.-> t72
  o70 -->|"evento"| e39
  a55 --> o73
  o73 -->|"LEE"| t33
  o73 -->|"LEE"| t42
  o73 -->|"CREA"| t34
  o73 -->|"CREA"| t56
  o73 -->|"LEE"| t56
  o73 -->|"LEE"| t4
  o73 -.-> t74
  o73 -->|"evento"| e39
  a52 --> o75
  o75 -->|"LEE"| t33
  o75 -->|"LEE"| t42
  o75 -->|"CREA"| t34
  o75 -->|"CREA"| t35
  o75 -->|"LEE"| t35
  o75 -->|"LEE"| t36
  o75 -.-> t76
  o75 -->|"evento"| e39
  a52 --> o77
  o77 -->|"LEE"| t33
  o77 -->|"LEE"| t42
  o77 -->|"CREA"| t34
  o77 -->|"CREA"| t35
  o77 -->|"LEE"| t35
  o77 -->|"LEE"| t36
  o77 -.-> t78
  o77 -->|"evento"| e39
  a52 --> o79
  o79 -->|"LEE"| t33
  o79 -->|"LEE"| t42
  o79 -->|"CREA"| t34
  o79 -->|"CREA"| t35
  o79 -->|"LEE"| t35
  o79 -->|"LEE"| t36
  o79 -.-> t80
  o79 -->|"evento"| e39
  a55 --> o81
  o81 -->|"LEE"| t33
  o81 -->|"LEE"| t59
  o81 -->|"LEE"| t42
  o81 -->|"LEE"| t60
  o81 -->|"LEE"| t61
  o81 -->|"LEE"| t82
  o81 -.-> t83
  o81 -->|"evento"| e39
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 2 — etapas `ctrl:PharmacyProcurementController`

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  t3[("pharmacy_inventory.inventory_ledger_entries")]:::tabla
  t4[("pharmacy_inventory.inventory_locations")]:::tabla
  t5[("pharmacy_inventory.inventory_lots")]:::tabla
  t6[("pharmacy_inventory.inventory_stock_positions")]:::tabla
  t9[("pharmacy_inventory.pharmacy_purchase_order_lines")]:::tabla
  t10[("pharmacy_inventory.pharmacy_purchase_orders")]:::tabla
  t11[("pharmacy_inventory.pharmacy_suppliers")]:::tabla
  t7[("+10 tablas más")]
  subgraph s0["ctrl:PharmacyProcurementController · Operaciones de PharmacyProcurementControll…"]
    o1["POST /pharmacy/{pharmacyId}/goods-receipts"]:::op
    o8["POST /pharmacy/{pharmacyId}/purchase-orders"]:::op
    o12["POST /pharmacy/{pharmacyId}/suppliers"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"CREA"| t5
  o1 -->|"LEE"| t5
  o1 -->|"ACTUALIZA"| t6
  o1 -.-> t7
  a2 --> o8
  o8 -->|"CREA"| t9
  o8 -->|"LEE"| t9
  o8 -->|"CREA"| t10
  o8 -->|"LEE"| t10
  o8 -->|"LEE"| t11
  a2 --> o12
  o12 -->|"CREA"| t11
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Máquinas de estado

### Máquina de estados `ORDER_STAFF_TRANSITIONS`

Declarada en `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:161`. Los estados llevan el nombre del identificador del código; no se resuelven al catálogo de conceptos.

```mermaid
stateDiagram-v2
  [*] --> ORDER_ENVIADO
  [*] --> ORDER_ACEPTADO
  ORDER_ENVIADO --> ORDER_EN_REVISION : POST …/{id}/review
  ORDER_ENVIADO --> ORDER_CONFIRMADO : POST …/{id}/confirm
  ORDER_ENVIADO --> ORDER_ACEPTACION_PENDIENTE : POST …/{id}/confirm
  ORDER_ENVIADO --> ORDER_RECHAZADO : POST …/{id}/reject
  ORDER_EN_REVISION --> ORDER_CONFIRMADO : POST …/{id}/confirm
  ORDER_EN_REVISION --> ORDER_ACEPTACION_PENDIENTE : POST …/{id}/confirm
  ORDER_EN_REVISION --> ORDER_RECHAZADO : POST …/{id}/reject
  ORDER_CONFIRMADO --> ORDER_LISTO_PARA_RETIRO : POST …/{id}/ready
  ORDER_CONFIRMADO --> ORDER_RECHAZADO : POST …/{id}/reject
  ORDER_ACEPTACION_PENDIENTE --> ORDER_RECHAZADO : POST …/{id}/reject
  ORDER_ACEPTADO --> ORDER_LISTO_PARA_RETIRO : POST …/{id}/ready
  ORDER_ACEPTADO --> ORDER_RECHAZADO : POST …/{id}/reject
  ORDER_RECHAZADO --> [*]
  ORDER_LISTO_PARA_RETIRO --> [*]
```

**Operaciones que ejercen esta máquina** _(POR_REFERENCIA: el handler alcanza un método que valida contra la tabla; «sin destino nombrado» significa que el estado de destino llega por el cuerpo de la petición)_:

| Operación | Estados de destino que nombra | A través de |
|---|---|---|
| POST /pharmacy/orders/{id}/confirm | ORDER_ACEPTACION_PENDIENTE, ORDER_CONFIRMADO | PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.assertStaffTransition |
| POST /pharmacy/orders/{id}/ready | ORDER_LISTO_PARA_RETIRO | PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.assertStaffTransition |
| POST /pharmacy/orders/{id}/reject | ORDER_RECHAZADO | PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.assertStaffTransition |
| POST /pharmacy/orders/{id}/review | ORDER_EN_REVISION | PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.assertStaffTransition |

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /internal/inventory-sync-batches

Ingerir un lote de sincronización ERP

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a InventorySyncService.createBatch"]:::llamada
  n2 --> n3
  n4["Llama a CreateInventorySyncBatchUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SyncRepository.createBatch"]:::llamada
  n5 --> n6
  n7[("CREA pharmacy_inventory.pharmacy_inventory_sync_batches")]:::efecto
  n6 --> n7
  n8["Repite: por cada const item de dto.items"]:::bucle
  n7 --> n8
  n9{"item.idempotencyKey"}:::decision
  n8 -->|"cada elemento"| n9
  n10["Llama a SyncRepository.findItemByIdempotencyKey"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE pharmacy_inventory.pharmacy_inventory_sync_items")]:::efecto
  n10 --> n11
  n12["Llama a SyncRepository.createItem"]:::llamada
  n11 --> n12
  n9 -->|"no"| n12
  n13[("CREA pharmacy_inventory.pharmacy_inventory_sync_items")]:::efecto
  n12 --> n13
  n14(("201 Responde con éxito")):::ok
  n13 --> n14
  n8 -->|"al terminar"| n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /internal/inventory-sync/{batchId}/reconcile

Conciliar lote de sincronización externa (UC-25-12)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Lote de sincronización no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El lote no está en estado reconciliable |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a InventorySyncService.reconcile"]:::llamada
  n2 --> n3
  n4["Llama a ReconcileInventorySyncBatchUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SyncRepository.findBatchById"]:::llamada
  n5 --> n6
  n7[("LEE pharmacy_inventory.pharmacy_inventory_sync_batches")]:::efecto
  n6 --> n7
  n8{"!batch"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Lote de sincronización no encontrado"]):::error
  n8 -->|"sí"| n9
  n10{"batch.statusConceptId !== PINV.BATCH_RECEIVED"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED El lote no está en estado reconciliable"]):::error
  n10 -->|"sí"| n11
  n12["Llama a SyncRepository.findItems"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE pharmacy_inventory.pharmacy_inventory_sync_items")]:::efecto
  n12 --> n13
  n14["Repite: por cada const item de items"]:::bucle
  n13 --> n14
  n15[("ACTUALIZA pharmacy_inventory.pharmacy_inventory_sync_items")]:::efecto
  n14 -->|"cada elemento"| n15
  n16{"result.normalizedQuantity !== undefined"}:::decision
  n15 --> n16
  n17[("ACTUALIZA pharmacy_inventory.pharmacy_inventory_sync_items")]:::efecto
  n16 -->|"sí"| n17
  n18{"result.errorCode !== undefined"}:::decision
  n17 --> n18
  n16 -->|"no"| n18
  n19[("ACTUALIZA pharmacy_inventory.pharmacy_inventory_sync_items · ACTUALIZA pharmacy_inventory.pharmacy_inventory_…")]:::efecto
  n18 -->|"sí"| n19
  n20[("ACTUALIZA pharmacy_inventory.pharmacy_inventory_sync_batches · ACTUALIZA pharmacy_inventory.pharmacy_inventor…")]:::efecto
  n19 --> n20
  n18 -->|"no"| n20
  n14 -->|"al terminar"| n20
  n21(("200 Responde con éxito")):::ok
  n20 --> n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /internal/reservations/expire

Liberar reservas y pedidos vencidos (UC-25-05)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a InventoryReservationsService.expire"]:::llamada
  n2 --> n3
  n4["Llama a ExpireInventoryReservationsUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a ReservationsRepository.findExpired"]:::llamada
  n5 --> n6
  n7[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n6 --> n7
  n8["Repite: por cada const reservation de expired"]:::bucle
  n7 --> n8
  n9[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n8 -->|"cada elemento"| n9
  n10["Llama a ReleaseConfirmedReservationLinesUseCase.execute"]:::llamada
  n9 --> n10
  n11["Llama a ReservationsRepository.findLinesByReservation"]:::llamada
  n10 --> n11
  n12[("LEE pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n11 --> n12
  n13["Repite: por cada const line de lines"]:::bucle
  n12 --> n13
  n14[("ACTUALIZA pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n13 -->|"cada elemento"| n14
  n15{"line.inventoryLocationId"}:::decision
  n14 --> n15
  n16["Llama a StockPositionsRepository.findByKeyForUpdate"]:::llamada
  n15 -->|"sí"| n16
  n17[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n16 --> n17
  n18["Llama a LedgerRepository.nextSequence"]:::llamada
  n17 --> n18
  n19[("LEE pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n18 --> n19
  n20["Llama a LedgerRepository.append"]:::llamada
  n19 --> n20
  n21[("CREA pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n20 --> n21
  n22{"position"}:::decision
  n21 --> n22
  n23[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n22 -->|"sí"| n23
  n24["Llama a PharmacyOrdersService.expireDue"]:::llamada
  n23 --> n24
  n22 -->|"no"| n24
  n15 -->|"no"| n24
  n13 -->|"al terminar"| n24
  n8 -->|"al terminar"| n24
  n25["Llama a PharmacyOrdersUseCases.expireDue"]:::llamada
  n24 --> n25
  n26["Transacción: transactional(…)"]:::transaccion
  n25 --> n26
  n27["Llama a PharmacyOrdersRepository.findDueOrdersForUpdate"]:::llamada
  n26 --> n27
  n28[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n27 --> n28
  n29["Llama a PharmacyOrdersRepository.findPharmaciesByIds"]:::llamada
  n28 --> n29
  n30[("LEE pharmacy.pharmacies")]:::efecto
  n29 --> n30
  n31["Repite: por cada const order de due"]:::bucle
  n30 --> n31
  n32[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n31 -->|"cada elemento"| n32
  n33["Llama a InventoryReservationsService.releaseConfirmedLines"]:::llamada
  n32 --> n33
  n34["Llama a ReleaseConfirmedReservationLinesUseCase.execute"]:::llamada
  n33 --> n34
  n35["Repite: por cada const line de lines"]:::bucle
  n34 --> n35
  n36[("ACTUALIZA pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n35 -->|"cada elemento"| n36
  n37{"line.inventoryLocationId"}:::decision
  n36 --> n37
  n38{"position"}:::decision
  n37 -->|"sí"| n38
  n39[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n38 -->|"sí"| n39
  n40["Llama a MessagingDomainEventAdapter.publish"]:::llamada
  n39 --> n40
  n38 -->|"no"| n40
  n37 -->|"no"| n40
  n35 -->|"al terminar"| n40
  n41>"Evento ~null"]:::evento
  n40 --> n41
  n42["Repite: por cada const notice de expired"]:::bucle
  n41 --> n42
  n31 -->|"al terminar"| n42
  n43{"notice.medicationRequestId"}:::decision
  n42 -->|"cada elemento"| n43
  n44["Llama a PharmacyOrdersRepository.findPrescriberProfileId"]:::llamada
  n43 -->|"sí"| n44
  n45[("LEE clinical.medication_requests")]:::efecto
  n44 --> n45
  n46(("200 Responde con éxito")):::ok
  n45 --> n46
  n43 -->|"no"| n46
  n42 -->|"al terminar"| n46
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. GET /pharmacy-inventory/availability

Consultar qué sedes pueden surtir un conjunto de productos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; BadRequestException: products es obligatorio: la disponibilidad se consulta para un pedido concreto |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3{"!productIds"}:::decision
  n2 --> n3
  n4(["400 VALIDATION_FAILED products es obligatorio: la disponibilidad se consulta para un pedido concreto"]):::error
  n3 -->|"sí"| n4
  n5["Llama a PharmacyInventoryReadService.availability"]:::llamada
  n3 -->|"no"| n5
  n6["Llama a ReadPharmacyInventoryUseCase.availability"]:::llamada
  n5 --> n6
  n7["Llama a PharmacyDirectoryAdapter.findVisibleByTenant"]:::llamada
  n6 --> n7
  n8["Llama a PharmacyReadRepository.findVisibleByTenant"]:::llamada
  n7 --> n8
  n9[("LEE pharmacy.pharmacies")]:::efecto
  n8 --> n9
  n10["Llama a PharmacyDirectoryAdapter.findActiveProductsByIds"]:::llamada
  n9 --> n10
  n11["Llama a PharmacyReadRepository.findActiveProductsByIds"]:::llamada
  n10 --> n11
  n12[("LEE pharmacy.pharmacy_products")]:::efecto
  n11 --> n12
  n13["Llama a PharmacyDirectoryAdapter.findActiveSites"]:::llamada
  n12 --> n13
  n14["Llama a PharmacyReadRepository.findActiveSites"]:::llamada
  n13 --> n14
  n15[("LEE pharmacy.pharmacy_sites")]:::efecto
  n14 --> n15
  n16["Llama a InventoryReadRepository.findActiveLocationsBySites"]:::llamada
  n15 --> n16
  n17[("LEE pharmacy_inventory.inventory_locations")]:::efecto
  n16 --> n17
  n18["Llama a PharmacyDirectoryAdapter.findCurrentPublicPriceLists"]:::llamada
  n17 --> n18
  n19["Llama a PharmacyReadRepository.findCurrentPublicPriceLists"]:::llamada
  n18 --> n19
  n20[("LEE pharmacy.pharmacy_price_lists")]:::efecto
  n19 --> n20
  n21["Llama a InventoryReadRepository.findStockPositions"]:::llamada
  n20 --> n21
  n22[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n21 --> n22
  n23["Llama a PharmacyDirectoryAdapter.findCurrentPrices"]:::llamada
  n22 --> n23
  n24["Llama a PharmacyReadRepository.findCurrentPrices"]:::llamada
  n23 --> n24
  n25[("LEE pharmacy.pharmacy_product_prices")]:::efecto
  n24 --> n25
  n26["Llama a PharmacyDirectoryAdapter.findConcepts"]:::llamada
  n25 --> n26
  n27["Llama a PharmacyReadRepository.findConcepts"]:::llamada
  n26 --> n27
  n28[("LEE terminology.catalog_concepts")]:::efecto
  n27 --> n28
  n29(("200 Responde con éxito")):::ok
  n28 --> n29
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. GET /pharmacy-inventory/sites/{siteId}/stock

Consultar el stock disponible de una sede

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sede de farmacia no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyInventoryReadService.getSiteStock"]:::llamada
  n2 --> n3
  n4["Llama a ReadPharmacyInventoryUseCase.getSiteStock"]:::llamada
  n3 --> n4
  n5["Llama a PharmacyDirectoryAdapter.findActiveSiteById"]:::llamada
  n4 --> n5
  n6["Llama a PharmacyReadRepository.findActiveSiteById"]:::llamada
  n5 --> n6
  n7[("LEE pharmacy.pharmacy_sites")]:::efecto
  n6 --> n7
  n8["Llama a PharmacyDirectoryAdapter.findVisibleById"]:::llamada
  n7 --> n8
  n9["Llama a PharmacyReadRepository.findVisibleById"]:::llamada
  n8 --> n9
  n10[("LEE pharmacy.pharmacies")]:::efecto
  n9 --> n10
  n11{"!site || !pharmacy"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Sede de farmacia no encontrada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a InventoryReadRepository.findActiveLocationsBySites"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE pharmacy_inventory.inventory_locations")]:::efecto
  n13 --> n14
  n15["Llama a InventoryReadRepository.findStockPositions"]:::llamada
  n14 --> n15
  n16[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n15 --> n16
  n17["Llama a PharmacyDirectoryAdapter.findActiveProductsByIds"]:::llamada
  n16 --> n17
  n18["Llama a PharmacyReadRepository.findActiveProductsByIds"]:::llamada
  n17 --> n18
  n19[("LEE pharmacy.pharmacy_products")]:::efecto
  n18 --> n19
  n20["Llama a PharmacyDirectoryAdapter.findConcepts"]:::llamada
  n19 --> n20
  n21["Llama a PharmacyReadRepository.findConcepts"]:::llamada
  n20 --> n21
  n22[("LEE terminology.catalog_concepts")]:::efecto
  n21 --> n22
  n23(("200 Responde con éxito")):::ok
  n22 --> n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /pharmacy/{pharmacyId}/dispensations

Dispensar una prescripción a un paciente (UC-25-03)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reserva no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La reserva es un pedido de paciente: se dispensa con su código de retiro por POST /pharmacy/orders/:id/dispense; PreconditionFailedException: Stock insuficiente para dispensar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a MedicationDispensationsService.dispense"]:::llamada
  n2 --> n3
  n4["Llama a DispenseMedicationUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6{"dto.idempotencyKey"}:::decision
  n5 --> n6
  n7["Llama a DispensationsRepository.findByIdempotencyKey"]:::llamada
  n6 -->|"sí"| n7
  n8[("LEE pharmacy_inventory.medication_dispensations")]:::efecto
  n7 --> n8
  n9{"existing"}:::decision
  n8 --> n9
  n10["Llama a DispensationsRepository.findLines"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE pharmacy_inventory.medication_dispensation_lines")]:::efecto
  n10 --> n11
  n12["Llama a LedgerRepository.findEntryIdsBySource"]:::llamada
  n11 --> n12
  n13[("LEE pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n12 --> n13
  n14{"dto.inventoryReservationId"}:::decision
  n13 --> n14
  n9 -->|"no"| n14
  n6 -->|"no"| n14
  n15["Llama a ReservationsRepository.findById"]:::llamada
  n14 -->|"sí"| n15
  n16[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n15 --> n16
  n17{"!reservation"}:::decision
  n16 --> n17
  n18(["404 NOT_FOUND Reserva no encontrada"]):::error
  n17 -->|"sí"| n18
  n19{"ORDER_STATUS_IDS.includes(reservation.reservationStatusConceptId)"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED La reserva es un pedido de paciente: se dispensa con su código de retiro por POST /ph…"]):::error
  n19 -->|"sí"| n20
  n21["Llama a DispensationsRepository.create"]:::llamada
  n19 -->|"no"| n21
  n14 -->|"no"| n21
  n22[("CREA pharmacy_inventory.medication_dispensations")]:::efecto
  n21 --> n22
  n23["Repite: por cada const line de dto.lines"]:::bucle
  n22 --> n23
  n24["Llama a StockPositionsRepository.findByKeyForUpdate"]:::llamada
  n23 -->|"cada elemento"| n24
  n25[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n24 --> n25
  n26{"!position || num(position.onHandQuantity) ‹ line.dispensedQuantity"}:::decision
  n25 --> n26
  n27(["422 PRECONDITION_FAILED Stock insuficiente para dispensar"]):::error
  n26 -->|"sí"| n27
  n28["Llama a DispensationsRepository.createLine"]:::llamada
  n26 -->|"no"| n28
  n29[("CREA pharmacy_inventory.medication_dispensation_lines")]:::efecto
  n28 --> n29
  n30["Llama a LedgerRepository.nextSequence"]:::llamada
  n29 --> n30
  n31[("LEE pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n30 --> n31
  n32["Llama a LedgerRepository.append"]:::llamada
  n31 --> n32
  n33[("CREA pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n32 --> n33
  n34[("ACTUALIZA pharmacy_inventory.inventory_stock_positions")]:::efecto
  n33 --> n34
  n35{"dto.inventoryReservationId && num(position.reservedQuantity) ›= line.dispensedQuantity"}:::decision
  n34 --> n35
  n36[("ACTUALIZA pharmacy_inventory.inventory_stock_positions")]:::efecto
  n35 -->|"sí"| n36
  n37[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n36 --> n37
  n35 -->|"no"| n37
  n38{"dto.inventoryReservationId"}:::decision
  n37 --> n38
  n23 -->|"al terminar"| n38
  n39["Llama a ReservationsRepository.findById"]:::llamada
  n38 -->|"sí"| n39
  n40[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n39 --> n40
  n41{"reservation"}:::decision
  n40 --> n41
  n42[("ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n41 -->|"sí"| n42
  n43["Llama a ReservationsRepository.findLinesByReservation"]:::llamada
  n42 --> n43
  n44[("LEE pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n43 --> n44
  n45["Repite: por cada const rl de rlines"]:::bucle
  n44 --> n45
  n46[("ACTUALIZA pharmacy_inventory.inventory_reservation_lines · ACTUALIZA pharmacy_inventory.inventory_reservation…")]:::efecto
  n45 -->|"cada elemento"| n46
  n47(("201 Responde con éxito")):::ok
  n46 --> n47
  n45 -->|"al terminar"| n47
  n41 -->|"no"| n47
  n38 -->|"no"| n47
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /pharmacy/{pharmacyId}/goods-receipts

Recepcionar mercancía por lote (UC-25-02)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden de compra no encontrada; ResourceNotFoundException: Ubicación destino no encontrada; ResourceNotFoundException: Línea de orden no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La orden no admite recepción |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyProcurementService.receiveGoods"]:::llamada
  n2 --> n3
  n4["Llama a PharmacyProcurementUseCases.receiveGoods"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6{"dto.idempotencyKey"}:::decision
  n5 --> n6
  n7["Llama a GoodsReceiptsRepository.findByIdempotencyKey"]:::llamada
  n6 -->|"sí"| n7
  n8[("LEE pharmacy_inventory.pharmacy_goods_receipts")]:::efecto
  n7 --> n8
  n9{"existing"}:::decision
  n8 --> n9
  n10["Llama a GoodsReceiptsRepository.findLines"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE pharmacy_inventory.pharmacy_goods_receipt_lines")]:::efecto
  n10 --> n11
  n12["Llama a LedgerRepository.findEntryIdsBySource"]:::llamada
  n11 --> n12
  n13[("LEE pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n12 --> n13
  n14["Llama a PurchaseOrdersRepository.findById"]:::llamada
  n13 --> n14
  n9 -->|"no"| n14
  n6 -->|"no"| n14
  n15[("LEE pharmacy_inventory.pharmacy_purchase_orders")]:::efecto
  n14 --> n15
  n16{"!order"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Orden de compra no encontrada"]):::error
  n16 -->|"sí"| n17
  n18{"order.statusConceptId !== PINV.PO_ORDERED && order.statusConceptId !== PINV.PO_PARTIAL"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED La orden no admite recepción"]):::error
  n18 -->|"sí"| n19
  n20["Llama a LocationsRepository.findById"]:::llamada
  n18 -->|"no"| n20
  n21[("LEE pharmacy_inventory.inventory_locations")]:::efecto
  n20 --> n21
  n22{"!location"}:::decision
  n21 --> n22
  n23(["404 NOT_FOUND Ubicación destino no encontrada"]):::error
  n22 -->|"sí"| n23
  n24["Llama a GoodsReceiptsRepository.create"]:::llamada
  n22 -->|"no"| n24
  n25[("CREA pharmacy_inventory.pharmacy_goods_receipts")]:::efecto
  n24 --> n25
  n26["Repite: por cada const line de dto.lines"]:::bucle
  n25 --> n26
  n27["Llama a PurchaseOrdersRepository.findLineById"]:::llamada
  n26 -->|"cada elemento"| n27
  n28[("LEE pharmacy_inventory.pharmacy_purchase_order_lines")]:::efecto
  n27 --> n28
  n29{"!poLine"}:::decision
  n28 --> n29
  n30(["404 NOT_FOUND Línea de orden no encontrada"]):::error
  n29 -->|"sí"| n30
  n31["Llama a LotsRepository.findByProductAndNumber"]:::llamada
  n29 -->|"no"| n31
  n32[("LEE pharmacy_inventory.inventory_lots")]:::efecto
  n31 --> n32
  n33{"!lot"}:::decision
  n32 --> n33
  n34["Llama a LotsRepository.create"]:::llamada
  n33 -->|"sí"| n34
  n35[("CREA pharmacy_inventory.inventory_lots")]:::efecto
  n34 --> n35
  n36["Llama a LedgerRepository.nextSequence"]:::llamada
  n35 --> n36
  n33 -->|"no"| n36
  n37[("LEE pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n36 --> n37
  n38["Llama a LedgerRepository.append"]:::llamada
  n37 --> n38
  n39[("CREA pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n38 --> n39
  n40["Llama a StockPositionsRepository.findByKeyForUpdate"]:::llamada
  n39 --> n40
  n41[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n40 --> n41
  n42{"!position"}:::decision
  n41 --> n42
  n43["Llama a StockPositionsRepository.create"]:::llamada
  n42 -->|"sí"| n43
  n44[("CREA pharmacy_inventory.inventory_stock_positions")]:::efecto
  n43 --> n44
  n45[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n42 -->|"no"| n45
  n46["Llama a GoodsReceiptsRepository.createLine"]:::llamada
  n44 --> n46
  n45 --> n46
  n47[("CREA pharmacy_inventory.pharmacy_goods_receipt_lines")]:::efecto
  n46 --> n47
  n48[("ACTUALIZA pharmacy_inventory.pharmacy_purchase_order_lines · ACTUALIZA pharmacy_inventory.pharmacy_purchase_o…")]:::efecto
  n47 --> n48
  n49[("ACTUALIZA pharmacy_inventory.pharmacy_purchase_orders")]:::efecto
  n48 --> n49
  n26 -->|"al terminar"| n49
  n50(("201 Responde con éxito")):::ok
  n49 --> n50
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /pharmacy/{pharmacyId}/purchase-orders

Emitir una orden de compra a proveedor (UC-25-01)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El proveedor no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyProcurementService.createPurchaseOrder"]:::llamada
  n2 --> n3
  n4["Llama a PharmacyProcurementUseCases.createPurchaseOrder"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6{"dto.idempotencyKey"}:::decision
  n5 --> n6
  n7["Llama a PurchaseOrdersRepository.findByIdempotencyKey"]:::llamada
  n6 -->|"sí"| n7
  n8[("LEE pharmacy_inventory.pharmacy_purchase_orders")]:::efecto
  n7 --> n8
  n9{"existing"}:::decision
  n8 --> n9
  n10["Llama a PurchaseOrdersRepository.findLinesByOrder"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE pharmacy_inventory.pharmacy_purchase_order_lines")]:::efecto
  n10 --> n11
  n12["Llama a SuppliersRepository.findById"]:::llamada
  n11 --> n12
  n9 -->|"no"| n12
  n6 -->|"no"| n12
  n13[("LEE pharmacy_inventory.pharmacy_suppliers")]:::efecto
  n12 --> n13
  n14{"!supplier"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Proveedor no encontrado"]):::error
  n14 -->|"sí"| n15
  n16{"supplier.statusConceptId !== PINV.SUPPLIER_ACTIVE"}:::decision
  n14 -->|"no"| n16
  n17(["422 PRECONDITION_FAILED El proveedor no está activo"]):::error
  n16 -->|"sí"| n17
  n18["Llama a PurchaseOrdersRepository.create"]:::llamada
  n16 -->|"no"| n18
  n19[("CREA pharmacy_inventory.pharmacy_purchase_orders")]:::efecto
  n18 --> n19
  n20["Repite: por cada const line de dto.lines"]:::bucle
  n19 --> n20
  n21["Llama a PurchaseOrdersRepository.createLine"]:::llamada
  n20 -->|"cada elemento"| n21
  n22[("CREA pharmacy_inventory.pharmacy_purchase_order_lines")]:::efecto
  n21 --> n22
  n23(("201 Responde con éxito")):::ok
  n22 --> n23
  n20 -->|"al terminar"| n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /pharmacy/{pharmacyId}/reservations

Reservar stock para una prescripción (UC-25-04)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Stock disponible insuficiente para reservar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a InventoryReservationsService.reserve"]:::llamada
  n2 --> n3
  n4["Llama a ReserveInventoryUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a ReservationsRepository.create"]:::llamada
  n5 --> n6
  n7[("CREA pharmacy_inventory.inventory_reservations")]:::efecto
  n6 --> n7
  n8["Repite: por cada const line de dto.lines"]:::bucle
  n7 --> n8
  n9["Llama a StockPositionsRepository.findByKeyForUpdate"]:::llamada
  n8 -->|"cada elemento"| n9
  n10[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n9 --> n10
  n11{"available ‹ line.requestedQuantity"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED Stock disponible insuficiente para reservar"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ReservationsRepository.createLine"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n13 --> n14
  n15["Llama a LedgerRepository.nextSequence"]:::llamada
  n14 --> n15
  n16[("LEE pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n15 --> n16
  n17["Llama a LedgerRepository.append"]:::llamada
  n16 --> n17
  n18[("CREA pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n17 --> n18
  n19(("201 Responde con éxito")):::ok
  n18 --> n19
  n8 -->|"al terminar"| n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /pharmacy/{pharmacyId}/transfers

Transferir stock entre ubicaciones (UC-25-10)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ubicación origen no encontrada; ResourceNotFoundException: Ubicación destino no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Stock disponible insuficiente en origen |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a InventoryTransfersService.transfer"]:::llamada
  n2 --> n3
  n4["Llama a TransferInventoryUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a LocationsRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE pharmacy_inventory.inventory_locations")]:::efecto
  n6 --> n7
  n8{"!from"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Ubicación origen no encontrada"]):::error
  n8 -->|"sí"| n9
  n10["Llama a LocationsRepository.findById"]:::llamada
  n8 -->|"no"| n10
  n11[("LEE pharmacy_inventory.inventory_locations")]:::efecto
  n10 --> n11
  n12{"!to"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Ubicación destino no encontrada"]):::error
  n12 -->|"sí"| n13
  n14["Llama a StockPositionsRepository.findByKeyForUpdate"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n14 --> n15
  n16{"!fromPosition || num(fromPosition.availableQuantity) ‹ dto.quantity"}:::decision
  n15 --> n16
  n17(["422 PRECONDITION_FAILED Stock disponible insuficiente en origen"]):::error
  n16 -->|"sí"| n17
  n18["Llama a LedgerRepository.nextSequence"]:::llamada
  n16 -->|"no"| n18
  n19[("LEE pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n18 --> n19
  n20["Llama a LedgerRepository.append"]:::llamada
  n19 --> n20
  n21[("CREA pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n20 --> n21
  n22["Llama a LedgerRepository.nextSequence"]:::llamada
  n21 --> n22
  n23[("LEE pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n22 --> n23
  n24["Llama a LedgerRepository.append"]:::llamada
  n23 --> n24
  n25[("CREA pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n24 --> n25
  n26[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n25 --> n26
  n27["Llama a StockPositionsRepository.findByKeyForUpdate"]:::llamada
  n26 --> n27
  n28[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n27 --> n28
  n29{"!toPosition"}:::decision
  n28 --> n29
  n30["Llama a StockPositionsRepository.create"]:::llamada
  n29 -->|"sí"| n30
  n31[("CREA pharmacy_inventory.inventory_stock_positions")]:::efecto
  n30 --> n31
  n32[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n29 -->|"no"| n32
  n33(("201 Responde con éxito")):::ok
  n31 --> n33
  n32 --> n33
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. POST /pharmacy/{siteId}/count-sessions

Iniciar y congelar una sesión de conteo (UC-25-06)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ubicación no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una sesión de conteo abierta en la ubicación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a InventoryCountService.openSession"]:::llamada
  n2 --> n3
  n4["Llama a OpenInventoryCountUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a LocationsRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE pharmacy_inventory.inventory_locations")]:::efecto
  n6 --> n7
  n8{"!location"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Ubicación no encontrada"]):::error
  n8 -->|"sí"| n9
  n10["Llama a CountSessionsRepository.countOpenAtLocation"]:::llamada
  n8 -->|"no"| n10
  n11[("LEE pharmacy_inventory.inventory_count_sessions")]:::efecto
  n10 --> n11
  n12{"openCount › 0"}:::decision
  n11 --> n12
  n13(["409 CONFLICT Ya existe una sesión de conteo abierta en la ubicación"]):::error
  n12 -->|"sí"| n13
  n14["Llama a CountSessionsRepository.create"]:::llamada
  n12 -->|"no"| n14
  n15[("CREA pharmacy_inventory.inventory_count_sessions")]:::efecto
  n14 --> n15
  n16["Repite: por cada const item de dto.items"]:::bucle
  n15 --> n16
  n17["Llama a StockPositionsRepository.findByKey"]:::llamada
  n16 -->|"cada elemento"| n17
  n18[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n17 --> n18
  n19["Llama a CountSessionsRepository.createLine"]:::llamada
  n18 --> n19
  n20[("CREA pharmacy_inventory.inventory_count_lines")]:::efecto
  n19 --> n20
  n21(("201 Responde con éxito")):::ok
  n20 --> n21
  n16 -->|"al terminar"| n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /pharmacy/count-sessions/{id}/approve

Aprobar conteo y ajustar ledger por varianza (UC-25-07)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sesión de conteo no encontrada; ResourceNotFoundException: Línea de conteo no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no está en estado aprobable |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a InventoryCountService.approve"]:::llamada
  n2 --> n3
  n4["Llama a ApproveInventoryCountUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a CountSessionsRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE pharmacy_inventory.inventory_count_sessions")]:::efecto
  n6 --> n7
  n8{"!session"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Sesión de conteo no encontrada"]):::error
  n8 -->|"sí"| n9
  n10{"!approvable.includes(session.statusConceptId)"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED La sesión no está en estado aprobable"]):::error
  n10 -->|"sí"| n11
  n12["Repite: por cada const [lineId, counted] de countByLine"]:::bucle
  n10 -->|"no"| n12
  n13["Llama a CountSessionsRepository.findLineById"]:::llamada
  n12 -->|"cada elemento"| n13
  n14[("LEE pharmacy_inventory.inventory_count_lines")]:::efecto
  n13 --> n14
  n15{"!line || line.inventoryCountSessionId !== session.id"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Línea de conteo no encontrada"]):::error
  n15 -->|"sí"| n16
  n17[("ACTUALIZA pharmacy_inventory.inventory_count_lines · ACTUALIZA pharmacy_inventory.inventory_count_lines")]:::efecto
  n15 -->|"no"| n17
  n18{"variance !== 0"}:::decision
  n17 --> n18
  n19[("ACTUALIZA pharmacy_inventory.inventory_count_lines")]:::efecto
  n18 -->|"sí"| n19
  n20["Llama a LedgerRepository.nextSequence"]:::llamada
  n19 --> n20
  n21[("LEE pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n20 --> n21
  n22["Llama a LedgerRepository.append"]:::llamada
  n21 --> n22
  n23[("CREA pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n22 --> n23
  n24["Llama a StockPositionsRepository.findByKeyForUpdate"]:::llamada
  n23 --> n24
  n25[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n24 --> n25
  n26{"position"}:::decision
  n25 --> n26
  n27[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n26 -->|"sí"| n27
  n28[("ACTUALIZA pharmacy_inventory.inventory_count_sessions · ACTUALIZA pharmacy_inventory.inventory_count_sessions…")]:::efecto
  n27 --> n28
  n26 -->|"no"| n28
  n18 -->|"no"| n28
  n12 -->|"al terminar"| n28
  n29(("200 Responde con éxito")):::ok
  n28 --> n29
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /pharmacy/dispensations/{id}/reverse

Reversar una dispensación (UC-25-11)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Dispensación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La dispensación no está en estado reversible |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a MedicationDispensationsService.reverse"]:::llamada
  n2 --> n3
  n4["Llama a ReverseMedicationDispensationUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a DispensationsRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE pharmacy_inventory.medication_dispensations")]:::efecto
  n6 --> n7
  n8{"!dispensation"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Dispensación no encontrada"]):::error
  n8 -->|"sí"| n9
  n10{"dispensation.dispensationStatusConceptId !== PINV.DISPENSE_DISPENSED"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED La dispensación no está en estado reversible"]):::error
  n10 -->|"sí"| n11
  n12[("ACTUALIZA pharmacy_inventory.medication_dispensations")]:::efecto
  n10 -->|"no"| n12
  n13["Llama a DispensationsRepository.findLines"]:::llamada
  n12 --> n13
  n14[("LEE pharmacy_inventory.medication_dispensation_lines")]:::efecto
  n13 --> n14
  n15["Repite: por cada const dl de lines"]:::bucle
  n14 --> n15
  n16["Llama a LedgerRepository.nextSequence"]:::llamada
  n15 -->|"cada elemento"| n16
  n17[("LEE pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n16 --> n17
  n18{"locationId"}:::decision
  n17 --> n18
  n19["Llama a LedgerRepository.append"]:::llamada
  n18 -->|"sí"| n19
  n20[("CREA pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n19 --> n20
  n21["Llama a StockPositionsRepository.findByKeyForUpdate"]:::llamada
  n20 --> n21
  n22[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n21 --> n22
  n23{"position"}:::decision
  n22 --> n23
  n24[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n23 -->|"sí"| n24
  n25(("200 Responde con éxito")):::ok
  n24 --> n25
  n23 -->|"no"| n25
  n18 -->|"no"| n25
  n15 -->|"al terminar"| n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. GET /pharmacy/orders

Bandeja de pedidos de las farmacias del tenant (FAR-E2)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Estado de pedido desconocido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyOrdersService.listForPharmacyTenant"]:::llamada
  n2 --> n3
  n4["Llama a PharmacyOrdersUseCases.listForPharmacyTenant"]:::llamada
  n3 --> n4
  n5["Llama a PharmacyOrdersUseCases.resolveStatusFilter"]:::llamada
  n4 --> n5
  n6{"id === undefined"}:::decision
  n5 --> n6
  n7(["422 PRECONDITION_FAILED Estado de pedido desconocido"]):::error
  n6 -->|"sí"| n7
  n8["Llama a PharmacyOrdersRepository.findPharmaciesByTenant"]:::llamada
  n6 -->|"no"| n8
  n9[("LEE pharmacy.pharmacies")]:::efecto
  n8 --> n9
  n10["Llama a PharmacyOrdersRepository.findOrdersForPharmacies"]:::llamada
  n9 --> n10
  n11[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n10 --> n11
  n12{"dueIds.length › 0"}:::decision
  n11 --> n12
  n13["Llama a PharmacyOrdersUseCases.expireDue"]:::llamada
  n12 -->|"sí"| n13
  n14["Transacción: transactional(…)"]:::transaccion
  n13 --> n14
  n15["Llama a PharmacyOrdersRepository.findDueOrdersForUpdate"]:::llamada
  n14 --> n15
  n16[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n15 --> n16
  n17["Llama a PharmacyOrdersRepository.findPharmaciesByIds"]:::llamada
  n16 --> n17
  n18[("LEE pharmacy.pharmacies")]:::efecto
  n17 --> n18
  n19["Repite: por cada const order de due"]:::bucle
  n18 --> n19
  n20[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n19 -->|"cada elemento"| n20
  n21["Llama a MessagingDomainEventAdapter.publish"]:::llamada
  n20 --> n21
  n22>"Evento ~null"]:::evento
  n21 --> n22
  n23["Repite: por cada const notice de expired"]:::bucle
  n22 --> n23
  n19 -->|"al terminar"| n23
  n24{"notice.medicationRequestId"}:::decision
  n23 -->|"cada elemento"| n24
  n25["Llama a PharmacyOrdersRepository.findPrescriberProfileId"]:::llamada
  n24 -->|"sí"| n25
  n26[("LEE clinical.medication_requests")]:::efecto
  n25 --> n26
  n27["Llama a PharmacyOrdersRepository.findOrdersForPharmacies"]:::llamada
  n26 --> n27
  n24 -->|"no"| n27
  n23 -->|"al terminar"| n27
  n28[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n27 --> n28
  n29["Llama a PharmacyOrdersUseCases.composeOrders"]:::llamada
  n28 --> n29
  n12 -->|"no"| n29
  n30["Llama a PharmacyOrdersRepository.findPrescriberProfileIdsByRequestIds"]:::llamada
  n29 --> n30
  n31[("LEE clinical.medication_requests")]:::efecto
  n30 --> n31
  n32["Llama a PharmacyOrdersRepository.findLinesByReservationIds"]:::llamada
  n31 --> n32
  n33[("LEE pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n32 --> n33
  n34["Llama a PharmacyOrdersRepository.findSitesByIds"]:::llamada
  n33 --> n34
  n35[("LEE pharmacy.pharmacy_sites")]:::efecto
  n34 --> n35
  n36["Llama a PharmacyOrdersRepository.findPharmaciesByIdsInTenant"]:::llamada
  n35 --> n36
  n37[("LEE pharmacy.pharmacies")]:::efecto
  n36 --> n37
  n38["Llama a PharmacyOrdersRepository.findPersonNamesByProfileIds"]:::llamada
  n37 --> n38
  n39[("LEE profiles.persons · LEE profiles.person_profiles · LEE profiles.persons")]:::efecto
  n38 --> n39
  n40["Llama a PharmacyOrdersRepository.findPrimarySpecialtyConceptIds"]:::llamada
  n39 --> n40
  n41[("LEE profiles.practitioner_specialties")]:::efecto
  n40 --> n41
  n42["Llama a PharmacyOrdersRepository.findAddressesByIds"]:::llamada
  n41 --> n42
  n43[("LEE common.addresses")]:::efecto
  n42 --> n43
  n44["Llama a PharmacyOrderSubstitutionsRepository.findByReservationIds"]:::llamada
  n43 --> n44
  n45[("LEE pharmacy_inventory.pharmacy_order_substitutions")]:::efecto
  n44 --> n45
  n46["Llama a PharmacyOrdersRepository.findProductsByIds"]:::llamada
  n45 --> n46
  n47[("LEE pharmacy.pharmacy_products")]:::efecto
  n46 --> n47
  n48["Llama a PharmacyOrdersRepository.findConceptsByIds"]:::llamada
  n47 --> n48
  n49[("LEE terminology.catalog_concepts")]:::efecto
  n48 --> n49
  n50(("200 Responde con éxito")):::ok
  n49 --> n50
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. POST /pharmacy/orders

Crear un pedido de farmacia (FAR-E1)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sede de farmacia no encontrada; ResourceNotFoundException: Receta no encontrada; ResourceNotFoundException: Producto no disponible en la sede |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta autenticada no tiene perfil de paciente; PreconditionFailedException: El pedido repite productos; use una línea por producto; PreconditionFailedException: El envío a domicilio o al trabajo llega con el carril de envío (FAR-E4); hoy solo RETIRO |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyOrdersService.create"]:::llamada
  n2 --> n3
  n4["Llama a PharmacyOrdersUseCases.create"]:::llamada
  n3 --> n4
  n5["Llama a PharmacyOrdersUseCases.requirePatientProfile"]:::llamada
  n4 --> n5
  n6{"!actor.patientProfileId"}:::decision
  n5 --> n6
  n7(["422 PRECONDITION_FAILED La cuenta autenticada no tiene perfil de paciente"]):::error
  n6 -->|"sí"| n7
  n8["Llama a PharmacyOrdersUseCases.assertNoDuplicateProducts"]:::llamada
  n6 -->|"no"| n8
  n9{"repeated.size › 0"}:::decision
  n8 --> n9
  n10(["422 PRECONDITION_FAILED El pedido repite productos; use una línea por producto"]):::error
  n9 -->|"sí"| n10
  n11["Llama a PharmacyOrdersUseCases.resolveDeliveryMode"]:::llamada
  n9 -->|"no"| n11
  n12{"deliveryMode !== 'RETIRO'"}:::decision
  n11 --> n12
  n13(["422 PRECONDITION_FAILED El envío a domicilio o al trabajo llega con el carril de envío (FAR-E4); hoy solo RET…"]):::error
  n12 -->|"sí"| n13
  n14["Transacción: transactional(…)"]:::transaccion
  n12 -->|"no"| n14
  n15{"dto.idempotencyKey"}:::decision
  n14 --> n15
  n16["Llama a PharmacyOrdersRepository.findOrderByIdempotencyKey"]:::llamada
  n15 -->|"sí"| n16
  n17[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n16 --> n17
  n18["Llama a PharmacyDirectoryAdapter.findActiveSiteById"]:::llamada
  n17 --> n18
  n15 -->|"no"| n18
  n19["Llama a PharmacyReadRepository.findActiveSiteById"]:::llamada
  n18 --> n19
  n20[("LEE pharmacy.pharmacy_sites")]:::efecto
  n19 --> n20
  n21["Llama a PharmacyDirectoryAdapter.findVisibleById"]:::llamada
  n20 --> n21
  n22["Llama a PharmacyReadRepository.findVisibleById"]:::llamada
  n21 --> n22
  n23[("LEE pharmacy.pharmacies")]:::efecto
  n22 --> n23
  n24{"!site || !pharmacy"}:::decision
  n23 --> n24
  n25(["404 NOT_FOUND Sede de farmacia no encontrada"]):::error
  n24 -->|"sí"| n25
  n26{"dto.medicationRequestId"}:::decision
  n24 -->|"no"| n26
  n27["Llama a PharmacyOrdersRepository.findOwnMedicationRequest"]:::llamada
  n26 -->|"sí"| n27
  n28[("LEE clinical.medication_requests")]:::efecto
  n27 --> n28
  n29{"!request"}:::decision
  n28 --> n29
  n30(["404 NOT_FOUND Receta no encontrada"]):::error
  n29 -->|"sí"| n30
  n31["Llama a PharmacyDirectoryAdapter.findActiveProductsByIds"]:::llamada
  n29 -->|"no"| n31
  n26 -->|"no"| n31
  n32["Llama a PharmacyReadRepository.findActiveProductsByIds"]:::llamada
  n31 --> n32
  n33[("LEE pharmacy.pharmacy_products")]:::efecto
  n32 --> n33
  n34{"unknown.length › 0"}:::decision
  n33 --> n34
  n35(["404 NOT_FOUND Producto no disponible en la sede"]):::error
  n34 -->|"sí"| n35
  n36["Llama a ReservationsRepository.create"]:::llamada
  n34 -->|"no"| n36
  n37[("CREA pharmacy_inventory.inventory_reservations")]:::efecto
  n36 --> n37
  n38["Llama a PharmacyOrdersUseCases.reserveOrderLines"]:::llamada
  n37 --> n38
  n39["Llama a InventoryReadRepository.findActiveLocationsBySites"]:::llamada
  n38 --> n39
  n40[("LEE pharmacy_inventory.inventory_locations")]:::efecto
  n39 --> n40
  n41["Llama a InventoryReadRepository.findStockPositions"]:::llamada
  n40 --> n41
  n42[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n41 --> n42
  n43["Repite: por cada const line de dto.lines"]:::bucle
  n42 --> n43
  n44["Llama a PharmacyOrdersUseCases.reserveLineStock"]:::llamada
  n43 -->|"cada elemento"| n44
  n45["Repite: por cada const { position, take } de portions"]:::bucle
  n44 --> n45
  n46[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n45 -->|"cada elemento"| n46
  n47["Llama a PharmacyOrdersUseCases.sealFrozenTotal"]:::llamada
  n46 --> n47
  n45 -->|"al terminar"| n47
  n43 -->|"al terminar"| n47
  n48{"!priceable || currencies.size › 1"}:::decision
  n47 --> n48
  n49[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n48 -->|"sí"| n49
  n50[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n49 --> n50
  n48 -->|"no"| n50
  n51["Llama a PharmacyOrdersRepository.findLinesByReservationIds"]:::llamada
  n50 --> n51
  n52[("LEE pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n51 --> n52
  n53["Llama a MessagingDomainEventAdapter.publish"]:::llamada
  n52 --> n53
  n54>"Evento ~null"]:::evento
  n53 --> n54
  n55["Llama a PharmacyOrdersUseCases.readOwnOrder"]:::llamada
  n54 --> n55
  n56["Llama a PharmacyOrdersRepository.findOrderById"]:::llamada
  n55 --> n56
  n57[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n56 --> n57
  n58{"!order || order.patientProfileId !== patientProfileId"}:::decision
  n57 --> n58
  n59(["↩ (relanza el error capturado)"]):::error
  n58 -->|"sí"| n59
  n60{"!dto"}:::decision
  n58 -->|"no"| n60
  n61(["↩ (relanza el error capturado)"]):::error
  n60 -->|"sí"| n61
  n62(("201 Responde con éxito")):::ok
  n60 -->|"no"| n62
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 16. GET /pharmacy/orders/{id}

Consultar un pedido de farmacia (FAR-E1)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyOrdersService.getOrder"]:::llamada
  n2 --> n3
  n4["Llama a PharmacyOrdersUseCases.getOrder"]:::llamada
  n3 --> n4
  n5["Llama a PharmacyOrdersRepository.findOrderById"]:::llamada
  n4 --> n5
  n6[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n5 --> n6
  n7{"!order"}:::decision
  n6 --> n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PharmacyOrdersRepository.findPharmaciesByIdsInTenant"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE pharmacy.pharmacies")]:::efecto
  n9 --> n10
  n11{"!pharmacy"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"!isOwner && !isStaff && !(await this.tenantAdministration.canAdminister( em, pharmacy.tenantId, actor, ))"}:::decision
  n11 -->|"no"| n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15{"this.isDue(order)"}:::decision
  n13 -->|"no"| n15
  n16["Llama a PharmacyOrdersUseCases.expireDue"]:::llamada
  n15 -->|"sí"| n16
  n17["Transacción: transactional(…)"]:::transaccion
  n16 --> n17
  n18["Llama a PharmacyOrdersRepository.findDueOrdersForUpdate"]:::llamada
  n17 --> n18
  n19[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n18 --> n19
  n20["Llama a PharmacyOrdersRepository.findPharmaciesByIds"]:::llamada
  n19 --> n20
  n21[("LEE pharmacy.pharmacies")]:::efecto
  n20 --> n21
  n22["Repite: por cada const order de due"]:::bucle
  n21 --> n22
  n23[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n22 -->|"cada elemento"| n23
  n24["Llama a MessagingDomainEventAdapter.publish"]:::llamada
  n23 --> n24
  n25>"Evento ~null"]:::evento
  n24 --> n25
  n26["Repite: por cada const notice de expired"]:::bucle
  n25 --> n26
  n22 -->|"al terminar"| n26
  n27{"notice.medicationRequestId"}:::decision
  n26 -->|"cada elemento"| n27
  n28["Llama a PharmacyOrdersRepository.findPrescriberProfileId"]:::llamada
  n27 -->|"sí"| n28
  n29[("LEE clinical.medication_requests")]:::efecto
  n28 --> n29
  n30["Llama a PharmacyOrdersRepository.findOrderById"]:::llamada
  n29 --> n30
  n27 -->|"no"| n30
  n26 -->|"al terminar"| n30
  n31[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n30 --> n31
  n32{"!order"}:::decision
  n31 --> n32
  n33(["↩ (relanza el error capturado)"]):::error
  n32 -->|"sí"| n33
  n34["Llama a PharmacyOrdersUseCases.composeOrders"]:::llamada
  n32 -->|"no"| n34
  n15 -->|"no"| n34
  n35["Llama a PharmacyOrdersRepository.findPrescriberProfileIdsByRequestIds"]:::llamada
  n34 --> n35
  n36[("LEE clinical.medication_requests")]:::efecto
  n35 --> n36
  n37["Llama a PharmacyOrdersRepository.findLinesByReservationIds"]:::llamada
  n36 --> n37
  n38[("LEE pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n37 --> n38
  n39["Llama a PharmacyOrdersRepository.findSitesByIds"]:::llamada
  n38 --> n39
  n40[("LEE pharmacy.pharmacy_sites")]:::efecto
  n39 --> n40
  n41["Llama a PharmacyOrdersRepository.findPharmaciesByIdsInTenant"]:::llamada
  n40 --> n41
  n42[("LEE pharmacy.pharmacies")]:::efecto
  n41 --> n42
  n43["Llama a PharmacyOrdersRepository.findPersonNamesByProfileIds"]:::llamada
  n42 --> n43
  n44[("LEE profiles.persons · LEE profiles.person_profiles · LEE profiles.persons")]:::efecto
  n43 --> n44
  n45["Llama a PharmacyOrdersRepository.findPrimarySpecialtyConceptIds"]:::llamada
  n44 --> n45
  n46[("LEE profiles.practitioner_specialties")]:::efecto
  n45 --> n46
  n47["Llama a PharmacyOrdersRepository.findAddressesByIds"]:::llamada
  n46 --> n47
  n48[("LEE common.addresses")]:::efecto
  n47 --> n48
  n49["Llama a PharmacyOrderSubstitutionsRepository.findByReservationIds"]:::llamada
  n48 --> n49
  n50[("LEE pharmacy_inventory.pharmacy_order_substitutions")]:::efecto
  n49 --> n50
  n51["Llama a PharmacyOrdersRepository.findProductsByIds"]:::llamada
  n50 --> n51
  n52[("LEE pharmacy.pharmacy_products")]:::efecto
  n51 --> n52
  n53["Llama a PharmacyOrdersRepository.findConceptsByIds"]:::llamada
  n52 --> n53
  n54[("LEE terminology.catalog_concepts")]:::efecto
  n53 --> n54
  n55{"!dto"}:::decision
  n54 --> n55
  n56(["↩ (relanza el error capturado)"]):::error
  n55 -->|"sí"| n56
  n57(("200 Responde con éxito")):::ok
  n55 -->|"no"| n57
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 17. POST /pharmacy/orders/{id}/accept-substitutions

Aceptar los genéricos propuestos (paciente)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta autenticada no tiene perfil de paciente; PreconditionFailedException: El pedido no tiene una decisión de sustituciones pendiente; PreconditionFailedException: El pedido no tiene propuestas de sustitución en pie |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyOrdersService.acceptSubstitutions"]:::llamada
  n2 --> n3
  n4["Llama a PharmacyOrdersUseCases.acceptSubstitutions"]:::llamada
  n3 --> n4
  n5["Llama a PharmacyOrdersUseCases.requirePatientProfile"]:::llamada
  n4 --> n5
  n6{"!actor.patientProfileId"}:::decision
  n5 --> n6
  n7(["422 PRECONDITION_FAILED La cuenta autenticada no tiene perfil de paciente"]):::error
  n6 -->|"sí"| n7
  n8["Transacción: transactional(…)"]:::transaccion
  n6 -->|"no"| n8
  n9["Llama a PharmacyOrdersUseCases.loadOwnOrderForUpdate"]:::llamada
  n8 --> n9
  n10["Llama a PharmacyOrdersRepository.findOrderByIdForUpdate"]:::llamada
  n9 --> n10
  n11[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n10 --> n11
  n12{"!order || order.patientProfileId !== patientProfileId"}:::decision
  n11 --> n12
  n13(["↩ (relanza el error capturado)"]):::error
  n12 -->|"sí"| n13
  n14["Llama a PharmacyOrdersRepository.findPharmaciesByIdsInTenant"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE pharmacy.pharmacies")]:::efecto
  n14 --> n15
  n16{"!pharmacy"}:::decision
  n15 --> n16
  n17(["↩ (relanza el error capturado)"]):::error
  n16 -->|"sí"| n17
  n18["Llama a PharmacyOrdersUseCases.pendingProposalsOf"]:::llamada
  n16 -->|"no"| n18
  n19{"order.reservationStatusConceptId !== PINV.ORDER_ACEPTACION_PENDIENTE"}:::decision
  n18 --> n19
  n20(["422 PRECONDITION_FAILED El pedido no tiene una decisión de sustituciones pendiente"]):::error
  n19 -->|"sí"| n20
  n21["Llama a PharmacyOrderSubstitutionsRepository.findByReservationIds"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE pharmacy_inventory.pharmacy_order_substitutions")]:::efecto
  n21 --> n22
  n23{"pending.length === 0"}:::decision
  n22 --> n23
  n24(["422 PRECONDITION_FAILED El pedido no tiene propuestas de sustitución en pie"]):::error
  n23 -->|"sí"| n24
  n25["Llama a PharmacyOrdersRepository.findLinesByReservationIds"]:::llamada
  n23 -->|"no"| n25
  n26[("LEE pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n25 --> n26
  n27["Llama a InventoryReadRepository.findActiveLocationsBySites"]:::llamada
  n26 --> n27
  n28[("LEE pharmacy_inventory.inventory_locations")]:::efecto
  n27 --> n28
  n29["Llama a InventoryReadRepository.findStockPositions"]:::llamada
  n28 --> n29
  n30[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n29 --> n30
  n31["Repite: por cada const proposal de pending"]:::bucle
  n30 --> n31
  n32{"confirmed.length › 0"}:::decision
  n31 -->|"cada elemento"| n32
  n33["Llama a InventoryReservationsService.releaseConfirmedLines"]:::llamada
  n32 -->|"sí"| n33
  n34["Llama a ReleaseConfirmedReservationLinesUseCase.execute"]:::llamada
  n33 --> n34
  n35["Repite: por cada const line de lines"]:::bucle
  n34 --> n35
  n36[("ACTUALIZA pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n35 -->|"cada elemento"| n36
  n37{"line.inventoryLocationId"}:::decision
  n36 --> n37
  n38{"position"}:::decision
  n37 -->|"sí"| n38
  n39[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n38 -->|"sí"| n39
  n40["Llama a PharmacyOrdersUseCases.reserveLineStock"]:::llamada
  n39 --> n40
  n38 -->|"no"| n40
  n37 -->|"no"| n40
  n35 -->|"al terminar"| n40
  n32 -->|"no"| n40
  n41["Repite: por cada const candidate de candidates"]:::bucle
  n40 --> n41
  n42["Llama a StockPositionsRepository.findByKeyForUpdate"]:::llamada
  n41 -->|"cada elemento"| n42
  n43[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n42 --> n43
  n44{"remaining › 0"}:::decision
  n43 --> n44
  n41 -->|"al terminar"| n44
  n45["Llama a ReservationsRepository.createLine"]:::llamada
  n44 -->|"sí"| n45
  n46[("CREA pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n45 --> n46
  n47["Repite: por cada const { position, take } de portions"]:::bucle
  n46 --> n47
  n44 -->|"no"| n47
  n48["Llama a ReservationsRepository.createLine"]:::llamada
  n47 -->|"cada elemento"| n48
  n49[("CREA pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n48 --> n49
  n50["Llama a LedgerRepository.nextSequence"]:::llamada
  n49 --> n50
  n51[("LEE pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n50 --> n51
  n52["Llama a LedgerRepository.append"]:::llamada
  n51 --> n52
  n53[("CREA pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n52 --> n53
  n54[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n53 --> n54
  n55[("ACTUALIZA pharmacy_inventory.pharmacy_order_substitutions · ACTUALIZA pharmacy_inventory.pharmacy_order_subst…")]:::efecto
  n54 --> n55
  n47 -->|"al terminar"| n55
  n56[("ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n55 --> n56
  n31 -->|"al terminar"| n56
  n57["Llama a PharmacyOrdersUseCases.sealFrozenTotal"]:::llamada
  n56 --> n57
  n58{"!priceable || currencies.size › 1"}:::decision
  n57 --> n58
  n59[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n58 -->|"sí"| n59
  n60[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n59 --> n60
  n58 -->|"no"| n60
  n61["Llama a PharmacyOrdersRepository.findLinesByReservationIds"]:::llamada
  n60 --> n61
  n62[("LEE pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n61 --> n62
  n63["Llama a PharmacyOrdersUseCases.publishStaffEvent"]:::llamada
  n62 --> n63
  n64["Llama a MessagingDomainEventAdapter.publish"]:::llamada
  n63 --> n64
  n65>"Evento ~null"]:::evento
  n64 --> n65
  n66["Llama a PharmacyOrdersUseCases.tenantOfPharmacy"]:::llamada
  n65 --> n66
  n67["Llama a PharmacyOrdersRepository.findPharmaciesByIdsInTenant"]:::llamada
  n66 --> n67
  n68[("LEE pharmacy.pharmacies")]:::efecto
  n67 --> n68
  n69{"!pharmacy"}:::decision
  n68 --> n69
  n70(["↩ (relanza el error capturado)"]):::error
  n69 -->|"sí"| n70
  n71["… el resto del árbol (7 nodos) está en el JSON del inventario"]:::corte
  n69 -->|"no"| n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 18. POST /pharmacy/orders/{id}/cancel

Cancelar un pedido de farmacia (FAR-E1)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El pedido ya está en un estado terminal y no puede cancelarse |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta autenticada no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyOrdersService.cancel"]:::llamada
  n2 --> n3
  n4["Llama a PharmacyOrdersUseCases.cancel"]:::llamada
  n3 --> n4
  n5["Llama a PharmacyOrdersUseCases.requirePatientProfile"]:::llamada
  n4 --> n5
  n6{"!actor.patientProfileId"}:::decision
  n5 --> n6
  n7(["422 PRECONDITION_FAILED La cuenta autenticada no tiene perfil de paciente"]):::error
  n6 -->|"sí"| n7
  n8["Transacción: transactional(…)"]:::transaccion
  n6 -->|"no"| n8
  n9["Llama a PharmacyOrdersRepository.findOrderByIdForUpdate"]:::llamada
  n8 --> n9
  n10[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n9 --> n10
  n11{"!order || order.patientProfileId !== patientProfileId"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13["Llama a PharmacyOrdersRepository.findPharmaciesByIdsInTenant"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE pharmacy.pharmacies")]:::efecto
  n13 --> n14
  n15{"!pharmacy"}:::decision
  n14 --> n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"sí"| n16
  n17{"ORDER_TERMINAL_STATUS_IDS.includes(order.reservationStatusConceptId)"}:::decision
  n15 -->|"no"| n17
  n18(["409 CONFLICT El pedido ya está en un estado terminal y no puede cancelarse"]):::error
  n17 -->|"sí"| n18
  n19[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n17 -->|"no"| n19
  n20["Llama a InventoryReservationsService.releaseConfirmedLines"]:::llamada
  n19 --> n20
  n21["Llama a ReleaseConfirmedReservationLinesUseCase.execute"]:::llamada
  n20 --> n21
  n22["Repite: por cada const line de lines"]:::bucle
  n21 --> n22
  n23[("ACTUALIZA pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n22 -->|"cada elemento"| n23
  n24{"line.inventoryLocationId"}:::decision
  n23 --> n24
  n25{"position"}:::decision
  n24 -->|"sí"| n25
  n26[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n25 -->|"sí"| n26
  n27["Llama a MessagingDomainEventAdapter.publish"]:::llamada
  n26 --> n27
  n25 -->|"no"| n27
  n24 -->|"no"| n27
  n22 -->|"al terminar"| n27
  n28>"Evento ~null"]:::evento
  n27 --> n28
  n29["Llama a PharmacyOrdersUseCases.readOwnOrder"]:::llamada
  n28 --> n29
  n30["Llama a PharmacyOrdersRepository.findOrderById"]:::llamada
  n29 --> n30
  n31[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n30 --> n31
  n32{"!order || order.patientProfileId !== patientProfileId"}:::decision
  n31 --> n32
  n33(["↩ (relanza el error capturado)"]):::error
  n32 -->|"sí"| n33
  n34{"!dto"}:::decision
  n32 -->|"no"| n34
  n35(["↩ (relanza el error capturado)"]):::error
  n34 -->|"sí"| n35
  n36(("200 Responde con éxito")):::ok
  n34 -->|"no"| n36
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 19. POST /pharmacy/orders/{id}/confirm

Confirmar el pedido (FAR-E2)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay más de un ajuste para el mismo renglón; PreconditionFailedException: La transición no es legal para el estado actual del pedido; PreconditionFailedException: El ajuste refiere un producto que no está en el pedido; PreconditionFailedException: PROPONER_GENERICO exige el producto propuesto (proposedProductId); PreconditionFailedException: El producto propuesto no está disponible en esta farmacia; PreconditionFailedException: El producto propuesto no es del mismo medicamento que el original |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyOrdersService.confirm"]:::llamada
  n2 --> n3
  n4["Llama a PharmacyOrdersUseCases.confirm"]:::llamada
  n3 --> n4
  n5["Llama a PharmacyOrdersUseCases.assertOneAdjustmentPerProduct"]:::llamada
  n4 --> n5
  n6{"repeated.size › 0"}:::decision
  n5 --> n6
  n7(["422 PRECONDITION_FAILED Hay más de un ajuste para el mismo renglón"]):::error
  n6 -->|"sí"| n7
  n8["Transacción: transactional(…)"]:::transaccion
  n6 -->|"no"| n8
  n9["Llama a PharmacyOrdersUseCases.loadTenantOrderForUpdate"]:::llamada
  n8 --> n9
  n10["Llama a PharmacyOrdersRepository.findOrderByIdForUpdate"]:::llamada
  n9 --> n10
  n11[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n10 --> n11
  n12{"!order"}:::decision
  n11 --> n12
  n13(["↩ (relanza el error capturado)"]):::error
  n12 -->|"sí"| n13
  n14["Llama a PharmacyOrdersRepository.findPharmaciesByIdsInTenant"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE pharmacy.pharmacies")]:::efecto
  n14 --> n15
  n16{"!pharmacy"}:::decision
  n15 --> n16
  n17(["↩ (relanza el error capturado)"]):::error
  n16 -->|"sí"| n17
  n18["Llama a PharmacyOrdersUseCases.assertStaffTransition"]:::llamada
  n16 -->|"no"| n18
  n19{"!allowed?.has(toStatusId)"}:::decision
  n18 --> n19
  n20(["422 PRECONDITION_FAILED La transición no es legal para el estado actual del pedido"]):::error
  n19 -->|"sí"| n20
  n21["Llama a PharmacyOrdersRepository.findLinesByReservationIds"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n21 --> n22
  n23["Repite: por cada const adjustment de adjustments"]:::bucle
  n22 --> n23
  n24{"!portions"}:::decision
  n23 -->|"cada elemento"| n24
  n25(["422 PRECONDITION_FAILED El ajuste refiere un producto que no está en el pedido"]):::error
  n24 -->|"sí"| n25
  n26{"confirmed.length › 0"}:::decision
  n24 -->|"no"| n26
  n27["Llama a InventoryReservationsService.releaseConfirmedLines"]:::llamada
  n26 -->|"sí"| n27
  n28["Llama a ReleaseConfirmedReservationLinesUseCase.execute"]:::llamada
  n27 --> n28
  n29["Repite: por cada const line de lines"]:::bucle
  n28 --> n29
  n30[("ACTUALIZA pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n29 -->|"cada elemento"| n30
  n31{"line.inventoryLocationId"}:::decision
  n30 --> n31
  n32{"position"}:::decision
  n31 -->|"sí"| n32
  n33[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n32 -->|"sí"| n33
  n34{"proposals.length › 0"}:::decision
  n33 --> n34
  n32 -->|"no"| n34
  n31 -->|"no"| n34
  n29 -->|"al terminar"| n34
  n26 -->|"no"| n34
  n23 -->|"al terminar"| n34
  n35["Llama a PharmacyOrdersUseCases.persistProposals"]:::llamada
  n34 -->|"sí"| n35
  n36{"withoutProposed.length › 0"}:::decision
  n35 --> n36
  n37(["422 PRECONDITION_FAILED PROPONER_GENERICO exige el producto propuesto (proposedProductId)"]):::error
  n36 -->|"sí"| n37
  n38["Llama a PharmacyOrdersRepository.findProductsByIds"]:::llamada
  n36 -->|"no"| n38
  n39[("LEE pharmacy.pharmacy_products")]:::efecto
  n38 --> n39
  n40["Repite: por cada const proposal de proposals"]:::bucle
  n39 --> n40
  n41{"!proposed || proposed.pharmacyId !== order.pharmacyId || proposedId === proposal.productId"}:::decision
  n40 -->|"cada elemento"| n41
  n42(["422 PRECONDITION_FAILED El producto propuesto no está disponible en esta farmacia"]):::error
  n41 -->|"sí"| n42
  n43{"!original?.medicationConceptId || original.medicationConceptId !== proposed.medicationConceptId"}:::decision
  n41 -->|"no"| n43
  n44(["422 PRECONDITION_FAILED El producto propuesto no es del mismo medicamento que el original"]):::error
  n43 -->|"sí"| n44
  n45{"!portions || portions.length === 0"}:::decision
  n43 -->|"no"| n45
  n46(["422 PRECONDITION_FAILED El ajuste refiere un producto que no está en el pedido"]):::error
  n45 -->|"sí"| n46
  n47["Llama a PharmacyOrderSubstitutionsRepository.create"]:::llamada
  n45 -->|"no"| n47
  n48[("CREA pharmacy_inventory.pharmacy_order_substitutions")]:::efecto
  n47 --> n48
  n49[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n48 --> n49
  n40 -->|"al terminar"| n49
  n34 -->|"no"| n49
  n50["Llama a PharmacyOrdersUseCases.sealFrozenTotal"]:::llamada
  n49 --> n50
  n51{"!priceable || currencies.size › 1"}:::decision
  n50 --> n51
  n52[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n51 -->|"sí"| n52
  n53[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n52 --> n53
  n51 -->|"no"| n53
  n54["Llama a PharmacyOrdersUseCases.publishStaffEvent"]:::llamada
  n53 --> n54
  n55["Llama a MessagingDomainEventAdapter.publish"]:::llamada
  n54 --> n55
  n56>"Evento ~null"]:::evento
  n55 --> n56
  n57["Llama a PharmacyOrdersUseCases.readOrderForTenant"]:::llamada
  n56 --> n57
  n58["Llama a PharmacyOrdersRepository.findOrderById"]:::llamada
  n57 --> n58
  n59[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n58 --> n59
  n60{"!order"}:::decision
  n59 --> n60
  n61(["↩ (relanza el error capturado)"]):::error
  n60 -->|"sí"| n61
  n62{"!dto"}:::decision
  n60 -->|"no"| n62
  n63(["↩ (relanza el error capturado)"]):::error
  n62 -->|"sí"| n63
  n64(("200 Responde con éxito")):::ok
  n62 -->|"no"| n64
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 20. POST /pharmacy/orders/{id}/dispense

Dispensar el pedido en el mostrador (FAR-E3)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La clave de idempotencia ya se usó para otra entrega |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo un pedido listo para retiro puede dispensarse; PreconditionFailedException: El código de retiro no coincide. El pedido no se modificó.; PreconditionFailedException: La entrega refiere productos sin saldo en pie en este pedido; PreconditionFailedException: El pedido no tiene saldo en pie que entregar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyOrdersService.dispense"]:::llamada
  n2 --> n3
  n4["Llama a PharmacyOrdersUseCases.dispense"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a PharmacyOrdersUseCases.loadTenantOrderForUpdate"]:::llamada
  n5 --> n6
  n7["Llama a PharmacyOrdersRepository.findOrderByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n7 --> n8
  n9{"!order"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11["Llama a PharmacyOrdersRepository.findPharmaciesByIdsInTenant"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE pharmacy.pharmacies")]:::efecto
  n11 --> n12
  n13{"!pharmacy"}:::decision
  n12 --> n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15{"dto.idempotencyKey"}:::decision
  n13 -->|"no"| n15
  n16["Llama a DispensationsRepository.findByIdempotencyKey"]:::llamada
  n15 -->|"sí"| n16
  n17[("LEE pharmacy_inventory.medication_dispensations")]:::efecto
  n16 --> n17
  n18{"existing"}:::decision
  n17 --> n18
  n19(["409 CONFLICT La clave de idempotencia ya se usó para otra entrega"]):::error
  n18 -->|"sí"| n19
  n20{"order.reservationStatusConceptId !== PINV.ORDER_LISTO_PARA_RETIRO"}:::decision
  n18 -->|"no"| n20
  n15 -->|"no"| n20
  n21(["422 PRECONDITION_FAILED Solo un pedido listo para retiro puede dispensarse"]):::error
  n20 -->|"sí"| n21
  n22{"!order.pickupCode || presented !== order.pickupCode"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED El código de retiro no coincide. El pedido no se modificó."]):::error
  n22 -->|"sí"| n23
  n24["Llama a PharmacyOrdersRepository.findLinesByReservationIds"]:::llamada
  n22 -->|"no"| n24
  n25[("LEE pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n24 --> n25
  n26{"dto.productIds !== undefined"}:::decision
  n25 --> n26
  n27{"notPending.length › 0"}:::decision
  n26 -->|"sí"| n27
  n28(["422 PRECONDITION_FAILED La entrega refiere productos sin saldo en pie en este pedido"]):::error
  n27 -->|"sí"| n28
  n29{"targets.length === 0"}:::decision
  n27 -->|"no"| n29
  n26 -->|"no"| n29
  n30(["422 PRECONDITION_FAILED El pedido no tiene saldo en pie que entregar"]):::error
  n29 -->|"sí"| n30
  n31["Llama a DispensationsRepository.create"]:::llamada
  n29 -->|"no"| n31
  n32[("CREA pharmacy_inventory.medication_dispensations")]:::efecto
  n31 --> n32
  n33["Repite: por cada const line de targets"]:::bucle
  n32 --> n33
  n34["Llama a DispensationsRepository.createLine"]:::llamada
  n33 -->|"cada elemento"| n34
  n35[("CREA pharmacy_inventory.medication_dispensation_lines")]:::efecto
  n34 --> n35
  n36{"line.inventoryLocationId"}:::decision
  n35 --> n36
  n37["Llama a LedgerRepository.nextSequence"]:::llamada
  n36 -->|"sí"| n37
  n38[("LEE pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n37 --> n38
  n39["Llama a LedgerRepository.append"]:::llamada
  n38 --> n39
  n40[("CREA pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n39 --> n40
  n41["Llama a StockPositionsRepository.findByKeyForUpdate"]:::llamada
  n40 --> n41
  n42[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n41 --> n42
  n43{"position"}:::decision
  n42 --> n43
  n44[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n43 -->|"sí"| n44
  n45{"complete"}:::decision
  n44 --> n45
  n43 -->|"no"| n45
  n36 -->|"no"| n45
  n33 -->|"al terminar"| n45
  n46[("ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n45 -->|"sí"| n46
  n47["Llama a PharmacyOrdersUseCases.publishStaffEvent"]:::llamada
  n46 --> n47
  n45 -->|"no"| n47
  n48["Llama a MessagingDomainEventAdapter.publish"]:::llamada
  n47 --> n48
  n49>"Evento ~null"]:::evento
  n48 --> n49
  n50{"outcome?.complete && outcome.medicationRequestId"}:::decision
  n49 --> n50
  n51["Llama a PharmacyOrdersRepository.findPrescriberProfileId"]:::llamada
  n50 -->|"sí"| n51
  n52[("LEE clinical.medication_requests")]:::efecto
  n51 --> n52
  n53["Llama a PharmacyOrdersUseCases.readOrderForTenant"]:::llamada
  n52 --> n53
  n50 -->|"no"| n53
  n54["Llama a PharmacyOrdersRepository.findOrderById"]:::llamada
  n53 --> n54
  n55[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n54 --> n55
  n56{"!order"}:::decision
  n55 --> n56
  n57(["↩ (relanza el error capturado)"]):::error
  n56 -->|"sí"| n57
  n58{"!dto"}:::decision
  n56 -->|"no"| n58
  n59(["↩ (relanza el error capturado)"]):::error
  n58 -->|"sí"| n59
  n60(("200 Responde con éxito")):::ok
  n58 -->|"no"| n60
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 21. POST /pharmacy/orders/{id}/prefer-original

Preferir los productos originales (paciente)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta autenticada no tiene perfil de paciente; PreconditionFailedException: El pedido no tiene una decisión de sustituciones pendiente; PreconditionFailedException: El pedido no tiene propuestas de sustitución en pie |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyOrdersService.preferOriginal"]:::llamada
  n2 --> n3
  n4["Llama a PharmacyOrdersUseCases.preferOriginal"]:::llamada
  n3 --> n4
  n5["Llama a PharmacyOrdersUseCases.requirePatientProfile"]:::llamada
  n4 --> n5
  n6{"!actor.patientProfileId"}:::decision
  n5 --> n6
  n7(["422 PRECONDITION_FAILED La cuenta autenticada no tiene perfil de paciente"]):::error
  n6 -->|"sí"| n7
  n8["Transacción: transactional(…)"]:::transaccion
  n6 -->|"no"| n8
  n9["Llama a PharmacyOrdersUseCases.loadOwnOrderForUpdate"]:::llamada
  n8 --> n9
  n10["Llama a PharmacyOrdersRepository.findOrderByIdForUpdate"]:::llamada
  n9 --> n10
  n11[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n10 --> n11
  n12{"!order || order.patientProfileId !== patientProfileId"}:::decision
  n11 --> n12
  n13(["↩ (relanza el error capturado)"]):::error
  n12 -->|"sí"| n13
  n14["Llama a PharmacyOrdersRepository.findPharmaciesByIdsInTenant"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE pharmacy.pharmacies")]:::efecto
  n14 --> n15
  n16{"!pharmacy"}:::decision
  n15 --> n16
  n17(["↩ (relanza el error capturado)"]):::error
  n16 -->|"sí"| n17
  n18["Llama a PharmacyOrdersUseCases.pendingProposalsOf"]:::llamada
  n16 -->|"no"| n18
  n19{"order.reservationStatusConceptId !== PINV.ORDER_ACEPTACION_PENDIENTE"}:::decision
  n18 --> n19
  n20(["422 PRECONDITION_FAILED El pedido no tiene una decisión de sustituciones pendiente"]):::error
  n19 -->|"sí"| n20
  n21["Llama a PharmacyOrderSubstitutionsRepository.findByReservationIds"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE pharmacy_inventory.pharmacy_order_substitutions")]:::efecto
  n21 --> n22
  n23{"pending.length === 0"}:::decision
  n22 --> n23
  n24(["422 PRECONDITION_FAILED El pedido no tiene propuestas de sustitución en pie"]):::error
  n23 -->|"sí"| n24
  n25["Repite: por cada const proposal de pending"]:::bucle
  n23 -->|"no"| n25
  n26[("ACTUALIZA pharmacy_inventory.pharmacy_order_substitutions · ACTUALIZA pharmacy_inventory.pharmacy_order_subst…")]:::efecto
  n25 -->|"cada elemento"| n26
  n27[("ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n26 --> n27
  n25 -->|"al terminar"| n27
  n28["Llama a PharmacyOrdersUseCases.publishStaffEvent"]:::llamada
  n27 --> n28
  n29["Llama a MessagingDomainEventAdapter.publish"]:::llamada
  n28 --> n29
  n30>"Evento ~null"]:::evento
  n29 --> n30
  n31["Llama a PharmacyOrdersUseCases.tenantOfPharmacy"]:::llamada
  n30 --> n31
  n32["Llama a PharmacyOrdersRepository.findPharmaciesByIdsInTenant"]:::llamada
  n31 --> n32
  n33[("LEE pharmacy.pharmacies")]:::efecto
  n32 --> n33
  n34{"!pharmacy"}:::decision
  n33 --> n34
  n35(["↩ (relanza el error capturado)"]):::error
  n34 -->|"sí"| n35
  n36["Llama a PharmacyOrdersUseCases.readOwnOrder"]:::llamada
  n34 -->|"no"| n36
  n37["Llama a PharmacyOrdersRepository.findOrderById"]:::llamada
  n36 --> n37
  n38[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n37 --> n38
  n39{"!order || order.patientProfileId !== patientProfileId"}:::decision
  n38 --> n39
  n40(["↩ (relanza el error capturado)"]):::error
  n39 -->|"sí"| n40
  n41{"!dto"}:::decision
  n39 -->|"no"| n41
  n42(["↩ (relanza el error capturado)"]):::error
  n41 -->|"sí"| n42
  n43(("200 Responde con éxito")):::ok
  n41 -->|"no"| n43
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 22. POST /pharmacy/orders/{id}/ready

Marcar el pedido listo para retiro (FAR-E2/E3)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: No se pudo sellar un código de retiro único; reintente la operación |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La transición no es legal para el estado actual del pedido; PreconditionFailedException: El pedido no declara modalidad de entrega: no puede demostrarse que sea un retiro; PreconditionFailedException: El pedido es de envío: se cierra por el carril de envío, no por el mostrador; PreconditionFailedException: La sede no ofrece retiro en mostrador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyOrdersService.ready"]:::llamada
  n2 --> n3
  n4["Llama a PharmacyOrdersUseCases.ready"]:::llamada
  n3 --> n4
  n5["Repite: ciclo for"]:::bucle
  n4 --> n5
  n6["Intenta"]:::intento
  n5 -->|"cada elemento"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n6 --> n7
  n8["Llama a PharmacyOrdersUseCases.loadTenantOrderForUpdate"]:::llamada
  n7 --> n8
  n9["Llama a PharmacyOrdersRepository.findOrderByIdForUpdate"]:::llamada
  n8 --> n9
  n10[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n9 --> n10
  n11{"!order"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13["Llama a PharmacyOrdersRepository.findPharmaciesByIdsInTenant"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE pharmacy.pharmacies")]:::efecto
  n13 --> n14
  n15{"!pharmacy"}:::decision
  n14 --> n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PharmacyOrdersUseCases.assertStaffTransition"]:::llamada
  n15 -->|"no"| n17
  n18{"!allowed?.has(toStatusId)"}:::decision
  n17 --> n18
  n19(["422 PRECONDITION_FAILED La transición no es legal para el estado actual del pedido"]):::error
  n18 -->|"sí"| n19
  n20["Llama a PharmacyOrdersUseCases.assertPickupOrder"]:::llamada
  n18 -->|"no"| n20
  n21{"!order.deliveryModeConceptId"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED El pedido no declara modalidad de entrega: no puede demostrarse que sea un retiro"]):::error
  n21 -->|"sí"| n22
  n23{"order.deliveryModeConceptId !== PINV.DELIVERY_RETIRO"}:::decision
  n21 -->|"no"| n23
  n24(["422 PRECONDITION_FAILED El pedido es de envío: se cierra por el carril de envío, no por el mostrador"]):::error
  n23 -->|"sí"| n24
  n25["Llama a PharmacyOrdersRepository.findSitesByIds"]:::llamada
  n23 -->|"no"| n25
  n26[("LEE pharmacy.pharmacy_sites")]:::efecto
  n25 --> n26
  n27{"site?.pickupAvailable !== true"}:::decision
  n26 --> n27
  n28(["422 PRECONDITION_FAILED La sede no ofrece retiro en mostrador"]):::error
  n27 -->|"sí"| n28
  n29[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations · A…")]:::efecto
  n27 -->|"no"| n29
  n30["Llama a PharmacyOrdersUseCases.publishStaffEvent"]:::llamada
  n29 --> n30
  n31["Llama a MessagingDomainEventAdapter.publish"]:::llamada
  n30 --> n31
  n32>"Evento ~null"]:::evento
  n31 --> n32
  n33["Llama a PharmacyOrdersUseCases.readOrderForTenant"]:::llamada
  n32 --> n33
  n34["Llama a PharmacyOrdersRepository.findOrderById"]:::llamada
  n33 --> n34
  n35[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n34 --> n35
  n36{"!order"}:::decision
  n35 --> n36
  n37(["↩ (relanza el error capturado)"]):::error
  n36 -->|"sí"| n37
  n38{"!dto"}:::decision
  n36 -->|"no"| n38
  n39(["↩ (relanza el error capturado)"]):::error
  n38 -->|"sí"| n39
  n40{"!isPickupCodeCollision(error)"}:::decision
  n6 -->|"si falla"| n40
  n41(["↩ (relanza el error capturado)"]):::error
  n40 -->|"sí"| n41
  n42(["409 CONFLICT No se pudo sellar un código de retiro único; reintente la operación"]):::error
  n38 -->|"no"| n42
  n40 -->|"no"| n42
  n5 -->|"al terminar"| n42
  n43(("200 Responde con éxito")):::ok
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 23. POST /pharmacy/orders/{id}/reject

Rechazar el pedido (FAR-E2)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El rechazo exige un motivo en palabras; PreconditionFailedException: La transición no es legal para el estado actual del pedido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyOrdersService.reject"]:::llamada
  n2 --> n3
  n4["Llama a PharmacyOrdersUseCases.reject"]:::llamada
  n3 --> n4
  n5{"reason === ''"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED El rechazo exige un motivo en palabras"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a PharmacyOrdersUseCases.loadTenantOrderForUpdate"]:::llamada
  n7 --> n8
  n9["Llama a PharmacyOrdersRepository.findOrderByIdForUpdate"]:::llamada
  n8 --> n9
  n10[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n9 --> n10
  n11{"!order"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13["Llama a PharmacyOrdersRepository.findPharmaciesByIdsInTenant"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE pharmacy.pharmacies")]:::efecto
  n13 --> n14
  n15{"!pharmacy"}:::decision
  n14 --> n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PharmacyOrdersUseCases.assertStaffTransition"]:::llamada
  n15 -->|"no"| n17
  n18{"!allowed?.has(toStatusId)"}:::decision
  n17 --> n18
  n19(["422 PRECONDITION_FAILED La transición no es legal para el estado actual del pedido"]):::error
  n18 -->|"sí"| n19
  n20[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations · A…")]:::efecto
  n18 -->|"no"| n20
  n21["Llama a InventoryReservationsService.releaseConfirmedLines"]:::llamada
  n20 --> n21
  n22["Llama a ReleaseConfirmedReservationLinesUseCase.execute"]:::llamada
  n21 --> n22
  n23["Repite: por cada const line de lines"]:::bucle
  n22 --> n23
  n24[("ACTUALIZA pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n23 -->|"cada elemento"| n24
  n25{"line.inventoryLocationId"}:::decision
  n24 --> n25
  n26{"position"}:::decision
  n25 -->|"sí"| n26
  n27[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n26 -->|"sí"| n27
  n28["Llama a PharmacyOrdersUseCases.publishStaffEvent"]:::llamada
  n27 --> n28
  n26 -->|"no"| n28
  n25 -->|"no"| n28
  n23 -->|"al terminar"| n28
  n29["Llama a MessagingDomainEventAdapter.publish"]:::llamada
  n28 --> n29
  n30>"Evento ~null"]:::evento
  n29 --> n30
  n31["Llama a PharmacyOrdersUseCases.readOrderForTenant"]:::llamada
  n30 --> n31
  n32["Llama a PharmacyOrdersRepository.findOrderById"]:::llamada
  n31 --> n32
  n33[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n32 --> n33
  n34{"!order"}:::decision
  n33 --> n34
  n35(["↩ (relanza el error capturado)"]):::error
  n34 -->|"sí"| n35
  n36{"!dto"}:::decision
  n34 -->|"no"| n36
  n37(["↩ (relanza el error capturado)"]):::error
  n36 -->|"sí"| n37
  n38(("200 Responde con éxito")):::ok
  n36 -->|"no"| n38
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 24. POST /pharmacy/orders/{id}/review

Abrir revisión del pedido (FAR-E2)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La transición no es legal para el estado actual del pedido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyOrdersService.openReview"]:::llamada
  n2 --> n3
  n4["Llama a PharmacyOrdersUseCases.openReview"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a PharmacyOrdersUseCases.loadTenantOrderForUpdate"]:::llamada
  n5 --> n6
  n7["Llama a PharmacyOrdersRepository.findOrderByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n7 --> n8
  n9{"!order"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11["Llama a PharmacyOrdersRepository.findPharmaciesByIdsInTenant"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE pharmacy.pharmacies")]:::efecto
  n11 --> n12
  n13{"!pharmacy"}:::decision
  n12 --> n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15["Llama a PharmacyOrdersUseCases.assertStaffTransition"]:::llamada
  n13 -->|"no"| n15
  n16{"!allowed?.has(toStatusId)"}:::decision
  n15 --> n16
  n17(["422 PRECONDITION_FAILED La transición no es legal para el estado actual del pedido"]):::error
  n16 -->|"sí"| n17
  n18[("ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n16 -->|"no"| n18
  n19["Llama a PharmacyOrdersUseCases.publishStaffEvent"]:::llamada
  n18 --> n19
  n20["Llama a MessagingDomainEventAdapter.publish"]:::llamada
  n19 --> n20
  n21>"Evento ~null"]:::evento
  n20 --> n21
  n22["Llama a PharmacyOrdersUseCases.readOrderForTenant"]:::llamada
  n21 --> n22
  n23["Llama a PharmacyOrdersRepository.findOrderById"]:::llamada
  n22 --> n23
  n24[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n23 --> n24
  n25{"!order"}:::decision
  n24 --> n25
  n26(["↩ (relanza el error capturado)"]):::error
  n25 -->|"sí"| n26
  n27{"!dto"}:::decision
  n25 -->|"no"| n27
  n28(["↩ (relanza el error capturado)"]):::error
  n27 -->|"sí"| n28
  n29(("200 Responde con éxito")):::ok
  n27 -->|"no"| n29
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 25. GET /pharmacy/orders/me

Mis pedidos de farmacia, más nuevos primero (FAR-E1)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta autenticada no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PharmacyOrdersService.listMine"]:::llamada
  n2 --> n3
  n4["Llama a PharmacyOrdersUseCases.listMine"]:::llamada
  n3 --> n4
  n5["Llama a PharmacyOrdersUseCases.requirePatientProfile"]:::llamada
  n4 --> n5
  n6{"!actor.patientProfileId"}:::decision
  n5 --> n6
  n7(["422 PRECONDITION_FAILED La cuenta autenticada no tiene perfil de paciente"]):::error
  n6 -->|"sí"| n7
  n8["Llama a PharmacyOrdersRepository.findOrdersByPatient"]:::llamada
  n6 -->|"no"| n8
  n9[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n8 --> n9
  n10{"dueIds.length › 0"}:::decision
  n9 --> n10
  n11["Llama a PharmacyOrdersUseCases.expireDue"]:::llamada
  n10 -->|"sí"| n11
  n12["Transacción: transactional(…)"]:::transaccion
  n11 --> n12
  n13["Llama a PharmacyOrdersRepository.findDueOrdersForUpdate"]:::llamada
  n12 --> n13
  n14[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n13 --> n14
  n15["Llama a PharmacyOrdersRepository.findPharmaciesByIds"]:::llamada
  n14 --> n15
  n16[("LEE pharmacy.pharmacies")]:::efecto
  n15 --> n16
  n17["Repite: por cada const order de due"]:::bucle
  n16 --> n17
  n18[("ACTUALIZA pharmacy_inventory.inventory_reservations · ACTUALIZA pharmacy_inventory.inventory_reservations")]:::efecto
  n17 -->|"cada elemento"| n18
  n19["Llama a MessagingDomainEventAdapter.publish"]:::llamada
  n18 --> n19
  n20>"Evento ~null"]:::evento
  n19 --> n20
  n21["Repite: por cada const notice de expired"]:::bucle
  n20 --> n21
  n17 -->|"al terminar"| n21
  n22{"notice.medicationRequestId"}:::decision
  n21 -->|"cada elemento"| n22
  n23["Llama a PharmacyOrdersRepository.findPrescriberProfileId"]:::llamada
  n22 -->|"sí"| n23
  n24[("LEE clinical.medication_requests")]:::efecto
  n23 --> n24
  n25["Llama a PharmacyOrdersRepository.findOrdersByPatient"]:::llamada
  n24 --> n25
  n22 -->|"no"| n25
  n21 -->|"al terminar"| n25
  n26[("LEE pharmacy_inventory.inventory_reservations")]:::efecto
  n25 --> n26
  n27["Llama a PharmacyOrdersUseCases.composeOrders"]:::llamada
  n26 --> n27
  n10 -->|"no"| n27
  n28["Llama a PharmacyOrdersRepository.findPrescriberProfileIdsByRequestIds"]:::llamada
  n27 --> n28
  n29[("LEE clinical.medication_requests")]:::efecto
  n28 --> n29
  n30["Llama a PharmacyOrdersRepository.findLinesByReservationIds"]:::llamada
  n29 --> n30
  n31[("LEE pharmacy_inventory.inventory_reservation_lines")]:::efecto
  n30 --> n31
  n32["Llama a PharmacyOrdersRepository.findSitesByIds"]:::llamada
  n31 --> n32
  n33[("LEE pharmacy.pharmacy_sites")]:::efecto
  n32 --> n33
  n34["Llama a PharmacyOrdersRepository.findPharmaciesByIdsInTenant"]:::llamada
  n33 --> n34
  n35[("LEE pharmacy.pharmacies")]:::efecto
  n34 --> n35
  n36["Llama a PharmacyOrdersRepository.findPersonNamesByProfileIds"]:::llamada
  n35 --> n36
  n37[("LEE profiles.persons · LEE profiles.person_profiles · LEE profiles.persons")]:::efecto
  n36 --> n37
  n38["Llama a PharmacyOrdersRepository.findPrimarySpecialtyConceptIds"]:::llamada
  n37 --> n38
  n39[("LEE profiles.practitioner_specialties")]:::efecto
  n38 --> n39
  n40["Llama a PharmacyOrdersRepository.findAddressesByIds"]:::llamada
  n39 --> n40
  n41[("LEE common.addresses")]:::efecto
  n40 --> n41
  n42["Llama a PharmacyOrderSubstitutionsRepository.findByReservationIds"]:::llamada
  n41 --> n42
  n43[("LEE pharmacy_inventory.pharmacy_order_substitutions")]:::efecto
  n42 --> n43
  n44["Llama a PharmacyOrdersRepository.findProductsByIds"]:::llamada
  n43 --> n44
  n45[("LEE pharmacy.pharmacy_products")]:::efecto
  n44 --> n45
  n46["Llama a PharmacyOrdersRepository.findConceptsByIds"]:::llamada
  n45 --> n46
  n47[("LEE terminology.catalog_concepts")]:::efecto
  n46 --> n47
  n48(("200 Responde con éxito")):::ok
  n47 --> n48
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 26. POST /pharmacy/recall-holds

Aplicar retiro/recall de lote (UC-25-08)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Lote no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a InventoryRecallService.createHold"]:::llamada
  n2 --> n3
  n4["Llama a CreateRecallHoldUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a LotsRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE pharmacy_inventory.inventory_lots")]:::efecto
  n6 --> n7
  n8{"!lot"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Lote no encontrado"]):::error
  n8 -->|"sí"| n9
  n10["Llama a RecallHoldsRepository.create"]:::llamada
  n8 -->|"no"| n10
  n11[("CREA pharmacy_inventory.inventory_recall_holds")]:::efecto
  n10 --> n11
  n12[("ACTUALIZA pharmacy_inventory.inventory_lots · ACTUALIZA pharmacy_inventory.inventory_lots")]:::efecto
  n11 --> n12
  n13["Llama a StockPositionsRepository.findByKey"]:::llamada
  n12 --> n13
  n14[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n13 --> n14
  n15["Llama a LedgerRepository.nextSequence"]:::llamada
  n14 --> n15
  n16[("LEE pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n15 --> n16
  n17["Llama a LedgerRepository.append"]:::llamada
  n16 --> n17
  n18[("CREA pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n17 --> n18
  n19{"position"}:::decision
  n18 --> n19
  n20[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n19 -->|"sí"| n20
  n21(("201 Responde con éxito")):::ok
  n20 --> n21
  n19 -->|"no"| n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 27. POST /pharmacy/recall-holds/{id}/release

Liberar recall y reactivar lote (UC-25-09)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Hold de recall no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El hold no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a InventoryRecallService.release"]:::llamada
  n2 --> n3
  n4["Llama a ReleaseRecallHoldUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a RecallHoldsRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE pharmacy_inventory.inventory_recall_holds")]:::efecto
  n6 --> n7
  n8{"!hold"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Hold de recall no encontrado"]):::error
  n8 -->|"sí"| n9
  n10{"hold.holdStatusConceptId !== PINV.HOLD_ACTIVE"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED El hold no está activo"]):::error
  n10 -->|"sí"| n11
  n12[("ACTUALIZA pharmacy_inventory.inventory_recall_holds · ACTUALIZA pharmacy_inventory.inventory_recall_holds")]:::efecto
  n10 -->|"no"| n12
  n13{"hold.inventoryLotId"}:::decision
  n12 --> n13
  n14["Llama a LotsRepository.findById"]:::llamada
  n13 -->|"sí"| n14
  n15[("LEE pharmacy_inventory.inventory_lots")]:::efecto
  n14 --> n15
  n16{"lot"}:::decision
  n15 --> n16
  n17[("ACTUALIZA pharmacy_inventory.inventory_lots · ACTUALIZA pharmacy_inventory.inventory_lots")]:::efecto
  n16 -->|"sí"| n17
  n18["Llama a StockPositionsRepository.findByLot"]:::llamada
  n17 --> n18
  n19[("LEE pharmacy_inventory.inventory_stock_positions")]:::efecto
  n18 --> n19
  n20["Repite: por cada const position de positions"]:::bucle
  n19 --> n20
  n21["Llama a LedgerRepository.nextSequence"]:::llamada
  n20 -->|"cada elemento"| n21
  n22[("LEE pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n21 --> n22
  n23["Llama a LedgerRepository.append"]:::llamada
  n22 --> n23
  n24[("CREA pharmacy_inventory.inventory_ledger_entries")]:::efecto
  n23 --> n24
  n25[("ACTUALIZA pharmacy_inventory.inventory_stock_positions")]:::efecto
  n24 --> n25
  n26{"writeOff"}:::decision
  n25 --> n26
  n27[("ACTUALIZA pharmacy_inventory.inventory_stock_positions")]:::efecto
  n26 -->|"sí"| n27
  n28[("ACTUALIZA pharmacy_inventory.inventory_stock_positions · ACTUALIZA pharmacy_inventory.inventory_stock_positio…")]:::efecto
  n27 --> n28
  n26 -->|"no"| n28
  n29(("200 Responde con éxito")):::ok
  n28 --> n29
  n20 -->|"al terminar"| n29
  n16 -->|"no"| n29
  n13 -->|"no"| n29
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

### Operaciones sin decisiones propias

Sólo comprueban el acceso y leen o escriben: no tienen ramas que dibujar. Su detalle está en la ficha de endpoints.

| Operación | Respuestas posibles | Tablas |
|---|---|---|
| POST /pharmacy/{pharmacyId}/suppliers | 201, 400, 401, 403, 429 | 1 |
| POST /pharmacy/{siteId}/inventory-locations | 201, 400, 401, 403, 429 | 1 |
