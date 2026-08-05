# DTO de payments

Contratos de entrada y salida. Validación con `class-validator` (la estrategia del proyecto) y
documentación Swagger con `@ApiProperty` / `@ApiPropertyOptional`.

## Archivos

| Archivo | Contenido |
| --- | --- |
| `payment-intent.dto.ts` | `CreatePaymentIntentDto`, `PaymentIntentResponseDto` |
| `payment-flow.dto.ts` | Checkout, FX lock, riesgo y splits (entrada + respuesta) |
| `payment-transaction.dto.ts` | Procesamiento, callback, consulta, reembolso, anulación |
| `payment-operations.dto.ts` | Tarifas, liquidaciones, payouts y conciliación |

## Convenciones

- **Importes como `string`**: el modelo los persiste en `numeric`. Pasarlos por `number` en JS
  introduciría error de coma flotante en dinero, así que se validan con `@IsNumberString()` y se
  transportan como cadena decimal (`'150.00'`).
- **Moneda por código ISO**: la API acepta `'BOB' | 'USD'` y el servicio lo traduce al
  `currency_concept_id` del catálogo. El cliente nunca envía UUID de concepto.
- **Fechas ISO-8601** (`@IsISO8601()`), convertidas a `Date` en el servicio.
- **UUID** validados con `@IsUUID()`; los parámetros de ruta con `ParseUUIDPipe`.
- **Objetos anidados** (`lines`, `items`, `providerRecords`) con `@ValidateNested({ each: true })`
  + `@Type(...)` y `@ArrayMinSize(1)` donde una colección vacía no tiene sentido.

## Campos opcionales

Marcados con `@IsOptional()` y `?`. Reflejan la nullabilidad del modelo: p. ej. `gatewayConnectionId`
o `practiceId` en el intent, o `commissionAmount` en un ítem de payout.

## Reglas condicionales

Algunas dependencias no se expresan bien con decoradores y se validan en el servicio, lanzando
`PreconditionFailedException`:

- `splitType=AMOUNT` exige `amount`; `PERCENTAGE` exige `percentage`.
- `method=PERCENTAGE` exige `percentage`; `FIXED` exige `fixedAmount`.
- El FX lock exige `fromCurrency != toCurrency`.

## Ejemplo de solicitud

```json
POST /payments/intents
{
  "tenantId": "11111111-1111-1111-1111-111111111111",
  "gatewayId": "22222222-2222-2222-2222-222222222222",
  "amount": "150.00",
  "currency": "BOB",
  "purpose": "INVOICE",
  "idempotencyKey": "invoice-8891-attempt-1"
}
```

## Ejemplo de respuesta

```json
{
  "id": "33333333-3333-3333-3333-333333333333",
  "tenantId": "11111111-1111-1111-1111-111111111111",
  "amount": "150.00",
  "statusConceptId": "…",
  "idempotencyKey": "invoice-8891-attempt-1",
  "reused": false
}
```

`reused: true` indica que la petición fue un reintento y se devolvió el intent ya existente.

## Nota sobre el token de checkout

`POST /payments/checkout-sessions` devuelve `sessionToken` **una sola vez**; la base guarda
únicamente su hash SHA-256. No se repite en ninguna lectura posterior ni aparece en logs.
