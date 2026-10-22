<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `scheduling`

- **Procesos:** 2 · **Máquinas de estado:** 1
- **Operaciones:** 58 (52 con decisiones propias, 6 sin ellas)
- Inventario de endpoints del módulo: [scheduling](../endpoints/scheduling.md)

## Proceso: Módulo 41 — Scheduling (agenda)

- **Código:** `scheduling` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 58
- **Actores:** CLINICIAN · Cualquier sesión válida · PATIENT · PRACTITIONER · SCHEDULING_ADMIN · SCHEDULING_AGENT · SYSTEM · SYSTEM_WORKER
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/scheduling/README.md`

### Para qué sirve

Agenda: recursos agendables, políticas de reserva, plantillas horarias, generación de cupos, reservas con anti-double-booking, lista de espera, recordatorios, avisos, servicios con duración dinámica y mostrador (alta de paciente + cita + encuentro en una transacción).

_Fuente: `src/modules/scheduling/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:SchedulingAgendaController` | Operaciones de SchedulingAgendaController que el README no asigna a un caso de uso | GET /scheduling/resources | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT | BAJO | 6 |
|  |  | GET /scheduling/slots | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT | BAJO | 1 |
| `ctrl:SchedulingBookingsController` | Operaciones de SchedulingBookingsController que el README no asigna a un caso de uso | GET /scheduling/bookings | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT | BAJO | 18 |
|  |  | GET /scheduling/bookings/{id} | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT | BAJO | 10 |
|  |  | POST /scheduling/bookings/{id}/accept | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 51 |
|  |  | POST /scheduling/bookings/{id}/cancel | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT | MEDIO | 43 |
|  |  | POST /scheduling/bookings/{id}/check-in | SCHEDULING_ADMIN · SCHEDULING_AGENT | MEDIO | 5 |
|  |  | POST /scheduling/bookings/{id}/complete | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 13 |
|  |  | POST /scheduling/bookings/{id}/delay | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 32 |
|  |  | GET /scheduling/bookings/{id}/payment-state | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | BAJO | 3 |
|  |  | PUT /scheduling/bookings/{id}/payment-state | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 9 |
|  |  | POST /scheduling/bookings/{id}/propose-schedule | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 9 |
|  |  | POST /scheduling/bookings/{id}/reject | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 41 |
|  |  | POST /scheduling/bookings/{id}/reminders | SCHEDULING_ADMIN · SCHEDULING_AGENT | MEDIO | 3 |
|  |  | POST /scheduling/bookings/{id}/request-info | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 6 |
|  |  | POST /scheduling/bookings/{id}/reschedule | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT | MEDIO | 38 |
|  |  | POST /scheduling/bookings/{id}/start | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 8 |
| `ctrl:SchedulingConfirmationController` | Operaciones de SchedulingConfirmationController que el README no asigna a un caso de uso | GET /scheduling/confirmation-rules | SCHEDULING_ADMIN | BAJO | 1 |
|  |  | POST /scheduling/confirmation-rules | SCHEDULING_ADMIN | MEDIO | 1 |
|  |  | POST /scheduling/confirmation-rules/{id}/activate | SCHEDULING_ADMIN | MEDIO | 2 |
|  |  | POST /scheduling/confirmation-rules/{id}/deactivate | SCHEDULING_ADMIN | MEDIO | 2 |
|  |  | POST /scheduling/confirmation-rules/evaluate | SCHEDULING_ADMIN | BAJO | 1 |
| `ctrl:SchedulingController` | Operaciones de SchedulingController que el README no asigna a un caso de uso | GET /scheduling/activity-types | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | BAJO | 0 |
|  |  | POST /scheduling/appointments/direct | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 43 |
|  |  | POST /scheduling/appointments/walk-in | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 24 |
|  |  | POST /scheduling/booking-policies | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 2 |
|  |  | GET /scheduling/exception-types | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | BAJO | 0 |
|  |  | DELETE /scheduling/exceptions/{id} | SCHEDULING_ADMIN · PRACTITIONER | ALTO | 3 |
|  |  | PATCH /scheduling/exceptions/{id} | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 5 |
|  |  | POST /scheduling/holds/{holdToken}/confirm | SCHEDULING_ADMIN · SCHEDULING_AGENT · PATIENT | MEDIO | 18 |
|  |  | POST /scheduling/holds/{holdToken}/request | SCHEDULING_ADMIN · SCHEDULING_AGENT · PATIENT | MEDIO | 42 |
|  |  | POST /scheduling/resources | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 4 |
|  |  | POST /scheduling/resources/{id}/close-slots | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 5 |
|  |  | POST /scheduling/resources/{id}/delay | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 31 |
|  |  | GET /scheduling/resources/{id}/exceptions | SCHEDULING_ADMIN · PRACTITIONER · PATIENT | BAJO | 3 |
|  |  | POST /scheduling/resources/{id}/exceptions | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 5 |
|  |  | POST /scheduling/resources/{id}/shift-slots | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 30 |
|  |  | GET /scheduling/resources/{id}/slots | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT | BAJO | 2 |
|  |  | GET /scheduling/resources/{id}/templates | SCHEDULING_ADMIN · PRACTITIONER | BAJO | 3 |
|  |  | POST /scheduling/resources/{id}/templates | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 5 |
|  |  | GET /scheduling/resources/{resourceId}/waitlist | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | BAJO | 4 |
|  |  | POST /scheduling/slots/{id}/holds | SCHEDULING_ADMIN · SCHEDULING_AGENT · PATIENT | MEDIO | 9 |
|  |  | DELETE /scheduling/templates/{id} | SCHEDULING_ADMIN · PRACTITIONER | ALTO | 8 |
|  |  | PATCH /scheduling/templates/{id} | SCHEDULING_ADMIN · PRACTITIONER | ALTO | 6 |
|  |  | POST /scheduling/templates/{id}/generate-slots | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 7 |
|  |  | POST /scheduling/templates/{id}/reactivate | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 3 |
|  |  | GET /scheduling/waitlist | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT | BAJO | 7 |
|  |  | POST /scheduling/waitlist | SCHEDULING_ADMIN · SCHEDULING_AGENT · PATIENT | MEDIO | 4 |
| `ctrl:SchedulingInternalController` | Operaciones de SchedulingInternalController que el README no asigna a un caso de uso | POST /scheduling/internal/dispatch-reminders | SYSTEM · SYSTEM_WORKER | MEDIO | 31 |
|  |  | POST /scheduling/internal/expire-holds | SYSTEM · SYSTEM_WORKER | MEDIO | 8 |
|  |  | POST /scheduling/internal/promote-waitlist/{slotId} | SYSTEM · SYSTEM_WORKER | MEDIO | 29 |
|  |  | GET /scheduling/internal/waitlist-candidates | SYSTEM · SYSTEM_WORKER | BAJO | 2 |
| `ctrl:SchedulingServiceOfferingsController` | Operaciones de SchedulingServiceOfferingsController que el README no asigna a un caso de uso | GET /scheduling/service-availability | PATIENT · PRACTITIONER · CLINICIAN · SCHEDULING_ADMIN · SCHEDULING_AGENT | BAJO | 10 |
|  |  | GET /scheduling/service-offerings | PATIENT · PRACTITIONER · CLINICIAN · SCHEDULING_ADMIN · SCHEDULING_AGENT | BAJO | 2 |
|  |  | POST /scheduling/service-offerings | PRACTITIONER · CLINICIAN · SCHEDULING_ADMIN | MEDIO | 4 |
|  |  | PATCH /scheduling/service-offerings/{id} | PRACTITIONER · CLINICIAN · SCHEDULING_ADMIN | MEDIO | 3 |
|  |  | POST /scheduling/service-offerings/{id}/holds | PATIENT · SCHEDULING_ADMIN · SCHEDULING_AGENT | MEDIO | 19 |
| `ctrl:TenantAgendaController` | Operaciones de TenantAgendaController que el README no asigna a un caso de uso | GET /tenants/{tenantId}/agenda | Cualquier sesión válida | BAJO | 5 |

### Diagrama 1 de 3 — etapas `ctrl:SchedulingAgendaController`, `ctrl:SchedulingBookingsController`, `ctrl:SchedulingConfirmationController`

```mermaid
flowchart LR
  a2(["SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT"]):::actor
  a25(["SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER"]):::actor
  a33(["SCHEDULING_ADMIN · SCHEDULING_AGENT"]):::actor
  a55(["SCHEDULING_ADMIN"]):::actor
  t3[("common.addresses")]:::tabla
  t4[("practice.care_spaces")]:::tabla
  t5[("practice.practice_sites")]:::tabla
  t6[("practice.practices")]:::tabla
  t7[("practice.practitioner_role_assignments")]:::tabla
  t8[("scheduling.schedulable_resources")]:::tabla
  t10[("scheduling.bookable_slots")]:::tabla
  t12[("audit.appointment_bookings_history")]:::tabla
  t13[("clinical.appointments")]:::tabla
  t14[("clinical.encounters")]:::tabla
  t15[("insurance.insurance_carriers")]:::tabla
  t16[("insurance.insurance_claims")]:::tabla
  t17[("insurance.insurance_plans")]:::tabla
  t20[("profiles.patient_portal_proxies")]:::tabla
  t21[("profiles.patient_profiles")]:::tabla
  t22[("profiles.person_account_links")]:::tabla
  t26[("common.file_versions")]:::tabla
  t29[("community.conversation_participants")]:::tabla
  t30[("community.conversations")]:::tabla
  t34[("scheduling.appointment_bookings")]:::tabla
  t40[("scheduling.appointment_payment_states")]:::tabla
  t48[("scheduling.appointment_reminders")]:::tabla
  t56[("scheduling.booking_confirmation_rules")]:::tabla
  subgraph s0["ctrl:SchedulingAgendaController · Operaciones de SchedulingAgendaController que…"]
    o1["GET /scheduling/resources"]:::op
    o9["GET /scheduling/slots"]:::op
  end
  t18[("+12 tablas más")]
  t23[("+4 tablas más")]
  t27[("+45 tablas más")]
  t31[("+37 tablas más")]
  t36[("+7 tablas más")]
  t38[("+26 tablas más")]
  t42[("+3 tablas más")]
  t44[("+3 tablas más")]
  t46[("+35 tablas más")]
  t51[("+32 tablas más")]
  t53[("+2 tablas más")]
  subgraph s1["ctrl:SchedulingBookingsController · Operaciones de SchedulingBookingsController…"]
    o11["GET /scheduling/bookings"]:::op
    o19["GET /scheduling/bookings/{id}"]:::op
    o24["POST /scheduling/bookings/{id}/accept"]:::op
    o28["POST /scheduling/bookings/{id}/cancel"]:::op
    o32["POST /scheduling/bookings/{id}/check-in"]:::op
    o35["POST /scheduling/bookings/{id}/complete"]:::op
    o37["POST /scheduling/bookings/{id}/delay"]:::op
    o39["GET /scheduling/bookings/{id}/payment-state"]:::op
    o41["PUT /scheduling/bookings/{id}/payment-state"]:::op
    o43["POST /scheduling/bookings/{id}/propose-schedule"]:::op
    o45["POST /scheduling/bookings/{id}/reject"]:::op
    o47["POST /scheduling/bookings/{id}/reminders"]:::op
    o49["POST /scheduling/bookings/{id}/request-info"]:::op
    o50["POST /scheduling/bookings/{id}/reschedule"]:::op
    o52["POST /scheduling/bookings/{id}/start"]:::op
  end
  subgraph s2["ctrl:SchedulingConfirmationController · Operaciones de SchedulingConfirmationCo…"]
    o54["GET /scheduling/confirmation-rules"]:::op
    o57["POST /scheduling/confirmation-rules"]:::op
    o58["POST /scheduling/confirmation-rules/{id}/activate"]:::op
    o59["POST /scheduling/confirmation-rules/{id}/deactivate"]:::op
    o60["POST /scheduling/confirmation-rules/evaluate"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  o1 -->|"LEE"| t6
  o1 -->|"LEE"| t7
  o1 -->|"LEE"| t8
  a2 --> o9
  o9 -->|"LEE"| t10
  a2 --> o11
  o11 -->|"LEE"| t12
  o11 -->|"LEE"| t13
  o11 -->|"LEE"| t14
  o11 -->|"LEE"| t15
  o11 -->|"LEE"| t16
  o11 -->|"LEE"| t17
  o11 -.-> t18
  a2 --> o19
  o19 -->|"LEE"| t12
  o19 -->|"LEE"| t13
  o19 -->|"LEE"| t14
  o19 -->|"LEE"| t20
  o19 -->|"LEE"| t21
  o19 -->|"LEE"| t22
  o19 -.-> t23
  a25 --> o24
  o24 -->|"ACTUALIZA"| t12
  o24 -->|"CREA"| t12
  o24 -->|"LEE"| t12
  o24 -->|"ACTUALIZA"| t13
  o24 -->|"LEE"| t13
  o24 -->|"LEE"| t26
  o24 -.-> t27
  a2 --> o28
  o28 -->|"ACTUALIZA"| t12
  o28 -->|"CREA"| t12
  o28 -->|"LEE"| t12
  o28 -->|"CREA"| t29
  o28 -->|"LEE"| t29
  o28 -->|"CREA"| t30
  o28 -.-> t31
  a33 --> o32
  o32 -->|"ACTUALIZA"| t12
  o32 -->|"CREA"| t12
  o32 -->|"LEE"| t12
  o32 -->|"ACTUALIZA"| t34
  o32 -->|"LEE"| t34
  a25 --> o35
  o35 -->|"ACTUALIZA"| t12
  o35 -->|"CREA"| t12
  o35 -->|"LEE"| t12
  o35 -->|"ACTUALIZA"| t13
  o35 -->|"LEE"| t13
  o35 -->|"ACTUALIZA"| t34
  o35 -.-> t36
  a25 --> o37
  o37 -->|"ACTUALIZA"| t12
  o37 -->|"CREA"| t12
  o37 -->|"LEE"| t12
  o37 -->|"CREA"| t29
  o37 -->|"LEE"| t29
  o37 -->|"CREA"| t30
  o37 -.-> t38
  a25 --> o39
  o39 -->|"LEE"| t34
  o39 -->|"LEE"| t40
  o39 -->|"LEE"| t8
  a25 --> o41
  o41 -->|"ACTUALIZA"| t12
  o41 -->|"CREA"| t12
  o41 -->|"LEE"| t12
  o41 -->|"LEE"| t34
  o41 -->|"ACTUALIZA"| t40
  o41 -->|"CREA"| t40
  o41 -.-> t42
  a25 --> o43
  o43 -->|"ACTUALIZA"| t12
  o43 -->|"CREA"| t12
  o43 -->|"LEE"| t12
  o43 -->|"ACTUALIZA"| t34
  o43 -->|"LEE"| t34
  o43 -->|"ACTUALIZA"| t10
  o43 -.-> t44
  a25 --> o45
  o45 -->|"ACTUALIZA"| t12
  o45 -->|"CREA"| t12
  o45 -->|"LEE"| t12
  o45 -->|"CREA"| t29
  o45 -->|"LEE"| t29
  o45 -->|"CREA"| t30
  o45 -.-> t46
  a33 --> o47
  o47 -->|"LEE"| t34
  o47 -->|"CREA"| t48
  o47 -->|"LEE"| t10
  a25 --> o49
  o49 -->|"ACTUALIZA"| t12
  o49 -->|"CREA"| t12
  o49 -->|"LEE"| t12
  o49 -->|"ACTUALIZA"| t34
  o49 -->|"LEE"| t34
  o49 -->|"LEE"| t8
  a2 --> o50
  o50 -->|"ACTUALIZA"| t12
  o50 -->|"CREA"| t12
  o50 -->|"LEE"| t12
  o50 -->|"CREA"| t29
  o50 -->|"LEE"| t29
  o50 -->|"CREA"| t30
  o50 -.-> t51
  a25 --> o52
  o52 -->|"ACTUALIZA"| t12
  o52 -->|"CREA"| t12
  o52 -->|"LEE"| t12
  o52 -->|"ACTUALIZA"| t13
  o52 -->|"LEE"| t13
  o52 -->|"ACTUALIZA"| t34
  o52 -.-> t53
  a55 --> o54
  o54 -->|"LEE"| t56
  a55 --> o57
  o57 -->|"CREA"| t56
  a55 --> o58
  o58 -->|"ACTUALIZA"| t56
  o58 -->|"LEE"| t56
  a55 --> o59
  o59 -->|"ACTUALIZA"| t56
  o59 -->|"LEE"| t56
  a55 --> o60
  o60 -->|"LEE"| t56
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 3 — etapas `ctrl:SchedulingController`

```mermaid
flowchart LR
  a2(["SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER"]):::actor
  a12(["SCHEDULING_ADMIN · PRACTITIONER"]):::actor
  a21(["SCHEDULING_ADMIN · SCHEDULING_AGENT · PATIENT"]):::actor
  a40(["SCHEDULING_ADMIN · PRACTITIONER · PATIENT"]):::actor
  a46(["SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT"]):::actor
  t4[("audit.appointment_bookings_history")]:::tabla
  t5[("clinical.appointments")]:::tabla
  t6[("clinical.encounters")]:::tabla
  t7[("community.conversation_participants")]:::tabla
  t13[("scheduling.booking_policies")]:::tabla
  t16[("scheduling.availability_exceptions")]:::tabla
  t17[("scheduling.schedulable_resources")]:::tabla
  t19[("scheduling.bookable_slots")]:::tabla
  t22[("billing.service_catalog")]:::tabla
  t23[("profiles.patient_portal_proxies")]:::tabla
  t24[("profiles.patient_profiles")]:::tabla
  t25[("profiles.person_account_links")]:::tabla
  t26[("profiles.persons")]:::tabla
  t29[("community.conversations")]:::tabla
  t32[("practice.practice_sites")]:::tabla
  t33[("practice.practices")]:::tabla
  t34[("profiles.practitioner_affiliations")]:::tabla
  t36[("scheduling.appointment_bookings")]:::tabla
  t43[("community.public_profiles")]:::tabla
  t48[("scheduling.schedule_rules")]:::tabla
  t49[("scheduling.schedule_templates")]:::tabla
  t52[("profiles.person_profiles")]:::tabla
  t53[("scheduling.waitlist_entries")]:::tabla
  t57[("scheduling.booking_reschedules")]:::tabla
  t8[("+37 tablas más")]
  t10[("+18 tablas más")]
  t27[("+12 tablas más")]
  t30[("+36 tablas más")]
  t38[("+25 tablas más")]
  t44[("+24 tablas más")]
  t55[("+3 tablas más")]
  t58[("+2 tablas más")]
  t61[("+1 tablas más")]
  t64[("+1 tablas más")]
  subgraph s0["ctrl:SchedulingController · Operaciones de SchedulingController que el README n…"]
    o1["GET /scheduling/activity-types"]:::op
    o3["POST /scheduling/appointments/direct"]:::op
    o9["POST /scheduling/appointments/walk-in"]:::op
    o11["POST /scheduling/booking-policies"]:::op
    o14["GET /scheduling/exception-types"]:::op
    o15["DELETE /scheduling/exceptions/{id}"]:::op
    o18["PATCH /scheduling/exceptions/{id}"]:::op
    o20["POST /scheduling/holds/{holdToken}/confirm"]:::op
    o28["POST /scheduling/holds/{holdToken}/request"]:::op
    o31["POST /scheduling/resources"]:::op
    o35["POST /scheduling/resources/{id}/close-slots"]:::op
    o37["POST /scheduling/resources/{id}/delay"]:::op
    o39["GET /scheduling/resources/{id}/exceptions"]:::op
    o41["POST /scheduling/resources/{id}/exceptions"]:::op
    o42["POST /scheduling/resources/{id}/shift-slots"]:::op
    o45["GET /scheduling/resources/{id}/slots"]:::op
    o47["GET /scheduling/resources/{id}/templates"]:::op
    o50["POST /scheduling/resources/{id}/templates"]:::op
    o51["GET /scheduling/resources/{resourceId}/waitlist"]:::op
    o54["POST /scheduling/slots/{id}/holds"]:::op
    o56["DELETE /scheduling/templates/{id}"]:::op
    o59["PATCH /scheduling/templates/{id}"]:::op
    o60["POST /scheduling/templates/{id}/generate-slots"]:::op
    o62["POST /scheduling/templates/{id}/reactivate"]:::op
    o63["GET /scheduling/waitlist"]:::op
    o65["POST /scheduling/waitlist"]:::op
  end
  a2 --> o1
  a2 --> o3
  o3 -->|"ACTUALIZA"| t4
  o3 -->|"CREA"| t4
  o3 -->|"LEE"| t4
  o3 -->|"CREA"| t5
  o3 -->|"LEE"| t6
  o3 -->|"CREA"| t7
  o3 -.-> t8
  a2 --> o9
  o9 -->|"ACTUALIZA"| t4
  o9 -->|"CREA"| t4
  o9 -->|"LEE"| t4
  o9 -->|"CREA"| t5
  o9 -->|"ACTUALIZA"| t5
  o9 -->|"LEE"| t5
  o9 -.-> t10
  a12 --> o11
  o11 -->|"CREA"| t13
  o11 -->|"LEE"| t13
  a2 --> o14
  a12 --> o15
  o15 -->|"BORRA"| t16
  o15 -->|"LEE"| t16
  o15 -->|"LEE"| t17
  a12 --> o18
  o18 -->|"ACTUALIZA"| t16
  o18 -->|"LEE"| t16
  o18 -->|"ACTUALIZA"| t19
  o18 -->|"LEE"| t19
  o18 -->|"LEE"| t17
  a21 --> o20
  o20 -->|"LEE"| t22
  o20 -->|"CREA"| t5
  o20 -->|"LEE"| t23
  o20 -->|"LEE"| t24
  o20 -->|"LEE"| t25
  o20 -->|"LEE"| t26
  o20 -.-> t27
  a21 --> o28
  o28 -->|"LEE"| t22
  o28 -->|"CREA"| t5
  o28 -->|"CREA"| t7
  o28 -->|"LEE"| t7
  o28 -->|"CREA"| t29
  o28 -->|"LEE"| t29
  o28 -.-> t30
  a12 --> o31
  o31 -->|"LEE"| t32
  o31 -->|"LEE"| t33
  o31 -->|"LEE"| t34
  o31 -->|"CREA"| t17
  a12 --> o35
  o35 -->|"LEE"| t36
  o35 -->|"CREA"| t16
  o35 -->|"ACTUALIZA"| t19
  o35 -->|"LEE"| t19
  o35 -->|"LEE"| t17
  a2 --> o37
  o37 -->|"ACTUALIZA"| t4
  o37 -->|"CREA"| t4
  o37 -->|"LEE"| t4
  o37 -->|"CREA"| t7
  o37 -->|"LEE"| t7
  o37 -->|"CREA"| t29
  o37 -.-> t38
  a40 --> o39
  o39 -->|"LEE"| t36
  o39 -->|"LEE"| t16
  o39 -->|"LEE"| t17
  a12 --> o41
  o41 -->|"LEE"| t36
  o41 -->|"CREA"| t16
  o41 -->|"ACTUALIZA"| t19
  o41 -->|"LEE"| t19
  o41 -->|"LEE"| t17
  a12 --> o42
  o42 -->|"CREA"| t7
  o42 -->|"LEE"| t7
  o42 -->|"CREA"| t29
  o42 -->|"LEE"| t29
  o42 -->|"ACTUALIZA"| t43
  o42 -->|"CREA"| t43
  o42 -.-> t44
  a46 --> o45
  o45 -->|"LEE"| t19
  o45 -->|"LEE"| t17
  a12 --> o47
  o47 -->|"LEE"| t17
  o47 -->|"LEE"| t48
  o47 -->|"LEE"| t49
  a12 --> o50
  o50 -->|"LEE"| t17
  o50 -->|"CREA"| t48
  o50 -->|"LEE"| t48
  o50 -->|"CREA"| t49
  o50 -->|"LEE"| t49
  a2 --> o51
  o51 -->|"LEE"| t52
  o51 -->|"LEE"| t26
  o51 -->|"LEE"| t17
  o51 -->|"LEE"| t53
  a21 --> o54
  o54 -->|"LEE"| t23
  o54 -->|"LEE"| t24
  o54 -->|"LEE"| t25
  o54 -->|"LEE"| t36
  o54 -->|"ACTUALIZA"| t19
  o54 -->|"LEE"| t19
  o54 -.-> t55
  a12 --> o56
  o56 -->|"LEE"| t36
  o56 -->|"BORRA"| t19
  o56 -->|"LEE"| t19
  o56 -->|"LEE"| t57
  o56 -->|"LEE"| t17
  o56 -->|"ACTUALIZA"| t49
  o56 -.-> t58
  a12 --> o59
  o59 -->|"LEE"| t17
  o59 -->|"BORRA"| t48
  o59 -->|"CREA"| t48
  o59 -->|"LEE"| t48
  o59 -->|"ACTUALIZA"| t49
  o59 -->|"LEE"| t49
  a12 --> o60
  o60 -->|"LEE"| t36
  o60 -->|"LEE"| t16
  o60 -->|"CREA"| t19
  o60 -->|"LEE"| t19
  o60 -->|"LEE"| t17
  o60 -->|"LEE"| t48
  o60 -.-> t61
  a12 --> o62
  o62 -->|"LEE"| t17
  o62 -->|"ACTUALIZA"| t49
  o62 -->|"LEE"| t49
  a46 --> o63
  o63 -->|"LEE"| t23
  o63 -->|"LEE"| t24
  o63 -->|"LEE"| t25
  o63 -->|"LEE"| t52
  o63 -->|"LEE"| t26
  o63 -->|"LEE"| t17
  o63 -.-> t64
  a21 --> o65
  o65 -->|"LEE"| t23
  o65 -->|"LEE"| t24
  o65 -->|"LEE"| t25
  o65 -->|"CREA"| t53
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 3 de 3 — etapas `ctrl:SchedulingInternalController`, `ctrl:SchedulingServiceOfferingsController`, `ctrl:TenantAgendaController`

```mermaid
flowchart LR
  a2(["SYSTEM · SYSTEM_WORKER"]):::actor
  a19(["PATIENT · PRACTITIONER · CLINICIAN · SCHEDULING_ADMIN · SCH…"]):::actor
  a25(["PRACTITIONER · CLINICIAN · SCHEDULING_ADMIN"]):::actor
  a29(["PATIENT · SCHEDULING_ADMIN · SCHEDULING_AGENT"]):::actor
  a37(["Cualquier sesión válida"]):::actor
  t3[("community.conversation_participants")]:::tabla
  t4[("community.conversations")]:::tabla
  t5[("community.public_profiles")]:::tabla
  t8[("scheduling.appointment_bookings")]:::tabla
  t9[("scheduling.availability_exceptions")]:::tabla
  t10[("scheduling.bookable_slots")]:::tabla
  t11[("scheduling.practitioner_service_offerings")]:::tabla
  t12[("scheduling.schedulable_resources")]:::tabla
  t17[("scheduling.waitlist_entries")]:::tabla
  t20[("billing.service_catalog")]:::tabla
  t21[("scheduling.booking_policies")]:::tabla
  t26[("practice.practitioner_role_assignments")]:::tabla
  t30[("practice.practice_sites")]:::tabla
  t31[("practice.practices")]:::tabla
  t32[("profiles.patient_portal_proxies")]:::tabla
  t33[("profiles.patient_profiles")]:::tabla
  t34[("profiles.person_account_links")]:::tabla
  t38[("directory.tenant_memberships")]:::tabla
  t39[("profiles.persons")]:::tabla
  t6[("+25 tablas más")]
  t13[("+2 tablas más")]
  t15[("+23 tablas más")]
  subgraph s0["ctrl:SchedulingInternalController · Operaciones de SchedulingInternalController…"]
    o1["POST /scheduling/internal/dispatch-reminders"]:::op
    o7["POST /scheduling/internal/expire-holds"]:::op
    o14["POST /scheduling/internal/promote-waitlist/{slotId}"]:::op
    o16["GET /scheduling/internal/waitlist-candidates"]:::op
  end
  t22[("+4 tablas más")]
  t35[("+13 tablas más")]
  subgraph s1["ctrl:SchedulingServiceOfferingsController · Operaciones de SchedulingServiceOff…"]
    o18["GET /scheduling/service-availability"]:::op
    o23["GET /scheduling/service-offerings"]:::op
    o24["POST /scheduling/service-offerings"]:::op
    o27["PATCH /scheduling/service-offerings/{id}"]:::op
    o28["POST /scheduling/service-offerings/{id}/holds"]:::op
  end
  subgraph s2["ctrl:TenantAgendaController · Operaciones de TenantAgendaController que el READ…"]
    o36["GET /tenants/{tenantId}/agenda"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  o1 -->|"CREA"| t4
  o1 -->|"LEE"| t4
  o1 -->|"ACTUALIZA"| t5
  o1 -->|"CREA"| t5
  o1 -.-> t6
  a2 --> o7
  o7 -->|"LEE"| t8
  o7 -->|"LEE"| t9
  o7 -->|"ACTUALIZA"| t10
  o7 -->|"LEE"| t10
  o7 -->|"LEE"| t11
  o7 -->|"LEE"| t12
  o7 -.-> t13
  a2 --> o14
  o14 -->|"CREA"| t3
  o14 -->|"LEE"| t3
  o14 -->|"CREA"| t4
  o14 -->|"LEE"| t4
  o14 -->|"ACTUALIZA"| t5
  o14 -->|"CREA"| t5
  o14 -.-> t15
  a2 --> o16
  o16 -->|"LEE"| t10
  o16 -->|"LEE"| t17
  a19 --> o18
  o18 -->|"LEE"| t20
  o18 -->|"LEE"| t8
  o18 -->|"LEE"| t9
  o18 -->|"LEE"| t10
  o18 -->|"LEE"| t21
  o18 -->|"LEE"| t11
  o18 -.-> t22
  a19 --> o23
  o23 -->|"LEE"| t20
  o23 -->|"LEE"| t11
  a25 --> o24
  o24 -->|"LEE"| t20
  o24 -->|"LEE"| t26
  o24 -->|"CREA"| t11
  o24 -->|"LEE"| t11
  a25 --> o27
  o27 -->|"LEE"| t20
  o27 -->|"ACTUALIZA"| t11
  o27 -->|"LEE"| t11
  a29 --> o28
  o28 -->|"LEE"| t20
  o28 -->|"LEE"| t30
  o28 -->|"LEE"| t31
  o28 -->|"LEE"| t32
  o28 -->|"LEE"| t33
  o28 -->|"LEE"| t34
  o28 -.-> t35
  a37 --> o36
  o36 -->|"LEE"| t38
  o36 -->|"LEE"| t39
  o36 -->|"LEE"| t8
  o36 -->|"LEE"| t10
  o36 -->|"LEE"| t12
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Flujo crítico: Ciclo de vida de una cita

- **Código:** `critico:scheduling` · **Agrupación:** CURADO_EN_DOCUMENTO · **Operaciones:** 8
- **Actores:** `PATIENT` (reserva), `SCHEDULING_AGENT`/`SCHEDULING_ADMIN` (configuración), `PRACTITIONER` (excepciones de disponibilidad), `SYSTEM_WORKER` (expiración/promoción).
- **Revisión:** CURADO_EN_DOCUMENTO
- **Fuentes:** `docs/business/critical-workflows.md:11`

### Para qué sirve

coordinar un recurso limitado (agenda de un profesional/quirófano) entre demanda simultánea, sin doble reserva, con reglas de cancelación/no-show y lista de espera.

_Fuente: `docs/business/critical-workflows.md:13`_

### Precondiciones

existe un recurso agendable con política de reserva y al menos una plantilla con slots materializados (`generate-slots`).

_Fuente: `docs/business/critical-workflows.md:19`_

### Reglas de negocio

anti-double-booking vía bloqueo pesimista (`FOR UPDATE`); límite de holds activos por paciente (`max_active_per_patient`); generación de slots idempotente (slots existentes = `skipped`, tope de 2000 por ejecución).

_Fuente: `docs/business/critical-workflows.md:47`_

### Estados y transiciones

`open → held → confirmed → checked_in` (camino feliz); `held → expired` (vencimiento); `confirmed → rescheduled \| cancelled`.

_Fuente: `docs/business/critical-workflows.md:51`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `P1` | `POST /scheduling/slots/:id/holds` — toma un slot con `SELECT ... FOR UPDATE`, decrementa `remaining_capacity` (nunca baja de cero). | POST /scheduling/slots/{id}/holds | SCHEDULING_ADMIN · SCHEDULING_AGENT · PATIENT | MEDIO | 9 |
| `P2` | `POST /scheduling/holds/:holdToken/confirm` — dentro del TTL del hold (`hold_ttl_seconds`, 300s por defecto), confirma → `appointment_bookings` en estado `confirmed` + se programan recordatorios. | POST /scheduling/holds/{holdToken}/confirm | SCHEDULING_ADMIN · SCHEDULING_AGENT · PATIENT | MEDIO | 18 |
| `P3` | `POST /scheduling/bookings/:id/check-in` — el día de la cita, pasa a `checked_in`. | POST /scheduling/bookings/{id}/check-in | SCHEDULING_ADMIN · SCHEDULING_AGENT | MEDIO | 5 |
| `A1` | **Reprogramar** (`POST /scheduling/bookings/:id/reschedule`): libera el cupo de origen, toma el de destino. | POST /scheduling/bookings/{id}/reschedule | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT | MEDIO | 38 |
| `A2` | **Cancelar** (`POST /scheduling/bookings/:id/cancel`): libera el cupo; cobra cargo por inasistencia solo si la política define `no_show_fee_amount` **y** se marca como no-show — una cancelación avisada nunca se cobra. | POST /scheduling/bookings/{id}/cancel | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT | MEDIO | 43 |
| `A3` | **Hold vencido**: `POST /scheduling/internal/expire-holds` (worker) recicla el cupo. Un hold vencido no se puede confirmar aunque el worker aún no haya corrido. | POST /scheduling/internal/expire-holds | SYSTEM · SYSTEM_WORKER | MEDIO | 8 |
| `A4` | **Excepción de disponibilidad** (`POST /scheduling/resources/:id/exceptions`): bloquea slots libres solapados — **no cancela** citas ya confirmadas (decisión clínica explícita, no efecto colateral automático). | POST /scheduling/resources/{id}/exceptions | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 5 |
| `A5` | **Lista de espera**: `POST /scheduling/waitlist` inscribe; el worker (`promote-waitlist`) marca candidatos cuando hay cupo, pero **no reserva por ellos** — el paciente confirma por el flujo normal. | POST /scheduling/waitlist | SCHEDULING_ADMIN · SCHEDULING_AGENT · PATIENT | MEDIO | 4 |

### Diagrama — etapas `P1`, `P2`, `P3`…

```mermaid
flowchart LR
  a2(["SCHEDULING_ADMIN · SCHEDULING_AGENT · PATIENT"]):::actor
  a15(["SCHEDULING_ADMIN · SCHEDULING_AGENT"]):::actor
  a18(["SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT"]):::actor
  a25(["SYSTEM · SYSTEM_WORKER"]):::actor
  a31(["SCHEDULING_ADMIN · PRACTITIONER"]):::actor
  t3[("profiles.patient_portal_proxies")]:::tabla
  t4[("profiles.patient_profiles")]:::tabla
  t5[("profiles.person_account_links")]:::tabla
  t6[("scheduling.appointment_bookings")]:::tabla
  t7[("scheduling.bookable_slots")]:::tabla
  t10[("billing.service_catalog")]:::tabla
  t11[("clinical.appointments")]:::tabla
  t12[("profiles.persons")]:::tabla
  t16[("audit.appointment_bookings_history")]:::tabla
  t19[("community.conversation_participants")]:::tabla
  t20[("community.conversations")]:::tabla
  t26[("scheduling.availability_exceptions")]:::tabla
  t27[("scheduling.practitioner_service_offerings")]:::tabla
  t28[("scheduling.schedulable_resources")]:::tabla
  t33[("scheduling.waitlist_entries")]:::tabla
  t8[("+3 tablas más")]
  subgraph s0["P1 · `POST /scheduling/slots/:id/holds` — toma un slot con `SELECT ... FOR UPDA…"]
    o1["POST /scheduling/slots/{id}/holds"]:::op
  end
  t13[("+12 tablas más")]
  subgraph s1["P2 · `POST /scheduling/holds/:holdToken/confirm` — dentro del TTL del hold (`ho…"]
    o9["POST /scheduling/holds/{holdToken}/confirm"]:::op
  end
  subgraph s2["P3 · `POST /scheduling/bookings/:id/check-in` — el día de la cita, pasa a `chec…"]
    o14["POST /scheduling/bookings/{id}/check-in"]:::op
  end
  t21[("+32 tablas más")]
  subgraph s3["A1 · **Reprogramar** (`POST /scheduling/bookings/:id/reschedule`): libera el cu…"]
    o17["POST /scheduling/bookings/{id}/reschedule"]:::op
  end
  t23[("+37 tablas más")]
  subgraph s4["A2 · **Cancelar** (`POST /scheduling/bookings/:id/cancel`): libera el cupo; cob…"]
    o22["POST /scheduling/bookings/{id}/cancel"]:::op
  end
  t29[("+2 tablas más")]
  subgraph s5["A3 · **Hold vencido**: `POST /scheduling/internal/expire-holds` (worker) recicl…"]
    o24["POST /scheduling/internal/expire-holds"]:::op
  end
  subgraph s6["A4 · **Excepción de disponibilidad** (`POST /scheduling/resources/:id/exception…"]
    o30["POST /scheduling/resources/{id}/exceptions"]:::op
  end
  subgraph s7["A5 · **Lista de espera**: `POST /scheduling/waitlist` inscribe; el worker (`pro…"]
    o32["POST /scheduling/waitlist"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  o1 -->|"LEE"| t6
  o1 -->|"ACTUALIZA"| t7
  o1 -->|"LEE"| t7
  o1 -.-> t8
  a2 --> o9
  o9 -->|"LEE"| t10
  o9 -->|"CREA"| t11
  o9 -->|"LEE"| t3
  o9 -->|"LEE"| t4
  o9 -->|"LEE"| t5
  o9 -->|"LEE"| t12
  o9 -.-> t13
  o1 ==>|"luego"| o9
  a15 --> o14
  o14 -->|"ACTUALIZA"| t16
  o14 -->|"CREA"| t16
  o14 -->|"LEE"| t16
  o14 -->|"ACTUALIZA"| t6
  o14 -->|"LEE"| t6
  o9 ==>|"luego"| o14
  a18 --> o17
  o17 -->|"ACTUALIZA"| t16
  o17 -->|"CREA"| t16
  o17 -->|"LEE"| t16
  o17 -->|"CREA"| t19
  o17 -->|"LEE"| t19
  o17 -->|"CREA"| t20
  o17 -.-> t21
  a18 --> o22
  o22 -->|"ACTUALIZA"| t16
  o22 -->|"CREA"| t16
  o22 -->|"LEE"| t16
  o22 -->|"CREA"| t19
  o22 -->|"LEE"| t19
  o22 -->|"CREA"| t20
  o22 -.-> t23
  a25 --> o24
  o24 -->|"LEE"| t6
  o24 -->|"LEE"| t26
  o24 -->|"ACTUALIZA"| t7
  o24 -->|"LEE"| t7
  o24 -->|"LEE"| t27
  o24 -->|"LEE"| t28
  o24 -.-> t29
  a31 --> o30
  o30 -->|"LEE"| t6
  o30 -->|"CREA"| t26
  o30 -->|"ACTUALIZA"| t7
  o30 -->|"LEE"| t7
  o30 -->|"LEE"| t28
  a2 --> o32
  o32 -->|"LEE"| t3
  o32 -->|"LEE"| t4
  o32 -->|"LEE"| t5
  o32 -->|"CREA"| t33
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Máquinas de estado

### Máquina de estados `BOOKING_TRANSITIONS`

Declarada en `src/modules/scheduling/domain/booking/booking-state-machine.ts:33`. Los estados llevan el nombre del identificador del código; no se resuelven al catálogo de conceptos.

```mermaid
stateDiagram-v2
  [*] --> BOOKING_REQUESTED
  BOOKING_REQUESTED --> BOOKING_PENDING_CONFIRMATION
  BOOKING_REQUESTED --> BOOKING_CONFIRMED
  BOOKING_REQUESTED --> BOOKING_CANCELLED
  BOOKING_PENDING_CONFIRMATION --> BOOKING_CONFIRMED
  BOOKING_PENDING_CONFIRMATION --> BOOKING_CANCELLED
  BOOKING_CONFIRMED --> BOOKING_CHECKED_IN
  BOOKING_CONFIRMED --> BOOKING_IN_PROGRESS
  BOOKING_CONFIRMED --> BOOKING_CANCELLED
  BOOKING_CONFIRMED --> BOOKING_NO_SHOW
  BOOKING_CHECKED_IN --> BOOKING_IN_PROGRESS
  BOOKING_CHECKED_IN --> BOOKING_CANCELLED
  BOOKING_CHECKED_IN --> BOOKING_NO_SHOW
  BOOKING_IN_PROGRESS --> BOOKING_COMPLETED
  BOOKING_CANCELLED --> [*]
  BOOKING_NO_SHOW --> [*]
  BOOKING_COMPLETED --> [*]
```

**Operaciones que ejercen esta máquina** _(POR_REFERENCIA: el handler alcanza un método que valida contra la tabla; «sin destino nombrado» significa que el estado de destino llega por el cuerpo de la petición)_:

| Operación | Estados de destino que nombra | A través de |
|---|---|---|
| POST /scheduling/appointments/walk-in | sin destino nombrado | BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/accept | sin destino nombrado | BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/cancel | sin destino nombrado | BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/check-in | sin destino nombrado | BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/complete | sin destino nombrado | BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/propose-schedule | sin destino nombrado | BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/reject | sin destino nombrado | BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/request-info | sin destino nombrado | BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/start | sin destino nombrado | BookingTransitionRecorder.assertTransition |

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /scheduling/appointments/direct

Asignar una cita puntual a un paciente (nace confirmada)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La agenda indicada pertenece a otra organización.; ForbiddenException: Un profesional solo puede asignar citas en su propia agenda.; ForbiddenException: La reconsulta se agenda en su propia agenda, no en la de otro profesional. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado; ResourceNotFoundException: La cita de la que sale esta reconsulta no existe; ResourceNotFoundException: Paciente no encontrado |
| 409 | `CONFLICT` | ConflictException: Esta consulta ya tiene una reconsulta agendada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La reconsulta es para el paciente de la cita de origen; PreconditionFailedException: Una reconsulta se agenda para más adelante; PreconditionFailedException: Su vínculo con esta organización todavía está pendiente de aprobación, así que todavía no puede comprometer citas suyas. / Su vínculo con esta organización ya…; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug…; PreconditionFailedException: El paciente ya tiene una cita confirmada en ese rato{clash.resourceName ? ` en «${…}. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.createDirectAppointment"]:::llamada
  n2 --> n3
  n4["Llama a CreateDirectAppointmentUseCase.execute"]:::llamada
  n3 --> n4
  n5["Llama a CreateDirectAppointmentUseCase.executeInTransaction"]:::llamada
  n4 --> n5
  n6["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.schedulable_resources")]:::efecto
  n6 --> n7
  n8{"!resource"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Recurso no encontrado"]):::error
  n8 -->|"sí"| n9
  n10["Llama a BookingAccess.assertResourceInActiveTenant"]:::llamada
  n8 -->|"no"| n10
  n11{"!withinScope"}:::decision
  n10 --> n11
  n12(["403 FORBIDDEN La agenda indicada pertenece a otra organización."]):::error
  n11 -->|"sí"| n12
  n13{"!operatesAnyAgenda(actor) && !isOwnAgenda"}:::decision
  n11 -->|"no"| n13
  n14(["403 FORBIDDEN Un profesional solo puede asignar citas en su propia agenda."]):::error
  n13 -->|"sí"| n14
  n15["Llama a CreateDirectAppointmentUseCase.validateFollowUp"]:::llamada
  n13 -->|"no"| n15
  n16{"!isOwnAgenda"}:::decision
  n15 --> n16
  n17(["403 FORBIDDEN La reconsulta se agenda en su propia agenda, no en la de otro profesional."]):::error
  n16 -->|"sí"| n17
  n18{"!originBooking"}:::decision
  n16 -->|"no"| n18
  n19(["404 NOT_FOUND La cita de la que sale esta reconsulta no existe"]):::error
  n18 -->|"sí"| n19
  n20{"originBooking.patientProfileId !== dto.patientProfileId"}:::decision
  n18 -->|"no"| n20
  n21(["422 PRECONDITION_FAILED La reconsulta es para el paciente de la cita de origen"]):::error
  n20 -->|"sí"| n21
  n22{"startAt.getTime() ‹= now.getTime()"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED Una reconsulta se agenda para más adelante"]):::error
  n22 -->|"sí"| n23
  n24{"upcoming"}:::decision
  n22 -->|"no"| n24
  n25(["409 CONFLICT Esta consulta ya tiene una reconsulta agendada"]):::error
  n24 -->|"sí"| n25
  n26["Llama a BookingAccess.assertAffiliationCurrent"]:::llamada
  n24 -->|"no"| n26
  n27(["422 PRECONDITION_FAILED Su vínculo con esta organización todavía está pendiente de aprobación, así que todaví…"]):::error
  n26 --> n27
  n28["Llama a SchedulingBookingsRepository.findPatientNames"]:::llamada
  n29[("LEE profiles.patient_profiles · LEE profiles.persons")]:::efecto
  n28 --> n29
  n30{"!names.has(dto.patientProfileId)"}:::decision
  n29 --> n30
  n31(["404 NOT_FOUND Paciente no encontrado"]):::error
  n30 -->|"sí"| n31
  n32{"PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n30 -->|"no"| n32
  n33["Llama a SchedulingProfessionalTimeService.assertRangeFree"]:::llamada
  n32 -->|"sí"| n33
  n34(["422 PRECONDITION_FAILED El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first…"]):::error
  n33 --> n34
  n35["Llama a SchedulingBookingsRepository.findPatientBookingsOverlapping"]:::llamada
  n32 -->|"no"| n35
  n36[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n35 --> n36
  n37{"alreadyCommitted.length › 0"}:::decision
  n36 --> n37
  n38(["422 PRECONDITION_FAILED El paciente ya tiene una cita confirmada en ese rato{clash.resourceName ? ` en «${…}."]):::error
  n37 -->|"sí"| n38
  n39{"PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n37 -->|"no"| n39
  n40["Llama a SchedulingCatalogRepository.findOpenSlotsOfProfessionalInWindow"]:::llamada
  n39 -->|"sí"| n40
  n41[("LEE scheduling.schedulable_resources · LEE scheduling.bookable_slots")]:::efecto
  n40 --> n41
  n42["Repite: por cada const free de freeOnes"]:::bucle
  n41 --> n42
  n43[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n42 -->|"cada elemento"| n43
  n44["Llama a SchedulingCatalogRepository.createSlot"]:::llamada
  n43 --> n44
  n42 -->|"al terminar"| n44
  n39 -->|"no"| n44
  n45[("CREA scheduling.bookable_slots")]:::efecto
  n44 --> n45
  n46["Llama a SchedulingBookingsRepository.createBooking"]:::llamada
  n45 --> n46
  n47[("CREA scheduling.appointment_bookings")]:::efecto
  n46 --> n47
  n48["Repite: por cada const offset de DEFAULT_REMINDER_OFFSETS"]:::bucle
  n47 --> n48
  n49["Llama a SchedulingBookingsRepository.createReminder"]:::llamada
  n48 -->|"cada elemento"| n49
  n50[("CREA scheduling.appointment_reminders")]:::efecto
  n49 --> n50
  n51["Llama a BookingChangeNotifier.notifyChange"]:::llamada
  n50 --> n51
  n48 -->|"al terminar"| n51
  n52["Llama a SchedulingNoticeRepository.describeBooking"]:::llamada
  n51 --> n52
  n53[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n52 --> n53
  n54["Llama a SchedulingNoticeRepository.findResourceAccount"]:::llamada
  n53 --> n54
  n55[("LEE scheduling.schedulable_resources")]:::efecto
  n54 --> n55
  n56(("201 Responde con éxito")):::ok
  n55 --> n56
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /scheduling/appointments/walk-in

Turno de mostrador atómico (walk-in)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La agenda indicada pertenece a otra organización.; ForbiddenException: Un profesional solo puede asignar citas en su propia agenda.; ForbiddenException: La reconsulta se agenda en su propia agenda, no en la de otro profesional. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado; ResourceNotFoundException: La cita de la que sale esta reconsulta no existe; ResourceNotFoundException: Paciente no encontrado |
| 409 | `CONFLICT` | ConflictException: Esta consulta ya tiene una reconsulta agendada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La reconsulta es para el paciente de la cita de origen; PreconditionFailedException: Una reconsulta se agenda para más adelante; PreconditionFailedException: Su vínculo con esta organización todavía está pendiente de aprobación, así que todavía no puede comprometer citas suyas. / Su vínculo con esta organización ya…; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug…; PreconditionFailedException: El paciente ya tiene una cita confirmada en ese rato{clash.resourceName ? ` en «${…}.; PreconditionFailedException: Transición de estado de cita no permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingWalkInService.createWalkInAppointment"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a SchedulingBookingsService.createDirectAppointmentInTransaction"]:::llamada
  n4 --> n5
  n6["Llama a CreateDirectAppointmentUseCase.executeInTransaction"]:::llamada
  n5 --> n6
  n7["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.schedulable_resources")]:::efecto
  n7 --> n8
  n9{"!resource"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Recurso no encontrado"]):::error
  n9 -->|"sí"| n10
  n11["Llama a BookingAccess.assertResourceInActiveTenant"]:::llamada
  n9 -->|"no"| n11
  n12{"!withinScope"}:::decision
  n11 --> n12
  n13(["403 FORBIDDEN La agenda indicada pertenece a otra organización."]):::error
  n12 -->|"sí"| n13
  n14{"!operatesAnyAgenda(actor) && !isOwnAgenda"}:::decision
  n12 -->|"no"| n14
  n15(["403 FORBIDDEN Un profesional solo puede asignar citas en su propia agenda."]):::error
  n14 -->|"sí"| n15
  n16["Llama a CreateDirectAppointmentUseCase.validateFollowUp"]:::llamada
  n14 -->|"no"| n16
  n17{"!isOwnAgenda"}:::decision
  n16 --> n17
  n18(["403 FORBIDDEN La reconsulta se agenda en su propia agenda, no en la de otro profesional."]):::error
  n17 -->|"sí"| n18
  n19{"!originBooking"}:::decision
  n17 -->|"no"| n19
  n20(["404 NOT_FOUND La cita de la que sale esta reconsulta no existe"]):::error
  n19 -->|"sí"| n20
  n21{"originBooking.patientProfileId !== dto.patientProfileId"}:::decision
  n19 -->|"no"| n21
  n22(["422 PRECONDITION_FAILED La reconsulta es para el paciente de la cita de origen"]):::error
  n21 -->|"sí"| n22
  n23{"startAt.getTime() ‹= now.getTime()"}:::decision
  n21 -->|"no"| n23
  n24(["422 PRECONDITION_FAILED Una reconsulta se agenda para más adelante"]):::error
  n23 -->|"sí"| n24
  n25{"upcoming"}:::decision
  n23 -->|"no"| n25
  n26(["409 CONFLICT Esta consulta ya tiene una reconsulta agendada"]):::error
  n25 -->|"sí"| n26
  n27["Llama a BookingAccess.assertAffiliationCurrent"]:::llamada
  n25 -->|"no"| n27
  n28(["422 PRECONDITION_FAILED Su vínculo con esta organización todavía está pendiente de aprobación, así que todaví…"]):::error
  n27 --> n28
  n29["Llama a SchedulingBookingsRepository.findPatientNames"]:::llamada
  n30[("LEE profiles.patient_profiles · LEE profiles.persons")]:::efecto
  n29 --> n30
  n31{"!names.has(dto.patientProfileId)"}:::decision
  n30 --> n31
  n32(["404 NOT_FOUND Paciente no encontrado"]):::error
  n31 -->|"sí"| n32
  n33{"PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n31 -->|"no"| n33
  n34["Llama a SchedulingProfessionalTimeService.assertRangeFree"]:::llamada
  n33 -->|"sí"| n34
  n35(["422 PRECONDITION_FAILED El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first…"]):::error
  n34 --> n35
  n36["Llama a SchedulingBookingsRepository.findPatientBookingsOverlapping"]:::llamada
  n33 -->|"no"| n36
  n37[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n36 --> n37
  n38{"alreadyCommitted.length › 0"}:::decision
  n37 --> n38
  n39(["422 PRECONDITION_FAILED El paciente ya tiene una cita confirmada en ese rato{clash.resourceName ? ` en «${…}."]):::error
  n38 -->|"sí"| n39
  n40{"PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n38 -->|"no"| n40
  n41["Llama a SchedulingCatalogRepository.findOpenSlotsOfProfessionalInWindow"]:::llamada
  n40 -->|"sí"| n41
  n42[("LEE scheduling.schedulable_resources · LEE scheduling.bookable_slots")]:::efecto
  n41 --> n42
  n43["Repite: por cada const free de freeOnes"]:::bucle
  n42 --> n43
  n44[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n43 -->|"cada elemento"| n44
  n45["Llama a SchedulingCatalogRepository.createSlot"]:::llamada
  n44 --> n45
  n43 -->|"al terminar"| n45
  n40 -->|"no"| n45
  n46[("CREA scheduling.bookable_slots")]:::efecto
  n45 --> n46
  n47["Llama a SchedulingBookingsRepository.createBooking"]:::llamada
  n46 --> n47
  n48[("CREA scheduling.appointment_bookings")]:::efecto
  n47 --> n48
  n49["Repite: por cada const offset de DEFAULT_REMINDER_OFFSETS"]:::bucle
  n48 --> n49
  n50["Llama a SchedulingBookingsRepository.createReminder"]:::llamada
  n49 -->|"cada elemento"| n50
  n51[("CREA scheduling.appointment_reminders")]:::efecto
  n50 --> n51
  n52["Llama a ClinicalEncountersAdapter.open"]:::llamada
  n51 --> n52
  n49 -->|"al terminar"| n52
  n53["Llama a EncountersRepository.create"]:::llamada
  n52 --> n53
  n54[("CREA clinical.encounters")]:::efecto
  n53 --> n54
  n55{"appointment.practitionerProfileId"}:::decision
  n54 --> n55
  n56["Llama a ClinicalEncountersAdapter.addParticipant"]:::llamada
  n55 -->|"sí"| n56
  n57["Llama a EncountersRepository.createParticipant"]:::llamada
  n56 --> n57
  n58[("CREA clinical.encounter_participants")]:::efecto
  n57 --> n58
  n59["Llama a SchedulingBookingsService.startInTransaction"]:::llamada
  n58 --> n59
  n55 -->|"no"| n59
  n60["Llama a StartAppointmentUseCase.executeInTransaction"]:::llamada
  n59 --> n60
  n61["Llama a BookingTransitionRecorder.assertTransition"]:::llamada
  n60 --> n61
  n62{"!isValidBookingTransition(from, to)"}:::decision
  n61 --> n62
  n63(["422 PRECONDITION_FAILED Transición de estado de cita no permitida"]):::error
  n62 -->|"sí"| n63
  n64[("ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n62 -->|"no"| n64
  n65(("201 Responde con éxito")):::ok
  n64 --> n65
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /scheduling/booking-policies

Definir una política de reserva

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: El tenant indicado no es uno de los del actor. |
| 409 | `CONFLICT` | ConflictException: Ya existe una política con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.createPolicy"]:::llamada
  n2 --> n3
  n4["Llama a CreateBookingPolicyUseCase.execute"]:::llamada
  n3 --> n4
  n5["Llama a CatalogAccess.assertActorTenant"]:::llamada
  n4 --> n5
  n6{"!actor.tenantIds?.includes(tenantId)"}:::decision
  n5 --> n6
  n7(["403 FORBIDDEN El tenant indicado no es uno de los del actor."]):::error
  n6 -->|"sí"| n7
  n8["Llama a SchedulingCatalogRepository.findPolicyByCode"]:::llamada
  n6 -->|"no"| n8
  n9[("LEE scheduling.booking_policies")]:::efecto
  n8 --> n9
  n10{"duplicate"}:::decision
  n9 --> n10
  n11(["409 CONFLICT Ya existe una política con ese código"]):::error
  n10 -->|"sí"| n11
  n12["Transacción: transactional(…)"]:::transaccion
  n10 -->|"no"| n12
  n13["Llama a SchedulingCatalogRepository.createPolicy"]:::llamada
  n12 --> n13
  n14[("CREA scheduling.booking_policies")]:::efecto
  n13 --> n14
  n15(("201 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. GET /scheduling/bookings

UC-41-15: lista citas por paciente, recurso y/o ventana

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique al menos patientProfileId o resourceId para listar citas; PreconditionFailedException: La ventana debe empezar antes de terminar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.searchBookings"]:::llamada
  n2 --> n3
  n4["Llama a SearchBookingsUseCase.execute"]:::llamada
  n3 --> n4
  n5{"!filters.patientProfileId && !filters.resourceId"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED Indique al menos patientProfileId o resourceId para listar citas"]):::error
  n5 -->|"sí"| n6
  n7{"filters.from && filters.to && !(filters.from ‹ filters.to)"}:::decision
  n5 -->|"no"| n7
  n8(["422 PRECONDITION_FAILED La ventana debe empezar antes de terminar"]):::error
  n7 -->|"sí"| n8
  n9["Llama a SchedulingBookingsRepository.findBookings"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n9 --> n10
  n11["Llama a AuditBookingHistoryAdapter.latestByBooking"]:::llamada
  n10 --> n11
  n12[("LEE audit.appointment_bookings_history")]:::efecto
  n11 --> n12
  n13["Llama a AuditBookingHistoryAdapter.latestByBooking"]:::llamada
  n12 --> n13
  n14[("LEE audit.appointment_bookings_history")]:::efecto
  n13 --> n14
  n15["Llama a SchedulingBookingsRepository.latestRescheduleOrigins"]:::llamada
  n14 --> n15
  n16[("LEE scheduling.booking_reschedules · LEE scheduling.bookable_slots")]:::efecto
  n15 --> n16
  n17{"actor?.practitionerProfileId !== undefined"}:::decision
  n16 --> n17
  n18["Repite: por cada const id de ids"]:::bucle
  n17 -->|"sí"| n18
  n19["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n18 -->|"cada elemento"| n19
  n20[("LEE scheduling.schedulable_resources")]:::efecto
  n19 --> n20
  n21["Llama a ClinicalAppointmentsAdapter.findTypesByIds"]:::llamada
  n20 --> n21
  n18 -->|"al terminar"| n21
  n17 -->|"no"| n21
  n22["Llama a AppointmentsRepository.findTypesByIds"]:::llamada
  n21 --> n22
  n23[("LEE clinical.appointments")]:::efecto
  n22 --> n23
  n24["Llama a ClinicalAppointmentsAdapter.findLatestEncounterIds"]:::llamada
  n23 --> n24
  n25["Llama a EncountersRepository.findLatestIdsByAppointmentIds"]:::llamada
  n24 --> n25
  n26[("LEE clinical.encounters")]:::efecto
  n25 --> n26
  n27["Llama a SchedulingBookingsRepository.findPatientNames"]:::llamada
  n26 --> n27
  n28[("LEE profiles.patient_profiles · LEE profiles.persons")]:::efecto
  n27 --> n28
  n29["Llama a SchedulingBookingsRepository.findPaymentStatesForBookings"]:::llamada
  n28 --> n29
  n30[("LEE scheduling.appointment_payment_states")]:::efecto
  n29 --> n30
  n31["Llama a InsuranceReadAdapter.findActiveCarriersByPatients"]:::llamada
  n30 --> n31
  n32["Llama a CoverageRepository.findActiveCarriersByPatients"]:::llamada
  n31 --> n32
  n33[("LEE insurance.patient_coverages · LEE insurance.insurance_plans · LEE insurance.insurance_products · LEE insu…")]:::efecto
  n32 --> n33
  n34["Llama a BookingItemAssembler.followUpLinks"]:::llamada
  n33 --> n34
  n35["Llama a SchedulingBookingsRepository.findBookingsWithSlotsByIds"]:::llamada
  n34 --> n35
  n36[("LEE scheduling.appointment_bookings")]:::efecto
  n35 --> n36
  n37["Llama a SchedulingBookingsRepository.findFollowUpsOf"]:::llamada
  n36 --> n37
  n38[("LEE scheduling.appointment_bookings")]:::efecto
  n37 --> n38
  n39(("200 Responde con éxito")):::ok
  n38 --> n39
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. GET /scheduling/bookings/{id}

UC-41-15: consulta una cita

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.getBookingById"]:::llamada
  n2 --> n3
  n4["Llama a GetBookingUseCase.execute"]:::llamada
  n3 --> n4
  n5["Llama a SchedulingBookingsRepository.findBookingById"]:::llamada
  n4 --> n5
  n6[("LEE scheduling.appointment_bookings")]:::efecto
  n5 --> n6
  n7{"!booking"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Cita no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a SchedulingBookingsRepository.findSlotById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE scheduling.bookable_slots")]:::efecto
  n9 --> n10
  n11["Llama a AuditBookingHistoryAdapter.latestByBooking"]:::llamada
  n10 --> n11
  n12[("LEE audit.appointment_bookings_history")]:::efecto
  n11 --> n12
  n13["Llama a AuditBookingHistoryAdapter.latestByBooking"]:::llamada
  n12 --> n13
  n14[("LEE audit.appointment_bookings_history")]:::efecto
  n13 --> n14
  n15["Llama a SchedulingBookingsRepository.latestRescheduleOrigins"]:::llamada
  n14 --> n15
  n16[("LEE scheduling.booking_reschedules · LEE scheduling.bookable_slots")]:::efecto
  n15 --> n16
  n17["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n16 --> n17
  n18[("LEE scheduling.schedulable_resources")]:::efecto
  n17 --> n18
  n19{"isPatientActor(actor)"}:::decision
  n18 --> n19
  n20{"actor && !operatesAnyAgenda(actor)"}:::decision
  n19 -->|"no"| n20
  n21{"!isOwnAgenda"}:::decision
  n20 -->|"sí"| n21
  n22(["403 FORBIDDEN Esta cita es de otra agenda: solo la opera quien atiende en ella."]):::error
  n21 -->|"sí"| n22
  n23["Llama a ClinicalAppointmentsAdapter.findTypesByIds"]:::llamada
  n19 -->|"sí"| n23
  n21 -->|"no"| n23
  n20 -->|"no"| n23
  n24["Llama a AppointmentsRepository.findTypesByIds"]:::llamada
  n23 --> n24
  n25[("LEE clinical.appointments")]:::efecto
  n24 --> n25
  n26["Llama a ClinicalAppointmentsAdapter.findLatestEncounterIds"]:::llamada
  n25 --> n26
  n27["Llama a EncountersRepository.findLatestIdsByAppointmentIds"]:::llamada
  n26 --> n27
  n28[("LEE clinical.encounters")]:::efecto
  n27 --> n28
  n29["Llama a BookingItemAssembler.followUpLinks"]:::llamada
  n28 --> n29
  n30["Llama a SchedulingBookingsRepository.findBookingsWithSlotsByIds"]:::llamada
  n29 --> n30
  n31[("LEE scheduling.appointment_bookings")]:::efecto
  n30 --> n31
  n32["Llama a SchedulingBookingsRepository.findFollowUpsOf"]:::llamada
  n31 --> n32
  n33[("LEE scheduling.appointment_bookings")]:::efecto
  n32 --> n33
  n34(("200 Responde con éxito")):::ok
  n33 --> n34
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /scheduling/bookings/{id}/accept

Aceptar la solicitud de cita

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Su vínculo con esta organización todavía está pendiente de aprobación, así que todavía no puede comprometer citas suyas. / Su vínculo con esta organización ya…; PreconditionFailedException: Transición de estado de cita no permitida; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.accept"]:::llamada
  n2 --> n3
  n4["Llama a AcceptBookingUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a BookingAccess.loadForOperation"]:::llamada
  n5 --> n6
  n7["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.appointment_bookings")]:::efecto
  n7 --> n8
  n9{"!booking"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Cita no encontrada"]):::error
  n9 -->|"sí"| n10
  n11["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE scheduling.schedulable_resources")]:::efecto
  n11 --> n12
  n13{"!isOwnAgenda"}:::decision
  n12 --> n13
  n14(["403 FORBIDDEN Esta cita es de otra agenda: solo la opera quien atiende en ella."]):::error
  n13 -->|"sí"| n14
  n15["Llama a BookingAccess.assertAffiliationCurrent"]:::llamada
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED Su vínculo con esta organización todavía está pendiente de aprobación, así que todaví…"]):::error
  n15 --> n16
  n17["Llama a BookingTransitionRecorder.assertTransition"]:::llamada
  n18{"!isValidBookingTransition(from, to)"}:::decision
  n17 --> n18
  n19(["422 PRECONDITION_FAILED Transición de estado de cita no permitida"]):::error
  n18 -->|"sí"| n19
  n20["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n18 -->|"no"| n20
  n21[("LEE scheduling.schedulable_resources")]:::efecto
  n20 --> n21
  n22{"bookingResource && PRACTITIONER_PROFILE_TABLES.includes(bookingResource.resourceRefType)"}:::decision
  n21 --> n22
  n23["Llama a SchedulingBookingsRepository.findSlotById"]:::llamada
  n22 -->|"sí"| n23
  n24[("LEE scheduling.bookable_slots")]:::efecto
  n23 --> n24
  n25{"bookingSlot"}:::decision
  n24 --> n25
  n26["Llama a SchedulingProfessionalTimeService.assertRangeFree"]:::llamada
  n25 -->|"sí"| n26
  n27{"first.kind === 'ocupado'"}:::decision
  n26 --> n27
  n28{"first.patientProfileId"}:::decision
  n27 -->|"no"| n28
  n29["Llama a SchedulingBookingsRepository.findPatientNames"]:::llamada
  n28 -->|"sí"| n29
  n30[("LEE profiles.patient_profiles · LEE profiles.persons")]:::efecto
  n29 --> n30
  n31(["422 PRECONDITION_FAILED El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first…"]):::error
  n27 -->|"sí"| n31
  n30 --> n31
  n28 -->|"no"| n31
  n32[("ACTUALIZA scheduling.appointment_bookings · ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n25 -->|"no"| n32
  n22 -->|"no"| n32
  n33["Llama a ClinicalAppointmentSync.syncClinicalAppointment"]:::llamada
  n32 --> n33
  n34["Llama a ClinicalAppointmentsAdapter.updateStatus"]:::llamada
  n33 --> n34
  n35[("ACTUALIZA clinical.appointments")]:::efecto
  n34 --> n35
  n36["Llama a BookingTransitionRecorder.recordTransition"]:::llamada
  n35 --> n36
  n37["Llama a AuditBookingHistoryAdapter.append"]:::llamada
  n36 --> n37
  n38[("LEE audit.appointment_bookings_history · ACTUALIZA audit.appointment_bookings_history · CREA audit.appointmen…")]:::efecto
  n37 --> n38
  n39["Llama a SchedulingBookingsRepository.findSlotById"]:::llamada
  n38 --> n39
  n40[("LEE scheduling.bookable_slots")]:::efecto
  n39 --> n40
  n41["Repite: por cada const offset de offsets"]:::bucle
  n40 --> n41
  n42["Llama a SchedulingBookingsRepository.createReminder"]:::llamada
  n41 -->|"cada elemento"| n42
  n43[("CREA scheduling.appointment_reminders")]:::efecto
  n42 --> n43
  n44["Llama a DisplacedRequestsCanceller.cancelConflictingPending"]:::llamada
  n43 --> n44
  n41 -->|"al terminar"| n44
  n45["Llama a SchedulingBookingsRepository.findSlotById"]:::llamada
  n44 --> n45
  n46[("LEE scheduling.bookable_slots")]:::efecto
  n45 --> n46
  n47["Llama a SchedulingBookingsRepository.findPatientBookingsOverlapping"]:::llamada
  n46 --> n47
  n48[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n47 --> n48
  n49["Repite: por cada const other de clashing"]:::bucle
  n48 --> n49
  n50["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n49 -->|"cada elemento"| n50
  n51[("LEE scheduling.appointment_bookings")]:::efecto
  n50 --> n51
  n52["Llama a SchedulingBookingsRepository.createCancellation"]:::llamada
  n51 --> n52
  n53[("CREA scheduling.booking_cancellations")]:::efecto
  n52 --> n53
  n54[("ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n53 --> n54
  n55["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n54 --> n55
  n56[("LEE scheduling.bookable_slots")]:::efecto
  n55 --> n56
  n57{"ownSlot"}:::decision
  n56 --> n57
  n58[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n57 -->|"sí"| n58
  n59{"ownSlot.practitionerServiceOfferingId"}:::decision
  n58 --> n59
  n60["Llama a ServiceSlotLifecycle.discardOneOffSlot"]:::llamada
  n59 -->|"sí"| n60
  n61[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n60 --> n61
  n62{"ownSlot.statusConceptId === CONCEPTS.SLOT_HELD"}:::decision
  n59 -->|"no"| n62
  n63[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n62 -->|"sí"| n63
  n64["Llama a BookingChangeNotifier.notifyChange"]:::llamada
  n61 --> n64
  n63 --> n64
  n62 -->|"no"| n64
  n57 -->|"no"| n64
  n49 -->|"al terminar"| n64
  n65["Llama a SchedulingNoticeRepository.describeBooking"]:::llamada
  n64 --> n65
  n66[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n65 --> n66
  n67["Llama a SchedulingNoticeRepository.findResourceAccount"]:::llamada
  n66 --> n67
  n68[("LEE scheduling.schedulable_resources")]:::efecto
  n67 --> n68
  n69["Repite: por cada const id de result.desplazadas"]:::bucle
  n68 --> n69
  n70["Llama a BookingChangeNotifier.notifyChange"]:::llamada
  n69 -->|"cada elemento"| n70
  n71["… el resto del árbol (5 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /scheduling/bookings/{id}/cancel

Cancelar la cita y liberar el cupo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada; ResourceNotFoundException: Slot no encontrado |
| 409 | `CONFLICT` | ConflictException: La cita ya está cancelada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Transición de estado de cita no permitida; PreconditionFailedException: Puede cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no puede asistir, comuníquese con el consultorio. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.cancel"]:::llamada
  n2 --> n3
  n4["Llama a CancelBookingUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.appointment_bookings")]:::efecto
  n6 --> n7
  n8{"!booking"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Cita no encontrada"]):::error
  n8 -->|"sí"| n9
  n10{"booking.statusConceptId === CONCEPTS.BOOKING_CANCELLED"}:::decision
  n8 -->|"no"| n10
  n11(["409 CONFLICT La cita ya está cancelada"]):::error
  n10 -->|"sí"| n11
  n12["Llama a BookingTransitionRecorder.assertTransition"]:::llamada
  n10 -->|"no"| n12
  n13{"!isValidBookingTransition(from, to)"}:::decision
  n12 --> n13
  n14(["422 PRECONDITION_FAILED Transición de estado de cita no permitida"]):::error
  n13 -->|"sí"| n14
  n15{"feeSource === undefined && !snapshot && booking.bookingPolicyId"}:::decision
  n13 -->|"no"| n15
  n16["Llama a SchedulingCatalogRepository.findPolicyById"]:::llamada
  n15 -->|"sí"| n16
  n17[("LEE scheduling.booking_policies")]:::efecto
  n16 --> n17
  n18["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n17 --> n18
  n15 -->|"no"| n18
  n19[("LEE scheduling.bookable_slots")]:::efecto
  n18 --> n19
  n20{"blocksHolderCancellation(isHolderPatient, withinWindow, isNoShow)"}:::decision
  n19 --> n20
  n21(["422 PRECONDITION_FAILED Puede cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no…"]):::error
  n20 -->|"sí"| n21
  n22["Llama a SchedulingBookingsRepository.createCancellation"]:::llamada
  n20 -->|"no"| n22
  n23[("CREA scheduling.booking_cancellations")]:::efecto
  n22 --> n23
  n24[("ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n23 --> n24
  n25["Llama a BookingTransitionRecorder.recordTransition"]:::llamada
  n24 --> n25
  n26["Llama a AuditBookingHistoryAdapter.append"]:::llamada
  n25 --> n26
  n27[("LEE audit.appointment_bookings_history · ACTUALIZA audit.appointment_bookings_history · CREA audit.appointmen…")]:::efecto
  n26 --> n27
  n28{"slot"}:::decision
  n27 --> n28
  n29[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n28 -->|"sí"| n29
  n30{"slot.scheduleTemplateId === undefined || slot.scheduleTemplateId === null"}:::decision
  n29 --> n30
  n31["Llama a ServiceSlotLifecycle.discardOneOffSlot"]:::llamada
  n30 -->|"sí"| n31
  n32[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n31 --> n32
  n33{"slot.statusConceptId !== CONCEPTS.SLOT_BLOCKED"}:::decision
  n30 -->|"no"| n33
  n34[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n33 -->|"sí"| n34
  n35["Llama a BookingChangeNotifier.notifyChange"]:::llamada
  n32 --> n35
  n34 --> n35
  n33 -->|"no"| n35
  n28 -->|"no"| n35
  n36["Llama a SchedulingNoticeRepository.describeBooking"]:::llamada
  n35 --> n36
  n37[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n36 --> n37
  n38["Llama a SchedulingNoticeRepository.findResourceAccount"]:::llamada
  n37 --> n38
  n39[("LEE scheduling.schedulable_resources")]:::efecto
  n38 --> n39
  n40["Llama a CancelBookingUseCase.promoteWaitlistFor"]:::llamada
  n39 --> n40
  n41["Intenta"]:::intento
  n40 --> n41
  n42["Llama a SchedulingWaitlistService.promoteWaitlist"]:::llamada
  n41 --> n42
  n43["Transacción: transaction(…)"]:::transaccion
  n42 --> n43
  n44{"!slot"}:::decision
  n43 --> n44
  n45(["404 NOT_FOUND Slot no encontrado"]):::error
  n44 -->|"sí"| n45
  n46(("200 Responde con éxito")):::ok
  n44 -->|"no"| n46
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /scheduling/bookings/{id}/check-in

Registrar la llegada del paciente

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Transición de estado de cita no permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.checkIn"]:::llamada
  n2 --> n3
  n4["Llama a CheckInBookingUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.appointment_bookings")]:::efecto
  n6 --> n7
  n8{"!booking"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Cita no encontrada"]):::error
  n8 -->|"sí"| n9
  n10["Llama a BookingTransitionRecorder.assertTransition"]:::llamada
  n8 -->|"no"| n10
  n11{"!isValidBookingTransition(from, to)"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED Transición de estado de cita no permitida"]):::error
  n11 -->|"sí"| n12
  n13[("ACTUALIZA scheduling.appointment_bookings · ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n11 -->|"no"| n13
  n14["Llama a BookingTransitionRecorder.recordTransition"]:::llamada
  n13 --> n14
  n15["Llama a AuditBookingHistoryAdapter.append"]:::llamada
  n14 --> n15
  n16[("LEE audit.appointment_bookings_history · ACTUALIZA audit.appointment_bookings_history · CREA audit.appointmen…")]:::efecto
  n15 --> n16
  n17(("200 Responde con éxito")):::ok
  n16 --> n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /scheduling/bookings/{id}/complete

Completar la atención

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Transición de estado de cita no permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.complete"]:::llamada
  n2 --> n3
  n4["Llama a CompleteAppointmentUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a BookingAccess.loadForOperation"]:::llamada
  n5 --> n6
  n7["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.appointment_bookings")]:::efecto
  n7 --> n8
  n9{"!booking"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Cita no encontrada"]):::error
  n9 -->|"sí"| n10
  n11["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE scheduling.schedulable_resources")]:::efecto
  n11 --> n12
  n13{"!isOwnAgenda"}:::decision
  n12 --> n13
  n14(["403 FORBIDDEN Esta cita es de otra agenda: solo la opera quien atiende en ella."]):::error
  n13 -->|"sí"| n14
  n15["Llama a BookingTransitionRecorder.assertTransition"]:::llamada
  n13 -->|"no"| n15
  n16{"!isValidBookingTransition(from, to)"}:::decision
  n15 --> n16
  n17(["422 PRECONDITION_FAILED Transición de estado de cita no permitida"]):::error
  n16 -->|"sí"| n17
  n18[("ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n16 -->|"no"| n18
  n19["Llama a ServiceSlotLifecycle.releaseServiceLeftover"]:::llamada
  n18 --> n19
  n20["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n19 --> n20
  n21[("LEE scheduling.bookable_slots")]:::efecto
  n20 --> n21
  n22[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n21 --> n22
  n23["Llama a ClinicalAppointmentSync.syncClinicalAppointment"]:::llamada
  n22 --> n23
  n24["Llama a ClinicalAppointmentsAdapter.updateStatus"]:::llamada
  n23 --> n24
  n25[("ACTUALIZA clinical.appointments")]:::efecto
  n24 --> n25
  n26["Llama a BookingTransitionRecorder.recordTransition"]:::llamada
  n25 --> n26
  n27["Llama a AuditBookingHistoryAdapter.append"]:::llamada
  n26 --> n27
  n28[("LEE audit.appointment_bookings_history · ACTUALIZA audit.appointment_bookings_history · CREA audit.appointmen…")]:::efecto
  n27 --> n28
  n29(("200 Responde con éxito")):::ok
  n28 --> n29
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /scheduling/bookings/{id}/delay

Informar una demora sobre una cita

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: sólo avisa su demora quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una demora mayor a cuatro horas se resuelve reprogramando la cita, no avisando |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingDelayService.delayBooking"]:::llamada
  n2 --> n3
  n4["Llama a SchedulingDelayService.assertMinutes"]:::llamada
  n3 --> n4
  n5{"minutes › MAX_DELAY_MINUTES"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED Una demora mayor a cuatro horas se resuelve reprogramando la cita, no avisando"]):::error
  n5 -->|"sí"| n6
  n7["Llama a SchedulingNoticeRepository.describeBooking"]:::llamada
  n5 -->|"no"| n7
  n8[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n7 --> n8
  n9["Llama a SchedulingNoticeRepository.describeResource"]:::llamada
  n8 --> n9
  n10[("LEE scheduling.schedulable_resources")]:::efecto
  n9 --> n10
  n11{"PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n10 --> n11
  n12["Llama a SchedulingNoticeRepository.findDisplayNameForProfile"]:::llamada
  n11 -->|"sí"| n12
  n13[("LEE profiles.persons")]:::efecto
  n12 --> n13
  n14["Llama a SchedulingNoticeRepository.describeSite"]:::llamada
  n13 --> n14
  n11 -->|"no"| n14
  n15[("LEE scheduling.schedulable_resources · LEE practice.practices")]:::efecto
  n14 --> n15
  n16{"!booking"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Cita no encontrada"]):::error
  n16 -->|"sí"| n17
  n18["Llama a SchedulingDelayService.assertOperatesAgenda"]:::llamada
  n16 -->|"no"| n18
  n19["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n18 --> n19
  n20[("LEE scheduling.schedulable_resources")]:::efecto
  n19 --> n20
  n21{"!isOwnAgenda"}:::decision
  n20 --> n21
  n22(["403 FORBIDDEN Esta agenda es de otro profesional: sólo avisa su demora quien atiende en ella."]):::error
  n21 -->|"sí"| n22
  n23["Llama a SchedulingDelayService.recordDelay"]:::llamada
  n21 -->|"no"| n23
  n24["Transacción: transactional(…)"]:::transaccion
  n23 --> n24
  n25["Llama a AuditBookingHistoryAdapter.append"]:::llamada
  n24 --> n25
  n26["Llama a HistoryRepository.append"]:::llamada
  n25 --> n26
  n27{"!binding"}:::decision
  n26 --> n27
  n28(["500 INTERNAL Entidad de historial no registrada: {entity}"]):::error
  n27 -->|"sí"| n28
  n29[("LEE audit.appointment_bookings_history · ACTUALIZA audit.appointment_bookings_history · CREA audit.appointmen…")]:::efecto
  n27 -->|"no"| n29
  n30(("200 Responde con éxito")):::ok
  n29 --> n30
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. GET /scheduling/bookings/{id}/payment-state

Leer el estado de pago de una cita

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.getPaymentState"]:::llamada
  n2 --> n3
  n4["Llama a GetPaymentStateUseCase.execute"]:::llamada
  n3 --> n4
  n5["Llama a BookingAccess.loadForOperation"]:::llamada
  n4 --> n5
  n6["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.appointment_bookings")]:::efecto
  n6 --> n7
  n8{"!booking"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Cita no encontrada"]):::error
  n8 -->|"sí"| n9
  n10["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n8 -->|"no"| n10
  n11[("LEE scheduling.schedulable_resources")]:::efecto
  n10 --> n11
  n12{"!isOwnAgenda"}:::decision
  n11 --> n12
  n13(["403 FORBIDDEN Esta cita es de otra agenda: solo la opera quien atiende en ella."]):::error
  n12 -->|"sí"| n13
  n14["Llama a SchedulingBookingsRepository.findPaymentState"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE scheduling.appointment_payment_states")]:::efecto
  n14 --> n15
  n16(("200 Responde con éxito")):::ok
  n15 --> n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. PUT /scheduling/bookings/{id}/payment-state

Marcar el estado de pago de una cita

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una cita cancelada o rechazada no lleva estado de pago: no hubo atención que cobrar. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.setPaymentState"]:::llamada
  n2 --> n3
  n4["Llama a SetPaymentStateUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a BookingAccess.loadForOperation"]:::llamada
  n5 --> n6
  n7["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.appointment_bookings")]:::efecto
  n7 --> n8
  n9{"!booking"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Cita no encontrada"]):::error
  n9 -->|"sí"| n10
  n11["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE scheduling.schedulable_resources")]:::efecto
  n11 --> n12
  n13{"!isOwnAgenda"}:::decision
  n12 --> n13
  n14(["403 FORBIDDEN Esta cita es de otra agenda: solo la opera quien atiende en ella."]):::error
  n13 -->|"sí"| n14
  n15{"STATES_WITHOUT_PAYMENT.includes(booking.statusConceptId)"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED Una cita cancelada o rechazada no lleva estado de pago: no hubo atención que cobrar."]):::error
  n15 -->|"sí"| n16
  n17["Llama a SchedulingBookingsRepository.findPaymentStateForUpdate"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE scheduling.appointment_payment_states")]:::efecto
  n17 --> n18
  n19{"existing"}:::decision
  n18 --> n19
  n20[("ACTUALIZA scheduling.appointment_payment_states · ACTUALIZA scheduling.appointment_payment_states · ACTUALIZA…")]:::efecto
  n19 -->|"sí"| n20
  n21[("CREA scheduling.appointment_payment_states · GUARDA scheduling.appointment_payment_states")]:::efecto
  n19 -->|"no"| n21
  n22["Llama a AuditBookingHistoryAdapter.append"]:::llamada
  n20 --> n22
  n21 --> n22
  n23["Llama a HistoryRepository.append"]:::llamada
  n22 --> n23
  n24{"!binding"}:::decision
  n23 --> n24
  n25(["500 INTERNAL Entidad de historial no registrada: {entity}"]):::error
  n24 -->|"sí"| n25
  n26[("LEE audit.appointment_bookings_history · ACTUALIZA audit.appointment_bookings_history · CREA audit.appointmen…")]:::efecto
  n24 -->|"no"| n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /scheduling/bookings/{id}/propose-schedule

Proponer otro horario para la solicitud

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada; ResourceNotFoundException: Cupo propuesto no encontrado |
| 409 | `CONFLICT` | ConflictException: El cupo propuesto no tiene lugar |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se opera así sobre una solicitud pendiente; PreconditionFailedException: Todavía no se puede {action} un servicio: cancele la reserva y pida otro horario.; PreconditionFailedException: El horario propuesto es el que ya tiene la solicitud; PreconditionFailedException: Transición de estado de cita no permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.proposeSchedule"]:::llamada
  n2 --> n3
  n4["Llama a ProposeScheduleUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a BookingAccess.loadForOperation"]:::llamada
  n5 --> n6
  n7["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.appointment_bookings")]:::efecto
  n7 --> n8
  n9{"!booking"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Cita no encontrada"]):::error
  n9 -->|"sí"| n10
  n11["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE scheduling.schedulable_resources")]:::efecto
  n11 --> n12
  n13{"!isOwnAgenda"}:::decision
  n12 --> n13
  n14(["403 FORBIDDEN Esta cita es de otra agenda: solo la opera quien atiende en ella."]):::error
  n13 -->|"sí"| n14
  n15["Llama a BookingTransitionRecorder.assertPending"]:::llamada
  n13 -->|"no"| n15
  n16{"!PENDING_DECISION_STATES.includes(fromState)"}:::decision
  n15 --> n16
  n17(["422 PRECONDITION_FAILED Sólo se opera así sobre una solicitud pendiente"]):::error
  n16 -->|"sí"| n17
  n18["Llama a ServiceSlotLifecycle.assertNotAService"]:::llamada
  n16 -->|"no"| n18
  n19["Llama a SchedulingBookingsRepository.findSlotById"]:::llamada
  n18 --> n19
  n20[("LEE scheduling.bookable_slots")]:::efecto
  n19 --> n20
  n21{"slot?.practitionerServiceOfferingId"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED Todavía no se puede {action} un servicio: cancele la reserva y pida otro horario."]):::error
  n21 -->|"sí"| n22
  n23{"dto.proposedSlotId === originId"}:::decision
  n21 -->|"no"| n23
  n24(["422 PRECONDITION_FAILED El horario propuesto es el que ya tiene la solicitud"]):::error
  n23 -->|"sí"| n24
  n25["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n23 -->|"no"| n25
  n26[("LEE scheduling.bookable_slots")]:::efecto
  n25 --> n26
  n27{"!target"}:::decision
  n26 --> n27
  n28(["404 NOT_FOUND Cupo propuesto no encontrado"]):::error
  n27 -->|"sí"| n28
  n29{"target.remainingCapacity ‹= 0"}:::decision
  n27 -->|"no"| n29
  n30(["409 CONFLICT El cupo propuesto no tiene lugar"]):::error
  n29 -->|"sí"| n30
  n31["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n29 -->|"no"| n31
  n32[("LEE scheduling.bookable_slots")]:::efecto
  n31 --> n32
  n33{"originBooking"}:::decision
  n32 --> n33
  n34[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n33 -->|"sí"| n34
  n35{"originBooking.statusConceptId !== CONCEPTS.SLOT_BLOCKED"}:::decision
  n34 --> n35
  n36[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n35 -->|"sí"| n36
  n37[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n36 --> n37
  n35 -->|"no"| n37
  n33 -->|"no"| n37
  n38{"target.remainingCapacity === 0"}:::decision
  n37 --> n38
  n39[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n38 -->|"sí"| n39
  n40[("ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n39 --> n40
  n38 -->|"no"| n40
  n41{"fromState !== SCHED.BOOKING_PENDING_CONFIRMATION"}:::decision
  n40 --> n41
  n42["Llama a BookingTransitionRecorder.assertTransition"]:::llamada
  n41 -->|"sí"| n42
  n43{"!isValidBookingTransition(from, to)"}:::decision
  n42 --> n43
  n44(["422 PRECONDITION_FAILED Transición de estado de cita no permitida"]):::error
  n43 -->|"sí"| n44
  n45[("ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n43 -->|"no"| n45
  n46["Llama a SchedulingBookingsRepository.recordReschedule"]:::llamada
  n45 --> n46
  n41 -->|"no"| n46
  n47[("CREA scheduling.booking_reschedules")]:::efecto
  n46 --> n47
  n48["Llama a BookingTransitionRecorder.recordTransition"]:::llamada
  n47 --> n48
  n49["Llama a AuditBookingHistoryAdapter.append"]:::llamada
  n48 --> n49
  n50[("LEE audit.appointment_bookings_history · ACTUALIZA audit.appointment_bookings_history · CREA audit.appointmen…")]:::efecto
  n49 --> n50
  n51(("200 Responde con éxito")):::ok
  n50 --> n51
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. POST /scheduling/bookings/{id}/reject

Rechazar la solicitud de cita

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 409 | `CONFLICT` | ConflictException: La cita ya está cancelada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Transición de estado de cita no permitida; PreconditionFailedException: Puede cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no puede asistir, comuníquese con el consultorio. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.reject"]:::llamada
  n2 --> n3
  n4["Llama a RejectBookingUseCase.execute"]:::llamada
  n3 --> n4
  n5["Llama a CancelBookingUseCase.execute"]:::llamada
  n4 --> n5
  n6["Transacción: transactional(…)"]:::transaccion
  n5 --> n6
  n7["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.appointment_bookings")]:::efecto
  n7 --> n8
  n9{"!booking"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Cita no encontrada"]):::error
  n9 -->|"sí"| n10
  n11{"booking.statusConceptId === CONCEPTS.BOOKING_CANCELLED"}:::decision
  n9 -->|"no"| n11
  n12(["409 CONFLICT La cita ya está cancelada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a BookingTransitionRecorder.assertTransition"]:::llamada
  n11 -->|"no"| n13
  n14{"!isValidBookingTransition(from, to)"}:::decision
  n13 --> n14
  n15(["422 PRECONDITION_FAILED Transición de estado de cita no permitida"]):::error
  n14 -->|"sí"| n15
  n16{"feeSource === undefined && !snapshot && booking.bookingPolicyId"}:::decision
  n14 -->|"no"| n16
  n17["Llama a SchedulingCatalogRepository.findPolicyById"]:::llamada
  n16 -->|"sí"| n17
  n18[("LEE scheduling.booking_policies")]:::efecto
  n17 --> n18
  n19["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n18 --> n19
  n16 -->|"no"| n19
  n20[("LEE scheduling.bookable_slots")]:::efecto
  n19 --> n20
  n21{"blocksHolderCancellation(isHolderPatient, withinWindow, isNoShow)"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED Puede cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no…"]):::error
  n21 -->|"sí"| n22
  n23["Llama a SchedulingBookingsRepository.createCancellation"]:::llamada
  n21 -->|"no"| n23
  n24[("CREA scheduling.booking_cancellations")]:::efecto
  n23 --> n24
  n25[("ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n24 --> n25
  n26{"slot"}:::decision
  n25 --> n26
  n27[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n26 -->|"sí"| n27
  n28{"slot.scheduleTemplateId === undefined || slot.scheduleTemplateId === null"}:::decision
  n27 --> n28
  n29["Llama a ServiceSlotLifecycle.discardOneOffSlot"]:::llamada
  n28 -->|"sí"| n29
  n30[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n29 --> n30
  n31{"slot.statusConceptId !== CONCEPTS.SLOT_BLOCKED"}:::decision
  n28 -->|"no"| n31
  n32[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n31 -->|"sí"| n32
  n33(("200 Responde con éxito")):::ok
  n30 --> n33
  n32 --> n33
  n31 -->|"no"| n33
  n26 -->|"no"| n33
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. POST /scheduling/bookings/{id}/reminders

Programar recordatorios para la cita

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingWaitlistService.scheduleReminders"]:::llamada
  n2 --> n3
  n4["Llama a RoutedPersistenceSession.transaction"]:::llamada
  n3 --> n4
  n5["Llama a PostgresTransactionManager.execute"]:::llamada
  n4 --> n5
  n6{"!(connection instanceof PostgresDataConnection)"}:::decision
  n5 --> n6
  n7(["↩ (relanza el error capturado)"]):::error
  n6 -->|"sí"| n7
  n8["Intenta"]:::intento
  n6 -->|"no"| n8
  n9(["↩ (relanza el error capturado)"]):::error
  n8 -->|"si falla"| n9
  n10["Transacción: transaction(…)"]:::transaccion
  n8 --> n10
  n11["Llama a PostgresWaitlistAdapter.findBookingScheduleForUpdate"]:::llamada
  n10 --> n11
  n12["Transacción: write(…)"]:::transaccion
  n11 --> n12
  n13["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n12 --> n13
  n14[("LEE scheduling.appointment_bookings")]:::efecto
  n13 --> n14
  n15["Llama a SchedulingBookingsRepository.findSlotById"]:::llamada
  n14 --> n15
  n16[("LEE scheduling.bookable_slots")]:::efecto
  n15 --> n16
  n17{"!schedule"}:::decision
  n16 --> n17
  n18(["404 NOT_FOUND Cita no encontrada"]):::error
  n17 -->|"sí"| n18
  n19["Llama a PostgresWaitlistAdapter.scheduleReminders"]:::llamada
  n17 -->|"no"| n19
  n20["Transacción: write(…)"]:::transaccion
  n19 --> n20
  n21["Repite: por cada const offset de input.offsetsMinutes"]:::bucle
  n20 --> n21
  n22["Llama a SchedulingBookingsRepository.createReminder"]:::llamada
  n21 -->|"cada elemento"| n22
  n23[("CREA scheduling.appointment_reminders")]:::efecto
  n22 --> n23
  n24(("201 Responde con éxito")):::ok
  n23 --> n24
  n21 -->|"al terminar"| n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 16. POST /scheduling/bookings/{id}/request-info

Pedir documentación u orden médica antes de aceptar

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se opera así sobre una solicitud pendiente; PreconditionFailedException: Transición de estado de cita no permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.requestInfo"]:::llamada
  n2 --> n3
  n4["Llama a RequestBookingInfoUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a BookingAccess.loadForOperation"]:::llamada
  n5 --> n6
  n7["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.appointment_bookings")]:::efecto
  n7 --> n8
  n9{"!booking"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Cita no encontrada"]):::error
  n9 -->|"sí"| n10
  n11["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE scheduling.schedulable_resources")]:::efecto
  n11 --> n12
  n13{"!isOwnAgenda"}:::decision
  n12 --> n13
  n14(["403 FORBIDDEN Esta cita es de otra agenda: solo la opera quien atiende en ella."]):::error
  n13 -->|"sí"| n14
  n15["Llama a BookingTransitionRecorder.assertPending"]:::llamada
  n13 -->|"no"| n15
  n16{"!PENDING_DECISION_STATES.includes(fromState)"}:::decision
  n15 --> n16
  n17(["422 PRECONDITION_FAILED Sólo se opera así sobre una solicitud pendiente"]):::error
  n16 -->|"sí"| n17
  n18{"fromState !== SCHED.BOOKING_PENDING_CONFIRMATION"}:::decision
  n16 -->|"no"| n18
  n19["Llama a BookingTransitionRecorder.assertTransition"]:::llamada
  n18 -->|"sí"| n19
  n20{"!isValidBookingTransition(from, to)"}:::decision
  n19 --> n20
  n21(["422 PRECONDITION_FAILED Transición de estado de cita no permitida"]):::error
  n20 -->|"sí"| n21
  n22[("ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n20 -->|"no"| n22
  n23["Llama a BookingTransitionRecorder.recordTransition"]:::llamada
  n22 --> n23
  n18 -->|"no"| n23
  n24["Llama a AuditBookingHistoryAdapter.append"]:::llamada
  n23 --> n24
  n25[("LEE audit.appointment_bookings_history · ACTUALIZA audit.appointment_bookings_history · CREA audit.appointmen…")]:::efecto
  n24 --> n25
  n26(("200 Responde con éxito")):::ok
  n25 --> n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 17. POST /scheduling/bookings/{id}/reschedule

Reprogramar la cita a otro slot

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada; ResourceNotFoundException: Slot destino no encontrado |
| 409 | `CONFLICT` | ConflictException: El slot destino no tiene cupos |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se reprograma una cita vigente; PreconditionFailedException: Todavía no se puede {action} un servicio: cancele la reserva y pida otro horario.; PreconditionFailedException: El slot destino es el mismo que el actual; PreconditionFailedException: El paciente ya tiene una cita confirmada a esa hora{clash.resourceName ? ` en «${…}.; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.reschedule"]:::llamada
  n2 --> n3
  n4["Llama a RescheduleBookingUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.appointment_bookings")]:::efecto
  n6 --> n7
  n8{"!booking"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Cita no encontrada"]):::error
  n8 -->|"sí"| n9
  n10{"!ACTIVE_BOOKING_STATES.includes(booking.statusConceptId)"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED Solo se reprograma una cita vigente"]):::error
  n10 -->|"sí"| n11
  n12["Llama a ServiceSlotLifecycle.assertNotAService"]:::llamada
  n10 -->|"no"| n12
  n13["Llama a SchedulingBookingsRepository.findSlotById"]:::llamada
  n12 --> n13
  n14[("LEE scheduling.bookable_slots")]:::efecto
  n13 --> n14
  n15{"slot?.practitionerServiceOfferingId"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED Todavía no se puede {action} un servicio: cancele la reserva y pida otro horario."]):::error
  n15 -->|"sí"| n16
  n17{"fromSlotId === dto.toSlotId"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED El slot destino es el mismo que el actual"]):::error
  n17 -->|"sí"| n18
  n19["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE scheduling.bookable_slots")]:::efecto
  n19 --> n20
  n21{"!target"}:::decision
  n20 --> n21
  n22(["404 NOT_FOUND Slot destino no encontrado"]):::error
  n21 -->|"sí"| n22
  n23{"target.remainingCapacity ‹= 0"}:::decision
  n21 -->|"no"| n23
  n24(["409 CONFLICT El slot destino no tiene cupos"]):::error
  n23 -->|"sí"| n24
  n25["Llama a SchedulingBookingsRepository.findPatientBookingsOverlapping"]:::llamada
  n23 -->|"no"| n25
  n26[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n25 --> n26
  n27{"patientClash.length › 0"}:::decision
  n26 --> n27
  n28(["422 PRECONDITION_FAILED El paciente ya tiene una cita confirmada a esa hora{clash.resourceName ? ` en «${…}."]):::error
  n27 -->|"sí"| n28
  n29["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n27 -->|"no"| n29
  n30[("LEE scheduling.schedulable_resources")]:::efecto
  n29 --> n30
  n31{"targetResource && PRACTITIONER_PROFILE_TABLES.includes(targetResource.resourceRefType)"}:::decision
  n30 --> n31
  n32["Llama a SchedulingProfessionalTimeService.assertRangeFree"]:::llamada
  n31 -->|"sí"| n32
  n33{"first.kind === 'ocupado'"}:::decision
  n32 --> n33
  n34{"first.patientProfileId"}:::decision
  n33 -->|"no"| n34
  n35["Llama a SchedulingBookingsRepository.findPatientNames"]:::llamada
  n34 -->|"sí"| n35
  n36[("LEE profiles.patient_profiles · LEE profiles.persons")]:::efecto
  n35 --> n36
  n37(["422 PRECONDITION_FAILED El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first…"]):::error
  n33 -->|"sí"| n37
  n36 --> n37
  n34 -->|"no"| n37
  n38["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n31 -->|"no"| n38
  n39[("LEE scheduling.bookable_slots")]:::efecto
  n38 --> n39
  n40{"origin"}:::decision
  n39 --> n40
  n41[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n40 -->|"sí"| n41
  n42{"origin.statusConceptId !== CONCEPTS.SLOT_BLOCKED"}:::decision
  n41 --> n42
  n43[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n42 -->|"sí"| n43
  n44[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n43 --> n44
  n42 -->|"no"| n44
  n40 -->|"no"| n44
  n45{"target.remainingCapacity === 0"}:::decision
  n44 --> n45
  n46[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n45 -->|"sí"| n46
  n47[("ACTUALIZA scheduling.appointment_bookings · ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n46 --> n47
  n45 -->|"no"| n47
  n48["Llama a SchedulingBookingsRepository.recordReschedule"]:::llamada
  n47 --> n48
  n49[("CREA scheduling.booking_reschedules")]:::efecto
  n48 --> n49
  n50["Llama a AuditBookingHistoryAdapter.append"]:::llamada
  n49 --> n50
  n51["Llama a HistoryRepository.append"]:::llamada
  n50 --> n51
  n52{"!binding"}:::decision
  n51 --> n52
  n53(["500 INTERNAL Entidad de historial no registrada: {entity}"]):::error
  n52 -->|"sí"| n53
  n54[("LEE audit.appointment_bookings_history · ACTUALIZA audit.appointment_bookings_history · CREA audit.appointmen…")]:::efecto
  n52 -->|"no"| n54
  n55["Llama a BookingChangeNotifier.notifyChange"]:::llamada
  n54 --> n55
  n56["Llama a SchedulingNoticeRepository.describeBooking"]:::llamada
  n55 --> n56
  n57[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n56 --> n57
  n58["Llama a SchedulingNoticeRepository.findResourceAccount"]:::llamada
  n57 --> n58
  n59[("LEE scheduling.schedulable_resources")]:::efecto
  n58 --> n59
  n60(("200 Responde con éxito")):::ok
  n59 --> n60
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 18. POST /scheduling/bookings/{id}/start

Iniciar la atención

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Transición de estado de cita no permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.start"]:::llamada
  n2 --> n3
  n4["Llama a StartAppointmentUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a BookingAccess.loadForOperation"]:::llamada
  n5 --> n6
  n7["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.appointment_bookings")]:::efecto
  n7 --> n8
  n9{"!booking"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Cita no encontrada"]):::error
  n9 -->|"sí"| n10
  n11["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE scheduling.schedulable_resources")]:::efecto
  n11 --> n12
  n13{"!isOwnAgenda"}:::decision
  n12 --> n13
  n14(["403 FORBIDDEN Esta cita es de otra agenda: solo la opera quien atiende en ella."]):::error
  n13 -->|"sí"| n14
  n15["Llama a BookingTransitionRecorder.assertTransition"]:::llamada
  n13 -->|"no"| n15
  n16{"!isValidBookingTransition(from, to)"}:::decision
  n15 --> n16
  n17(["422 PRECONDITION_FAILED Transición de estado de cita no permitida"]):::error
  n16 -->|"sí"| n17
  n18[("ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n16 -->|"no"| n18
  n19["Llama a ClinicalAppointmentSync.syncClinicalAppointment"]:::llamada
  n18 --> n19
  n20["Llama a ClinicalAppointmentsAdapter.updateStatus"]:::llamada
  n19 --> n20
  n21[("ACTUALIZA clinical.appointments")]:::efecto
  n20 --> n21
  n22["Llama a BookingTransitionRecorder.recordTransition"]:::llamada
  n21 --> n22
  n23["Llama a AuditBookingHistoryAdapter.append"]:::llamada
  n22 --> n23
  n24[("LEE audit.appointment_bookings_history · ACTUALIZA audit.appointment_bookings_history · CREA audit.appointmen…")]:::efecto
  n23 --> n24
  n25(("200 Responde con éxito")):::ok
  n24 --> n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 19. POST /scheduling/confirmation-rules/{id}/activate

Reactivar una regla desactivada

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Regla no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingConfirmationService.activateRule"]:::llamada
  n2 --> n3
  n4["Llama a SchedulingConfirmationService.setEnabled"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SchedulingConfirmationRepository.findRuleByIdForUpdate"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.booking_confirmation_rules")]:::efecto
  n6 --> n7
  n8{"!rule"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Regla no encontrada"]):::error
  n8 -->|"sí"| n9
  n10[("ACTUALIZA scheduling.booking_confirmation_rules · ACTUALIZA scheduling.booking_confirmation_rules")]:::efecto
  n8 -->|"no"| n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 20. POST /scheduling/confirmation-rules/{id}/deactivate

Desactivar una regla (sin borrado duro)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Regla no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingConfirmationService.deactivateRule"]:::llamada
  n2 --> n3
  n4["Llama a SchedulingConfirmationService.setEnabled"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SchedulingConfirmationRepository.findRuleByIdForUpdate"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.booking_confirmation_rules")]:::efecto
  n6 --> n7
  n8{"!rule"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Regla no encontrada"]):::error
  n8 -->|"sí"| n9
  n10[("ACTUALIZA scheduling.booking_confirmation_rules · ACTUALIZA scheduling.booking_confirmation_rules")]:::efecto
  n8 -->|"no"| n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 21. DELETE /scheduling/exceptions/{id}

Eliminar una excepción de disponibilidad

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Excepción no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.removeException"]:::llamada
  n2 --> n3
  n4["Llama a RemoveExceptionUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SchedulingCatalogRepository.findExceptionById"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.availability_exceptions")]:::efecto
  n6 --> n7
  n8{"!exception"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Excepción no encontrada"]):::error
  n8 -->|"sí"| n9
  n10["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n8 -->|"no"| n10
  n11[("LEE scheduling.schedulable_resources")]:::efecto
  n10 --> n11
  n12["Llama a CatalogAccess.assertActorResource"]:::llamada
  n11 --> n12
  n13{"!isOwnAgenda"}:::decision
  n12 --> n13
  n14(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n13 -->|"sí"| n14
  n15{"resource"}:::decision
  n13 -->|"no"| n15
  n16["Llama a CatalogAccess.assertActorResource"]:::llamada
  n15 -->|"sí"| n16
  n17{"!isOwnAgenda"}:::decision
  n16 --> n17
  n18(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n17 -->|"sí"| n18
  n19["Llama a SchedulingCatalogRepository.removeException"]:::llamada
  n17 -->|"no"| n19
  n15 -->|"no"| n19
  n20[("BORRA scheduling.availability_exceptions")]:::efecto
  n19 --> n20
  n21(("204 Responde con éxito")):::ok
  n20 --> n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 22. PATCH /scheduling/exceptions/{id}

Editar una excepción de disponibilidad

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Excepción no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El bloqueo termina antes de empezar; PreconditionFailedException: Eligió «Otro» como motivo: escriba cuál es |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.updateException"]:::llamada
  n2 --> n3
  n4["Llama a UpdateExceptionUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SchedulingCatalogRepository.findExceptionById"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.availability_exceptions")]:::efecto
  n6 --> n7
  n8{"!exception"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Excepción no encontrada"]):::error
  n8 -->|"sí"| n9
  n10["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n8 -->|"no"| n10
  n11[("LEE scheduling.schedulable_resources")]:::efecto
  n10 --> n11
  n12["Llama a CatalogAccess.assertActorResource"]:::llamada
  n11 --> n12
  n13{"!isOwnAgenda"}:::decision
  n12 --> n13
  n14(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n13 -->|"sí"| n14
  n15{"resource"}:::decision
  n13 -->|"no"| n15
  n16["Llama a CatalogAccess.assertActorResource"]:::llamada
  n15 -->|"sí"| n16
  n17{"!isOwnAgenda"}:::decision
  n16 --> n17
  n18(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n17 -->|"sí"| n18
  n19{"endAt !== undefined && endAt !== null && startAt ›= endAt"}:::decision
  n17 -->|"no"| n19
  n15 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED El bloqueo termina antes de empezar"]):::error
  n19 -->|"sí"| n20
  n21{"finalType === REASON_REQUIRING_TEXT && (finalText === undefined || finalText.trim() === '')"}:::decision
  n19 -->|"no"| n21
  n22(["422 PRECONDITION_FAILED Eligió «Otro» como motivo: escriba cuál es"]):::error
  n21 -->|"sí"| n22
  n23{"finalType !== undefined"}:::decision
  n21 -->|"no"| n23
  n24[("ACTUALIZA scheduling.availability_exceptions")]:::efecto
  n23 -->|"sí"| n24
  n25[("ACTUALIZA scheduling.availability_exceptions")]:::efecto
  n24 --> n25
  n23 -->|"no"| n25
  n26{"dto.reason !== undefined"}:::decision
  n25 --> n26
  n27[("ACTUALIZA scheduling.availability_exceptions")]:::efecto
  n26 -->|"sí"| n27
  n28[("ACTUALIZA scheduling.availability_exceptions · ACTUALIZA scheduling.availability_exceptions")]:::efecto
  n27 --> n28
  n26 -->|"no"| n28
  n29{"endAt !== undefined && endAt !== null"}:::decision
  n28 --> n29
  n30[("ACTUALIZA scheduling.availability_exceptions")]:::efecto
  n29 -->|"sí"| n30
  n31{"grew && exception.isAvailable !== true"}:::decision
  n30 --> n31
  n29 -->|"no"| n31
  n32["Llama a SchedulingCatalogRepository.findOpenSlotsInWindow"]:::llamada
  n31 -->|"sí"| n32
  n33[("LEE scheduling.bookable_slots")]:::efecto
  n32 --> n33
  n34["Repite: por cada const slot de reached"]:::bucle
  n33 --> n34
  n35{"slot.statusConceptId === CONCEPTS.SLOT_OPEN && untouched"}:::decision
  n34 -->|"cada elemento"| n35
  n36[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n35 -->|"sí"| n36
  n37(("200 Responde con éxito")):::ok
  n36 --> n37
  n35 -->|"no"| n37
  n34 -->|"al terminar"| n37
  n31 -->|"no"| n37
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 23. POST /scheduling/holds/{holdToken}/confirm

Confirmar la cita a partir de la reserva temporal

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reserva temporal no encontrada; ResourceNotFoundException: Slot no encontrado |
| 409 | `CONFLICT` | ConflictException: La reserva temporal ya fue consumida o liberada; ConflictException: La reserva temporal expiró |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese horario ya pasó.; PreconditionFailedException: Ya tiene una cita confirmada ese día a esa hora{clash.resourceName ? ` en «${…}. Cancélelo primero si quiere cambiarlo por éste.; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.confirmBooking"]:::llamada
  n2 --> n3
  n4["Llama a ConfirmBookingUseCase.execute"]:::llamada
  n3 --> n4
  n5["Llama a BookingMaterializer.materializeBooking"]:::llamada
  n4 --> n5
  n6["Transacción: transactional(…)"]:::transaccion
  n5 --> n6
  n7["Llama a SchedulingBookingsRepository.findHoldByTokenForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.slot_holds")]:::efecto
  n7 --> n8
  n9{"!hold"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Reserva temporal no encontrada"]):::error
  n9 -->|"sí"| n10
  n11{"hold.statusConceptId !== CONCEPTS.HOLD_ACTIVE"}:::decision
  n9 -->|"no"| n11
  n12(["409 CONFLICT La reserva temporal ya fue consumida o liberada"]):::error
  n11 -->|"sí"| n12
  n13{"hold.expiresAt.getTime() ‹= Date.now()"}:::decision
  n11 -->|"no"| n13
  n14(["409 CONFLICT La reserva temporal expiró"]):::error
  n13 -->|"sí"| n14
  n15["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE scheduling.bookable_slots")]:::efecto
  n15 --> n16
  n17{"!slot"}:::decision
  n16 --> n17
  n18(["404 NOT_FOUND Slot no encontrado"]):::error
  n17 -->|"sí"| n18
  n19{"slot.startAt.getTime() ‹= Date.now()"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED Ese horario ya pasó."]):::error
  n19 -->|"sí"| n20
  n21["Llama a SchedulingBookingsRepository.findPatientBookingsOverlapping"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n21 --> n22
  n23{"alreadyCommitted.length › 0"}:::decision
  n22 --> n23
  n24(["422 PRECONDITION_FAILED Ya tiene una cita confirmada ese día a esa hora{clash.resourceName ? ` en «${…}. Canc…"]):::error
  n23 -->|"sí"| n24
  n25["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n23 -->|"no"| n25
  n26[("LEE scheduling.schedulable_resources")]:::efecto
  n25 --> n26
  n27{"resource && PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n26 --> n27
  n28["Llama a SchedulingProfessionalTimeService.assertRangeFree"]:::llamada
  n27 -->|"sí"| n28
  n29(["422 PRECONDITION_FAILED El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first…"]):::error
  n28 --> n29
  n30["Llama a SchedulingBookingsRepository.createBooking"]:::llamada
  n27 -->|"no"| n30
  n31[("CREA scheduling.appointment_bookings")]:::efecto
  n30 --> n31
  n32[("ACTUALIZA scheduling.slot_holds")]:::efecto
  n31 --> n32
  n33{"slot.remainingCapacity === 0"}:::decision
  n32 --> n33
  n34[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n33 -->|"sí"| n34
  n35["Repite: por cada const offset de offsets"]:::bucle
  n34 --> n35
  n33 -->|"no"| n35
  n36["Llama a SchedulingBookingsRepository.createReminder"]:::llamada
  n35 -->|"cada elemento"| n36
  n37[("CREA scheduling.appointment_reminders")]:::efecto
  n36 --> n37
  n38(("201 Responde con éxito")):::ok
  n37 --> n38
  n35 -->|"al terminar"| n38
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 24. POST /scheduling/holds/{holdToken}/request

Solicitar la cita a partir de la reserva temporal

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reserva temporal no encontrada; ResourceNotFoundException: Slot no encontrado |
| 409 | `CONFLICT` | ConflictException: La reserva temporal ya fue consumida o liberada; ConflictException: La reserva temporal expiró |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese horario ya pasó.; PreconditionFailedException: Ya tiene una cita confirmada ese día a esa hora{clash.resourceName ? ` en «${…}. Cancélelo primero si quiere cambiarlo por éste.; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.requestBooking"]:::llamada
  n2 --> n3
  n4["Llama a RequestBookingUseCase.execute"]:::llamada
  n3 --> n4
  n5["Llama a BookingMaterializer.materializeBooking"]:::llamada
  n4 --> n5
  n6["Transacción: transactional(…)"]:::transaccion
  n5 --> n6
  n7["Llama a SchedulingBookingsRepository.findHoldByTokenForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.slot_holds")]:::efecto
  n7 --> n8
  n9{"!hold"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Reserva temporal no encontrada"]):::error
  n9 -->|"sí"| n10
  n11{"hold.statusConceptId !== CONCEPTS.HOLD_ACTIVE"}:::decision
  n9 -->|"no"| n11
  n12(["409 CONFLICT La reserva temporal ya fue consumida o liberada"]):::error
  n11 -->|"sí"| n12
  n13{"hold.expiresAt.getTime() ‹= Date.now()"}:::decision
  n11 -->|"no"| n13
  n14(["409 CONFLICT La reserva temporal expiró"]):::error
  n13 -->|"sí"| n14
  n15["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE scheduling.bookable_slots")]:::efecto
  n15 --> n16
  n17{"!slot"}:::decision
  n16 --> n17
  n18(["404 NOT_FOUND Slot no encontrado"]):::error
  n17 -->|"sí"| n18
  n19{"slot.startAt.getTime() ‹= Date.now()"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED Ese horario ya pasó."]):::error
  n19 -->|"sí"| n20
  n21["Llama a SchedulingBookingsRepository.findPatientBookingsOverlapping"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n21 --> n22
  n23{"alreadyCommitted.length › 0"}:::decision
  n22 --> n23
  n24(["422 PRECONDITION_FAILED Ya tiene una cita confirmada ese día a esa hora{clash.resourceName ? ` en «${…}. Canc…"]):::error
  n23 -->|"sí"| n24
  n25["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n23 -->|"no"| n25
  n26[("LEE scheduling.schedulable_resources")]:::efecto
  n25 --> n26
  n27{"resource && PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n26 --> n27
  n28["Llama a SchedulingProfessionalTimeService.assertRangeFree"]:::llamada
  n27 -->|"sí"| n28
  n29(["422 PRECONDITION_FAILED El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first…"]):::error
  n28 --> n29
  n30["Llama a SchedulingBookingsRepository.createBooking"]:::llamada
  n27 -->|"no"| n30
  n31[("CREA scheduling.appointment_bookings")]:::efecto
  n30 --> n31
  n32[("ACTUALIZA scheduling.slot_holds")]:::efecto
  n31 --> n32
  n33{"slot.remainingCapacity === 0"}:::decision
  n32 --> n33
  n34[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n33 -->|"sí"| n34
  n35["Repite: por cada const offset de offsets"]:::bucle
  n34 --> n35
  n33 -->|"no"| n35
  n36["Llama a SchedulingBookingsRepository.createReminder"]:::llamada
  n35 -->|"cada elemento"| n36
  n37[("CREA scheduling.appointment_reminders")]:::efecto
  n36 --> n37
  n38["Llama a BookingChangeNotifier.notifyRequest"]:::llamada
  n37 --> n38
  n35 -->|"al terminar"| n38
  n39["Llama a SchedulingNoticeRepository.describeBooking"]:::llamada
  n38 --> n39
  n40[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n39 --> n40
  n41["Llama a SchedulingNoticeRepository.findResourceAccount"]:::llamada
  n40 --> n41
  n42[("LEE scheduling.schedulable_resources")]:::efecto
  n41 --> n42
  n43{"practitioner === null"}:::decision
  n42 --> n43
  n44["Llama a SchedulingNoticeRepository.findDisplayNameForProfile"]:::llamada
  n43 -->|"no"| n44
  n45[("LEE profiles.persons")]:::efecto
  n44 --> n45
  n46(("201 Responde con éxito")):::ok
  n43 -->|"sí"| n46
  n45 --> n46
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 25. POST /scheduling/internal/dispatch-reminders

Despachar los recordatorios cuya hora ya llegó

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingWaitlistService.dispatchReminders"]:::llamada
  n2 --> n3
  n4["Llama a RoutedPersistenceSession.transaction"]:::llamada
  n3 --> n4
  n5["Llama a PostgresTransactionManager.execute"]:::llamada
  n4 --> n5
  n6{"!(connection instanceof PostgresDataConnection)"}:::decision
  n5 --> n6
  n7(["↩ (relanza el error capturado)"]):::error
  n6 -->|"sí"| n7
  n8["Intenta"]:::intento
  n6 -->|"no"| n8
  n9(["↩ (relanza el error capturado)"]):::error
  n8 -->|"si falla"| n9
  n10["Transacción: transaction(…)"]:::transaccion
  n8 --> n10
  n11["Llama a PostgresWaitlistAdapter.findDueReminders"]:::llamada
  n10 --> n11
  n12["Transacción: write(…)"]:::transaccion
  n11 --> n12
  n13["Llama a SchedulingBookingsRepository.findDueReminders"]:::llamada
  n12 --> n13
  n14[("LEE scheduling.appointment_reminders")]:::efecto
  n13 --> n14
  n15["Llama a PostgresWaitlistAdapter.markRemindersSent"]:::llamada
  n14 --> n15
  n16["Transacción: write(…)"]:::transaccion
  n15 --> n16
  n17[("LEE scheduling.appointment_reminders")]:::efecto
  n16 --> n17
  n18["Repite: por cada const reminder de reminders"]:::bucle
  n17 --> n18
  n19[("ACTUALIZA scheduling.appointment_reminders · ACTUALIZA scheduling.appointment_reminders")]:::efecto
  n18 -->|"cada elemento"| n19
  n20["Llama a SchedulingAgendaNoticesService.notifyReminders"]:::llamada
  n19 --> n20
  n18 -->|"al terminar"| n20
  n21["Llama a SchedulingNoticeRepository.findBookingIdsForReminders"]:::llamada
  n20 --> n21
  n22[("LEE scheduling.appointment_reminders")]:::efecto
  n21 --> n22
  n23["Repite: por cada const reminder de reminders"]:::bucle
  n22 --> n23
  n24["Llama a SchedulingNoticeRepository.describeBooking"]:::llamada
  n23 -->|"cada elemento"| n24
  n25[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n24 --> n25
  n26["Llama a SchedulingNoticeRepository.describeResource"]:::llamada
  n25 --> n26
  n27[("LEE scheduling.schedulable_resources")]:::efecto
  n26 --> n27
  n28["Llama a SchedulingNoticeRepository.describeSite"]:::llamada
  n27 --> n28
  n29[("LEE scheduling.schedulable_resources · LEE practice.practices")]:::efecto
  n28 --> n29
  n30(("200 Responde con éxito")):::ok
  n29 --> n30
  n23 -->|"al terminar"| n30
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 26. POST /scheduling/internal/expire-holds

Liberar las reservas temporales vencidas

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.expireHolds"]:::llamada
  n2 --> n3
  n4["Llama a ExpireHoldsUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SchedulingBookingsRepository.findExpiredHolds"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.slot_holds")]:::efecto
  n6 --> n7
  n8["Repite: por cada const hold de expired"]:::bucle
  n7 --> n8
  n9[("ACTUALIZA scheduling.slot_holds · ACTUALIZA scheduling.slot_holds")]:::efecto
  n8 -->|"cada elemento"| n9
  n10["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n9 --> n10
  n11[("LEE scheduling.bookable_slots")]:::efecto
  n10 --> n11
  n12[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n11 --> n12
  n13{"slot.practitionerServiceOfferingId"}:::decision
  n12 --> n13
  n14["Llama a ServiceSlotLifecycle.discardOneOffSlot"]:::llamada
  n13 -->|"sí"| n14
  n15[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n14 --> n15
  n16{"slot.statusConceptId === CONCEPTS.SLOT_HELD"}:::decision
  n15 --> n16
  n13 -->|"no"| n16
  n17[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n16 -->|"sí"| n17
  n18(("200 Responde con éxito")):::ok
  n17 --> n18
  n16 -->|"no"| n18
  n8 -->|"al terminar"| n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 27. POST /scheduling/internal/promote-waitlist/{slotId}

Promover candidatos de la lista de espera a un slot con cupo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Slot no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingWaitlistService.promoteWaitlist"]:::llamada
  n2 --> n3
  n4["Llama a RoutedPersistenceSession.transaction"]:::llamada
  n3 --> n4
  n5["Llama a PostgresTransactionManager.execute"]:::llamada
  n4 --> n5
  n6{"!(connection instanceof PostgresDataConnection)"}:::decision
  n5 --> n6
  n7(["↩ (relanza el error capturado)"]):::error
  n6 -->|"sí"| n7
  n8["Intenta"]:::intento
  n6 -->|"no"| n8
  n9(["↩ (relanza el error capturado)"]):::error
  n8 -->|"si falla"| n9
  n10["Transacción: transaction(…)"]:::transaccion
  n8 --> n10
  n11["Llama a PostgresWaitlistAdapter.findSlotCapacity"]:::llamada
  n10 --> n11
  n12["Transacción: write(…)"]:::transaccion
  n11 --> n12
  n13["Llama a SchedulingBookingsRepository.findSlotById"]:::llamada
  n12 --> n13
  n14[("LEE scheduling.bookable_slots")]:::efecto
  n13 --> n14
  n15{"!slot"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Slot no encontrado"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PostgresWaitlistAdapter.findActiveCandidates"]:::llamada
  n15 -->|"no"| n17
  n18["Transacción: write(…)"]:::transaccion
  n17 --> n18
  n19["Llama a SchedulingBookingsRepository.findWaitlistCandidates"]:::llamada
  n18 --> n19
  n20[("LEE scheduling.waitlist_entries")]:::efecto
  n19 --> n20
  n21["Llama a PostgresWaitlistAdapter.markCandidatesFulfilled"]:::llamada
  n20 --> n21
  n22["Transacción: write(…)"]:::transaccion
  n21 --> n22
  n23[("LEE scheduling.waitlist_entries")]:::efecto
  n22 --> n23
  n24["Repite: por cada const row de rows"]:::bucle
  n23 --> n24
  n25[("ACTUALIZA scheduling.waitlist_entries")]:::efecto
  n24 -->|"cada elemento"| n25
  n26["Llama a SchedulingAgendaNoticesService.notifySlotReleased"]:::llamada
  n25 --> n26
  n24 -->|"al terminar"| n26
  n27["Llama a SchedulingNoticeRepository.describeSlot"]:::llamada
  n26 --> n27
  n28[("LEE scheduling.bookable_slots")]:::efecto
  n27 --> n28
  n29["Llama a SchedulingNoticeRepository.describeResource"]:::llamada
  n28 --> n29
  n30[("LEE scheduling.schedulable_resources")]:::efecto
  n29 --> n30
  n31["Llama a SchedulingNoticeRepository.findWaitlistPatients"]:::llamada
  n30 --> n31
  n32[("LEE scheduling.waitlist_entries")]:::efecto
  n31 --> n32
  n33(("200 Responde con éxito")):::ok
  n32 --> n33
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 28. GET /scheduling/resources

Listar los recursos agendables de un tenant

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingAgendaService.listResources"]:::llamada
  n2 --> n3
  n4["Llama a SchedulingAgendaRepository.findResources"]:::llamada
  n3 --> n4
  n5[("LEE scheduling.schedulable_resources")]:::efecto
  n4 --> n5
  n6["Intenta"]:::intento
  n5 --> n6
  n7["Llama a PracticeProfilesDirectoryAdapter.resolveSitesForResources"]:::llamada
  n6 --> n7
  n8["Llama a PractitionerSitesService.resolveSitesForResources"]:::llamada
  n7 --> n8
  n9["Llama a PractitionerRoleAssignmentsRepository.findCurrentWithSite"]:::llamada
  n8 --> n9
  n10[("LEE practice.practitioner_role_assignments")]:::efecto
  n9 --> n10
  n11["Repite: por cada const spaceId de spaceIds"]:::bucle
  n10 --> n11
  n12["Llama a CareSpacesRepository.findById"]:::llamada
  n11 -->|"cada elemento"| n12
  n13[("LEE practice.care_spaces")]:::efecto
  n12 --> n13
  n14(("200 Responde con éxito")):::ok
  n13 --> n14
  n11 -->|"al terminar"| n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 29. POST /scheduling/resources

Dar de alta un recurso agendable

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Un profesional solo puede publicar su propia agenda: el recurso debe apuntar a su perfil profesional.; ForbiddenException: El tenant indicado no es uno de los del actor. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Su vínculo con esta organización todavía está pendiente de aprobación. Cuando la acepten va a poder publicar su agenda acá. / Su vínculo con esta organización… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.createResource"]:::llamada
  n2 --> n3
  n4["Llama a CreateResourceUseCase.execute"]:::llamada
  n3 --> n4
  n5["Llama a CatalogAccess.assertMayCreateResource"]:::llamada
  n4 --> n5
  n6{"!isOwnProfile"}:::decision
  n5 --> n6
  n7(["403 FORBIDDEN Un profesional solo puede publicar su propia agenda: el recurso debe apuntar a su perfil profes…"]):::error
  n6 -->|"sí"| n7
  n8["Llama a CatalogAccess.assertActorTenant"]:::llamada
  n6 -->|"no"| n8
  n9{"!actor.tenantIds?.includes(tenantId)"}:::decision
  n8 --> n9
  n10(["403 FORBIDDEN El tenant indicado no es uno de los del actor."]):::error
  n9 -->|"sí"| n10
  n11["Llama a CatalogAccess.assertAffiliationWithOrganization"]:::llamada
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED Su vínculo con esta organización todavía está pendiente de aprobación. Cuando la acep…"]):::error
  n11 --> n12
  n13["Transacción: transactional(…)"]:::transaccion
  n14["Llama a SchedulingCatalogRepository.createResource"]:::llamada
  n13 --> n14
  n15[("CREA scheduling.schedulable_resources")]:::efecto
  n14 --> n15
  n16(("201 Responde con éxito")):::ok
  n15 --> n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 30. POST /scheduling/resources/{id}/close-slots

Cerrar cupos sueltos, dejando el bloqueo que impide regenerarlos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado; ResourceNotFoundException: Ninguno de esos cupos es de esta agenda |
| 409 | `CONFLICT` | ConflictException: Esos ratos tienen pacientes citados: cancele cada cita antes de cerrarlos |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Eligió «Otro» como motivo: escriba cuál es |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.closeSlots"]:::llamada
  n2 --> n3
  n4["Llama a CloseSlotsUseCase.execute"]:::llamada
  n3 --> n4
  n5{"dto.exceptionType === REASON_REQUIRING_TEXT && (dto.reason === undefined || dto.reason.trim() === '')"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED Eligió «Otro» como motivo: escriba cuál es"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n7 --> n8
  n9[("LEE scheduling.schedulable_resources")]:::efecto
  n8 --> n9
  n10{"!resource"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Recurso no encontrado"]):::error
  n10 -->|"sí"| n11
  n12["Llama a CatalogAccess.assertActorResource"]:::llamada
  n10 -->|"no"| n12
  n13{"!isOwnAgenda"}:::decision
  n12 --> n13
  n14(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n13 -->|"sí"| n14
  n15["Llama a SchedulingCatalogRepository.findSlotsOfResourceForUpdate"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE scheduling.bookable_slots")]:::efecto
  n15 --> n16
  n17{"slots.length === 0"}:::decision
  n16 --> n17
  n18(["404 NOT_FOUND Ninguno de esos cupos es de esta agenda"]):::error
  n17 -->|"sí"| n18
  n19["Llama a SchedulingCatalogRepository.findBookingsOfSlots"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE scheduling.appointment_bookings")]:::efecto
  n19 --> n20
  n21{"withPatient.length › 0"}:::decision
  n20 --> n21
  n22(["409 CONFLICT Esos ratos tienen pacientes citados: cancele cada cita antes de cerrarlos"]):::error
  n21 -->|"sí"| n22
  n23["Repite: por cada const slot de slots"]:::bucle
  n21 -->|"no"| n23
  n24[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n23 -->|"cada elemento"| n24
  n25["Llama a SchedulingCatalogRepository.createException"]:::llamada
  n24 --> n25
  n23 -->|"al terminar"| n25
  n26[("CREA scheduling.availability_exceptions")]:::efecto
  n25 --> n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 31. POST /scheduling/resources/{id}/delay

Informar una demora que alcanza a toda la agenda del recurso

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: sólo avisa su demora quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una demora mayor a cuatro horas se resuelve reprogramando la cita, no avisando; PreconditionFailedException: La ventana de la demora termina antes de empezar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingDelayService.delayResource"]:::llamada
  n2 --> n3
  n4["Llama a SchedulingDelayService.assertMinutes"]:::llamada
  n3 --> n4
  n5{"minutes › MAX_DELAY_MINUTES"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED Una demora mayor a cuatro horas se resuelve reprogramando la cita, no avisando"]):::error
  n5 -->|"sí"| n6
  n7["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n5 -->|"no"| n7
  n8[("LEE scheduling.schedulable_resources")]:::efecto
  n7 --> n8
  n9{"!resource"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Recurso no encontrado"]):::error
  n9 -->|"sí"| n10
  n11["Llama a SchedulingDelayService.assertOperatesAgenda"]:::llamada
  n9 -->|"no"| n11
  n12["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n11 --> n12
  n13[("LEE scheduling.schedulable_resources")]:::efecto
  n12 --> n13
  n14{"!isOwnAgenda"}:::decision
  n13 --> n14
  n15(["403 FORBIDDEN Esta agenda es de otro profesional: sólo avisa su demora quien atiende en ella."]):::error
  n14 -->|"sí"| n15
  n16{"to.getTime() ‹ from.getTime()"}:::decision
  n14 -->|"no"| n16
  n17(["422 PRECONDITION_FAILED La ventana de la demora termina antes de empezar"]):::error
  n16 -->|"sí"| n17
  n18["Llama a SchedulingNoticeRepository.findAffectedBookings"]:::llamada
  n16 -->|"no"| n18
  n19[("LEE scheduling.bookable_slots · LEE scheduling.appointment_bookings")]:::efecto
  n18 --> n19
  n20["Llama a SchedulingNoticeRepository.describeResource"]:::llamada
  n19 --> n20
  n21[("LEE scheduling.schedulable_resources")]:::efecto
  n20 --> n21
  n22{"PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n21 --> n22
  n23["Llama a SchedulingNoticeRepository.findDisplayNameForProfile"]:::llamada
  n22 -->|"sí"| n23
  n24[("LEE profiles.persons")]:::efecto
  n23 --> n24
  n25["Repite: por cada const booking de affected"]:::bucle
  n24 --> n25
  n22 -->|"no"| n25
  n26["Llama a SchedulingDelayService.recordDelay"]:::llamada
  n25 -->|"cada elemento"| n26
  n27["Transacción: transactional(…)"]:::transaccion
  n26 --> n27
  n28["Llama a AuditBookingHistoryAdapter.append"]:::llamada
  n27 --> n28
  n29["Llama a HistoryRepository.append"]:::llamada
  n28 --> n29
  n30{"!binding"}:::decision
  n29 --> n30
  n31(["500 INTERNAL Entidad de historial no registrada: {entity}"]):::error
  n30 -->|"sí"| n31
  n32[("LEE audit.appointment_bookings_history · ACTUALIZA audit.appointment_bookings_history · CREA audit.appointmen…")]:::efecto
  n30 -->|"no"| n32
  n33(("200 Responde con éxito")):::ok
  n32 --> n33
  n25 -->|"al terminar"| n33
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 32. GET /scheduling/resources/{id}/exceptions

Listar las excepciones de disponibilidad de un recurso

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella.; ForbiddenException: No puede ver los bloqueos de esta agenda |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana debe empezar antes de terminar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.listExceptions"]:::llamada
  n2 --> n3
  n4["Llama a ListExceptionsUseCase.execute"]:::llamada
  n3 --> n4
  n5{"!(from ‹ to)"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED La ventana debe empezar antes de terminar"]):::error
  n5 -->|"sí"| n6
  n7["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n5 -->|"no"| n7
  n8[("LEE scheduling.schedulable_resources")]:::efecto
  n7 --> n8
  n9{"!resource"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Recurso no encontrado"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CatalogAccess.mayAdministerResource"]:::llamada
  n9 -->|"no"| n11
  n12["Intenta"]:::intento
  n11 --> n12
  n13["Llama a CatalogAccess.assertActorResource"]:::llamada
  n12 --> n13
  n14{"!isOwnAgenda"}:::decision
  n13 --> n14
  n15(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n14 -->|"sí"| n15
  n16{"!mayRead && actor.patientProfileId !== undefined"}:::decision
  n14 -->|"no"| n16
  n17["Llama a SchedulingCatalogRepository.patientHasBookingWithResource"]:::llamada
  n16 -->|"sí"| n17
  n18[("LEE scheduling.appointment_bookings")]:::efecto
  n17 --> n18
  n19{"!mayRead"}:::decision
  n18 --> n19
  n16 -->|"no"| n19
  n20(["403 FORBIDDEN No puede ver los bloqueos de esta agenda"]):::error
  n19 -->|"sí"| n20
  n21["Llama a SchedulingCatalogRepository.findExceptionsByResourceInRange"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE scheduling.availability_exceptions")]:::efecto
  n21 --> n22
  n23(("200 Responde con éxito")):::ok
  n22 --> n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 33. POST /scheduling/resources/{id}/exceptions

Registrar una excepción de disponibilidad

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Eligió «Otro» como motivo: escriba cuál es; PreconditionFailedException: La excepción debe empezar antes de terminar; PreconditionFailedException: Tiene una cita confirmada en ese rato{first.resourceName ? ` en «${…}. Reprográmela primero o elija otro horario. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.createException"]:::llamada
  n2 --> n3
  n4["Llama a CreateExceptionUseCase.execute"]:::llamada
  n3 --> n4
  n5{"dto.exceptionType === REASON_REQUIRING_TEXT && (dto.reason === undefined || dto.reason.trim() === '')"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED Eligió «Otro» como motivo: escriba cuál es"]):::error
  n5 -->|"sí"| n6
  n7{"startAt ›= endAt"}:::decision
  n5 -->|"no"| n7
  n8(["422 PRECONDITION_FAILED La excepción debe empezar antes de terminar"]):::error
  n7 -->|"sí"| n8
  n9["Transacción: transactional(…)"]:::transaccion
  n7 -->|"no"| n9
  n10["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n9 --> n10
  n11[("LEE scheduling.schedulable_resources")]:::efecto
  n10 --> n11
  n12{"!resource"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Recurso no encontrado"]):::error
  n12 -->|"sí"| n13
  n14{"!isAvailable && PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n12 -->|"no"| n14
  n15["Llama a SchedulingProfessionalTimeService.confirmedBookings"]:::llamada
  n14 -->|"sí"| n15
  n16["Llama a SchedulingBookingsRepository.findProfessionalCommitmentsOverlapping"]:::llamada
  n15 --> n16
  n17[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n16 --> n17
  n18{"confirmed.length › 0"}:::decision
  n17 --> n18
  n19(["422 PRECONDITION_FAILED Tiene una cita confirmada en ese rato{first.resourceName ? ` en «${…}. Reprográmela p…"]):::error
  n18 -->|"sí"| n19
  n20["Llama a SchedulingCatalogRepository.createException"]:::llamada
  n18 -->|"no"| n20
  n14 -->|"no"| n20
  n21[("CREA scheduling.availability_exceptions")]:::efecto
  n20 --> n21
  n22{"!isAvailable"}:::decision
  n21 --> n22
  n23["Llama a SchedulingCatalogRepository.findOpenSlotsInWindow"]:::llamada
  n22 -->|"sí"| n23
  n24[("LEE scheduling.bookable_slots")]:::efecto
  n23 --> n24
  n25["Repite: por cada const slot de overlapping"]:::bucle
  n24 --> n25
  n26{"slot.statusConceptId === CONCEPTS.SLOT_OPEN && untouched"}:::decision
  n25 -->|"cada elemento"| n26
  n27[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n26 -->|"sí"| n27
  n28(("201 Responde con éxito")):::ok
  n27 --> n28
  n26 -->|"no"| n28
  n25 -->|"al terminar"| n28
  n22 -->|"no"| n28
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 34. POST /scheduling/resources/{id}/shift-slots

Correr los cupos de una agenda N minutos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana termina antes de empezar; PreconditionFailedException: Mover cero minutos no cambia nada: elija cuánto correr la agenda |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.shiftSlots"]:::llamada
  n2 --> n3
  n4["Llama a ShiftSlotsUseCase.execute"]:::llamada
  n3 --> n4
  n5{"from ›= to"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED La ventana termina antes de empezar"]):::error
  n5 -->|"sí"| n6
  n7{"dto.shiftMinutes === 0"}:::decision
  n5 -->|"no"| n7
  n8(["422 PRECONDITION_FAILED Mover cero minutos no cambia nada: elija cuánto correr la agenda"]):::error
  n7 -->|"sí"| n8
  n9["Transacción: transactional(…)"]:::transaccion
  n7 -->|"no"| n9
  n10["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n9 --> n10
  n11[("LEE scheduling.schedulable_resources")]:::efecto
  n10 --> n11
  n12{"!resource"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Recurso no encontrado"]):::error
  n12 -->|"sí"| n13
  n14["Llama a CatalogAccess.assertActorResource"]:::llamada
  n12 -->|"no"| n14
  n15{"!isOwnAgenda"}:::decision
  n14 --> n15
  n16(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n15 -->|"sí"| n16
  n17["Llama a SchedulingCatalogRepository.findSlotsOfResourceForUpdate"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE scheduling.bookable_slots")]:::efecto
  n17 --> n18
  n19["Repite: por cada const slot de slots"]:::bucle
  n18 --> n19
  n20[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n19 -->|"cada elemento"| n20
  n21{"slot.endAt !== undefined && slot.endAt !== null"}:::decision
  n20 --> n21
  n22[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n21 -->|"sí"| n22
  n23["Llama a SlotMoveNotifier.notifyOfMove"]:::llamada
  n22 --> n23
  n21 -->|"no"| n23
  n19 -->|"al terminar"| n23
  n24["Llama a SchedulingCatalogRepository.findBookingsOfSlots"]:::llamada
  n23 --> n24
  n25[("LEE scheduling.appointment_bookings")]:::efecto
  n24 --> n25
  n26["Repite: por cada const booking de bookings"]:::bucle
  n25 --> n26
  n27["Intenta"]:::intento
  n26 -->|"cada elemento"| n27
  n28["Llama a SchedulingNoticeRepository.describeBooking"]:::llamada
  n27 --> n28
  n29[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n28 --> n29
  n30["Llama a SchedulingNoticeRepository.findAccountForProfile"]:::llamada
  n29 --> n30
  n31[("LEE profiles.person_account_links")]:::efecto
  n30 --> n31
  n32(("200 Responde con éxito")):::ok
  n31 --> n32
  n26 -->|"al terminar"| n32
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 35. GET /scheduling/resources/{id}/slots

UC-41-14: agenda publicada del recurso en una ventana

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique la ventana con from y to (ISO 8601); PreconditionFailedException: La ventana debe empezar antes de terminar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3{"!from || !to"}:::decision
  n2 --> n3
  n4(["422 PRECONDITION_FAILED Indique la ventana con from y to (ISO 8601)"]):::error
  n3 -->|"sí"| n4
  n5["Llama a SchedulingCatalogService.getResourceAgenda"]:::llamada
  n3 -->|"no"| n5
  n6["Llama a GetResourceAgendaUseCase.execute"]:::llamada
  n5 --> n6
  n7{"!(options.from ‹ options.to)"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED La ventana debe empezar antes de terminar"]):::error
  n7 -->|"sí"| n8
  n9["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE scheduling.schedulable_resources")]:::efecto
  n9 --> n10
  n11{"!resource"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Recurso no encontrado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a SchedulingCatalogRepository.findSlotsByResourceInRange"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE scheduling.bookable_slots")]:::efecto
  n13 --> n14
  n15(("200 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 36. GET /scheduling/resources/{id}/templates

Listar las plantillas de agenda de un recurso

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.listTemplates"]:::llamada
  n2 --> n3
  n4["Llama a ListTemplatesUseCase.execute"]:::llamada
  n3 --> n4
  n5["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n4 --> n5
  n6[("LEE scheduling.schedulable_resources")]:::efecto
  n5 --> n6
  n7{"!resource"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Recurso no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CatalogAccess.assertActorResource"]:::llamada
  n7 -->|"no"| n9
  n10{"!isOwnAgenda"}:::decision
  n9 --> n10
  n11(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n10 -->|"sí"| n11
  n12["Llama a SchedulingCatalogRepository.findTemplatesByResource"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE scheduling.schedule_templates")]:::efecto
  n12 --> n13
  n14["Llama a SchedulingCatalogRepository.findRulesByTemplates"]:::llamada
  n13 --> n14
  n15[("LEE scheduling.schedule_rules")]:::efecto
  n14 --> n15
  n16(("200 Responde con éxito")):::ok
  n15 --> n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 37. POST /scheduling/resources/{id}/templates

Publicar una plantilla de agenda con sus franjas

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La franja debe empezar antes de terminar; PreconditionFailedException: Dos franjas de esta agenda se solapan entre sí; PreconditionFailedException: Ya tiene «{other.resourceName}» el {existing.label}, que se cruza con estehorario. Cambie el horario o el día, o edite esa otra agenda. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.createTemplate"]:::llamada
  n2 --> n3
  n4["Llama a CreateTemplateUseCase.execute"]:::llamada
  n3 --> n4
  n5["Repite: por cada const rule de dto.rules"]:::bucle
  n4 --> n5
  n6{"rule.startTime ›= rule.endTime"}:::decision
  n5 -->|"cada elemento"| n6
  n7(["422 PRECONDITION_FAILED La franja debe empezar antes de terminar"]):::error
  n6 -->|"sí"| n7
  n8["Transacción: transactional(…)"]:::transaccion
  n6 -->|"no"| n8
  n5 -->|"al terminar"| n8
  n9["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n8 --> n9
  n10[("LEE scheduling.schedulable_resources")]:::efecto
  n9 --> n10
  n11{"!resource"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Recurso no encontrado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a CatalogAccess.assertActorResource"]:::llamada
  n11 -->|"no"| n13
  n14{"!isOwnAgenda"}:::decision
  n13 --> n14
  n15(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n14 -->|"sí"| n15
  n16["Llama a AgendaOverlapGuard.assertNoOverlapWithOtherAgendas"]:::llamada
  n14 -->|"no"| n16
  n17["Repite: ciclo for"]:::bucle
  n16 --> n17
  n18["Repite: ciclo for"]:::bucle
  n17 -->|"cada elemento"| n18
  n19{"overlap(newOnes[i], newOnes[j])"}:::decision
  n18 -->|"cada elemento"| n19
  n20(["422 PRECONDITION_FAILED Dos franjas de esta agenda se solapan entre sí"]):::error
  n19 -->|"sí"| n20
  n21["Llama a SchedulingCatalogRepository.findRulesByResourceOwner"]:::llamada
  n19 -->|"no"| n21
  n18 -->|"al terminar"| n21
  n17 -->|"al terminar"| n21
  n22[("LEE scheduling.schedulable_resources · LEE scheduling.schedule_templates · LEE scheduling.schedule_rules")]:::efecto
  n21 --> n22
  n23["Repite: por cada const other de foreignOnes"]:::bucle
  n22 --> n23
  n24{"clash"}:::decision
  n23 -->|"cada elemento"| n24
  n25(["422 PRECONDITION_FAILED Ya tiene «{other.resourceName}» el {existing.label}, que se cruza con estehorario. Ca…"]):::error
  n24 -->|"sí"| n25
  n26["Llama a SchedulingCatalogRepository.createTemplate"]:::llamada
  n24 -->|"no"| n26
  n23 -->|"al terminar"| n26
  n27[("CREA scheduling.schedule_templates")]:::efecto
  n26 --> n27
  n28["Repite: por cada const rule de dto.rules"]:::bucle
  n27 --> n28
  n29["Llama a SchedulingCatalogRepository.createRule"]:::llamada
  n28 -->|"cada elemento"| n29
  n30[("CREA scheduling.schedule_rules")]:::efecto
  n29 --> n30
  n31(("201 Responde con éxito")):::ok
  n30 --> n31
  n28 -->|"al terminar"| n31
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 38. GET /scheduling/resources/{resourceId}/waitlist

Listar quiénes esperan turno en una agenda

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: sólo ve quién la espera quien atiende en ella. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingWaitlistService.listForResource"]:::llamada
  n2 --> n3
  n4["Llama a SchedulingWaitlistService.assertOperatesAgenda"]:::llamada
  n3 --> n4
  n5["Llama a PostgresWaitlistAdapter.findResourcePractitioner"]:::llamada
  n4 --> n5
  n6["Llama a SchedulingNoticeRepository.findResourcePractitionerProfileId"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.schedulable_resources")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN Esta agenda es de otro profesional: sólo ve quién la espera quien atiende en ella."]):::error
  n7 --> n8
  n9["Llama a PostgresWaitlistAdapter.findEntriesForResource"]:::llamada
  n10["Llama a SchedulingNoticeRepository.findWaitlistByResource"]:::llamada
  n9 --> n10
  n11[("LEE scheduling.waitlist_entries · LEE profiles.persons")]:::efecto
  n10 --> n11
  n12["Llama a SchedulingNoticeRepository.describeResource"]:::llamada
  n11 --> n12
  n13[("LEE scheduling.schedulable_resources")]:::efecto
  n12 --> n13
  n14(("200 Responde con éxito")):::ok
  n13 --> n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 39. GET /scheduling/service-availability

Horarios donde cabe un servicio

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana debe empezar antes de terminar.; PreconditionFailedException: Se pueden mirar hasta {MAX_QUERY_DAYS} días de una vez. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingServiceBookingService.availability"]:::llamada
  n2 --> n3
  n4{"!(to.getTime() › from.getTime())"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED La ventana debe empezar antes de terminar."]):::error
  n4 -->|"sí"| n5
  n6{"to.getTime() - from.getTime() › MAX_QUERY_DAYS * MS_PER_DAY"}:::decision
  n4 -->|"no"| n6
  n7(["422 PRECONDITION_FAILED Se pueden mirar hasta {MAX_QUERY_DAYS} días de una vez."]):::error
  n6 -->|"sí"| n7
  n8["Transacción: transactional(…)"]:::transaccion
  n6 -->|"no"| n8
  n9["Llama a SchedulingServiceBookingService.visibleOffering"]:::llamada
  n8 --> n9
  n10["Llama a SchedulingOfferingsRepository.findOfferingById"]:::llamada
  n9 --> n10
  n11[("LEE scheduling.practitioner_service_offerings")]:::efecto
  n10 --> n11
  n12{"offering === null"}:::decision
  n11 --> n12
  n13(["↩ (relanza el error capturado)"]):::error
  n12 -->|"sí"| n13
  n14{"offering.statusConceptId !== SCHED.OFFERING_ACTIVE || !offering.isPatientBookable"}:::decision
  n12 -->|"no"| n14
  n15(["↩ (relanza el error capturado)"]):::error
  n14 -->|"sí"| n15
  n16["Llama a SchedulingOfferingsRepository.findCatalogItem"]:::llamada
  n14 -->|"no"| n16
  n17[("LEE billing.service_catalog")]:::efecto
  n16 --> n17
  n18{"catalog === null || !catalog.isActive"}:::decision
  n17 --> n18
  n19(["↩ (relanza el error capturado)"]):::error
  n18 -->|"sí"| n19
  n20["Llama a SchedulingOfferingsRepository.findResourcesOfProfessional"]:::llamada
  n18 -->|"no"| n20
  n21[("LEE scheduling.schedulable_resources")]:::efecto
  n20 --> n21
  n22["Llama a SchedulingServiceAgendaService.bandsOfServices"]:::llamada
  n21 --> n22
  n23["Llama a SchedulingCatalogRepository.findRulesByResourceOwner"]:::llamada
  n22 --> n23
  n24[("LEE scheduling.schedulable_resources · LEE scheduling.schedule_templates · LEE scheduling.schedule_rules")]:::efecto
  n23 --> n24
  n25["Repite: por cada const { rule, resourceId, validTo: vali… de rules"]:::bucle
  n24 --> n25
  n26{"group === undefined"}:::decision
  n25 -->|"cada elemento"| n26
  n27["Llama a SchedulingServiceAgendaService.policyOf"]:::llamada
  n26 -->|"sí"| n27
  n28["Llama a SchedulingCatalogRepository.findTemplateById"]:::llamada
  n27 --> n28
  n29[("LEE scheduling.schedule_templates")]:::efecto
  n28 --> n29
  n30["Llama a SchedulingCatalogRepository.findPolicyById"]:::llamada
  n29 --> n30
  n31[("LEE scheduling.booking_policies")]:::efecto
  n30 --> n31
  n32["Llama a SchedulingServiceAgendaService.practitionerBusyTime"]:::llamada
  n31 --> n32
  n26 -->|"no"| n32
  n25 -->|"al terminar"| n32
  n33["Llama a SchedulingOfferingsRepository.findLiveHoldsOfProfessional"]:::llamada
  n32 --> n33
  n34[("LEE scheduling.slot_holds · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n33 --> n34
  n35["Llama a SchedulingOfferingsRepository.findLiveServiceSlotsOfProfessional"]:::llamada
  n34 --> n35
  n36[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.practitioner_service_of…")]:::efecto
  n35 --> n36
  n37(("200 Responde con éxito")):::ok
  n36 --> n37
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 40. GET /scheduling/service-offerings

Los servicios que ofrece un profesional

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique de qué profesional quiere ver los servicios. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingServiceOfferingsService.list"]:::llamada
  n2 --> n3
  n4{"goal === undefined"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED Indique de qué profesional quiere ver los servicios."]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a SchedulingOfferingsRepository.listOfferings"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.practitioner_service_offerings")]:::efecto
  n7 --> n8
  n9["Llama a SchedulingOfferingsRepository.findCatalogItems"]:::llamada
  n8 --> n9
  n10[("LEE billing.service_catalog")]:::efecto
  n9 --> n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 41. POST /scheduling/service-offerings

Declarar cómo ofrezco un servicio

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo puede crear ofertas para usted.; ForbiddenException: Sólo un profesional ofrece servicios. |
| 409 | `CONFLICT` | ConflictException: Ya ofrece ese servicio. Edite la oferta que ya tiene. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique de qué profesional es la oferta.; PreconditionFailedException: Ese servicio está inactivo en el catálogo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingServiceOfferingsService.create"]:::llamada
  n2 --> n3
  n4["Llama a SchedulingServiceOfferingsService.offeringOwner"]:::llamada
  n3 --> n4
  n5{"requested !== undefined && requested !== own"}:::decision
  n4 --> n5
  n6{"!administers"}:::decision
  n5 -->|"sí"| n6
  n7(["403 FORBIDDEN Sólo puede crear ofertas para usted."]):::error
  n6 -->|"sí"| n7
  n8{"administers"}:::decision
  n6 -->|"no"| n8
  n5 -->|"no"| n8
  n9(["422 PRECONDITION_FAILED Indique de qué profesional es la oferta."]):::error
  n8 -->|"sí"| n9
  n10(["403 FORBIDDEN Sólo un profesional ofrece servicios."]):::error
  n8 -->|"no"| n10
  n11["Transacción: transactional(…)"]:::transaccion
  n12["Llama a SchedulingOfferingsRepository.findCatalogItem"]:::llamada
  n11 --> n12
  n13[("LEE billing.service_catalog")]:::efecto
  n12 --> n13
  n14["Llama a SchedulingServiceOfferingsService.assertServiceReachable"]:::llamada
  n13 --> n14
  n15{"service === null"}:::decision
  n14 --> n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"sí"| n16
  n17{"!ownOnes.includes(service.practiceId)"}:::decision
  n15 -->|"no"| n17
  n18(["↩ (relanza el error capturado)"]):::error
  n17 -->|"sí"| n18
  n19{"service === null || !service.isActive"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED Ese servicio está inactivo en el catálogo."]):::error
  n19 -->|"sí"| n20
  n21["Llama a SchedulingOfferingsRepository.findOfferingOf"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE scheduling.practitioner_service_offerings")]:::efecto
  n21 --> n22
  n23{"existing !== null"}:::decision
  n22 --> n23
  n24(["409 CONFLICT Ya ofrece ese servicio. Edite la oferta que ya tiene."]):::error
  n23 -->|"sí"| n24
  n25["Llama a SchedulingOfferingsRepository.createOffering"]:::llamada
  n23 -->|"no"| n25
  n26[("CREA scheduling.practitioner_service_offerings")]:::efecto
  n25 --> n26
  n27(("201 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 42. PATCH /scheduling/service-offerings/{id}

Editar o apagar la oferta de un servicio

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Oferta no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingServiceOfferingsService.update"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a SchedulingOfferingsRepository.findOfferingById"]:::llamada
  n4 --> n5
  n6[("LEE scheduling.practitioner_service_offerings")]:::efecto
  n5 --> n6
  n7{"offering === null"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Oferta no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a SchedulingServiceOfferingsService.assertIsOwn"]:::llamada
  n7 -->|"no"| n9
  n10(["404 NOT_FOUND Oferta no encontrada"]):::error
  n9 --> n10
  n11[("ACTUALIZA scheduling.practitioner_service_offerings · ACTUALIZA scheduling.practitioner_service_offerings · A…")]:::efecto
  n12{"dto.prepMinutes !== undefined"}:::decision
  n11 --> n12
  n13[("ACTUALIZA scheduling.practitioner_service_offerings")]:::efecto
  n12 -->|"sí"| n13
  n14{"dto.cleanupMinutes !== undefined"}:::decision
  n13 --> n14
  n12 -->|"no"| n14
  n15[("ACTUALIZA scheduling.practitioner_service_offerings")]:::efecto
  n14 -->|"sí"| n15
  n16{"dto.isPatientBookable !== undefined"}:::decision
  n15 --> n16
  n14 -->|"no"| n16
  n17[("ACTUALIZA scheduling.practitioner_service_offerings")]:::efecto
  n16 -->|"sí"| n17
  n18{"dto.requiresApproval !== undefined"}:::decision
  n17 --> n18
  n16 -->|"no"| n18
  n19[("ACTUALIZA scheduling.practitioner_service_offerings")]:::efecto
  n18 -->|"sí"| n19
  n20{"dto.channel !== undefined"}:::decision
  n19 --> n20
  n18 -->|"no"| n20
  n21[("ACTUALIZA scheduling.practitioner_service_offerings")]:::efecto
  n20 -->|"sí"| n21
  n22{"dto.isActive !== undefined"}:::decision
  n21 --> n22
  n20 -->|"no"| n22
  n23[("ACTUALIZA scheduling.practitioner_service_offerings")]:::efecto
  n22 -->|"sí"| n23
  n24["Llama a SchedulingOfferingsRepository.findCatalogItem"]:::llamada
  n23 --> n24
  n22 -->|"no"| n24
  n25[("LEE billing.service_catalog")]:::efecto
  n24 --> n25
  n26(("200 Responde con éxito")):::ok
  n25 --> n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 43. POST /scheduling/service-offerings/{id}/holds

Retener el turno de un servicio

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No cuenta con autorización de tutoría sobre el paciente indicado; ForbiddenException: La agenda indicada pertenece a otra organización. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Agenda no encontrada |
| 409 | `CONFLICT` | ConflictException: Ese horario ya no está disponible para este servicio. Elija otro. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese horario ya pasó.; PreconditionFailedException: Su vínculo con esta organización todavía está pendiente de aprobación. / Su vínculo con esta organización ya no está vigente.; PreconditionFailedException: Esa cita empieza demasiado pronto: hay que pedirla con al menos {group.minNoticeMinutes} minutos de anticipación.; PreconditionFailedException: Sólo se puede pedir con hasta {group.maxAdvanceDays} días de anticipación. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingServiceBookingService.placeHold"]:::llamada
  n2 --> n3
  n4{"dto.patientProfileId !== undefined && this.isPatientActor(actor)"}:::decision
  n3 --> n4
  n5["Llama a ProfilesPatientRepresentationAdapter.assertMayActForPatient"]:::llamada
  n4 -->|"sí"| n5
  n6["Llama a PatientRepresentationService.assertMayActForPatient"]:::llamada
  n5 --> n6
  n7(["403 FORBIDDEN No cuenta con autorización de tutoría sobre el paciente indicado"]):::error
  n6 --> n7
  n8["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n8
  n9["Llama a SchedulingServiceBookingService.visibleOffering"]:::llamada
  n8 --> n9
  n10["Llama a SchedulingOfferingsRepository.findOfferingById"]:::llamada
  n9 --> n10
  n11[("LEE scheduling.practitioner_service_offerings")]:::efecto
  n10 --> n11
  n12{"offering === null"}:::decision
  n11 --> n12
  n13(["↩ (relanza el error capturado)"]):::error
  n12 -->|"sí"| n13
  n14{"offering.statusConceptId !== SCHED.OFFERING_ACTIVE || !offering.isPatientBookable"}:::decision
  n12 -->|"no"| n14
  n15(["↩ (relanza el error capturado)"]):::error
  n14 -->|"sí"| n15
  n16["Llama a SchedulingOfferingsRepository.findCatalogItem"]:::llamada
  n14 -->|"no"| n16
  n17[("LEE billing.service_catalog")]:::efecto
  n16 --> n17
  n18{"catalog === null || !catalog.isActive"}:::decision
  n17 --> n18
  n19(["↩ (relanza el error capturado)"]):::error
  n18 -->|"sí"| n19
  n20["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n18 -->|"no"| n20
  n21[("LEE scheduling.schedulable_resources")]:::efecto
  n20 --> n21
  n22{"site === null || !this.isPractitionerSite(site, offering)"}:::decision
  n21 --> n22
  n23(["404 NOT_FOUND Agenda no encontrada"]):::error
  n22 -->|"sí"| n23
  n24["Llama a SchedulingServiceBookingService.assertSiteInScope"]:::llamada
  n22 -->|"no"| n24
  n25{"!this.siteInScope(site, actor)"}:::decision
  n24 --> n25
  n26(["403 FORBIDDEN La agenda indicada pertenece a otra organización."]):::error
  n25 -->|"sí"| n26
  n27{"startAt.getTime() ‹= now.getTime()"}:::decision
  n25 -->|"no"| n27
  n28(["422 PRECONDITION_FAILED Ese horario ya pasó."]):::error
  n27 -->|"sí"| n28
  n29["Llama a SchedulingServiceBookingService.assertAffiliationCurrent"]:::llamada
  n27 -->|"no"| n29
  n30["Llama a PractitionerAffiliationGateService.evaluate"]:::llamada
  n29 --> n30
  n31["Llama a ProfilesAffiliationsAdapter.findOfPractitioner"]:::llamada
  n30 --> n31
  n32[("LEE profiles.practitioner_affiliations")]:::efecto
  n31 --> n32
  n33["Llama a ProfilesAffiliationsAdapter.tenantsOfSites"]:::llamada
  n32 --> n33
  n34[("LEE practice.practice_sites · LEE practice.practices")]:::efecto
  n33 --> n34
  n35(["422 PRECONDITION_FAILED Su vínculo con esta organización todavía está pendiente de aprobación. / Su vínculo c…"]):::error
  n34 --> n35
  n36["Llama a SchedulingServiceAgendaService.bandsOfServices"]:::llamada
  n37["Llama a SchedulingCatalogRepository.findRulesByResourceOwner"]:::llamada
  n36 --> n37
  n38[("LEE scheduling.schedulable_resources · LEE scheduling.schedule_templates · LEE scheduling.schedule_rules")]:::efecto
  n37 --> n38
  n39["Repite: por cada const { rule, resourceId, validTo: vali… de rules"]:::bucle
  n38 --> n39
  n40{"group === undefined"}:::decision
  n39 -->|"cada elemento"| n40
  n41["Llama a SchedulingServiceAgendaService.policyOf"]:::llamada
  n40 -->|"sí"| n41
  n42["Llama a SchedulingCatalogRepository.findTemplateById"]:::llamada
  n41 --> n42
  n43[("LEE scheduling.schedule_templates")]:::efecto
  n42 --> n43
  n44["Llama a SchedulingCatalogRepository.findPolicyById"]:::llamada
  n43 --> n44
  n45[("LEE scheduling.booking_policies")]:::efecto
  n44 --> n45
  n46["Llama a SchedulingServiceAgendaService.practitionerBusyTime"]:::llamada
  n45 --> n46
  n40 -->|"no"| n46
  n39 -->|"al terminar"| n46
  n47["Llama a SchedulingOfferingsRepository.findLiveHoldsOfProfessional"]:::llamada
  n46 --> n47
  n48[("LEE scheduling.slot_holds · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n47 --> n48
  n49["Llama a SchedulingOfferingsRepository.findLiveServiceSlotsOfProfessional"]:::llamada
  n48 --> n49
  n50[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.practitioner_service_of…")]:::efecto
  n49 --> n50
  n51{"availableGroup === undefined"}:::decision
  n50 --> n51
  n52(["409 CONFLICT Ese horario ya no está disponible para este servicio. Elija otro."]):::error
  n51 -->|"sí"| n52
  n53["Llama a SchedulingServiceBookingService.assertPolicy"]:::llamada
  n51 -->|"no"| n53
  n54{"startAt.getTime() ‹ now.getTime() + group.minNoticeMinutes * MS_PER_MINUTE"}:::decision
  n53 --> n54
  n55(["422 PRECONDITION_FAILED Esa cita empieza demasiado pronto: hay que pedirla con al menos {group.minNoticeMinut…"]):::error
  n54 -->|"sí"| n55
  n56{"group.maxAdvanceDays !== undefined && startAt.getTime() › now.getTime() + group.maxAdvanceDays * MS_PER_DAY"}:::decision
  n54 -->|"no"| n56
  n57(["422 PRECONDITION_FAILED Sólo se puede pedir con hasta {group.maxAdvanceDays} días de anticipación."]):::error
  n56 -->|"sí"| n57
  n58["Llama a SchedulingOfferingsRepository.findCatalogItem"]:::llamada
  n56 -->|"no"| n58
  n59[("LEE billing.service_catalog")]:::efecto
  n58 --> n59
  n60["Llama a SchedulingServiceAgendaService.retract"]:::llamada
  n59 --> n60
  n61["Llama a SchedulingCatalogRepository.findOpenSlotsOfProfessionalInWindow"]:::llamada
  n60 --> n61
  n62[("LEE scheduling.schedulable_resources · LEE scheduling.bookable_slots")]:::efecto
  n61 --> n62
  n63["Repite: por cada const free de freeOnes"]:::bucle
  n62 --> n63
  n64[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n63 -->|"cada elemento"| n64
  n65["Llama a SchedulingCatalogRepository.createSlot"]:::llamada
  n64 --> n65
  n63 -->|"al terminar"| n65
  n66[("CREA scheduling.bookable_slots")]:::efecto
  n65 --> n66
  n67["Llama a SchedulingBookingsRepository.createHold"]:::llamada
  n66 --> n67
  n68[("CREA scheduling.slot_holds")]:::efecto
  n67 --> n68
  n69(("201 Responde con éxito")):::ok
  n68 --> n69
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 44. GET /scheduling/slots

Consultar los cupos de una ventana

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana debe empezar antes de terminar; PreconditionFailedException: La ventana no puede superar {MAX_WINDOW_DAYS} días |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingAgendaService.listSlots"]:::llamada
  n2 --> n3
  n4["Llama a SchedulingAgendaService.assertWindow"]:::llamada
  n3 --> n4
  n5{"from ›= to"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED La ventana debe empezar antes de terminar"]):::error
  n5 -->|"sí"| n6
  n7{"to.getTime() - from.getTime() › MAX_WINDOW_MS"}:::decision
  n5 -->|"no"| n7
  n8(["422 PRECONDITION_FAILED La ventana no puede superar {MAX_WINDOW_DAYS} días"]):::error
  n7 -->|"sí"| n8
  n9["Llama a SchedulingAgendaRepository.findSlots"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE scheduling.bookable_slots")]:::efecto
  n9 --> n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 45. POST /scheduling/slots/{id}/holds

Reservar temporalmente un cupo del slot

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Slot no encontrado |
| 409 | `CONFLICT` | ConflictException: El slot no tiene cupos disponibles; ConflictException: El paciente alcanzó el máximo de citas activas |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El slot está bloqueado; PreconditionFailedException: Ese horario ya no está disponible.; PreconditionFailedException: Ese horario ya pasó. / Esa cita empieza demasiado pronto: hay que pedirla con al menos {noticeMinutes} minutos de anticipación. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingBookingsService.placeHold"]:::llamada
  n2 --> n3
  n4["Llama a PlaceHoldUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.bookable_slots")]:::efecto
  n6 --> n7
  n8{"!slot"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Slot no encontrado"]):::error
  n8 -->|"sí"| n9
  n10{"refusal === 'BLOCKED'"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED El slot está bloqueado"]):::error
  n10 -->|"sí"| n11
  n12{"refusal === 'RETRACTED'"}:::decision
  n10 -->|"no"| n12
  n13(["422 PRECONDITION_FAILED Ese horario ya no está disponible."]):::error
  n12 -->|"sí"| n13
  n14{"refusal === 'NO_CAPACITY'"}:::decision
  n12 -->|"no"| n14
  n15(["409 CONFLICT El slot no tiene cupos disponibles"]):::error
  n14 -->|"sí"| n15
  n16["Llama a SlotPolicyResolver.resolvePolicy"]:::llamada
  n14 -->|"no"| n16
  n17["Llama a SchedulingCatalogRepository.findTemplateById"]:::llamada
  n16 --> n17
  n18[("LEE scheduling.schedule_templates")]:::efecto
  n17 --> n18
  n19["Llama a SchedulingCatalogRepository.findPolicyById"]:::llamada
  n18 --> n19
  n20[("LEE scheduling.booking_policies")]:::efecto
  n19 --> n20
  n21{"timing !== null"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED Ese horario ya pasó. / Esa cita empieza demasiado pronto: hay que pedirla con al meno…"]):::error
  n21 -->|"sí"| n22
  n23{"policy?.maxActivePerPatient && dto.patientProfileId"}:::decision
  n21 -->|"no"| n23
  n24["Llama a SchedulingBookingsRepository.countActiveBookingsForPatient"]:::llamada
  n23 -->|"sí"| n24
  n25[("LEE scheduling.appointment_bookings")]:::efecto
  n24 --> n25
  n26{"active ›= policy.maxActivePerPatient"}:::decision
  n25 --> n26
  n27(["409 CONFLICT El paciente alcanzó el máximo de citas activas"]):::error
  n26 -->|"sí"| n27
  n28["Llama a SchedulingBookingsRepository.createHold"]:::llamada
  n26 -->|"no"| n28
  n23 -->|"no"| n28
  n29[("CREA scheduling.slot_holds")]:::efecto
  n28 --> n29
  n30[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n29 --> n30
  n31{"slot.remainingCapacity === 0"}:::decision
  n30 --> n31
  n32[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n31 -->|"sí"| n32
  n33(("201 Responde con éxito")):::ok
  n32 --> n33
  n31 -->|"no"| n33
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 46. DELETE /scheduling/templates/{id}

Retirar una plantilla de agenda y soltar sus cupos libres

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Recurso de la plantilla no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.retireTemplate"]:::llamada
  n2 --> n3
  n4["Llama a RetireTemplateUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SchedulingCatalogRepository.findTemplateById"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.schedule_templates")]:::efecto
  n6 --> n7
  n8{"!template"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Plantilla no encontrada"]):::error
  n8 -->|"sí"| n9
  n10["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n8 -->|"no"| n10
  n11[("LEE scheduling.schedulable_resources")]:::efecto
  n10 --> n11
  n12{"!resource"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Recurso de la plantilla no encontrado"]):::error
  n12 -->|"sí"| n13
  n14["Llama a CatalogAccess.assertActorResource"]:::llamada
  n12 -->|"no"| n14
  n15{"!isOwnAgenda"}:::decision
  n14 --> n15
  n16(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n15 -->|"sí"| n16
  n17["Llama a SchedulingCatalogRepository.findBookingsOfTemplate"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE scheduling.bookable_slots · LEE scheduling.appointment_bookings · LEE scheduling.appointment_bookings · L…")]:::efecto
  n17 --> n18
  n19["Llama a SchedulingCatalogRepository.retireTemplate"]:::llamada
  n18 --> n19
  n20[("LEE scheduling.bookable_slots")]:::efecto
  n19 --> n20
  n21{"slots.length › 0"}:::decision
  n20 --> n21
  n22[("LEE scheduling.appointment_bookings · LEE scheduling.booking_reschedules")]:::efecto
  n21 -->|"sí"| n22
  n23{"freeOnes.length › 0"}:::decision
  n22 --> n23
  n24[("BORRA scheduling.slot_holds · BORRA scheduling.bookable_slots")]:::efecto
  n23 -->|"sí"| n24
  n25[("LEE scheduling.schedule_templates")]:::efecto
  n24 --> n25
  n23 -->|"no"| n25
  n21 -->|"no"| n25
  n26{"template"}:::decision
  n25 --> n26
  n27[("ACTUALIZA scheduling.schedule_templates")]:::efecto
  n26 -->|"sí"| n27
  n28(("200 Responde con éxito")):::ok
  n27 --> n28
  n26 -->|"no"| n28
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 47. PATCH /scheduling/templates/{id}

Editar una plantilla de agenda ya publicada

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La franja debe empezar antes de terminar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.updateTemplate"]:::llamada
  n2 --> n3
  n4["Llama a UpdateTemplateUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SchedulingCatalogRepository.findTemplateById"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.schedule_templates")]:::efecto
  n6 --> n7
  n8{"!template"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Plantilla no encontrada"]):::error
  n8 -->|"sí"| n9
  n10["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n8 -->|"no"| n10
  n11[("LEE scheduling.schedulable_resources")]:::efecto
  n10 --> n11
  n12{"!resource"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Recurso no encontrado"]):::error
  n12 -->|"sí"| n13
  n14["Llama a CatalogAccess.assertActorResource"]:::llamada
  n12 -->|"no"| n14
  n15{"!isOwnAgenda"}:::decision
  n14 --> n15
  n16(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n15 -->|"sí"| n16
  n17[("ACTUALIZA scheduling.schedule_templates")]:::efecto
  n15 -->|"no"| n17
  n18{"dto.name !== undefined"}:::decision
  n17 --> n18
  n19[("ACTUALIZA scheduling.schedule_templates")]:::efecto
  n18 -->|"sí"| n19
  n20{"dto.slotMinutes !== undefined"}:::decision
  n19 --> n20
  n18 -->|"no"| n20
  n21[("ACTUALIZA scheduling.schedule_templates")]:::efecto
  n20 -->|"sí"| n21
  n22{"dto.bookingPolicyId !== undefined"}:::decision
  n21 --> n22
  n20 -->|"no"| n22
  n23[("ACTUALIZA scheduling.schedule_templates")]:::efecto
  n22 -->|"sí"| n23
  n24{"dto.validFrom !== undefined"}:::decision
  n23 --> n24
  n22 -->|"no"| n24
  n25[("ACTUALIZA scheduling.schedule_templates")]:::efecto
  n24 -->|"sí"| n25
  n26[("ACTUALIZA scheduling.schedule_templates")]:::efecto
  n25 --> n26
  n24 -->|"no"| n26
  n27{"dto.validTo !== undefined"}:::decision
  n26 --> n27
  n28[("ACTUALIZA scheduling.schedule_templates")]:::efecto
  n27 -->|"sí"| n28
  n29["Llama a SchedulingCatalogRepository.findRulesByTemplate"]:::llamada
  n28 --> n29
  n27 -->|"no"| n29
  n30[("LEE scheduling.schedule_rules")]:::efecto
  n29 --> n30
  n31{"dto.rules !== undefined"}:::decision
  n30 --> n31
  n32["Repite: por cada const rule de dto.rules"]:::bucle
  n31 -->|"sí"| n32
  n33{"rule.startTime ›= rule.endTime"}:::decision
  n32 -->|"cada elemento"| n33
  n34(["422 PRECONDITION_FAILED La franja debe empezar antes de terminar"]):::error
  n33 -->|"sí"| n34
  n35["Llama a SchedulingCatalogRepository.deleteRulesByTemplate"]:::llamada
  n33 -->|"no"| n35
  n32 -->|"al terminar"| n35
  n36[("BORRA scheduling.schedule_rules")]:::efecto
  n35 --> n36
  n37["Repite: por cada const rule de dto.rules"]:::bucle
  n36 --> n37
  n38["Llama a SchedulingCatalogRepository.createRule"]:::llamada
  n37 -->|"cada elemento"| n38
  n39[("CREA scheduling.schedule_rules")]:::efecto
  n38 --> n39
  n40(("200 Responde con éxito")):::ok
  n39 --> n40
  n37 -->|"al terminar"| n40
  n31 -->|"no"| n40
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 48. POST /scheduling/templates/{id}/generate-slots

Materializar los slots de la plantilla en una ventana

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana debe empezar antes de terminar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.generateSlots"]:::llamada
  n2 --> n3
  n4["Llama a GenerateSlotsUseCase.execute"]:::llamada
  n3 --> n4
  n5{"from ›= to"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED La ventana debe empezar antes de terminar"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a SchedulingCatalogRepository.findTemplateById"]:::llamada
  n7 --> n8
  n9[("LEE scheduling.schedule_templates")]:::efecto
  n8 --> n9
  n10{"!template"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Plantilla no encontrada"]):::error
  n10 -->|"sí"| n11
  n12["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE scheduling.schedulable_resources")]:::efecto
  n12 --> n13
  n14["Llama a CatalogAccess.assertActorResource"]:::llamada
  n13 --> n14
  n15{"!isOwnAgenda"}:::decision
  n14 --> n15
  n16(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n15 -->|"sí"| n16
  n17{"resource"}:::decision
  n15 -->|"no"| n17
  n18["Llama a CatalogAccess.assertActorResource"]:::llamada
  n17 -->|"sí"| n18
  n19{"!isOwnAgenda"}:::decision
  n18 --> n19
  n20(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n19 -->|"sí"| n20
  n21["Llama a SchedulingCatalogRepository.findRulesByTemplate"]:::llamada
  n19 -->|"no"| n21
  n17 -->|"no"| n21
  n22[("LEE scheduling.schedule_rules")]:::efecto
  n21 --> n22
  n23["Llama a SchedulingCatalogRepository.findSlotsByTemplateInRange"]:::llamada
  n22 --> n23
  n24[("LEE scheduling.bookable_slots")]:::efecto
  n23 --> n24
  n25["Repite: por cada const rule de rules"]:::bucle
  n24 --> n25
  n26["Repite: por cada const day de matchingLocalDays(from, to, rule.dayOfWeek, zone)"]:::bucle
  n25 -->|"cada elemento"| n26
  n27["Repite: ciclo for"]:::bucle
  n26 -->|"cada elemento"| n27
  n28["Llama a SchedulingCatalogRepository.createSlot"]:::llamada
  n27 -->|"cada elemento"| n28
  n29[("CREA scheduling.bookable_slots")]:::efecto
  n28 --> n29
  n30(("201 Responde con éxito")):::ok
  n29 --> n30
  n27 -->|"al terminar"| n30
  n26 -->|"al terminar"| n30
  n25 -->|"al terminar"| n30
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 49. POST /scheduling/templates/{id}/reactivate

Reactivar un horario retirado

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Recurso de la plantilla no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.reactivateTemplate"]:::llamada
  n2 --> n3
  n4["Llama a ReactivateTemplateUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SchedulingCatalogRepository.findTemplateById"]:::llamada
  n5 --> n6
  n7[("LEE scheduling.schedule_templates")]:::efecto
  n6 --> n7
  n8{"!template"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Plantilla no encontrada"]):::error
  n8 -->|"sí"| n9
  n10["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n8 -->|"no"| n10
  n11[("LEE scheduling.schedulable_resources")]:::efecto
  n10 --> n11
  n12{"!resource"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Recurso de la plantilla no encontrado"]):::error
  n12 -->|"sí"| n13
  n14["Llama a CatalogAccess.assertActorResource"]:::llamada
  n12 -->|"no"| n14
  n15{"!isOwnAgenda"}:::decision
  n14 --> n15
  n16(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n15 -->|"sí"| n16
  n17["Llama a SchedulingCatalogRepository.reactivateTemplate"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE scheduling.schedule_templates")]:::efecto
  n17 --> n18
  n19{"template"}:::decision
  n18 --> n19
  n20[("ACTUALIZA scheduling.schedule_templates")]:::efecto
  n19 -->|"sí"| n20
  n21(("200 Responde con éxito")):::ok
  n20 --> n21
  n19 -->|"no"| n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 50. GET /scheduling/waitlist

Listar las entradas de lista de espera de un paciente

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular y el personal de agenda pueden ver esta lista de espera. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingWaitlistService.listForPatient"]:::llamada
  n2 --> n3
  n4["Llama a SchedulingWaitlistService.assertMaySeePatient"]:::llamada
  n3 --> n4
  n5(["403 FORBIDDEN Sólo el titular y el personal de agenda pueden ver esta lista de espera."]):::error
  n4 --> n5
  n6["Llama a PostgresWaitlistAdapter.findEntriesForPatient"]:::llamada
  n7["Llama a SchedulingNoticeRepository.findWaitlistByPatient"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.waitlist_entries")]:::efecto
  n7 --> n8
  n9["Repite: por cada const row de rows"]:::bucle
  n8 --> n9
  n10["Llama a SchedulingNoticeRepository.describeResource"]:::llamada
  n9 -->|"cada elemento"| n10
  n11[("LEE scheduling.schedulable_resources")]:::efecto
  n10 --> n11
  n12(("200 Responde con éxito")):::ok
  n11 --> n12
  n9 -->|"al terminar"| n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 51. POST /scheduling/waitlist

Inscribir a un paciente en la lista de espera

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular y el personal de agenda pueden ver esta lista de espera. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingWaitlistService.enroll"]:::llamada
  n2 --> n3
  n4["Llama a SchedulingWaitlistService.assertMaySeePatient"]:::llamada
  n3 --> n4
  n5(["403 FORBIDDEN Sólo el titular y el personal de agenda pueden ver esta lista de espera."]):::error
  n4 --> n5
  n6["Transacción: transaction(…)"]:::transaccion
  n7["Llama a PostgresWaitlistAdapter.enroll"]:::llamada
  n6 --> n7
  n8["Transacción: write(…)"]:::transaccion
  n7 --> n8
  n9["Llama a SchedulingBookingsRepository.createWaitlistEntry"]:::llamada
  n8 --> n9
  n10[("CREA scheduling.waitlist_entries")]:::efecto
  n9 --> n10
  n11(("201 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 52. GET /tenants/{tenantId}/agenda

La agenda de la organización

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana no es una fecha válida; PreconditionFailedException: La ventana debe empezar antes de terminar; PreconditionFailedException: El rango no puede superar los {MAX_AGENDA_RANGE_DAYS} días |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingTenantAgendaService.list"]:::llamada
  n2 --> n3
  n4["Llama a DirectoryTenantDirectoryAdapter.assertCanRead"]:::llamada
  n3 --> n4
  n5["Llama a TenantAdministrationService.assertCanRead"]:::llamada
  n4 --> n5
  n6(["403 FORBIDDEN Se requiere pertenecer a la organización, o ser administrador de la plataforma"]):::error
  n5 --> n6
  n7{"Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())"}:::decision
  n8(["422 PRECONDITION_FAILED La ventana no es una fecha válida"]):::error
  n7 -->|"sí"| n8
  n9{"from ›= to"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La ventana debe empezar antes de terminar"]):::error
  n9 -->|"sí"| n10
  n11{"to.getTime() - from.getTime() › MAX_AGENDA_RANGE_DAYS * ONE_DAY_MS"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED El rango no puede superar los {MAX_AGENDA_RANGE_DAYS} días"]):::error
  n11 -->|"sí"| n12
  n13["Llama a SchedulingAgendaRepository.findResources"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE scheduling.schedulable_resources")]:::efecto
  n13 --> n14
  n15["Llama a SchedulingBookingsRepository.findTenantAgenda"]:::llamada
  n14 --> n15
  n16[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n15 --> n16
  n17["Llama a SchedulingTenantAgendaService.project"]:::llamada
  n16 --> n17
  n18["Llama a DirectoryTenantDirectoryAdapter.findDisplayNames"]:::llamada
  n17 --> n18
  n19[("LEE profiles.persons")]:::efecto
  n18 --> n19
  n20(("200 Responde con éxito")):::ok
  n19 --> n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

### Operaciones sin decisiones propias

Sólo comprueban el acceso y leen o escriben: no tienen ramas que dibujar. Su detalle está en la ficha de endpoints.

| Operación | Respuestas posibles | Tablas |
|---|---|---|
| GET /scheduling/activity-types | 200, 401, 403, 429 | 0 |
| GET /scheduling/confirmation-rules | 200, 400, 401, 403, 429 | 1 |
| POST /scheduling/confirmation-rules | 201, 400, 401, 403, 429 | 1 |
| POST /scheduling/confirmation-rules/evaluate | 200, 400, 401, 403, 429 | 1 |
| GET /scheduling/exception-types | 200, 401, 403, 429 | 0 |
| GET /scheduling/internal/waitlist-candidates | 200, 401, 403, 429 | 2 |
