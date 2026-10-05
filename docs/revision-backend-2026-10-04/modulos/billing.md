# Revisión del módulo `billing` — ALOVIDA

## 1. Alcance, método y límites

- Fecha: 2026-10-05. Unidad: `src/modules/billing` y `database/SQL/17_billing`.
- Lectura: 70 archivos TypeScript no spec (9.701 líneas), 16 specs, 4 controladores, 16 rutas, 13 servicios, repositorios, DTO, entidades, FK, índices y constraints relevantes. Se recorrieron emisión/nota de crédito/plan, cobros y pagos, cuentas por pagar, conciliación, dunning, reembolso, estados y KPI.
- Evidencia dinámica: `corepack yarn test src/modules/billing --runInBand --silent` → **16 suites y 94 tests pasan**, exit 0. Son unitarios con repositorios simulados; no verifican constraints, concurrencia, RLS ni autorización HTTP completa.
- No cubierto: datos reales de prácticas, accounting/insurance/purchase orders, pasarela bancaria, migraciones contra DB desplegada y cada catálogo de conceptos. No se afirma que haya ocurrido un movimiento real de dinero.

## 2. Resumen ejecutivo

| Severidad | Total | Hallazgos |
|---|---:|---|
| Crítica | 1 | BILL-01: operaciones de escritura monetaria aceptan práctica/documento de otro tenant sin comprobar pertenencia. |
| Alta | 2 | BILL-02: asignaciones permiten descuento y signos que alteran saldo fuera del monto pagado; BILL-03: facturas y bills aceptan líneas monetarias negativas/inconsistentes. |
| Media | 3 | BILL-04: garantías de idempotencia sólo por lectura previa; BILL-05: lote sin máximo; BILL-06: conversión monetaria `Number` pierde precisión. |

`InvoicesService.listByPractice/getDetail`, `PatientStatementsService.listByPractice` y el catálogo de servicios sí consultan `PracticeTenantLookupService`. Esa defensa no está en los writes identificados.

## 3. Mapa de la unidad

| Superficie | Rutas principales | Roles | Datos mutados |
|---|---|---|---|
| CxC | emisión, cobro, nota de crédito, reembolso, estado, plan; listado/detalle | `SECURITY_ADMIN` | `invoices`, líneas, pagos recibidos, asignaciones, estados, vínculos. |
| CxP | `POST /billing/bills`, `POST /billing/payments-made:execute` | `SECURITY_ADMIN` | bills, líneas, pagos emitidos y asignaciones. |
| Operaciones | posting, conciliación, dunning, job de dunning, KPI | `SECURITY_ADMIN`; job además `SYSTEM` | documentos, pagos, dunning y snapshots. |
| Catálogo | servicios y nomenclador | lectura sin `@Roles`; escritura con administración/profesional | `service_catalog`. |

Las tablas financieras principales tienen `practice_id`, no `tenant_id` ([DDL](../../../database/SQL/17_billing/02_tables.sql#L26-L205)). La política RLS genérica se instala sólo sobre tablas que poseen `tenant_id`; por ello no contiene por sí sola `invoices`, `bills`, `payments_received` ni `payments_made`. El módulo no tiene `billing.error-reasons.ts` en esta rama; sus errores de negocio no tienen `reason` estable por operación.

## 4. Hallazgos confirmados

### BILL-01 — Crítica — escrituras financieras no atan práctica y documentos al tenant del actor

**Evidencia.** El rol se decide contra el tenant resuelto ([RolesGuard](../../../src/common/auth/roles.guard.ts#L61-L87)), pero `ApplyPaymentReceivedDto` y `ExecutePaymentMadeDto` sólo traen `practiceId` ([cobro](../../../src/modules/billing/dto/payment-received.dto.ts#L57-L134), [pago](../../../src/modules/billing/dto/payment-made.dto.ts#L63-L131)); el interceptor sólo contrasta campos llamados `tenantId`/`custodianTenantId`. `PaymentsReceivedService` crea el pago con esa práctica y obtiene cada factura por sólo `{ id }` ([servicio](../../../src/modules/billing/services/payments-received.service.ts#L88-L155), [repositorio](../../../src/modules/billing/repositories/invoices.repository.ts#L136-L140)). `PaymentsMadeService` hace lo equivalente con bills ([servicio](../../../src/modules/billing/services/payments-made.service.ts#L87-L149), [repositorio](../../../src/modules/billing/repositories/bills.repository.ts#L136-L140)). Emisión, nota de crédito, plan, conciliación, reembolso y dunning también cargan/actualizan por UUID sin esa comprobación.

**Escenario e impacto.** Un `SECURITY_ADMIN` con rol de T1 y UUID conocido de factura T2 puede mandar práctica T1/factura T2: se crea un pago de T1, se cambia el saldo/estado de T2 y quedan asignaciones cruzadas. La misma clase alcanza notas de crédito, plan, conciliación y dunning. FK sólo confirma existencia y las tablas señaladas no tienen `tenant_id`, por lo que RLS no refuta el caso. **Sostenido.**

**Plan.** 1) Crear política de alcance de documento financiero: resolver tenant de práctica y cargar invoice/bill/pago junto a su práctica; 404 indistinguible si no coincide. 2) Ejecutarla dentro de servicios antes de `flush`/mutar. 3) Verificar paciente, vendor, banco, encounter, claim, purchase order y clearing document contra práctica autorizada. 4) Añadir FKs compuestas o checks donde el modelo lo permita. 5) Probar T1/T2 con RLS apagado y encendido.

### BILL-02 — Alta — descuentos y signos permiten cerrar o aumentar saldos sin respaldo del pago

**Evidencia.** El cobro limita sólo `sum(allocatedAmount) <= payment.amount` ([PaymentsReceivedService:77-85](../../../src/modules/billing/services/payments-received.service.ts#L77-L85)), pero reduce el saldo por `allocated + discount` ([141-150](../../../src/modules/billing/services/payments-received.service.ts#L141-L150)). Los DTO aceptan ambos valores con `@IsNumberString` sin positividad ([DTO](../../../src/modules/billing/dto/payment-received.dto.ts#L30-L43)); CxP repite el patrón para asignación/descuento/retención ([PaymentsMadeService:73-85](../../../src/modules/billing/services/payments-made.service.ts#L73-L85), [137-146](../../../src/modules/billing/services/payments-made.service.ts#L137-L146)). El DDL deja esos campos `numeric` sin checks ([asignaciones](../../../database/SQL/17_billing/02_tables.sql#L299-L327)).

**Escenario.** Para saldo `100.00`, pago `1.00`, asignación `1.00` y descuento `99.00`, el límite global pasa y la factura termina en cero. Una asignación negativa pasa la comparación, reduce `paidTotal` y aumenta el saldo. Las pruebas cubren exceso de asignación/retención, no descuento ni signo. **Sostenido.**

**Plan.** Validar positivos/cero por campo y exigir `allocated + discount (+ withholding) <= saldo`; registrar write-off/descuento autorizado con razón, usuario y cuenta contable. Incluir todos los efectos en el límite, eliminar `Math.max(0, ...)` como ocultamiento de exceso y añadir checks SQL tras revisar datos históricos.

### BILL-03 — Alta — líneas de factura, bill y nota de crédito no validan sus importes

**Evidencia.** Factura calcula `Number(quantity) * toCents(unitPrice) - discount + tax` sin validar resultado ([InvoicesService:91-105](../../../src/modules/billing/services/invoices.service.ts#L91-L105)); bill repite la fórmula ([BillsService:105-114](../../../src/modules/billing/services/bills.service.ts#L105-L114)). La nota de crédito anuncia cantidad positiva pero acepta `@IsNumberString` sin signo ([DTO](../../../src/modules/billing/dto/invoice.dto.ts#L216-L249)) y recalcula sin validar ([InvoicesService:189-205](../../../src/modules/billing/services/invoices.service.ts#L189-L205)). Columnas numeric de líneas no tienen checks.

**Impacto y plan.** Cantidad/precio/impuesto negativo o descuento superior a base producen total/balance negativo o exagerado. Definir precisión, escala y reglas por documento; validar con decimal exacto y rechazar neto inválido. Añadir checks SQL y pruebas de línea negativa, descuento extremo y write-off trazable.

### BILL-04 — Media — idempotencia por lectura previa sin garantía de esquema

**Evidencia.** Statements y KPI hacen `find` previo e insertan, sin índice único de su clave lógica. Facturas y bills verifican número por práctica, pero el índice de facturas es global sólo por `invoice_number` ([índice](../../../database/SQL/17_billing/04_indexes.sql#L125-L151)); dos prácticas no cumplen la semántica anunciada. Dunning sí tiene UK `(tenant_id, run_number)` ([04_indexes.sql](../../../database/SQL/17_billing/04_indexes.sql#L57-L71)), pero una carrera saldrá como error de base al no traducirse.

**Plan.** Precisar claves, añadir constraint compatible, traducir `unique_violation` a conflicto catalogado y volver a leer después de carrera. Limpiar duplicados antes de migrar.

### BILL-05 — Media — lotes de asignaciones y dunning no tienen tope

**Evidencia.** `allocations`, `lines`, cuotas e `items` exigen array/mínimo, pero no `@ArrayMaxSize` ([cobro](../../../src/modules/billing/dto/payment-received.dto.ts#L124-L134), [pago](../../../src/modules/billing/dto/payment-made.dto.ts#L121-L131), [dunning](../../../src/modules/billing/dto/dunning.dto.ts#L104-L115)); servicios hacen lookup/escritura por elemento en una transacción.

**Plan.** Fijar máximos, deduplicar IDs, pasar imports masivos a job paginado y medir máximo/máximo+1.

### BILL-06 — Media — `toCents` usa coma flotante y normaliza inválidos a cero

**Evidencia.** [money.util.ts](../../../src/modules/billing/money.util.ts#L10-L28) pasa por `Number`, redondea y convierte valor no finito en cero. El helper se usa en pagos, descuentos, totales, cuotas y reembolsos.

**Plan.** Usar `BigInt` decimal escalado, validar sintaxis/escala/rango antes de convertir y rechazar inválidos. Cubrir `0.10 + 0.20`, seis decimales, máximo seguro y texto inválido.

## 5. Pruebas de cuatro puntos

| ID | Correcto | Límite | Error | Falla catalogada propuesta |
|---|---|---|---|---|
| BILL-01 | Admin T1 opera documentos T1. | Dos prácticas del mismo tenant con relaciones válidas. | T1 usa UUID de T2; cero mutaciones. | `404/RESOURCE_NOT_FOUND/BILLING_DOCUMENT_NOT_AVAILABLE`. |
| BILL-02 | Pago/asignación/descuento autorizado suma saldo. | Varios descuentos igualan saldo. | Signo negativo o suma mayor a saldo. | `422/PRECONDITION_FAILED/BILLING_ALLOCATION_AMOUNT_INVALID`. |
| BILL-03 | Línea válida calcula total. | Descuento igual a base si contrato lo permite. | Cantidad, precio, impuesto negativo o descuento mayor. | `400/VALIDATION_FAILED/BILLING_LINE_AMOUNT_INVALID`. |
| BILL-04 | Reintento concurrente devuelve un resultado. | Timeout reintenta la misma clave. | Colisión de negocio no expone driver. | `409/CONFLICT/BILLING_DUPLICATE_BUSINESS_KEY`. |
| BILL-05 | Lote al máximo se procesa. | Duplicados se rechazan antes de persistir. | Máximo+1 no abre transacción. | `400/VALIDATION_FAILED/BILLING_BATCH_TOO_LARGE`. |
| BILL-06 | Decimal permitido conserva centavos. | Monto máximo exacto persiste. | Escala o monto inválido. | `400/VALIDATION_FAILED/BILLING_AMOUNT_INVALID`. |

Las tuplas son propuestas; hoy no existen como catálogo uniforme. Cada caso requiere PostgreSQL temporal, no sólo mocks.

## 6. Matriz de superficie revisada

| Grupo | Correcto | Límite | Error | Falla catalogada |
|---|---|---|---|---|
| Emisión, crédito y plan | práctica autorizada | totales/cuotas exactos | práctica/factura ajena o línea inválida | `BILLING_DOCUMENT_NOT_AVAILABLE` / `BILLING_LINE_AMOUNT_INVALID`. |
| Cobro y CxP | asignación propia consistente | múltiples ítems exactos | cruce de práctica, descuento/signo inválido | `BILLING_DOCUMENT_NOT_AVAILABLE` / `BILLING_ALLOCATION_AMOUNT_INVALID`. |
| Reembolso, conciliación, dunning, KPI | recursos propios | reintento idempotente | UUID ajeno, duplicado, lote excesivo | reason por operación a catalogar. |
| Catálogo y lecturas | práctica del tenant | cursor/límite máximo | práctica ajena | actual 404 genérico; proponer `BILLING_PRACTICE_NOT_AVAILABLE`. |

## 7. Catálogo propuesto

| Reason | Estado/código | Uso |
|---|---|---|
| `BILLING_DOCUMENT_NOT_AVAILABLE` | `404 / RESOURCE_NOT_FOUND` | Documento/práctica fuera del tenant o inexistente. |
| `BILLING_ALLOCATION_AMOUNT_INVALID` | `422 / PRECONDITION_FAILED` | Asignación, descuento o retención inválida. |
| `BILLING_LINE_AMOUNT_INVALID` | `400 / VALIDATION_FAILED` | Cantidad, precio, impuesto o descuento inválido. |
| `BILLING_DUPLICATE_BUSINESS_KEY` | `409 / CONFLICT` | Colisión de clave/idempotencia. |
| `BILLING_BATCH_TOO_LARGE` | `400 / VALIDATION_FAILED` | Array sobre el máximo. |
| `BILLING_AMOUNT_INVALID` | `400 / VALIDATION_FAILED` | Decimal fuera de formato, escala o rango. |

## 8. Olas de corrección

| Ola | Hallazgos | Esfuerzo | Dependencia/riesgo |
|---|---|---|---|
| 0 | BILL-01 | L | Política compartida de práctica/documento; revisar callers y relaciones históricas. |
| 1 | BILL-02, BILL-03, BILL-06 | M | Definir contabilidad de descuento/write-off y precisión; puede revelar datos inválidos. |
| 2 | BILL-04, BILL-05 | M | Elegir claves/límites y migrar duplicados antes de índices. |

## 9. Trabajo pendiente de integrar y cierre

El plan identifica `fa74b78c` con catálogo de reasons para `billing`; contrastar al llegar a `dev`, sin atribuirle una corrección todavía. No se editaron fuentes, SQL ni datos. Los 94 tests verdes no prueban los escenarios de tenant, constraint o carrera descritos.
