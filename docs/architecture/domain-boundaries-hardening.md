# MCH-030 · servicios extensos: inventario y plan de descomposición

**Commit auditado:** `36a20a15` (`origin/dev`, 18-19/09/2026). **Medido con:**
`find src/modules -name "*.service.ts" ! -name "*.spec.ts" -exec wc -l {} \; | sort -rn`
— líneas físicas, comentarios incluidos. No es una medida de complejidad
ciclomática ni de acoplamiento; es lo que el hallazgo original medía, y esta
ficha lo vuelve a medir contra el código actual en vez de asumir el número del
snapshot `d1116801`.

## Top 15 servicios por líneas físicas

| # | Líneas | Servicio |
|---|-------:|----------|
| 1 | 3294 | `src/modules/scheduling/services/scheduling-bookings.service.ts` |
| 2 | 2602 | `src/modules/profiles/services/profiles-practitioners.service.ts` |
| 3 | 2557 | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts` |
| 4 | 2478 | `src/modules/profiles/services/profiles-patients.service.ts` |
| 5 | 2253 | `src/modules/scheduling/services/scheduling-catalog.service.ts` |
| 6 | 1572 | `src/modules/procedures_perioperative/services/periop-cases.service.ts` |
| 7 | 1562 | `src/modules/promotions/services/promotions-loyalty.service.ts` |
| 8 | 1461 | `src/modules/community/services/community-public.service.ts` |
| 9 | 1377 | `src/modules/messaging/services/notifications.service.ts` |
| 10 | 1330 | `src/modules/object_storage/services/object-storage.service.ts` |
| 11 | 1228 | `src/modules/tracking/services/tracking.service.ts` |
| 12 | 1222 | `src/modules/terminology/services/concepts.service.ts` |
| 13 | 1182 | `src/modules/automation/services/automation-execution.service.ts` |
| 14 | 1032 | `src/modules/iam/services/iam-practitioner-self-registration.service.ts` |
| 15 | 1026 | `src/modules/accounting/services/ledger.service.ts` |

Universo: 373 archivos `*.service.ts` (sin `.spec.ts`) bajo `src/modules`. Los
tres primeros coinciden con los que la ficha MCH-030 señalaba
(3294/2602/2557): el hallazgo sigue vigente contra `dev` actual.

## Por qué estos tres y no una regla de LOC

Un archivo largo no es por sí mismo una violación de SOLID — la propia ficha
lo aclara. Los tres primeros comparten un patrón que sí importa: cada uno es
la **fachada única** de un dominio entero (reservas de agenda, profesionales,
pedidos de farmacia) con varias máquinas de estado, políticas de autorización
y orquestación transaccional entremezcladas en la misma clase. Eso es lo que
encarece un cambio: tocar la política de "quién puede ver el motivo de una
cita" obliga a entender —y a que el revisor entienda— las otras cuarenta y pico
operaciones de la misma clase para confirmar que no se rompió nada alrededor.

## Plan de descomposición por invariantes — `scheduling-bookings.service.ts`

Caracterización de sus 40 métodos (constructor aparte, medidos antes de la
extracción de este PR) por responsabilidad,
sin mover código todavía salvo la extracción de la sección "Hecho en este PR":

| Clúster | Métodos | Invariante que protege |
|---|---|---|
| **Máquina de estados de ejecución** | `start`, `iniciarEnTransaccion`, `complete`, `checkIn`, `assertTransition`, `recordTransition` | Sólo las transiciones que `booking-state-machine.ts` declara (C-10); toda transición queda en `audit.appointment_bookings_history`. Ya vive en `state/`, sólo falta que el *orquestador* de la transición (cargar → validar → aplicar → auditar → avisar) se separe de la política en sí. |
| **Autorización sobre el recurso** | `cargarParaOperar`, `assertVinculoVigente`, `operaCualquierAgenda`, `actorKind`, `esUnPaciente`, `assertPuedeActuarPorElPaciente` | Un profesional sólo opera **sus** citas; administración de agenda opera cualquiera; un paciente sólo actúa por sí o por quien representa. |
| **Ciclo de vida de la reserva (hold → confirmación)** | `placeHold`, `confirmBooking`, `requestBooking`, `expireHolds`, `materializarReserva`, `avisarSolicitud` | Un slot no se reserva dos veces (bloqueo optimista del repositorio); un hold vencido libera el slot. |
| **Alta directa y puente clínico** | `createDirectAppointment`, `crearCitaDirectaEnTransaccion`, `crearCitaClinica`, `sincronizarCitaClinica` | Confirmar una reserva nace su cita clínica dentro de la **misma** transacción — el cruce a `clinical` documentado en la cabecera del archivo. |
| **Reprogramación y cancelación** | `reschedule`, `cancel`, `cancelarYAvisar`, `promoverListaDeEspera`, `cancelarPendientesQueChocan` | La reprogramación no reescribe la reserva original (es relación, no mutación); cancelar libera la lista de espera. |
| **Flujo de respuesta del prestador** | `accept`, `reject`, `requestInfo`, `proposeSchedule`, `asegurarPendiente` | Sólo se puede responder una solicitud en estado `PENDING_CONFIRMATION`. |
| **Estado de pago** | `setPaymentState`, `getPaymentState` | El estado de pago de una cita es independiente de su estado clínico. |
| **Proyección de lectura** | `searchBookings`, `getBookingById`, `aBookingItem`, `solicitudesDeSeguroPorCita` | Listado y detalle devuelven **exactamente** el mismo mapeo (ya documentado en el propio código: "está en un solo lugar porque el listado y el detalle tienen que decir exactamente lo mismo"). |
| **Política de visibilidad del motivo** | ~~`puedeVerElMotivo`~~ | **Extraída en este PR** — ver abajo. |
| **Config/soporte** | `resolvePolicy` | Resuelve la plantilla de política de cancelación aplicable. |

### Orden de extracción sugerido (para un PR dedicado, no éste)

1. **Políticas puras primero** (bajo riesgo, sin tocar transacciones): la de
   visibilidad del motivo (hecha), y candidatas similares —
   `operaCualquierAgenda`/`actorKind`/`esUnPaciente` podrían moverse juntas a
   `policies/booking-actor.policy.ts` en un PR propio, con su propio spec.
2. **Proyección de lectura** (`aBookingItem` + companions) a un
   `booking-item.projector.ts`: es una transformación pura entidad→DTO una vez
   que recibe los mapas ya resueltos; no toca el `EntityManager` directamente.
3. **Máquina de ejecución** (`cargarParaOperar` + `assertTransition` +
   `recordTransition` + el cuerpo de `start`/`complete`/`checkIn`) a un
   `booking-lifecycle.usecase.ts` que reciba el repositorio y el
   `EntityManager` por parámetro — es el que más disciplina de límite
   transaccional exige, así que va después de tener los dos anteriores
   probados por separado.
4. Recién ahí, si sigue habiendo valor, separar alta directa y
   reprogramación/cancelación en sus propios casos de uso.

No se propone tocar el ciclo de hold/confirmación en el corto plazo: es la
parte con más bloqueo optimista y notificación entrelazada, y moverla sin una
batería de pruebas de concurrencia dedicada es exactamente el riesgo que esta
ficha pide evitar.

## Hecho en este PR: una extracción, de bajo riesgo

`puedeVerElMotivo` (privado, sin dependencias de infraestructura) se movió,
literal, a `src/modules/scheduling/policies/booking-reason-visibility.policy.ts`
como función pura exportada `puedeVerElMotivoDeLaCita`. El servicio la importa
y delega en los mismos cuatro call-sites; no cambió su firma ni su lógica.

**Por qué ésta y no otra:** no toca `EntityManager`, no participa de ninguna
transacción, y sus cuatro parámetros ya eran exactamente lo que necesitaba —
no hubo que inventar un contrato nuevo. Es la definición de "política crítica
que se puede probar sin construir toda la aplicación" que pide
MCH-030-AC02: antes sólo se ejercitaba levantando `SchedulingBookingsService`
completo (quince dependencias inyectadas) a través de `getBookingById` /
`searchBookings`; ahora tiene diez pruebas propias que corren en milisegundos
con cuatro argumentos y ningún mock.

El archivo pasó de 3294 a 3251 líneas (-43): no es el objetivo de la
extracción ni una cifra que se persiga por sí misma, pero registra que la
dirección es la correcta.

**Evidencia de equivalencia (MCH-030-AC01):** la suite existente de
`scheduling-bookings.service.spec.ts` (156 casos, incluida la sección
"lectura de citas — el motivo le llega a la otra parte") sigue en verde sin
haberse modificado — es la prueba de que el comportamiento observable no
cambió, sólo su ubicación.

## Lo que queda pendiente

- Las extracciones 2-4 de la tabla de arriba, cada una en su propio PR con su
  propia caracterización antes de mover código (regla del carril: como mucho
  una extracción por esta ficha).
- El mismo ejercicio de inventario y plan para `profiles-practitioners.service.ts`
  (2602 líneas) y `pharmacy-orders.service.ts` (2557 líneas): no se hizo en
  este PR por alcance — sólo se los deja listados en el top 15 con su cifra
  medida, sin analizar sus clústeres internos.
- `scheduling-catalog.service.ts` (2253) y `profiles-patients.service.ts`
  (2478) no estaban en la ficha original pero aparecen en el top 5 medido: se
  documentan acá para que la próxima persona que trabaje performance/F11 no
  vuelva a descubrirlos de cero.
