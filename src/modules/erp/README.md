# Módulo 38 — ERP

Back-office: socios de negocio, ciclo de vida contractual, recursos humanos, compras y recepción,
conciliación de facturas, ventas y arrendamientos.

## Casos de uso cubiertos (16)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-38-01 | `POST /erp/business-partners` | Alta de socio con cuenta bancaria |
| UC-38-02 | `POST /erp/business-partners/:id/bank-accounts/:accId/verify` | Verificar cuenta bancaria |
| UC-38-03 | `POST /erp/contracts` | Crear contrato en borrador |
| UC-38-04 | `POST /erp/contracts/:id/approval-requests` | Solicitar/resolver aprobación |
| UC-38-05 | `POST /erp/contracts/:id/amendments` | Enmendar contrato |
| UC-38-06 | `POST /erp/contracts/:id/renewals` | Renovar contrato |
| UC-38-07 | `POST /erp/contracts/:id/terminations` | Terminar y liquidar |
| UC-38-08 | `POST /erp/employees/onboard` | Alta de empleado |
| UC-38-09 | `POST /erp/employees/:id/time-off` · `.../:reqId/approve` | Solicitar y resolver ausencia |
| UC-38-10 | `POST /erp/purchase-orders` | Emitir orden de compra |
| UC-38-11 | `POST /erp/purchase-orders/:id/goods-receipts` | Recepción de mercancía |
| UC-38-12 | `POST /erp/purchase-orders/:id/service-entry-sheets` | Hoja de servicios |
| UC-38-13 | `POST /erp/bills/:billId/invoice-match-runs` | Three-way match |
| UC-38-14 | `POST /erp/sales-orders` | Orden de venta |
| UC-38-15 | `POST /erp/lease-contracts/:id/valuations` | Valoración IFRS 16 |
| UC-38-16 | `POST /erp/contracts/:id/payment-schedules/generate` | Cronograma de cuotas |

## Entidades

`business_partners`, `business_partner_bank_accounts`, `contracts`, `contract_approval_requests`,
`contract_amendments`, `contract_renewals`, `contract_terminations`, `contract_payment_schedules`,
`employees`, `time_off_requests`, `purchase_orders`, `purchase_order_items`, `goods_receipts`,
`goods_receipt_items`, `service_entry_sheets`, `invoice_match_runs`, `sales_orders`,
`lease_valuations`.

## Flujo general

```
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

## Reglas de negocio

- **Cuenta bancaria no verificada por defecto**: nace `unverified` y verificar es un acto
  deliberado y auditable. Pagar a una cuenta sin verificar es el vector de fraude que UC-38-02 cierra.
- **El número de cuenta no se guarda en claro**: solo su IBAN enmascarado y un hash SHA-256.
- **Aprobar activa el contrato**: un borrador no obliga a nada, así que la transición a `active`
  cuelga de la decisión de aprobación, no del alta.
- **Enmendar reabre la aprobación**: cambia alcance o precio pactado, de modo que el contrato deja
  de considerarse aprobado.
- **Renovar debe extender**: una renovación con fecha anterior o igual al fin actual se rechaza.
- **Terminar es único**: no se termina un contrato ya terminado.
- **Cronograma idempotente**: si el contrato ya tiene cuotas no se regeneran; duplicarlas
  descuadraría las obligaciones de pago. La cuota se deriva del valor total del contrato.
- **Ausencias sin solape**: se rechaza una solicitud que se cruza con otra vigente del mismo
  empleado; dos permisos aprobados para los mismos días dejarían calendario y nómina ambiguos.
- **Total de la orden derivado de las líneas**, nunca aceptado del cliente.
- **Recepción**: lo aceptado por defecto es lo recibido; aceptar más de lo recibido se rechaza. La
  diferencia se registra como rechazo de calidad.
- **Three-way match**: compara lo facturado contra el valor de la orden. Si la diferencia excede la
  tolerancia se marca desviación (con `warn` en el log) en vez de aprobar el pago.

## Permisos

`ERP_ADMIN` en todo. Además: `CONTRACT_MANAGER` en el ciclo contractual, `HR_ADMIN` y `EMPLOYEE` en
ausencias, `BUYER`/`WAREHOUSE` en compras y recepción, `ACCOUNTS_PAYABLE` en conciliación, `SALES`
en órdenes de venta, `ACCOUNTANT` en valoraciones y `SYSTEM_WORKER` en la generación de cronogramas.

## Concurrencia

`FOR UPDATE` sobre contrato, cuenta bancaria, solicitud de ausencia y orden de compra antes de
mutarlos. `row_version` da bloqueo optimista automático.

## Logs

`operation: 'erp.<área>.<acción>'`. Nivel `warn` cuando el three-way match detecta una desviación.
Nunca se loguean identificadores bancarios, salarios ni datos personales del empleado.

## Pruebas

`yarn test --testPathPatterns=erp` — 41 pruebas de servicio + delegación del controlador.

## Pendiente

Los asientos contables derivados (GR/IR en la recepción, provisión de la valoración IFRS 16) se
enlazan mediante `journal_transaction_id`, que queda sin poblar: la contabilización pertenece al
módulo 16 y se conectará cuando exista el outbox.
