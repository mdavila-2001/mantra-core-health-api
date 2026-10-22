<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `payments`

- **Procesos:** 1 · **Máquinas de estado:** 1
- **Operaciones:** 14 (13 con decisiones propias, 1 sin ellas)
- Inventario de endpoints del módulo: [payments](../endpoints/payments.md)

## Proceso: Módulo 42 — Payments

- **Código:** `payments` · **Agrupación:** CASO_DE_USO_README · **Operaciones:** 14
- **Actores:** CASHIER · PAYMENTS_ADMIN · Público (sin sesión)
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/payments/README.md`

### Para qué sirve

Cobros con pasarela: intención de pago, checkout, procesamiento contra el gateway, reembolsos, anulaciones y las operaciones de cierre (tarifas, liquidaciones, payouts y conciliación).

_Fuente: `src/modules/payments/README.md:3`_

### Flujo general declarado en el README

```text
intent (pending)
  ├─ fx-lock            -> importe re-expresado en la moneda destino
  ├─ risk-assessment    -> approve | review | decline (decline => intent failed)
  ├─ splits             -> reparto entre cuentas conectadas
  └─ transactions       -> authorize (processing) | capture/sale (succeeded)
        ├─ callback     -> aplica el resultado del proveedor (idempotente)
        ├─ status-inquiry -> confirma cuando el callback no llegó
        ├─ refunds      -> solo sobre capturada/liquidada, acotado a lo cobrado
        └─ cancellation -> solo si no está liquidada
settlement import -> transacciones a `settled`
payouts           -> importe derivado de los ítems, neto de comisiones
reconciliation    -> registros del proveedor vs ledger; descuadres abren excepción
```

_Fuente: `src/modules/payments/README.md:70`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-42-01` | Crear intención de pago idempotente | POST /payments/intents | PAYMENTS_ADMIN · CASHIER | MEDIO | 2 |
| `UC-42-02` | Abrir sesión de checkout con contexto de cajero | POST /payments/checkout-sessions | PAYMENTS_ADMIN · CASHIER | MEDIO | 4 |
| `UC-42-03` | Bloquear tipo de cambio | POST /payments/intents/{id}/fx-lock | PAYMENTS_ADMIN | MEDIO | 4 |
| `UC-42-04` | Evaluar riesgo y 3-D Secure | POST /payments/intents/{id}/risk-assessment | PAYMENTS_ADMIN | MEDIO | 3 |
| `UC-42-05` | Procesar transacción (authorize/capture/sale) | POST /payments/intents/{id}/transactions | PAYMENTS_ADMIN · CASHIER | MEDIO | 5 |
| `UC-42-06` | Recibir callback del gateway (idempotente) | POST /payments/callbacks/{callbackPath} | Público (sin sesión) | ALTO | 6 |
| `UC-42-07` | Consulta independiente de estado | POST /payments/transactions/{id}/status-inquiry | PAYMENTS_ADMIN | BAJO | 1 |
| `UC-42-08` | Reembolso total o parcial | POST /payments/transactions/{id}/refunds | PAYMENTS_ADMIN | MEDIO | 3 |
| `UC-42-09` | Solicitar anulación | POST /payments/transactions/{id}/cancellation-requests | PAYMENTS_ADMIN · CASHIER | MEDIO | 2 |
| `UC-42-10` | Publicar versión del tarifario | POST /payments/fee-schedules | PAYMENTS_ADMIN | MEDIO | 3 |
| `UC-42-11` | Reparto multi-party | POST /payments/intents/{id}/splits | PAYMENTS_ADMIN | MEDIO | 3 |
| `UC-42-12` | Importar liquidación del gateway | POST /payments/settlements/import | PAYMENTS_ADMIN | MEDIO | 5 |
| `UC-42-13` | Ejecutar payout a cuenta conectada | POST /payments/payouts | PAYMENTS_ADMIN | MEDIO | 2 |
| `UC-42-14` | Conciliar gateway vs ledger | POST /payments/reconciliation-runs | PAYMENTS_ADMIN | MEDIO | 5 |

### Diagrama — etapas `UC-42-01`, `UC-42-02`, `UC-42-03`…

```mermaid
flowchart LR
  a2(["PAYMENTS_ADMIN · CASHIER"]):::actor
  a9(["PAYMENTS_ADMIN"]):::actor
  a16(["Público (sin sesión)"]):::actor
  t3[("payments.payment_intents")]:::tabla
  t5[("payments.cashier_payment_contexts")]:::tabla
  t6[("payments.payment_checkout_sessions")]:::tabla
  t7[("payments.payment_debts")]:::tabla
  t10[("payments.fx_rate_locks")]:::tabla
  t12[("payments.risk_assessments")]:::tabla
  t14[("payments.payment_transactions")]:::tabla
  t17[("payments.payment_webhook_events")]:::tabla
  t20[("payments.refunds")]:::tabla
  t22[("payments.payment_cancellation_requests")]:::tabla
  t24[("payments.fee_schedules")]:::tabla
  t26[("payments.payment_splits")]:::tabla
  t28[("payments.gateway_settlements")]:::tabla
  t29[("payments.settlement_lines")]:::tabla
  t31[("payments.payout_items")]:::tabla
  t32[("payments.payouts")]:::tabla
  t34[("payments.provider_reconciliation_records")]:::tabla
  t35[("payments.reconciliation_exceptions")]:::tabla
  t36[("payments.reconciliation_runs")]:::tabla
  subgraph s0["UC-42-01 · Crear intención de pago idempotente"]
    o1["POST /payments/intents"]:::op
  end
  subgraph s1["UC-42-02 · Abrir sesión de checkout con contexto de cajero"]
    o4["POST /payments/checkout-sessions"]:::op
  end
  subgraph s2["UC-42-03 · Bloquear tipo de cambio"]
    o8["POST /payments/intents/{id}/fx-lock"]:::op
  end
  subgraph s3["UC-42-04 · Evaluar riesgo y 3-D Secure"]
    o11["POST /payments/intents/{id}/risk-assessment"]:::op
  end
  subgraph s4["UC-42-05 · Procesar transacción (authorize/capture/sale)"]
    o13["POST /payments/intents/{id}/transactions"]:::op
  end
  subgraph s5["UC-42-06 · Recibir callback del gateway (idempotente)"]
    o15["POST /payments/callbacks/{callbackPath}"]:::op
  end
  subgraph s6["UC-42-07 · Consulta independiente de estado"]
    o18["POST /payments/transactions/{id}/status-inquiry"]:::op
  end
  subgraph s7["UC-42-08 · Reembolso total o parcial"]
    o19["POST /payments/transactions/{id}/refunds"]:::op
  end
  subgraph s8["UC-42-09 · Solicitar anulación"]
    o21["POST /payments/transactions/{id}/cancellation-requests"]:::op
  end
  subgraph s9["UC-42-10 · Publicar versión del tarifario"]
    o23["POST /payments/fee-schedules"]:::op
  end
  subgraph s10["UC-42-11 · Reparto multi-party"]
    o25["POST /payments/intents/{id}/splits"]:::op
  end
  subgraph s11["UC-42-12 · Importar liquidación del gateway"]
    o27["POST /payments/settlements/import"]:::op
  end
  subgraph s12["UC-42-13 · Ejecutar payout a cuenta conectada"]
    o30["POST /payments/payouts"]:::op
  end
  subgraph s13["UC-42-14 · Conciliar gateway vs ledger"]
    o33["POST /payments/reconciliation-runs"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  a2 --> o4
  o4 -->|"CREA"| t5
  o4 -->|"CREA"| t6
  o4 -->|"ACTUALIZA"| t7
  o4 -->|"LEE"| t7
  a9 --> o8
  o8 -->|"CREA"| t10
  o8 -->|"LEE"| t10
  o8 -->|"ACTUALIZA"| t3
  o8 -->|"LEE"| t3
  a9 --> o11
  o11 -->|"ACTUALIZA"| t3
  o11 -->|"LEE"| t3
  o11 -->|"CREA"| t12
  a2 --> o13
  o13 -->|"ACTUALIZA"| t3
  o13 -->|"LEE"| t3
  o13 -->|"CREA"| t14
  o13 -->|"LEE"| t14
  o13 -->|"LEE"| t12
  a16 --> o15
  o15 -->|"ACTUALIZA"| t3
  o15 -->|"LEE"| t3
  o15 -->|"ACTUALIZA"| t14
  o15 -->|"LEE"| t14
  o15 -->|"CREA"| t17
  o15 -->|"LEE"| t17
  a9 --> o18
  o18 -->|"LEE"| t14
  a9 --> o19
  o19 -->|"LEE"| t14
  o19 -->|"CREA"| t20
  o19 -->|"LEE"| t20
  a2 --> o21
  o21 -->|"CREA"| t22
  o21 -->|"LEE"| t14
  a9 --> o23
  o23 -->|"ACTUALIZA"| t24
  o23 -->|"CREA"| t24
  o23 -->|"LEE"| t24
  a9 --> o25
  o25 -->|"LEE"| t3
  o25 -->|"CREA"| t26
  o25 -->|"LEE"| t26
  a9 --> o27
  o27 -->|"CREA"| t28
  o27 -->|"LEE"| t28
  o27 -->|"ACTUALIZA"| t14
  o27 -->|"LEE"| t14
  o27 -->|"CREA"| t29
  a9 --> o30
  o30 -->|"CREA"| t31
  o30 -->|"CREA"| t32
  a9 --> o33
  o33 -->|"LEE"| t14
  o33 -->|"CREA"| t34
  o33 -->|"CREA"| t35
  o33 -->|"ACTUALIZA"| t36
  o33 -->|"CREA"| t36
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Máquinas de estado

### Máquina de estados `TRANSITIONS`

Declarada en `src/modules/payments/services/payment-callback-machine.ts:43`. Los estados llevan el nombre del identificador del código; no se resuelven al catálogo de conceptos.

```mermaid
stateDiagram-v2
  [*] --> TXN_PROCESSING
  [*] --> TXN_VOIDED
  TXN_PROCESSING --> TXN_AUTHORIZED
  TXN_PROCESSING --> TXN_CAPTURED
  TXN_PROCESSING --> TXN_FAILED
  TXN_AUTHORIZED --> TXN_CAPTURED
  TXN_AUTHORIZED --> TXN_FAILED
  TXN_CAPTURED --> TXN_SETTLED
  TXN_FAILED --> [*]
  TXN_SETTLED --> [*]
  TXN_VOIDED --> [*]
```

**Operaciones que ejercen esta máquina** _(POR_REFERENCIA: el handler alcanza un método que valida contra la tabla; «sin destino nombrado» significa que el estado de destino llega por el cuerpo de la petición)_:

| Operación | Estados de destino que nombra | A través de |
|---|---|---|
| PATCH /['insurance/campaigns', 'insurance-campaigns']/{id}/status | sin destino nombrado | InsuranceCampaignsService.changeStatus |
| POST /payments/callbacks/{callbackPath} | sin destino nombrado | PaymentsTransactionsService.applyCallback |

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /payments/callbacks/{callbackPath}

Recibir el callback/webhook del gateway (idempotente)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: Firma del webhook inválida |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No hay transacción para la referencia informada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PaymentsTransactionsService.applyCallback"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PaymentTransactionsRepository.findByGatewayRef"]:::llamada
  n4 --> n5
  n6[("LEE payments.payment_transactions")]:::efecto
  n5 --> n6
  n7{"!transaction"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND No hay transacción para la referencia informada"]):::error
  n7 -->|"sí"| n8
  n9{"!signature || !secrets.some((secret) =› verifySignature(secret, signedBody, signature), )"}:::decision
  n7 -->|"no"| n9
  n10(["401 UNAUTHENTICATED Firma del webhook inválida"]):::error
  n9 -->|"sí"| n10
  n11["Llama a PaymentTransactionsRepository.findWebhookEventByRef"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE payments.payment_webhook_events")]:::efecto
  n11 --> n12
  n13{"!archived"}:::decision
  n12 --> n13
  n14["Llama a PaymentTransactionsRepository.recordWebhookEvent"]:::llamada
  n13 -->|"sí"| n14
  n15[("CREA payments.payment_webhook_events")]:::efecto
  n14 --> n15
  n16[("ACTUALIZA payments.payment_transactions")]:::efecto
  n15 --> n16
  n13 -->|"no"| n16
  n17{"dto.authorizationCode"}:::decision
  n16 --> n17
  n18[("ACTUALIZA payments.payment_transactions")]:::efecto
  n17 -->|"sí"| n18
  n19[("ACTUALIZA payments.payment_transactions")]:::efecto
  n18 --> n19
  n17 -->|"no"| n19
  n20["Llama a PaymentIntentsRepository.findByIdForUpdate"]:::llamada
  n19 --> n20
  n21[("LEE payments.payment_intents")]:::efecto
  n20 --> n21
  n22{"intent"}:::decision
  n21 --> n22
  n23["Llama a PaymentsTransactionsService.intentCaptured"]:::llamada
  n22 -->|"sí"| n23
  n24["Llama a PaymentTransactionsRepository.findByIntent"]:::llamada
  n23 --> n24
  n25[("LEE payments.payment_transactions")]:::efecto
  n24 --> n25
  n26[("ACTUALIZA payments.payment_intents")]:::efecto
  n25 --> n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
  n22 -->|"no"| n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /payments/checkout-sessions

Abrir una sesión de checkout con contexto de cajero

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Deuda no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La deuda ya tiene un checkout abierto; PreconditionFailedException: La deuda ya está saldada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PaymentsCheckoutService.openSession"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PaymentFlowRepository.findDebtForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE payments.payment_debts")]:::efecto
  n5 --> n6
  n7{"!debt"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Deuda no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"debt.statusConceptId === CONCEPTS.DEBT_IN_CHECKOUT"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La deuda ya tiene un checkout abierto"]):::error
  n9 -->|"sí"| n10
  n11{"debt.statusConceptId === CONCEPTS.DEBT_SETTLED"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La deuda ya está saldada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a PaymentFlowRepository.createCheckoutSession"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA payments.payment_checkout_sessions")]:::efecto
  n13 --> n14
  n15{"dto.cashierUserId || dto.cashRegisterId || dto.siteId"}:::decision
  n14 --> n15
  n16["Llama a PaymentFlowRepository.createCashierContext"]:::llamada
  n15 -->|"sí"| n16
  n17[("CREA payments.cashier_payment_contexts")]:::efecto
  n16 --> n17
  n18[("ACTUALIZA payments.payment_debts")]:::efecto
  n17 --> n18
  n15 -->|"no"| n18
  n19(("201 Responde con éxito")):::ok
  n18 --> n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /payments/fee-schedules

Publicar una versión del tarifario

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una tarifa porcentual exige `percentage`; PreconditionFailedException: Una tarifa fija exige `fixedAmount` |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PaymentsOperationsService.createFeeSchedule"]:::llamada
  n2 --> n3
  n4{"dto.method === 'PERCENTAGE' && !dto.percentage"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED Una tarifa porcentual exige `percentage`"]):::error
  n4 -->|"sí"| n5
  n6{"dto.method === 'FIXED' && !dto.fixedAmount"}:::decision
  n4 -->|"no"| n6
  n7(["422 PRECONDITION_FAILED Una tarifa fija exige `fixedAmount`"]):::error
  n6 -->|"sí"| n7
  n8["Transacción: transactional(…)"]:::transaccion
  n6 -->|"no"| n8
  n9["Llama a PaymentOperationsRepository.findFeeScheduleByCode"]:::llamada
  n8 --> n9
  n10[("LEE payments.fee_schedules")]:::efecto
  n9 --> n10
  n11{"current"}:::decision
  n10 --> n11
  n12[("ACTUALIZA payments.fee_schedules")]:::efecto
  n11 -->|"sí"| n12
  n13["Llama a PaymentOperationsRepository.createFeeSchedule"]:::llamada
  n12 --> n13
  n11 -->|"no"| n13
  n14[("CREA payments.fee_schedules")]:::efecto
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

#### 4. POST /payments/intents/{id}/fx-lock

Bloquear el tipo de cambio de la intención

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Intención de pago no encontrada |
| 409 | `CONFLICT` | ConflictException: La intención ya tiene un bloqueo de cambio vigente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El bloqueo de cambio exige monedas distintas; PreconditionFailedException: Solo se puede bloquear el cambio de una intención pendiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PaymentsIntentsService.lockFxRate"]:::llamada
  n2 --> n3
  n4{"dto.fromCurrency === dto.toCurrency"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED El bloqueo de cambio exige monedas distintas"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a PaymentIntentsRepository.findByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE payments.payment_intents")]:::efecto
  n7 --> n8
  n9{"!intent"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Intención de pago no encontrada"]):::error
  n9 -->|"sí"| n10
  n11{"intent.statusConceptId !== CONCEPTS.PI_PENDING"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED Solo se puede bloquear el cambio de una intención pendiente"]):::error
  n11 -->|"sí"| n12
  n13["Llama a PaymentFlowRepository.findActiveFxLock"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE payments.fx_rate_locks")]:::efecto
  n13 --> n14
  n15{"active"}:::decision
  n14 --> n15
  n16(["409 CONFLICT La intención ya tiene un bloqueo de cambio vigente"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PaymentFlowRepository.createFxLock"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA payments.fx_rate_locks")]:::efecto
  n17 --> n18
  n19[("ACTUALIZA payments.payment_intents · ACTUALIZA payments.payment_intents")]:::efecto
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

#### 5. POST /payments/intents/{id}/risk-assessment

Registrar la evaluación de riesgo y 3-D Secure

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Intención de pago no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PaymentsIntentsService.assessRisk"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PaymentIntentsRepository.findByIdForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE payments.payment_intents")]:::efecto
  n5 --> n6
  n7{"!intent"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Intención de pago no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PaymentFlowRepository.createRiskAssessment"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA payments.risk_assessments")]:::efecto
  n9 --> n10
  n11{"dto.decision === 'DECLINE'"}:::decision
  n10 --> n11
  n12[("ACTUALIZA payments.payment_intents")]:::efecto
  n11 -->|"sí"| n12
  n13(("201 Responde con éxito")):::ok
  n12 --> n13
  n11 -->|"no"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /payments/intents/{id}/splits

Repartir el cobro entre cuentas conectadas

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Intención de pago no encontrada |
| 409 | `CONFLICT` | ConflictException: Los repartos superan el importe de la intención |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un reparto por importe exige `amount`; PreconditionFailedException: Un reparto por porcentaje exige `percentage` |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PaymentsIntentsService.addSplit"]:::llamada
  n2 --> n3
  n4{"dto.splitType === 'AMOUNT' && !dto.amount"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED Un reparto por importe exige `amount`"]):::error
  n4 -->|"sí"| n5
  n6{"dto.splitType === 'PERCENTAGE' && !dto.percentage"}:::decision
  n4 -->|"no"| n6
  n7(["422 PRECONDITION_FAILED Un reparto por porcentaje exige `percentage`"]):::error
  n6 -->|"sí"| n7
  n8["Transacción: transactional(…)"]:::transaccion
  n6 -->|"no"| n8
  n9["Llama a PaymentIntentsRepository.findByIdForUpdate"]:::llamada
  n8 --> n9
  n10[("LEE payments.payment_intents")]:::efecto
  n9 --> n10
  n11{"!intent"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Intención de pago no encontrada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a PaymentFlowRepository.findSplitsByIntent"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE payments.payment_splits")]:::efecto
  n13 --> n14
  n15{"allocated + Number(amount) › Number(intent.amount)"}:::decision
  n14 --> n15
  n16(["409 CONFLICT Los repartos superan el importe de la intención"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PaymentFlowRepository.createSplit"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA payments.payment_splits")]:::efecto
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

#### 7. POST /payments/intents/{id}/transactions

Procesar la transacción contra el gateway (authorize/capture)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Intención de pago no encontrada |
| 409 | `CONFLICT` | ConflictException: La intención ya fue cobrada; ConflictException: La intención tiene una operación abierta en el gateway; ConflictException: El importe excede el saldo pendiente de la intención; ConflictException: La captura excede el importe autorizado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La intención está cancelada; PreconditionFailedException: La intención requiere evaluación de riesgo antes de cobrar; PreconditionFailedException: El motor de riesgo rechazó la intención; PreconditionFailedException: El importe a procesar debe ser mayor que cero |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PaymentsTransactionsService.processTransaction"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PaymentIntentsRepository.findByIdForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE payments.payment_intents")]:::efecto
  n5 --> n6
  n7{"!intent"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Intención de pago no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"intent.statusConceptId === CONCEPTS.PI_SUCCEEDED"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT La intención ya fue cobrada"]):::error
  n9 -->|"sí"| n10
  n11{"intent.statusConceptId === CONCEPTS.PI_CANCELED"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La intención está cancelada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a PaymentTransactionsRepository.findPendingByIntent"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE payments.payment_transactions")]:::efecto
  n13 --> n14
  n15{"open && (open.statusConceptId === CONCEPTS.TXN_PROCESSING || dto.operation !== 'CAPTURE')"}:::decision
  n14 --> n15
  n16(["409 CONFLICT La intención tiene una operación abierta en el gateway"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PaymentFlowRepository.findLatestRiskAssessment"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE payments.risk_assessments")]:::efecto
  n17 --> n18
  n19{"!risk"}:::decision
  n18 --> n19
  n20(["422 PRECONDITION_FAILED La intención requiere evaluación de riesgo antes de cobrar"]):::error
  n19 -->|"sí"| n20
  n21{"risk.decisionConceptId === CONCEPTS.RISK_DECLINE"}:::decision
  n19 -->|"no"| n21
  n22(["422 PRECONDITION_FAILED El motor de riesgo rechazó la intención"]):::error
  n21 -->|"sí"| n22
  n23["Llama a PaymentsTransactionsService.intentCaptured"]:::llamada
  n21 -->|"no"| n23
  n24["Llama a PaymentTransactionsRepository.findByIntent"]:::llamada
  n23 --> n24
  n25[("LEE payments.payment_transactions")]:::efecto
  n24 --> n25
  n26{"!isPositiveAmount(requested)"}:::decision
  n25 --> n26
  n27(["422 PRECONDITION_FAILED El importe a procesar debe ser mayor que cero"]):::error
  n26 -->|"sí"| n27
  n28{"compareAmounts(requested, balance) › 0"}:::decision
  n26 -->|"no"| n28
  n29(["409 CONFLICT El importe excede el saldo pendiente de la intención"]):::error
  n28 -->|"sí"| n29
  n30{"dto.operation === 'CAPTURE' && open?.statusConceptId === CONCEPTS.TXN_AUTHORIZED && compareAmounts(requested,…"}:::decision
  n28 -->|"no"| n30
  n31(["409 CONFLICT La captura excede el importe autorizado"]):::error
  n30 -->|"sí"| n31
  n32["Llama a PaymentTransactionsRepository.create"]:::llamada
  n30 -->|"no"| n32
  n33[("CREA payments.payment_transactions")]:::efecto
  n32 --> n33
  n34[("ACTUALIZA payments.payment_intents")]:::efecto
  n33 --> n34
  n35(("201 Responde con éxito")):::ok
  n34 --> n35
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /payments/payouts

Ejecutar un payout a una cuenta conectada

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El importe neto del payout debe ser positivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PaymentsOperationsService.executePayout"]:::llamada
  n2 --> n3
  n4{"total ‹= 0"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED El importe neto del payout debe ser positivo"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a PaymentOperationsRepository.createPayout"]:::llamada
  n6 --> n7
  n8[("CREA payments.payouts")]:::efecto
  n7 --> n8
  n9["Repite: por cada const item de dto.items"]:::bucle
  n8 --> n9
  n10["Llama a PaymentOperationsRepository.createPayoutItem"]:::llamada
  n9 -->|"cada elemento"| n10
  n11[("CREA payments.payout_items")]:::efecto
  n10 --> n11
  n12(("201 Responde con éxito")):::ok
  n11 --> n12
  n9 -->|"al terminar"| n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /payments/reconciliation-runs

Conciliar gateway contra ledger y abrir excepciones

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
  n3["Llama a PaymentsOperationsService.runReconciliation"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PaymentOperationsRepository.createReconciliationRun"]:::llamada
  n4 --> n5
  n6[("CREA payments.reconciliation_runs")]:::efecto
  n5 --> n6
  n7["Repite: por cada const record de dto.providerRecords"]:::bucle
  n6 --> n7
  n8["Llama a PaymentTransactionsRepository.findByGatewayRef"]:::llamada
  n7 -->|"cada elemento"| n8
  n9[("LEE payments.payment_transactions")]:::efecto
  n8 --> n9
  n10["Llama a PaymentOperationsRepository.createReconciliationRecord"]:::llamada
  n9 --> n10
  n11[("CREA payments.provider_reconciliation_records")]:::efecto
  n10 --> n11
  n12{"!isMatch"}:::decision
  n11 --> n12
  n13["Llama a PaymentOperationsRepository.createReconciliationException"]:::llamada
  n12 -->|"sí"| n13
  n14[("CREA payments.reconciliation_exceptions")]:::efecto
  n13 --> n14
  n15{"difference !== 0"}:::decision
  n14 --> n15
  n12 -->|"no"| n15
  n16["Llama a PaymentOperationsRepository.createReconciliationException"]:::llamada
  n15 -->|"sí"| n16
  n17[("CREA payments.reconciliation_exceptions")]:::efecto
  n16 --> n17
  n18[("ACTUALIZA payments.reconciliation_runs · ACTUALIZA payments.reconciliation_runs · ACTUALIZA payments.reconcil…")]:::efecto
  n17 --> n18
  n15 -->|"no"| n18
  n7 -->|"al terminar"| n18
  n19(("201 Responde con éxito")):::ok
  n18 --> n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /payments/settlements/import

Importar la liquidación del gateway

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
  n3["Llama a PaymentsOperationsService.importSettlement"]:::llamada
  n2 --> n3
  n4["Llama a PaymentOperationsRepository.findSettlementByRef"]:::llamada
  n3 --> n4
  n5[("LEE payments.gateway_settlements")]:::efecto
  n4 --> n5
  n6["Transacción: transactional(…)"]:::transaccion
  n5 --> n6
  n7["Llama a PaymentOperationsRepository.createSettlement"]:::llamada
  n6 --> n7
  n8[("CREA payments.gateway_settlements")]:::efecto
  n7 --> n8
  n9["Repite: por cada const line de dto.lines"]:::bucle
  n8 --> n9
  n10["Llama a PaymentOperationsRepository.createSettlementLine"]:::llamada
  n9 -->|"cada elemento"| n10
  n11[("CREA payments.settlement_lines")]:::efecto
  n10 --> n11
  n12{"line.paymentTransactionId"}:::decision
  n11 --> n12
  n13["Llama a PaymentTransactionsRepository.findByIdForUpdate"]:::llamada
  n12 -->|"sí"| n13
  n14[("LEE payments.payment_transactions")]:::efecto
  n13 --> n14
  n15{"transaction"}:::decision
  n14 --> n15
  n16[("ACTUALIZA payments.payment_transactions")]:::efecto
  n15 -->|"sí"| n16
  n17(("201 Responde con éxito")):::ok
  n16 --> n17
  n15 -->|"no"| n17
  n12 -->|"no"| n17
  n9 -->|"al terminar"| n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. POST /payments/transactions/{id}/cancellation-requests

Solicitar la anulación del cobro

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Transacción no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La transacción está liquidada; corresponde un reembolso en vez de una anulación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PaymentsTransactionsService.requestCancellation"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PaymentTransactionsRepository.findByIdForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE payments.payment_transactions")]:::efecto
  n5 --> n6
  n7{"!transaction"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Transacción no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"transaction.statusConceptId === CONCEPTS.TXN_SETTLED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La transacción está liquidada; corresponde un reembolso en vez de una anulación"]):::error
  n9 -->|"sí"| n10
  n11["Llama a PaymentTransactionsRepository.createCancellation"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA payments.payment_cancellation_requests")]:::efecto
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

#### 12. POST /payments/transactions/{id}/refunds

Emitir un reembolso total o parcial

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Transacción no encontrada |
| 409 | `CONFLICT` | ConflictException: El reembolso excede el importe capturado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se puede reembolsar una transacción capturada o liquidada; PreconditionFailedException: El importe del reembolso debe ser mayor que cero |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PaymentsTransactionsService.refund"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PaymentTransactionsRepository.findByIdForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE payments.payment_transactions")]:::efecto
  n5 --> n6
  n7{"!transaction"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Transacción no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"!CAPTURED_STATES.includes(transaction.statusConceptId)"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED Solo se puede reembolsar una transacción capturada o liquidada"]):::error
  n9 -->|"sí"| n10
  n11{"!isPositiveAmount(dto.amount)"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED El importe del reembolso debe ser mayor que cero"]):::error
  n11 -->|"sí"| n12
  n13["Llama a PaymentTransactionsRepository.findRefundsByTransaction"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE payments.refunds")]:::efecto
  n13 --> n14
  n15{"compareAmounts(addAmounts([refunded, dto.amount]), transaction.amount) › 0"}:::decision
  n14 --> n15
  n16(["409 CONFLICT El reembolso excede el importe capturado"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PaymentTransactionsRepository.createRefund"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA payments.refunds")]:::efecto
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

#### 13. POST /payments/transactions/{id}/status-inquiry

Consultar el estado de la transacción en el gateway

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Transacción no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PaymentsTransactionsService.inquireStatus"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PaymentTransactionsRepository.findByIdForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE payments.payment_transactions")]:::efecto
  n5 --> n6
  n7{"!transaction"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Transacción no encontrada"]):::error
  n7 -->|"sí"| n8
  n9(("200 Responde con éxito")):::ok
  n7 -->|"no"| n9
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
| POST /payments/intents | 201, 400, 401, 403, 429 | 2 |
