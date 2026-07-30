# DTO de ERP

Contratos de entrada/salida con `class-validator` y anotaciones Swagger, en un único archivo
(`erp.dto.ts`) porque los 16 casos de uso comparten vocabulario (importes, fechas, socios).

## Convenciones

- **Importes y cantidades como cadena decimal** (`@IsNumberString`): el modelo usa `numeric`, y
  pasarlos por `number` introduciría error de coma flotante en dinero.
- **Fechas** ISO-8601 (`@IsISO8601()`), convertidas a `Date` en el servicio.
- **Enums de dominio por código legible** (`SUPPLIER`, `SERVICE`, `VACATION`, `CAUSE`,
  `MATERIAL`…); el servicio los traduce al `*_concept_id` del catálogo.
- **Líneas anidadas** (`items`) con `@ValidateNested({ each: true })`, `@Type` y `@ArrayMinSize(1)`:
  una orden de compra o una recepción sin líneas no tendría sentido económico.
- **Números de documento** (`partnerNumber`, `contractNumber`, `purchaseOrderNumber`,
  `receiptNumber`, `sheetNumber`, `salesOrderNumber`) son claves naturales del negocio, únicas por
  tenant.

## DTO por área

| Área | Entrada | Respuesta |
| --- | --- | --- |
| Socios | `CreatePartnerDto` | `PartnerResponseDto`, `VerifyBankAccountResponseDto` |
| Contratos | `CreateContractDto`, `RequestApprovalDto`, `CreateAmendmentDto`, `CreateRenewalDto`, `CreateTerminationDto`, `GeneratePaymentScheduleDto` | `ContractResponseDto`, `ApprovalResponseDto`, `ContractChangeResponseDto`, `PaymentScheduleResponseDto` |
| RR. HH. | `OnboardEmployeeDto`, `RequestTimeOffDto`, `ApproveTimeOffDto` | `EmployeeResponseDto`, `TimeOffResponseDto` |
| Compras | `CreatePurchaseOrderDto` (+ `PurchaseOrderItemDto`), `CreateGoodsReceiptDto` (+ `GoodsReceiptItemDto`), `CreateServiceEntrySheetDto` | `PurchaseOrderResponseDto`, `GoodsReceiptResponseDto`, `ServiceEntrySheetResponseDto` |
| Conciliación | `CreateInvoiceMatchDto` | `InvoiceMatchResponseDto` |
| Ventas y leasing | `CreateSalesOrderDto`, `CreateLeaseValuationDto` | `SalesOrderResponseDto`, `LeaseValuationResponseDto` |

## Datos bancarios

`CreatePartnerDto` acepta `ibanMasked`, **nunca el número completo**. El servicio deriva un hash
SHA-256 para poder comparar cuentas sin almacenar el identificador en claro.

## Campos opcionales

`acceptedQuantity` en la recepción (si falta, se acepta todo lo recibido), `toleranceAmount` en la
conciliación (por defecto 0), `intervalDays` en el cronograma (30 por defecto), y `decision` en la
aprobación: sin ella la solicitud queda pendiente en vez de resolverse.

## Ejemplo de solicitud

```json
POST /erp/bills/{billId}/invoice-match-runs
{
  "tenantId": "11111111-1111-1111-1111-111111111111",
  "purchaseOrderId": "22222222-2222-2222-2222-222222222222",
  "invoicedAmount": "2500.00",
  "toleranceAmount": "10.00"
}
```

## Ejemplo de respuesta

```json
{
  "id": "33333333-3333-3333-3333-333333333333",
  "matchedAmount": "2500.00",
  "varianceAmount": "0.00",
  "matched": true
}
```

`matched: false` indica que la diferencia excede la tolerancia: la factura queda registrada con
desviación y no debería pagarse sin revisión.
