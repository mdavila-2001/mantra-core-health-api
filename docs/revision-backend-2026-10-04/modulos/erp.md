# Revisión del módulo `erp` — ALOVIDA

## Alcance y evidencia

Se revisaron los dieciséis casos de uso, controlador, DTO, servicios, repositorios y pruebas del módulo. `corepack yarn test --testPathPatterns=erp --runInBand --silent` aprobó **3 suites y 50 pruebas**. La cobertura dirigida comprueba reglas de transición, importes, bloqueo pesimista e idempotencia, pero no presenta una matriz de dos tenants, relaciones entre recursos ni la identidad del empleado.

## Hallazgos confirmados

### ERP-01 — Crítica — Recursos ERP financieros y contractuales se cargan por UUID sin alcance de tenant

Las rutas protegen el acceso por rol, pero entregan el actor sin un tenant resuelto al servicio ([`erp.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/controllers/erp.controller.ts#L55-L292)). Los DTO de alta reciben `tenantId` del cliente para socios, contratos, órdenes, recepciones, hojas de servicio, conciliaciones y ventas ([`erp.dto.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/dto/erp.dto.ts#L14-L28), [`erp.dto.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/dto/erp.dto.ts#L647-L911), [`erp.dto.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/dto/erp.dto.ts#L966-L1007)); los servicios lo persisten y consultan socios, contratos y órdenes referenciados sólo por ID ([`erp-contracts.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/services/erp-contracts.service.ts#L232-L261), [`erp-operations.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/services/erp-operations.service.ts#L232-L256), [`erp-operations.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/services/erp-operations.service.ts#L291-L414), [`erp-operations.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/services/erp-operations.service.ts#L431-L482)).

Los repositorios confirman el defecto de alcance: `findPartnerById`, `findContractByIdForUpdate`, `findBankAccountForUpdate` y `findPurchaseOrderForUpdate` consultan `{ id }` sin `tenantId` ([`erp-contracts.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/repositories/erp-contracts.repository.ts#L162-L167), [`erp-contracts.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/repositories/erp-contracts.repository.ts#L255-L263), [`erp-contracts.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/repositories/erp-contracts.repository.ts#L306-L315), [`erp-operations.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/repositories/erp-operations.repository.ts#L283-L292)). Así, un usuario con un rol ERP válido que conozca el UUID de otro tenant puede verificar su cuenta bancaria, aprobar/enmendar/renovar/terminar su contrato, generar cuotas, marcar su orden como recibida o producir documentos que mezclan el `tenantId` aportado con recursos ajenos. El lock pesimista evita carreras, no autoriza el recurso.

**Plan:** resolver la organización desde la sesión y no desde el body; hacer que cada consulta de recursos tenantizados use `id + tenantId` y devuelva `404` uniforme fuera de alcance. Validar además que cada socio, contrato, factura y orden referenciada pertenece al mismo tenant antes de crear relaciones. Cubrir la política también con RLS de integración, sin tomarla como sustituto de la autorización de aplicación.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | `BUYER` del tenant A registra recepción de una orden A con proveedor A | `201`, relaciones y tenant A consistentes |
| Límite | Contrato, socio y orden del mismo tenant se encadenan | operación permitida y referencias del mismo tenant |
| Error | Mismo rol de A envía UUID de contrato, cuenta u orden de B | `404`, sin escritura |
| Falla catalogada | `tenantId` del body no coincide con el recurso o la sesión | `404/RESOURCE_NOT_FOUND/ERP_RESOURCE_NOT_FOUND`, razón estable |

### ERP-02 — Alta — El rol `EMPLOYEE` puede solicitar ausencia para cualquier empleado y la aprobación ignora el empleado de la ruta

`POST /erp/employees/:id/time-off` admite `EMPLOYEE` ([`erp.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/controllers/erp.controller.ts#L190-L201)). `requestTimeOff` carga cualquier empleado con `findEmployeeById(tx, employeeId)` y crea la solicitud; nunca compara `employee.personUserId` con `actor.id`, ni comprueba práctica o tenant ([`erp-operations.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/services/erp-operations.service.ts#L104-L170), [`erp-operations.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/repositories/erp-operations.repository.ts#L140-L148)). Las pruebas usan sólo el actor administrador y un mock de empleado sin identidad, por lo que no ejercitan la regla de empleado propio ([`erp-operations.service.spec.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/services/erp-operations.service.spec.ts#L19-L20), [`erp-operations.service.spec.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/services/erp-operations.service.spec.ts#L68-L110)).

Además, la ruta de aprobación recibe `:id` de empleado y `:reqId`, pero el controlador descarta `id` y envía sólo `reqId`; el servicio carga la solicitud exclusivamente por ese UUID ([`erp.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/controllers/erp.controller.ts#L203-L213), [`erp-operations.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/services/erp-operations.service.ts#L175-L210), [`erp-operations.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/repositories/erp-operations.repository.ts#L217-L225)). Esto vuelve inefectiva la pertenencia que expresa la URL y deja las dos operaciones sin límite de organización.

**Plan:** para `EMPLOYEE`, exigir `employee.personUserId === actor.id`; para RR. HH. y administración, resolver práctica/tenant del actor y del empleado. En aprobación cargar `reqId` junto con `employeeId` y el alcance de la organización; rechazar la discrepancia sin revelar si existe la solicitud. Añadir razones estables para acceso y recurso fuera de alcance.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Empleado vinculado solicita su propia ausencia | `201`, solicitud `REQUESTED` |
| Límite | `HR_ADMIN` de la misma práctica aprueba solicitud de ese empleado | `200`, estado actualizado |
| Error | `EMPLOYEE` A solicita ausencia usando el UUID de B | `403`, sin solicitud creada |
| Falla catalogada | `:id` no coincide con el `employeeId` de `:reqId` o pertenece a otra práctica | `404/RESOURCE_NOT_FOUND/ERP_TIME_OFF_NOT_FOUND`, razón estable |

### ERP-03 — Alta — Una recepción acepta líneas que no pertenecen a la orden de compra indicada

El DTO permite que el cliente aporte cada `purchaseOrderItemId` ([`erp.dto.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/dto/erp.dto.ts#L739-L805)). `createGoodsReceipt` sólo bloquea y valida la cabecera `purchaseOrderId`; dentro del bucle toma cada ID directamente para crear `GoodsReceiptItems`, sin consultar la línea ni comprobar que sea hija de esa orden ([`erp-operations.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/services/erp-operations.service.ts#L305-L365), [`erp-operations.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/repositories/erp-operations.repository.ts#L430-L480)). La prueba dirigida verifica cantidades y el cierre de orden, pero sus mocks no representan propiedad de línea ni una orden distinta ([`erp-operations.service.spec.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/erp/services/erp-operations.service.spec.ts#L181-L264)).

Esto permite registrar una recepción sobre la cabecera A enlazando líneas de B, incluso de otro tenant cuando el hallazgo ERP-01 también está presente. El resultado corrompe trazabilidad de inventario y la base de los controles de conciliación posterior.

**Plan:** cargar todas las líneas solicitadas dentro de la misma transacción por `id IN (...) + purchaseOrderId`, verificar cardinalidad, duplicados y tenant antes de crear la recepción. Rechazar cualquier línea ausente o ajena antes de persistir cambios y usar cantidades acumuladas si la regla impide sobre recepción.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Todas las líneas pertenecen a la orden abierta | `201`, recepción y líneas consistentes |
| Límite | Varias líneas válidas de la misma orden, una con rechazo parcial | importes y rechazo calculados correctamente |
| Error | Una línea corresponde a otra orden del mismo tenant | `422`, sin recepción ni cambio de estado |
| Falla catalogada | Línea inexistente, repetida o de otro tenant | `422/PRECONDITION_FAILED/ERP_PO_ITEM_NOT_IN_ORDER`, razón estable |

## Controles que se conservan

Las reglas funcionales existentes sí cubren cuenta bancaria inicialmente no verificada, hash de identificador bancario, fechas contractuales, contrato terminado, renovación que extiende, terminación única, cronograma idempotente, ausencia solapada, total derivado de líneas, recepción cerrada y límite `accepted <= received`, además de la desviación del three-way match. Las correcciones deben conservarlas junto con el bloqueo pesimista y las transacciones actuales.
