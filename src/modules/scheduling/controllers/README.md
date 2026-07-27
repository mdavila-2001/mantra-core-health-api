# Controladores de scheduling

Capa HTTP. Validan, autorizan y delegan; la transacción vive en el servicio.

## Rutas

| Controlador | Prefijo | Endpoints |
| --- | --- | --- |
| `SchedulingController` | `scheduling` | UC-41-01, 02, 03, 04, 05, 06, 11 |
| `SchedulingBookingsController` | `scheduling/bookings` | UC-41-08, 09, 10, 13 |
| `SchedulingInternalController` | `scheduling/internal` | UC-41-07, 12, 14 |

## Autenticación y autorización

`JwtAuthGuard` global + `@Roles(...)`. La configuración de agenda exige `SCHEDULING_ADMIN`; las
operaciones sobre citas admiten además `SCHEDULING_AGENT` y `PATIENT`; un `PRACTITIONER` puede
registrar excepciones sobre su recurso.

Los endpoints de `scheduling/internal` exigen `SYSTEM_WORKER`: los dispara el scheduler, no la
interfaz de usuario. Se separan en su propio controlador para que ese límite sea explícito en la
ruta y no dependa solo del decorador.

## Validaciones HTTP

`ParseUUIDPipe` en todos los parámetros de ruta —incluido `holdToken`, que es un UUID— y
`ValidationPipe` global sobre los cuerpos.

## Códigos de respuesta

`201 Created` en altas (recurso, política, plantilla, slots, excepción, hold, cita, recordatorios,
lista de espera). `200 OK` en las que mutan un recurso existente: reprogramar, cancelar, check-in y
los tres endpoints de worker.

## Relación con los servicios

`SchedulingController` orquesta tres servicios porque agrupa el camino completo del usuario
(configurar, reservar, esperar). `SchedulingBookingsController` inyecta el de reservas y el de lista
de espera, ya que los recordatorios (UC-41-13) cuelgan de una cita pero pertenecen al dominio de
recordatorios.

## Pruebas

`scheduling.controller.spec.ts` cubre los tres controladores con servicios mockeados: delegación,
argumentos (incluido el actor y el límite de lote) y propagación de errores.
