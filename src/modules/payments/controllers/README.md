# Controladores de payments

Capa HTTP: validan la entrada, aplican autorización y delegan. **Sin lógica de negocio** —
la transacción la abre el servicio.

## Rutas

| Controlador | Prefijo | Endpoints |
| --- | --- | --- |
| `PaymentsIntentsController` | `payments/intents` | UC-42-01, 03, 04, 05, 11 |
| `PaymentsTransactionsController` | `payments/transactions` | UC-42-07, 08, 09 |
| `PaymentsOperationsController` | `payments` | UC-42-02, 06, 10, 12, 13, 14 |

## Autenticación y autorización

`JwtAuthGuard` global + `@Roles(...)` por endpoint: `PAYMENTS_ADMIN` en todos; `CASHIER` además
en creación de intent, checkout, procesamiento y anulación.

**Excepción deliberada**: `POST /payments/callbacks/:callbackPath` es `@Public()`. Un webhook del
gateway no lleva token de usuario; su autenticidad se establece por la firma del proveedor y la
correlación por referencia externa. Por eso su handler no recibe `@CurrentUser()` y las marcas de
auditoría quedan sin autor.

## Validaciones HTTP

`ParseUUIDPipe` en todos los parámetros de ruta; `ValidationPipe` global sobre los DTO de cuerpo
(`class-validator`). El `callbackPath` es un `string` libre: lo define el proveedor al registrar
el endpoint.

## Códigos de respuesta

`201 Created` en las altas (intent, fx-lock, riesgo, transacción, split, checkout, tarifa,
liquidación, payout, conciliación). `200 OK` en las que no crean recurso: callback y
`status-inquiry`. Los errores salen por `AllExceptionsFilter` con el contrato común
(`DomainException` + `error-codes`).

## Relación con los servicios

`PaymentsIntentsController` inyecta dos servicios: `PaymentsIntentsService` para el ciclo de vida
del intent y `PaymentsTransactionsService` para `POST :id/transactions`, porque esa ruta cuelga
del intent pero su lógica pertenece al dominio de transacciones.

## Pruebas

`payments-intents.controller.spec.ts` cubre los tres controladores con los servicios mockeados:
verifica la delegación, los argumentos (incluido el actor autenticado) y la propagación de errores.
