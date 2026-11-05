<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `erp`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 17 (15 con decisiones propias, 2 sin ellas)
- Inventario de endpoints del módulo: [erp](../endpoints/erp.md)

## Proceso: Módulo 38 — ERP

- **Código:** `erp` · **Agrupación:** MIXTO · **Operaciones:** 17
- **Actores:** ACCOUNTANT · ACCOUNTS_PAYABLE · BUYER · CONTRACT_MANAGER · EMPLOYEE · ERP_ADMIN · HR_ADMIN · SALES · SYSTEM_WORKER · WAREHOUSE
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/erp/README.md`

### Para qué sirve

Back-office: socios de negocio, ciclo de vida contractual, recursos humanos, compras y recepción, conciliación de facturas, ventas y arrendamientos.

_Fuente: `src/modules/erp/README.md:3`_

### Flujo general declarado en el README

```text
socio de negocio ── cuenta bancaria (unverified) ── verify ──> verified
       │
       └─ contrato (draft) ── approval ──> active
                 ├─ amendment  -> vuelve a aprobación pendiente
                 ├─ renewal    -> extiende endDate
                 ├─ termination-> terminated
                 └─ payment-schedules:generate -> cuotas (idempotente)

orden de compra (open) ── goods-receipt ──> received (aceptado vs rechazado)
                       └─ service-entry-sheet
factura ── invoice-match-run ──> matched | variance
```

_Fuente: `src/modules/erp/README.md:72`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-38-01` | Alta de socio con cuenta bancaria | POST /erp/business-partners | ERP_ADMIN | MEDIO | 3 |
| `UC-38-02` | Verificar cuenta bancaria | POST /erp/business-partners/{id}/bank-accounts/{accId}/verify | ERP_ADMIN | BAJO | 2 |
| `UC-38-03` | Crear contrato en borrador | POST /erp/contracts | ERP_ADMIN · CONTRACT_MANAGER | MEDIO | 3 |
| `UC-38-04` | Solicitar/resolver aprobación | POST /erp/contracts/{id}/approval-requests | ERP_ADMIN · CONTRACT_MANAGER | MEDIO | 3 |
| `UC-38-05` | Enmendar contrato | POST /erp/contracts/{id}/amendments | ERP_ADMIN · CONTRACT_MANAGER | MEDIO | 2 |
| `UC-38-06` | Renovar contrato | POST /erp/contracts/{id}/renewals | ERP_ADMIN · CONTRACT_MANAGER | MEDIO | 2 |
| `UC-38-07` | Terminar y liquidar | POST /erp/contracts/{id}/terminations | ERP_ADMIN · CONTRACT_MANAGER | MEDIO | 3 |
| `UC-38-08` | Alta de empleado | POST /erp/employees/onboard | ERP_ADMIN · HR_ADMIN | MEDIO | 2 |
| `UC-38-09` | Solicitar y resolver ausencia | POST /erp/employees/{id}/time-off | ERP_ADMIN · HR_ADMIN · EMPLOYEE | MEDIO | 4 |
| `UC-38-10` | Emitir orden de compra | POST /erp/purchase-orders | ERP_ADMIN · BUYER | MEDIO | 5 |
| `UC-38-11` | Recepción de mercancía | POST /erp/purchase-orders/{id}/goods-receipts | ERP_ADMIN · BUYER · WAREHOUSE | MEDIO | 5 |
| `UC-38-12` | Hoja de servicios | POST /erp/purchase-orders/{id}/service-entry-sheets | ERP_ADMIN · BUYER | MEDIO | 2 |
| `UC-38-13` | Three-way match | POST /erp/bills/{billId}/invoice-match-runs | ERP_ADMIN · ACCOUNTS_PAYABLE | MEDIO | 5 |
| `UC-38-14` | Orden de venta | POST /erp/sales-orders | ERP_ADMIN · SALES | MEDIO | 3 |
| `UC-38-15` | Valoración IFRS 16 | POST /erp/lease-contracts/{id}/valuations | ERP_ADMIN · ACCOUNTANT | MEDIO | 3 |
| `UC-38-16` | Cronograma de cuotas | POST /erp/contracts/{id}/payment-schedules/generate | ERP_ADMIN · SYSTEM_WORKER | MEDIO | 3 |
| `ctrl:ErpController` | Operaciones de ErpController que el README no asigna a un caso de uso | POST /erp/employees/{id}/time-off/{reqId}/approve | ERP_ADMIN · HR_ADMIN | MEDIO | 4 |

### Diagrama — etapas `UC-38-01`, `UC-38-02`, `UC-38-03`…

```mermaid
flowchart LR
  a2(["ERP_ADMIN"]):::actor
  a7(["ERP_ADMIN · CONTRACT_MANAGER"]):::actor
  a18(["ERP_ADMIN · HR_ADMIN"]):::actor
  a22(["ERP_ADMIN · HR_ADMIN · EMPLOYEE"]):::actor
  a25(["ERP_ADMIN · BUYER"]):::actor
  a30(["ERP_ADMIN · BUYER · WAREHOUSE"]):::actor
  a36(["ERP_ADMIN · ACCOUNTS_PAYABLE"]):::actor
  a40(["ERP_ADMIN · SALES"]):::actor
  a43(["ERP_ADMIN · ACCOUNTANT"]):::actor
  a47(["ERP_ADMIN · SYSTEM_WORKER"]):::actor
  t3[("erp.business_partner_bank_accounts")]:::tabla
  t4[("erp.business_partners")]:::tabla
  t8[("erp.contracts")]:::tabla
  t10[("erp.contract_approval_requests")]:::tabla
  t12[("erp.contract_amendments")]:::tabla
  t14[("erp.contract_renewals")]:::tabla
  t16[("erp.contract_terminations")]:::tabla
  t19[("erp.employees")]:::tabla
  t20[("practice.practices")]:::tabla
  t23[("erp.time_off_requests")]:::tabla
  t26[("erp.purchase_order_items")]:::tabla
  t27[("erp.purchase_orders")]:::tabla
  t28[("erp.purchase_requisitions")]:::tabla
  t31[("erp.goods_receipt_items")]:::tabla
  t32[("erp.goods_receipts")]:::tabla
  t34[("erp.service_entry_sheets")]:::tabla
  t37[("billing.bills")]:::tabla
  t38[("erp.invoice_match_runs")]:::tabla
  t41[("erp.sales_orders")]:::tabla
  t44[("erp.lease_contracts")]:::tabla
  t45[("erp.lease_valuations")]:::tabla
  t48[("erp.contract_payment_schedules")]:::tabla
  subgraph s0["UC-38-01 · Alta de socio con cuenta bancaria"]
    o1["POST /erp/business-partners"]:::op
  end
  subgraph s1["UC-38-02 · Verificar cuenta bancaria"]
    o5["POST /erp/business-partners/{id}/bank-accounts/{accId}/verify"]:::op
  end
  subgraph s2["UC-38-03 · Crear contrato en borrador"]
    o6["POST /erp/contracts"]:::op
  end
  subgraph s3["UC-38-04 · Solicitar/resolver aprobación"]
    o9["POST /erp/contracts/{id}/approval-requests"]:::op
  end
  subgraph s4["UC-38-05 · Enmendar contrato"]
    o11["POST /erp/contracts/{id}/amendments"]:::op
  end
  subgraph s5["UC-38-06 · Renovar contrato"]
    o13["POST /erp/contracts/{id}/renewals"]:::op
  end
  subgraph s6["UC-38-07 · Terminar y liquidar"]
    o15["POST /erp/contracts/{id}/terminations"]:::op
  end
  subgraph s7["UC-38-08 · Alta de empleado"]
    o17["POST /erp/employees/onboard"]:::op
  end
  subgraph s8["UC-38-09 · Solicitar y resolver ausencia"]
    o21["POST /erp/employees/{id}/time-off"]:::op
  end
  subgraph s9["UC-38-10 · Emitir orden de compra"]
    o24["POST /erp/purchase-orders"]:::op
  end
  subgraph s10["UC-38-11 · Recepción de mercancía"]
    o29["POST /erp/purchase-orders/{id}/goods-receipts"]:::op
  end
  subgraph s11["UC-38-12 · Hoja de servicios"]
    o33["POST /erp/purchase-orders/{id}/service-entry-sheets"]:::op
  end
  subgraph s12["UC-38-13 · Three-way match"]
    o35["POST /erp/bills/{billId}/invoice-match-runs"]:::op
  end
  subgraph s13["UC-38-14 · Orden de venta"]
    o39["POST /erp/sales-orders"]:::op
  end
  subgraph s14["UC-38-15 · Valoración IFRS 16"]
    o42["POST /erp/lease-contracts/{id}/valuations"]:::op
  end
  subgraph s15["UC-38-16 · Cronograma de cuotas"]
    o46["POST /erp/contracts/{id}/payment-schedules/generate"]:::op
  end
  subgraph s16["ctrl:ErpController · Operaciones de ErpController que el README no asigna a un…"]
    o49["POST /erp/employees/{id}/time-off/{reqId}/approve"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"CREA"| t4
  o1 -->|"LEE"| t4
  a2 --> o5
  o5 -->|"LEE"| t3
  o5 -->|"LEE"| t4
  a7 --> o6
  o6 -->|"LEE"| t4
  o6 -->|"CREA"| t8
  o6 -->|"LEE"| t8
  a7 --> o9
  o9 -->|"CREA"| t10
  o9 -->|"ACTUALIZA"| t8
  o9 -->|"LEE"| t8
  a7 --> o11
  o11 -->|"CREA"| t12
  o11 -->|"LEE"| t8
  a7 --> o13
  o13 -->|"CREA"| t14
  o13 -->|"LEE"| t8
  a7 --> o15
  o15 -->|"CREA"| t16
  o15 -->|"ACTUALIZA"| t8
  o15 -->|"LEE"| t8
  a18 --> o17
  o17 -->|"CREA"| t19
  o17 -->|"LEE"| t20
  a22 --> o21
  o21 -->|"LEE"| t19
  o21 -->|"CREA"| t23
  o21 -->|"LEE"| t23
  o21 -->|"LEE"| t20
  a25 --> o24
  o24 -->|"LEE"| t4
  o24 -->|"LEE"| t8
  o24 -->|"CREA"| t26
  o24 -->|"CREA"| t27
  o24 -->|"LEE"| t28
  a30 --> o29
  o29 -->|"CREA"| t31
  o29 -->|"CREA"| t32
  o29 -->|"LEE"| t26
  o29 -->|"ACTUALIZA"| t27
  o29 -->|"LEE"| t27
  a25 --> o33
  o33 -->|"LEE"| t27
  o33 -->|"CREA"| t34
  a36 --> o35
  o35 -->|"LEE"| t37
  o35 -->|"CREA"| t38
  o35 -->|"LEE"| t26
  o35 -->|"LEE"| t27
  o35 -->|"LEE"| t20
  a40 --> o39
  o39 -->|"LEE"| t4
  o39 -->|"LEE"| t8
  o39 -->|"CREA"| t41
  a43 --> o42
  o42 -->|"LEE"| t8
  o42 -->|"LEE"| t44
  o42 -->|"CREA"| t45
  a47 --> o46
  o46 -->|"CREA"| t48
  o46 -->|"LEE"| t48
  o46 -->|"LEE"| t8
  a18 --> o49
  o49 -->|"LEE"| t19
  o49 -->|"ACTUALIZA"| t23
  o49 -->|"LEE"| t23
  o49 -->|"LEE"| t20
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /erp/bills/{billId}/invoice-match-runs

Conciliar la factura contra orden y recepción (three-way match)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ErpOperationsService.runInvoiceMatch"]:::llamada
  n2 --> n3
  n4["Llama a ErpScopeService.activeTenantFor"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["↩ (relanza el error capturado)"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a ErpScopeService.bill"]:::llamada
  n7 --> n8
  n9["Llama a ErpOperationsRepository.findBillById"]:::llamada
  n8 --> n9
  n10[("LEE billing.bills")]:::efecto
  n9 --> n10
  n11["Llama a ErpOperationsRepository.findPracticeById"]:::llamada
  n10 --> n11
  n12[("LEE practice.practices")]:::efecto
  n11 --> n12
  n13["Llama a ErpScopeService.purchaseOrderForUpdate"]:::llamada
  n12 --> n13
  n14["Llama a ErpOperationsRepository.findPurchaseOrderForUpdate"]:::llamada
  n13 --> n14
  n15[("LEE erp.purchase_orders")]:::efecto
  n14 --> n15
  n16["Llama a ErpOperationsRepository.findItemsByPurchaseOrder"]:::llamada
  n15 --> n16
  n17[("LEE erp.purchase_order_items")]:::efecto
  n16 --> n17
  n18["Llama a ErpOperationsRepository.createInvoiceMatchRun"]:::llamada
  n17 --> n18
  n19[("CREA erp.invoice_match_runs")]:::efecto
  n18 --> n19
  n20(("201 Responde con éxito")):::ok
  n19 --> n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /erp/business-partners

Alta de socio de negocio con su cuenta bancaria

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un socio con ese número |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ErpContractsService.createPartner"]:::llamada
  n2 --> n3
  n4["Llama a ErpScopeService.activeTenantFor"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["↩ (relanza el error capturado)"]):::error
  n5 -->|"sí"| n6
  n7["Llama a ErpContractsRepository.findPartnerByNumber"]:::llamada
  n5 -->|"no"| n7
  n8[("LEE erp.business_partners")]:::efecto
  n7 --> n8
  n9{"duplicate"}:::decision
  n8 --> n9
  n10(["409 CONFLICT Ya existe un socio con ese número"]):::error
  n9 -->|"sí"| n10
  n11["Transacción: transactional(…)"]:::transaccion
  n9 -->|"no"| n11
  n12["Llama a ErpContractsRepository.createPartner"]:::llamada
  n11 --> n12
  n13[("CREA erp.business_partners")]:::efecto
  n12 --> n13
  n14{"dto.bankName"}:::decision
  n13 --> n14
  n15["Llama a ErpContractsRepository.createBankAccount"]:::llamada
  n14 -->|"sí"| n15
  n16[("CREA erp.business_partner_bank_accounts")]:::efecto
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

#### 3. POST /erp/business-partners/{id}/bank-accounts/{accId}/verify

Verificar la cuenta bancaria del socio

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La cuenta ya está verificada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no pertenece a ese socio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ErpContractsService.verifyBankAccount"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ErpScopeService.partner"]:::llamada
  n4 --> n5
  n6["Llama a ErpContractsRepository.findPartnerById"]:::llamada
  n5 --> n6
  n7[("LEE erp.business_partners")]:::efecto
  n6 --> n7
  n8["Llama a ErpScopeService.bankAccountForUpdate"]:::llamada
  n7 --> n8
  n9["Llama a ErpContractsRepository.findBankAccountById"]:::llamada
  n8 --> n9
  n10[("LEE erp.business_partner_bank_accounts")]:::efecto
  n9 --> n10
  n11["Llama a ErpContractsRepository.findPartnerById"]:::llamada
  n10 --> n11
  n12[("LEE erp.business_partners")]:::efecto
  n11 --> n12
  n13["Llama a ErpContractsRepository.findBankAccountForUpdate"]:::llamada
  n12 --> n13
  n14[("LEE erp.business_partner_bank_accounts")]:::efecto
  n13 --> n14
  n15{"account.businessPartnerId !== partnerId"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED La cuenta no pertenece a ese socio"]):::error
  n15 -->|"sí"| n16
  n17{"account.verificationStatusConceptId === CONCEPTS.BANK_VERIFIED"}:::decision
  n15 -->|"no"| n17
  n18(["409 CONFLICT La cuenta ya está verificada"]):::error
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

#### 4. POST /erp/contracts

Crear un contrato en borrador

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un contrato con ese número |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contrato debe terminar después de empezar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ErpContractsService.createContract"]:::llamada
  n2 --> n3
  n4["Llama a ErpScopeService.activeTenantFor"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["↩ (relanza el error capturado)"]):::error
  n5 -->|"sí"| n6
  n7{"dto.endDate && new Date(dto.endDate) ‹= new Date(dto.startDate)"}:::decision
  n5 -->|"no"| n7
  n8(["422 PRECONDITION_FAILED El contrato debe terminar después de empezar"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ErpContractsRepository.findContractByNumber"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE erp.contracts")]:::efecto
  n9 --> n10
  n11{"duplicate"}:::decision
  n10 --> n11
  n12(["409 CONFLICT Ya existe un contrato con ese número"]):::error
  n11 -->|"sí"| n12
  n13["Transacción: transactional(…)"]:::transaccion
  n11 -->|"no"| n13
  n14["Llama a ErpScopeService.partner"]:::llamada
  n13 --> n14
  n15["Llama a ErpContractsRepository.findPartnerById"]:::llamada
  n14 --> n15
  n16[("LEE erp.business_partners")]:::efecto
  n15 --> n16
  n17["Llama a ErpContractsRepository.createContract"]:::llamada
  n16 --> n17
  n18[("CREA erp.contracts")]:::efecto
  n17 --> n18
  n19(("201 Responde con éxito")):::ok
  n18 --> n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /erp/contracts/{id}/amendments

Enmendar el contrato

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contrato no admite cambios en su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ErpContractsService.createAmendment"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ErpContractsService.assertMutableContract"]:::llamada
  n4 --> n5
  n6["Llama a ErpScopeService.contractForUpdate"]:::llamada
  n5 --> n6
  n7["Llama a ErpContractsRepository.findContractByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE erp.contracts")]:::efecto
  n7 --> n8
  n9{"!MUTABLE_CONTRACT_STATES.includes(contract.statusConceptId)"}:::decision
  n8 --> n9
  n10(["422 PRECONDITION_FAILED El contrato no admite cambios en su estado actual"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ErpContractsRepository.createAmendment"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA erp.contract_amendments")]:::efecto
  n11 --> n12
  n13(("201 Responde con éxito")):::ok
  n12 --> n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /erp/contracts/{id}/approval-requests

Solicitar o resolver la aprobación del contrato

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contrato está terminado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ErpContractsService.requestApproval"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ErpScopeService.contractForUpdate"]:::llamada
  n4 --> n5
  n6["Llama a ErpContractsRepository.findContractByIdForUpdate"]:::llamada
  n5 --> n6
  n7[("LEE erp.contracts")]:::efecto
  n6 --> n7
  n8{"contract.statusConceptId === CONCEPTS.CONTRACT_TERMINATED"}:::decision
  n7 --> n8
  n9(["422 PRECONDITION_FAILED El contrato está terminado"]):::error
  n8 -->|"sí"| n9
  n10["Llama a ErpContractsRepository.createApprovalRequest"]:::llamada
  n8 -->|"no"| n10
  n11[("CREA erp.contract_approval_requests")]:::efecto
  n10 --> n11
  n12{"status === CONCEPTS.APPROVAL_APPROVED"}:::decision
  n11 --> n12
  n13[("ACTUALIZA erp.contracts · ACTUALIZA erp.contracts")]:::efecto
  n12 -->|"sí"| n13
  n14{"status === CONCEPTS.APPROVAL_REJECTED"}:::decision
  n12 -->|"no"| n14
  n15[("ACTUALIZA erp.contracts")]:::efecto
  n14 -->|"sí"| n15
  n16(("201 Responde con éxito")):::ok
  n13 --> n16
  n15 --> n16
  n14 -->|"no"| n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /erp/contracts/{id}/payment-schedules/generate

Generar el cronograma de cuotas del contrato

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contrato no tiene valor total del que derivar las cuotas |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ErpContractsService.generatePaymentSchedule"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ErpScopeService.contractForUpdate"]:::llamada
  n4 --> n5
  n6["Llama a ErpContractsRepository.findContractByIdForUpdate"]:::llamada
  n5 --> n6
  n7[("LEE erp.contracts")]:::efecto
  n6 --> n7
  n8{"!contract.totalValue"}:::decision
  n7 --> n8
  n9(["422 PRECONDITION_FAILED El contrato no tiene valor total del que derivar las cuotas"]):::error
  n8 -->|"sí"| n9
  n10["Llama a ErpContractsRepository.findSchedulesByContract"]:::llamada
  n8 -->|"no"| n10
  n11[("LEE erp.contract_payment_schedules")]:::efecto
  n10 --> n11
  n12["Repite: ciclo for"]:::bucle
  n11 --> n12
  n13["Llama a ErpContractsRepository.createPaymentSchedule"]:::llamada
  n12 -->|"cada elemento"| n13
  n14[("CREA erp.contract_payment_schedules")]:::efecto
  n13 --> n14
  n15(("201 Responde con éxito")):::ok
  n14 --> n15
  n12 -->|"al terminar"| n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /erp/contracts/{id}/renewals

Renovar el contrato extendiendo su vigencia

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contrato no admite cambios en su estado actual; PreconditionFailedException: La renovación debe extender la vigencia más allá del fin actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ErpContractsService.createRenewal"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ErpContractsService.assertMutableContract"]:::llamada
  n4 --> n5
  n6["Llama a ErpScopeService.contractForUpdate"]:::llamada
  n5 --> n6
  n7["Llama a ErpContractsRepository.findContractByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE erp.contracts")]:::efecto
  n7 --> n8
  n9{"!MUTABLE_CONTRACT_STATES.includes(contract.statusConceptId)"}:::decision
  n8 --> n9
  n10(["422 PRECONDITION_FAILED El contrato no admite cambios en su estado actual"]):::error
  n9 -->|"sí"| n10
  n11{"contract.endDate && newEndDate ‹= contract.endDate"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La renovación debe extender la vigencia más allá del fin actual"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ErpContractsRepository.createRenewal"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA erp.contract_renewals")]:::efecto
  n13 --> n14
  n15(("201 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /erp/contracts/{id}/terminations

Terminar el contrato y liquidarlo

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El contrato ya está terminado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ErpContractsService.createTermination"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ErpScopeService.contractForUpdate"]:::llamada
  n4 --> n5
  n6["Llama a ErpContractsRepository.findContractByIdForUpdate"]:::llamada
  n5 --> n6
  n7[("LEE erp.contracts")]:::efecto
  n6 --> n7
  n8{"contract.statusConceptId === CONCEPTS.CONTRACT_TERMINATED"}:::decision
  n7 --> n8
  n9(["409 CONFLICT El contrato ya está terminado"]):::error
  n8 -->|"sí"| n9
  n10["Llama a ErpContractsRepository.createTermination"]:::llamada
  n8 -->|"no"| n10
  n11[("CREA erp.contract_terminations")]:::efecto
  n10 --> n11
  n12[("ACTUALIZA erp.contracts")]:::efecto
  n11 --> n12
  n13(("201 Responde con éxito")):::ok
  n12 --> n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /erp/employees/{id}/time-off

Solicitar una ausencia

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Solo puede operar sobre su propio registro de empleado |
| 409 | `CONFLICT` | ConflictException: El empleado ya tiene una ausencia en esas fechas |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ausencia debe terminar después de empezar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ErpOperationsService.requestTimeOff"]:::llamada
  n2 --> n3
  n4{"endDate ‹ startDate"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED La ausencia debe terminar después de empezar"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a ErpScopeService.employee"]:::llamada
  n6 --> n7
  n8["Llama a ErpOperationsRepository.findEmployeeById"]:::llamada
  n7 --> n8
  n9[("LEE erp.employees")]:::efecto
  n8 --> n9
  n10["Llama a ErpOperationsRepository.findPracticeById"]:::llamada
  n9 --> n10
  n11[("LEE practice.practices")]:::efecto
  n10 --> n11
  n12["Llama a ErpScopeService.assertSelfOrHr"]:::llamada
  n11 --> n12
  n13{"!employee.personUserId || employee.personUserId !== actor.id"}:::decision
  n12 --> n13
  n14(["403 FORBIDDEN Solo puede operar sobre su propio registro de empleado"]):::error
  n13 -->|"sí"| n14
  n15["Llama a ErpOperationsRepository.findOverlappingTimeOff"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE erp.time_off_requests")]:::efecto
  n15 --> n16
  n17{"overlapping.length › 0"}:::decision
  n16 --> n17
  n18(["409 CONFLICT El empleado ya tiene una ausencia en esas fechas"]):::error
  n17 -->|"sí"| n18
  n19["Llama a ErpOperationsRepository.createTimeOffRequest"]:::llamada
  n17 -->|"no"| n19
  n20[("CREA erp.time_off_requests")]:::efecto
  n19 --> n20
  n21(("201 Responde con éxito")):::ok
  n20 --> n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. POST /erp/employees/{id}/time-off/{reqId}/approve

Aprobar o rechazar la solicitud de ausencia

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {TIME_OFF_NOT_FOUND.message} |
| 409 | `CONFLICT` | ConflictException: La solicitud ya fue resuelta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ErpOperationsService.approveTimeOff"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ErpScopeService.employee"]:::llamada
  n4 --> n5
  n6["Llama a ErpOperationsRepository.findEmployeeById"]:::llamada
  n5 --> n6
  n7[("LEE erp.employees")]:::efecto
  n6 --> n7
  n8["Llama a ErpOperationsRepository.findPracticeById"]:::llamada
  n7 --> n8
  n9[("LEE practice.practices")]:::efecto
  n8 --> n9
  n10["Llama a ErpOperationsRepository.findTimeOffForUpdate"]:::llamada
  n9 --> n10
  n11[("LEE erp.time_off_requests")]:::efecto
  n10 --> n11
  n12{"!request"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND {TIME_OFF_NOT_FOUND.message}"]):::error
  n12 -->|"sí"| n13
  n14{"request.statusConceptId !== CONCEPTS.TIMEOFF_REQUESTED"}:::decision
  n12 -->|"no"| n14
  n15(["409 CONFLICT La solicitud ya fue resuelta"]):::error
  n14 -->|"sí"| n15
  n16[("ACTUALIZA erp.time_off_requests · ACTUALIZA erp.time_off_requests · ACTUALIZA erp.time_off_requests")]:::efecto
  n14 -->|"no"| n16
  n17(("200 Responde con éxito")):::ok
  n16 --> n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /erp/purchase-orders

Emitir una orden de compra desde la requisición

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
  n3["Llama a ErpOperationsService.createPurchaseOrder"]:::llamada
  n2 --> n3
  n4["Llama a ErpScopeService.activeTenantFor"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["↩ (relanza el error capturado)"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a ErpScopeService.partner"]:::llamada
  n7 --> n8
  n9["Llama a ErpContractsRepository.findPartnerById"]:::llamada
  n8 --> n9
  n10[("LEE erp.business_partners")]:::efecto
  n9 --> n10
  n11["Llama a ErpScopeService.contract"]:::llamada
  n10 --> n11
  n12["Llama a ErpContractsRepository.findContractById"]:::llamada
  n11 --> n12
  n13[("LEE erp.contracts")]:::efecto
  n12 --> n13
  n14{"dto.contractId"}:::decision
  n13 --> n14
  n15["Llama a ErpScopeService.contract"]:::llamada
  n14 -->|"sí"| n15
  n16["Llama a ErpContractsRepository.findContractById"]:::llamada
  n15 --> n16
  n17[("LEE erp.contracts")]:::efecto
  n16 --> n17
  n18{"dto.purchaseRequisitionId"}:::decision
  n17 --> n18
  n14 -->|"no"| n18
  n19["Llama a ErpScopeService.requisition"]:::llamada
  n18 -->|"sí"| n19
  n20["Llama a ErpContractsRepository.findRequisitionById"]:::llamada
  n19 --> n20
  n21[("LEE erp.purchase_requisitions")]:::efecto
  n20 --> n21
  n22["Llama a ErpOperationsRepository.createPurchaseOrder"]:::llamada
  n21 --> n22
  n18 -->|"no"| n22
  n23[("CREA erp.purchase_orders")]:::efecto
  n22 --> n23
  n24["Repite: forEach(…)"]:::bucle
  n23 --> n24
  n25["Llama a ErpOperationsRepository.createPurchaseOrderItem"]:::llamada
  n24 -->|"cada elemento"| n25
  n26[("CREA erp.purchase_order_items")]:::efecto
  n25 --> n26
  n27(("201 Responde con éxito")):::ok
  n26 --> n27
  n24 -->|"al terminar"| n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /erp/purchase-orders/{id}/goods-receipts

Registrar la recepción de mercancía

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La orden de compra está cerrada; PreconditionFailedException: Alguna línea de la recepción no pertenece a la orden de compra; PreconditionFailedException: La cantidad aceptada no puede superar la recibida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ErpOperationsService.createGoodsReceipt"]:::llamada
  n2 --> n3
  n4["Llama a ErpScopeService.activeTenantFor"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["↩ (relanza el error capturado)"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a ErpScopeService.purchaseOrderForUpdate"]:::llamada
  n7 --> n8
  n9["Llama a ErpOperationsRepository.findPurchaseOrderForUpdate"]:::llamada
  n8 --> n9
  n10[("LEE erp.purchase_orders")]:::efecto
  n9 --> n10
  n11{"order.statusConceptId === CONCEPTS.PO_CLOSED"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED La orden de compra está cerrada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ErpOperationsRepository.findItemsInPurchaseOrder"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE erp.purchase_order_items")]:::efecto
  n13 --> n14
  n15{"new Set(requestedIds).size !== requestedIds.length || orderItems.length !== requestedIds.length"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED Alguna línea de la recepción no pertenece a la orden de compra"]):::error
  n15 -->|"sí"| n16
  n17["Llama a ErpOperationsRepository.createGoodsReceipt"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA erp.goods_receipts")]:::efecto
  n17 --> n18
  n19["Repite: forEach(…)"]:::bucle
  n18 --> n19
  n20{"accepted › received"}:::decision
  n19 -->|"cada elemento"| n20
  n21(["422 PRECONDITION_FAILED La cantidad aceptada no puede superar la recibida"]):::error
  n20 -->|"sí"| n21
  n22["Llama a ErpOperationsRepository.createGoodsReceiptItem"]:::llamada
  n20 -->|"no"| n22
  n23[("CREA erp.goods_receipt_items")]:::efecto
  n22 --> n23
  n24[("ACTUALIZA erp.purchase_orders")]:::efecto
  n23 --> n24
  n19 -->|"al terminar"| n24
  n25(("201 Responde con éxito")):::ok
  n24 --> n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. POST /erp/purchase-orders/{id}/service-entry-sheets

Registrar la hoja de servicios prestados

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ErpOperationsService.createServiceEntrySheet"]:::llamada
  n2 --> n3
  n4["Llama a ErpScopeService.activeTenantFor"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["↩ (relanza el error capturado)"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a ErpScopeService.purchaseOrderForUpdate"]:::llamada
  n7 --> n8
  n9["Llama a ErpOperationsRepository.findPurchaseOrderForUpdate"]:::llamada
  n8 --> n9
  n10[("LEE erp.purchase_orders")]:::efecto
  n9 --> n10
  n11["Llama a ErpOperationsRepository.createServiceEntrySheet"]:::llamada
  n10 --> n11
  n12[("CREA erp.service_entry_sheets")]:::efecto
  n11 --> n12
  n13(("201 Responde con éxito")):::ok
  n12 --> n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. POST /erp/sales-orders

Crear una orden de venta

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
  n3["Llama a ErpOperationsService.createSalesOrder"]:::llamada
  n2 --> n3
  n4["Llama a ErpScopeService.activeTenantFor"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["↩ (relanza el error capturado)"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a ErpScopeService.partner"]:::llamada
  n7 --> n8
  n9["Llama a ErpContractsRepository.findPartnerById"]:::llamada
  n8 --> n9
  n10[("LEE erp.business_partners")]:::efecto
  n9 --> n10
  n11["Llama a ErpScopeService.contract"]:::llamada
  n10 --> n11
  n12["Llama a ErpContractsRepository.findContractById"]:::llamada
  n11 --> n12
  n13[("LEE erp.contracts")]:::efecto
  n12 --> n13
  n14{"dto.contractId"}:::decision
  n13 --> n14
  n15["Llama a ErpScopeService.contract"]:::llamada
  n14 -->|"sí"| n15
  n16["Llama a ErpContractsRepository.findContractById"]:::llamada
  n15 --> n16
  n17[("LEE erp.contracts")]:::efecto
  n16 --> n17
  n18["Llama a ErpOperationsRepository.createSalesOrder"]:::llamada
  n17 --> n18
  n14 -->|"no"| n18
  n19[("CREA erp.sales_orders")]:::efecto
  n18 --> n19
  n20(("201 Responde con éxito")):::ok
  n19 --> n20
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
| POST /erp/employees/onboard | 201, 400, 401, 403, 429 | 2 |
| POST /erp/lease-contracts/{id}/valuations | 201, 400, 401, 403, 429 | 3 |
