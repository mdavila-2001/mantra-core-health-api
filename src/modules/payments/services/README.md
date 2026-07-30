# Servicios de payments

Aquí vive la lógica de negocio. Cada método público resuelve un caso de uso completo dentro de
**una transacción** (`em.transactional`).

## Servicios y responsabilidades

| Servicio | Casos de uso | Responsabilidad |
| --- | --- | --- |
| `PaymentsIntentsService` | 01, 03, 04, 11 | Ciclo de vida del intent: alta idempotente, bloqueo de cambio, riesgo, splits |
| `PaymentsCheckoutService` | 02 | Apertura de sesión de checkout y contexto de caja |
| `PaymentsTransactionsService` | 05, 06, 07, 08, 09 | Gateway: procesar, callback, consulta, reembolso, anulación |
| `PaymentsOperationsService` | 10, 12, 13, 14 | Cierre: tarifas, liquidaciones, payouts, conciliación |

## Reglas de negocio aplicadas

- **Idempotencia (01)**: la clave se consulta *antes* de abrir la transacción para devolver el
  intent existente en vez de dejar que la UNIQUE falle con un conflicto.
- **Cambio (03)**: solo sobre intent `pending`, monedas distintas y sin otro bloqueo activo. Al
  fijarlo, el importe del intent se re-expresa en la moneda destino.
- **Riesgo (04)**: el nivel se deriva del score (umbrales 40 / 70). `DECLINE` deja el intent `failed`.
- **Splits (11)**: la suma no puede exceder el importe del intent (el trigger del modelo es el
  respaldo; aquí se valida para devolver un error de dominio).
- **Procesamiento (05)**: exige evaluación de riesgo previa y que no esté declinada. `AUTHORIZE`
  deja el intent en `processing`; `CAPTURE`/`SALE` lo cierran como `succeeded`.
- **Callback (06)**: idempotente. Si la transacción ya está en el estado informado devuelve
  `duplicate=true` sin reaplicar efectos.
- **Reembolso (08)**: solo sobre `captured`/`settled`, acotado a lo cobrado menos lo ya devuelto.
- **Anulación (09)**: prohibida sobre `settled` — ahí corresponde reembolso.
- **Tarifario (10)**: publicar versiona; la anterior activa del mismo código pasa a `superseded`.
- **Liquidación (12)**: idempotente por `settlement_ref`. Las líneas cuya transacción no existe
  localmente se omiten en vez de abortar el lote.
- **Payout (13)**: el importe se **deriva** de los ítems netos de comisión; debe ser positivo.
- **Conciliación (14)**: cada registro sin contraparte o con importe distinto abre una excepción
  `open`; nunca se autocorrige.

## Dependencias

`EntityManager` (transacciones), los repositorios del módulo y `PinoLogger`. No dependen de otros
módulos: el estado se deja consistente en PostgreSQL y la proyección a los stores queda para el
outbox (módulo 35, pendiente).

## Transacciones

Un caso de uso = una transacción. Dentro se hace `SELECT ... FOR UPDATE` sobre los agregados que se
van a mutar (intent, transacción, deuda) para serializar escritores concurrentes; `row_version` da
además bloqueo optimista automático.

## Excepciones

`ResourceNotFoundException` (agregado inexistente), `PreconditionFailedException` (estado o datos
que no habilitan la operación) y `ConflictException` (duplicado o límite excedido). Todas son
`DomainException` y salen con el contrato común de error.

## Logs

`operation: 'payments.<área>.<acción>'` al inicio de cada operación; `warn` en los casos que
merecen atención (intent rechazado por riesgo, conciliación con excepciones abiertas). Nunca se
loguean tokens, secretos del gateway ni datos del pagador.

## Pruebas

`payments-intents.service.spec.ts`, `payments-transactions.service.spec.ts` y
`payments-operations.service.spec.ts` (incluye `PaymentsCheckoutService`) con los repositorios
mockeados: camino feliz, precondiciones, conflictos, idempotencia y casos límite.
