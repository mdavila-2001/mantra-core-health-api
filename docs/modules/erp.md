<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/erp/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `erp`

**Fuente:** [`src/modules/erp/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/erp/README.md)
· 1 controllers · 2 services · 3 repositories · 51 entidades · 1 DTO

---

# Módulo 38 — ERP

Back-office: socios de negocio, ciclo de vida contractual, recursos humanos, compras y recepción,
conciliación de facturas, ventas y arrendamientos.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/erp -name '*.controller.ts' | wc -l
  find src/modules/erp -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/erp -name '*.entity.ts' | wc -l
  find src/modules/erp -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **1 controller, 17 rutas HTTP, 51 entidad y 2 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 51 de 51 archivos `*.entity.ts`): `business_partner_bank_accounts`, `business_partner_relationships`, `business_partner_roles`, `business_partner_tax_registrations`, `business_partners`, `contract_accounting_terms`, `contract_amendments`, `contract_approval_requests`, `contract_approval_steps`, `contract_clause_instances`, `contract_clauses`, `contract_documents`, `contract_line_items`, `contract_milestones`, `contract_object_assignments`, `contract_obligation_events`, `contract_obligations`, `contract_parties`, `contract_payment_schedules`, `contract_renewals`, `contract_team_members`, `contract_terminations`, `contract_versions`, `contracts`, `departments`, `employee_assignments`, `employees`, `employment_records`, `enterprise_document_flow`, `goods_receipt_items`, `goods_receipts`, `invoice_match_items`, `invoice_match_runs`, `lease_accounting_links`, `lease_cash_flows`, `lease_contracts`, `lease_objects`, `lease_valuations`, `performance_reviews`, `positions`, `projects`, `purchase_order_items`, `purchase_orders`, `purchase_requisition_items`, `purchase_requisitions`, `sales_order_items`, `sales_orders`, `service_entry_items`, `service_entry_sheets`, `time_off_requests`, `wbs_elements`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /erp/business-partners` | ERP_ADMIN | `erp` |
| `POST /erp/business-partners/:id/bank-accounts/:accId/verify` | ERP_ADMIN | `erp` |
| `POST /erp/contracts` | ERP_ADMIN, CONTRACT_MANAGER | `erp` |
| `POST /erp/contracts/:id/approval-requests` | ERP_ADMIN, CONTRACT_MANAGER | `erp` |
| `POST /erp/contracts/:id/amendments` | ERP_ADMIN, CONTRACT_MANAGER | `erp` |
| `POST /erp/contracts/:id/renewals` | ERP_ADMIN, CONTRACT_MANAGER | `erp` |
| `POST /erp/contracts/:id/terminations` | ERP_ADMIN, CONTRACT_MANAGER | `erp` |
| `POST /erp/contracts/:id/payment-schedules/generate` | ERP_ADMIN, SYSTEM_WORKER | `erp` |
| `POST /erp/employees/onboard` | ERP_ADMIN, HR_ADMIN | `erp` |
| `POST /erp/employees/:id/time-off` | ERP_ADMIN, HR_ADMIN, EMPLOYEE | `erp` |
| `POST /erp/employees/:id/time-off/:reqId/approve` | ERP_ADMIN, HR_ADMIN | `erp` |
| `POST /erp/purchase-orders` | ERP_ADMIN, BUYER | `erp` |
| `POST /erp/purchase-orders/:id/goods-receipts` | ERP_ADMIN, BUYER, WAREHOUSE | `erp` |
| `POST /erp/purchase-orders/:id/service-entry-sheets` | ERP_ADMIN, BUYER | `erp` |
| `POST /erp/bills/:billId/invoice-match-runs` | ERP_ADMIN, ACCOUNTS_PAYABLE | `erp` |
| `POST /erp/sales-orders` | ERP_ADMIN, SALES | `erp` |
| `POST /erp/lease-contracts/:id/valuations` | ERP_ADMIN, ACCOUNTANT | `erp` |

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

`corepack yarn test --testPathPatterns=erp --runInBand --silent` — 3 suites y 50 pruebas aprobadas en la revisión ALOVIDA. El informe de evidencia y los hallazgos confirmados están en [`docs/revision-backend-2026-10-04/modulos/erp.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/erp.md).

## Pendiente

Los asientos contables derivados (GR/IR en la recepción, provisión de la valoración IFRS 16) se
enlazan mediante `journal_transaction_id`, que queda sin poblar: la contabilización pertenece al
módulo 16 y se conectará cuando exista el outbox.
