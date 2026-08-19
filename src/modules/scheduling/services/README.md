# Servicios de scheduling

Lógica de negocio de la agenda. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

| Servicio                    | Casos de uso           | Responsabilidad                                                        |
| --------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `SchedulingCatalogService`  | 01, 02, 03, 04         | Recursos, políticas, plantillas, slots y excepciones                   |
| `SchedulingBookingsService` | 05, 06, 07, 08, 09, 10 | Holds, confirmación, expiración, reprogramación, cancelación, check-in |
| `SchedulingWaitlistService` | 11, 12, 13, 14         | Lista de espera y recordatorios                                        |

## Reglas de negocio

- **Hold (05)**: `FOR UPDATE` sobre el slot, decremento de `remaining_capacity`, TTL de la política.
  Se rechaza si no hay cupo, si el slot está bloqueado o si el paciente supera `max_active_per_patient`.
- **Confirmación (06)**: exige hold `active` y **no vencido**; consume el hold, crea la cita y
  programa los recordatorios pedidos. Comprobar `expires_at` evita que una petición tardía se cuele
  sobre un cupo que ya se considera libre.
- **Expiración (07)**: lote con `SKIP LOCKED`, devuelve el cupo y reabre el slot. Idempotente.
- **Reprogramación (08)**: libera el cupo del slot origen y toma el del destino en la misma
  transacción; registra el movimiento en `booking_reschedules`.
- **Cancelación (09)**: libera el cupo; el cargo solo se aplica si la política lo define y es no-show.
- **Generación de slots (03)**: idempotente por instante de inicio, con tope de 2000 por ejecución.
- **Excepciones (04)**: solo bloquean slots libres e intactos; las citas confirmadas no se tocan.
- **Promoción de lista de espera (12)**: marca candidatos; no reserva por ellos.
- **Despacho de recordatorios (14)**: mueve el estado a enviado; el envío real es de messaging (35).

## Dependencias

`EntityManager`, los dos repositorios del módulo y `PinoLogger`. Sin dependencias cruzadas con
otros módulos.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción. `FOR UPDATE` sobre slot, hold y cita antes de mutar;
`SKIP LOCKED` en el worker de expiración. `row_version` aporta bloqueo optimista automático.

## Excepciones

`ResourceNotFoundException` (slot, cita o recurso inexistente), `PreconditionFailedException`
(estado que no habilita la operación, ventana inválida) y `ConflictException` (sin cupo, hold
vencido o consumido, límite de citas alcanzado, cita ya cancelada).

## Logs

`operation: 'scheduling.<área>.<acción>'`. Nivel `warn` cuando la generación de slots alcanza el
tope por ejecución. Nunca se loguea el token del hold.

## Pruebas

`scheduling-bookings.service.spec.ts` (19) y `scheduling-catalog.service.spec.ts` (16, incluye
`SchedulingWaitlistService`): camino feliz, precondiciones, conflictos, idempotencia y casos límite.
