# Servicios de promociones

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

| Servicio | Casos de uso | Responsabilidad |
| --- | --- | --- |
| `PromotionsLoyaltyService` | 01 … 06, 12, 13 | Programas, membresías, ledger de puntos y referidos |
| `PromotionsDiscountsService` | 07 … 11 | Promociones, cupones, redenciones y checkout |

## Reglas de negocio

- **Programa (01)**: nace `draft`. Los niveles se ordenan por umbral, no por el orden en que
  llegaron: el ordinal debe reflejar la escalera real. Una regla de puntos exige `pointsAmount` y
  una de crédito exige `creditAmount`.
- **Inscripción (02)**: idempotente — si el miembro ya está, se devuelve su membresía sin volver a
  dar el bono. El bono de bienvenida lleva clave derivada de la membresía.
- **Acumulación (03)**: se comprueba la clave de idempotencia antes de tocar nada; luego que la
  regla sea del mismo programa, esté activa y dentro de vigencia, y que no haya superado su tope en
  el periodo. Los puntos se multiplican por el multiplicador del nivel actual, y llevan
  `expires_at` si el programa usa política `ROLLING`.
- **Canje (04)**: descuenta del saldo, no de los puntos de por vida. Canjear más de lo que hay se
  rechaza antes de escribir.
- **Recompute (05)**: recorre el ledger completo — `earn` suma a saldo y a vida, `redeem` y `expire`
  restan del saldo, `adjust` compensa con signo — y reasigna el nivel. Informa si el nivel cambió.
- **Expiración (06)**: por cada acumulación vencida escribe una entrada `expire` con clave derivada
  de esa entrada, de modo que dos pasadas no expiran dos veces lo mismo. Nunca retira más que el
  saldo restante.
- **Promoción (07)**: nace `draft`; se valida la ventana y la forma de cada regla (porcentaje entre
  0 y 100, importe en las fijas, cantidades en las BOGO).
- **Cupones (08)**: exigen promoción activa. Los códigos se generan aleatorios y se contrastan
  contra los existentes antes de escribir; un cupón `PERSONAL` se emite de uno en uno y con
  asignatario.
- **Validación (09)**: no muta nada. Devuelve `valid: false` con motivo en vez de lanzar, porque el
  checkout pregunta muchas veces sin llegar a usar el cupón.
- **Redención (09)**: cupón bloqueado, se consume un uso y, si era el último, pasa a `exhausted`.
- **Checkout (10)**: idempotente por el par intento-promoción; devuelve el importe neto.
- **Reversa (11)**: libera el uso del cupón (devolviéndolo a `active` si estaba agotado) y compensa
  los puntos con un `adjust`, nunca borrando la entrada original.
- **Referido (12)**: exige programa activo y vigente, y respeta `max_referrals_per_user`. El
  referidor es el usuario autenticado.
- **Calificación (13)**: rechaza el auto-referido y el evento que no es el que califica; premia a
  ambas partes con claves derivadas del referido.

## Cálculo del descuento

De todas las reglas aplicables se elige **la que más descuenta**. Cada tipo se resuelve así:

- `PERCENTAGE`: `importe × porcentaje / 100`.
- `FIXED`: el importe fijo.
- `BOGO`: la parte bonificada del lote — `importe × get / (buy + get)`.

Sobre el resultado se aplica el tope de la regla y, finalmente, el importe de la orden: un descuento
mayor que la orden convertiría el cobro en un pago.

## Dependencias

`EntityManager`, los repositorios del módulo y `PinoLogger`. `PromotionsDiscountsService` usa además
`PromotionsLoyaltyRepository` para compensar puntos al revertir una redención: la reversa y la
compensación tienen que caer en la misma transacción o el miembro perdería puntos sin contrapartida.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción. `FOR UPDATE` sobre membresía, cupón, promoción, redención
y referido; `FOR UPDATE SKIP LOCKED` en el barrido de expiración; `row_version` aporta bloqueo
optimista automático.

## Excepciones

`ResourceNotFoundException` (programa, membresía, regla, cupón, promoción, redención o referido
inexistente), `PreconditionFailedException` (programa o promoción no activos, fuera de vigencia,
saldo insuficiente, tope de regla o de promoción alcanzado, presupuesto agotado, regla mal formada,
cupón ajeno, auto-referido) y `ConflictException` (código duplicado, redención ya revertida,
referido ya calificado, imposible generar un código libre).

## Logs

`operation: 'promotions.<área>.<acción>'`. No se loguean códigos de cupón ni saldos.

## Pruebas

`promotions-loyalty.service.spec.ts` (39) y `promotions-discounts.service.spec.ts` (32):
idempotencia en ambos sentidos, multiplicador de nivel, ascenso, tope por periodo, expiración
acotada al saldo, selección de la mejor regla, topes y presupuesto, y compensación de la reversa.
