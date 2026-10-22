# Revisión del módulo `payments` — ALOVIDA

## 1. Alcance y evidencia

- Fecha: 2026-10-05. Unidad: `src/modules/payments`, sus 3 controladores, 14 casos de uso, servicios, DTO, repositorios, entidades y DDL de `database/SQL/42_payments`.
- Inventario leído: 80 archivos TypeScript no spec, 7 specs y unas 12.034 líneas. Se recorrieron los flujos de intención, checkout, transacción, callback, reembolso, anulación, repartos, liquidación, payout, billetera y conciliación; se contrastaron con claves, FK e índices del DDL. No se auditó cada tabla auxiliar ni se conectó a una pasarela o base real.
- Evidencia dinámica: `corepack yarn test src/modules/payments --runInBand --silent` → **7 suites, 104 tests pasan**, exit 0. Los tests son unitarios con repositorios simulados: no prueban PostgreSQL, RLS, constraints, carrera ni HTTP completo.
- Límite: los hallazgos de aislamiento asumen la configuración por defecto conocida (`RLS_ENFORCE=false`); con RLS correctamente aplicada el acceso cross-tenant a tablas que sí tienen `tenant_id` queda contenido, pero no sustituye comprobaciones de relaciones ni protege tablas sin esa columna.

## 2. Resumen

| Severidad | Total | Hallazgos |
|---|---:|---|
| Alta | 3 | PAY-01 cálculo monetario con `Number`; PAY-02 checkout consulta y cambia deuda sin limitarla a su tenant; PAY-03 callback ignora el endpoint configurado y sus controles de replay/red. |
| Media | 4 | PAY-04 liquidación acepta líneas incompatibles y mueve estados; PAY-05 idempotencia por tenant contradice índice global; PAY-06 payout queda `PAID` sin ejecutar proveedor ni ligar fuentes; PAY-07 DTOs de lotes no tienen máximo. |

El HMAC de callback **sí** se resuelve por conexión de gateway, falla cerrado cuando falta secreto y archiva el evento con clave determinista. El reembolso y el importe capturado ya usan aritmética decimal exacta. Esos controles no refutan los puntos que siguen.

## 3. Hallazgos confirmados

### PAY-01 — Alta — importes monetarios vuelven a `Number` fuera del helper exacto

**Evidencia.** El módulo explica en [payment-money.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/services/payment-money.ts#L5-L14) por qué los importes deben mantenerse como cadenas decimales y ofrece `sumarImportes`/`compararImportes`. Sin embargo, [addSplit](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/services/payments-intents.service.ts#L317-L323) suma y compara `Number`; [multiply y percentageOf](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/services/payments-intents.service.ts#L424-L438) también redondean con float. [executePayout](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/services/payments-operations.service.ts#L231-L275), [runReconciliation](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/services/payments-operations.service.ts#L311-L375) y [WalletsService](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/services/wallets.service.ts#L94-L109) repiten el patrón.

**Escenario.** Para una intención `0.30` con reparto ya asignado `0.10`, solicitar otro `0.20` produce `0.30000000000000004 > 0.3`; se rechaza un total exactamente igual al permitido. En conciliación, `0.30 - 0.20` es `0.09999999999999998`: se abre una excepción por una diferencia que luego se persiste como `0.10`. Con montos grandes, `Number` además pierde precisión antes de `toFixed` (por ejemplo `999999999999999.99` se transforma en `1000000000000000.00`). `@IsNumberString` no fija escala ni rango.

**Refutación.** Los caminos de reembolso/captura sí usan el helper exacto y cubren el ejemplo de `0.10 + 0.20`; los 104 tests no cubren los caminos restantes con decimales límite. **Sostenido.**

**Corrección.** Extender el helper decimal a producto, porcentaje, suma neta y diferencia; declarar escala/rango por moneda antes de persistir y eliminar `Number` de cálculos monetarios. Agregar pruebas con `0.10/0.20/0.30`, tres y seis decimales y máximo admisible. Mantener los valores de riesgo (`riskScore`) separados: no son dinero.

### PAY-02 — Alta — checkout cambia una deuda localizada sólo por UUID

**Evidencia.** [PaymentsCheckoutService](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/services/payments-checkout.service.ts#L63-L114) toma `dto.paymentDebtId`, llama a `findDebtForUpdate(id)` y cambia su estado a `DEBT_IN_CHECKOUT`. El repositorio filtra sólo `{ id }` ([payment-flow.repository.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/repositories/payment-flow.repository.ts#L415-L424)); no compara `debt.tenantId`, `debt.gatewayConnectionId` ni la intención con el `tenantId`/conexión declarados. La sesión creada conserva el tenant de DTO ([servicio:84-98](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/services/payments-checkout.service.ts#L84-L98)), y FK garantiza existencia, no que deuda y sesión tengan el mismo dueño. El interceptor global sólo contrasta el `tenantId` de primer nivel con la membresía ([tenant-scope.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/tenant/tenant-scope.ts#L38-L70)).

**Impacto.** Con RLS desactivado, un `CASHIER` o `PAYMENTS_ADMIN` de T1 que conozca una deuda de T2 puede abrir una sesión en T1 vinculada a esa deuda y dejar la deuda de T2 en checkout. Con RLS activo, la lectura de `payment_debts` quedaría filtrada porque la tabla tiene `tenant_id`, pero la defensa no está activa por defecto y el servicio sigue permitiendo relaciones incoherentes si otro caller entra fuera del contexto HTTP.

**Refutación.** Hay bloqueo pesimista, por lo que dos cajeros no abren la misma deuda a la vez. Es control de concurrencia, no de pertenencia. Los unitarios prueban existencia/estado, no dos tenants. **Sostenido.**

**Corrección.** Buscar y bloquear por `{ id, tenantId: dto.tenantId, gatewayConnectionId: dto.gatewayConnectionId }`; verificar que el `paymentIntentId` opcional sea del mismo tenant/conexión/deuda antes de crear la sesión. Declarar un error de autorización o precondición estable sin revelar la existencia de una deuda ajena. Repetir ese criterio en reembolsos, anulaciones, liquidación y conciliación cuando reciban IDs externos.

### PAY-03 — Alta — callback firmado no usa la configuración del endpoint recibido

**Evidencia.** La ruta pública recibe `:callbackPath` ([controller](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/controllers/payments-operations.controller.ts#L80-L100)), pero [applyCallback](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/services/payments-transactions.service.ts#L258-L336) sólo usa el parámetro para archivarlo en JSON. Resuelve secreto por la conexión de la intención ([resolver](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/services/webhook-secret.resolver.ts#L32-L55)); no consulta `provider_callback_endpoints`. El DTO no contiene timestamp ([payment-transaction.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/dto/payment-transaction.dto.ts#L107-L145)). El DDL, en cambio, modela `callback_path`, `allowed_source_cidrs_json` y `replay_window_seconds` ([tablas](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/42_payments/02_tables.sql#L746-L795)) junto con eventos de proveedor que tienen `external_event_id` e información redacted.

**Impacto.** Un callback con HMAC válido de la conexión se acepta por cualquier `callbackPath`; el sistema no verifica que el endpoint esté activo, corresponda a la conexión, venga de red permitida ni esté dentro de su ventana temporal. La deduplicación derivada de cuerpo evita repetir exactamente el mismo resultado, pero no es una verificación de endpoint ni de antigüedad.

**Refutación.** La firma no es opcional en el servicio y la rotación de secreto está cubierta por specs. Eso autentica contenido con una conexión, pero deja inertes los controles ya modelados para la superficie de endpoint. **Sostenido.**

**Corrección.** Resolver primero el endpoint por `callbackPath`, exigir estado activo y que pertenezca a la conexión de la transacción; definir por proveedor un contrato de bytes/campos firmados que incluya evento y timestamp. Comprobar ventana y CIDR antes de mutar; guardar `external_event_id` para idempotencia del proveedor y registrar rechazo saneado. Requiere acuerdo de contrato con cada pasarela antes de activar el rechazo.

### PAY-04 — Media — importar una liquidación no valida estado, gateway, moneda ni totales de sus líneas

**Evidencia.** [importSettlement](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/services/payments-operations.service.ts#L163-L200) crea cada línea y, si encuentra la transacción por UUID, le asigna `TXN_SETTLED` sin comprobar estado previo, gateway, moneda ni que la línea pertenezca a ese lote. El DTO acepta `grossAmount`, `feeAmount`, `netAmount` y líneas, pero no coteja su relación ([payment-operations.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/dto/payment-operations.dto.ts#L172-L239)). `settlement_lines` tampoco tiene constraint de unicidad por transacción/lote en el DDL ([02_tables.sql](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/42_payments/02_tables.sql#L198-L230)).

**Impacto y corrección.** Un import administrativo equivocado puede liquidar una transacción fallida, de otro gateway o repetida, dejando totales de lote incompatibles con sus líneas. Validar cada transacción como capturada y del gateway/moneda esperados, rechazar o abrir excepción para la incompatible y comprobar `gross - fee = net` y agregados de líneas con aritmética exacta. Definir con negocio si una misma transacción admite más de una línea de liquidación antes de añadir una restricción.

### PAY-05 — Media — contrato de idempotencia por tenant contradice el índice único global

**Evidencia.** El repositorio busca una intención por `{ tenantId, idempotencyKey }` ([payment-intents.repository.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/repositories/payment-intents.repository.ts#L110-L116)) y el README describe una clave por tenant. El DDL crea `uq_payment_intents_idempotency_key` sobre sólo `idempotency_key` ([04_indexes.sql](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/42_payments/04_indexes.sql#L53-L54)). Dos tenants que reutilicen una clave válida no encuentran la fila ajena y el segundo insert termina en conflicto de base, no en `reused=true`.

**Corrección.** Elegir y documentar semántica global o por tenant. Si es por tenant, usar unicidad compuesta `(tenant_id, idempotency_key)` y capturar la carrera de dos requests del mismo tenant para volver a leer y devolver la respuesta idempotente. Si es global, quitar el filtro de tenant no es aceptable porque revelaría/mezclaría recursos: requerir claves globalmente opacas y devolver conflicto catalogado sin existencia.

### PAY-06 — Media — payout pasa directamente a `PAID` sin ejecutar pasarela ni vincular sus fuentes

**Evidencia.** [executePayout](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/services/payments-operations.service.ts#L245-L270) crea el payout `PAYOUT_PAID` y sus ítems sin llamada a adaptador de gateway, sin cargar `payeeRefId` y sin comprobar que `sourceRefId` sea una transacción liquidable. `payout_items.source_ref_id` no tiene FK a transacción ([tabla](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/42_payments/02_tables.sql#L182-L195)); sólo existe FK al payout y a conceptos. El módulo reconoce para transacciones que no hay adaptador y conserva `PROCESSING` hasta callback ([payments-transactions.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/services/payments-transactions.service.ts#L47-L52)), pero el payout no sigue esa contención.

**Corrección.** Registrar el payout como solicitado/procesando, enviar la orden por un adaptador idempotente y marcar pagado sólo con confirmación verificable. Validar cuenta conectada, gateway, moneda, período y cada fuente; decidir una clave de idempotencia o constraint para impedir incluir la misma fuente dos veces. Hasta entonces, presentar la ruta como registro administrativo, no como ejecución de pago.

### PAY-07 — Media — lotes sin cota permiten consumo no acotado

**Evidencia.** `ImportSettlementDto.lines`, `CreatePayoutDto.items` y `CreateReconciliationRunDto.providerRecords` usan `@IsArray` y, salvo mínimo de uno en los dos primeros, no tienen `@ArrayMaxSize` ([DTO](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/dto/payment-operations.dto.ts#L228-L239), [361-368](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/dto/payment-operations.dto.ts#L361-L368), [491-500](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/payments/dto/payment-operations.dto.ts#L491-L500)). Los servicios hacen una escritura o búsqueda por elemento dentro de una única transacción.

**Corrección.** Definir tamaños máximos por lote y paginación/importación asíncrona para extractos grandes; validar total y duplicados antes de abrir la transacción, usar operaciones por lote y medir tiempo, consultas y rollback en máximo y máximo+1.

## 4. Pruebas propuestas

| Hallazgo | Correcto | Límite | Error | Falla catalogada propuesta |
|---|---|---|---|---|
| PAY-01 | Repartos `0.10` + `0.20` sobre `0.30` aceptan. | Moneda con seis decimales y monto máximo no pierde escala. | Comisión mayor al ítem rechaza sin payout. | `422/PRECONDITION_FAILED/PAYMENT_AMOUNT_INVALID`. |
| PAY-02 | Cajero T1 abre deuda T1/conexión T1. | Dos cajeros simultáneos: una sesión, una respuesta de conflicto. | T1 apunta a deuda T2 con RLS apagado y encendido. | `404/RESOURCE_NOT_FOUND/PAYMENT_DEBT_NOT_AVAILABLE` sin revelar T2. |
| PAY-03 | Endpoint activo, evento nuevo, HMAC/timestamp/CIDR válidos aplica una vez. | Reentrega mismo `external_event_id` no muta. | Path de otra conexión, timestamp viejo o CIDR ajeno no mutan. | `401/UNAUTHENTICATED/PAYMENT_CALLBACK_VERIFICATION_FAILED`. |
| PAY-04 | Lote consistente de capturas propias marca sólo esas transacciones. | Reimport de misma referencia devuelve el lote existente. | Línea FAILED, moneda/gateway distinto o total incoherente revierte entero. | `422/PRECONDITION_FAILED/SETTLEMENT_LINE_INVALID`. |
| PAY-05 | Dos reintentos concurrentes de T1 devuelven mismo intent. | Misma clave tras respuesta perdida se reutiliza. | T2 usa misma clave sin bloquearse por T1 cuando la semántica es por tenant. | `409/CONFLICT/IDEMPOTENCY_KEY_REUSED` sólo si se elige semántica global. |
| PAY-06 | Fuente liquidada y cuenta válida llega a adaptador y callback la marca pagada. | Reintento no duplica la orden externa. | Fuente ya incluida o cuenta/gateway ajenos no crean payout. | `409/CONFLICT/PAYOUT_SOURCE_ALREADY_ALLOCATED`. |
| PAY-07 | Lote justo al máximo se procesa. | Máximo de registros conserva tiempo/consultas aceptables. | Máximo+1 rechaza antes de abrir transacción. | `400/VALIDATION_FAILED/PAYMENT_BATCH_TOO_LARGE`. |

Las tuplas de esta tabla son propuestas: no existen todavía como contrato uniforme. Cada caso debe ejecutarse en PostgreSQL temporal con `RLS_ENFORCE=false` y `true` donde corresponda; un mock de repositorio no demuestra constraints ni políticas.

## 5. Orden de corrección y límites

1. **Ola 0:** PAY-02 y PAY-03; bloquean cambios de deuda ajena y fortalecen la superficie pública del callback. Acordar contrato de pasarela antes de romper webhooks existentes.
2. **Ola 1:** PAY-01, PAY-04 y PAY-06; introducir aritmética decimal, estados transitorios y verificaciones de consistencia en una migración compatible con los datos existentes.
3. **Ola 2:** PAY-05 y PAY-07; acordar semántica de clave y límites operativos, después agregar constraints/validación y pruebas de carrera.

No se hicieron cambios de código, DDL ni datos. Tampoco se concluye que un cobro real haya sido duplicado o que una pasarela real acepte los escenarios: la conclusión es estática, respaldada por las rutas, repositorios, DTO y esquema señalados.
