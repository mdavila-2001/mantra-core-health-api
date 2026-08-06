<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/promotions/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `promotions`

**Fuente:** [`src/modules/promotions/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/promotions/README.md)
· 2 controllers · 2 services · 2 repositories · 11 entidades · 1 DTO

---

# Módulo 51 — Lealtad, Descuentos, Cupones y Referidos

Programas de lealtad con niveles y ledger de puntos, promociones con reglas de descuento, cupones,
redenciones sobre el checkout y programa de referidos.

## Casos de uso cubiertos (13)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-51-01 | `POST /loyalty/programs` | Programa de lealtad con niveles y reglas |
| UC-51-02 | `POST /loyalty/programs/:id/memberships` | Inscribir miembro |
| UC-51-03 | `POST /loyalty/memberships/:id/points/earn` | Acumular puntos (idempotente) |
| UC-51-04 | `POST /loyalty/memberships/:id/points/redeem` | Canjear puntos (idempotente) |
| UC-51-05 | `POST /loyalty/memberships/:id/recompute` | Reproyectar saldo y nivel |
| UC-51-06 | `POST /loyalty/jobs/expire-points` | Barrido de puntos vencidos |
| UC-51-07 | `POST /promotions` | Promoción con reglas de descuento |
| UC-51-08 | `POST /promotions/:id/coupons/batch` | Emitir lote de cupones |
| UC-51-09 | `POST /coupons/validate` · `POST /redemptions` | Validar y redimir cupón |
| UC-51-10 | `POST /checkout/:orderId/apply-discount` | Descuento en checkout |
| UC-51-11 | `POST /redemptions/:id/reverse` | Revertir redención |
| UC-51-12 | `POST /referral-programs/:id/referrals` | Generar código de referido |
| UC-51-13 | `POST /referrals/:id/qualify` | Calificar y recompensar |

## Entidades

`loyalty_programs`, `loyalty_tiers`, `earning_rules`, `loyalty_memberships`,
`points_ledger_entries`, `promotions`, `discount_rules`, `coupons`, `redemptions`,
`referral_programs`, `member_referrals`.

## Flujo general

```
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

## Reglas de negocio

- **El ledger es la fuente de verdad** (REC 3.3): `points_balance` y `lifetime_points` son
  proyecciones. `recompute` las vuelve a derivar recorriendo el ledger completo.
- **Todo movimiento de puntos lleva clave de idempotencia**: acumular, canjear, expirar, compensar y
  recompensar un referido. Reentregar el evento devuelve la entrada anterior en vez de duplicarla —
  es lo único que hace segura la reentrega desde una cola.
- **El nivel multiplica la acumulación**: la regla dice cuántos puntos vale el evento, el nivel
  actual multiplica. Ascender es lo que se compra siendo fiel.
- **Canjear no baja de nivel**: se descuenta del saldo, no de los puntos de por vida. El nivel mide
  lealtad acumulada, no saldo disponible.
- **El saldo nunca queda negativo**: canjear más de lo que hay se rechaza, y la expiración retira
  como mucho lo que queda (si el miembro ya gastó esos puntos, no hay nada que retirar).
- **Programa y promoción nacen en borrador**: inscribir, emitir cupones o redimir exige activarlos.
- **Un cupón agotado sale de circulación** (`exhausted`) y vuelve a `active` si se libera un uso al
  revertir.
- **Un cupón personal es intransferible**: presentarlo con otra identidad se rechaza.
- **Se elige la regla que más descuenta**, nunca por encima del importe de la orden ni del tope de
  la propia regla. Un descuento mayor que la orden convertiría el cobro en un pago.
- **Topes y presupuesto**: se comprueban el límite total, el límite por usuario y el presupuesto
  consumido antes de redimir.
- **La reversa compensa, no borra**: el ledger es append-only, así que devolver puntos se registra
  como un `adjust`, dejando la entrada original intacta.
- **No hay auto-referido**: calificar un referido cuyo referidor y referido son la misma persona se
  rechaza; sería una fuente de puntos gratis.

## Permisos

`PROMOTIONS_ADMIN` en todo el módulo. `MARKETING_MANAGER` en programas, promociones y cupones.
`MEMBER` para inscribirse, canjear sus puntos y generar su código de referido. `CASHIER` en
validación, redención, checkout y reversa. `SYSTEM` en lo que ejecutan los workers: acumulación,
recompute, barrido de expiración y calificación de referidos.

## Concurrencia

`FOR UPDATE` sobre membresía (el saldo es un contador compartido), cupón (evita la sobre-redención
entre cajas), promoción, redención y referido. `FOR UPDATE SKIP LOCKED` en el barrido de expiración,
que procesa por lotes y no debe esperar a otra pasada. `row_version` aporta bloqueo optimista.

## Logs

`operation: 'promotions.<área>.<acción>'`. No se loguean códigos de cupón generados ni saldos.

## Pruebas

`yarn test --testPathPatterns=promotions` — 71 pruebas de servicio + delegación de los dos
controladores.

## Pendiente

- **Crédito de billetera**: cuando el premio de una regla o de un referido es `wallet_credit`, este
  módulo no acredita nada — `payments.wallets` pertenece al módulo 42B. La redención y el referido
  quedan registrados y el crédito se liquidará por outbox.
- **Importe del intento de pago**: `apply-discount` registra la redención con `payment_intent_id` y
  **devuelve** el importe neto, pero no muta `payments.payment_intents`: la escritura cruzada de
  esquemas la resuelve payments al consumir el evento (misma frontera que el
  `journal_transaction_id` de ERP).
- **Línea de descuento en facturación**: `billing.bill_lines` se poblará desde billing con el mismo
  criterio.
- **Outbox**: `PointsEarned`, `CouponRedeemed`, `DiscountApplied`, `ReferralQualified`… se emitirán
  cuando exista el módulo 35.

