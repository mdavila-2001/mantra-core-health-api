# v4.2.1 — El pedido de farmacia ya tiene modelo · para Ender (FAR-E1 / FAR-E2 / FAR-E3)

**2026-08-27 · de Marcelo.** Los dos paquetes de bloqueadores están respondidos y el modelo está
hecho: las **siete** cosas que enumeraste tienen dónde persistirse, incluida la tabla de
sustituciones. Esta nota dice **qué quedó en el modelo**, **las 14 respuestas** y **qué te toca a
vos**, con archivo y línea.

Va acá y no en un PR del esquema porque `SQL/`, `Mantra Core Health Context/` y `salud-db/` no son
repositorios git (defecto B-2): el `.puml`, el DDL regenerado y el patch **sólo existen en la
máquina del modelo**. El patch completo va en el paquete
`RESPUESTA-FAR-MODELO-2026-08-27.zip` que acompaña esta nota.

Primero lo importante: **tus dos informes se sostienen enteros**. Verifiqué las 24 filas de la
matriz de FAR-E1 y las 13 de FAR-E3 contra el DDL canónico de esta máquina —no contra la copia del
25/08 que auditaste— y no encontré una sola afirmación que no se cumpla. Lo que sigue no corrige
nada tuyo: agrega lo que faltaba decidir.

---

## 1 · Antes y después

| | Antes | Ahora |
|---|---|---|
| Modalidad del pedido | no existe | `inventory_reservations.delivery_mode_concept_id` + 3 conceptos |
| Dirección de entrega | no existe | `inventory_reservations.delivery_address_id` → `common.addresses` |
| Total congelado | no existe | `inventory_reservations.total_amount` + `currency_concept_id` |
| Precio por línea | no existe | `inventory_reservation_lines.unit_price_amount` + `currency_concept_id` |
| Código de retiro | no existe | `inventory_reservations.pickup_code` + único **parcial** |
| Motivo de rechazo | viajaba sólo en el evento | `inventory_reservations.rejection_reason_text` |
| Sustituciones | **sin tabla** | `pharmacy_inventory.pharmacy_order_substitutions` (15 columnas · 8 FK · 9 índices) |
| `ready` → `LISTO_PARA_RETIRO` | 422 `blockedByModel: deliveryMode` | **destrabado** |
| `confirm` con `PROPONER_GENERICO` | 422 `blockedByModel: substitutions` | **destrabado** |

**Delta del modelo:** +1 tabla · +12 FK · +14 índices (13 declarados + la PK).

---

## 2 · Las 14 respuestas

### FAR-E1

**1 · ¿Extender reservas o crear `pharmacy_orders`?** → **Extender.** Y no es una decisión nueva:
`dev` ya la tomó. `pharmacy_inventory.concepts.ts:141-148` dice literal «una fila con estado
`PINV_ORDER_*` **ES** un pedido de paciente», y FAR-E1 y E2 están mergeados sobre esa premisa.
Elegir la opción (b) hoy invalidaría código ya probado y en `dev`. Consecuencia que sí importa:
**todas las columnas nuevas son nullable**, porque la tabla la comparten las reservas de mostrador,
que no son pedidos. Que un pedido siempre lleve modalidad es **regla de servicio, tuya**, no del
esquema.

**2 · ¿Dónde persisten las sustituciones?** → **Tabla nueva**, `pharmacy_order_substitutions`, con
el nombre que vos propusiste. Cuelga de la **línea** además del pedido. Detalle en §3.

**3 · ¿Gobernanza además del código?** → **No.** Acuñalos con `defineModuleConcepts` y listo: son
conjuntos dinámicos cuyo dueño es la API. **No hay ni debe haber nota `vs_*.md` ni entrada en
`VS_OWNER`** — `gen_seeds.py` globea `Patch v4.*/Value sets/*.md` y se adueñaría del conjunto con
ids de otro namespace, que es exactamente el problema del módulo 64 y el de `practitioner-specialty`.
Es el mismo criterio que fijó v4.1.9. Ya los agregué yo (§3), no tenés que hacer nada.

**4 · ¿`quotation_id` tiene destino?** → **No, y no lo va a tener por esta vía.** Es peor de lo que
decía tu informe: `purchase_quotations` **no existe como tabla** y el `.puml` del módulo 25 **ni
siquiera la declara** — la entidad MikroORM es una de las 6 «entidades fantasma» documentadas en
`CLAUDE.md`. Por eso `90_fk_deferred.sql:5-6` la lista bajo «FK sin destino canónico». Ignorala
para FAR-E1: los precios congelados viven en columnas propias, no colgados de una cotización.

**5 · ¿Ventana de expiración?** → **Una sola columna**, como propusiste: `expires_at` con dos
ventanas sucesivas. No agregué una segunda.

### FAR-E3

**1 · ¿Dónde vive `delivery_mode`?** → Cabecera del pedido, `inventory_reservations`.

**2 · ¿Dónde vive `pickup_code`?** → Cabecera del pedido, `varchar` nullable.

**3 · ¿Quién lo genera y en qué transición?** → **Lo genera el backend**, y lo sella al pasar a
`LISTO_PARA_RETIRO`, que es la hipótesis del contrato del front. Especificación completa en §4.

**4 · ¿Expiración/rotación?** → **Vive con la ventana de la reserva.** Sin columna propia: caduca
con `expires_at`, que se renueva +48 h al quedar listo. Dos fechas para lo mismo se desincronizan.

**5 · ¿Reutilizable o de un solo uso?** → **Un código por pedido**, válido para **todas** las
entregas parciales hasta `RETIRADO`. Rotarlo por entrega obligaría a avisarle de nuevo a alguien
que ya está parado en el mostrador.

**6 · ¿Cómo se representa la parcial acumulativa?** → Como asumía el front: el pedido queda
`LISTO_PARA_RETIRO` mientras haya saldo > 0 y pasa a `RETIRADO` con saldo 0.

**7 · ¿Fuente de verdad del saldo?** → **`inventory_reservation_lines.fulfilled_quantity`**,
acumulado. El desglose por entrega ya lo dan las `medication_dispensation_lines`, que existen. No
agregué nada: la columna estaba.

**8 · ¿Cómo se persisten las sustituciones aceptadas?** → La tabla nueva. Y confirmo tu advertencia:
`medication_dispensations.substitution_reason_concept_id` **no** se reutiliza — es el motivo al
dispensar, no la propuesta previa.

**9 · ¿Qué recibe el prescriptor?** → **Evento de dominio en la misma transacción** + campana
in-app reutilizando `PharmacyOrderNotificationsService`. **Cero DDL**: el vínculo
(`medication_dispensations.medication_request_id`) ya existe. Es trabajo tuyo, no del modelo.

---

## 3 · Lo que ya está (no lo rehagas)

### Las columnas

`inventory_reservations` (`SQL/25_pharmacy_inventory/02_tables.sql`, todas nullable):
`delivery_mode_concept_id` · `delivery_address_id` · `total_amount` · `currency_concept_id` ·
`pickup_code` · `rejection_reason_text`.

`inventory_reservation_lines`: `unit_price_amount` · `currency_concept_id`.

### La tabla

`pharmacy_inventory.pharmacy_order_substitutions` — `id` · `inventory_reservation_id` ·
`inventory_reservation_line_id` · `original_pharmacy_product_id` · `proposed_pharmacy_product_id` ·
`original_unit_price_amount` · `proposed_unit_price_amount` · `currency_concept_id` ·
`status_concept_id` · `decided_at` + cola de auditoría estándar + `row_version`.

Tres cosas que el DDL no explica solo:

- **Cuelga de la línea** además del pedido: la sustitución es de un renglón concreto y un pedido
  puede tener varias vivas. El pedido se guarda igual porque toda lectura del pedido las trae.
- **Es una bitácora, no un campo mutable.** El cliente Angular ya lo fija: aceptar y
  preferir-el-original **dejan la fila viva** («la propuesta queda en `sustituciones` como
  historia», `pharmacy-orders.client.ts:177-200`). Por eso **no hay único por línea**: una línea
  cuya propuesta se rechazó puede recibir otra.
- **Sin `<<IMMUTABLE>>`.** `decided_at` y `status_concept_id` se escriben al decidir.

### Los conceptos (ya acuñados, ya en `dev` de esta rama)

En `src/modules/pharmacy_inventory/pharmacy_inventory.concepts.ts`. Los uuid son derivados
(UUIDv5 sobre `pharmacy_inventory:<CLAVE>`) y los verifiqué ejecutando el código, no calculándolos
a mano:

| Constante | Clave | Código | UUID |
|---|---|---|---|
| `PINV.DELIVERY_RETIRO` | `pharmacy_inventory:DELIVERY_RETIRO` | `PINV_DELIVERY_RETIRO` | `d3e3b3e1-09f8-5aad-9c83-bebbf462ad82` |
| `PINV.DELIVERY_DOMICILIO` | `pharmacy_inventory:DELIVERY_DOMICILIO` | `PINV_DELIVERY_DOMICILIO` | `28f01867-8457-5a29-8850-5f0bb85b53f5` |
| `PINV.DELIVERY_TRABAJO` | `pharmacy_inventory:DELIVERY_TRABAJO` | `PINV_DELIVERY_TRABAJO` | `9558b2a0-cf5e-5651-8bdd-b13f97648ed7` |
| `PINV.SUBSTITUTION_PROPUESTA` | `pharmacy_inventory:SUBSTITUTION_PROPUESTA` | `PINV_SUBSTITUTION_PROPUESTA` | `084f1174-17b1-5f73-b1ed-cefe8d16c186` |
| `PINV.SUBSTITUTION_ACEPTADA` | `pharmacy_inventory:SUBSTITUTION_ACEPTADA` | `PINV_SUBSTITUTION_ACEPTADA` | `71280435-63f8-5ffa-b197-f46acf43647e` |
| `PINV.SUBSTITUTION_RECHAZADA` | `pharmacy_inventory:SUBSTITUTION_RECHAZADA` | `PINV_SUBSTITUTION_RECHAZADA` | `c336b749-ae6d-5794-b831-24d883508225` |
| `PINV.SUBSTITUTION_RETIRADA` | `pharmacy_inventory:SUBSTITUTION_RETIRADA` | `PINV_SUBSTITUTION_RETIRADA` | `47167271-cbc7-5d40-81fd-b6b8f1156414` |

> **`RETIRADA` no estaba en tu lista y la agregué a propósito:** es el pedido que muere —vence o se
> cancela— con la propuesta todavía en pie. Sin ese estado, una propuesta quedaría `PROPUESTA`
> para siempre sobre un pedido que ya no existe. Acuñé el conjunto completo de una, igual que se
> hizo con los diez `ORDER_*`.

Los siembra `TerminologySeedService` al arrancar. **No corras nada**: es idempotente y automático.

### Las entidades y el catálogo

Regeneradas por el pipeline: `pharmacy_order_substitutions.entity.ts` (nueva), las dos existentes
extendidas, el barrel, y `src/orm/catalog/{foreign-keys,indexes}/pharmacy_inventory.*.ts` con las
12 FK y el índice parcial (con su predicado como 6.º elemento del tuple). `yarn typecheck` en 0 y
las 18 suites del módulo en verde.

---

## 4 · El código de retiro — la especificación que pediste

Lo diseñé yo porque las preguntas 3, 4 y 5 no tenían respuesta y sin ellas la columna se define a
ciegas. Es contrato, implementalo tal cual:

- **Quién lo genera:** el backend, en `ready()`, dentro de la misma transacción que hace
  `CONFIRMADO|ACEPTADO → LISTO_PARA_RETIRO`. No llega de ningún sistema externo.
- **Sólo para RETIRO:** si el pedido no puede demostrarse `PINV_DELIVERY_RETIRO`, `ready` sigue
  rechazando —ahora con un motivo real, no con `blockedByModel`—. Domicilio y trabajo cierran por
  el carril de envío (FAR-E4).
- **Forma:** 6 caracteres de un alfabeto **sin ambiguos** — sin `0`/`O`, sin `1`/`I`/`L`. Se dicta
  en voz alta en un mostrador; `IL01` se presta a error. Espacio ≈ 30⁶.
- **Unicidad:** la garantiza el índice **parcial** `ux_inventory_reservations_pickup_code`
  (`WHERE pickup_code IS NOT NULL`). Generá y reintentá ante violación de unicidad; no consultes
  antes de insertar, porque eso es una carrera.
- **Por qué parcial:** un único total no serviría de guarda —Postgres considera cada `NULL`
  distinto— y además obligaría a razonar sobre `NULL`s en cada lectura. Mismo razonamiento que los
  dos parciales de v4.1.9.
- **Caducidad:** la del pedido. Vive con `expires_at`, que se renueva +48 h al quedar listo.
- **Un solo código por pedido**, para todas las entregas parciales. No rota.
- **Comparación:** insensible a mayúsculas, como espera el front. Guardalo normalizado.

---

## 5 · Lo que te toca

1. **`ready()`** — `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:817-827`:
   sacá el 422 y transicioná, sellando `pickup_code` y renovando `expires_at`. La semántica ya la
   fija tu propio docblock en `:810-816`.
2. **`confirm()`** — mismo archivo, `:648-658`: sacá el 422 de `substitutions` y persistí las
   propuestas. **Ojo con esto:** `ConfirmOrderAdjustmentDto` (`dto/pharmacy-orders.dto.ts:241-255`)
   clavea el ajuste por **`productId`**, y la tabla es **por línea**. El servicio ya fanea a todas
   las líneas de ese producto (`linesByProduct`, `:661-680`), así que o el DTO gana una clave de
   línea, o definís la regla para el caso 1 producto → N líneas. **Es una decisión de contrato con
   el front, no del modelo** — pero hay que tomarla antes de escribir el INSERT.
3. **Los DTO de respuesta no traen nada de esto.** `PharmacyOrderDto` (`:157-225`) no tiene
   `deliveryMode`, `pickupCode`, `totalAmount`/`currency` ni `rejectionReasonText`, y
   `PharmacyOrderLineDto` (`:93-153`) no tiene `unitPriceAmount`/`currency`. Extendelos.
4. **`RejectPharmacyOrderDto`** (`:270-284`) dice «no se persiste todavía» — ya se persiste.
   Actualizá el docblock y guardá el motivo.
5. **Las rutas que faltan:** `accept-substitutions` y `prefer-original` no existen en
   `pharmacy-orders.controller.ts` (hoy son 9 rutas). El cliente Angular ya las documenta
   (`pharmacy-orders.client.ts:70,177,194`) y fija la semántica: **aceptar** aplica el genérico a la
   línea y mueve el pedido a `ACEPTADO`; **preferir el original** lo devuelve a `CONFIRMADO` —la
   farmacia ya lo había revisado—. En los dos casos la propuesta sobrevive como historia.
6. **Validá la modalidad contra la capacidad de la sede** (`pharmacy_sites.pickup_available` /
   `home_delivery_available`). El esquema no lo hace: la columna es nullable porque comparte tabla
   con las reservas de mostrador.
7. **La dirección es del paciente, y eso lo comprobás vos.** `common.addresses` es polimórfica
   (`owner_type_concept_id` + `owner_id`, sin FK), así que la FK garantiza que la dirección existe,
   **no** que sea de quien pide. El front además fija que los dos envíos sólo son elegibles si la
   persona tiene esa dirección cargada.
8. **`total_amount` se re-congela.** Aceptar una sustitución **recalcula** el total —el genérico
   cuesta otra cosa y el comprobante tiene que decir lo que se va a cobrar—. No es
   escribir-una-vez: no le pongas guarda de inmutabilidad. (Distinto de
   `medication_dispensation_lines.unit_price_amount`, que sí se escribe una sola vez.)

---

## 6 · Dos cosas sueltas, para que no te sorprendan

**La moneda: no acuñes un concepto nuevo.** Congelá `currency_concept_id` **copiando** el de la
lista de precios que usaste (`pharmacy.pharmacy_price_lists.currency_concept_id`). Razón: el módulo
tiene hoy **cuatro juegos de conceptos de moneda sin unificar** —el global `CONCEPTS.CURRENCY_BOB`
/ `USD`, `PHARM_CURRENCY_USD`, `PINV_CURRENCY_USD` y los de `accounting`—, los seeds usan el **BOB
global** y `totalOf()` compara monedas **por `concept.code`**
(`pharmacy-inventory-read.service.ts:485-509`). Si acuñás uno propio, el total congelado y el
recalculado dejan de reconocerse como la misma moneda. Y ojo con el default: el código de
procurement hardcodea `PINV.CURRENCY_USD` (`pharmacy-procurement.service.ts:156`) mientras el
front y los seeds hablan de bolivianos. **Esa divergencia es anterior a este patch y no la resolví**
—unificar las cuatro familias es una tarjeta propia—, pero no la heredes por omisión.

**El pago y el envío no son huecos de modelo, pero tampoco están hechos.** El contrato del front
tiene `PagoDelPedido` y `envio: EN_CAMINO|ENTREGADO`, y ninguno de tus dos paquetes los lista. El
**pago** se resuelve sin DDL: `payments.payment_intents` ya tiene `source_ref_type` +
`source_ref_id` (puntero polimórfico), `amount`, `currency_concept_id`, `status_concept_id` y
`expires_at` — colgalo de ahí con `source_ref_type = 'PHARMACY_ORDER'`. El **envío** sí es un hueco:
no hay ninguna tabla de shipment/tracking en `pharmacy` ni `pharmacy_inventory`. Es FAR-E4 y
necesita su propia decisión de modelo — pedímela cuando llegues, no la improvises.

---

## 7 · Orden de despliegue y cómo verificar

**El orden es libre.** No hay backfill: todas las columnas son nullable y la tabla nace vacía, así
que el patch puede correrse antes o después de desplegar la API. (A diferencia de v4.1.9, que
exigía dos pasadas.)

- **Base limpia:** `python salud-db/rebuild_stack.py --yes`. No hace falta el patch: la base nace
  con todo desde `SQL/`.
- **Base viva:** `psql -v ON_ERROR_STOP=1 -f SQL/patches/2026-08-27_v421_pharmacy_patient_orders.sql`.
  La sección D comprueba sola y **rompe** si el esquema quedó a medias — incluido el caso de que el
  índice del código exista pero **no** sea parcial.
- **Verificación de fidelidad:** arrancá en `ORM_SCHEMA_SYNC=dry-run` y mirá que la deriva no sume
  categorías nuevas.

Deltas esperados sobre los conteos canónicos: **tablas +1 · FK +12 · índices +14**.

> **Estado honesto:** todo esto está verificado **a nivel generador y suite** —el DDL regenerado
> diffea sólo en el módulo 25, `check_ddl_sources` pasa, `gen_seeds --dry` no aborta, `typecheck`
> da 0 y las 18 suites del módulo pasan (189 pruebas)—. **No está aplicado a ninguna base viva**:
> Docker estaba apagado el 27/08. Queda en la misma cola que v4.1.2 → v4.2.0.
