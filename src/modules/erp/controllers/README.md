# Controladores de ERP

Capa HTTP. Validan, autorizan y delegan; la transacción vive en el servicio.

## Rutas

Un único controlador (`ErpController`, prefijo `erp`) con 17 endpoints sobre `business-partners`,
`contracts`, `employees`, `purchase-orders`, `bills`, `sales-orders` y `lease-contracts`.

## Autenticación y autorización

`JwtAuthGuard` global + `@Roles(...)`, con roles por área funcional en lugar de un único rol de
módulo: `CONTRACT_MANAGER` (contratos), `HR_ADMIN`/`EMPLOYEE` (ausencias), `BUYER`/`WAREHOUSE`
(compras y recepción), `ACCOUNTS_PAYABLE` (conciliación), `SALES`, `ACCOUNTANT` y `SYSTEM_WORKER`
(generación de cronogramas). `ERP_ADMIN` cubre todo.

Es deliberado que un `EMPLOYEE` pueda **solicitar** su ausencia pero no **aprobarla**: la aprobación
exige `HR_ADMIN`.

## Validaciones HTTP

`ParseUUIDPipe` en todos los parámetros de ruta, incluidos los dos de
`business-partners/:id/bank-accounts/:accId/verify` y `employees/:id/time-off/:reqId/approve`.
`ValidationPipe` global sobre los cuerpos.

## Rutas con dos parámetros

En `approveTimeOff` el controlador recibe empleado y solicitud, pero **delega solo la solicitud**:
el servicio resuelve por la solicitud, que ya conoce a su empleado. El primer parámetro se mantiene
en la ruta porque el caso de uso la define así y hace la URL legible.

## Códigos de respuesta

`201 Created` en las altas (socio, contrato, aprobación, enmienda, renovación, terminación,
cronograma, empleado, ausencia, orden, recepción, hoja, conciliación, venta, valoración).
`200 OK` en las dos que mutan un recurso existente: verificar cuenta y resolver ausencia.

## Nota sobre las rutas del caso de uso

Los casos de uso escriben algunas rutas con dos puntos (`/employees:onboard`,
`/bank-accounts/{accId}:verify`). Aquí se usan segmentos normales (`/employees/onboard`,
`/bank-accounts/:accId/verify`) para mantener el estilo del resto del proyecto y evitar el
tratamiento especial que Nest da a los `:` dentro de un path.

## Pruebas

`erp.controller.spec.ts` con ambos servicios mockeados: delegación, argumentos (incluido el actor y
los ids de ruta) y propagación de errores.
