# Servicios de ERP

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

| Servicio | Casos de uso | Responsabilidad |
| --- | --- | --- |
| `ErpContractsService` | 01, 02, 03, 04, 05, 06, 07, 16 | Socios de negocio y ciclo de vida contractual |
| `ErpOperationsService` | 08 … 15 | RR. HH., compras, recepción, conciliación, ventas y arrendamientos |

## Reglas de negocio

- **Socio (01)**: la cuenta bancaria nace `unverified` y su identificador se persiste hasheado
  (SHA-256), nunca en claro.
- **Verificación (02)**: valida que la cuenta pertenezca al socio y rechaza verificar dos veces.
- **Contrato (03)**: nace `draft` con aprobación `pending`; se valida que termine después de empezar
  y que el número no se repita en el tenant.
- **Aprobación (04)**: aprobar activa el contrato. Rechazar deja la aprobación en `rejected` sin
  activarlo. Un contrato terminado no admite aprobación.
- **Enmienda (05)**: devuelve el contrato a `approval pending`, porque cambia lo pactado.
- **Renovación (06)**: exige que la nueva fecha extienda la vigencia; actualiza `endDate` y, si se
  pactó, el valor total.
- **Terminación (07)**: transición única a `terminated`.
- **Cronograma (16)**: idempotente. La cuota sale de dividir el valor total del contrato entre el
  número de plazos; sin valor total no se puede generar.
- **Ausencia (09)**: se rechaza si se solapa con otra `requested` o `approved` del mismo empleado.
  Resolver una solicitud ya resuelta es conflicto.
- **Orden de compra (10)**: el total se **deriva** de las líneas.
- **Recepción (11)**: aceptado por defecto = recibido; aceptar más de lo recibido se rechaza; la
  diferencia se marca como rechazo de calidad y la orden pasa a `received`.
- **Three-way match (13)**: compara facturado contra el valor de la orden (suma de líneas). Fuera de
  tolerancia se registra `variance` y se emite `warn`.

## Dependencias

`EntityManager`, los dos repositorios del módulo y `PinoLogger`. `ErpOperationsService` usa además
`ErpContractsRepository` para verificar que el socio (proveedor o cliente) exista: es una lectura de
validación, no escritura cruzada.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción. `FOR UPDATE` sobre contrato, cuenta bancaria, solicitud
de ausencia y orden de compra antes de mutarlos; `row_version` aporta bloqueo optimista automático.

## Excepciones

`ResourceNotFoundException` (socio, contrato, empleado, orden o solicitud inexistente),
`PreconditionFailedException` (fechas inválidas, contrato no mutable, cuenta ajena, aceptar más de lo
recibido, contrato sin valor) y `ConflictException` (número duplicado, cuenta ya verificada, contrato
ya terminado, ausencia solapada, solicitud ya resuelta).

## Logs

`operation: 'erp.<área>.<acción>'`. `warn` en desviaciones del three-way match. Nunca se loguean
identificadores bancarios, salarios ni datos personales del empleado.

## Pruebas

`erp-contracts.service.spec.ts` (22) y `erp-operations.service.spec.ts` (19): camino feliz,
precondiciones, conflictos, idempotencia y casos límite.
