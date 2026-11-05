<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `promotions`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 20 (19 con decisiones propias, 1 sin ellas)
- Inventario de endpoints del módulo: [promotions](../endpoints/promotions.md)

## Proceso: Módulo 51 — Lealtad, Descuentos, Cupones y Referidos

- **Código:** `promotions` · **Agrupación:** MIXTO · **Operaciones:** 20
- **Actores:** CASHIER · Cualquier sesión válida · MARKETING_MANAGER · MEMBER · PATIENT · PROMOTIONS_ADMIN · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/promotions/README.md`

### Para qué sirve

Programas de lealtad con niveles y ledger de puntos, promociones con reglas de descuento, cupones, redenciones sobre el checkout y programa de referidos.

_Fuente: `src/modules/promotions/README.md:3`_

### Flujo general declarado en el README

```text
programa (draft) ── activar ──> active ── inscripción ──> membresía (active) en nivel base
                                                  │
      ledger append-only  ├─ earn   (+puntos × multiplicador del nivel, expira si ROLLING)
      = fuente de verdad  ├─ redeem (−puntos, nunca por debajo de 0)
                          ├─ expire (barrido, una vez por entrada vencida)
                          └─ adjust (compensación de una reversa)
                                     │
                                     └─ recompute ──> saldo, puntos de por vida y nivel

promoción (draft) ── activar ──> active ── coupons/batch ──> cupones (active)
                                              │
   validate (no muta) ──> ¿sirve? ¿cuánto?    ├─ redemptions ──> redención (applied), uso consumido
                                              └─ checkout/apply-discount ──> redención + importe neto
                                                          │
                                                          └─ reverse ──> reversed, uso liberado
                                                                         + adjust en el ledger

referido (pending) ── qualify ──> qualified + puntos al referidor y al referido
```

_Fuente: `src/modules/promotions/README.md:69`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-51-01` | Programa de lealtad con niveles y reglas | POST /loyalty/programs | PROMOTIONS_ADMIN · MARKETING_MANAGER | MEDIO | 4 |
| `UC-51-02` | Inscribir miembro | POST /loyalty/programs/{id}/memberships | PROMOTIONS_ADMIN · MEMBER | MEDIO | 6 |
| `UC-51-03` | Acumular puntos (idempotente) | POST /loyalty/memberships/{id}/points/earn | SYSTEM · PROMOTIONS_ADMIN | MEDIO | 6 |
| `UC-51-04` | Canjear puntos (idempotente) | POST /loyalty/memberships/{id}/points/redeem | MEMBER · PROMOTIONS_ADMIN | MEDIO | 4 |
| `UC-51-05` | Reproyectar saldo y nivel | POST /loyalty/memberships/{id}/recompute | SYSTEM · PROMOTIONS_ADMIN | BAJO | 4 |
| `UC-51-06` | Barrido de puntos vencidos | POST /loyalty/jobs/expire-points | SYSTEM | MEDIO | 5 |
| `UC-51-07` | Promoción con reglas de descuento | POST /promotions | PROMOTIONS_ADMIN · MARKETING_MANAGER | MEDIO | 3 |
| `UC-51-08` | Emitir lote de cupones | POST /promotions/{id}/coupons/batch | PROMOTIONS_ADMIN · MARKETING_MANAGER | MEDIO | 3 |
| `UC-51-09` | Validar y redimir cupón | POST /coupons/validate | CASHIER · PROMOTIONS_ADMIN | BAJO | 4 |
|  |  | POST /redemptions | CASHIER · PROMOTIONS_ADMIN | MEDIO | 5 |
| `UC-51-10` | Descuento en checkout | POST /checkout/{orderId}/apply-discount | CASHIER · PROMOTIONS_ADMIN | MEDIO | 6 |
| `UC-51-11` | Revertir redención | POST /redemptions/{id}/reverse | CASHIER · PROMOTIONS_ADMIN | MEDIO | 10 |
| `UC-51-12` | Generar código de referido | POST /referral-programs/{id}/referrals | MEMBER · PROMOTIONS_ADMIN | MEDIO | 3 |
| `UC-51-13` | Calificar y recompensar | POST /referrals/{id}/qualify | SYSTEM · PROMOTIONS_ADMIN | MEDIO | 13 |
| `ctrl:LoyaltyController` | Operaciones de LoyaltyController que el README no asigna a un caso de uso | DESCONOCIDO / | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /loyalty/me | PATIENT | BAJO | 3 |
|  |  | GET /loyalty/me/points | PATIENT | BAJO | 3 |
|  |  | POST /loyalty/me/points/redeem | PATIENT | MEDIO | 4 |
|  |  | GET /loyalty/programs | SYSTEM · PROMOTIONS_ADMIN · MARKETING_MANAGER | BAJO | 1 |
| `ctrl:PromotionsController` | Operaciones de PromotionsController que el README no asigna a un caso de uso | GET /promotions/me | PATIENT | BAJO | 4 |

### Diagrama — etapas `UC-51-01`, `UC-51-02`, `UC-51-03`…

```mermaid
flowchart LR
  a2(["PROMOTIONS_ADMIN · MARKETING_MANAGER"]):::actor
  a7(["PROMOTIONS_ADMIN · MEMBER"]):::actor
  a11(["SYSTEM · PROMOTIONS_ADMIN"]):::actor
  a13(["MEMBER · PROMOTIONS_ADMIN"]):::actor
  a16(["SYSTEM"]):::actor
  a23(["CASHIER · PROMOTIONS_ADMIN"]):::actor
  a37(["Cualquier sesión válida"]):::actor
  a39(["PATIENT"]):::actor
  a43(["SYSTEM · PROMOTIONS_ADMIN · MARKETING_MANAGER"]):::actor
  t3[("promotions.earning_rules")]:::tabla
  t4[("promotions.loyalty_programs")]:::tabla
  t5[("promotions.loyalty_tiers")]:::tabla
  t8[("promotions.loyalty_memberships")]:::tabla
  t9[("promotions.points_ledger_entries")]:::tabla
  t18[("promotions.discount_rules")]:::tabla
  t19[("promotions.promotions")]:::tabla
  t21[("promotions.coupons")]:::tabla
  t24[("promotions.redemptions")]:::tabla
  t30[("promotions.member_referrals")]:::tabla
  t31[("promotions.referral_programs")]:::tabla
  t33[("payments.wallet_ledger_entries")]:::tabla
  t34[("payments.wallets")]:::tabla
  t45[("terminology.catalog_concepts")]:::tabla
  subgraph s0["UC-51-01 · Programa de lealtad con niveles y reglas"]
    o1["POST /loyalty/programs"]:::op
  end
  subgraph s1["UC-51-02 · Inscribir miembro"]
    o6["POST /loyalty/programs/{id}/memberships"]:::op
  end
  subgraph s2["UC-51-03 · Acumular puntos (idempotente)"]
    o10["POST /loyalty/memberships/{id}/points/earn"]:::op
  end
  subgraph s3["UC-51-04 · Canjear puntos (idempotente)"]
    o12["POST /loyalty/memberships/{id}/points/redeem"]:::op
  end
  subgraph s4["UC-51-05 · Reproyectar saldo y nivel"]
    o14["POST /loyalty/memberships/{id}/recompute"]:::op
  end
  subgraph s5["UC-51-06 · Barrido de puntos vencidos"]
    o15["POST /loyalty/jobs/expire-points"]:::op
  end
  subgraph s6["UC-51-07 · Promoción con reglas de descuento"]
    o17["POST /promotions"]:::op
  end
  subgraph s7["UC-51-08 · Emitir lote de cupones"]
    o20["POST /promotions/{id}/coupons/batch"]:::op
  end
  subgraph s8["UC-51-09 · Validar y redimir cupón"]
    o22["POST /coupons/validate"]:::op
    o25["POST /redemptions"]:::op
  end
  subgraph s9["UC-51-10 · Descuento en checkout"]
    o26["POST /checkout/{orderId}/apply-discount"]:::op
  end
  t28[("+4 tablas más")]
  subgraph s10["UC-51-11 · Revertir redención"]
    o27["POST /redemptions/{id}/reverse"]:::op
  end
  subgraph s11["UC-51-12 · Generar código de referido"]
    o29["POST /referral-programs/{id}/referrals"]:::op
  end
  t35[("+7 tablas más")]
  subgraph s12["UC-51-13 · Calificar y recompensar"]
    o32["POST /referrals/{id}/qualify"]:::op
  end
  subgraph s13["ctrl:LoyaltyController · Operaciones de LoyaltyController que el README no asig…"]
    o36["DESCONOCIDO /"]:::op
    o38["GET /loyalty/me"]:::op
    o40["GET /loyalty/me/points"]:::op
    o41["POST /loyalty/me/points/redeem"]:::op
    o42["GET /loyalty/programs"]:::op
  end
  subgraph s14["ctrl:PromotionsController · Operaciones de PromotionsController que el README n…"]
    o44["GET /promotions/me"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"CREA"| t4
  o1 -->|"LEE"| t4
  o1 -->|"CREA"| t5
  a7 --> o6
  o6 -->|"ACTUALIZA"| t8
  o6 -->|"CREA"| t8
  o6 -->|"LEE"| t8
  o6 -->|"LEE"| t4
  o6 -->|"LEE"| t5
  o6 -->|"CREA"| t9
  a11 --> o10
  o10 -->|"LEE"| t3
  o10 -->|"LEE"| t8
  o10 -->|"LEE"| t4
  o10 -->|"LEE"| t5
  o10 -->|"CREA"| t9
  o10 -->|"LEE"| t9
  a13 --> o12
  o12 -->|"LEE"| t8
  o12 -->|"LEE"| t4
  o12 -->|"CREA"| t9
  o12 -->|"LEE"| t9
  a11 --> o14
  o14 -->|"LEE"| t8
  o14 -->|"LEE"| t4
  o14 -->|"LEE"| t5
  o14 -->|"LEE"| t9
  a16 --> o15
  o15 -->|"ACTUALIZA"| t8
  o15 -->|"LEE"| t8
  o15 -->|"LEE"| t4
  o15 -->|"CREA"| t9
  o15 -->|"LEE"| t9
  a2 --> o17
  o17 -->|"CREA"| t18
  o17 -->|"CREA"| t19
  o17 -->|"LEE"| t19
  a2 --> o20
  o20 -->|"CREA"| t21
  o20 -->|"LEE"| t21
  o20 -->|"LEE"| t19
  a23 --> o22
  o22 -->|"LEE"| t21
  o22 -->|"LEE"| t18
  o22 -->|"LEE"| t19
  o22 -->|"LEE"| t24
  a23 --> o25
  o25 -->|"LEE"| t21
  o25 -->|"LEE"| t18
  o25 -->|"LEE"| t19
  o25 -->|"CREA"| t24
  o25 -->|"LEE"| t24
  a23 --> o26
  o26 -->|"ACTUALIZA"| t21
  o26 -->|"LEE"| t21
  o26 -->|"LEE"| t18
  o26 -->|"LEE"| t19
  o26 -->|"CREA"| t24
  o26 -->|"LEE"| t24
  a23 --> o27
  o27 -->|"ACTUALIZA"| t21
  o27 -->|"LEE"| t21
  o27 -->|"ACTUALIZA"| t8
  o27 -->|"LEE"| t8
  o27 -->|"LEE"| t4
  o27 -->|"CREA"| t9
  o27 -.-> t28
  a13 --> o29
  o29 -->|"CREA"| t30
  o29 -->|"LEE"| t30
  o29 -->|"LEE"| t31
  a11 --> o32
  o32 -->|"CREA"| t33
  o32 -->|"LEE"| t33
  o32 -->|"ACTUALIZA"| t34
  o32 -->|"CREA"| t34
  o32 -->|"LEE"| t34
  o32 -->|"LEE"| t8
  o32 -.-> t35
  a37 --> o36
  a39 --> o38
  o38 -->|"LEE"| t8
  o38 -->|"LEE"| t4
  o38 -->|"LEE"| t5
  a39 --> o40
  o40 -->|"LEE"| t8
  o40 -->|"LEE"| t4
  o40 -->|"LEE"| t9
  a39 --> o41
  o41 -->|"LEE"| t8
  o41 -->|"LEE"| t4
  o41 -->|"CREA"| t9
  o41 -->|"LEE"| t9
  a43 --> o42
  o42 -->|"LEE"| t4
  a39 --> o44
  o44 -->|"LEE"| t21
  o44 -->|"LEE"| t18
  o44 -->|"LEE"| t19
  o44 -->|"LEE"| t45
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. DESCONOCIDO /

El tenant del contexto, que acota el programa del portal. Mismo criterio que el listado de programas: sin `X-Tenant-Id` no se sabe de qué programa se está hablando, y elegir uno por nosotros sería inventar.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Se requiere X-Tenant-Id para operar sobre la membresía de lealtad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3{"!tenantId"}:::decision
  n2 --> n3
  n4(["422 PRECONDITION_FAILED Se requiere X-Tenant-Id para operar sobre la membresía de lealtad"]):::error
  n3 -->|"sí"| n4
  n5(("200 Responde con éxito")):::ok
  n3 -->|"no"| n5
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /checkout/{orderId}/apply-discount

Aplicar un descuento al intento de pago del checkout

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay que indicar el cupón o la promoción automática a aplicar; PreconditionFailedException: {rejection}; PreconditionFailedException: Ninguna regla aplica al importe de la orden; PreconditionFailedException: La promoción alcanzó su límite de redenciones; PreconditionFailedException: El usuario alcanzó su límite de redenciones en la promoción; PreconditionFailedException: La promoción agotó su presupuesto; PreconditionFailedException: La promoción no está activa; PreconditionFailedException: La promoción está fuera de vigencia; PreconditionFailedException: Ninguna regla de la promoción aplica al importe de la orden |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsDiscountsService.applyDiscount"]:::llamada
  n2 --> n3
  n4{"!dto.couponCode && !dto.promotionId"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED Hay que indicar el cupón o la promoción automática a aplicar"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7{"dto.couponCode"}:::decision
  n6 --> n7
  n8["Llama a PromotionsDiscountsService.evaluateCouponForUpdate"]:::llamada
  n7 -->|"sí"| n8
  n9["Llama a PromotionsDiscountsRepository.findCouponByCode"]:::llamada
  n8 --> n9
  n10[("LEE promotions.coupons")]:::efecto
  n9 --> n10
  n11["Llama a PromotionsDiscountsRepository.findPromotionById"]:::llamada
  n10 --> n11
  n12[("LEE promotions.promotions")]:::efecto
  n11 --> n12
  n13["Llama a PromotionsDiscountsRepository.findCouponByCodeForUpdate"]:::llamada
  n12 --> n13
  n14[("LEE promotions.coupons")]:::efecto
  n13 --> n14
  n15{"!coupon"}:::decision
  n14 --> n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PromotionsDiscountsRepository.findPromotionForUpdate"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE promotions.promotions")]:::efecto
  n17 --> n18
  n19{"!promotion"}:::decision
  n18 --> n19
  n20(["↩ (relanza el error capturado)"]):::error
  n19 -->|"sí"| n20
  n21{"rejection"}:::decision
  n19 -->|"no"| n21
  n22(["422 PRECONDITION_FAILED {rejection}"]):::error
  n21 -->|"sí"| n22
  n23["Llama a PromotionsDiscountsRepository.findRulesByPromotion"]:::llamada
  n21 -->|"no"| n23
  n24[("LEE promotions.discount_rules")]:::efecto
  n23 --> n24
  n25{"!best"}:::decision
  n24 --> n25
  n26(["422 PRECONDITION_FAILED Ninguna regla aplica al importe de la orden"]):::error
  n25 -->|"sí"| n26
  n27["Llama a PromotionsDiscountsService.assertLimits"]:::llamada
  n25 -->|"no"| n27
  n28["Llama a PromotionsDiscountsRepository.findAppliedRedemptions"]:::llamada
  n27 --> n28
  n29[("LEE promotions.redemptions")]:::efecto
  n28 --> n29
  n30{"promotion.totalRedemptionLimit && applied.length ›= promotion.totalRedemptionLimit"}:::decision
  n29 --> n30
  n31(["422 PRECONDITION_FAILED La promoción alcanzó su límite de redenciones"]):::error
  n30 -->|"sí"| n31
  n32{"promotion.perUserLimit"}:::decision
  n30 -->|"no"| n32
  n33{"mine.length ›= promotion.perUserLimit"}:::decision
  n32 -->|"sí"| n33
  n34(["422 PRECONDITION_FAILED El usuario alcanzó su límite de redenciones en la promoción"]):::error
  n33 -->|"sí"| n34
  n35{"promotion.budgetAmount"}:::decision
  n33 -->|"no"| n35
  n32 -->|"no"| n35
  n36{"consumed ›= Number(promotion.budgetAmount)"}:::decision
  n35 -->|"sí"| n36
  n37(["422 PRECONDITION_FAILED La promoción agotó su presupuesto"]):::error
  n36 -->|"sí"| n37
  n38["Llama a PromotionsDiscountsRepository.findPromotionById"]:::llamada
  n7 -->|"no"| n38
  n39[("LEE promotions.promotions")]:::efecto
  n38 --> n39
  n40["Llama a PromotionsDiscountsRepository.findPromotionForUpdate"]:::llamada
  n39 --> n40
  n41[("LEE promotions.promotions")]:::efecto
  n40 --> n41
  n42{"!found"}:::decision
  n41 --> n42
  n43(["↩ (relanza el error capturado)"]):::error
  n42 -->|"sí"| n43
  n44["Llama a PromotionsDiscountsService.assertPromotionUsable"]:::llamada
  n42 -->|"no"| n44
  n45{"promotion.statusConceptId !== CONCEPTS.PROMOTION_ACTIVE"}:::decision
  n44 --> n45
  n46(["422 PRECONDITION_FAILED La promoción no está activa"]):::error
  n45 -->|"sí"| n46
  n47{"(promotion.validFrom && promotion.validFrom › now) || (promotion.validTo && promotion.validTo ‹ now)"}:::decision
  n45 -->|"no"| n47
  n48(["422 PRECONDITION_FAILED La promoción está fuera de vigencia"]):::error
  n47 -->|"sí"| n48
  n49["Llama a PromotionsDiscountsRepository.findRulesByPromotion"]:::llamada
  n47 -->|"no"| n49
  n50[("LEE promotions.discount_rules")]:::efecto
  n49 --> n50
  n51{"!best"}:::decision
  n50 --> n51
  n52(["422 PRECONDITION_FAILED Ninguna regla de la promoción aplica al importe de la orden"]):::error
  n51 -->|"sí"| n52
  n53["Llama a PromotionsDiscountsService.assertLimits"]:::llamada
  n51 -->|"no"| n53
  n54["Llama a PromotionsDiscountsRepository.findAppliedRedemptions"]:::llamada
  n53 --> n54
  n55[("LEE promotions.redemptions")]:::efecto
  n54 --> n55
  n56{"promotion.totalRedemptionLimit && applied.length ›= promotion.totalRedemptionLimit"}:::decision
  n55 --> n56
  n57(["422 PRECONDITION_FAILED La promoción alcanzó su límite de redenciones"]):::error
  n56 -->|"sí"| n57
  n58{"promotion.perUserLimit"}:::decision
  n56 -->|"no"| n58
  n59{"mine.length ›= promotion.perUserLimit"}:::decision
  n58 -->|"sí"| n59
  n60(["422 PRECONDITION_FAILED El usuario alcanzó su límite de redenciones en la promoción"]):::error
  n59 -->|"sí"| n60
  n61{"promotion.budgetAmount"}:::decision
  n59 -->|"no"| n61
  n58 -->|"no"| n61
  n62{"consumed ›= Number(promotion.budgetAmount)"}:::decision
  n61 -->|"sí"| n62
  n63(["422 PRECONDITION_FAILED La promoción agotó su presupuesto"]):::error
  n62 -->|"sí"| n63
  n64["Llama a PromotionsDiscountsRepository.findRedemptionByIntent"]:::llamada
  n36 -->|"no"| n64
  n35 -->|"no"| n64
  n62 -->|"no"| n64
  n61 -->|"no"| n64
  n65[("LEE promotions.redemptions")]:::efecto
  n64 --> n65
  n66{"coupon"}:::decision
  n65 --> n66
  n67[("ACTUALIZA promotions.coupons")]:::efecto
  n66 -->|"sí"| n67
  n68{"coupon.maxRedemptions && coupon.redemptionCount ›= coupon.maxRedemptions"}:::decision
  n67 --> n68
  n69[("ACTUALIZA promotions.coupons")]:::efecto
  n68 -->|"sí"| n69
  n70["Llama a PromotionsDiscountsRepository.createRedemption"]:::llamada
  n69 --> n70
  n68 -->|"no"| n70
  n66 -->|"no"| n70
  n71["… el resto del árbol (1 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /loyalty/jobs/expire-points

Barrer los puntos vencidos de un programa

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
  n3["Llama a PromotionsLoyaltyService.expirePoints"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"scope !== undefined"}:::decision
  n4 --> n5
  n6["Llama a PromotionsLoyaltyService.loadProgramInScope"]:::llamada
  n5 -->|"sí"| n6
  n7["Llama a PromotionsLoyaltyRepository.findProgramById"]:::llamada
  n6 --> n7
  n8[("LEE promotions.loyalty_programs")]:::efecto
  n7 --> n8
  n9["Llama a PromotionsLoyaltyRepository.findMembershipsForSweep"]:::llamada
  n8 --> n9
  n5 -->|"no"| n9
  n10[("LEE promotions.loyalty_memberships")]:::efecto
  n9 --> n10
  n11["Repite: por cada const membership de memberships"]:::bucle
  n10 --> n11
  n12["Llama a PromotionsLoyaltyRepository.findExpirableEntries"]:::llamada
  n11 -->|"cada elemento"| n12
  n13[("LEE promotions.points_ledger_entries")]:::efecto
  n12 --> n13
  n14["Repite: por cada const entry de expirable"]:::bucle
  n13 --> n14
  n15["Llama a PromotionsLoyaltyRepository.findLedgerEntryByKey"]:::llamada
  n14 -->|"cada elemento"| n15
  n16[("LEE promotions.points_ledger_entries")]:::efecto
  n15 --> n16
  n17{"await this.loyaltyRepo.findLedgerEntryByKey(tx, key)"}:::decision
  n16 --> n17
  n18["Llama a PromotionsLoyaltyRepository.findLedgerEntryByKey"]:::llamada
  n17 -->|"sí"| n18
  n19[("LEE promotions.points_ledger_entries")]:::efecto
  n18 --> n19
  n20["Llama a PromotionsLoyaltyRepository.createLedgerEntry"]:::llamada
  n19 --> n20
  n17 -->|"no"| n20
  n21[("CREA promotions.points_ledger_entries")]:::efecto
  n20 --> n21
  n22{"membershipExpired › 0"}:::decision
  n21 --> n22
  n14 -->|"al terminar"| n22
  n23[("ACTUALIZA promotions.loyalty_memberships")]:::efecto
  n22 -->|"sí"| n23
  n24(("200 Responde con éxito")):::ok
  n23 --> n24
  n22 -->|"no"| n24
  n11 -->|"al terminar"| n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. GET /loyalty/me

Mi membresía de lealtad y mi saldo de puntos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene perfil de paciente; PreconditionFailedException: Se requiere X-Tenant-Id para operar sobre la membresía de lealtad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsLoyaltyService.myLoyalty"]:::llamada
  n2 --> n3
  n4["Llama a PromotionsLoyaltyService.requireOwnPatientProfileId"]:::llamada
  n3 --> n4
  n5{"!patientProfileId"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED La cuenta no tiene perfil de paciente"]):::error
  n5 -->|"sí"| n6
  n7["Llama a PromotionsLoyaltyService.findOwnMembership"]:::llamada
  n5 -->|"no"| n7
  n8["Llama a PromotionsLoyaltyRepository.findActivePrograms"]:::llamada
  n7 --> n8
  n9[("LEE promotions.loyalty_programs")]:::efecto
  n8 --> n9
  n10["Llama a PromotionsLoyaltyRepository.findMembershipsByMemberRef"]:::llamada
  n9 --> n10
  n11[("LEE promotions.loyalty_memberships")]:::efecto
  n10 --> n11
  n12["Llama a PromotionsLoyaltyRepository.findTiersByProgram"]:::llamada
  n11 --> n12
  n13[("LEE promotions.loyalty_tiers")]:::efecto
  n12 --> n13
  n14["Llama a LoyaltyController.requireTenant"]:::llamada
  n13 --> n14
  n15{"!tenantId"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED Se requiere X-Tenant-Id para operar sobre la membresía de lealtad"]):::error
  n15 -->|"sí"| n16
  n17(("200 Responde con éxito")):::ok
  n15 -->|"no"| n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. GET /loyalty/me/points

Mis movimientos de puntos, más nuevos primero

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene perfil de paciente; PreconditionFailedException: Cursor de movimientos inválido; PreconditionFailedException: Se requiere X-Tenant-Id para operar sobre la membresía de lealtad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsLoyaltyService.myPointsLedger"]:::llamada
  n2 --> n3
  n4["Llama a PromotionsLoyaltyService.requireOwnPatientProfileId"]:::llamada
  n3 --> n4
  n5{"!patientProfileId"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED La cuenta no tiene perfil de paciente"]):::error
  n5 -->|"sí"| n6
  n7["Llama a PromotionsLoyaltyService.findOwnMembership"]:::llamada
  n5 -->|"no"| n7
  n8["Llama a PromotionsLoyaltyRepository.findActivePrograms"]:::llamada
  n7 --> n8
  n9[("LEE promotions.loyalty_programs")]:::efecto
  n8 --> n9
  n10["Llama a PromotionsLoyaltyRepository.findMembershipsByMemberRef"]:::llamada
  n9 --> n10
  n11[("LEE promotions.loyalty_memberships")]:::efecto
  n10 --> n11
  n12["Llama a PromotionsLoyaltyService.decodeLedgerCursor"]:::llamada
  n11 --> n12
  n13{"typeof recordedAt !== 'string' || typeof id !== 'string'"}:::decision
  n12 --> n13
  n14(["422 PRECONDITION_FAILED Cursor de movimientos inválido"]):::error
  n13 -->|"sí"| n14
  n15{"Number.isNaN(date.getTime())"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED Cursor de movimientos inválido"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PromotionsLoyaltyRepository.findLedgerPageByMembership"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE promotions.points_ledger_entries")]:::efecto
  n17 --> n18
  n19["Llama a LoyaltyController.requireTenant"]:::llamada
  n18 --> n19
  n20{"!tenantId"}:::decision
  n19 --> n20
  n21(["422 PRECONDITION_FAILED Se requiere X-Tenant-Id para operar sobre la membresía de lealtad"]):::error
  n20 -->|"sí"| n21
  n22(("200 Responde con éxito")):::ok
  n20 -->|"no"| n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /loyalty/me/points/redeem

Canjear puntos de mi propia membresía

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La clave de idempotencia pertenece a otro canje; ConflictException: La clave de idempotencia pertenece a otro movimiento |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene perfil de paciente; PreconditionFailedException: No tiene una membresía de lealtad en este programa; PreconditionFailedException: El canje debe ser de puntos positivos; PreconditionFailedException: La membresía no está activa; PreconditionFailedException: Saldo de puntos insuficiente; PreconditionFailedException: Se requiere X-Tenant-Id para operar sobre la membresía de lealtad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsLoyaltyService.redeemOwnPoints"]:::llamada
  n2 --> n3
  n4["Llama a PromotionsLoyaltyService.requireOwnPatientProfileId"]:::llamada
  n3 --> n4
  n5{"!patientProfileId"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED La cuenta no tiene perfil de paciente"]):::error
  n5 -->|"sí"| n6
  n7["Llama a PromotionsLoyaltyService.findOwnMembership"]:::llamada
  n5 -->|"no"| n7
  n8["Llama a PromotionsLoyaltyRepository.findActivePrograms"]:::llamada
  n7 --> n8
  n9[("LEE promotions.loyalty_programs")]:::efecto
  n8 --> n9
  n10["Llama a PromotionsLoyaltyRepository.findMembershipsByMemberRef"]:::llamada
  n9 --> n10
  n11[("LEE promotions.loyalty_memberships")]:::efecto
  n10 --> n11
  n12{"!own"}:::decision
  n11 --> n12
  n13(["422 PRECONDITION_FAILED No tiene una membresía de lealtad en este programa"]):::error
  n12 -->|"sí"| n13
  n14["Llama a PromotionsLoyaltyRepository.findLedgerEntryByKey"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE promotions.points_ledger_entries")]:::efecto
  n14 --> n15
  n16{"previous && previous.loyaltyMembershipId !== own.membership.id"}:::decision
  n15 --> n16
  n17(["409 CONFLICT La clave de idempotencia pertenece a otro canje"]):::error
  n16 -->|"sí"| n17
  n18["Llama a PromotionsLoyaltyService.redeemPoints"]:::llamada
  n16 -->|"no"| n18
  n19{"Number(dto.points) ‹= 0"}:::decision
  n18 --> n19
  n20(["422 PRECONDITION_FAILED El canje debe ser de puntos positivos"]):::error
  n19 -->|"sí"| n20
  n21["Transacción: transactional(…)"]:::transaccion
  n19 -->|"no"| n21
  n22["Llama a PromotionsLoyaltyService.lockMembershipInScope"]:::llamada
  n21 --> n22
  n23["Llama a PromotionsLoyaltyRepository.findMembershipById"]:::llamada
  n22 --> n23
  n24[("LEE promotions.loyalty_memberships")]:::efecto
  n23 --> n24
  n25["Llama a PromotionsLoyaltyRepository.findProgramById"]:::llamada
  n24 --> n25
  n26[("LEE promotions.loyalty_programs")]:::efecto
  n25 --> n26
  n27{"!unlocked || !program"}:::decision
  n26 --> n27
  n28(["↩ (relanza el error capturado)"]):::error
  n27 -->|"sí"| n28
  n29["Llama a PromotionsLoyaltyRepository.findMembershipForUpdate"]:::llamada
  n27 -->|"no"| n29
  n30[("LEE promotions.loyalty_memberships")]:::efecto
  n29 --> n30
  n31{"!membership"}:::decision
  n30 --> n31
  n32(["↩ (relanza el error capturado)"]):::error
  n31 -->|"sí"| n32
  n33{"!this.mayActOnAnyMembership(actor, scope)"}:::decision
  n31 -->|"no"| n33
  n34["Llama a PromotionsLoyaltyService.assertOwnMembership"]:::llamada
  n33 -->|"sí"| n34
  n35{"!owner"}:::decision
  n34 --> n35
  n36(["↩ (relanza el error capturado)"]):::error
  n35 -->|"sí"| n36
  n37["Llama a PromotionsLoyaltyRepository.findLedgerEntryByKey"]:::llamada
  n35 -->|"no"| n37
  n33 -->|"no"| n37
  n38[("LEE promotions.points_ledger_entries")]:::efecto
  n37 --> n38
  n39{"previous"}:::decision
  n38 --> n39
  n40["Llama a PromotionsLoyaltyService.replayLedgerEntry"]:::llamada
  n39 -->|"sí"| n40
  n41{"previous.loyaltyMembershipId !== membership.id"}:::decision
  n40 --> n41
  n42(["409 CONFLICT La clave de idempotencia pertenece a otro movimiento"]):::error
  n41 -->|"sí"| n42
  n43{"membership.statusConceptId !== CONCEPTS.MEMBERSHIP_ACTIVE"}:::decision
  n41 -->|"no"| n43
  n39 -->|"no"| n43
  n44(["422 PRECONDITION_FAILED La membresía no está activa"]):::error
  n43 -->|"sí"| n44
  n45{"balance ‹ Number(dto.points)"}:::decision
  n43 -->|"no"| n45
  n46(["422 PRECONDITION_FAILED Saldo de puntos insuficiente"]):::error
  n45 -->|"sí"| n46
  n47["Llama a PromotionsLoyaltyRepository.createLedgerEntry"]:::llamada
  n45 -->|"no"| n47
  n48[("CREA promotions.points_ledger_entries")]:::efecto
  n47 --> n48
  n49["Llama a LoyaltyController.requireTenant"]:::llamada
  n48 --> n49
  n50{"!tenantId"}:::decision
  n49 --> n50
  n51(["422 PRECONDITION_FAILED Se requiere X-Tenant-Id para operar sobre la membresía de lealtad"]):::error
  n50 -->|"sí"| n51
  n52(("201 Responde con éxito")):::ok
  n50 -->|"no"| n52
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /loyalty/memberships/{id}/points/earn

Acumular puntos por un evento de la aplicación

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La clave de idempotencia pertenece a otro movimiento |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La membresía no está activa; PreconditionFailedException: La regla pertenece a otro programa; PreconditionFailedException: La regla de acumulación no está activa; PreconditionFailedException: La regla de acumulación está fuera de vigencia; PreconditionFailedException: La regla no otorga puntos; PreconditionFailedException: La regla alcanzó su tope en el periodo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsLoyaltyService.earnPoints"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PromotionsLoyaltyService.lockMembershipInScope"]:::llamada
  n4 --> n5
  n6["Llama a PromotionsLoyaltyRepository.findMembershipById"]:::llamada
  n5 --> n6
  n7[("LEE promotions.loyalty_memberships")]:::efecto
  n6 --> n7
  n8["Llama a PromotionsLoyaltyRepository.findProgramById"]:::llamada
  n7 --> n8
  n9[("LEE promotions.loyalty_programs")]:::efecto
  n8 --> n9
  n10{"!unlocked || !program"}:::decision
  n9 --> n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12["Llama a PromotionsLoyaltyRepository.findMembershipForUpdate"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE promotions.loyalty_memberships")]:::efecto
  n12 --> n13
  n14{"!membership"}:::decision
  n13 --> n14
  n15(["↩ (relanza el error capturado)"]):::error
  n14 -->|"sí"| n15
  n16["Llama a PromotionsLoyaltyRepository.findLedgerEntryByKey"]:::llamada
  n14 -->|"no"| n16
  n17[("LEE promotions.points_ledger_entries")]:::efecto
  n16 --> n17
  n18{"previous"}:::decision
  n17 --> n18
  n19["Llama a PromotionsLoyaltyService.replayLedgerEntry"]:::llamada
  n18 -->|"sí"| n19
  n20{"previous.loyaltyMembershipId !== membership.id"}:::decision
  n19 --> n20
  n21(["409 CONFLICT La clave de idempotencia pertenece a otro movimiento"]):::error
  n20 -->|"sí"| n21
  n22{"membership.statusConceptId !== CONCEPTS.MEMBERSHIP_ACTIVE"}:::decision
  n20 -->|"no"| n22
  n18 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED La membresía no está activa"]):::error
  n22 -->|"sí"| n23
  n24["Llama a PromotionsLoyaltyRepository.findEarningRuleById"]:::llamada
  n22 -->|"no"| n24
  n25[("LEE promotions.earning_rules")]:::efecto
  n24 --> n25
  n26{"!rule"}:::decision
  n25 --> n26
  n27(["↩ (relanza el error capturado)"]):::error
  n26 -->|"sí"| n27
  n28{"rule.loyaltyProgramId !== membership.loyaltyProgramId"}:::decision
  n26 -->|"no"| n28
  n29["Llama a PromotionsLoyaltyService.loadProgramInScope"]:::llamada
  n28 -->|"sí"| n29
  n30["Llama a PromotionsLoyaltyRepository.findProgramById"]:::llamada
  n29 --> n30
  n31[("LEE promotions.loyalty_programs")]:::efecto
  n30 --> n31
  n32(["422 PRECONDITION_FAILED La regla pertenece a otro programa"]):::error
  n31 --> n32
  n33{"!rule.isActive"}:::decision
  n28 -->|"no"| n33
  n34(["422 PRECONDITION_FAILED La regla de acumulación no está activa"]):::error
  n33 -->|"sí"| n34
  n35{"(rule.validFrom && rule.validFrom › now) || (rule.validTo && rule.validTo ‹ now)"}:::decision
  n33 -->|"no"| n35
  n36(["422 PRECONDITION_FAILED La regla de acumulación está fuera de vigencia"]):::error
  n35 -->|"sí"| n36
  n37{"!rule.pointsAmount || Number(rule.pointsAmount) ‹= 0"}:::decision
  n35 -->|"no"| n37
  n38(["422 PRECONDITION_FAILED La regla no otorga puntos"]):::error
  n37 -->|"sí"| n38
  n39["Llama a PromotionsLoyaltyService.assertUnderCap"]:::llamada
  n37 -->|"no"| n39
  n40["Llama a PromotionsLoyaltyRepository.findEarnEntriesInPeriod"]:::llamada
  n39 --> n40
  n41[("LEE promotions.points_ledger_entries")]:::efecto
  n40 --> n41
  n42{"entries.length ›= capPerPeriod"}:::decision
  n41 --> n42
  n43(["422 PRECONDITION_FAILED La regla alcanzó su tope en el periodo"]):::error
  n42 -->|"sí"| n43
  n44["Llama a PromotionsLoyaltyRepository.findTiersByProgram"]:::llamada
  n42 -->|"no"| n44
  n45[("LEE promotions.loyalty_tiers")]:::efecto
  n44 --> n45
  n46["Llama a PromotionsLoyaltyRepository.createLedgerEntry"]:::llamada
  n45 --> n46
  n47[("CREA promotions.points_ledger_entries")]:::efecto
  n46 --> n47
  n48(("201 Responde con éxito")):::ok
  n47 --> n48
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /loyalty/memberships/{id}/points/redeem

Canjear puntos

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La clave de idempotencia pertenece a otro movimiento |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El canje debe ser de puntos positivos; PreconditionFailedException: La membresía no está activa; PreconditionFailedException: Saldo de puntos insuficiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsLoyaltyService.redeemPoints"]:::llamada
  n2 --> n3
  n4{"Number(dto.points) ‹= 0"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED El canje debe ser de puntos positivos"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a PromotionsLoyaltyService.lockMembershipInScope"]:::llamada
  n6 --> n7
  n8["Llama a PromotionsLoyaltyRepository.findMembershipById"]:::llamada
  n7 --> n8
  n9[("LEE promotions.loyalty_memberships")]:::efecto
  n8 --> n9
  n10["Llama a PromotionsLoyaltyRepository.findProgramById"]:::llamada
  n9 --> n10
  n11[("LEE promotions.loyalty_programs")]:::efecto
  n10 --> n11
  n12{"!unlocked || !program"}:::decision
  n11 --> n12
  n13(["↩ (relanza el error capturado)"]):::error
  n12 -->|"sí"| n13
  n14["Llama a PromotionsLoyaltyRepository.findMembershipForUpdate"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE promotions.loyalty_memberships")]:::efecto
  n14 --> n15
  n16{"!membership"}:::decision
  n15 --> n16
  n17(["↩ (relanza el error capturado)"]):::error
  n16 -->|"sí"| n17
  n18{"!this.mayActOnAnyMembership(actor, scope)"}:::decision
  n16 -->|"no"| n18
  n19["Llama a PromotionsLoyaltyService.assertOwnMembership"]:::llamada
  n18 -->|"sí"| n19
  n20{"!owner"}:::decision
  n19 --> n20
  n21(["↩ (relanza el error capturado)"]):::error
  n20 -->|"sí"| n21
  n22["Llama a PromotionsLoyaltyRepository.findLedgerEntryByKey"]:::llamada
  n20 -->|"no"| n22
  n18 -->|"no"| n22
  n23[("LEE promotions.points_ledger_entries")]:::efecto
  n22 --> n23
  n24{"previous"}:::decision
  n23 --> n24
  n25["Llama a PromotionsLoyaltyService.replayLedgerEntry"]:::llamada
  n24 -->|"sí"| n25
  n26{"previous.loyaltyMembershipId !== membership.id"}:::decision
  n25 --> n26
  n27(["409 CONFLICT La clave de idempotencia pertenece a otro movimiento"]):::error
  n26 -->|"sí"| n27
  n28{"membership.statusConceptId !== CONCEPTS.MEMBERSHIP_ACTIVE"}:::decision
  n26 -->|"no"| n28
  n24 -->|"no"| n28
  n29(["422 PRECONDITION_FAILED La membresía no está activa"]):::error
  n28 -->|"sí"| n29
  n30{"balance ‹ Number(dto.points)"}:::decision
  n28 -->|"no"| n30
  n31(["422 PRECONDITION_FAILED Saldo de puntos insuficiente"]):::error
  n30 -->|"sí"| n31
  n32["Llama a PromotionsLoyaltyRepository.createLedgerEntry"]:::llamada
  n30 -->|"no"| n32
  n33[("CREA promotions.points_ledger_entries")]:::efecto
  n32 --> n33
  n34(("201 Responde con éxito")):::ok
  n33 --> n34
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /loyalty/memberships/{id}/recompute

Reproyectar saldo y nivel desde el ledger

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
  n3["Llama a PromotionsLoyaltyService.recomputeBalance"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PromotionsLoyaltyService.lockMembershipInScope"]:::llamada
  n4 --> n5
  n6["Llama a PromotionsLoyaltyRepository.findMembershipById"]:::llamada
  n5 --> n6
  n7[("LEE promotions.loyalty_memberships")]:::efecto
  n6 --> n7
  n8["Llama a PromotionsLoyaltyRepository.findProgramById"]:::llamada
  n7 --> n8
  n9[("LEE promotions.loyalty_programs")]:::efecto
  n8 --> n9
  n10{"!unlocked || !program"}:::decision
  n9 --> n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12["Llama a PromotionsLoyaltyRepository.findMembershipForUpdate"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE promotions.loyalty_memberships")]:::efecto
  n12 --> n13
  n14{"!membership"}:::decision
  n13 --> n14
  n15(["↩ (relanza el error capturado)"]):::error
  n14 -->|"sí"| n15
  n16["Llama a PromotionsLoyaltyRepository.findLedgerByMembership"]:::llamada
  n14 -->|"no"| n16
  n17[("LEE promotions.points_ledger_entries")]:::efecto
  n16 --> n17
  n18["Llama a PromotionsLoyaltyRepository.findTiersByProgram"]:::llamada
  n17 --> n18
  n19[("LEE promotions.loyalty_tiers")]:::efecto
  n18 --> n19
  n20(("200 Responde con éxito")):::ok
  n19 --> n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. GET /loyalty/programs

Listar programas de lealtad activos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Se requiere X-Tenant-Id para listar programas de lealtad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3{"roleAuthorizesInTenant(actor, 'SYSTEM', undefined)"}:::decision
  n2 --> n3
  n4["Llama a PromotionsLoyaltyService.listActivePrograms"]:::llamada
  n3 -->|"sí"| n4
  n5["Llama a PromotionsLoyaltyRepository.findActivePrograms"]:::llamada
  n4 --> n5
  n6[("LEE promotions.loyalty_programs")]:::efecto
  n5 --> n6
  n7{"!tenantId"}:::decision
  n6 --> n7
  n3 -->|"no"| n7
  n8(["422 PRECONDITION_FAILED Se requiere X-Tenant-Id para listar programas de lealtad"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PromotionsLoyaltyService.listActivePrograms"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a PromotionsLoyaltyRepository.findActivePrograms"]:::llamada
  n9 --> n10
  n11[("LEE promotions.loyalty_programs")]:::efecto
  n10 --> n11
  n12(("200 Responde con éxito")):::ok
  n11 --> n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. POST /loyalty/programs

Crear un programa de lealtad con niveles y reglas

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un programa con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una política de vencimiento ROLLING necesita días de vigencia; PreconditionFailedException: Una regla de puntos necesita pointsAmount; PreconditionFailedException: Una regla de crédito necesita creditAmount |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsLoyaltyService.createProgram"]:::llamada
  n2 --> n3
  n4["Llama a PromotionsLoyaltyRepository.findProgramByCode"]:::llamada
  n3 --> n4
  n5[("LEE promotions.loyalty_programs")]:::efecto
  n4 --> n5
  n6{"duplicate"}:::decision
  n5 --> n6
  n7(["409 CONFLICT Ya existe un programa con ese código"]):::error
  n6 -->|"sí"| n7
  n8{"expiryPolicy === 'ROLLING' && !dto.pointsExpiryDays"}:::decision
  n6 -->|"no"| n8
  n9(["422 PRECONDITION_FAILED Una política de vencimiento ROLLING necesita días de vigencia"]):::error
  n8 -->|"sí"| n9
  n10["Repite: por cada const rule de dto.earningRules ?? []"]:::bucle
  n8 -->|"no"| n10
  n11["Llama a PromotionsLoyaltyService.assertRuleAward"]:::llamada
  n10 -->|"cada elemento"| n11
  n12{"awardType === 'POINTS' && !pointsAmount"}:::decision
  n11 --> n12
  n13(["422 PRECONDITION_FAILED Una regla de puntos necesita pointsAmount"]):::error
  n12 -->|"sí"| n13
  n14{"awardType === 'WALLET_CREDIT' && !creditAmount"}:::decision
  n12 -->|"no"| n14
  n15(["422 PRECONDITION_FAILED Una regla de crédito necesita creditAmount"]):::error
  n14 -->|"sí"| n15
  n16["Transacción: transactional(…)"]:::transaccion
  n14 -->|"no"| n16
  n10 -->|"al terminar"| n16
  n17["Llama a PromotionsLoyaltyRepository.createProgram"]:::llamada
  n16 --> n17
  n18[("CREA promotions.loyalty_programs")]:::efecto
  n17 --> n18
  n19["Llama a PromotionsLoyaltyRepository.createTier"]:::llamada
  n18 --> n19
  n20[("CREA promotions.loyalty_tiers")]:::efecto
  n19 --> n20
  n21["Llama a PromotionsLoyaltyRepository.createEarningRule"]:::llamada
  n20 --> n21
  n22[("CREA promotions.earning_rules")]:::efecto
  n21 --> n22
  n23(("201 Responde con éxito")):::ok
  n22 --> n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /loyalty/programs/{id}/memberships

Inscribir a un miembro en el programa

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El programa no está activo; PreconditionFailedException: El programa no tiene niveles definidos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsLoyaltyService.enrollMember"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PromotionsLoyaltyService.loadProgramInScope"]:::llamada
  n4 --> n5
  n6["Llama a PromotionsLoyaltyRepository.findProgramById"]:::llamada
  n5 --> n6
  n7[("LEE promotions.loyalty_programs")]:::efecto
  n6 --> n7
  n8["Llama a PromotionsLoyaltyService.assertOwnMemberRef"]:::llamada
  n7 --> n8
  n9{"!owner"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11{"!staff"}:::decision
  n9 -->|"no"| n11
  n12["Llama a PromotionsLoyaltyService.assertOwnMemberRef"]:::llamada
  n11 -->|"sí"| n12
  n13{"!owner"}:::decision
  n12 --> n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15{"program.stateConceptId !== CONCEPTS.LOYALTY_ACTIVE"}:::decision
  n13 -->|"no"| n15
  n11 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED El programa no está activo"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PromotionsLoyaltyRepository.findMembershipByMember"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE promotions.loyalty_memberships")]:::efecto
  n17 --> n18
  n19["Llama a PromotionsLoyaltyRepository.findTiersByProgram"]:::llamada
  n18 --> n19
  n20[("LEE promotions.loyalty_tiers")]:::efecto
  n19 --> n20
  n21{"tiers.length === 0"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED El programa no tiene niveles definidos"]):::error
  n21 -->|"sí"| n22
  n23["Llama a PromotionsLoyaltyRepository.createMembership"]:::llamada
  n21 -->|"no"| n23
  n24[("CREA promotions.loyalty_memberships")]:::efecto
  n23 --> n24
  n25{"signupBonusPoints && Number(signupBonusPoints) › 0"}:::decision
  n24 --> n25
  n26["Llama a PromotionsLoyaltyRepository.createLedgerEntry"]:::llamada
  n25 -->|"sí"| n26
  n27[("CREA promotions.points_ledger_entries")]:::efecto
  n26 --> n27
  n28[("ACTUALIZA promotions.loyalty_memberships · ACTUALIZA promotions.loyalty_memberships · ACTUALIZA promotions.lo…")]:::efecto
  n27 --> n28
  n29(("201 Responde con éxito")):::ok
  n28 --> n29
  n25 -->|"no"| n29
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /promotions

Crear una promoción con sus reglas de descuento

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una promoción con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La promoción debe terminar después de empezar; PreconditionFailedException: Una regla PERCENTAGE necesita porcentaje; PreconditionFailedException: El porcentaje debe estar entre 0 y 100; PreconditionFailedException: Una regla FIXED necesita importe; PreconditionFailedException: Una regla BOGO necesita buyQuantity y getQuantity |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsDiscountsService.createPromotion"]:::llamada
  n2 --> n3
  n4["Llama a PromotionsDiscountsRepository.findPromotionByCode"]:::llamada
  n3 --> n4
  n5[("LEE promotions.promotions")]:::efecto
  n4 --> n5
  n6{"duplicate"}:::decision
  n5 --> n6
  n7(["409 CONFLICT Ya existe una promoción con ese código"]):::error
  n6 -->|"sí"| n7
  n8{"validTo ‹= validFrom"}:::decision
  n6 -->|"no"| n8
  n9(["422 PRECONDITION_FAILED La promoción debe terminar después de empezar"]):::error
  n8 -->|"sí"| n9
  n10["Llama a PromotionsDiscountsService.assertRuleShape"]:::llamada
  n8 -->|"no"| n10
  n11{"rule.discountType === 'PERCENTAGE'"}:::decision
  n10 --> n11
  n12{"!rule.percentage"}:::decision
  n11 -->|"sí"| n12
  n13(["422 PRECONDITION_FAILED Una regla PERCENTAGE necesita porcentaje"]):::error
  n12 -->|"sí"| n13
  n14{"pct ‹= 0 || pct › 100"}:::decision
  n12 -->|"no"| n14
  n15(["422 PRECONDITION_FAILED El porcentaje debe estar entre 0 y 100"]):::error
  n14 -->|"sí"| n15
  n16{"rule.discountType === 'FIXED' && !rule.fixedAmount"}:::decision
  n14 -->|"no"| n16
  n11 -->|"no"| n16
  n17(["422 PRECONDITION_FAILED Una regla FIXED necesita importe"]):::error
  n16 -->|"sí"| n17
  n18{"rule.discountType === 'BOGO' && (!rule.buyQuantity || !rule.getQuantity)"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED Una regla BOGO necesita buyQuantity y getQuantity"]):::error
  n18 -->|"sí"| n19
  n20["Transacción: transactional(…)"]:::transaccion
  n18 -->|"no"| n20
  n21["Llama a PromotionsDiscountsRepository.createPromotion"]:::llamada
  n20 --> n21
  n22[("CREA promotions.promotions")]:::efecto
  n21 --> n22
  n23["Llama a PromotionsDiscountsRepository.createDiscountRule"]:::llamada
  n22 --> n23
  n24[("CREA promotions.discount_rules")]:::efecto
  n23 --> n24
  n25(("201 Responde con éxito")):::ok
  n24 --> n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. POST /promotions/{id}/coupons/batch

Emitir un lote de cupones

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: No se pudieron generar códigos de cupón libres |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un cupón PERSONAL necesita miembro asignado; PreconditionFailedException: Un cupón PERSONAL se emite de uno en uno; PreconditionFailedException: La promoción no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsDiscountsService.issueCoupons"]:::llamada
  n2 --> n3
  n4{"dto.couponType === 'PERSONAL' && !dto.assignedMemberRefId"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED Un cupón PERSONAL necesita miembro asignado"]):::error
  n4 -->|"sí"| n5
  n6{"dto.couponType === 'PERSONAL' && dto.quantity › 1"}:::decision
  n4 -->|"no"| n6
  n7(["422 PRECONDITION_FAILED Un cupón PERSONAL se emite de uno en uno"]):::error
  n6 -->|"sí"| n7
  n8["Transacción: transactional(…)"]:::transaccion
  n6 -->|"no"| n8
  n9["Llama a PromotionsDiscountsRepository.findPromotionById"]:::llamada
  n8 --> n9
  n10[("LEE promotions.promotions")]:::efecto
  n9 --> n10
  n11{"promotion.statusConceptId !== CONCEPTS.PROMOTION_ACTIVE"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED La promoción no está activa"]):::error
  n11 -->|"sí"| n12
  n13["Llama a PromotionsDiscountsService.generateCouponCodes"]:::llamada
  n11 -->|"no"| n13
  n14["Repite: ciclo for"]:::bucle
  n13 --> n14
  n15["Llama a PromotionsDiscountsRepository.findCouponsByCodes"]:::llamada
  n14 -->|"cada elemento"| n15
  n16[("LEE promotions.coupons")]:::efecto
  n15 --> n16
  n17(["409 CONFLICT No se pudieron generar códigos de cupón libres"]):::error
  n16 --> n17
  n14 -->|"al terminar"| n17
  n18["Repite: por cada const code de codes"]:::bucle
  n19["Llama a PromotionsDiscountsRepository.createCoupon"]:::llamada
  n18 -->|"cada elemento"| n19
  n20[("CREA promotions.coupons")]:::efecto
  n19 --> n20
  n21(("201 Responde con éxito")):::ok
  n20 --> n21
  n18 -->|"al terminar"| n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. GET /promotions/me

Mis promociones vigentes

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsReadService.listMine"]:::llamada
  n2 --> n3
  n4{"!patientProfileId"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED La cuenta no tiene perfil de paciente"]):::error
  n4 -->|"sí"| n5
  n6["Llama a PromotionsDiscountsRepository.findCurrentPromotions"]:::llamada
  n4 -->|"no"| n6
  n7[("LEE promotions.promotions")]:::efecto
  n6 --> n7
  n8["Llama a PromotionsDiscountsRepository.findRulesByPromotions"]:::llamada
  n7 --> n8
  n9[("LEE promotions.discount_rules")]:::efecto
  n8 --> n9
  n10["Llama a PromotionsDiscountsRepository.findPersonalCoupons"]:::llamada
  n9 --> n10
  n11[("LEE promotions.coupons")]:::efecto
  n10 --> n11
  n12["Llama a PromotionsDiscountsRepository.findConcepts"]:::llamada
  n11 --> n12
  n13[("LEE terminology.catalog_concepts")]:::efecto
  n12 --> n13
  n14(("200 Responde con éxito")):::ok
  n13 --> n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 16. POST /redemptions

Redimir un cupón y registrar la redención

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {rejection}; PreconditionFailedException: Ninguna regla aplica al importe de la orden; PreconditionFailedException: La promoción alcanzó su límite de redenciones; PreconditionFailedException: El usuario alcanzó su límite de redenciones en la promoción; PreconditionFailedException: La promoción agotó su presupuesto |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsDiscountsService.redeemCoupon"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PromotionsDiscountsService.evaluateCouponForUpdate"]:::llamada
  n4 --> n5
  n6["Llama a PromotionsDiscountsRepository.findCouponByCode"]:::llamada
  n5 --> n6
  n7[("LEE promotions.coupons")]:::efecto
  n6 --> n7
  n8["Llama a PromotionsDiscountsRepository.findPromotionById"]:::llamada
  n7 --> n8
  n9[("LEE promotions.promotions")]:::efecto
  n8 --> n9
  n10["Llama a PromotionsDiscountsRepository.findCouponByCodeForUpdate"]:::llamada
  n9 --> n10
  n11[("LEE promotions.coupons")]:::efecto
  n10 --> n11
  n12{"!coupon"}:::decision
  n11 --> n12
  n13(["↩ (relanza el error capturado)"]):::error
  n12 -->|"sí"| n13
  n14["Llama a PromotionsDiscountsRepository.findPromotionForUpdate"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE promotions.promotions")]:::efecto
  n14 --> n15
  n16{"!promotion"}:::decision
  n15 --> n16
  n17(["↩ (relanza el error capturado)"]):::error
  n16 -->|"sí"| n17
  n18{"rejection"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED {rejection}"]):::error
  n18 -->|"sí"| n19
  n20["Llama a PromotionsDiscountsRepository.findRulesByPromotion"]:::llamada
  n18 -->|"no"| n20
  n21[("LEE promotions.discount_rules")]:::efecto
  n20 --> n21
  n22{"!best"}:::decision
  n21 --> n22
  n23(["422 PRECONDITION_FAILED Ninguna regla aplica al importe de la orden"]):::error
  n22 -->|"sí"| n23
  n24["Llama a PromotionsDiscountsService.assertLimits"]:::llamada
  n22 -->|"no"| n24
  n25["Llama a PromotionsDiscountsRepository.findAppliedRedemptions"]:::llamada
  n24 --> n25
  n26[("LEE promotions.redemptions")]:::efecto
  n25 --> n26
  n27{"promotion.totalRedemptionLimit && applied.length ›= promotion.totalRedemptionLimit"}:::decision
  n26 --> n27
  n28(["422 PRECONDITION_FAILED La promoción alcanzó su límite de redenciones"]):::error
  n27 -->|"sí"| n28
  n29{"promotion.perUserLimit"}:::decision
  n27 -->|"no"| n29
  n30{"mine.length ›= promotion.perUserLimit"}:::decision
  n29 -->|"sí"| n30
  n31(["422 PRECONDITION_FAILED El usuario alcanzó su límite de redenciones en la promoción"]):::error
  n30 -->|"sí"| n31
  n32{"promotion.budgetAmount"}:::decision
  n30 -->|"no"| n32
  n29 -->|"no"| n32
  n33{"consumed ›= Number(promotion.budgetAmount)"}:::decision
  n32 -->|"sí"| n33
  n34(["422 PRECONDITION_FAILED La promoción agotó su presupuesto"]):::error
  n33 -->|"sí"| n34
  n35["Llama a PromotionsDiscountsRepository.createRedemption"]:::llamada
  n33 -->|"no"| n35
  n32 -->|"no"| n35
  n36[("CREA promotions.redemptions")]:::efecto
  n35 --> n36
  n37(("201 Responde con éxito")):::ok
  n36 --> n37
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 17. POST /redemptions/{id}/reverse

Revertir una redención por devolución o cancelación

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La redención ya no está aplicada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsDiscountsService.reverseRedemption"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PromotionsDiscountsRepository.findRedemptionById"]:::llamada
  n4 --> n5
  n6[("LEE promotions.redemptions")]:::efecto
  n5 --> n6
  n7["Llama a PromotionsDiscountsRepository.findPromotionById"]:::llamada
  n6 --> n7
  n8[("LEE promotions.promotions")]:::efecto
  n7 --> n8
  n9["Llama a PromotionsDiscountsRepository.findRedemptionForUpdate"]:::llamada
  n8 --> n9
  n10[("LEE promotions.redemptions")]:::efecto
  n9 --> n10
  n11{"!redemption || !redemptionPromotion"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"redemption.statusConceptId !== CONCEPTS.REDEMPTION_APPLIED"}:::decision
  n11 -->|"no"| n13
  n14(["409 CONFLICT La redención ya no está aplicada"]):::error
  n13 -->|"sí"| n14
  n15{"redemption.couponId"}:::decision
  n13 -->|"no"| n15
  n16["Llama a PromotionsDiscountsRepository.findCouponForUpdate"]:::llamada
  n15 -->|"sí"| n16
  n17[("LEE promotions.coupons")]:::efecto
  n16 --> n17
  n18{"coupon"}:::decision
  n17 --> n18
  n19[("ACTUALIZA promotions.coupons")]:::efecto
  n18 -->|"sí"| n19
  n20{"coupon.statusConceptId === CONCEPTS.COUPON_EXHAUSTED"}:::decision
  n19 --> n20
  n21[("ACTUALIZA promotions.coupons")]:::efecto
  n20 -->|"sí"| n21
  n22{"dto.membershipId && dto.restorePoints && Number(dto.restorePoints) › 0"}:::decision
  n21 --> n22
  n20 -->|"no"| n22
  n18 -->|"no"| n22
  n15 -->|"no"| n22
  n23["Llama a PromotionsLoyaltyRepository.findLedgerEntryByKey"]:::llamada
  n22 -->|"sí"| n23
  n24[("LEE promotions.points_ledger_entries")]:::efecto
  n23 --> n24
  n25{"previous"}:::decision
  n24 --> n25
  n26["Llama a PromotionsDiscountsService.lockMembershipOfTenant"]:::llamada
  n25 -->|"no"| n26
  n27["Llama a PromotionsLoyaltyRepository.findMembershipById"]:::llamada
  n26 --> n27
  n28[("LEE promotions.loyalty_memberships")]:::efecto
  n27 --> n28
  n29["Llama a PromotionsLoyaltyRepository.findProgramById"]:::llamada
  n28 --> n29
  n30[("LEE promotions.loyalty_programs")]:::efecto
  n29 --> n30
  n31["Llama a PromotionsLoyaltyRepository.findMembershipForUpdate"]:::llamada
  n30 --> n31
  n32[("LEE promotions.loyalty_memberships")]:::efecto
  n31 --> n32
  n33{"!membership"}:::decision
  n32 --> n33
  n34(["↩ (relanza el error capturado)"]):::error
  n33 -->|"sí"| n34
  n35["Llama a PromotionsLoyaltyRepository.createLedgerEntry"]:::llamada
  n33 -->|"no"| n35
  n36[("CREA promotions.points_ledger_entries")]:::efecto
  n35 --> n36
  n37[("ACTUALIZA promotions.loyalty_memberships")]:::efecto
  n36 --> n37
  n38[("ACTUALIZA promotions.redemptions")]:::efecto
  n25 -->|"sí"| n38
  n37 --> n38
  n22 -->|"no"| n38
  n39(("200 Responde con éxito")):::ok
  n38 --> n39
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 18. POST /referral-programs/{id}/referrals

Generar el código de referido del miembro

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: No se pudo generar un código de referido libre |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El programa de referidos no está activo; PreconditionFailedException: El programa de referidos está fuera de vigencia; PreconditionFailedException: El usuario alcanzó su máximo de referidos en el programa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsLoyaltyService.createReferral"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PromotionsLoyaltyRepository.findReferralProgramById"]:::llamada
  n4 --> n5
  n6[("LEE promotions.referral_programs")]:::efecto
  n5 --> n6
  n7{"program.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El programa de referidos no está activo"]):::error
  n7 -->|"sí"| n8
  n9{"(program.validFrom && program.validFrom › now) || (program.validTo && program.validTo ‹ now)"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El programa de referidos está fuera de vigencia"]):::error
  n9 -->|"sí"| n10
  n11{"program.maxReferralsPerUser"}:::decision
  n9 -->|"no"| n11
  n12["Llama a PromotionsLoyaltyRepository.findReferralsByReferrer"]:::llamada
  n11 -->|"sí"| n12
  n13[("LEE promotions.member_referrals")]:::efecto
  n12 --> n13
  n14{"issued.length ›= program.maxReferralsPerUser"}:::decision
  n13 --> n14
  n15(["422 PRECONDITION_FAILED El usuario alcanzó su máximo de referidos en el programa"]):::error
  n14 -->|"sí"| n15
  n16["Llama a PromotionsLoyaltyService.generateReferralCode"]:::llamada
  n14 -->|"no"| n16
  n11 -->|"no"| n16
  n17["Repite: ciclo for"]:::bucle
  n16 --> n17
  n18["Llama a PromotionsLoyaltyRepository.findReferralByCode"]:::llamada
  n17 -->|"cada elemento"| n18
  n19[("LEE promotions.member_referrals")]:::efecto
  n18 --> n19
  n20{"!(await this.loyaltyRepo.findReferralByCode(tx, code))"}:::decision
  n19 --> n20
  n21["Llama a PromotionsLoyaltyRepository.findReferralByCode"]:::llamada
  n20 -->|"sí"| n21
  n22[("LEE promotions.member_referrals")]:::efecto
  n21 --> n22
  n23(["409 CONFLICT No se pudo generar un código de referido libre"]):::error
  n22 --> n23
  n20 -->|"no"| n23
  n17 -->|"al terminar"| n23
  n24["Llama a PromotionsLoyaltyRepository.createReferral"]:::llamada
  n25[("CREA promotions.member_referrals")]:::efecto
  n24 --> n25
  n26(("201 Responde con éxito")):::ok
  n25 --> n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 19. POST /referrals/{id}/qualify

Calificar el referido y premiar a ambas partes

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El referido ya fue calificado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un usuario no puede referirse a sí mismo; PreconditionFailedException: El evento recibido no es el que califica en este programa; PreconditionFailedException: El programa de referidos no define moneda para el crédito de billetera |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PromotionsLoyaltyService.qualifyReferral"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PromotionsLoyaltyRepository.findReferralById"]:::llamada
  n4 --> n5
  n6[("LEE promotions.member_referrals")]:::efecto
  n5 --> n6
  n7["Llama a PromotionsLoyaltyRepository.findReferralProgramById"]:::llamada
  n6 --> n7
  n8[("LEE promotions.referral_programs")]:::efecto
  n7 --> n8
  n9["Llama a PromotionsLoyaltyRepository.findReferralForUpdate"]:::llamada
  n8 --> n9
  n10[("LEE promotions.member_referrals")]:::efecto
  n9 --> n10
  n11{"!referral"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"referral.statusConceptId !== CONCEPTS.REFERRAL_PENDING"}:::decision
  n11 -->|"no"| n13
  n14(["409 CONFLICT El referido ya fue calificado"]):::error
  n13 -->|"sí"| n14
  n15{"referral.referrerUserId === dto.refereeUserId"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED Un usuario no puede referirse a sí mismo"]):::error
  n15 -->|"sí"| n16
  n17{"!program"}:::decision
  n15 -->|"no"| n17
  n18(["↩ (relanza el error capturado)"]):::error
  n17 -->|"sí"| n18
  n19{"program.qualifyingEventConceptId && program.qualifyingEventConceptId !== eventConceptId"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED El evento recibido no es el que califica en este programa"]):::error
  n19 -->|"sí"| n20
  n21["Llama a PromotionsLoyaltyService.awardReferral"]:::llamada
  n19 -->|"no"| n21
  n22{"awardTypeConceptId === CONCEPTS.AWARD_POINTS"}:::decision
  n21 --> n22
  n23["Llama a PromotionsLoyaltyService.awardReferralPoints"]:::llamada
  n22 -->|"sí"| n23
  n24["Llama a PromotionsLoyaltyRepository.findLedgerEntryByKey"]:::llamada
  n23 --> n24
  n25[("LEE promotions.points_ledger_entries")]:::efecto
  n24 --> n25
  n26["Llama a PromotionsLoyaltyService.lockMembershipInScope"]:::llamada
  n25 --> n26
  n27{"!unlocked || !program"}:::decision
  n26 --> n27
  n28(["↩ (relanza el error capturado)"]):::error
  n27 -->|"sí"| n28
  n29{"!membership"}:::decision
  n27 -->|"no"| n29
  n30(["↩ (relanza el error capturado)"]):::error
  n29 -->|"sí"| n30
  n31["Llama a PromotionsLoyaltyRepository.createLedgerEntry"]:::llamada
  n29 -->|"no"| n31
  n32[("CREA promotions.points_ledger_entries")]:::efecto
  n31 --> n32
  n33["Llama a PromotionsLoyaltyRepository.findTiersByProgram"]:::llamada
  n32 --> n33
  n34[("LEE promotions.loyalty_tiers")]:::efecto
  n33 --> n34
  n35{"awardTypeConceptId === CONCEPTS.AWARD_WALLET_CREDIT"}:::decision
  n34 --> n35
  n22 -->|"no"| n35
  n36["Llama a PromotionsLoyaltyService.awardReferralWalletCredit"]:::llamada
  n35 -->|"sí"| n36
  n37{"!currencyConceptId"}:::decision
  n36 --> n37
  n38(["422 PRECONDITION_FAILED El programa de referidos no define moneda para el crédito de billetera"]):::error
  n37 -->|"sí"| n38
  n39["Llama a PromotionsLoyaltyService.lockMembershipInScope"]:::llamada
  n37 -->|"no"| n39
  n40{"!unlocked || !program"}:::decision
  n39 --> n40
  n41(["↩ (relanza el error capturado)"]):::error
  n40 -->|"sí"| n41
  n42{"!membership"}:::decision
  n40 -->|"no"| n42
  n43(["↩ (relanza el error capturado)"]):::error
  n42 -->|"sí"| n43
  n44["Llama a WalletsService.creditWallet"]:::llamada
  n42 -->|"no"| n44
  n45[("ACTUALIZA payments.wallets")]:::efecto
  n44 --> n45
  n46["Llama a PromotionsLoyaltyService.awardReferral"]:::llamada
  n45 --> n46
  n35 -->|"no"| n46
  n47{"awardTypeConceptId === CONCEPTS.AWARD_POINTS"}:::decision
  n46 --> n47
  n48["Llama a PromotionsLoyaltyService.awardReferralPoints"]:::llamada
  n47 -->|"sí"| n48
  n49["Llama a PromotionsLoyaltyRepository.findLedgerEntryByKey"]:::llamada
  n48 --> n49
  n50[("LEE promotions.points_ledger_entries")]:::efecto
  n49 --> n50
  n51["Llama a PromotionsLoyaltyService.lockMembershipInScope"]:::llamada
  n50 --> n51
  n52{"!unlocked || !program"}:::decision
  n51 --> n52
  n53(["↩ (relanza el error capturado)"]):::error
  n52 -->|"sí"| n53
  n54{"!membership"}:::decision
  n52 -->|"no"| n54
  n55(["↩ (relanza el error capturado)"]):::error
  n54 -->|"sí"| n55
  n56["Llama a PromotionsLoyaltyRepository.createLedgerEntry"]:::llamada
  n54 -->|"no"| n56
  n57[("CREA promotions.points_ledger_entries")]:::efecto
  n56 --> n57
  n58["Llama a PromotionsLoyaltyRepository.findTiersByProgram"]:::llamada
  n57 --> n58
  n59[("LEE promotions.loyalty_tiers")]:::efecto
  n58 --> n59
  n60{"awardTypeConceptId === CONCEPTS.AWARD_WALLET_CREDIT"}:::decision
  n59 --> n60
  n47 -->|"no"| n60
  n61["Llama a PromotionsLoyaltyService.awardReferralWalletCredit"]:::llamada
  n60 -->|"sí"| n61
  n62{"!currencyConceptId"}:::decision
  n61 --> n62
  n63(["422 PRECONDITION_FAILED El programa de referidos no define moneda para el crédito de billetera"]):::error
  n62 -->|"sí"| n63
  n64["Llama a PromotionsLoyaltyService.lockMembershipInScope"]:::llamada
  n62 -->|"no"| n64
  n65{"!unlocked || !program"}:::decision
  n64 --> n65
  n66(["↩ (relanza el error capturado)"]):::error
  n65 -->|"sí"| n66
  n67{"!membership"}:::decision
  n65 -->|"no"| n67
  n68(["↩ (relanza el error capturado)"]):::error
  n67 -->|"sí"| n68
  n69["Llama a WalletsService.creditWallet"]:::llamada
  n67 -->|"no"| n69
  n70[("ACTUALIZA payments.wallets")]:::efecto
  n69 --> n70
  n71["… el resto del árbol (3 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  n60 -->|"no"| n71
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
| POST /coupons/validate | 200, 400, 401, 403, 429 | 4 |
