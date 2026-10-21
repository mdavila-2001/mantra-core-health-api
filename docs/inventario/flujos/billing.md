<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `billing`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 15 (14 con decisiones propias, 1 sin ellas)
- Inventario de endpoints del módulo: [billing](../endpoints/billing.md)

## Proceso: Módulo Billing (17)

- **Código:** `billing` · **Agrupación:** MIXTO · **Operaciones:** 15
- **Actores:** Cualquier sesión válida · SECURITY_ADMIN · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/billing/README.md`

### Para qué sirve

Facturación al paciente (CxC), cuentas por pagar (CxP), contabilización a ledger, conciliación bancaria, morosidad, planes de pago y KPIs financieros. Implementa los 12 casos de uso UC-17-01..12 del spec `casos_uso_17_billing.puml`.

_Fuente: `src/modules/billing/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-17-01` | InvoicesService.issueFromEncounter | POST /billing/invoices:issue-from-encounter | SECURITY_ADMIN | MEDIO | 4 |
| `UC-17-02` | PaymentsReceivedService.apply | POST /billing/payments-received:apply | SECURITY_ADMIN | MEDIO | 4 |
| `UC-17-03` | InvoicesService.creditNote | POST /billing/invoices/{id}:credit-note | SECURITY_ADMIN | MEDIO | 5 |
| `UC-17-04` | BillsService.register | POST /billing/bills | SECURITY_ADMIN | MEDIO | 5 |
| `UC-17-05` | PaymentsMadeService.execute | POST /billing/payments-made:execute | SECURITY_ADMIN | MEDIO | 4 |
| `UC-17-06` | LedgerService.postToLedger | POST /billing/documents/{id}:post-to-ledger | SECURITY_ADMIN | BAJO | 4 |
| `UC-17-07` | ReconciliationService.clear | POST /billing/reconciliation:clear | SECURITY_ADMIN | MEDIO | 4 |
| `UC-17-08` | ReimbursementsService.link | POST /billing/reimbursements:link | SECURITY_ADMIN | MEDIO | 5 |
| `UC-17-09` | PatientStatementsService.generate | POST /billing/patient-statements:generate | SECURITY_ADMIN | MEDIO | 4 |
| `UC-17-10` | DunningService.execute | POST /billing/dunning-runs:execute | SECURITY_ADMIN | MEDIO | 6 |
| `UC-17-11` | InvoicesService.createPaymentPlan | POST /billing/payment-plans | SECURITY_ADMIN | MEDIO | 4 |
| `UC-17-12` | KpiSnapshotsService.compute | POST /billing/kpi-snapshots:compute | SECURITY_ADMIN | MEDIO | 2 |
| `ctrl:BillingOperationsController` | Operaciones de BillingOperationsController que el README no asigna a un caso de uso | POST /billing/internal/dunning-runs/run-due | SYSTEM · SECURITY_ADMIN | MEDIO | 7 |
| `ctrl:BillingServiceCatalogController` | Operaciones de BillingServiceCatalogController que el README no asigna a un caso de uso | GET /billing/service-catalog | Cualquier sesión válida | BAJO | 1 |
|  |  | POST /billing/service-catalog | SECURITY_ADMIN | MEDIO | 2 |

### Diagrama — etapas `UC-17-01`, `UC-17-02`, `UC-17-03`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  a30(["SYSTEM · SECURITY_ADMIN"]):::actor
  a33(["Cualquier sesión válida"]):::actor
  t3[("billing.billing_document_links")]:::tabla
  t4[("billing.invoice_lines")]:::tabla
  t5[("billing.invoices")]:::tabla
  t7[("billing.payments_received")]:::tabla
  t8[("billing.receivable_payment_allocations")]:::tabla
  t11[("billing.bill_lines")]:::tabla
  t12[("billing.bills")]:::tabla
  t13[("billing.vendors")]:::tabla
  t15[("billing.payable_payment_allocations")]:::tabla
  t16[("billing.payments_made")]:::tabla
  t20[("billing.reimbursements")]:::tabla
  t22[("billing.patient_statements")]:::tabla
  t24[("billing.dunning_items")]:::tabla
  t25[("billing.dunning_runs")]:::tabla
  t28[("billing.financial_kpi_snapshots")]:::tabla
  t34[("billing.service_catalog")]:::tabla
  subgraph s0["UC-17-01 · InvoicesService.issueFromEncounter"]
    o1["POST /billing/invoices:issue-from-encounter"]:::op
  end
  subgraph s1["UC-17-02 · PaymentsReceivedService.apply"]
    o6["POST /billing/payments-received:apply"]:::op
  end
  subgraph s2["UC-17-03 · InvoicesService.creditNote"]
    o9["POST /billing/invoices/{id}:credit-note"]:::op
  end
  subgraph s3["UC-17-04 · BillsService.register"]
    o10["POST /billing/bills"]:::op
  end
  subgraph s4["UC-17-05 · PaymentsMadeService.execute"]
    o14["POST /billing/payments-made:execute"]:::op
  end
  subgraph s5["UC-17-06 · LedgerService.postToLedger"]
    o17["POST /billing/documents/{id}:post-to-ledger"]:::op
  end
  subgraph s6["UC-17-07 · ReconciliationService.clear"]
    o18["POST /billing/reconciliation:clear"]:::op
  end
  subgraph s7["UC-17-08 · ReimbursementsService.link"]
    o19["POST /billing/reimbursements:link"]:::op
  end
  subgraph s8["UC-17-09 · PatientStatementsService.generate"]
    o21["POST /billing/patient-statements:generate"]:::op
  end
  subgraph s9["UC-17-10 · DunningService.execute"]
    o23["POST /billing/dunning-runs:execute"]:::op
  end
  subgraph s10["UC-17-11 · InvoicesService.createPaymentPlan"]
    o26["POST /billing/payment-plans"]:::op
  end
  subgraph s11["UC-17-12 · KpiSnapshotsService.compute"]
    o27["POST /billing/kpi-snapshots:compute"]:::op
  end
  t31[("+1 tablas más")]
  subgraph s12["ctrl:BillingOperationsController · Operaciones de BillingOperationsController q…"]
    o29["POST /billing/internal/dunning-runs/run-due"]:::op
  end
  subgraph s13["ctrl:BillingServiceCatalogController · Operaciones de BillingServiceCatalogCont…"]
    o32["GET /billing/service-catalog"]:::op
    o35["POST /billing/service-catalog"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"CREA"| t4
  o1 -->|"CREA"| t5
  o1 -->|"LEE"| t5
  a2 --> o6
  o6 -->|"ACTUALIZA"| t5
  o6 -->|"LEE"| t5
  o6 -->|"CREA"| t7
  o6 -->|"CREA"| t8
  a2 --> o9
  o9 -->|"CREA"| t3
  o9 -->|"CREA"| t4
  o9 -->|"ACTUALIZA"| t5
  o9 -->|"CREA"| t5
  o9 -->|"LEE"| t5
  a2 --> o10
  o10 -->|"CREA"| t11
  o10 -->|"CREA"| t3
  o10 -->|"CREA"| t12
  o10 -->|"LEE"| t12
  o10 -->|"LEE"| t13
  a2 --> o14
  o14 -->|"ACTUALIZA"| t12
  o14 -->|"LEE"| t12
  o14 -->|"CREA"| t15
  o14 -->|"CREA"| t16
  a2 --> o17
  o17 -->|"LEE"| t12
  o17 -->|"LEE"| t5
  o17 -->|"LEE"| t16
  o17 -->|"LEE"| t7
  a2 --> o18
  o18 -->|"ACTUALIZA"| t16
  o18 -->|"LEE"| t16
  o18 -->|"ACTUALIZA"| t7
  o18 -->|"LEE"| t7
  a2 --> o19
  o19 -->|"CREA"| t3
  o19 -->|"ACTUALIZA"| t5
  o19 -->|"LEE"| t5
  o19 -->|"CREA"| t20
  o19 -->|"LEE"| t20
  a2 --> o21
  o21 -->|"CREA"| t3
  o21 -->|"LEE"| t5
  o21 -->|"CREA"| t22
  o21 -->|"LEE"| t22
  a2 --> o23
  o23 -->|"CREA"| t24
  o23 -->|"ACTUALIZA"| t25
  o23 -->|"CREA"| t25
  o23 -->|"LEE"| t25
  o23 -->|"ACTUALIZA"| t5
  o23 -->|"LEE"| t5
  a2 --> o26
  o26 -->|"CREA"| t3
  o26 -->|"ACTUALIZA"| t5
  o26 -->|"CREA"| t5
  o26 -->|"LEE"| t5
  a2 --> o27
  o27 -->|"CREA"| t28
  o27 -->|"LEE"| t28
  a30 --> o29
  o29 -->|"CREA"| t24
  o29 -->|"ACTUALIZA"| t25
  o29 -->|"CREA"| t25
  o29 -->|"LEE"| t25
  o29 -->|"ACTUALIZA"| t5
  o29 -->|"LEE"| t5
  o29 -.-> t31
  a33 --> o32
  o32 -->|"LEE"| t34
  a2 --> o35
  o35 -->|"CREA"| t34
  o35 -->|"LEE"| t34
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /billing/bills

Registrar factura de proveedor con three-way match

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 409 | `CONFLICT` | ConflictException: La factura del proveedor ya fue capturada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El proveedor no está activo; PreconditionFailedException: Three-way match: la línea con orden de compra requiere recepción de bienes |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a BillsService.register"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a BillsRepository.findVendor"]:::llamada
  n4 --> n5
  n6[("LEE billing.vendors")]:::efecto
  n5 --> n6
  n7{"!vendor"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Proveedor no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"vendor.statusConceptId !== CONCEPTS.STATE_ACTIVE && vendor.statusConceptId !== CONCEPTS.TENANT_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El proveedor no está activo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a BillsRepository.findByNumber"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE billing.bills")]:::efecto
  n11 --> n12
  n13{"clash"}:::decision
  n12 --> n13
  n14(["409 CONFLICT La factura del proveedor ya fue capturada"]):::error
  n13 -->|"sí"| n14
  n15["Repite: por cada const l de dto.lines"]:::bucle
  n13 -->|"no"| n15
  n16{"l.purchaseOrderItemId && !l.goodsReceiptItemId"}:::decision
  n15 -->|"cada elemento"| n16
  n17(["422 PRECONDITION_FAILED Three-way match: la línea con orden de compra requiere recepción de bienes"]):::error
  n16 -->|"sí"| n17
  n18["Llama a BillsRepository.create"]:::llamada
  n16 -->|"no"| n18
  n15 -->|"al terminar"| n18
  n19[("CREA billing.bills")]:::efecto
  n18 --> n19
  n20["Repite: forEach(…)"]:::bucle
  n19 --> n20
  n21["Llama a BillsRepository.createLine"]:::llamada
  n20 -->|"cada elemento"| n21
  n22[("CREA billing.bill_lines")]:::efecto
  n21 --> n22
  n23{"dto.tenantId && (dto.purchaseOrderId || dto.contractId)"}:::decision
  n22 --> n23
  n20 -->|"al terminar"| n23
  n24["Llama a BillingDocumentLinksRepository.create"]:::llamada
  n23 -->|"sí"| n24
  n25[("CREA billing.billing_document_links")]:::efecto
  n24 --> n25
  n26(("201 Responde con éxito")):::ok
  n25 --> n26
  n23 -->|"no"| n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /billing/documents/{id}:post-to-ledger

Contabilizar documento (posting CxC/CxP)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Documento no encontrado |
| 409 | `CONFLICT` | ConflictException: El documento ya fue contabilizado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a LedgerService.postToLedger"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a LedgerService.loadDocument"]:::llamada
  n4 --> n5
  n6{"según type"}:::decision
  n5 --> n6
  n7["Llama a InvoicesRepository.findById"]:::llamada
  n6 -->|"'INVOICE'"| n7
  n8[("LEE billing.invoices")]:::efecto
  n7 --> n8
  n9["Llama a BillsRepository.findById"]:::llamada
  n6 -->|"'BILL'"| n9
  n10[("LEE billing.bills")]:::efecto
  n9 --> n10
  n11["Llama a PaymentsReceivedRepository.findById"]:::llamada
  n6 -->|"'PAYMENT_RECEIVED'"| n11
  n12[("LEE billing.payments_received")]:::efecto
  n11 --> n12
  n13["Llama a PaymentsMadeRepository.findById"]:::llamada
  n6 -->|"'PAYMENT_MADE'"| n13
  n14[("LEE billing.payments_made")]:::efecto
  n13 --> n14
  n15{"!doc"}:::decision
  n8 --> n15
  n10 --> n15
  n12 --> n15
  n14 --> n15
  n6 -->|"otro"| n15
  n16(["404 NOT_FOUND Documento no encontrado"]):::error
  n15 -->|"sí"| n16
  n17{"doc.transactionId"}:::decision
  n15 -->|"no"| n17
  n18(["409 CONFLICT El documento ya fue contabilizado"]):::error
  n17 -->|"sí"| n18
  n19(("200 Responde con éxito")):::ok
  n17 -->|"no"| n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /billing/dunning-runs:execute

Ejecutar ciclo de morosidad (dunning)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El número de corrida ya existe para el tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DunningService.execute"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DunningRepository.findRunByNumber"]:::llamada
  n4 --> n5
  n6[("LEE billing.dunning_runs")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT El número de corrida ya existe para el tenant"]):::error
  n7 -->|"sí"| n8
  n9["Llama a DunningRepository.createRun"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA billing.dunning_runs")]:::efecto
  n9 --> n10
  n11["Repite: por cada const item de dto.items"]:::bucle
  n10 --> n11
  n12["Llama a DunningRepository.createItem"]:::llamada
  n11 -->|"cada elemento"| n12
  n13[("CREA billing.dunning_items")]:::efecto
  n12 --> n13
  n14["Llama a InvoicesRepository.findById"]:::llamada
  n13 --> n14
  n15[("LEE billing.invoices")]:::efecto
  n14 --> n15
  n16{"invoice"}:::decision
  n15 --> n16
  n17[("ACTUALIZA billing.invoices")]:::efecto
  n16 -->|"sí"| n17
  n18[("ACTUALIZA billing.dunning_runs")]:::efecto
  n17 --> n18
  n16 -->|"no"| n18
  n11 -->|"al terminar"| n18
  n19(("201 Responde con éxito")):::ok
  n18 --> n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /billing/internal/dunning-runs/run-due

Evaluar y disparar morosidad automática por tenant

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DunningService.runDueDunning"]:::llamada
  n2 --> n3
  n4["Llama a PracticeTenantLookupService.findActive"]:::llamada
  n3 --> n4
  n5["Llama a PracticesRepository.findActive"]:::llamada
  n4 --> n5
  n6[("LEE practice.practices")]:::efecto
  n5 --> n6
  n7["Repite: por cada const [tenantId, practiceIds] de practiceIdsByTenant"]:::bucle
  n6 --> n7
  n8["Intenta"]:::intento
  n7 -->|"cada elemento"| n8
  n9["Transacción: transactional(…)"]:::transaccion
  n8 --> n9
  n10["Llama a InvoicesRepository.findOverdueByPractices"]:::llamada
  n9 --> n10
  n11[("LEE billing.invoices")]:::efecto
  n10 --> n11
  n12["Llama a DunningRepository.findRunByNumber"]:::llamada
  n11 --> n12
  n13[("LEE billing.dunning_runs")]:::efecto
  n12 --> n13
  n14["Llama a DunningRepository.createRun"]:::llamada
  n13 --> n14
  n15[("CREA billing.dunning_runs")]:::efecto
  n14 --> n15
  n16["Repite: por cada const invoice de overdue"]:::bucle
  n15 --> n16
  n17["Llama a DunningRepository.createItem"]:::llamada
  n16 -->|"cada elemento"| n17
  n18[("CREA billing.dunning_items")]:::efecto
  n17 --> n18
  n19[("ACTUALIZA billing.invoices")]:::efecto
  n18 --> n19
  n20[("ACTUALIZA billing.dunning_runs")]:::efecto
  n19 --> n20
  n16 -->|"al terminar"| n20
  n21(("200 Responde con éxito")):::ok
  n20 --> n21
  n7 -->|"al terminar"| n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /billing/invoices:issue-from-encounter

Emitir factura desde los cargos del encuentro

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El número de factura ya existe en la práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a InvoicesService.issueFromEncounter"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a InvoicesRepository.findByNumber"]:::llamada
  n4 --> n5
  n6[("LEE billing.invoices")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT El número de factura ya existe en la práctica"]):::error
  n7 -->|"sí"| n8
  n9["Llama a InvoicesRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA billing.invoices")]:::efecto
  n9 --> n10
  n11["Repite: forEach(…)"]:::bucle
  n10 --> n11
  n12["Llama a InvoicesRepository.createLine"]:::llamada
  n11 -->|"cada elemento"| n12
  n13[("CREA billing.invoice_lines")]:::efecto
  n12 --> n13
  n14{"dto.tenantId && (dto.encounterId || dto.claimId)"}:::decision
  n13 --> n14
  n11 -->|"al terminar"| n14
  n15["Llama a BillingDocumentLinksRepository.create"]:::llamada
  n14 -->|"sí"| n15
  n16[("CREA billing.billing_document_links")]:::efecto
  n15 --> n16
  n17(("201 Responde con éxito")):::ok
  n16 --> n17
  n14 -->|"no"| n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /billing/invoices/{id}:credit-note

Emitir nota de crédito / castigo sobre una factura

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Factura no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El monto de la nota de crédito excede el saldo de la factura |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a InvoicesService.creditNote"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a InvoicesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE billing.invoices")]:::efecto
  n5 --> n6
  n7{"!original"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Factura no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"reverseCents › originalBalanceCents && !dto.writeOff"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El monto de la nota de crédito excede el saldo de la factura"]):::error
  n9 -->|"sí"| n10
  n11["Llama a InvoicesRepository.create"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA billing.invoices")]:::efecto
  n11 --> n12
  n13["Repite: forEach(…)"]:::bucle
  n12 --> n13
  n14["Llama a InvoicesRepository.createLine"]:::llamada
  n13 -->|"cada elemento"| n14
  n15[("CREA billing.invoice_lines")]:::efecto
  n14 --> n15
  n16[("ACTUALIZA billing.invoices · ACTUALIZA billing.invoices")]:::efecto
  n15 --> n16
  n13 -->|"al terminar"| n16
  n17{"dto.tenantId"}:::decision
  n16 --> n17
  n18["Llama a BillingDocumentLinksRepository.create"]:::llamada
  n17 -->|"sí"| n18
  n19[("CREA billing.billing_document_links")]:::efecto
  n18 --> n19
  n20(("201 Responde con éxito")):::ok
  n19 --> n20
  n17 -->|"no"| n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /billing/kpi-snapshots:compute

Calcular snapshot de KPI financiero y aging

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El snapshot de KPI ya fue calculado para esa marca |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a KpiSnapshotsService.compute"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a KpiSnapshotsRepository.findExisting"]:::llamada
  n4 --> n5
  n6[("LEE billing.financial_kpi_snapshots")]:::efecto
  n5 --> n6
  n7{"existing"}:::decision
  n6 --> n7
  n8(["409 CONFLICT El snapshot de KPI ya fue calculado para esa marca"]):::error
  n7 -->|"sí"| n8
  n9["Llama a KpiSnapshotsRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA billing.financial_kpi_snapshots")]:::efecto
  n9 --> n10
  n11(("201 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /billing/patient-statements:generate

Generar el estado de cuenta del paciente

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un estado de cuenta para el periodo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PatientStatementsService.generate"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PatientStatementsRepository.findByPeriod"]:::llamada
  n4 --> n5
  n6[("LEE billing.patient_statements")]:::efecto
  n5 --> n6
  n7{"existing"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe un estado de cuenta para el periodo"]):::error
  n7 -->|"sí"| n8
  n9["Llama a InvoicesRepository.findByPatientInRange"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE billing.invoices")]:::efecto
  n9 --> n10
  n11["Llama a PatientStatementsRepository.create"]:::llamada
  n10 --> n11
  n12[("CREA billing.patient_statements")]:::efecto
  n11 --> n12
  n13{"dto.tenantId"}:::decision
  n12 --> n13
  n14["Repite: por cada const inv de invoices"]:::bucle
  n13 -->|"sí"| n14
  n15["Llama a BillingDocumentLinksRepository.create"]:::llamada
  n14 -->|"cada elemento"| n15
  n16[("CREA billing.billing_document_links")]:::efecto
  n15 --> n16
  n17(("201 Responde con éxito")):::ok
  n16 --> n17
  n14 -->|"al terminar"| n17
  n13 -->|"no"| n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /billing/payment-plans

Configurar un plan de pagos del paciente

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Factura origen no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La factura origen no tiene saldo; PreconditionFailedException: La suma de cuotas debe igualar el saldo de la factura |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a InvoicesService.createPaymentPlan"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a InvoicesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE billing.invoices")]:::efecto
  n5 --> n6
  n7{"!source"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Factura origen no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"balanceCents ‹= 0"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La factura origen no tiene saldo"]):::error
  n9 -->|"sí"| n10
  n11{"installmentsCents !== balanceCents"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La suma de cuotas debe igualar el saldo de la factura"]):::error
  n11 -->|"sí"| n12
  n13["Repite: ciclo for"]:::bucle
  n11 -->|"no"| n13
  n14["Llama a InvoicesRepository.create"]:::llamada
  n13 -->|"cada elemento"| n14
  n15[("CREA billing.invoices")]:::efecto
  n14 --> n15
  n16{"dto.tenantId"}:::decision
  n15 --> n16
  n17["Llama a BillingDocumentLinksRepository.create"]:::llamada
  n16 -->|"sí"| n17
  n18[("CREA billing.billing_document_links")]:::efecto
  n17 --> n18
  n19[("ACTUALIZA billing.invoices")]:::efecto
  n18 --> n19
  n16 -->|"no"| n19
  n13 -->|"al terminar"| n19
  n20(("201 Responde con éxito")):::ok
  n19 --> n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /billing/payments-made:execute

Ejecutar pago a proveedor con asignación

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Factura de proveedor no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El monto del pago debe ser positivo; PreconditionFailedException: La suma asignada más retención excede el monto del pago; PreconditionFailedException: La factura de proveedor no tiene saldo; PreconditionFailedException: La asignación excede el saldo de la factura de proveedor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PaymentsMadeService.execute"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"amountCents ‹= 0"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED El monto del pago debe ser positivo"]):::error
  n5 -->|"sí"| n6
  n7{"allocatedCents › amountCents"}:::decision
  n5 -->|"no"| n7
  n8(["422 PRECONDITION_FAILED La suma asignada más retención excede el monto del pago"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PaymentsMadeRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA billing.payments_made")]:::efecto
  n9 --> n10
  n11["Repite: por cada const alloc de dto.allocations"]:::bucle
  n10 --> n11
  n12["Llama a BillsRepository.findById"]:::llamada
  n11 -->|"cada elemento"| n12
  n13[("LEE billing.bills")]:::efecto
  n12 --> n13
  n14{"!bill"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Factura de proveedor no encontrada"]):::error
  n14 -->|"sí"| n15
  n16{"balanceCents ‹= 0"}:::decision
  n14 -->|"no"| n16
  n17(["422 PRECONDITION_FAILED La factura de proveedor no tiene saldo"]):::error
  n16 -->|"sí"| n17
  n18{"allocCents › balanceCents"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED La asignación excede el saldo de la factura de proveedor"]):::error
  n18 -->|"sí"| n19
  n20["Llama a PaymentsMadeRepository.createAllocation"]:::llamada
  n18 -->|"no"| n20
  n21[("CREA billing.payable_payment_allocations")]:::efecto
  n20 --> n21
  n22[("ACTUALIZA billing.bills · ACTUALIZA billing.bills · ACTUALIZA billing.bills")]:::efecto
  n21 --> n22
  n23(("201 Responde con éxito")):::ok
  n22 --> n23
  n11 -->|"al terminar"| n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. POST /billing/payments-received:apply

Aplicar un pago recibido con asignación multi-factura

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Factura no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El monto del pago debe ser positivo; PreconditionFailedException: La suma asignada excede el monto del pago; PreconditionFailedException: La factura no tiene saldo pendiente; PreconditionFailedException: La asignación excede el saldo de la factura |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PaymentsReceivedService.apply"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"amountCents ‹= 0"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED El monto del pago debe ser positivo"]):::error
  n5 -->|"sí"| n6
  n7{"allocatedCents › amountCents"}:::decision
  n5 -->|"no"| n7
  n8(["422 PRECONDITION_FAILED La suma asignada excede el monto del pago"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PaymentsReceivedRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA billing.payments_received")]:::efecto
  n9 --> n10
  n11["Repite: por cada const alloc de dto.allocations"]:::bucle
  n10 --> n11
  n12["Llama a InvoicesRepository.findById"]:::llamada
  n11 -->|"cada elemento"| n12
  n13[("LEE billing.invoices")]:::efecto
  n12 --> n13
  n14{"!invoice"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Factura no encontrada"]):::error
  n14 -->|"sí"| n15
  n16{"balanceCents ‹= 0"}:::decision
  n14 -->|"no"| n16
  n17(["422 PRECONDITION_FAILED La factura no tiene saldo pendiente"]):::error
  n16 -->|"sí"| n17
  n18{"allocCents › balanceCents"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED La asignación excede el saldo de la factura"]):::error
  n18 -->|"sí"| n19
  n20["Llama a PaymentsReceivedRepository.createAllocation"]:::llamada
  n18 -->|"no"| n20
  n21[("CREA billing.receivable_payment_allocations")]:::efecto
  n20 --> n21
  n22[("ACTUALIZA billing.invoices · ACTUALIZA billing.invoices · ACTUALIZA billing.invoices")]:::efecto
  n21 --> n22
  n23(("201 Responde con éxito")):::ok
  n22 --> n23
  n11 -->|"al terminar"| n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /billing/reconciliation:clear

Conciliar pagos vía documento de compensación

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Pago recibido no encontrado; ResourceNotFoundException: Pago emitido no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Debe indicar al menos un pago a conciliar; PreconditionFailedException: El pago recibido ya está conciliado; PreconditionFailedException: El pago emitido ya está conciliado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ReconciliationService.clear"]:::llamada
  n2 --> n3
  n4{"receivedIds.length === 0 && madeIds.length === 0"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED Debe indicar al menos un pago a conciliar"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Repite: por cada const id de receivedIds"]:::bucle
  n6 --> n7
  n8["Llama a PaymentsReceivedRepository.findById"]:::llamada
  n7 -->|"cada elemento"| n8
  n9[("LEE billing.payments_received")]:::efecto
  n8 --> n9
  n10{"!p"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Pago recibido no encontrado"]):::error
  n10 -->|"sí"| n11
  n12{"p.clearingDocumentId"}:::decision
  n10 -->|"no"| n12
  n13(["422 PRECONDITION_FAILED El pago recibido ya está conciliado"]):::error
  n12 -->|"sí"| n13
  n14[("ACTUALIZA billing.payments_received · ACTUALIZA billing.payments_received")]:::efecto
  n12 -->|"no"| n14
  n15["Repite: por cada const id de madeIds"]:::bucle
  n14 --> n15
  n7 -->|"al terminar"| n15
  n16["Llama a PaymentsMadeRepository.findById"]:::llamada
  n15 -->|"cada elemento"| n16
  n17[("LEE billing.payments_made")]:::efecto
  n16 --> n17
  n18{"!p"}:::decision
  n17 --> n18
  n19(["404 NOT_FOUND Pago emitido no encontrado"]):::error
  n18 -->|"sí"| n19
  n20{"p.clearingDocumentId"}:::decision
  n18 -->|"no"| n20
  n21(["422 PRECONDITION_FAILED El pago emitido ya está conciliado"]):::error
  n20 -->|"sí"| n21
  n22[("ACTUALIZA billing.payments_made · ACTUALIZA billing.payments_made")]:::efecto
  n20 -->|"no"| n22
  n23(("200 Responde con éxito")):::ok
  n22 --> n23
  n15 -->|"al terminar"| n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /billing/reimbursements:link

Vincular reembolso de reclamo de seguro a la factura

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Factura no encontrada |
| 409 | `CONFLICT` | ConflictException: El reclamo ya tiene un reembolso registrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ReimbursementsService.link"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReimbursementsRepository.findByClaim"]:::llamada
  n4 --> n5
  n6[("LEE billing.reimbursements")]:::efecto
  n5 --> n6
  n7{"existing"}:::decision
  n6 --> n7
  n8(["409 CONFLICT El reclamo ya tiene un reembolso registrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a InvoicesRepository.findById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE billing.invoices")]:::efecto
  n9 --> n10
  n11{"!invoice"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Factura no encontrada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ReimbursementsRepository.create"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA billing.reimbursements")]:::efecto
  n13 --> n14
  n15[("ACTUALIZA billing.invoices · ACTUALIZA billing.invoices · ACTUALIZA billing.invoices")]:::efecto
  n14 --> n15
  n16{"dto.tenantId"}:::decision
  n15 --> n16
  n17["Llama a BillingDocumentLinksRepository.create"]:::llamada
  n16 -->|"sí"| n17
  n18[("CREA billing.billing_document_links")]:::efecto
  n17 --> n18
  n19(("201 Responde con éxito")):::ok
  n18 --> n19
  n16 -->|"no"| n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. POST /billing/service-catalog

Dar de alta un servicio en el catálogo maestro

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un servicio con ese código en el catálogo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a BillingServiceCatalogService.create"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ServiceCatalogRepository.findByCode"]:::llamada
  n4 --> n5
  n6[("LEE billing.service_catalog")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe un servicio con ese código en el catálogo"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ServiceCatalogRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA billing.service_catalog")]:::efecto
  n9 --> n10
  n11(("201 Responde con éxito")):::ok
  n10 --> n11
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
| GET /billing/service-catalog | 200, 400, 401, 403, 429 | 1 |
